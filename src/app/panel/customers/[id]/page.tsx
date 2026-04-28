'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { usePosCartStore } from '@/store/posCartStore';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import {
  User, ChevronLeft, Phone, Mail, MapPin, Wallet,
  Loader2, AlertCircle, CheckCircle2, IndianRupee,
  Receipt, Clock, Trash2, TrendingDown, RotateCcw, CreditCard,
  ArrowDownLeft, ArrowUpRight, Search, CalendarDays,
  Pencil, Save, X, Activity, Plus, Search as SearchIcon,
} from 'lucide-react';

/* ─── Palette (dark, matches rest of panel) ─── */
const C = {
  bg: '#020617',
  card: '#0B1121',
  cardSoft: 'rgba(255,255,255,0.02)',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc',
  textSoft: '#cbd5e1',
  muted: '#94a3b8',
  mutedDim: '#64748b',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  inputBg: 'rgba(255,255,255,0.03)',
  inputBorder: 'rgba(255,255,255,0.08)',
};

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  state: string | null;
  customer_type: string | null;
  credit_limit: number | null;
  credit_days: number | null;
  outstanding_balance: number;
  total_purchases: number;
  created_at: string;
}

interface LedgerEntry {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

interface SaleRow {
  id: string;
  bill_number: string;
  bill_date: string;
  payment_method: string;
  payment_status: string;
  total_amount: number;
  paid_amount: number;
  net_amount: number | null;
}

interface ReturnRow {
  id: string;
  return_number: string;
  return_date: string;
  refund_method: string;
  total_amount: number;
  sale_id: string | null;
  sale_bill_number: string | null;
}

interface RegularMed {
  id: string;
  medicine_id: string;
  name: string;
  manufacturer: string | null;
  salt_composition: string | null;
  sale_unit_mode: string | null;
  units_per_pack: number | null;
  gst_rate: number | null;
}

interface BillItemLite {
  medicine_id: string;
  medicine_name: string;
  manufacturer: string | null;
  sale_unit_mode: string | null;
  units_per_pack: number | null;
  gst_rate: number | null;
  quantity: number;
  selling_unit: string;
  unit_price: number;
}

interface MedSearchHit {
  id: string;
  name: string;
  manufacturer: string | null;
  salt_composition: string | null;
  sale_unit_mode: string | null;
  units_per_pack: number | null;
  gst_rate: number | null;
}

const PAYMENT_METHODS = ['cash', 'upi', 'card', 'bank_transfer', 'cheque'];

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(true);

  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [salesSearch, setSalesSearch] = useState('');
  const [salesDate, setSalesDate] = useState('');
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [billItems, setBillItems] = useState<Record<string, BillItemLite[]>>({});
  const [loadingBillId, setLoadingBillId] = useState<string | null>(null);

  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(true);
  const [returnsSearch, setReturnsSearch] = useState('');
  const [returnsDate, setReturnsDate] = useState('');

  const [regulars, setRegulars] = useState<RegularMed[]>([]);
  const [loadingRegulars, setLoadingRegulars] = useState(true);
  const [regSearch, setRegSearch] = useState('');
  const [regResults, setRegResults] = useState<MedSearchHit[]>([]);
  const [searchingReg, setSearchingReg] = useState(false);

  const [showPay, setShowPay] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Per-bill payment modal — independent from the global "Record Payment" modal
  const [payBill, setPayBill] = useState<SaleRow | null>(null);
  const [billPayAmount, setBillPayAmount] = useState('');
  const [billPayMethod, setBillPayMethod] = useState('cash');
  const [billPayNote, setBillPayNote] = useState('');
  const [billPaying, setBillPaying] = useState(false);
  const [billPayError, setBillPayError] = useState<string | null>(null);

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Customer> | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const hasDebt = (customer?.outstanding_balance ?? 0) > 0.01;

