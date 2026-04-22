'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Package2, AlertTriangle, Clock,
  Layers, IndianRupee, BarChart3, Plus,
  Edit2, RotateCcw, RefreshCw, X, Save, Truck, CheckCircle2,
  ArrowLeftRight,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */
interface MedicineDetail {
  id: string; name: string; generic_name: string | null;
  manufacturer: string | null; dosage_form: string | null;
  pack_size: number; hsn_code: string | null; gst_rate: number;
  min_stock_level: number;
}
interface Batch {
  id: string; batch_number: string; expiry_date: string;
  stock_quantity: number; purchase_price: number; mrp: number;
  supplier_id: string | null; created_at: string;
  // joined
  supplier_name?: string | null;
}
interface Supplier { id: string; name: string; phone: string | null; }

/* ─── Palette ────────────────────────────────────────────────── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569',
  indigo: '#6366f1', indigoLight: '#818cf8',
  emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e',
  orange: '#f97316',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

/* ─── Helpers ────────────────────────────────────────────────── */
function nextYear() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}
function daysToExpiry(expiry: string) {
  return Math.floor((new Date(expiry).getTime() - Date.now()) / 86400000);
}
function expiryStatus(expiry: string): 'expired' | 'critical' | 'warning' | 'ok' {
  const d = daysToExpiry(expiry);
  if (d < 0) return 'expired';
  if (d <= 30) return 'critical';
  if (d <= 90) return 'warning';
  return 'ok';
}
const STATUS_COLOR: Record<string, string> = {
  expired: C.rose, critical: C.orange, warning: C.amber, ok: C.emerald,
};

/* ─── Mini components ────────────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</p>
        <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 13, height: 13, color }} />
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{sub}</p>}
    </div>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string | null | undefined; accent?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
      <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: accent || C.text }}>{value}</span>
    </div>
  );
}

/* ─── Styled input for modals ─── */
function MInput({ label, value, onChange, type = 'text', placeholder, required, min, step, hint }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; min?: number; step?: string; hint?: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}{required && <span style={{ color: C.rose, marginLeft: 2 }}>*</span>}
      </label>
      <input
        type={type} value={value} placeholder={placeholder} required={required}
        min={min} step={step}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          padding: '9px 12px', backgroundColor: focus ? '#131929' : C.input,
          border: `1.5px solid ${focus ? C.indigo : C.inputBorder}`,
          borderRadius: 9, color: C.text, fontSize: 13, fontWeight: 500,
          outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          boxShadow: focus ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
          transition: 'all 0.15s ease', width: '100%',
        }}
      />
      {hint && <p style={{ margin: 0, fontSize: 10, color: C.indigo }}>{hint}</p>}
    </div>
  );
}

function MSelect({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          padding: '9px 12px', backgroundColor: focus ? '#131929' : C.input,
          border: `1.5px solid ${focus ? C.indigo : C.inputBorder}`,
          borderRadius: 9, color: C.text, fontSize: 13, fontWeight: 500,
          outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          appearance: 'none', cursor: 'pointer',
          boxShadow: focus ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
          transition: 'all 0.15s ease', width: '100%',
        }}
      >
        {children}
      </select>
    </div>
  );
}

