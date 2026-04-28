'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { usePosCartStore, type PosMedicine, type PosBatch, type CartItem } from '@/store/posCartStore';
import { calculateSaleItemGst, sumGstLineItems, getGstType } from '@/lib/gst';
import { playSuccessBeep, playErrorBeep } from '@/lib/posBeep';
import {
  saveDraft, loadDraft, clearDraft, draftAge,
  loadHotkeys, type PosHotkey,
} from '@/lib/posDraft';
import { formatCurrency } from '@/lib/utils/format';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import {
  Search, Plus, Minus, Trash2, User, Loader2, X, Package,
  ShoppingCart, Banknote, CreditCard, Wallet, CheckCircle2, AlertCircle,
  Percent, IndianRupee, ScanBarcode, ArrowLeftRight,
  RotateCcw, History, Sparkles, Activity, Keyboard, ChevronRight,
} from 'lucide-react';

import { BatchModal } from './components/BatchModal';
import { QuickAddCustomerModal } from './components/QuickAddCustomerModal';
import { BrandComparisonModal } from './components/BrandComparisonModal';
import { HotkeyManagerModal } from './components/HotkeyManagerModal';
import { SaleCompleteModal, type CompletedSaleData } from './components/SaleCompleteModal';

/* ─── Palette ─── */
const C = {
  bg: '#020617',
  card: '#0B1121',
  cardBorder: 'rgba(255,255,255,0.08)',
  cardSoft: 'rgba(255,255,255,0.02)',
  inputBg: '#111827',
  inputBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc',
  textSoft: '#cbd5e1',
  muted: '#94a3b8',
  mutedDim: '#64748b',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  blue: '#3b82f6',
  violet: '#8b5cf6',
  teal: '#14b8a6',
  orange: '#fb923c',
};

/* ─── Search hit type ─── */
interface SearchHit extends PosMedicine {
  total_stock: number;
  available_batches: number;
  mrp: number | null;
}

interface CustomerLite {
  id: string;
  name: string;
  phone: string | null;
  credit_limit: number;
  outstanding_balance: number;
  state: string | null;
  gstin: string | null;
}