  /* ─── Load customer ─── */
  const loadCustomer = useCallback(async () => {
    if (!pharmacyId || !customerId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone, email, address, gstin, state, customer_type, credit_limit, credit_days, outstanding_balance, total_purchases, created_at')
      .eq('pharmacy_id', pharmacyId)
      .eq('id', customerId)
      .maybeSingle();
    if (error || !data) {
      toast.error('Customer not found');
      router.push('/panel/customers');
      return;
    }
    setCustomer({
      ...data,
      outstanding_balance: Number(data.outstanding_balance) || 0,
      total_purchases: Number(data.total_purchases) || 0,
    });
    setLoading(false);
  }, [pharmacyId, customerId, supabase, router]);

  /* ─── Load ledger ─── */
  const loadLedger = useCallback(async () => {
    if (!pharmacyId || !customerId) return;
    setLoadingLedger(true);
    const { data } = await supabase
      .from('customer_ledger')
      .select('id, transaction_type, amount, balance_after, payment_method, notes, created_at')
      .eq('pharmacy_id', pharmacyId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(60);
    setLedger((data || []).map((l: any) => ({
      ...l,
      amount: Number(l.amount) || 0,
      balance_after: Number(l.balance_after) || 0,
    })));
    setLoadingLedger(false);
  }, [pharmacyId, customerId, supabase]);

  /* ─── Load sales ─── */
  const loadSales = useCallback(async () => {
    if (!pharmacyId || !customerId) return;
    setLoadingSales(true);
    const { data } = await supabase
      .from('sales')
      .select('id, bill_number, bill_date, payment_method, payment_status, total_amount, paid_amount, net_amount')
      .eq('pharmacy_id', pharmacyId)
      .eq('customer_id', customerId)
      .order('bill_date', { ascending: false })
      .limit(100);
    setSales((data || []).map((s: any) => ({
      ...s,
      id: String(s.id),
      total_amount: Number(s.total_amount) || 0,
      paid_amount: Number(s.paid_amount) || 0,
      net_amount: s.net_amount != null ? Number(s.net_amount) : null,
    })));
    setLoadingSales(false);
  }, [pharmacyId, customerId, supabase]);

  /* ─── Load returns ─── */
  const loadReturns = useCallback(async () => {
    if (!pharmacyId || !customerId) return;
    setLoadingReturns(true);
    const { data } = await supabase
      .from('sale_returns')
      .select('id, return_number, return_date, refund_method, total_amount, sale_id, sales(bill_number)')
      .eq('pharmacy_id', pharmacyId)
      .eq('customer_id', customerId)
      .order('return_date', { ascending: false })
      .limit(100);
    setReturns((data || []).map((r: any) => ({
      id: String(r.id),
      return_number: r.return_number,
      return_date: r.return_date,
      refund_method: r.refund_method,
      total_amount: Number(r.total_amount) || 0,
      sale_id: r.sale_id ? String(r.sale_id) : null,
      sale_bill_number: r.sales?.bill_number ?? null,
    })));
    setLoadingReturns(false);
  }, [pharmacyId, customerId, supabase]);

  /* ─── Load regulars ─── */
  const loadRegulars = useCallback(async () => {
    if (!pharmacyId || !customerId) return;
    setLoadingRegulars(true);
    const { data } = await supabase
      .from('customer_regulars')
      .select('id, medicine_id, medicines(id, name, manufacturer, salt_composition, sale_unit_mode, units_per_pack, gst_rate)')
      .eq('pharmacy_id', pharmacyId)
      .eq('customer_id', customerId);
    setRegulars((data || []).map((r: any) => ({
      id: String(r.id),
      medicine_id: String(r.medicine_id),
      name: r.medicines?.name ?? '—',
      manufacturer: r.medicines?.manufacturer ?? null,
      salt_composition: r.medicines?.salt_composition ?? null,
      sale_unit_mode: r.medicines?.sale_unit_mode ?? null,
      units_per_pack: r.medicines?.units_per_pack ?? null,
      gst_rate: r.medicines?.gst_rate ?? null,
    })));
    setLoadingRegulars(false);
  }, [pharmacyId, customerId, supabase]);

  useEffect(() => {
    loadCustomer();
    loadLedger();
    loadSales();
    loadReturns();
    loadRegulars();
  }, [loadCustomer, loadLedger, loadSales, loadReturns, loadRegulars]);

  /* ─── Regular medicine search ─── */
  useEffect(() => {
    if (!pharmacyId || regSearch.trim().length < 2) { setRegResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingReg(true);
      const { data } = await supabase
        .from('medicines')
        .select('id, name, manufacturer, salt_composition, sale_unit_mode, units_per_pack, gst_rate')
        .eq('pharmacy_id', pharmacyId)
        .ilike('name', `%${regSearch.trim()}%`)
        .limit(8);
      setRegResults((data || []).map((m: any) => ({
        id: String(m.id), name: m.name, manufacturer: m.manufacturer,
        salt_composition: m.salt_composition, sale_unit_mode: m.sale_unit_mode,
        units_per_pack: m.units_per_pack, gst_rate: m.gst_rate,
      })));
      setSearchingReg(false);
    }, 250);
    return () => clearTimeout(t);
  }, [regSearch, pharmacyId, supabase]);

  async function addRegular(m: MedSearchHit) {
    if (!pharmacyId) return;
    if (regulars.some((r) => r.medicine_id === m.id)) {
      toast('Already in routine'); setRegSearch(''); setRegResults([]); return;
    }
    const { error } = await supabase
      .from('customer_regulars')
      .insert({ pharmacy_id: pharmacyId, customer_id: customerId, medicine_id: m.id });
    if (error) { toast.error(error.message); return; }
    setRegSearch(''); setRegResults([]);
    loadRegulars();
  }

  async function removeRegular(rowId: string) {
    if (!pharmacyId) return;
    const { error } = await supabase.from('customer_regulars').delete().eq('id', rowId);
    if (error) { toast.error(error.message); return; }
    loadRegulars();
  }

  /* ─── Toggle bill expansion + load items ─── */
  async function toggleBill(saleId: string) {
    if (expandedBillId === saleId) { setExpandedBillId(null); return; }
    setExpandedBillId(saleId);
    if (billItems[saleId] || !pharmacyId) return;
    setLoadingBillId(saleId);
    const { data } = await supabase
      .from('sale_items')
      .select('medicine_id, quantity, selling_unit, unit_price, medicines(name, manufacturer, sale_unit_mode, units_per_pack, gst_rate)')
      .eq('pharmacy_id', pharmacyId)
      .eq('sale_id', saleId);
    const items: BillItemLite[] = (data || []).map((it: any) => ({
      medicine_id: String(it.medicine_id),
      medicine_name: it.medicines?.name ?? '—',
      manufacturer: it.medicines?.manufacturer ?? null,
      sale_unit_mode: it.medicines?.sale_unit_mode ?? null,
      units_per_pack: it.medicines?.units_per_pack ?? null,
      gst_rate: it.medicines?.gst_rate ?? null,
      quantity: Number(it.quantity) || 0,
      selling_unit: it.selling_unit ?? 'unit',
      unit_price: Number(it.unit_price) || 0,
    }));
    setBillItems((prev) => ({ ...prev, [saleId]: items }));
    setLoadingBillId(null);
  }

  /* ─── Add bill item to POS cart ─── */
  async function addBillItemToPos(it: BillItemLite) {
    if (!pharmacyId) return;
    const { data: batches } = await supabase
      .from('batches')
      .select('id, batch_number, expiry_date, stock_quantity, mrp, purchase_price, selling_price')
      .eq('pharmacy_id', pharmacyId)
      .eq('medicine_id', it.medicine_id)
      .gt('stock_quantity', 0)
      .order('expiry_date', { ascending: true })
      .limit(1);
    if (!batches || batches.length === 0) {
      toast.error(`No stock available for ${it.medicine_name}`);
      return;
    }
    const b = batches[0];
    const upp = it.units_per_pack || 1;
    const isFlexible = it.sale_unit_mode === 'both' && upp > 1;
    const basePrice = b.selling_price ?? b.mrp;
    let stripQ = 0, unitQ = 0, qty = it.quantity, sellingUnit: 'pack' | 'unit' | 'both' = 'unit';
    let amount = 0;
    if (isFlexible) {
      sellingUnit = 'both';
      if (it.selling_unit === 'unit') {
        unitQ = it.quantity; stripQ = 0;
        amount = (basePrice / upp) * it.quantity;
      } else {
        stripQ = it.quantity; unitQ = 0; qty = it.quantity * upp;
        amount = basePrice * it.quantity;
      }
    } else {
      sellingUnit = it.sale_unit_mode === 'pack_only' ? 'pack' : 'unit';
      amount = basePrice * qty;
    }
    usePosCartStore.getState().addItem({
      medicine: {
        id: it.medicine_id, name: it.medicine_name, generic_name: null,
        manufacturer: it.manufacturer, salt_composition: null, strength: null,
        dosage_form: null, pack_size: null, pack_unit: null,
        sale_unit_mode: it.sale_unit_mode, units_per_pack: it.units_per_pack,
        rack_location: null, gst_rate: it.gst_rate, barcode: null,
      },
      batch: {
        id: String(b.id), batch_number: b.batch_number, expiry_date: b.expiry_date,
        stock_quantity: Number(b.stock_quantity), mrp: Number(b.mrp),
        purchase_price: b.purchase_price != null ? Number(b.purchase_price) : null,
        selling_price: b.selling_price != null ? Number(b.selling_price) : null,
      },
      selling_unit: sellingUnit,
      quantity: qty, effective_qty: qty, mrp: basePrice,
      strip_qty: stripQ, unit_qty: unitQ,
      discount_percentage: 0, gst_percentage: it.gst_rate || 0,
      amount,
      taxable_amount: amount,
      cgst_percentage: 0, sgst_percentage: 0, igst_percentage: 0,
      cgst_amount: 0, sgst_amount: 0, igst_amount: 0,
    });
    if (!usePosCartStore.getState().customerId && customer) {
      usePosCartStore.getState().setCustomer(
        customer.id, customer.name, customer.phone,
        customer.credit_limit, customer.outstanding_balance,
        customer.state, customer.gstin,
      );
    }
    toast.success(`Added ${it.medicine_name}`);
  }

  /* ─── Record payment ─── */
  async function handlePayment() {
    if (!customer || !pharmacyId) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) { setPayError('Enter a valid amount'); return; }
    if (amt > customer.outstanding_balance + 0.01) { setPayError('Amount exceeds outstanding balance'); return; }
    setPaying(true); setPayError(null);
    try {
      const newBal = Math.max(0, customer.outstanding_balance - amt);
      const { error: ledgerErr } = await supabase.from('customer_ledger').insert({
        pharmacy_id: pharmacyId,
        customer_id: customerId,
        transaction_type: 'payment',
        amount: amt,
        balance_after: newBal,
        payment_method: payMethod,
        notes: payNote.trim() || null,
      });
      if (ledgerErr) throw ledgerErr;
      const { error: updErr } = await supabase
        .from('customers')
        .update({ outstanding_balance: newBal })
        .eq('id', customerId)
        .eq('pharmacy_id', pharmacyId);
      if (updErr) throw updErr;
      toast.success('Payment recorded');
      setShowPay(false); setPayAmount(''); setPayNote(''); setPayMethod('cash');
      loadCustomer(); loadLedger();
    } catch (e: any) {
      setPayError(e?.message || 'Failed to record payment');
    } finally {
      setPaying(false);
    }
  }

