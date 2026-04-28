'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft, Upload, Save, AlertTriangle, Loader2, PackagePlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SupplierDetails } from './components/SupplierDetails';
import { PurchaseGrid } from './components/PurchaseGrid';
import { PurchaseTotals } from './components/PurchaseTotals';
import { QuickAddSupplierModal } from './components/QuickAddSupplierModal';
import { QuickAddMedicineModal, type QuickAddMedicineResult } from './components/QuickAddMedicineModal';
import { PurchaseLineItem, Supplier, isInterState } from './components/types';
import { usePanelStore } from '@/store/panelStore';
import { createClient } from '@/lib/supabase/client';
import { parsePurchaseCsv } from '@/lib/csvPurchaseParser';

const C = {
  bg: '#020617',
  card: '#0B1121',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc',
  muted: '#94a3b8',
  inputBg: 'rgba(255,255,255,0.02)',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  warning: '#f59e0b',
  danger: '#ef4444',
};

interface MedicineSearchHit {
  id: string;
  name: string;
  manufacturer: string | null;
  sale_unit_mode: string | null;
  units_per_pack: number | null;
  gst_rate: number | null;
  barcode: string | null;
}

interface PharmacyProfile {
  state: string | null;
  gstin: string | null;
}

const newEmptyLine = (): PurchaseLineItem => ({
  id: crypto.randomUUID(),
  medicine_id: null,
  medicine_name: '',
  batch_number: '',
  expiry_date: '',
  quantity: 1,
  free_quantity: 0,
  purchase_rate: 0,
  mrp: 0,
  selling_price: 0,
  gst_percentage: 12,
  discount_percentage: 0,
  sale_unit_mode: 'pack_only',
  units_per_pack: 1,
  barcode: '',
  original_barcode: '',
});

