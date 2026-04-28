'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import {
  Building2, ChevronLeft, Phone, Mail, MapPin, Wallet,
  Loader2, AlertCircle, CheckCircle2, IndianRupee,
  Receipt, Clock, Trash2, TrendingDown, CreditCard,
  ArrowDownLeft, ArrowUpRight, User, Tag,
  ChevronRight, Pencil, Save, X, Pill, ArrowRight, Package2,
} from 'lucide-react';

const NEAR_EXPIRY_DAYS = 90;

/* ─── Types ───────────────────────────────────────────────── */
interface SupplierRow {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  drug_license: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  outstanding_balance: number;
  credit_limit: number | null;
  credit_days: number | null;
  opening_balance: number;
  created_at: string;
}

interface LedgerEntry {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  payment_method: string | null;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
}

interface PurchaseRow {
  id: string;
  bill_number: string | null;
  bill_date: string | null;
  total_amount: number | null;
  payment_status: string | null;
  item_count: number;
}

interface MedicineBatchRow {
  batch_id: string;
  medicine_id: string;
  medicine_name: string;
  batch_number: string | null;
  current_quantity: number;
  expiry_date: string | null;
  mrp: number | null;
  purchase_price: number | null;
  min_stock_level: number;
  is_low_stock: boolean;
  days_to_expiry: number;
}