  function openBillPay(s: SaleRow) {
    const due = computeBillDue(s);
    setPayBill(s);
    setBillPayAmount(due.toFixed(2));
    setBillPayMethod('cash');
    setBillPayNote('');
    setBillPayError(null);
  }

  async function handleBillPayment() {
    if (!payBill || !customer || !pharmacyId) return;
    const due = computeBillDue(payBill);
    const amt = Number(billPayAmount);
    if (!amt || amt <= 0) { setBillPayError('Enter a valid amount'); return; }
    if (amt > due + 0.01) { setBillPayError(`Amount exceeds credit due (${formatCurrency(due)})`); return; }
    setBillPaying(true); setBillPayError(null);
    try {
      const newPaid = +(payBill.paid_amount + amt).toFixed(2);
      const newDue = +(due - amt).toFixed(2);
      const newStatus = newDue <= 0.01 ? 'paid' : 'partial';

      // 1. Update sale
      const { error: sErr } = await supabase
        .from('sales')
        .update({ paid_amount: newPaid, payment_status: newStatus })
        .eq('id', payBill.id)
        .eq('pharmacy_id', pharmacyId);
      if (sErr) throw sErr;

      // 2. Customer outstanding + ledger
      const newBal = Math.max(0, +(customer.outstanding_balance - amt).toFixed(2));
      const { error: lErr } = await supabase.from('customer_ledger').insert({
        pharmacy_id: pharmacyId,
        customer_id: customerId,
        transaction_type: 'payment',
        amount: amt,
        balance_after: newBal,
        payment_method: billPayMethod,
        notes: billPayNote.trim()
          ? `Bill #${payBill.bill_number} · ${billPayNote.trim()}`
          : `Payment for bill #${payBill.bill_number}`,
        reference_type: 'sale',
        reference_id: payBill.id,
      });
      if (lErr) throw lErr;
      const { error: cErr } = await supabase
        .from('customers')
        .update({ outstanding_balance: newBal })
        .eq('id', customerId)
        .eq('pharmacy_id', pharmacyId);
      if (cErr) throw cErr;

      toast.success(newDue <= 0.01 ? 'Bill fully paid' : `${formatCurrency(amt)} recorded`);
      setPayBill(null);
      loadCustomer(); loadLedger(); loadSales();
    } catch (e: any) {
      setBillPayError(e?.message || 'Failed to record payment');
    } finally {
      setBillPaying(false);
    }
  }