export default function ManualPurchaseEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  // ── Pharmacy profile (for inter-state GST detection) ──
  const [pharmacyProfile, setPharmacyProfile] = useState<PharmacyProfile>({ state: null, gstin: null });

  // ── Supplier ──
  const [supplierQuery, setSupplierQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // ── Bill ──
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');

  // ── Lines ──
  const [lines, setLines] = useState<PurchaseLineItem[]>([newEmptyLine()]);

  // ── Save / duplicate ──
  const [saving, setSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    purchase_id: string; bill_number: string; total_amount: number; bill_date: string;
  } | null>(null);
  const [forceOverride, setForceOverride] = useState(false);

  // ── CSV import ──
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvSummary, setCsvSummary] = useState<{ total: number; matched: number } | null>(null);

  // ── Modals ──
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [medicineModal, setMedicineModal] = useState<{ lineId: string; name: string } | null>(null);

  /* ─── Load suppliers ─── */
  const loadSuppliers = useCallback(async () => {
    if (!pharmacyId) return;
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name, phone, gstin, address, city, state')
      .eq('pharmacy_id', pharmacyId)
      .order('name')
      .limit(500);
    if (!error && data) {
      setSuppliers(data as Supplier[]);
    }
  }, [pharmacyId, supabase]);

  /* ─── Load pharmacy profile for state/GSTIN ─── */
  useEffect(() => {
    if (!pharmacyId) return;
    (async () => {
      const { data } = await supabase
        .from('pharmacies')
        .select('state, gstin')
        .eq('id', pharmacyId)
        .maybeSingle();
      if (data) setPharmacyProfile({ state: data.state ?? null, gstin: data.gstin ?? null });
    })();
  }, [pharmacyId, supabase]);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  /* ─── Inter-state detection ─── */
  const interState = isInterState(
    selectedSupplier?.state,
    pharmacyProfile.state,
    selectedSupplier?.gstin,
    pharmacyProfile.gstin
  );

  /* ─── Line helpers ─── */
  const updateLine = (id: string, patch: Partial<PurchaseLineItem>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLine = (id: string) => {
    setLines((prev) => {
      const filtered = prev.filter((l) => l.id !== id);
      return filtered.length > 0 ? filtered : [newEmptyLine()];
    });
  };

  const addEmptyLine = () => {
    setLines((prev) => [...prev, newEmptyLine()]);
  };

  const linkMedicineToLine = (lineId: string, med: MedicineSearchHit) => {
    setLines((prev) => prev.map((l) => l.id === lineId
      ? {
          ...l,
          medicine_id: med.id,
          medicine_name: med.name,
          sale_unit_mode: med.sale_unit_mode ?? 'pack_only',
          units_per_pack: med.units_per_pack ?? 1,
          barcode: med.barcode ?? '',
          original_barcode: med.barcode ?? '',
          gst_percentage: l.gst_percentage > 0 ? l.gst_percentage : (med.gst_rate ?? 12),
        }
      : l
    ));
  };

  /* ─── CSV import ─── */
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!pharmacyId) {
      toast.error('No pharmacy selected.');
      return;
    }

    setCsvImporting(true);
    setCsvSummary(null);
    const importToast = toast.loading(`Parsing ${file.name}…`);

    try {
      const text = await file.text();
      const result = parsePurchaseCsv(text);

      if (result.items.length === 0) {
        toast.error(result.warnings[0] || 'No valid rows found in CSV.', { id: importToast });
        return;
      }

      // Auto-fill bill header
      if (result.header.billNumber) setBillNumber(result.header.billNumber);
      if (result.header.billDate) setBillDate(result.header.billDate);

      // Auto-match supplier
      if (result.header.partyName) {
        const partyLower = result.header.partyName.toLowerCase().trim();
        const exact = suppliers.find((s) => s.name.toLowerCase().trim() === partyLower);
        const partial = !exact ? suppliers.find((s) => s.name.toLowerCase().includes(partyLower) || partyLower.includes(s.name.toLowerCase())) : null;
        const match = exact || partial;
        if (match) {
          setSelectedSupplier({ ...match, gstin: match.gstin || result.header.gstNumber || null });
          setSupplierQuery(match.name);
        } else {
          setSupplierQuery(result.header.partyName);
        }
      }

      // Pre-load all medicines for matching
      const { data: meds } = await supabase
        .from('medicines')
        .select('id, name, barcode, sale_unit_mode, units_per_pack, gst_rate, manufacturer')
        .eq('pharmacy_id', pharmacyId)
        .limit(5000);

      const medsByBarcode = new Map<string, MedicineSearchHit>();
      const medsByNameLower = new Map<string, MedicineSearchHit>();
      (meds || []).forEach((m: any) => {
        const hit: MedicineSearchHit = {
          id: m.id, name: m.name, manufacturer: m.manufacturer,
          sale_unit_mode: m.sale_unit_mode, units_per_pack: m.units_per_pack,
          gst_rate: m.gst_rate, barcode: m.barcode,
        };
        if (m.barcode) medsByBarcode.set(String(m.barcode).trim(), hit);
        if (m.name) medsByNameLower.set(m.name.toLowerCase().trim(), hit);
      });

      let matched = 0;
      const newLines: PurchaseLineItem[] = result.items.map((row) => {
        const line: PurchaseLineItem = {
          id: crypto.randomUUID(),
          medicine_id: null,
          medicine_name: row.productName,
          batch_number: row.batchNumber,
          expiry_date: row.expiryDate,
          quantity: row.quantity || 1,
          free_quantity: row.freeQuantity,
          purchase_rate: row.ptr,
          mrp: row.mrp,
          selling_price: 0,
          gst_percentage: row.gstPercentage || 12,
          discount_percentage: row.discountPercentage,
          sale_unit_mode: 'pack_only',
          units_per_pack: 1,
          barcode: row.barcode,
          original_barcode: '',
        };

        let med = row.barcode ? medsByBarcode.get(row.barcode.trim()) : undefined;
        if (!med) med = medsByNameLower.get(row.productName.toLowerCase().trim());
        if (!med && row.productName.length >= 4) {
          const prefix = row.productName.toLowerCase().trim().substring(0, 10);
          for (const [nameLower, candidate] of medsByNameLower) {
            if (nameLower.startsWith(prefix)) { med = candidate; break; }
          }
        }

        if (med) {
          line.medicine_id = med.id;
          line.medicine_name = med.name;
          line.sale_unit_mode = med.sale_unit_mode ?? 'pack_only';
          line.units_per_pack = med.units_per_pack ?? 1;
          line.original_barcode = med.barcode ?? '';
          if (!row.gstPercentage && med.gst_rate) line.gst_percentage = med.gst_rate;
          matched++;
        }

        return line;
      });

      setLines(newLines.length > 0 ? newLines : [newEmptyLine()]);
      setCsvSummary({ total: result.items.length, matched });

      const warnSuffix = result.warnings.length > 0 ? ` (${result.warnings.length} warning${result.warnings.length > 1 ? 's' : ''})` : '';
      toast.success(
        `Imported ${result.items.length} item${result.items.length > 1 ? 's' : ''} · ${matched} auto-matched${warnSuffix}`,
        { id: importToast, duration: 4000 }
      );
    } catch (err: any) {
      console.error('CSV import failed:', err);
      toast.error(`Failed to parse CSV: ${err?.message || 'Unknown error'}`, { id: importToast });
    } finally {
      setCsvImporting(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  /* ─── Save purchase ─── */
  const handleSave = async () => {
    if (!pharmacyId) { toast.error('No pharmacy selected.'); return; }
    if (!selectedSupplier) { toast.error('Please select a supplier.'); return; }
    if (!billNumber.trim()) { toast.error('Bill number is required.'); return; }

    const realLines = lines.filter((l) => l.medicine_name.trim().length > 0);
    if (realLines.length === 0) { toast.error('Please add at least one item.'); return; }

    const unlinked = realLines.filter((l) => !l.medicine_id);
    if (unlinked.length > 0) {
      toast.error(`${unlinked.length} item(s) not linked to a medicine. Search and link, or use "Add as New Medicine".`);
      return;
    }

    // Duplicate check
    if (!forceOverride) {
      try {
        const { data: dup } = await supabase
          .from('purchases')
          .select('id, bill_number, total_amount, bill_date')
          .eq('pharmacy_id', pharmacyId)
          .eq('supplier_id', selectedSupplier.id)
          .eq('bill_number', billNumber.trim())
          .maybeSingle();
        if (dup) {
          setDuplicateWarning({
            purchase_id: String(dup.id),
            bill_number: dup.bill_number,
            total_amount: Number(dup.total_amount) || 0,
            bill_date: dup.bill_date,
          });
          return;
        }
      } catch {
        // If check fails, proceed
      }
    }

    setSaving(true);
    setDuplicateWarning(null);
    setForceOverride(false);

    try {
      // Compute totals
      const lineTotals = realLines.map((l) => {
        const base = l.purchase_rate * l.quantity;
        const disc = base * (l.discount_percentage / 100);
        const taxable = base - disc;
        const gst = taxable * (l.gst_percentage / 100);
        return { base, disc, taxable, gst, total: taxable + gst };
      });
      const subtotal = lineTotals.reduce((s, r) => s + r.base, 0);
      const discountTotal = lineTotals.reduce((s, r) => s + r.disc, 0);
      const gstTotal = lineTotals.reduce((s, r) => s + r.gst, 0);
      const totalAmount = lineTotals.reduce((s, r) => s + r.total, 0);

      // Insert purchase header
      const { data: pur, error: pe } = await supabase
        .from('purchases')
        .insert({
          pharmacy_id: pharmacyId,
          supplier_id: selectedSupplier.id,
          bill_number: billNumber.trim(),
          bill_date: billDate,
          subtotal,
          gst_amount: gstTotal,
          discount_amount: discountTotal > 0 ? discountTotal : null,
          total_amount: totalAmount,
          payment_status: paymentStatus,
          paid_amount: paymentStatus === 'paid' ? totalAmount : (paymentStatus === 'partial' ? paidAmount : 0),
          is_ai_scanned: false,
          notes: notes.trim() || null,
        })
        .select('id')
        .single();
      if (pe) throw pe;

      // Insert items + batches + inventory transactions
      for (let i = 0; i < realLines.length; i++) {
        const l = realLines[i];
        const totals = lineTotals[i];
        const isFlex = l.sale_unit_mode === 'both' && l.units_per_pack > 1;
        const storeQty = isFlex ? l.quantity * l.units_per_pack : l.quantity;
        const storeFreeQty = isFlex && l.free_quantity > 0 ? l.free_quantity * l.units_per_pack : l.free_quantity;
        const totalStockQty = storeQty + storeFreeQty;

        const batchNum = l.batch_number.trim() || `MANUAL-${Date.now()}-${i}`;
        const expiry = l.expiry_date || `${new Date().getFullYear() + 1}-12-31`;

        const { data: piRow, error: piErr } = await supabase.from('purchase_items').insert({
          purchase_id: pur.id,
          medicine_id: l.medicine_id,
          batch_number: batchNum,
          expiry_date: expiry,
          quantity: storeQty,
          free_quantity: storeFreeQty,
          purchase_price: l.purchase_rate,
          mrp: l.mrp,
          gst_rate: l.gst_percentage,
          discount_percent: l.discount_percentage,
          total_amount: totals.total,
        }).select('id').single();
        if (piErr) throw piErr;

        const { data: batch } = await supabase
          .from('batches')
          .insert({
            pharmacy_id: pharmacyId,
            medicine_id: l.medicine_id,
            supplier_id: selectedSupplier.id,
            purchase_item_id: piRow?.id ?? null,
            batch_number: batchNum,
            expiry_date: expiry,
            purchase_price: l.purchase_rate,
            mrp: l.mrp,
            stock_quantity: totalStockQty,
          })
          .select('id')
          .single();

        if (batch) {
          await supabase.from('inventory_transactions').insert({
            pharmacy_id: pharmacyId,
            batch_id: batch.id,
            medicine_id: l.medicine_id,
            transaction_type: 'purchase',
            reference_type: 'purchase',
            reference_id: pur.id,
            quantity_change: totalStockQty,
            quantity_after: totalStockQty,
          });
        }

        // Update barcode on the medicine if it changed
        if (l.barcode.trim() && l.barcode.trim() !== l.original_barcode.trim()) {
          await supabase.from('medicines').update({ barcode: l.barcode.trim() }).eq('id', l.medicine_id);
        }
      }

      // Persist edited supplier metadata (best-effort)
      if (selectedSupplier) {
        await supabase
          .from('suppliers')
          .update({
            gstin: selectedSupplier.gstin || null,
            phone: selectedSupplier.phone || null,
            city: selectedSupplier.city || null,
            state: selectedSupplier.state || null,
          })
          .eq('id', selectedSupplier.id);
      }

      toast.success('Purchase saved!');
      router.push('/panel/purchases');
    } catch (err: any) {
      console.error('Save failed:', err);
      toast.error(err?.message || 'Failed to save purchase.');
    } finally {
      setSaving(false);
    }
  };

  // Auto-trigger save once forceOverride is set after duplicate dialog
  useEffect(() => {
    if (forceOverride) {
      // microtask so latest state is in
      Promise.resolve().then(() => handleSave());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceOverride]);

  // ── Load PO if ?poId= provided ──
  useEffect(() => {
    const poIdStr = searchParams.get('poId');
    if (!poIdStr || !pharmacyId) return;
    (async () => {
      try {
        const { data: po } = await supabase
          .from('purchase_orders')
          .select('id, supplier_id, suppliers(id, name, phone, gstin, address, city, state)')
          .eq('id', poIdStr)
          .maybeSingle();
        if (po && (po as any).suppliers) {
          const sup = (po as any).suppliers as Supplier;
          setSelectedSupplier(sup);
          setSupplierQuery(sup.name);
        }
        const { data: items } = await supabase
          .from('purchase_order_items')
          .select('medicine_id, requested_quantity, medicines(id, name, barcode, sale_unit_mode, units_per_pack, gst_rate)')
          .eq('purchase_order_id', poIdStr);
        if (items && items.length > 0) {
          const loaded: PurchaseLineItem[] = items.map((it: any) => {
            const m = it.medicines || {};
            return {
              ...newEmptyLine(),
              medicine_id: it.medicine_id,
              medicine_name: m.name || '',
              quantity: it.requested_quantity || 1,
              sale_unit_mode: m.sale_unit_mode ?? 'pack_only',
              units_per_pack: m.units_per_pack ?? 1,
              gst_percentage: m.gst_rate ?? 12,
              barcode: m.barcode ?? '',
              original_barcode: m.barcode ?? '',
            };
          });
          setLines(loaded);
        }
      } catch (err) {
        console.warn('Failed to load PO:', err);
      }
    })();
  }, [pharmacyId, searchParams, supabase]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: -10 }}>
      {/* Hidden CSV input */}
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={handleCsvUpload}
        disabled={csvImporting}
      />

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${C.cardBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => router.push('/panel/purchases')}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'transparent', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>Manual Entry</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Enter invoice details from a physical bill</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => csvInputRef.current?.click()}
            disabled={csvImporting}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 10,
              border: `1px solid rgba(16,185,129,0.3)`,
              backgroundColor: 'rgba(16,185,129,0.1)',
              color: '#10b981', fontSize: 13, fontWeight: 700,
              cursor: csvImporting ? 'not-allowed' : 'pointer',
              opacity: csvImporting ? 0.6 : 1, transition: 'all 0.2s',
            }}
          >
            {csvImporting
              ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} /> Importing…</>
              : <><Upload style={{ width: 14, height: 14 }} /> Upload CSV</>}
          </button>
        </div>
      </div>

      {/* Duplicate dialog */}
      {duplicateWarning && (
        <div style={{
          padding: 16, backgroundColor: 'rgba(245,158,11,0.1)',
          border: `1px solid ${C.warning}`, borderRadius: 12,
          marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle style={{ color: C.warning, width: 20, height: 20, flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, color: C.warning, fontSize: 14, fontWeight: 700 }}>Duplicate Invoice Detected</h4>
              <p style={{ margin: '4px 0 0', color: C.text, fontSize: 13 }}>
                Invoice <span style={{ fontWeight: 800 }}>#{duplicateWarning.bill_number}</span> from this supplier was already added on{' '}
                <span style={{ fontWeight: 800 }}>{duplicateWarning.bill_date}</span> with amount{' '}
                <span style={{ fontWeight: 800 }}>₹{duplicateWarning.total_amount.toFixed(2)}</span>.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => router.push(`/panel/purchases/${duplicateWarning.purchase_id}`)}
              style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.15)', color: C.primaryLight, border: `1px solid rgba(99,102,241,0.3)`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              View Existing
            </button>
            <button
              onClick={() => setDuplicateWarning(null)}
              style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', color: C.muted, border: `1px solid ${C.cardBorder}`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={() => { setDuplicateWarning(null); setForceOverride(true); }}
              style={{ padding: '8px 14px', borderRadius: 8, background: C.warning, color: '#000', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              Save Anyway
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 20, alignItems: 'start', paddingBottom: 24 }}>
        {/* Left sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SupplierDetails
            supplier={selectedSupplier}
            supplierQuery={supplierQuery}
            setSupplierQuery={setSupplierQuery}
            suppliers={suppliers}
            onSelectSupplier={setSelectedSupplier}
            onUpdateSupplierField={(patch) => setSelectedSupplier((s) => s ? { ...s, ...patch } : s)}
            billNumber={billNumber}
            setBillNumber={setBillNumber}
            billDate={billDate}
            setBillDate={setBillDate}
            paymentStatus={paymentStatus}
            setPaymentStatus={setPaymentStatus}
            paidAmount={paidAmount}
            setPaidAmount={setPaidAmount}
            notes={notes}
            setNotes={setNotes}
            onQuickAdd={() => setSupplierModalOpen(true)}
          />
          <PurchaseTotals lines={lines} interState={interState} />
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px', borderRadius: 12, border: 'none',
              backgroundColor: C.primary, color: '#fff',
              fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {saving
              ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} /> Saving…</>
              : <><PackagePlus style={{ width: 16, height: 16 }} /> Save Purchase</>}
          </button>
        </div>

        {/* Right content */}
        <div>
          <PurchaseGrid
            pharmacyId={pharmacyId}
            lines={lines}
            onUpdateLine={updateLine}
            onRemoveLine={removeLine}
            onAddEmpty={addEmptyLine}
            onLinkMedicine={linkMedicineToLine}
            onOpenAddMedicine={(lineId, name) => setMedicineModal({ lineId, name })}
            csvSummary={csvSummary}
            onDismissCsvSummary={() => setCsvSummary(null)}
          />
        </div>
      </div>

      {/* Modals */}
      <QuickAddSupplierModal
        open={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        pharmacyId={pharmacyId || ''}
        initialName={supplierQuery}
        onCreated={(s) => {
          setSuppliers((prev) => [...prev, s].sort((a, b) => a.name.localeCompare(b.name)));
          setSelectedSupplier(s);
          setSupplierQuery(s.name);
        }}
      />

      {medicineModal && pharmacyId && (
        <QuickAddMedicineModal
          open={true}
          onClose={() => setMedicineModal(null)}
          pharmacyId={pharmacyId}
          initialName={medicineModal.name}
          suggestedGst={lines.find((l) => l.id === medicineModal.lineId)?.gst_percentage ?? null}
          initialSupplier={selectedSupplier}
          onCreated={(med: QuickAddMedicineResult) => {
            linkMedicineToLine(medicineModal.lineId, {
              id: med.id,
              name: med.name,
              manufacturer: null,
              sale_unit_mode: med.sale_unit_mode,
              units_per_pack: med.units_per_pack,
              gst_rate: med.gst_rate,
              barcode: med.barcode,
            });
            setMedicineModal(null);
          }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