/* ─── Palette ─────────────────────────────────────────────── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569',
  indigo: '#6366f1', indigoLight: '#818cf8',
  emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e',
  orange: '#f97316', teal: '#14b8a6',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

/* ─── Helpers ─────────────────────────────────────────────── */
function formatDateTime(d: string | null | undefined) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ─── Page ────────────────────────────────────────────────── */
export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const supplierId = params?.id as string;
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [supplier, setSupplier] = useState<SupplierRow | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [medicines, setMedicines] = useState<MedicineBatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(true);

  /* Modals */
  const [showPay, setShowPay] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<Partial<SupplierRow> | null>(null);
  const [saving, setSaving] = useState(false);

  /* ─── Loaders ─── */
  const loadSupplier = useCallback(async () => {
    if (!pharmacyId || !supplierId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name, contact_person, phone, email, gstin, drug_license, address, city, state, pincode, outstanding_balance, credit_limit, credit_days, opening_balance, created_at')
      .eq('pharmacy_id', pharmacyId)
      .eq('id', supplierId)
      .single();
    if (error || !data) {
      toast.error('Supplier not found');
      router.push('/panel/suppliers');
      return;
    }
    setSupplier({
      ...data,
      outstanding_balance: Number(data.outstanding_balance) || 0,
      opening_balance: Number(data.opening_balance) || 0,
      credit_limit: data.credit_limit != null ? Number(data.credit_limit) : null,
    });
    setLoading(false);
  }, [pharmacyId, supplierId, supabase, router]);

  const loadLedger = useCallback(async () => {
    if (!pharmacyId || !supplierId) return;
    setLoadingLedger(true);
    const { data } = await supabase
      .from('supplier_ledger')
      .select('id, transaction_type, amount, balance_after, payment_method, reference_type, reference_id, notes, created_at')
      .eq('pharmacy_id', pharmacyId)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
      .limit(200);
    setLedger((data || []).map((e: any) => ({
      ...e,
      amount: Number(e.amount) || 0,
      balance_after: Number(e.balance_after) || 0,
    })));
    setLoadingLedger(false);
  }, [pharmacyId, supplierId, supabase]);

  const loadPurchases = useCallback(async () => {
    if (!pharmacyId || !supplierId) return;
    setLoadingPurchases(true);
    const { data } = await supabase
      .from('purchases')
      .select('id, bill_number, bill_date, total_amount, payment_status, purchase_items(id)')
      .eq('pharmacy_id', pharmacyId)
      .eq('supplier_id', supplierId)
      .order('bill_date', { ascending: false })
      .limit(50);
    setPurchases(((data || []) as any[]).map((p) => ({
      id: p.id,
      bill_number: p.bill_number,
      bill_date: p.bill_date,
      total_amount: p.total_amount != null ? Number(p.total_amount) : null,
      payment_status: p.payment_status,
      item_count: Array.isArray(p.purchase_items) ? p.purchase_items.length : 0,
    })));
    setLoadingPurchases(false);
  }, [pharmacyId, supplierId, supabase]);

  const loadMedicines = useCallback(async () => {
    if (!pharmacyId || !supplierId) return;

    // Mirror the desktop's logic: a batch belongs to this supplier if either
    //   (a) batches.supplier_id = supplierId  (newer rows that stamp it), or
    //   (b) some purchase_items row from a purchase by this supplier matches
    //       the batch by (medicine_id, batch_number).
    // We do (a) directly and (b) by pulling the supplier's purchase_items
    // and querying batches by their (medicine_id, batch_number) pairs.

    // Step 1 — purchase_items belonging to purchases from this supplier.
    const { data: pursRaw } = await supabase
      .from('purchases')
      .select('id')
      .eq('pharmacy_id', pharmacyId)
      .eq('supplier_id', supplierId);
    const purchaseIds = (pursRaw || []).map((p: any) => p.id);

    type PIRow = { id: string; medicine_id: string; batch_number: string | null };
    let supplierItems: PIRow[] = [];
    if (purchaseIds.length > 0) {
      const { data: piRows } = await supabase
        .from('purchase_items')
        .select('id, medicine_id, batch_number')
        .in('purchase_id', purchaseIds);
      supplierItems = (piRows || []) as PIRow[];
    }

    const batchSelect =
      'id, batch_number, stock_quantity, expiry_date, mrp, purchase_price, medicine_id, supplier_id, purchase_item_id, medicines(name, min_stock_level)';

    const merged = new Map<string, any>();

    // Path A — batches.supplier_id = supplierId
    {
      const { data } = await supabase
        .from('batches')
        .select(batchSelect)
        .eq('pharmacy_id', pharmacyId)
        .eq('supplier_id', supplierId)
        .limit(1000);
      for (const b of (data as any[]) || []) merged.set(b.id, b);
    }

    // Path B — batches.purchase_item_id ∈ supplierItems[].id
    if (supplierItems.length > 0) {
      const piIds = supplierItems.map((p) => p.id);
      const { data } = await supabase
        .from('batches')
        .select(batchSelect)
        .eq('pharmacy_id', pharmacyId)
        .in('purchase_item_id', piIds)
        .limit(1000);
      for (const b of (data as any[]) || []) merged.set(b.id, b);
    }

    // Path C — match by (medicine_id, batch_number) for legacy batches that
    // have neither supplier_id nor purchase_item_id stamped.
    if (supplierItems.length > 0) {
      // Group batch_numbers per medicine to build a single OR-style query.
      const byMedicine = new Map<string, Set<string>>();
      for (const it of supplierItems) {
        if (!it.batch_number) continue;
        if (!byMedicine.has(it.medicine_id)) byMedicine.set(it.medicine_id, new Set());
        byMedicine.get(it.medicine_id)!.add(it.batch_number);
      }
      const medicineIds = Array.from(byMedicine.keys());
      const allBatchNumbers = Array.from(
        new Set(supplierItems.map((p) => p.batch_number).filter(Boolean) as string[]),
      );
      if (medicineIds.length > 0 && allBatchNumbers.length > 0) {
        const { data } = await supabase
          .from('batches')
          .select(batchSelect)
          .eq('pharmacy_id', pharmacyId)
          .in('medicine_id', medicineIds)
          .in('batch_number', allBatchNumbers)
          .limit(2000);
        for (const b of (data as any[]) || []) {
          // Only keep if (medicine_id, batch_number) actually pairs in
          // supplierItems — avoids picking up other suppliers' batches that
          // happen to share a batch_number for the same medicine.
          const set = byMedicine.get(b.medicine_id);
          if (set && b.batch_number && set.has(b.batch_number)) {
            merged.set(b.id, b);
          }
        }
      }
    }

    const rows = Array.from(merged.values()).sort((a, b) => {
      const ax = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
      const bx = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
      return ax - bx;
    });

    const today = Date.now();
    setMedicines(rows.map((b) => {
      const exp = b.expiry_date ? new Date(b.expiry_date).getTime() : null;
      const days = exp ? Math.floor((exp - today) / 86400000) : 9999;
      const min = b.medicines?.min_stock_level ?? 10;
      const qty = Number(b.stock_quantity) || 0;
      return {
        batch_id: b.id,
        medicine_id: b.medicine_id,
        medicine_name: b.medicines?.name || 'Unknown',
        batch_number: b.batch_number,
        current_quantity: qty,
        expiry_date: b.expiry_date,
        mrp: b.mrp != null ? Number(b.mrp) : null,
        purchase_price: b.purchase_price != null ? Number(b.purchase_price) : null,
        min_stock_level: min,
        is_low_stock: qty > 0 && qty < min,
        days_to_expiry: days,
      };
    }));
  }, [pharmacyId, supplierId, supabase]);

  useEffect(() => {
    loadSupplier();
    loadLedger();
    loadPurchases();
    loadMedicines();
  }, [loadSupplier, loadLedger, loadPurchases, loadMedicines]);

  /* ─── Derived ─── */
  const lowStockByMedicine = useMemo(() => {
    const map = new Map<string, MedicineBatchRow>();
    for (const r of medicines.filter((m) => m.is_low_stock)) {
      const existing = map.get(r.medicine_id);
      if (!existing || r.current_quantity < existing.current_quantity) map.set(r.medicine_id, r);
    }
    return Array.from(map.values());
  }, [medicines]);

  const expiryRows = useMemo(
    () => medicines.filter((r) => r.days_to_expiry <= NEAR_EXPIRY_DAYS),
    [medicines]
  );

  const hasDebt = (supplier?.outstanding_balance ?? 0) > 0.01;

  /* ─── Handlers ─── */
  const handlePayment = async () => {
    if (!pharmacyId || !supplier) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > supplier.outstanding_balance) { toast.error('Amount exceeds outstanding balance'); return; }
    setPaying(true);
    try {
      const newBalance = +(supplier.outstanding_balance - amt).toFixed(2);
      const { error: ledErr } = await supabase.from('supplier_ledger').insert({
        pharmacy_id: pharmacyId,
        supplier_id: supplierId,
        transaction_type: 'payment',
        amount: amt,
        balance_after: newBalance,
        payment_method: payMethod,
        notes: payNote.trim() || null,
      });
      if (ledErr) throw ledErr;
      const { error: supErr } = await supabase
        .from('suppliers')
        .update({ outstanding_balance: newBalance })
        .eq('id', supplierId)
        .eq('pharmacy_id', pharmacyId);
      if (supErr) throw supErr;
      toast.success(`Payment of ${formatCurrency(amt)} recorded`);
      setShowPay(false); setPayAmount(''); setPayNote(''); setPayMethod('cash');
      loadSupplier(); loadLedger();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record payment');
    } finally {
      setPaying(false);
    }
  };

  const handleDelete = async () => {
    if (!pharmacyId) return;
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId)
        .eq('pharmacy_id', pharmacyId);
      if (error) throw error;
      toast.success('Supplier deleted');
      router.push('/panel/suppliers');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete supplier');
      setDeleteConfirm(false);
    }
  };

  const openEdit = () => {
    if (!supplier) return;
    setEditForm({ ...supplier });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!pharmacyId || !editForm) return;
    if (!editForm.name?.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: editForm.name.trim(),
          contact_person: editForm.contact_person?.trim() || null,
          phone: editForm.phone?.trim() || null,
          email: editForm.email?.trim() || null,
          gstin: editForm.gstin?.trim().toUpperCase() || null,
          address: editForm.address?.trim() || null,
          city: editForm.city?.trim() || null,
          state: editForm.state?.trim() || null,
          pincode: editForm.pincode?.trim() || null,
          credit_limit: editForm.credit_limit ?? null,
          credit_days: editForm.credit_days ?? null,
        })
        .eq('id', supplierId)
        .eq('pharmacy_id', pharmacyId);
      if (error) throw error;
      toast.success('Supplier updated');
      setShowEdit(false);
      loadSupplier();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update supplier');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Render ─── */
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 0' }}>
        <Loader2 style={{ width: 24, height: 24, color: C.indigoLight, animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }
  if (!supplier) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/panel/suppliers')}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 style={{ width: 20, height: 20, color: C.indigoLight }} />
              {supplier.name}
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>Supplier Profile &amp; Ledger</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasDebt && (
            <button
              onClick={() => setShowPay(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.emerald},#059669)`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(16,185,129,0.25)' }}
            >
              <TrendingDown style={{ width: 14, height: 14 }} /> Record Payment
            </button>
          )}
          <button
            onClick={openEdit}
            title="Edit Supplier"
            style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid rgba(99,102,241,0.25)`, backgroundColor: 'rgba(99,102,241,0.08)', color: C.indigoLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Pencil style={{ width: 14, height: 14 }} />
          </button>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              title="Delete Supplier"
              style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid rgba(244,63,94,0.25)`, backgroundColor: 'rgba(244,63,94,0.08)', color: C.rose, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Trash2 style={{ width: 14, height: 14 }} />
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, backgroundColor: 'rgba(244,63,94,0.1)', border: `1px solid rgba(244,63,94,0.2)` }}>
              <span style={{ fontSize: 11, color: C.rose, fontWeight: 800 }}>Delete?</span>
              <button onClick={handleDelete} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: 'none', backgroundColor: C.rose, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Yes</button>
              <button onClick={() => setDeleteConfirm(false)} style={{ fontSize: 11, padding: '3px 8px', background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}>No</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary + Ledger ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: 14, alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Balance card */}
          {(() => {
            const accent = hasDebt ? C.orange : C.emerald;
            const accentRgb = hasDebt ? '249,115,22' : '16,185,129';
            return (
              <div style={{
                position: 'relative', overflow: 'hidden',
                borderRadius: 18, padding: '22px 22px 20px',
                background: `linear-gradient(160deg, rgba(${accentRgb},0.14) 0%, rgba(${accentRgb},0.04) 45%, ${C.card} 100%)`,
                border: `1px solid rgba(${accentRgb},0.28)`,
                boxShadow: `0 14px 40px -18px rgba(${accentRgb},0.45), inset 0 1px 0 rgba(255,255,255,0.04)`,
              }}>
                {/* Soft accent glow top-right */}
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, rgba(${accentRgb},0.35) 0%, transparent 70%)`, filter: 'blur(8px)', pointerEvents: 'none' }} />

                {/* Header row: label + icon */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: accent, boxShadow: `0 0 10px ${accent}` }} />
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: 'rgba(241,245,249,0.65)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Total Payable</p>
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `rgba(${accentRgb},0.14)`, border: `1px solid rgba(${accentRgb},0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet style={{ width: 16, height: 16, color: accent }} />
                  </div>
                </div>

                {/* Amount */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(241,245,249,0.55)', lineHeight: 1 }}>₹</span>
                  <span style={{ fontSize: 34, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(supplier.outstanding_balance)}
                  </span>
                </div>

                {/* Status pill */}
                <div style={{ position: 'relative', marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, backgroundColor: `rgba(${accentRgb},0.14)`, border: `1px solid rgba(${accentRgb},0.3)`, color: accent, fontSize: 10, fontWeight: 900, letterSpacing: '0.04em' }}>
                  {hasDebt ? <AlertCircle style={{ width: 11, height: 11 }} /> : <CheckCircle2 style={{ width: 11, height: 11 }} />}
                  {hasDebt ? 'OUTSTANDING BALANCE' : 'ALL PAYMENTS CLEARED'}
                </div>

                {/* Divider + secondary line */}
                {hasDebt && supplier.credit_limit != null && supplier.credit_limit > 0 && (
                  <>
                    <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', margin: '14px 0 10px' }} />
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
                      <span style={{ color: C.muted, fontWeight: 700, letterSpacing: '0.05em' }}>Credit utilised</span>
                      <span style={{ color: C.text, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                        {Math.min(100, Math.round((supplier.outstanding_balance / supplier.credit_limit) * 100))}% of {formatCurrency(supplier.credit_limit)}
                      </span>
                    </div>
                    <div style={{ position: 'relative', marginTop: 6, height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (supplier.outstanding_balance / supplier.credit_limit) * 100)}%`, height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${accent}, ${accent}cc)`, boxShadow: `0 0 8px ${accent}` }} />
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <MiniStat value={medicines.length} label="Batches" color={C.indigoLight} />
            <MiniStat value={lowStockByMedicine.length} label="Low Stock" color={lowStockByMedicine.length > 0 ? C.amber : C.muted} />
            <MiniStat value={expiryRows.length} label="Expiry" color={expiryRows.length > 0 ? C.rose : C.muted} />
          </div>

          {/* Contact */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Contact</p>
            {supplier.contact_person && <InfoRow icon={User} value={supplier.contact_person} />}
            {supplier.phone && <InfoRow icon={Phone} value={supplier.phone} />}
            {supplier.email && <InfoRow icon={Mail} value={supplier.email} />}
            {(supplier.address || supplier.city) && (
              <InfoRow icon={MapPin} value={[supplier.address, supplier.city, supplier.state, supplier.pincode].filter(Boolean).join(', ')} />
            )}
            {supplier.gstin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag style={{ width: 13, height: 13, color: C.muted, flexShrink: 0 }} />
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.text }}>{supplier.gstin}</span>
              </div>
            )}
            {!supplier.contact_person && !supplier.phone && !supplier.email && !supplier.address && !supplier.gstin && (
              <p style={{ margin: 0, fontSize: 12, color: C.muted, fontStyle: 'italic' }}>No contact info on record</p>
            )}
          </div>

          {/* Credit terms */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Credit Terms</p>
            <StatRow label="Credit Limit" value={supplier.credit_limit ? formatCurrency(supplier.credit_limit) : '—'} />
            <StatRow label="Credit Days" value={supplier.credit_days ? `${supplier.credit_days} days` : '—'} />
            <StatRow label="Opening Balance" value={formatCurrency(supplier.opening_balance)} />
            <StatRow label="Member Since" value={formatDate(supplier.created_at)} />
          </div>
        </div>

        {/* Ledger */}
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Receipt style={{ width: 14, height: 14, color: C.indigoLight }} />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.text }}>Transaction Ledger</h3>
          </div>
          {loadingLedger ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <Loader2 style={{ width: 18, height: 18, color: C.muted, animation: 'spin 1s linear infinite' }} />
            </div>
          ) : ledger.length === 0 ? (
            <EmptyPanel icon={Receipt} text="No transactions yet" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}>
              {ledger.map((entry) => {
                const isDebit = entry.transaction_type === 'purchase' || entry.transaction_type === 'debit';
                const isReturn = entry.transaction_type === 'return' && entry.reference_id;
                const clickable = isReturn || (entry.transaction_type === 'purchase' && entry.reference_id);
                return (
                  <div
                    key={entry.id}
                    onClick={clickable ? () => {
                      if (entry.transaction_type === 'purchase') router.push(`/panel/purchases/${entry.reference_id}`);
                      else if (isReturn) router.push(`/panel/purchases/returns/${entry.reference_id}`);
                    } : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 10,
                      border: '1px solid transparent',
                      cursor: clickable ? 'pointer' : 'default',
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={(e) => { if (clickable) { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.05)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)'; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: isDebit ? 'rgba(249,115,22,0.12)' : 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isDebit ? <ArrowUpRight style={{ width: 14, height: 14, color: C.orange }} /> : <ArrowDownLeft style={{ width: 14, height: 14, color: C.emerald }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text, textTransform: 'capitalize' }}>{entry.transaction_type}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: 10, color: C.muted }}>
                        <Clock style={{ width: 10, height: 10 }} />
                        {formatDateTime(entry.created_at)}
                        {entry.payment_method && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <CreditCard style={{ width: 10, height: 10 }} />
                            {entry.payment_method}
                          </span>
                        )}
                      </div>
                      {entry.notes && <p style={{ margin: '3px 0 0', fontSize: 10, color: C.muted, fontStyle: 'italic' }}>{entry.notes}</p>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: isDebit ? C.orange : C.emerald }}>
                        {isDebit ? '+' : '−'} {formatCurrency(entry.amount)}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 9, color: C.muted }}>Bal: {formatCurrency(entry.balance_after)}</p>
                    </div>
                    {clickable && <ChevronRight style={{ width: 14, height: 14, color: '#1e293b', flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Medicines panel link ── */}
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pill style={{ width: 20, height: 20, color: C.indigoLight }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.text }}>Supplier Medicines Database</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>
              {medicines.length} batch{medicines.length === 1 ? '' : 'es'} sourced from this supplier
              {lowStockByMedicine.length > 0 && ` · ${lowStockByMedicine.length} low stock`}
              {expiryRows.length > 0 && ` · ${expiryRows.length} near expiry`}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/panel/suppliers/${supplierId}/medicines`)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 10,
            backgroundColor: C.indigo, color: '#fff',
            fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer',
            boxShadow: '0 6px 18px -8px rgba(99,102,241,0.6)',
          }}
        >
          View Full Database <ArrowRight style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* ── Medicines list (inline) ── */}
      {medicines.length > 0 && (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 100px 110px 36px', padding: '10px 18px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.015)', alignItems: 'center', gap: 8 }}>
            {['Medicine', 'Batch', 'Stock', 'Expiry', 'MRP', ''].map((h, i) => (
              <p key={i} style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{h}</p>
            ))}
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {medicines.slice(0, 100).map((m, i) => {
              const expired = m.days_to_expiry < 0;
              const expiringSoon = !expired && m.days_to_expiry <= NEAR_EXPIRY_DAYS;
              return (
                <div
                  key={m.batch_id}
                  onClick={() => router.push(`/panel/inventory/${m.medicine_id}`)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 110px 110px 100px 110px 36px', alignItems: 'center', gap: 8,
                    padding: '11px 18px', cursor: 'pointer',
                    borderBottom: i < Math.min(medicines.length, 100) - 1 ? `1px solid rgba(255,255,255,0.03)` : 'none',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package2 style={{ width: 12, height: 12, color: C.indigoLight }} />
                    </div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.medicine_name}</p>
                  </div>
                  <span style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.batch_number || '—'}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: m.is_low_stock ? C.amber : C.emerald }}>
                    {m.current_quantity}{m.is_low_stock && ' ⚠'}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: expired ? C.rose : expiringSoon ? C.amber : C.muted }}>
                    {m.expiry_date ? formatDate(m.expiry_date) : '—'}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{m.mrp != null ? formatCurrency(m.mrp) : '—'}</span>
                  <ChevronRight style={{ width: 13, height: 13, color: '#1e293b' }} />
                </div>
              );
            })}
          </div>
          {medicines.length > 100 && (
            <div style={{ padding: '10px 18px', borderTop: `1px solid ${C.cardBorder}`, fontSize: 11, color: C.muted, textAlign: 'center' }}>
              Showing first 100 of {medicines.length} batches
            </div>
          )}
        </div>
      )}

      {/* ── Recent purchases ── */}
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Receipt style={{ width: 14, height: 14, color: C.indigoLight }} />
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.text }}>Recent Purchases</h3>
        </div>
        {loadingPurchases ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loader2 style={{ width: 18, height: 18, color: C.muted, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : purchases.length === 0 ? (
          <EmptyPanel icon={Receipt} text="No recent purchases" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                  <th style={thStyle}>Bill #</th>
                  <th style={thStyle}>Date</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Items</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                  <th style={{ width: 30 }} />
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => {
                  const isPaid = p.payment_status === 'paid';
                  const isPartial = p.payment_status === 'partial';
                  const statusColor = isPaid ? C.emerald : isPartial ? C.amber : C.orange;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/panel/purchases/${p.id}`)}
                      style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={tdStyle}><span style={{ fontWeight: 800, color: C.text }}>{p.bill_number || p.id.slice(0, 8)}</span></td>
                      <td style={{ ...tdStyle, color: C.muted }}>{formatDate(p.bill_date)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: C.muted }}>{p.item_count || '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: C.text }}>{p.total_amount != null ? formatCurrency(p.total_amount) : '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, backgroundColor: `${statusColor}15`, color: statusColor, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {p.payment_status || '—'}
                        </span>
                      </td>
                      <td style={tdStyle}><ChevronRight style={{ width: 14, height: 14, color: '#1e293b' }} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Edit Modal ─── */}
      {showEdit && editForm && (
        <ModalBackdrop onClose={() => setShowEdit(false)}>
          <div style={{ backgroundColor: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}`, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Pencil style={{ width: 14, height: 14, color: C.indigoLight }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: C.text }}>Edit Supplier</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>{supplier.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowEdit(false)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Name *" full>
                  <Input value={editForm.name || ''} onChange={(v) => setEditForm({ ...editForm, name: v })} />
                </Field>
                <Field label="Contact Person">
                  <Input value={editForm.contact_person || ''} onChange={(v) => setEditForm({ ...editForm, contact_person: v })} />
                </Field>
                <Field label="Phone">
                  <Input value={editForm.phone || ''} onChange={(v) => setEditForm({ ...editForm, phone: v.replace(/\D/g, '').slice(0, 10) })} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={editForm.email || ''} onChange={(v) => setEditForm({ ...editForm, email: v })} />
                </Field>
                <Field label="GSTIN">
                  <Input value={editForm.gstin || ''} onChange={(v) => setEditForm({ ...editForm, gstin: v.toUpperCase() })} maxLength={15} placeholder="22AAAAA0000A1Z5" />
                </Field>
                <Field label="Address" full>
                  <Input value={editForm.address || ''} onChange={(v) => setEditForm({ ...editForm, address: v })} />
                </Field>
                <Field label="City">
                  <Input value={editForm.city || ''} onChange={(v) => setEditForm({ ...editForm, city: v })} />
                </Field>
                <Field label="State">
                  <Input value={editForm.state || ''} onChange={(v) => setEditForm({ ...editForm, state: v })} />
                </Field>
                <Field label="Pincode">
                  <Input value={editForm.pincode || ''} onChange={(v) => setEditForm({ ...editForm, pincode: v.replace(/\D/g, '').slice(0, 6) })} />
                </Field>
                <Field label="Credit Limit (₹)">
                  <Input type="number" value={editForm.credit_limit?.toString() || ''} onChange={(v) => setEditForm({ ...editForm, credit_limit: v ? Number(v) : null })} placeholder="No limit" />
                </Field>
                <Field label="Credit Days">
                  <Input type="number" value={editForm.credit_days?.toString() || ''} onChange={(v) => setEditForm({ ...editForm, credit_days: v ? Number(v) : null })} placeholder="No limit" />
                </Field>
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button onClick={() => setShowEdit(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'transparent', color: C.muted, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSaveEdit} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.indigo},#7c3aed)`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {saving ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 14, height: 14 }} />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* ─── Payment Modal ─── */}
      {showPay && (
        <ModalBackdrop onClose={() => setShowPay(false)}>
          <div style={{ backgroundColor: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}`, width: '100%', maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet style={{ width: 14, height: 14, color: C.emerald }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: C.text }}>Record Payment</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>{supplier.name}</p>
                </div>
              </div>

              <Field label={`Amount (₹) — Max: ${formatCurrency(supplier.outstanding_balance)}`} full>
                <input
                  type="number" min={1} max={supplier.outstanding_balance}
                  value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                  autoFocus
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.input, color: C.text, fontSize: 18, fontWeight: 900, outline: 'none', fontFamily: 'inherit' }}
                />
              </Field>
              <Field label="Payment Method" full>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.input, color: C.text, fontSize: 13, fontWeight: 600, outline: 'none', fontFamily: 'inherit' }}>
                  {['cash', 'upi', 'card', 'bank_transfer', 'cheque', 'rtgs', 'neft'].map((m) => (
                    <option key={m} value={m}>{m.replace(/_/g, ' ').toUpperCase()}</option>
                  ))}
                </select>
              </Field>
              <Field label="Notes" full>
                <Input value={payNote} onChange={setPayNote} placeholder="Cheque no., UTR, reference…" />
              </Field>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowPay(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'transparent', color: C.muted, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handlePayment} disabled={paying || !payAmount} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.emerald},#059669)`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: paying ? 'wait' : 'pointer', opacity: (paying || !payAmount) ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {paying ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <IndianRupee style={{ width: 14, height: 14 }} />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </ModalBackdrop>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────── */
function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color }}>{value}</p>
      <p style={{ margin: '2px 0 0', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, value }: { icon: any; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <Icon style={{ width: 13, height: 13, color: C.muted, marginTop: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{value}</span>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{value}</span>
    </div>
  );
}

function EmptyPanel({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 0', gap: 8, border: `1px dashed ${C.cardBorder}`, borderRadius: 12 }}>
      <Icon style={{ width: 24, height: 24, color: '#1e293b' }} />
      <p style={{ margin: 0, fontSize: 12, color: C.muted, fontWeight: 600 }}>{text}</p>
    </div>
  );
}

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      {children}
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 9, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', maxLength }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; maxLength?: number }) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}
      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.input, color: C.text, fontSize: 13, fontWeight: 600, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
      onFocus={(e) => { e.currentTarget.style.borderColor = C.indigo; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = C.cardBorder; }}
    />
  );
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' };
const tdStyle: React.CSSProperties = { padding: '12px', borderBottom: `1px solid rgba(255,255,255,0.03)` };