  function computeBillDue(s: SaleRow): number {
    const net = s.net_amount ?? s.total_amount;
    return Math.max(0, +(net - (s.paid_amount || 0)).toFixed(2));
  }

  /* ─── Edit ─── */
  function openEdit() {
    if (!customer) return;
    setEditForm({ ...customer });
    setEditError(null);
    setShowEdit(true);
  }

  async function handleSaveEdit() {
    if (!editForm || !pharmacyId) return;
    if (!editForm.name?.trim()) { setEditError('Name is required'); return; }
    if (!editForm.phone?.trim()) { setEditError('Phone is required'); return; }
    setSavingEdit(true); setEditError(null);
    const { error } = await supabase
      .from('customers')
      .update({
        name: editForm.name?.trim(),
        phone: editForm.phone?.trim() || null,
        email: editForm.email?.trim() || null,
        address: editForm.address?.trim() || null,
        gstin: editForm.gstin?.trim().toUpperCase() || null,
        state: editForm.state?.trim() || null,
        customer_type: editForm.customer_type || 'b2c',
        credit_limit: editForm.credit_limit ?? null,
        credit_days: editForm.credit_days ?? null,
      })
      .eq('id', customerId)
      .eq('pharmacy_id', pharmacyId);
    setSavingEdit(false);
    if (error) { setEditError(error.message); return; }
    toast.success('Customer updated');
    setShowEdit(false);
    loadCustomer();
  }

  /* ─── Delete ─── */
  async function handleDelete() {
    if (!pharmacyId) return;
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .eq('pharmacy_id', pharmacyId);
    if (error) { toast.error(error.message); setDeleteConfirm(false); return; }
    toast.success('Customer deleted');
    router.push('/panel/customers');
  }

  /* ─── Filters ─── */
  const filteredSales = useMemo(() => sales.filter((s) => {
    const okBill = !salesSearch.trim() || s.bill_number.toLowerCase().includes(salesSearch.toLowerCase());
    const okDate = !salesDate || s.bill_date.startsWith(salesDate);
    return okBill && okDate;
  }), [sales, salesSearch, salesDate]);