/* ─── Modal Overlay ──────────────────── */
function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#0d1225', border: `1px solid ${C.cardBorder}`, borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function MedicineDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);
  const medicineId = params.id as string;

  const [medicine, setMedicine] = useState<MedicineDetail | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);

  // Add Batch modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ batch_number: '', expiry_date: nextYear(), quantity: '', purchase_price: '', mrp: '', selling_price: '', gst_percentage: '0', supplier_id: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Batch modal
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [editForm, setEditForm] = useState({ batch_number: '', expiry_date: '', purchase_price: '', mrp: '', gst_percentage: '0' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Stock Adjust modal
  const [adjustBatch, setAdjustBatch] = useState<Batch | null>(null);
  const [adjustDelta, setAdjustDelta] = useState('');
  const [adjustReason, setAdjustReason] = useState('Manual adjustment');
  const [adjustSaving, setAdjustSaving] = useState(false);

  // Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDrop, setShowSupplierDrop] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const supplierRef = useRef<HTMLDivElement>(null);

  /* ─ Load ─ */
  const load = useCallback(async () => {
    if (!pharmacyId || !medicineId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [medRes, batchRes] = await Promise.all([
        supabase.from('medicines').select('*').eq('id', medicineId).eq('pharmacy_id', pharmacyId).single(),
        supabase.from('batches')
          .select('id, batch_number, expiry_date, stock_quantity, purchase_price, mrp, supplier_id, created_at')
          .eq('medicine_id', medicineId).eq('pharmacy_id', pharmacyId)
          .order('expiry_date'),
      ]);
      if (medRes.data) setMedicine(medRes.data);

      // enrich batches with supplier names
      const batchData: Batch[] = batchRes.data || [];
      const supplierIds = [...new Set(batchData.map(b => b.supplier_id).filter(Boolean))] as string[];
      if (supplierIds.length > 0) {
        const { data: sups } = await supabase.from('suppliers').select('id, name').in('id', supplierIds);
        const supMap = Object.fromEntries((sups || []).map(s => [s.id, s.name]));
        batchData.forEach(b => { b.supplier_name = b.supplier_id ? supMap[b.supplier_id] ?? null : null; });
      }
      setBatches(batchData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [pharmacyId, medicineId, supabase]);

  useEffect(() => {
    if (pharmacyId) { load(); }
    else { setLoading(false); }
  }, [pharmacyId, medicineId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load suppliers when add modal opens
  useEffect(() => {
    if (!showAdd || !pharmacyId) return;
    supabase.from('suppliers').select('id, name, phone').eq('pharmacy_id', pharmacyId).order('name')
      .then(({ data }) => setSuppliers(data || []));
  }, [showAdd, pharmacyId, supabase]);

  // Close supplier dropdown on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (supplierRef.current && !supplierRef.current.contains(e.target as Node)) setShowSupplierDrop(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ─ Add Batch ─ */
  async function handleAddBatch(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    const qty = Number(addForm.quantity);
    const rate = Number(addForm.purchase_price);
    const mrp = Number(addForm.mrp);
    if (!addForm.batch_number.trim() || qty <= 0 || rate < 0 || mrp <= 0) {
      setAddError('Batch number, quantity (>0), purchase rate (≥0), and MRP (>0) are required.');
      return;
    }
    setAddSaving(true);
    try {
      const { error } = await supabase.from('batches').insert({
        pharmacy_id: pharmacyId,
        medicine_id: medicineId,
        batch_number: addForm.batch_number.trim(),
        expiry_date: addForm.expiry_date,
        stock_quantity: qty,
        purchase_price: rate,
        mrp,
        supplier_id: selectedSupplier?.id ?? null,
      });
      if (error) throw error;
      toast.success('Batch added!');
      setShowAdd(false);
      setAddForm({ batch_number: '', expiry_date: nextYear(), quantity: '', purchase_price: '', mrp: '', selling_price: '', gst_percentage: '0', supplier_id: '' });
      setSelectedSupplier(null);
      await load();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add batch');
    } finally { setAddSaving(false); }
  }

  /* ─ Edit Batch ─ */
  function openEdit(b: Batch) {
    setEditBatch(b);
    setEditForm({
      batch_number: b.batch_number,
      expiry_date: b.expiry_date,
      purchase_price: String(b.purchase_price),
      mrp: String(b.mrp),
      gst_percentage: '0',
    });
    setEditError(null);
  }
  async function handleEditBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!editBatch) return;
    setEditError(null);
    const rate = Number(editForm.purchase_price);
    const mrp = Number(editForm.mrp);
    if (!editForm.batch_number.trim() || rate < 0 || mrp <= 0) {
      setEditError('Batch number, purchase rate (≥0), and MRP (>0) are required.');
      return;
    }
    setEditSaving(true);
    try {
      const { error } = await supabase.from('batches').update({
        batch_number: editForm.batch_number.trim(),
        expiry_date: editForm.expiry_date,
        purchase_price: rate,
        mrp,
      }).eq('id', editBatch.id);
      if (error) throw error;
      toast.success('Batch updated!');
      setEditBatch(null);
      await load();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update batch');
    } finally { setEditSaving(false); }
  }

  /* ─ Stock Adjust ─ */
  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustBatch) return;
    const delta = Number(adjustDelta);
    if (isNaN(delta) || delta === 0) return;
    const newQty = Math.max(0, adjustBatch.stock_quantity + delta);
    setAdjustSaving(true);
    try {
      const { error } = await supabase.from('batches').update({ stock_quantity: newQty }).eq('id', adjustBatch.id);
      if (error) throw error;
      toast.success(`Stock adjusted to ${newQty}`);
      setAdjustBatch(null);
      setAdjustDelta('');
      setAdjustReason('Manual adjustment');
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Adjustment failed');
    } finally { setAdjustSaving(false); }
  }

  /* ─ Derived ─ */
  const today = new Date().toISOString().split('T')[0];
  const activeBatches = batches.filter(b => b.stock_quantity > 0);
  const nearExpiry = batches.filter(b => { const d = daysToExpiry(b.expiry_date); return d >= 0 && d <= 90; });
  const expiredCount = batches.filter(b => b.expiry_date < today).length;
  const totalStock = batches.reduce((s, b) => s + b.stock_quantity, 0);
  const totalValue = batches.reduce((s, b) => s + b.stock_quantity * b.mrp, 0);
  const isLow = medicine && totalStock < (medicine.min_stock_level || 10);

  /* ─ Filtered suppliers ─ */
  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));

  /* ─ Render ─ */
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 14 }}>
        <Loader2 style={{ width: 24, height: 24, color: C.indigo, animation: 'spin 1s linear infinite' }} />
        <p style={{ margin: 0, fontSize: 12, color: C.muted }}>Loading medicine...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: C.muted, fontWeight: 600 }}>Medicine not found</p>
        <button onClick={() => router.back()} style={{ color: C.indigo, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>← Go back</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <button
            onClick={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}
          >
            <ArrowLeft style={{ width: 15, height: 15 }} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>{medicine.name}</h1>
              {isLow && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, backgroundColor: 'rgba(244,63,94,0.12)', color: C.rose, fontSize: 10, fontWeight: 800, border: '1px solid rgba(244,63,94,0.2)' }}>
                  <AlertTriangle style={{ width: 10, height: 10 }} /> Low Stock
                </span>
              )}
              {nearExpiry.length > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.12)', color: C.amber, fontSize: 10, fontWeight: 800, border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Clock style={{ width: 10, height: 10 }} /> {nearExpiry.length} batch{nearExpiry.length > 1 ? 'es' : ''} near expiry
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>
              {[medicine.generic_name, medicine.dosage_form, medicine.manufacturer].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={load}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
          </button>
          <button
            onClick={() => { setShowAdd(true); setAddError(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(99,102,241,0.3)', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            Add Stock
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Total Stock" value={totalStock} sub={`Min alert: ${medicine.min_stock_level || 10}`} icon={BarChart3} color={totalStock < (medicine.min_stock_level || 10) ? C.amber : C.emerald} />
        <StatCard label="Active Batches" value={activeBatches.length} sub={`${expiredCount} expired`} icon={Layers} color={C.indigoLight} />
        <StatCard label="Near Expiry" value={nearExpiry.length} sub="Within 90 days" icon={Clock} color={nearExpiry.length > 0 ? C.amber : C.emerald} />
        <StatCard label="Stock Value (MRP)" value={formatCurrency(totalValue)} sub="At maximum retail price" icon={IndianRupee} color={C.emerald} />
      </div>

      {/* ── Info + Batches ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }}>

        {/* Info panel */}
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 18 }}>
          <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Medicine Info</p>
          <InfoRow label="Dosage Form" value={medicine.dosage_form} />
          <InfoRow label="Pack Size" value={`${medicine.pack_size} units`} />
          <InfoRow label="GST Rate" value={`${medicine.gst_rate}%`} />
          <InfoRow label="HSN Code" value={medicine.hsn_code} />
          <InfoRow label="Min Stock Alert" value={`${medicine.min_stock_level || 10} units`} />
          {medicine.generic_name && <InfoRow label="Generic Name" value={medicine.generic_name} />}
          {medicine.manufacturer && <InfoRow label="Manufacturer" value={medicine.manufacturer} />}
        </div>

        {/* Batches */}
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>Stock Batches</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>{batches.length} batch{batches.length !== 1 ? 'es' : ''} total</p>
            </div>
            {expiredCount > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, backgroundColor: 'rgba(244,63,94,0.1)', color: C.rose, fontSize: 10, fontWeight: 800, border: '1px solid rgba(244,63,94,0.2)' }}>
                <AlertTriangle style={{ width: 10, height: 10 }} /> {expiredCount} expired
              </span>
            )}
          </div>

          {batches.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Package2 style={{ width: 28, height: 28, color: '#1e293b' }} />
              <p style={{ margin: 0, fontSize: 13, color: C.muted }}>No stock batches yet</p>
              <button onClick={() => { setShowAdd(true); setAddError(null); }} style={{ color: C.indigo, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>+ Add first stock batch</button>
            </div>
          ) : (
            <div>
              {batches.map((b, i) => {
                const status = expiryStatus(b.expiry_date);
                const sColor = STATUS_COLOR[status];
                const d = daysToExpiry(b.expiry_date);
                return (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                      borderBottom: i < batches.length - 1 ? `1px solid rgba(255,255,255,0.03)` : 'none',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {/* Status bar */}
                    <div style={{ width: 4, height: 52, borderRadius: 2, backgroundColor: sColor, flexShrink: 0 }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>Batch: {b.batch_number}</span>
                        {b.supplier_name && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 6, backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa', fontSize: 10, fontWeight: 700, border: '1px solid rgba(96,165,250,0.15)' }}>
                            <Truck style={{ width: 9, height: 9 }} /> {b.supplier_name}
                          </span>
                        )}
                        {b.stock_quantity === 0 && (
                          <span style={{ padding: '2px 6px', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, fontSize: 9, fontWeight: 800 }}>OUT OF STOCK</span>
                        )}
                        {status === 'expired' && (
                          <span style={{ padding: '2px 6px', borderRadius: 6, backgroundColor: 'rgba(244,63,94,0.12)', color: C.rose, fontSize: 9, fontWeight: 800 }}>EXPIRED</span>
                        )}
                        {status === 'critical' && (
                          <span style={{ padding: '2px 6px', borderRadius: 6, backgroundColor: 'rgba(249,115,22,0.12)', color: C.orange, fontSize: 9, fontWeight: 800 }}>{d}d left</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: C.muted }}>
                          Exp: <strong style={{ color: status !== 'ok' ? sColor : '#94a3b8' }}>{b.expiry_date}</strong>
                        </span>
                        <span style={{ fontSize: 11, color: C.muted }}>MRP: <strong style={{ color: '#94a3b8' }}>{formatCurrency(b.mrp)}</strong></span>
                        <span style={{ fontSize: 11, color: C.muted }}>Rate: <strong style={{ color: '#94a3b8' }}>{formatCurrency(b.purchase_price)}</strong></span>
                      </div>
                    </div>

                    {/* Stock qty + actions */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: b.stock_quantity === 0 ? '#334155' : b.stock_quantity < 10 ? C.rose : C.text, lineHeight: 1 }}>
                        {b.stock_quantity}
                      </p>
                      <p style={{ margin: '2px 0 4px', fontSize: 9, color: C.muted, fontWeight: 700 }}>units</p>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                        <button onClick={() => openEdit(b)} style={{ fontSize: 10, color: C.muted, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          onMouseEnter={e => { e.currentTarget.style.color = C.text; }}
                          onMouseLeave={e => { e.currentTarget.style.color = C.muted; }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Edit2 style={{ width: 9, height: 9 }} />Edit</span>
                        </button>
                        <button onClick={() => { setAdjustBatch(b); setAdjustDelta(''); setAdjustReason('Manual adjustment'); }} style={{ fontSize: 10, color: C.indigo, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          onMouseEnter={e => { e.currentTarget.style.color = C.indigoLight; }}
                          onMouseLeave={e => { e.currentTarget.style.color = C.indigo; }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><RotateCcw style={{ width: 9, height: 9 }} />Adjust qty</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Footer */}
              <div style={{ padding: '10px 20px', borderTop: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: 11, color: '#334155', fontWeight: 500 }}>
                  Avg. margin: {totalValue > 0
                    ? `${Math.round(((totalValue - batches.reduce((s, b) => s + b.stock_quantity * b.purchase_price, 0)) / totalValue) * 100)}%`
                    : '—'}
                </p>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.text }}>Total: {formatCurrency(totalValue)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─────── Brand Alternatives placeholder ─────── */}
      {medicine.generic_name && (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ArrowLeftRight style={{ width: 14, height: 14, color: C.indigo }} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>Brand Alternatives</p>
            <span style={{ padding: '2px 8px', borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.1)', color: C.indigoLight, fontSize: 10, fontWeight: 700 }}>{medicine.generic_name}</span>
          </div>
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <ArrowLeftRight style={{ width: 24, height: 24, color: '#1e293b', margin: '0 auto' }} />
            <p style={{ margin: '8px 0 0', fontSize: 12, color: C.muted }}>Medicines with the same generic composition will appear here.</p>
          </div>
        </div>
      )}

      {/* ═══════ ADD BATCH MODAL ═══════ */}
      {showAdd && (
        <Overlay onClose={() => { setShowAdd(false); setSelectedSupplier(null); setSupplierSearch(''); }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus style={{ width: 16, height: 16, color: C.indigoLight }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>Add Stock Batch</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>{medicine.name}</p>
              </div>
            </div>
            <button onClick={() => { setShowAdd(false); setSelectedSupplier(null); setSupplierSearch(''); }} style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {addError && (
            <div style={{ margin: '16px 24px 0', padding: '10px 14px', backgroundColor: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle style={{ width: 13, height: 13, color: C.rose, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 12, color: '#fda4af' }}>{addError}</p>
            </div>
          )}

          <form onSubmit={handleAddBatch} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <MInput label="Batch Number" value={addForm.batch_number} onChange={v => setAddForm(f => ({ ...f, batch_number: v }))} placeholder="e.g. BT-2024-001" required />
              <MInput label="Expiry Date" value={addForm.expiry_date} onChange={v => setAddForm(f => ({ ...f, expiry_date: v }))} type="date" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <MInput label="Quantity (units)" value={addForm.quantity} onChange={v => setAddForm(f => ({ ...f, quantity: v }))} type="number" min={1} placeholder="0" required />
              <MSelect label="GST %" value={addForm.gst_percentage} onChange={v => setAddForm(f => ({ ...f, gst_percentage: v }))}>
                {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
              </MSelect>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <MInput label="Purchase Rate ₹" value={addForm.purchase_price} onChange={v => setAddForm(f => ({ ...f, purchase_price: v }))} type="number" min={0} step="0.01" placeholder="0.00" required />
              <MInput label="MRP ₹" value={addForm.mrp} onChange={v => setAddForm(f => ({ ...f, mrp: v }))} type="number" min={0} step="0.01" placeholder="0.00" required />
              <MInput label="Selling Price ₹" value={addForm.selling_price} onChange={v => setAddForm(f => ({ ...f, selling_price: v }))} type="number" min={0} step="0.01" placeholder="Same as MRP" />
            </div>

            {/* Supplier */}
            <div ref={supplierRef} style={{ position: 'relative' }}>
              <label style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>
                Supplier <span style={{ color: '#334155', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <div
                onClick={() => setShowSupplierDrop(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', backgroundColor: C.input, border: `1.5px solid ${C.inputBorder}`, borderRadius: 9, cursor: 'pointer', transition: 'border 0.15s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.inputBorder; }}
              >
                <Truck style={{ width: 13, height: 13, color: C.muted, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: selectedSupplier ? C.text : C.muted, fontWeight: selectedSupplier ? 600 : 400 }}>
                  {selectedSupplier ? selectedSupplier.name : 'Select supplier…'}
                </span>
                {selectedSupplier && (
                  <button type="button" onClick={e => { e.stopPropagation(); setSelectedSupplier(null); setSupplierSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex' }}>
                    <X style={{ width: 12, height: 12 }} />
                  </button>
                )}
              </div>
              {showSupplierDrop && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: '#0d1225', border: `1px solid ${C.cardBorder}`, borderRadius: 12, zIndex: 30, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', maxHeight: 220 }}>
                  <div style={{ padding: 8, borderBottom: `1px solid ${C.cardBorder}` }}>
                    <input
                      type="text" value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)}
                      placeholder="Search supplier…" autoFocus
                      style={{ width: '100%', padding: '7px 10px', backgroundColor: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 8, color: C.text, fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ overflowY: 'auto', maxHeight: 160 }}>
                    {filteredSuppliers.length === 0
                      ? <p style={{ padding: '12px 16px', margin: 0, fontSize: 12, color: C.muted, textAlign: 'center' }}>No suppliers found</p>
                      : filteredSuppliers.map(s => (
                        <button key={s.id} type="button"
                          onClick={() => { setSelectedSupplier(s); setShowSupplierDrop(false); setSupplierSearch(''); }}
                          style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: C.text, fontSize: 13, fontWeight: 600, transition: 'background 0.1s ease' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.08)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          {s.name}
                          {s.phone && <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{s.phone}</span>}
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Info tip */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 10 }}>
              <CheckCircle2 style={{ width: 13, height: 13, color: C.indigoLight, flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                Stock will be added directly. For invoice-linked purchases, use the <strong style={{ color: C.text }}>Purchases</strong> module.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => { setShowAdd(false); setSelectedSupplier(null); setSupplierSearch(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.03)', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease' }}>
                Cancel
              </button>
              <button type="submit" disabled={addSaving}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: addSaving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {addSaving ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 15, height: 15 }} />}
                {addSaving ? 'Adding...' : 'Add Batch'}
              </button>
            </div>
          </form>
        </Overlay>
      )}

      {/* ═══════ EDIT BATCH MODAL ═══════ */}
      {editBatch && (
        <Overlay onClose={() => setEditBatch(null)}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Edit2 style={{ width: 15, height: 15, color: C.muted }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>Edit Batch</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>{medicine.name}</p>
              </div>
            </div>
            <button onClick={() => setEditBatch(null)} style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
          {editError && (
            <div style={{ margin: '16px 24px 0', padding: '10px 14px', backgroundColor: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle style={{ width: 13, height: 13, color: C.rose }} />
              <p style={{ margin: 0, fontSize: 12, color: '#fda4af' }}>{editError}</p>
            </div>
          )}
          <form onSubmit={handleEditBatch} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <MInput label="Batch Number" value={editForm.batch_number} onChange={v => setEditForm(f => ({ ...f, batch_number: v }))} required />
              <MInput label="Expiry Date" value={editForm.expiry_date} onChange={v => setEditForm(f => ({ ...f, expiry_date: v }))} type="date" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <MInput label="Purchase Rate ₹" value={editForm.purchase_price} onChange={v => setEditForm(f => ({ ...f, purchase_price: v }))} type="number" min={0} step="0.01" required />
              <MInput label="MRP ₹" value={editForm.mrp} onChange={v => setEditForm(f => ({ ...f, mrp: v }))} type="number" min={0} step="0.01" required />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setEditBatch(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.03)', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={editSaving} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: editSaving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {editSaving ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 14, height: 14 }} />}
                Save Changes
              </button>
            </div>
          </form>
        </Overlay>
      )}

      {/* ═══════ STOCK ADJUST MODAL ═══════ */}
      {adjustBatch && (
        <Overlay onClose={() => setAdjustBatch(null)}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>Adjust Stock</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>Batch: {adjustBatch.batch_number} · Current: {adjustBatch.stock_quantity} units</p>
            </div>
            <button onClick={() => setAdjustBatch(null)} style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <form onSubmit={handleAdjust} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <MInput
              label="Quantity Change (use − for removal)"
              value={adjustDelta}
              onChange={setAdjustDelta}
              type="number"
              placeholder="e.g. +10 or -5"
              hint={adjustDelta && !isNaN(Number(adjustDelta))
                ? `New quantity: ${Math.max(0, adjustBatch.stock_quantity + Number(adjustDelta))}`
                : undefined}
            />
            <MInput label="Reason" value={adjustReason} onChange={setAdjustReason} placeholder="Reason for adjustment" />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setAdjustBatch(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.03)', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={adjustSaving || !adjustDelta || isNaN(Number(adjustDelta)) || Number(adjustDelta) === 0}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (!adjustDelta || isNaN(Number(adjustDelta)) || Number(adjustDelta) === 0) ? 0.5 : 1 }}>
                {adjustSaving ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 14, height: 14 }} />}
                Save Adjustment
              </button>
            </div>
          </form>
        </Overlay>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