/* ───────────────── Page ───────────────── */
export default function POSPage() {
  const supabase = useMemo(() => createClient(), []);
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  // ── Pharmacy profile (for inter-state GST + UPI QR) ──
  const [pharmacy, setPharmacy] = useState<{ name: string | null; state: string | null; gstin: string | null; upi_id: string | null; address: string | null; city: string | null; pincode: string | null; phone: string | null; license_number: string | null; logo_url: string | null } | null>(null);
  const [enableGst, setEnableGst] = useState(true);

  useEffect(() => {
    if (!pharmacyId) return;
    (async () => {
      const { data } = await supabase
        .from('pharmacies')
        .select('name, state, gstin, upi_id, address, city, pincode, phone, license_number, logo_url')
        .eq('id', pharmacyId)
        .maybeSingle();
      if (data) setPharmacy(data as any);
    })();
  }, [pharmacyId, supabase]);

  /* ─── Cart store ─── */
  const {
    items, addItem, updateItem, removeItem, clearCart, setItems,
    paymentMethod, setPaymentMethod,
    discountType, discountValue, setDiscount, calculatedDiscount,
    customerId, customerName, customerPhone, customerCreditLimit, customerOutstandingBalance,
    customerState, customerGstin, setCustomer,
    notes, setNotes,
    isPrescriptionSale, setPrescriptionSale,
    subtotal, total,
    billGstRate, setBillGstRate, billGstInclusive, setBillGstInclusive,
  } = usePosCartStore();

  const gstType = getGstType(pharmacy?.state, customerState, pharmacy?.gstin, customerGstin);

  // Recalculate GST on existing cart items when settings change
  useEffect(() => {
    const cur = usePosCartStore.getState().items;
    if (cur.length === 0) return;
    const updated = cur.map((it) => {
      const rate = enableGst ? billGstRate : 0;
      const g = calculateSaleItemGst(it.amount, rate, gstType, billGstInclusive);
      return {
        ...it,
        gst_percentage: rate,
        taxable_amount: g.taxableAmount,
        cgst_percentage: g.cgstPercentage,
        sgst_percentage: g.sgstPercentage,
        igst_percentage: g.igstPercentage,
        cgst_amount: g.cgstAmount,
        sgst_amount: g.sgstAmount,
        igst_amount: g.igstAmount,
      };
    });
    const changed = updated.some((u, i) =>
      u.cgst_amount !== cur[i].cgst_amount ||
      u.sgst_amount !== cur[i].sgst_amount ||
      u.igst_amount !== cur[i].igst_amount ||
      u.gst_percentage !== cur[i].gst_percentage,
    );
    if (changed) setItems(updated);
  }, [enableGst, billGstRate, billGstInclusive, gstType, setItems]);

  /* ─── Search ─── */
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close search dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setResults([]);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);



  // Debounced search
  useEffect(() => {
    if (!query.trim() || !pharmacyId) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        // Try with salt_composition (available after migration); fall back without it
        const { data, error } = await supabase
          .from('medicines')
          .select('id, name, generic_name, manufacturer, salt_composition, strength, dosage_form, pack_size, pack_unit, sale_unit_mode, units_per_pack, rack_location, gst_rate, barcode, batches(stock_quantity, mrp)')
          .eq('pharmacy_id', pharmacyId)
          .or(`name.ilike.%${query}%,generic_name.ilike.%${query}%,salt_composition.ilike.%${query}%,barcode.eq.${query}`)
          .limit(15);

        let rawData = data;
        let saltAvailable = true;

        if (error) {
          // salt_composition or gst_rate column doesn't exist yet — fall back
          saltAvailable = false;
          const { data: fallback } = await supabase
            .from('medicines')
            .select('id, name, generic_name, manufacturer, strength, dosage_form, pack_size, pack_unit, sale_unit_mode, units_per_pack, rack_location, barcode, batches(stock_quantity, mrp)')
            .eq('pharmacy_id', pharmacyId)
            .or(`name.ilike.%${query}%,generic_name.ilike.%${query}%,barcode.eq.${query}`)
            .limit(15);
          rawData = fallback as any;
        }


        const hits: SearchHit[] = (rawData || []).map((m: any) => {
          const stock = (m.batches || []).reduce((s: number, b: any) => s + (Number(b.stock_quantity) || 0), 0);
          const minMrp = (m.batches || []).reduce(
            (acc: number | null, b: any) => acc == null ? Number(b.mrp) : Math.min(acc, Number(b.mrp)), null,
          );
          return {
            id: String(m.id), name: m.name, generic_name: m.generic_name,
            manufacturer: m.manufacturer,
            salt_composition: saltAvailable ? (m.salt_composition ?? null) : null,
            strength: m.strength, dosage_form: m.dosage_form,
            pack_size: m.pack_size, pack_unit: m.pack_unit,
            sale_unit_mode: m.sale_unit_mode, units_per_pack: m.units_per_pack,
            rack_location: m.rack_location,
            gst_rate: saltAvailable ? (m.gst_rate ?? 12) : 12,
            barcode: m.barcode,
            total_stock: stock,
            available_batches: (m.batches || []).filter((b: any) => Number(b.stock_quantity) > 0).length,
            mrp: minMrp,

          };
        });
        setResults(hits);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, pharmacyId, supabase]);

  /* ─── Batch modal ─── */
  const [batchModal, setBatchModal] = useState<{ open: boolean; med: PosMedicine | null; batches: PosBatch[]; isChange: boolean }>({ open: false, med: null, batches: [], isChange: false });
  const [changeBatchFor, setChangeBatchFor] = useState<string | null>(null);

  async function fetchFefoBatches(medicineId: string): Promise<PosBatch[]> {
    if (!pharmacyId) return [];

    // Attempt 1: Full modern schema (including selling_price and purchase_price)
    const { data, error } = await supabase
      .from('batches')
      .select('id, batch_number, expiry_date, stock_quantity, mrp, purchase_price, selling_price')
      .eq('pharmacy_id', pharmacyId)
      .eq('medicine_id', medicineId)
      .gt('stock_quantity', 0)
      .order('expiry_date', { ascending: true });

    console.log('[POS DEBUG] fetchFefoBatches attempt1:', { medicineId, data: data?.length, error: error?.message });

    let finalData: any[] | null = data;

    if (error) {
      // Attempt 2: selling_price might be missing, try with just purchase_price
      const { data: fallback1, error: err1 } = await supabase
        .from('batches')
        .select('id, batch_number, expiry_date, stock_quantity, mrp, purchase_price')
        .eq('pharmacy_id', pharmacyId)
        .eq('medicine_id', medicineId)
        .gt('stock_quantity', 0)
        .order('expiry_date', { ascending: true });

      finalData = fallback1;

      if (err1) {
        // Attempt 3: purchase_price might also be missing (legacy schema used purchase_rate)
        // Fall back to the absolute bare minimum columns required for POS cart
        const { data: fallback2, error: err2 } = await supabase
          .from('batches')
          .select('id, batch_number, expiry_date, stock_quantity, mrp')
          .eq('pharmacy_id', pharmacyId)
          .eq('medicine_id', medicineId)
          .gt('stock_quantity', 0)
          .order('expiry_date', { ascending: true });

        finalData = fallback2;

        if (err2) {
          console.error("fetchFefoBatches ultimate fallback failed:", err2);
          return [];
        }
      }
    }

    return (finalData || []).map((b: any) => ({
      id: String(b.id),
      batch_number: b.batch_number,
      expiry_date: b.expiry_date,
      stock_quantity: Number(b.stock_quantity),
      mrp: Number(b.mrp),
      purchase_price: b.purchase_price != null ? Number(b.purchase_price) : null,
      selling_price: b.selling_price != null ? Number(b.selling_price) : null,
    }));
  }

  // Brand comparison modal
  const [compareOpen, setCompareOpen] = useState<PosMedicine | null>(null);

  async function selectMedicine(med: PosMedicine) {
    console.log('[POS DEBUG] selectMedicine called:', { id: med.id, name: med.name });
    setQuery(''); setResults([]);
    const batches = await fetchFefoBatches(med.id);
    console.log('[POS DEBUG] selectMedicine batches result:', { count: batches.length, batches });
    if (batches.length === 0) {
      playErrorBeep();
      console.log('[POS DEBUG] No batches found — showing error');
      if (med.salt_composition) setCompareOpen(med);
      else toast.error(`No stock available for ${med.name}`);
      return;
    }
    commitAddToCart(med, batches[0]);
  }

  function commitAddToCart(med: PosMedicine, batch: PosBatch) {
    const upp = med.units_per_pack ?? 1;
    const isFlexible = med.sale_unit_mode === 'both' && upp > 1;
    const basePrice = batch.selling_price ?? batch.mrp;
    const gstRateToUse = enableGst ? billGstRate : 0;

    if (isFlexible) {
      const stock = batch.stock_quantity;
      let initStrips = 0, initUnits = 0;
      if (stock >= upp) { initStrips = 1; initUnits = 0; }
      else { initStrips = 0; initUnits = Math.min(stock, 1); }
      const rawUnits = initStrips * upp + initUnits;
      const unitPrice = basePrice / upp;
      const initialAmount = initStrips * basePrice + initUnits * unitPrice;
      const g = calculateSaleItemGst(initialAmount, gstRateToUse, gstType, billGstInclusive);
      addItem({
        medicine: med, batch, selling_unit: 'both',
        quantity: rawUnits, effective_qty: rawUnits, mrp: basePrice,
        strip_qty: initStrips, unit_qty: initUnits,
        discount_percentage: 0, gst_percentage: gstRateToUse, amount: initialAmount,
        taxable_amount: g.taxableAmount,
        cgst_percentage: g.cgstPercentage, sgst_percentage: g.sgstPercentage, igst_percentage: g.igstPercentage,
        cgst_amount: g.cgstAmount, sgst_amount: g.sgstAmount, igst_amount: g.igstAmount,
      });
    } else {
      const g = calculateSaleItemGst(basePrice, gstRateToUse, gstType, billGstInclusive);
      addItem({
        medicine: med, batch, selling_unit: 'pack',
        quantity: 1, effective_qty: 1, mrp: basePrice,
        discount_percentage: 0, gst_percentage: gstRateToUse, amount: basePrice,
        taxable_amount: g.taxableAmount,
        cgst_percentage: g.cgstPercentage, sgst_percentage: g.sgstPercentage, igst_percentage: g.igstPercentage,
        cgst_amount: g.cgstAmount, sgst_amount: g.sgstAmount, igst_amount: g.igstAmount,
      });
    }
    playSuccessBeep();
  }

  async function handleChangeBatch(item: CartItem) {
    const batches = await fetchFefoBatches(item.medicine.id);
    if (batches.length <= 1) { toast.error('No other batches available'); return; }
    setChangeBatchFor(item.batch.id);
    setBatchModal({ open: true, med: item.medicine, batches, isChange: true });
  }

  function handleSwapBatch(newBatch: PosBatch) {
    if (!changeBatchFor) return;
    const item = items.find((i) => i.batch.id === changeBatchFor);
    if (!item) return;
    const newPrice = newBatch.selling_price ?? newBatch.mrp;
    const isFlexBoth = item.selling_unit === 'both';
    const upp = item.medicine.units_per_pack ?? 1;
    const gstRateToUse = enableGst ? billGstRate : 0;
    let newAmount: number;
    if (isFlexBoth) {
      const sQ = item.strip_qty ?? 0; const uQ = item.unit_qty ?? 0;
      const unitPrice = newPrice / upp;
      newAmount = sQ * newPrice + uQ * unitPrice;
    } else {
      newAmount = item.quantity * newPrice;
    }
    const g = calculateSaleItemGst(newAmount, gstRateToUse, gstType, billGstInclusive);
    setItems(items.map((i) => i.batch.id === changeBatchFor ? {
      ...i, batch: newBatch, mrp: newPrice, amount: newAmount,
      gst_percentage: gstRateToUse,
      taxable_amount: g.taxableAmount,
      cgst_percentage: g.cgstPercentage, sgst_percentage: g.sgstPercentage, igst_percentage: g.igstPercentage,
      cgst_amount: g.cgstAmount, sgst_amount: g.sgstAmount, igst_amount: g.igstAmount,
    } : i));
    setChangeBatchFor(null);
    setBatchModal({ open: false, med: null, batches: [], isChange: false });
    playSuccessBeep();
    toast.success(`Batch changed to ${newBatch.batch_number}`);
  }

  /* ─── Qty updates ─── */
  function updateQty(batchId: string, delta: number) {
    const item = items.find((i) => i.batch.id === batchId && i.selling_unit !== 'both');
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    const upp = item.medicine.units_per_pack ?? 1;
    const rawNeeded = item.selling_unit === 'pack' ? newQty * upp : newQty;
    if (rawNeeded > item.batch.stock_quantity) { toast.error('Not enough stock'); return; }
    const rate = enableGst ? billGstRate : 0;
    const newAmount = newQty * item.mrp;
    const g = calculateSaleItemGst(newAmount, rate, gstType, billGstInclusive);
    updateItem(batchId, {
      quantity: newQty, effective_qty: newQty, amount: newAmount,
      gst_percentage: rate,
      taxable_amount: g.taxableAmount,
      cgst_amount: g.cgstAmount, sgst_amount: g.sgstAmount, igst_amount: g.igstAmount,
    });
  }

  function updateFlexQty(batchId: string, type: 'strip' | 'unit', delta: number) {
    const item = items.find((i) => i.batch.id === batchId && i.selling_unit === 'both');
    if (!item) return;
    const upp = item.medicine.units_per_pack ?? 1;
    const stripPrice = item.mrp;
    const unitPrice = stripPrice / upp;
    let newStrip = item.strip_qty ?? 0;
    let newUnit = item.unit_qty ?? 0;
    if (type === 'strip') newStrip = Math.max(0, newStrip + delta);
    else newUnit = Math.max(0, newUnit + delta);
    const raw = newStrip * upp + newUnit;
    if (raw < 1) return;
    if (raw > item.batch.stock_quantity) { toast.error('Not enough stock'); return; }
    const newAmount = newStrip * stripPrice + newUnit * unitPrice;
    const rate = enableGst ? billGstRate : 0;
    const g = calculateSaleItemGst(newAmount, rate, gstType, billGstInclusive);
    updateItem(batchId, {
      strip_qty: newStrip, unit_qty: newUnit, quantity: raw, effective_qty: raw, amount: newAmount,
      gst_percentage: rate, taxable_amount: g.taxableAmount,
      cgst_amount: g.cgstAmount, sgst_amount: g.sgstAmount, igst_amount: g.igstAmount,
    });
  }

  function setFlexQty(batchId: string, type: 'strip' | 'unit', value: number) {
    const item = items.find((i) => i.batch.id === batchId && i.selling_unit === 'both');
    if (!item) return;
    const upp = item.medicine.units_per_pack ?? 1;
    const stripPrice = item.mrp;
    const unitPrice = stripPrice / upp;
    const newStrip = type === 'strip' ? Math.max(0, value) : (item.strip_qty ?? 0);
    const newUnit = type === 'unit' ? Math.max(0, value) : (item.unit_qty ?? 0);
    const raw = newStrip * upp + newUnit;
    if (raw > item.batch.stock_quantity) { toast.error('Not enough stock'); return; }
    const newAmount = newStrip * stripPrice + newUnit * unitPrice;
    const rate = enableGst ? billGstRate : 0;
    const g = calculateSaleItemGst(newAmount, rate, gstType, billGstInclusive);
    updateItem(batchId, {
      strip_qty: newStrip, unit_qty: newUnit, quantity: raw, effective_qty: raw, amount: newAmount,
      gst_percentage: rate, taxable_amount: g.taxableAmount,
      cgst_amount: g.cgstAmount, sgst_amount: g.sgstAmount, igst_amount: g.igstAmount,
    });
  }

  /* ─── Customer search ─── */
  const [custQuery, setCustQuery] = useState('');
  const [custResults, setCustResults] = useState<CustomerLite[]>([]);
  const custSearchRef = useRef<HTMLDivElement>(null);
  const [custModalOpen, setCustModalOpen] = useState(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (custSearchRef.current && !custSearchRef.current.contains(e.target as Node)) setCustResults([]);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!custQuery.trim() || !pharmacyId) { setCustResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, name, phone, credit_limit, outstanding_balance')
        .eq('pharmacy_id', pharmacyId)
        .or(`name.ilike.%${custQuery}%,phone.ilike.%${custQuery}%`)
        .limit(6);
      setCustResults((data || []).map((c: any) => ({
        id: String(c.id), name: c.name, phone: c.phone,
        credit_limit: Number(c.credit_limit) || 0,
        outstanding_balance: Number(c.outstanding_balance) || 0,
        state: null, gstin: null,
      })));
    }, 250);
    return () => clearTimeout(t);
  }, [custQuery, pharmacyId, supabase]);

  /* ─── Quick Access — Customer history, Frequently bought ─── */
  const [customerHistory, setCustomerHistory] = useState<SearchHit[]>([]);
  const [frequentlyBought, setFrequentlyBought] = useState<SearchHit[]>([]);
  const [hotkeys, setHotkeys] = useState<PosHotkey[]>([]);
  const [hotkeyOpen, setHotkeyOpen] = useState(false);

  const fetchMedicineHits = useCallback(async (ids: string[]): Promise<SearchHit[]> => {
    if (!pharmacyId || ids.length === 0) return [];
    try {
      // Note: salt_composition and gst_rate are selected but may be null if migration hasn't run yet
      const { data, error } = await supabase
        .from('medicines')
        .select('id, name, generic_name, manufacturer, salt_composition, strength, dosage_form, pack_size, pack_unit, sale_unit_mode, units_per_pack, rack_location, gst_rate, barcode, batches(stock_quantity, mrp)')
        .eq('pharmacy_id', pharmacyId)
        .in('id', ids);
      if (error) {
        // Fallback: query without optional columns that may not exist yet
        const { data: fallbackData } = await supabase
          .from('medicines')
          .select('id, name, generic_name, manufacturer, strength, dosage_form, pack_size, pack_unit, sale_unit_mode, units_per_pack, rack_location, barcode, batches(stock_quantity, mrp)')
          .eq('pharmacy_id', pharmacyId)
          .in('id', ids);
        return (fallbackData || []).map((m: any) => {
          const stock = (m.batches || []).reduce((s: number, b: any) => s + (Number(b.stock_quantity) || 0), 0);
          const minMrp = (m.batches || []).reduce((acc: number | null, b: any) => acc == null ? Number(b.mrp) : Math.min(acc, Number(b.mrp)), null);
          return {
            id: String(m.id), name: m.name, generic_name: m.generic_name,
            manufacturer: m.manufacturer, salt_composition: null,
            strength: m.strength, dosage_form: m.dosage_form,
            pack_size: m.pack_size, pack_unit: m.pack_unit,
            sale_unit_mode: m.sale_unit_mode, units_per_pack: m.units_per_pack,
            rack_location: m.rack_location, gst_rate: 12, barcode: m.barcode,
            total_stock: stock,
            available_batches: (m.batches || []).filter((b: any) => Number(b.stock_quantity) > 0).length,
            mrp: minMrp,
          };
        });
      }
      return (data || []).map((m: any) => {
        const stock = (m.batches || []).reduce((s: number, b: any) => s + (Number(b.stock_quantity) || 0), 0);
        const minMrp = (m.batches || []).reduce((acc: number | null, b: any) => acc == null ? Number(b.mrp) : Math.min(acc, Number(b.mrp)), null);
        return {
          id: String(m.id), name: m.name, generic_name: m.generic_name,
          manufacturer: m.manufacturer, salt_composition: m.salt_composition ?? null,
          strength: m.strength, dosage_form: m.dosage_form,
          pack_size: m.pack_size, pack_unit: m.pack_unit,
          sale_unit_mode: m.sale_unit_mode, units_per_pack: m.units_per_pack,
          rack_location: m.rack_location, gst_rate: m.gst_rate ?? 12, barcode: m.barcode,
          total_stock: stock,
          available_batches: (m.batches || []).filter((b: any) => Number(b.stock_quantity) > 0).length,
          mrp: minMrp,
        };
      });
    } catch {
      return [];
    }
  }, [pharmacyId, supabase]);

  const refreshQuickAccess = useCallback(async () => {
    if (!pharmacyId) return;

    // Hotkeys
    setHotkeys(loadHotkeys(pharmacyId));
  }, [pharmacyId, supabase, fetchMedicineHits]);

  useEffect(() => { refreshQuickAccess(); }, [refreshQuickAccess]);

  // Customer history — most recent items bought by selected customer
  useEffect(() => {
    if (!pharmacyId || !customerId) { setCustomerHistory([]); return; }
    let valid = true;
    (async () => {
      const { data } = await supabase
        .from('sale_items')
        .select('medicine_id, sales!inner(customer_id, pharmacy_id, bill_date)')
        .eq('sales.pharmacy_id', pharmacyId)
        .eq('sales.customer_id', customerId)
        .order('sales(bill_date)', { ascending: false })
        .limit(40);
      const seen = new Set<string>();
      const ordered: string[] = [];
      (data || []).forEach((r: any) => {
        const k = String(r.medicine_id);
        if (!seen.has(k)) { seen.add(k); ordered.push(k); }
      });
      const ids = ordered.slice(0, 8);
      const hits = ids.length > 0 ? await fetchMedicineHits(ids) : [];
      if (valid) setCustomerHistory(hits);
    })();
    return () => { valid = false; };
  }, [pharmacyId, customerId, supabase, fetchMedicineHits]);

  // Frequently bought together — medicines that co-occur with current cart items
  useEffect(() => {
    if (!pharmacyId || items.length === 0) { setFrequentlyBought([]); return; }
    let valid = true;
    (async () => {
      const cartIds = items.map((i) => i.medicine.id);
      // Find sales that contain any of the cart medicines
      const { data: salesRows } = await supabase
        .from('sale_items')
        .select('sale_id')
        .eq('pharmacy_id', pharmacyId)
        .in('medicine_id', cartIds)
        .limit(200);
      const saleIds = [...new Set((salesRows || []).map((r: any) => r.sale_id))];
      if (saleIds.length === 0) { if (valid) setFrequentlyBought([]); return; }
      const { data: companions } = await supabase
        .from('sale_items')
        .select('medicine_id')
        .in('sale_id', saleIds);
      const counts = new Map<string, number>();
      (companions || []).forEach((r: any) => {
        const k = String(r.medicine_id);
        if (!cartIds.includes(k)) counts.set(k, (counts.get(k) || 0) + 1);
      });
      const topIds = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
      const hits = topIds.length > 0 ? await fetchMedicineHits(topIds) : [];
      if (valid) setFrequentlyBought(hits);
    })();
    return () => { valid = false; };
  }, [pharmacyId, items, supabase, fetchMedicineHits]);

  /* ─── Hotkey listener (Alt+1..9) ─── */
  useEffect(() => {
    const onHotkey = (e: KeyboardEvent) => {
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const digit = parseInt(e.key, 10);
        const hk = hotkeys.find((h) => h.digit === digit);
        if (hk) {
          e.preventDefault(); e.stopPropagation();
          (async () => {
            const hit = (await fetchMedicineHits([hk.medicine_id]))[0];
            if (hit) selectMedicine(hit);
          })();
        }
      }
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onHotkey, { capture: true });
    return () => window.removeEventListener('keydown', onHotkey, { capture: true });
  }, [hotkeys, fetchMedicineHits]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Routine + Reorder Last Bill ─── */
  async function handleLoadRoutine() {
    if (!pharmacyId || !customerId) return;
    // Pull explicitly-defined regulars from customer_regulars (set on customer
    // detail page). NOT historical purchases — that's what "Reorder Last" is for.
    const { data, error } = await supabase
      .from('customer_regulars')
      .select('medicine_id')
      .eq('pharmacy_id', pharmacyId)
      .eq('customer_id', customerId);
    if (error) { toast.error(error.message); return; }
    const ids = [...new Set((data || []).map((r: any) => String(r.medicine_id)))];
    if (ids.length === 0) {
      toast.error('No routine medicines defined for this customer');
      return;
    }
    const hits = await fetchMedicineHits(ids);
    let added = 0, oos = 0, dup = 0;
    for (const med of hits) {
      if (items.some((i) => i.medicine.id === med.id)) { dup++; continue; }
      const batches = await fetchFefoBatches(med.id);
      if (batches.length > 0) { commitAddToCart(med, batches[0]); added++; }
      else oos++;
    }
    if (added > 0) {
      const extra = [oos > 0 ? `${oos} out of stock` : '', dup > 0 ? `${dup} already in cart` : ''].filter(Boolean).join(', ');
      toast.success(extra ? `Loaded ${added} routine items (${extra})` : `Loaded ${added} routine items`);
    } else if (oos > 0) {
      toast.error(`All ${oos} routine items are out of stock`);
    } else if (dup > 0) {
      toast(`All ${dup} routine items are already in the cart`);
    } else {
      toast.error('No routine items available');
    }
  }

  async function handleReorderLastBill() {
    if (!pharmacyId || !customerId) return;
    const { data: lastSale } = await supabase
      .from('sales').select('id').eq('pharmacy_id', pharmacyId).eq('customer_id', customerId)
      .order('bill_date', { ascending: false }).limit(1).maybeSingle();
    if (!lastSale) { toast.error('No previous bill found'); return; }
    const { data: lastItems } = await supabase
      .from('sale_items').select('medicine_id, quantity').eq('sale_id', lastSale.id);
    if (!lastItems || lastItems.length === 0) { toast.error('No items in previous bill'); return; }
    const ids = [...new Set(lastItems.map((it: any) => String(it.medicine_id)))];
    const hits = await fetchMedicineHits(ids);
    let added = 0;
    for (const med of hits) {
      if (items.some((i) => i.medicine.id === med.id)) continue;
      const batches = await fetchFefoBatches(med.id);
      if (batches.length > 0) { commitAddToCart(med, batches[0]); added++; }
    }
    if (added > 0) toast.success(`Reordered ${added} items`);
    else toast.error('Items unavailable');
  }

  /* ─── Draft recovery ─── */
  const [draftBanner, setDraftBanner] = useState<{ visible: boolean; itemCount: number; savedAt: string } | null>(null);

  useEffect(() => {
    if (!pharmacyId) return;
    const draft = loadDraft(pharmacyId);
    if (draft && draft.items.length > 0) {
      setDraftBanner({ visible: true, itemCount: draft.items.length, savedAt: draft.savedAt });
    }
  }, [pharmacyId]);

  function handleResumeDraft() {
    if (!pharmacyId) return;
    const draft = loadDraft(pharmacyId);
    if (!draft) return;
    setItems(draft.items);
    setCustomer(draft.customerId, draft.customerName, draft.customerPhone, draft.customerCreditLimit, draft.customerOutstandingBalance, draft.customerState, draft.customerGstin);
    setPaymentMethod(draft.paymentMethod);
    setDiscount(draft.discountType, draft.discountValue);
    setNotes(draft.notes);
    setPrescriptionSale(draft.isPrescriptionSale);
    setBillGstRate(draft.billGstRate);
    setBillGstInclusive(draft.billGstInclusive);
    setDraftBanner(null);
  }

  function handleDiscardDraft() {
    if (!pharmacyId) return;
    clearDraft(pharmacyId);
    setDraftBanner(null);
  }

  // Auto-save draft (debounced 600ms)
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!pharmacyId || (items.length === 0 && !customerId)) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      saveDraft(pharmacyId, {
        items, customerId, customerName, customerPhone,
        customerCreditLimit, customerOutstandingBalance,
        customerType: 'b2c', customerGstin, customerState,
        paymentMethod, discountType, discountValue, notes, isPrescriptionSale,
        billGstRate, billGstInclusive,
        savedAt: new Date().toISOString(),
      });
    }, 600);
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
  }, [pharmacyId, items, customerId, customerName, customerPhone, customerCreditLimit, customerOutstandingBalance, customerGstin, customerState, paymentMethod, discountType, discountValue, notes, isPrescriptionSale, billGstRate, billGstInclusive]);

  /* ─── Complete sale ─── */
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [partialCreditAmount, setPartialCreditAmount] = useState(0);
  const [completed, setCompleted] = useState<CompletedSaleData | null>(null);

  async function handleCompleteSale() {
    if (!pharmacyId || items.length === 0) return;
    const zero = items.find((i) => i.quantity < 1);
    if (zero) { setSubmitError(`"${zero.medicine.name}" has 0 quantity.`); return; }
    const tot = total();
    if (paymentMethod === 'credit' && customerId) {
      const creditPortion = tot - Math.min(partialCreditAmount, tot);
      if (customerCreditLimit !== null && customerCreditLimit > 0 && creditPortion > 0) {
        const newBalance = customerOutstandingBalance + creditPortion;
        if (newBalance > customerCreditLimit) {
          setSubmitError(`Credit limit exceeded! Limit: ₹${customerCreditLimit.toFixed(2)}, would become ₹${newBalance.toFixed(2)}.`);
          return;
        }
      }
    }
    if (paymentMethod === 'credit' && !customerId) {
      setSubmitError('Please select a customer for credit sale.');
      return;
    }
    setSubmitting(true); setSubmitError('');

    try {
      const sub = subtotal();
      const discAmt = calculatedDiscount();
      const gstSum = sumGstLineItems(items.map((i) => ({
        taxableAmount: i.taxable_amount,
        cgstPercentage: i.cgst_percentage, sgstPercentage: i.sgst_percentage, igstPercentage: i.igst_percentage,
        cgstAmount: i.cgst_amount, sgstAmount: i.sgst_amount, igstAmount: i.igst_amount,
        totalGstAmount: i.cgst_amount + i.sgst_amount + i.igst_amount,
      })));

      // Generate bill_number locally (timestamp-based)
      const billNumber = `INV-${Date.now()}`;
      const paid = paymentMethod === 'credit' ? Math.min(partialCreditAmount, tot) : tot;
      const status = paymentMethod === 'credit'
        ? (partialCreditAmount > 0 && partialCreditAmount < tot ? 'partial' : 'pending')
        : 'paid';

      const { data: sale, error: sErr } = await supabase
        .from('sales')
        .insert({
          pharmacy_id: pharmacyId,
          customer_id: customerId,
          bill_number: billNumber,
          bill_date: new Date().toISOString(),
          subtotal: sub,
          gst_amount: gstSum.totalGstAmount,
          discount_amount: discAmt > 0 ? discAmt : null,
          total_amount: tot,
          payment_method: paymentMethod,
          payment_status: status,
          paid_amount: paid,
          is_prescription_sale: isPrescriptionSale,
          notes: notes.trim() || null,
        })
        .select('id, bill_number, bill_date')
        .single();
      if (sErr) throw sErr;

      // Insert sale_items + deduct stock
      for (const it of items) {
        const upp = it.medicine.units_per_pack ?? 1;
        let storeQty = it.quantity;
        let storeMrp = it.mrp;
        if (it.selling_unit === 'both') {
          // amount already accounts for combo; quantity already in raw units; per-unit price
          storeMrp = it.mrp / upp;
        }
        const { error: piErr } = await supabase.from('sale_items').insert({
          pharmacy_id: pharmacyId,
          sale_id: sale.id,
          medicine_id: it.medicine.id,
          batch_id: it.batch.id,
          quantity: storeQty,
          mrp: storeMrp,
          discount_percentage: it.discount_percentage || 0,
          gst_percentage: it.gst_percentage,
          amount: it.amount,
        });
        if (piErr) throw piErr;
        // Deduct stock — try RPC, fall back to direct update
        try {
          await supabase.rpc('deduct_batch_stock', { p_batch_id: it.batch.id, p_quantity: storeQty });
        } catch {
          await supabase
            .from('batches')
            .update({ stock_quantity: it.batch.stock_quantity - storeQty })
            .eq('id', it.batch.id);
        }
      }

      // Update customer outstanding balance for credit
      if (paymentMethod === 'credit' && customerId) {
        const creditPortion = tot - paid;
        if (creditPortion > 0) {
          await supabase
            .from('customers')
            .update({ outstanding_balance: customerOutstandingBalance + creditPortion })
            .eq('id', customerId);
        }
      }

      // Build completed-sale data for the print modal
      const completedData: CompletedSaleData = {
        saleId: String(sale.id),
        billNumber: sale.bill_number,
        billDate: sale.bill_date,
        customerName, customerPhone,
        paymentMethod, paymentStatus: status,
        subtotal: sub, gstAmount: gstSum.totalGstAmount,
        discountAmount: discAmt, totalAmount: tot,
        items: items.map((it) => ({
          medicine_name: it.medicine.name,
          batch_number: it.batch.batch_number,
          quantity: it.quantity,
          units_per_pack: it.medicine.units_per_pack ?? 1,
          selling_unit: it.selling_unit,
          mrp: it.mrp,
          gst_percentage: it.gst_percentage,
          amount: it.amount,
        })),
        pharmacy: pharmacy ? {
          name: pharmacy.name, address: pharmacy.address, city: pharmacy.city, pincode: pharmacy.pincode,
          phone: pharmacy.phone, gstin: pharmacy.gstin, license_number: pharmacy.license_number,
          upi_id: pharmacy.upi_id, logo_url: pharmacy.logo_url,
        } : null,
      };

      clearCart();
      if (pharmacyId) clearDraft(pharmacyId);
      setDraftBanner(null);
      setPartialCreditAmount(0);
      setCompleted(completedData);
      playSuccessBeep();
    } catch (err: any) {
      console.error(err);
      setSubmitError(err?.message || 'Failed to complete sale');
      playErrorBeep();
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewSale() {
    setCompleted(null);
    setSubmitError('');
    setTimeout(() => searchInputRef.current?.focus(), 80);
  }

  /* ─── Render helpers ─── */
  const sub = subtotal();
  const tot = total();
  const gstTotal = items.reduce((s, i) => s + i.cgst_amount + i.sgst_amount + i.igst_amount, 0);

  // NOTE: defined as a plain render function (not a React component) so the
  // returned <button> stays the same React element type across re-renders.
  // Defining a component inside the parent's body would create a new
  // component type each render and unmount the chip mid-click — which is
  // exactly why clicks on "USER HISTORY" chips were being lost.
  const renderQuickChip = (med: SearchHit, color: string, keyPrefix: string) => {
    const oos = med.total_stock <= 0;
    return (
      <button
        key={`${keyPrefix}-${med.id}`}
        type="button"
        onClick={() => {
          if (oos) { toast.error(`${med.name} is out of stock`); return; }
          selectMedicine(med);
        }}
        disabled={oos}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 5px',
          borderRadius: 999, border: `1px solid ${color}33`, background: `${color}10`,
          cursor: oos ? 'not-allowed' : 'pointer', opacity: oos ? 0.5 : 1,
          flexShrink: 0, transition: 'all 0.15s ease',
        }}
      >
        <div style={{ width: 22, height: 22, borderRadius: 999, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Package style={{ width: 11, height: 11, color: C.muted }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.text, lineHeight: 1.1, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{med.name}</span>
          <span style={{ fontSize: 9, color: C.muted, lineHeight: 1.1 }}>{oos ? 'OOS' : `${med.total_stock} stk`}</span>
        </div>
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 112px)', minHeight: 0 }}>
      {/* ══ LEFT: Search + Quick Access + Cart ══════════════════════════════ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Draft banner */}
        {draftBanner?.visible && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, border: `1px solid rgba(245,158,11,0.3)`, background: 'rgba(245,158,11,0.08)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <RotateCcw style={{ width: 14, height: 14, color: C.amber }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.amber }}>Unsaved bill found</p>
              <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(245,158,11,0.7)' }}>
                {draftBanner.itemCount} item{draftBanner.itemCount !== 1 ? 's' : ''} · saved {draftAge(draftBanner.savedAt)}
              </p>
            </div>
            <button onClick={handleResumeDraft} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: C.amber, color: '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
              <RotateCcw style={{ width: 11, height: 11 }} /> Resume
            </button>
            <button onClick={handleDiscardDraft} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.cardBorder}`, background: 'rgba(255,255,255,0.04)', color: C.muted, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              <X style={{ width: 11, height: 11 }} /> Discard
            </button>
          </div>
        )}

        {/* Scanner status + Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 12, border: `1px solid ${C.cardBorder}`, background: C.cardSoft, color: C.muted, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            <ScanBarcode style={{ width: 13, height: 13 }} /> Scanner Ready
          </div>

          <div ref={searchRef} style={{ position: 'relative', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 44, background: C.inputBg, border: `1.5px solid ${C.inputBorder}`, borderRadius: 12 }}>
              {searching ? <Loader2 style={{ width: 15, height: 15, color: C.primaryLight, animation: 'spin 1s linear infinite' }} /> : <Search style={{ width: 15, height: 15, color: C.muted }} />}
              <input
                ref={searchInputRef} value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, salt, or scan barcode… (F2)"
                autoFocus
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 13, fontFamily: 'inherit' }}
              />
              <kbd style={{ padding: '2px 6px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBorder}`, fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>F2</kbd>
            </div>

            {results.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#0d1225', border: `1px solid ${C.cardBorder}`, borderRadius: 12, overflow: 'hidden', maxHeight: 360, overflowY: 'auto', zIndex: 40, boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
                {results.map((med, i) => {
                  const noStock = med.total_stock === 0;
                  return (
                    <div key={med.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      borderBottom: i < results.length - 1 ? `1px solid rgba(255,255,255,0.03)` : 'none',
                      opacity: noStock ? 0.4 : 1,
                    }}>
                      <button
                        onClick={() => !noStock && selectMedicine(med)}
                        disabled={noStock}
                        style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'transparent', cursor: noStock ? 'not-allowed' : 'pointer', textAlign: 'left', padding: 0 }}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package style={{ width: 14, height: 14, color: C.primaryLight }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{med.name}</p>
                            {med.rack_location && <span style={{ padding: '1px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, fontSize: 9, fontWeight: 700, color: C.muted, whiteSpace: 'nowrap' }}>R: {med.rack_location}</span>}
                          </div>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {med.salt_composition && <span style={{ color: C.primaryLight, fontWeight: 600 }}>{med.salt_composition} · </span>}
                            {med.dosage_form || ''}{med.strength ? ` · ${med.strength}` : ''} · {med.manufacturer || '—'}
                          </p>
                        </div>
                      </button>
                      {med.salt_composition && (
                        <button onClick={(e) => { e.stopPropagation(); setCompareOpen(med); }} title="Compare brands" style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.primaryLight }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                          <ArrowLeftRight style={{ width: 13, height: 13 }} />
                        </button>
                      )}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.primaryLight }}>{med.mrp ? `₹${med.mrp.toFixed(2)}` : '—'}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 9, color: noStock ? C.rose : C.muted }}>
                          {noStock ? 'Out of stock' : `${med.total_stock} stk${med.available_batches > 1 ? ` · ${med.available_batches} batches` : ''}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Access strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            onClick={() => setHotkeyOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8,
              border: `1px solid ${hotkeys.length > 0 ? 'rgba(139,92,246,0.3)' : C.cardBorder}`,
              background: hotkeys.length > 0 ? 'rgba(139,92,246,0.1)' : C.cardSoft,
              color: hotkeys.length > 0 ? C.violet : C.muted,
              fontSize: 11, fontWeight: 800, cursor: 'pointer', flexShrink: 0,
            }}
            title="Manage Quick Access Hotkeys (Alt+1..9)"
          >
            <Keyboard style={{ width: 13, height: 13 }} />
            {hotkeys.length > 0 && (
              <span style={{ background: C.violet, color: '#fff', borderRadius: 999, width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>{hotkeys.length}</span>
            )}
          </button>

          {customerHistory.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: `1px solid rgba(99,102,241,0.2)`, color: C.primaryLight, flexShrink: 0 }}>
                <History style={{ width: 12, height: 12 }} />
                <span style={{ fontSize: 10, fontWeight: 800 }}>USER HISTORY</span>
              </div>
              {customerHistory.map((m) => renderQuickChip(m, '#6366f1', 'hist'))}
            </>
          )}

          {frequentlyBought.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 8, background: 'rgba(20,184,166,0.1)', border: `1px solid rgba(20,184,166,0.2)`, color: C.teal, flexShrink: 0 }}>
                <Sparkles style={{ width: 12, height: 12 }} />
                <span style={{ fontSize: 10, fontWeight: 800 }}>ALSO BOUGHT</span>
              </div>
              {frequentlyBought.map((m) => renderQuickChip(m, '#14b8a6', 'freq'))}
            </>
          )}

        </div>

        {/* Cart */}
        <div style={{ flex: 1, minHeight: 0, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {items.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart style={{ width: 22, height: 22, color: C.mutedDim }} />
              </div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.muted }}>Cart is empty</p>
              <p style={{ margin: 0, fontSize: 11, color: C.mutedDim }}>Search above or use a quick-access chip</p>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${C.cardBorder}`, zIndex: 1 }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Medicine</th>
                    <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', width: 130 }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', width: 100 }}>Rate</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', width: 100 }}>Amount</th>
                    <th style={{ width: 36 }} />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const isFlexBoth = it.selling_unit === 'both';
                    const upp = it.medicine.units_per_pack ?? 1;
                    const stripPrice = it.mrp;
                    const unitPrice = isFlexBoth ? stripPrice / upp : it.mrp;
                    const stripQty = it.strip_qty ?? 0;
                    const unitQty = it.unit_qty ?? 0;
                    const expDate = new Date(it.batch.expiry_date);
                    const daysToExp = Math.ceil((expDate.getTime() - Date.now()) / 86400000);
                    const expired = daysToExp <= 0;
                    const nearExpiry = !expired && daysToExp <= 90;

                    return (
                      <tr key={it.batch.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                        <td style={{ padding: '10px 16px', verticalAlign: 'top' }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{it.medicine.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, color: C.muted }}>Batch: {it.batch.batch_number}</span>
                            <span style={{ fontSize: 10, color: C.mutedDim }}>·</span>
                            <span style={{
                              fontSize: 10, padding: '2px 6px', borderRadius: 5, fontWeight: 700,
                              background: expired ? 'rgba(244,63,94,0.15)' : nearExpiry ? 'rgba(245,158,11,0.15)' : 'transparent',
                              color: expired ? C.rose : nearExpiry ? C.amber : C.muted,
                            }}>
                              {expDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                              {expired ? ' · Expired' : nearExpiry ? ` · ${daysToExp}d left` : ''}
                            </span>
                            {enableGst && it.gst_percentage > 0 && (
                              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, fontWeight: 700, background: 'rgba(255,255,255,0.04)', color: C.muted }}>GST {it.gst_percentage}%</span>
                            )}
                            <button onClick={() => handleChangeBatch(it)} title="Change Batch" style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(99,102,241,0.1)', color: C.primaryLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ArrowLeftRight style={{ width: 11, height: 11 }} />
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                          {isFlexBoth ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button onClick={() => updateFlexQty(it.batch.id, 'strip', -1)} disabled={stripQty <= 0 && unitQty <= 0} style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(99,102,241,0.15)', color: C.primaryLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: stripQty <= 0 && unitQty <= 0 ? 0.3 : 1 }}>
                                  <Minus style={{ width: 10, height: 10 }} />
                                </button>
                                <input type="number" min={0} value={stripQty}
                                  onChange={(e) => setFlexQty(it.batch.id, 'strip', parseInt(e.target.value) || 0)}
                                  style={{ width: 32, textAlign: 'center', background: 'transparent', border: 'none', borderBottom: `1px solid rgba(99,102,241,0.3)`, color: C.text, fontSize: 13, fontWeight: 800, outline: 'none' }} />
                                <span style={{ fontSize: 9, color: C.primaryLight, fontWeight: 700 }}>str</span>
                                <button onClick={() => updateFlexQty(it.batch.id, 'strip', 1)} style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(99,102,241,0.15)', color: C.primaryLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Plus style={{ width: 10, height: 10 }} />
                                </button>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button onClick={() => updateFlexQty(it.batch.id, 'unit', -1)} disabled={unitQty <= 0 && stripQty <= 0} style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(16,185,129,0.15)', color: C.emerald, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: unitQty <= 0 && stripQty <= 0 ? 0.3 : 1 }}>
                                  <Minus style={{ width: 10, height: 10 }} />
                                </button>
                                <input type="number" min={0} value={unitQty}
                                  onChange={(e) => setFlexQty(it.batch.id, 'unit', parseInt(e.target.value) || 0)}
                                  style={{ width: 32, textAlign: 'center', background: 'transparent', border: 'none', borderBottom: `1px solid rgba(16,185,129,0.3)`, color: C.text, fontSize: 13, fontWeight: 800, outline: 'none' }} />
                                <span style={{ fontSize: 9, color: C.emerald, fontWeight: 700 }}>unit</span>
                                <button onClick={() => updateFlexQty(it.batch.id, 'unit', 1)} style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(16,185,129,0.15)', color: C.emerald, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Plus style={{ width: 10, height: 10 }} />
                                </button>
                              </div>
                              <p style={{ margin: 0, fontSize: 9, color: C.mutedDim }}>= {stripQty * upp + unitQty} units</p>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <button onClick={() => updateQty(it.batch.id, -1)} disabled={it.quantity <= 1} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.06)', color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: it.quantity <= 1 ? 0.3 : 1 }}>
                                <Minus style={{ width: 11, height: 11 }} />
                              </button>
                              <span style={{ width: 28, textAlign: 'center', fontSize: 13, fontWeight: 800, color: C.text }}>{it.quantity}</span>
                              <button onClick={() => updateQty(it.batch.id, 1)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.06)', color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Plus style={{ width: 11, height: 11 }} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'right' }}>
                          {isFlexBoth ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: C.primaryLight }}>₹{stripPrice.toFixed(2)}/str</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: C.emerald }}>₹{unitPrice.toFixed(2)}/u</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 13, fontWeight: 700, color: C.textSoft }}>₹{it.mrp.toFixed(2)}</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'right' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>₹{it.amount.toFixed(2)}</span>
                        </td>
                        <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                          <button onClick={() => removeItem(it.batch.id)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(244,63,94,0.1)', color: C.rose, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 style={{ width: 12, height: 12 }} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {items.length > 0 && (
            <div style={{ borderTop: `1px solid ${C.cardBorder}`, padding: '10px 16px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.muted }}>
                <span>{items.length} item{items.length > 1 ? 's' : ''}</span>
                {enableGst && gstTotal > 0 && (
                  <span style={{
                    padding: '2px 8px', borderRadius: 5, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                    background: gstType === 'igst' ? 'rgba(251,146,60,0.15)' : 'rgba(20,184,166,0.15)',
                    color: gstType === 'igst' ? C.orange : C.teal,
                  }}>
                    {gstType === 'igst' ? 'IGST' : 'CGST+SGST'} ₹{gstTotal.toFixed(2)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>
                Subtotal: {formatCurrency(sub)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ RIGHT: Bill panel ══════════════════════════════ */}
      <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>

        {/* Customer */}
        <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Customer (Optional)</p>
            {!customerName && (
              <button onClick={() => setCustModalOpen(true)} style={{ fontSize: 9, fontWeight: 800, color: C.primaryLight, background: 'rgba(99,102,241,0.1)', border: 'none', borderRadius: 5, padding: '3px 7px', cursor: 'pointer' }}>+ QUICK ADD</button>
            )}
          </div>
          {customerName ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User style={{ width: 14, height: 14, color: '#fff' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customerName}</p>
                    {customerPhone && <p style={{ margin: '1px 0 0', fontSize: 10, color: C.muted }}>{customerPhone}</p>}
                  </div>
                </div>
                <button onClick={() => setCustomer(null, null, null)} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X style={{ width: 13, height: 13 }} />
                </button>
              </div>
              {(customerCreditLimit !== null && customerCreditLimit > 0) || customerOutstandingBalance > 0 ? (
                <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.cardBorder}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                  {customerCreditLimit !== null && customerCreditLimit > 0 && <span style={{ color: C.muted }}>Limit: <b style={{ color: C.text }}>₹{customerCreditLimit.toFixed(0)}</b></span>}
                  {customerOutstandingBalance > 0 && <span style={{ color: C.rose }}>Due: <b>₹{customerOutstandingBalance.toFixed(0)}</b></span>}
                </div>
              ) : null}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button onClick={handleLoadRoutine} title="Load regular prescriptions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 4px', borderRadius: 8, border: `1px solid rgba(14,165,233,0.2)`, background: 'rgba(14,165,233,0.08)', color: '#0ea5e9', cursor: 'pointer' }}>
                  <Activity style={{ width: 13, height: 13 }} />
                  <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Load Routine</span>
                </button>
                <button onClick={handleReorderLastBill} title="Reorder previous bill" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 4px', borderRadius: 8, border: `1px solid rgba(16,185,129,0.2)`, background: 'rgba(16,185,129,0.08)', color: C.emerald, cursor: 'pointer' }}>
                  <History style={{ width: 13, height: 13 }} />
                  <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reorder Last</span>
                </button>
              </div>
            </>
          ) : (
            <div ref={custSearchRef} style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: C.muted }} />
              <input value={custQuery} onChange={(e) => setCustQuery(e.target.value)} placeholder="Search name or phone..."
                style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: `1px solid ${C.cardBorder}`, background: C.cardSoft, color: C.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
              {custResults.length > 0 && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#0d1225', border: `1px solid ${C.cardBorder}`, borderRadius: 10, overflow: 'hidden', zIndex: 30, maxHeight: 220, overflowY: 'auto', boxShadow: '0 16px 40px rgba(0,0,0,0.7)' }}>
                  {custResults.map((c) => (
                    <button key={c.id} onClick={() => {
                      setCustomer(c.id, c.name, c.phone, c.credit_limit, c.outstanding_balance, c.state, c.gstin);
                      setCustQuery(''); setCustResults([]);
                    }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid rgba(255,255,255,0.03)` }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.07)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted }}>{c.phone}</p>
                      </div>
                      {c.outstanding_balance > 0 && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 5, background: 'rgba(244,63,94,0.1)', color: C.rose, flexShrink: 0 }}>₹{c.outstanding_balance.toFixed(0)}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment method */}
        <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 14 }}>
          <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Payment Method</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {([
              { key: 'cash', label: 'Cash', icon: Banknote },
              { key: 'upi', label: 'UPI', icon: Wallet },
              { key: 'card', label: 'Card', icon: CreditCard },
              { key: 'credit', label: 'Credit', icon: User },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => { setPaymentMethod(key); setPartialCreditAmount(0); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '9px 6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 800,
                  background: paymentMethod === key ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                  color: paymentMethod === key ? C.primaryLight : C.muted,
                  outline: paymentMethod === key ? `1px solid rgba(99,102,241,0.4)` : '1px solid rgba(255,255,255,0.05)',
                }}>
                <Icon style={{ width: 12, height: 12 }} /> {label}
              </button>
            ))}
          </div>
          {paymentMethod === 'credit' && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.cardBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.muted }}>Part Payment Now (₹)</span>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 5, background: 'rgba(245,158,11,0.1)', color: C.amber }}>
                  Credit: ₹{Math.max(0, tot - Math.min(partialCreditAmount, tot)).toFixed(2)}
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <IndianRupee style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: C.muted }} />
                <input type="number" min={0} max={tot} step="0.01" value={partialCreditAmount || ''}
                  onChange={(e) => setPartialCreditAmount(Math.max(0, Math.min(Number(e.target.value), tot)))}
                  placeholder="0 — leave blank for full credit"
                  style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: `1px solid ${C.cardBorder}`, background: C.cardSoft, color: C.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          )}
        </div>

        {/* UPI QR */}
        {paymentMethod === 'upi' && pharmacy?.upi_id && tot > 0 && (
          <div style={{ background: C.card, border: `1px solid rgba(99,102,241,0.2)`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wallet style={{ width: 13, height: 13, color: C.primaryLight }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: C.primaryLight, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Scan & Pay via UPI</span>
            </div>
            <div style={{ background: '#fff', padding: 10, borderRadius: 10 }}>
              <QRCodeCanvas value={`upi://pay?pa=${pharmacy.upi_id}&pn=${encodeURIComponent(pharmacy.name || 'Pharmacy')}&am=${tot.toFixed(2)}&cu=INR`} size={140} level="L" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: C.text }}>₹{tot.toFixed(2)}</p>
              <p style={{ margin: '2px 0 0', fontSize: 9, color: C.muted, wordBreak: 'break-all' }}>{pharmacy.upi_id}</p>
            </div>
          </div>
        )}

        {/* Discount */}
        <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Discount</p>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: 2, borderRadius: 7 }}>
              <button onClick={() => setDiscount('amount', discountValue)} style={{ padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 800, background: discountType === 'amount' ? 'rgba(99,102,241,0.18)' : 'transparent', color: discountType === 'amount' ? C.primaryLight : C.muted }}>₹</button>
              <button onClick={() => setDiscount('percentage', Math.min(discountValue, 100))} style={{ padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', background: discountType === 'percentage' ? 'rgba(99,102,241,0.18)' : 'transparent', color: discountType === 'percentage' ? C.primaryLight : C.muted }}>
                <Percent style={{ width: 10, height: 10 }} />
              </button>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            {discountType === 'amount'
              ? <IndianRupee style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: C.muted }} />
              : <Percent style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: C.muted }} />}
            <input type="number" min={0} max={discountType === 'percentage' ? 100 : sub}
              value={discountValue || ''} onChange={(e) => setDiscount(discountType, Number(e.target.value))}
              placeholder="0"
              style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: `1px solid ${C.cardBorder}`, background: C.cardSoft, color: C.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Sales GST settings */}
        {enableGst && (
          <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 14 }}>
            <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Sales GST</p>
            <select value={billGstRate} onChange={(e) => setBillGstRate(Number(e.target.value))}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${C.cardBorder}`, background: C.cardSoft, color: C.text, fontSize: 12, outline: 'none', cursor: 'pointer', marginBottom: 8, boxSizing: 'border-box', colorScheme: 'dark' }}>
              {[
                { v: 0, label: '0% (GST Exempt)' },
                { v: 5, label: '5%' },
                { v: 12, label: '12%' },
                { v: 18, label: '18%' },
                { v: 28, label: '28%' },
              ].map((o) => (
                <option key={o.v} value={o.v} style={{ background: '#0B1121', color: C.text }}>{o.label}</option>
              ))}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={billGstInclusive} onChange={(e) => setBillGstInclusive(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: C.primary }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.textSoft }}>Inclusive of GST</span>
            </label>
          </div>
        )}

        {/* Notes + prescription toggle */}
        <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 14 }}>
          <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Notes</p>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes (optional)" rows={2}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${C.cardBorder}`, background: C.cardSoft, color: C.text, fontSize: 11, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 8 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={isPrescriptionSale} onChange={(e) => setPrescriptionSale(e.target.checked)} style={{ width: 13, height: 13, accentColor: C.primary }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.textSoft }}>Prescription sale</span>
          </label>
        </div>

        {/* Total + CTA */}
        <div style={{ background: 'linear-gradient(135deg,#6366f1,#7c3aed)', borderRadius: 14, padding: 14, color: '#fff' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
              <span>Subtotal</span>
              <span>{formatCurrency(sub)}</span>
            </div>
            {calculatedDiscount() > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#86efac' }}>
                <span>Discount{discountType === 'percentage' && ` (${discountValue}%)`}</span>
                <span>- {formatCurrency(calculatedDiscount())}</span>
              </div>
            )}
            {enableGst && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                <span>{billGstInclusive ? 'GST (incl.)' : 'GST (+)'}</span>
                <span>{formatCurrency(gstTotal)}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid rgba(255,255,255,0.2)`, paddingTop: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{formatCurrency(tot)}</span>
          </div>

          {submitError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 8, background: 'rgba(244,63,94,0.2)', borderRadius: 8, color: '#fee2e2', fontSize: 11, marginBottom: 10 }}>
              <AlertCircle style={{ width: 12, height: 12, flexShrink: 0 }} />
              {submitError}
            </div>
          )}
          {paymentMethod === 'credit' && !customerId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 8, background: '#f59e0b', color: '#000', borderRadius: 8, fontSize: 11, fontWeight: 700, marginBottom: 10 }}>
              <AlertCircle style={{ width: 12, height: 12, flexShrink: 0 }} /> Select a customer for credit sale
            </div>
          )}

          <button
            onClick={handleCompleteSale}
            disabled={submitting || items.length === 0 || (paymentMethod === 'credit' && !customerId)}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: '#fff', color: C.primary,
              fontSize: 13, fontWeight: 900, cursor: (submitting || items.length === 0 || (paymentMethod === 'credit' && !customerId)) ? 'not-allowed' : 'pointer',
              opacity: (submitting || items.length === 0 || (paymentMethod === 'credit' && !customerId)) ? 0.55 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {submitting
              ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Processing…</>
              : <><CheckCircle2 style={{ width: 14, height: 14 }} /> Complete Sale</>}
          </button>
        </div>

        {items.length > 0 && (
          <button onClick={() => { if (confirm('Clear cart?')) clearCart(); }} style={{ background: 'none', border: 'none', color: C.mutedDim, fontSize: 11, cursor: 'pointer', textAlign: 'center', padding: 4 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.rose; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.mutedDim; }}>
            Clear Cart
          </button>
        )}
      </div>

      {/* ── Modals ── */}
      <BatchModal
        open={batchModal.open}
        onClose={() => { setBatchModal({ open: false, med: null, batches: [], isChange: false }); setChangeBatchFor(null); }}
        medicine={batchModal.med}
        batches={batchModal.batches}
        isChange={batchModal.isChange}
        onSelect={(b) => {
          if (changeBatchFor) handleSwapBatch(b);
          else if (batchModal.med) {
            commitAddToCart(batchModal.med, b);
            setBatchModal({ open: false, med: null, batches: [], isChange: false });
          }
        }}
      />
      {pharmacyId && (
        <QuickAddCustomerModal
          open={custModalOpen} onClose={() => setCustModalOpen(false)}
          pharmacyId={pharmacyId}
          onCreated={(c) => {
            setCustomer(c.id, c.name, c.phone, c.credit_limit, c.outstanding_balance, c.state, c.gstin);
          }}
        />
      )}
      {pharmacyId && (
        <BrandComparisonModal
          open={!!compareOpen} onClose={() => setCompareOpen(null)}
          pharmacyId={pharmacyId} source={compareOpen}
          onPick={async (medId) => {
            const hits = await fetchMedicineHits([medId]);
            if (hits[0]) selectMedicine(hits[0]);
          }}
        />
      )}
      {pharmacyId && (
        <HotkeyManagerModal
          open={hotkeyOpen} onClose={() => setHotkeyOpen(false)}
          pharmacyId={pharmacyId} hotkeys={hotkeys} onChange={setHotkeys}
        />
      )}

      <SaleCompleteModal open={!!completed} data={completed} onClose={() => setCompleted(null)} onNewSale={handleNewSale} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