  const filteredReturns = useMemo(() => returns.filter((r) => {
    const q = returnsSearch.trim().toLowerCase();
    const okQ = !q || r.return_number.toLowerCase().includes(q) || (r.sale_bill_number || '').toLowerCase().includes(q);
    const okDate = !returnsDate || r.return_date.startsWith(returnsDate);
    return okQ && okDate;
  }), [returns, returnsSearch, returnsDate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 style={{ width: 22, height: 22, color: C.primary, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  if (!customer) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/panel/customers')}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.cardBorder}`, background: C.cardSoft, color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <User style={{ width: 18, height: 18, color: C.primaryLight }} />
              {customer.name}
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>Customer Profile & Ledger</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasDebt && (
            <button
              onClick={() => setShowPay(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: C.emerald, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
            >
              <TrendingDown style={{ width: 14, height: 14 }} /> Record Payment
            </button>
          )}
          <button
            onClick={openEdit}
            title="Edit Customer"
            style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid rgba(99,102,241,0.25)`, background: 'rgba(99,102,241,0.1)', color: C.primaryLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Pencil style={{ width: 14, height: 14 }} />
          </button>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid rgba(244,63,94,0.25)`, background: 'rgba(244,63,94,0.1)', color: C.rose, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Trash2 style={{ width: 14, height: 14 }} />
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(244,63,94,0.1)', border: `1px solid rgba(244,63,94,0.25)`, borderRadius: 10, padding: '4px 10px' }}>
              <span style={{ fontSize: 11, color: C.rose, fontWeight: 800 }}>Delete?</span>
              <button onClick={handleDelete} style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6, border: 'none', background: C.rose, color: '#fff', cursor: 'pointer' }}>Yes</button>
              <button onClick={() => setDeleteConfirm(false)} style={{ fontSize: 10, color: C.muted, padding: '3px 6px', background: 'transparent', border: 'none', cursor: 'pointer' }}>No</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Top grid: balance + info | ledger ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: 14 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Balance card */}
          {(() => {
            const accent = hasDebt ? C.rose : C.emerald;
            const limit = customer.credit_limit && customer.credit_limit > 0 ? customer.credit_limit : null;
            const usagePct = limit ? Math.min(100, Math.round((customer.outstanding_balance / limit) * 100)) : null;
            return (
              <div style={{
                position: 'relative', overflow: 'hidden',
                background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 18,
              }}>
                {/* accent stripe */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent }} />
                {/* soft glow */}
                <div style={{ position: 'absolute', top: -60, right: -40, width: 160, height: 160, borderRadius: '50%', background: accent, opacity: 0.08, filter: 'blur(60px)', pointerEvents: 'none' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Outstanding Balance</p>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: `${accent}1f`, border: `1px solid ${accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet style={{ width: 13, height: 13, color: accent }} />
                  </div>
                </div>

                <p style={{ margin: '10px 0 0', fontSize: 30, fontWeight: 900, color: accent, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                  {formatCurrency(customer.outstanding_balance)}
                </p>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, padding: '3px 9px', borderRadius: 999, background: `${accent}14`, border: `1px solid ${accent}33`, fontSize: 10, fontWeight: 800, color: accent }}>
                  {hasDebt ? <AlertCircle style={{ width: 11, height: 11 }} /> : <CheckCircle2 style={{ width: 11, height: 11 }} />}
                  {hasDebt ? 'Outstanding credit' : 'Fully cleared'}
                </div>

                {limit != null && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginBottom: 5 }}>
                      <span style={{ fontWeight: 700 }}>Credit used</span>
                      <span style={{ fontWeight: 800, color: C.textSoft }}>{usagePct}% of {formatCurrency(limit)}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${usagePct}%`, background: accent, borderRadius: 999, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Contact */}
          <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 16 }}>
            <h3 style={{ margin: 0, fontSize: 10, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Contact</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <InfoRow icon={Phone} value={customer.phone || '—'} />
              {customer.email && <InfoRow icon={Mail} value={customer.email} />}
              {customer.address && <InfoRow icon={MapPin} value={customer.address} />}
              {customer.gstin && <InfoRow icon={Receipt} value={`GSTIN: ${customer.gstin}`} />}
              {customer.state && <InfoRow icon={MapPin} value={customer.state} />}
            </div>
          </div>

          {/* Credit terms */}
          <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 16 }}>
            <h3 style={{ margin: 0, fontSize: 10, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Credit Terms</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <StatRow label="Credit Limit" value={customer.credit_limit ? formatCurrency(customer.credit_limit) : 'Unlimited'} />
              <StatRow label="Credit Days" value={customer.credit_days ? `${customer.credit_days} days` : '—'} />
              <StatRow label="Customer Type" value={(customer.customer_type || 'b2c').toUpperCase()} />
              <StatRow label="Lifetime Purchases" value={formatCurrency(customer.total_purchases)} accent />
            </div>
          </div>
        </div>

        {/* Right column: Ledger */}
        <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Receipt style={{ width: 14, height: 14, color: C.primaryLight }} />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.text }}>Transaction Ledger</h3>
          </div>
          {loadingLedger ? (
            <Spinner />
          ) : ledger.length === 0 ? (
            <Empty icon={Receipt} text="No transactions yet" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}>
              {ledger.map((entry) => {
                const isCharge = entry.transaction_type === 'sale' || entry.transaction_type === 'credit';
                return (
                  <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, border: `1px solid transparent`, transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: isCharge ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isCharge ? <ArrowUpRight style={{ width: 14, height: 14, color: C.rose }} />
                                : <ArrowDownLeft style={{ width: 14, height: 14, color: C.emerald }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text, textTransform: 'capitalize' }}>{entry.transaction_type}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: 11, color: C.muted }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock style={{ width: 11, height: 11 }} />
                          {new Date(entry.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {entry.payment_method && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CreditCard style={{ width: 11, height: 11 }} />
                            {entry.payment_method}
                          </span>
                        )}
                      </div>
                      {entry.notes && <p style={{ margin: '2px 0 0', fontSize: 11, color: C.mutedDim, fontStyle: 'italic' }}>{entry.notes}</p>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: isCharge ? C.rose : C.emerald }}>
                        {isCharge ? '+' : '-'} {formatCurrency(entry.amount)}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: C.mutedDim }}>Bal: {formatCurrency(entry.balance_after)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Regulars / Routine ── */}
      <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity style={{ width: 14, height: 14, color: C.emerald }} />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.text }}>Regular Prescriptions & Routine</h3>
          </div>
          <div style={{ position: 'relative', zIndex: 5 }}>
            <SearchIcon style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: C.muted }} />
            <input
              value={regSearch}
              onChange={(e) => setRegSearch(e.target.value)}
              placeholder="Search medicine to add…"
              style={{ width: 260, padding: '7px 10px 7px 28px', fontSize: 12, borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.inputBg, color: C.text, outline: 'none' }}
            />
            {searchingReg && <Loader2 style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: C.emerald, animation: 'spin 1s linear infinite' }} />}
            {regResults.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, width: 320, background: '#0f172a', border: `1px solid ${C.cardBorder}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                {regResults.map((m) => (
                  <button key={m.id} onClick={() => addRegular(m)}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.cardBorder}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.manufacturer || m.salt_composition || '—'}</p>
                    </div>
                    <Plus style={{ width: 12, height: 12, color: C.emerald, flexShrink: 0, marginLeft: 8 }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {loadingRegulars ? (
          <Spinner />
        ) : regulars.length === 0 ? (
          <Empty icon={Activity} text="No regular medicines mapped" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {regulars.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, border: `1px solid ${C.cardBorder}`, background: C.cardSoft }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.salt_composition || r.manufacturer || '—'}</p>
                </div>
                <button onClick={() => removeRegular(r.id)}
                  style={{ width: 26, height: 26, borderRadius: 8, border: 'none', background: 'transparent', color: C.mutedDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = C.rose; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.mutedDim; }}>
                  <Trash2 style={{ width: 12, height: 12 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sales invoices ── */}
      <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt style={{ width: 14, height: 14, color: C.primaryLight }} />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.text }}>Sales Invoices</h3>
            {sales.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.15)', color: C.primaryLight }}>{sales.length} bills</span>
            )}
          </div>
          {sales.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <FilterInput icon={Search} value={salesSearch} onChange={setSalesSearch} placeholder="Search bill no…" />
              <FilterInput icon={CalendarDays} type="date" value={salesDate} onChange={setSalesDate} />
            </div>
          )}
        </div>
        {loadingSales ? (
          <Spinner />
        ) : filteredSales.length === 0 ? (
          <Empty icon={Receipt} text="No sales found" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}>
            {filteredSales.map((sale) => {
              const due = computeBillDue(sale);
              const hasDue = due > 0.01;
              return (
              <div key={sale.id} style={{ borderRadius: 12, border: `1px solid transparent`, overflow: 'hidden' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.cardBorder; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10 }}>
                  <button onClick={() => toggleBill(sale.id)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', padding: 0, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Receipt style={{ width: 14, height: 14, color: C.primaryLight }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Bill #{sale.bill_number}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: 11, color: C.muted, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CalendarDays style={{ width: 11, height: 11 }} />
                          {new Date(sale.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span style={{ color: C.mutedDim }}>•</span>
                        <span style={{ textTransform: 'uppercase' }}>{sale.payment_method}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.primaryLight }}>{formatCurrency(sale.total_amount)}</p>
                      <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 6px', borderRadius: 5, fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                        background: sale.payment_status === 'paid' ? 'rgba(16,185,129,0.15)' : sale.payment_status === 'partial' ? 'rgba(245,158,11,0.15)' : 'rgba(244,63,94,0.15)',
                        color:      sale.payment_status === 'paid' ? C.emerald                : sale.payment_status === 'partial' ? C.amber                  : C.rose }}>
                        {sale.payment_status}
                      </span>
                      {hasDue && (
                        <p style={{ margin: '3px 0 0', fontSize: 10, fontWeight: 700, color: C.rose }}>Due: {formatCurrency(due)}</p>
                      )}
                    </div>
                  </button>
                  {hasDue && (
                    <button onClick={(e) => { e.stopPropagation(); openBillPay(sale); }}
                      title={`Pay ${formatCurrency(due)} credit due`}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, border: `1px solid rgba(16,185,129,0.3)`, background: 'rgba(16,185,129,0.12)', color: C.emerald, fontSize: 11, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; }}>
                      <Wallet style={{ width: 11, height: 11 }} /> Pay
                    </button>
                  )}
                </div>
                {expandedBillId === sale.id && (
                  <div style={{ padding: '8px 12px 12px', borderTop: `1px solid ${C.cardBorder}`, background: 'rgba(255,255,255,0.015)', maxHeight: 280, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 9, color: C.muted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Purchased Medicines</span>
                      <button onClick={(e) => { e.stopPropagation(); router.push(`/panel/sales-history/${sale.id}`); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 800, color: C.primaryLight, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                        View Full Bill <ArrowUpRight style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                    {loadingBillId === sale.id ? (
                      <Spinner small />
                    ) : (billItems[sale.id]?.length || 0) === 0 ? (
                      <p style={{ margin: 0, padding: '12px 0', fontSize: 11, color: C.mutedDim, textAlign: 'center' }}>No items found</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {billItems[sale.id].map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, background: C.cardSoft, border: `1px solid ${C.cardBorder}` }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.medicine_name}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted }}>
                                {it.quantity} {it.selling_unit} • ₹{it.unit_price.toFixed(2)}
                              </p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); addBillItemToPos(it); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: 6, border: 'none', background: 'rgba(99,102,241,0.15)', color: C.primaryLight, fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>
                              <Plus style={{ width: 11, height: 11 }} /> Add to POS
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Returns ── */}
      <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RotateCcw style={{ width: 14, height: 14, color: C.rose }} />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.text }}>Return Bills</h3>
            {returns.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: 'rgba(244,63,94,0.15)', color: C.rose }}>{returns.length} returns</span>
            )}
          </div>
          {returns.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <FilterInput icon={Search} value={returnsSearch} onChange={setReturnsSearch} placeholder="Search return…" />
              <FilterInput icon={CalendarDays} type="date" value={returnsDate} onChange={setReturnsDate} />
            </div>
          )}
        </div>
        {loadingReturns ? (
          <Spinner />
        ) : filteredReturns.length === 0 ? (
          <Empty icon={RotateCcw} text="No returns found" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
            {filteredReturns.map((r) => (
              <div key={r.id} onClick={() => router.push(`/panel/sales-history/returns/${r.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, border: `1px solid transparent`, cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = C.cardBorder; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <RotateCcw style={{ width: 14, height: 14, color: C.rose }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.return_number}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: 11, color: C.muted, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CalendarDays style={{ width: 11, height: 11 }} />
                      {new Date(r.return_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    {r.sale_bill_number && (
                      <>
                        <span style={{ color: C.mutedDim }}>•</span>
                        <span style={{ color: C.primaryLight, fontWeight: 700 }}>Original: {r.sale_bill_number}</span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.rose }}>{formatCurrency(r.total_amount)}</p>
                  <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 6px', borderRadius: 5, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', color: C.muted }}>
                    {r.refund_method} REFUND
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit modal ── */}
      {showEdit && editForm && (
        <Modal onClose={() => setShowEdit(false)} title="Edit Customer" subtitle={customer.name} icon={Pencil}>
          {editError && <ErrorBanner text={editError} />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Name *" full><TInput value={editForm.name || ''} onChange={(v) => setEditForm({ ...editForm, name: v })} /></Field>
            <Field label="Phone *"><TInput value={editForm.phone || ''} onChange={(v) => setEditForm({ ...editForm, phone: v.replace(/\D/g, '').slice(0, 10) })} /></Field>
            <Field label="Email"><TInput type="email" value={editForm.email || ''} onChange={(v) => setEditForm({ ...editForm, email: v })} /></Field>
            <Field label="Address" full><TInput value={editForm.address || ''} onChange={(v) => setEditForm({ ...editForm, address: v })} /></Field>
            <Field label="GSTIN"><TInput value={editForm.gstin || ''} onChange={(v) => setEditForm({ ...editForm, gstin: v.toUpperCase() })} /></Field>
            <Field label="State"><TInput value={editForm.state || ''} onChange={(v) => setEditForm({ ...editForm, state: v })} /></Field>
            <Field label="Customer Type">
              <select value={editForm.customer_type || 'b2c'} onChange={(e) => setEditForm({ ...editForm, customer_type: e.target.value })}
                style={selectStyle}>
                <option value="b2c" style={optionStyle}>B2C (Consumer)</option>
                <option value="b2b" style={optionStyle}>B2B (Business)</option>
              </select>
            </Field>
            <Field label="Credit Limit (₹)"><TInput type="number" value={editForm.credit_limit?.toString() || ''} onChange={(v) => setEditForm({ ...editForm, credit_limit: v ? Number(v) : null })} placeholder="No limit" /></Field>
            <Field label="Credit Days"><TInput type="number" value={editForm.credit_days?.toString() || ''} onChange={(v) => setEditForm({ ...editForm, credit_days: v ? Number(v) : null })} placeholder="No limit" /></Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => setShowEdit(false)} style={cancelBtn}>Cancel</button>
            <button onClick={handleSaveEdit} disabled={savingEdit} style={{ ...primaryBtn, opacity: savingEdit ? 0.7 : 1 }}>
              {savingEdit ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 14, height: 14 }} />}
              Save Changes
            </button>
          </div>
        </Modal>
      )}

      {/* ── Payment modal ── */}
      {showPay && (
        <Modal onClose={() => { setShowPay(false); setPayError(null); }} title="Record Payment" subtitle={customer.name} icon={Wallet} accent="emerald">
          {payError && <ErrorBanner text={payError} />}
          <Field label={`Amount (₹) — Max: ${formatCurrency(customer.outstanding_balance)}`} full>
            <input type="number" min="1" max={customer.outstanding_balance}
              value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
              autoFocus
              style={{ ...inputStyle, fontSize: 18, fontWeight: 900 }}
            />
          </Field>
          <Field label="Payment Method" full>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} style={selectStyle}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m} style={optionStyle}>{m.replace('_', ' ').toUpperCase()}</option>)}
            </select>
          </Field>
          <Field label="Notes (optional)" full>
            <TInput value={payNote} onChange={setPayNote} placeholder="Reference, voucher no…" />
          </Field>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => { setShowPay(false); setPayError(null); }} style={cancelBtn}>Cancel</button>
            <button onClick={handlePayment} disabled={paying} style={{ ...emeraldBtn, opacity: paying ? 0.7 : 1 }}>
              {paying ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <IndianRupee style={{ width: 14, height: 14 }} />}
              Confirm Payment
            </button>
          </div>
        </Modal>
      )}

      {/* ── Per-bill payment modal ── */}
      {payBill && (() => {
        const due = computeBillDue(payBill);
        return (
          <Modal onClose={() => setPayBill(null)} title={`Pay Bill #${payBill.bill_number}`} subtitle={`Credit due: ${formatCurrency(due)}`} icon={Wallet} accent="emerald">
            {billPayError && <ErrorBanner text={billPayError} />}
            <Field label={`Amount (₹) — Max: ${formatCurrency(due)}`} full>
              <input type="number" min="1" max={due} step="0.01"
                value={billPayAmount} onChange={(e) => setBillPayAmount(e.target.value)}
                autoFocus
                style={{ ...inputStyle, fontSize: 18, fontWeight: 900 }}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button type="button" onClick={() => setBillPayAmount(due.toFixed(2))}
                  style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, color: C.emerald, background: 'rgba(16,185,129,0.1)', border: `1px solid rgba(16,185,129,0.2)`, borderRadius: 6, cursor: 'pointer' }}>
                  Full ({formatCurrency(due)})
                </button>
                <button type="button" onClick={() => setBillPayAmount((due / 2).toFixed(2))}
                  style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, color: C.primaryLight, background: 'rgba(99,102,241,0.1)', border: `1px solid rgba(99,102,241,0.2)`, borderRadius: 6, cursor: 'pointer' }}>
                  Half
                </button>
              </div>
            </Field>
            <Field label="Payment Method" full>
              <select value={billPayMethod} onChange={(e) => setBillPayMethod(e.target.value)} style={selectStyle}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m} style={optionStyle}>{m.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </Field>
            <Field label="Notes (optional)" full>
              <TInput value={billPayNote} onChange={setBillPayNote} placeholder="Reference, voucher no…" />
            </Field>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setPayBill(null)} style={cancelBtn}>Cancel</button>
              <button onClick={handleBillPayment} disabled={billPaying} style={{ ...emeraldBtn, opacity: billPaying ? 0.7 : 1 }}>
                {billPaying ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <IndianRupee style={{ width: 14, height: 14 }} />}
                Confirm Payment
              </button>
            </div>
          </Modal>
        );
      })()}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Helpers ─── */

function InfoRow({ icon: Icon, value }: { icon: any; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textSoft }}>
      <Icon style={{ width: 13, height: 13, color: C.muted, flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ fontWeight: 800, color: accent ? C.primaryLight : C.text }}>{value}</span>
    </div>
  );
}

function Spinner({ small }: { small?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: small ? '14px 0' : '40px 0' }}>
      <Loader2 style={{ width: small ? 14 : 18, height: small ? 14 : 18, color: C.muted, animation: 'spin 1s linear infinite' }} />
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div style={{ padding: '36px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, border: `2px dashed ${C.cardBorder}`, borderRadius: 12 }}>
      <Icon style={{ width: 26, height: 26, color: C.mutedDim }} />
      <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{text}</p>
    </div>
  );
}

function FilterInput({ icon: Icon, value, onChange, placeholder, type = 'text' }: { icon: any; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <Icon style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: C.muted }} />
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ padding: '7px 10px 7px 28px', fontSize: 12, borderRadius: 8, border: `1px solid ${C.inputBorder}`, background: C.inputBg, color: C.text, outline: 'none', width: type === 'date' ? 140 : 180, colorScheme: 'dark' }} />
    </div>
  );
}

function Modal({ onClose, title, subtitle, icon: Icon, accent, children }: { onClose: () => void; title: string; subtitle?: string; icon: any; accent?: 'emerald'; children: React.ReactNode }) {
  const accentBg = accent === 'emerald' ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)';
  const accentColor = accent === 'emerald' ? C.emerald : C.primaryLight;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: 20, boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon style={{ width: 16, height: 16, color: accentColor }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.text }}>{title}</h3>
              {subtitle && <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto', marginBottom: 4 }}>
      <label style={{ display: 'block', fontSize: 9, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function TInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />;
}

function ErrorBanner({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', border: `1px solid rgba(244,63,94,0.25)`, color: C.rose, fontSize: 12, marginBottom: 12 }}>
      <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
      <span>{text}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13, color: C.text,
  background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: 9,
  outline: 'none', boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', colorScheme: 'dark' };
const optionStyle: React.CSSProperties = { background: '#0B1121', color: C.text };

const cancelBtn: React.CSSProperties = {
  flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.cardBorder}`,
  background: 'transparent', color: C.muted, fontSize: 12, fontWeight: 800, cursor: 'pointer',
};
const primaryBtn: React.CSSProperties = {
  flex: 1, padding: 10, borderRadius: 10, border: 'none',
  background: C.primary, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
};
const emeraldBtn: React.CSSProperties = { ...primaryBtn, background: C.emerald };
