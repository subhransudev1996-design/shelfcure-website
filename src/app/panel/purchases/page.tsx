'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency, formatDate, formatRelativeTime, monthRange } from '@/lib/utils/format';
import { Modal } from '@/components/panel/Modal';
import toast from 'react-hot-toast';
import {
  Truck, Search, X, RefreshCw, Plus,
  Calendar, ChevronRight, TrendingUp, Package2,
  AlertCircle, Save, Trash2, CheckCircle2, Loader2, IndianRupee,
  ScanLine, FileText, ShoppingCart, RotateCcw,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────── */
interface Purchase {
  id: string;
  bill_number: string | null;
  supplier_name: string; // mapped from suppliers(name) join
  bill_date: string;
  total_amount: number;
  payment_status: string;
}

interface PurchaseItemForm {
  medicine_name: string;
  medicine_id: string | null;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  free_quantity: number;
  purchase_rate: number;
  mrp: number;
  gst_rate: number;
}

type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'all';

/* ─── Palette ────────────────────────────────────────── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569',
  indigo: '#6366f1', indigoLight: '#818cf8',
  emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e',
  blue: '#3b82f6', purple: '#a855f7',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

/* ─── Date preset helpers ────────────────────────────── */
function isToday(d: Date) {
  const n = new Date(); return d.toDateString() === n.toDateString();
}
function isYesterday(d: Date) {
  const n = new Date(); n.setDate(n.getDate() - 1); return d.toDateString() === n.toDateString();
}
function isThisWeek(d: Date) {
  const n = new Date(); n.setDate(n.getDate() - 6); return d >= n;
}
function isThisMonth(d: Date) {
  const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

/* ─── Sub-components ─────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, color, loading }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string; loading?: boolean;
}) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', backgroundColor: `${color}08`, filter: 'blur(20px)' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</p>
        <div style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 13, height: 13, color }} />
        </div>
      </div>
      {loading
        ? <div style={{ height: 28, width: '55%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.04)', animation: 'pulse 1.6s ease-in-out infinite' }} />
        : <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      }
      {sub && <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{sub}</p>}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function PurchasesPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [preset, setPreset] = useState<DatePreset>('all');

  const { from: mFrom, to: mTo } = monthRange(0);
  // Default custom range: last 12 months → today, so newly saved purchases (any date) appear.
  const defaultFrom = (() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  })();
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(mTo);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add flow
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [purBillNo, setPurBillNo] = useState('');
  const [purSupplier, setPurSupplier] = useState('');
  const [purDate, setPurDate] = useState(new Date().toISOString().split('T')[0]);
  const [purItems, setPurItems] = useState<PurchaseItemForm[]>([]);

  /* ─── Load ─── */
  const load = useCallback(async () => {
    if (!pharmacyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('id, bill_number, supplier_id, bill_date, total_amount, payment_status, suppliers(name)')
        .eq('pharmacy_id', pharmacyId)
        .order('bill_date', { ascending: false })
        .limit(300);

      if (error) throw error;
      setPurchases(
        (data || []).map((p: any) => ({
          ...p,
          supplier_name: p.suppliers?.name || '—',
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, supabase]);

  useEffect(() => {
    if (pharmacyId) { load(); }
    else { setLoading(false); }
  }, [pharmacyId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Client-side filter ─── */
  const filtered = useMemo(() => {
    return purchases.filter(p => {
      const d = new Date(p.bill_date);
      // Date filter
      const passDate = (() => {
        if (preset === 'today')     return isToday(d);
        if (preset === 'yesterday') return isYesterday(d);
        if (preset === 'week')      return isThisWeek(d);
        if (preset === 'month')     return isThisMonth(d);
        // 'all' uses custom range
        if (preset === 'all') {
            const fd = new Date(dateFrom);
            const td = new Date(dateTo + 'T23:59:59');
            return d >= fd && d <= td;
        }
        return true; 
      })();
      if (!passDate) return false;
      // Search
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (p.supplier_name || '').toLowerCase().includes(q) ||
        (p.bill_number || '').toLowerCase().includes(q)
      );
    });
  }, [purchases, preset, search, dateFrom, dateTo]);

  /* ─── Stats ─── */
  const totalAmount = filtered.reduce((s, p) => s + p.total_amount, 0);
  const paidCount = filtered.filter(p => p.payment_status === 'paid').length;
  const pendingAmount = filtered.filter(p => p.payment_status !== 'paid').reduce((s, p) => s + p.total_amount, 0);
  const uniqueSuppliers = new Set(filtered.map(p => p.supplier_name)).size;

  const PRESETS: { key: DatePreset; label: string }[] = [
    { key: 'today',     label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week',      label: 'This Week' },
    { key: 'month',     label: 'This Month' },
    { key: 'all',       label: 'All/Custom' },
  ];

  /* ─── Modals Logic ─── */
  const addItemRow = () => {
    setPurItems([
      ...purItems,
      { medicine_name: '', medicine_id: null, batch_number: '', expiry_date: '', quantity: 0, free_quantity: 0, purchase_rate: 0, mrp: 0, gst_rate: 12 },
    ]);
  };
  const updateItem = (i: number, field: keyof PurchaseItemForm, value: string | number) => {
    const updated = [...purItems];
    (updated[i] as any)[field] = value;
    setPurItems(updated);
  };
  const removeItem = (i: number) => setPurItems(purItems.filter((_, idx) => idx !== i));

  const handleSavePurchase = async () => {
    if (!purSupplier || purItems.length === 0) {
      toast.error('Add supplier name and at least one item');
      return;
    }
    setSaving(true);
    try {
      const totAmt = purItems.reduce((s, item) => s + item.purchase_rate * item.quantity, 0);

      // Look up supplier by name to get their ID
      const { data: supplierRow } = await supabase
        .from('suppliers')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .ilike('name', purSupplier.trim())
        .maybeSingle();

      const { data: purchase, error: purErr } = await supabase
        .from('purchases')
        .insert({
          pharmacy_id: pharmacyId,
          bill_number: purBillNo || null,
          supplier_id: supplierRow?.id || null,
          bill_date: purDate,
          total_amount: totAmt,
          payment_status: 'paid',
        })
        .select('id')
        .single();

      if (purErr) throw purErr;

      for (const item of purItems) {
        let medId = item.medicine_id;
        if (!medId && item.medicine_name) {
          const { data: existing } = await supabase.from('medicines').select('id').eq('pharmacy_id', pharmacyId!).ilike('name', item.medicine_name).single();
          if (existing) {
            medId = existing.id;
          } else {
            const { data: newMed } = await supabase.from('medicines').insert({ pharmacy_id: pharmacyId, name: item.medicine_name, pack_size: 1, gst_rate: item.gst_rate }).select('id').single();
            medId = newMed?.id || null;
          }
        }
        if (!medId) continue;

        // Create batch
        await supabase.from('batches').insert({
          pharmacy_id: pharmacyId,
          medicine_id: medId,
          batch_number: item.batch_number || 'N/A',
          expiry_date: item.expiry_date || '2099-12-31',
          stock_quantity: item.quantity + item.free_quantity,
          purchase_price: item.purchase_rate,
          mrp: item.mrp || item.purchase_rate,
        });

        // Create purchase item
        await supabase.from('purchase_items').insert({
          purchase_id: purchase.id,
          pharmacy_id: pharmacyId,
          medicine_id: medId,
          batch_number: item.batch_number || 'N/A',
          quantity: item.quantity,
          free_quantity: item.free_quantity,
          purchase_rate: item.purchase_rate,
          mrp: item.mrp,
          gst_rate: item.gst_rate,
          total_amount: item.purchase_rate * item.quantity,
        });
      }

      toast.success('Purchase recorded successfully');
      setShowAdd(false);
      setPurBillNo('');
      setPurSupplier('');
      setPurItems([]);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save purchase');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Render ─── */
  const inCls = 'w-full px-3 py-2 bg-slate-800/40 border border-white/10 rounded-lg text-sm text-white font-medium focus:outline-none focus:border-purple-500/50 transition-all placeholder-slate-600';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck style={{ width: 18, height: 18, color: C.purple }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Purchases</h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>
              {loading ? 'Loading…' : `${filtered.length} purchase${filtered.length !== 1 ? 's' : ''} · ${formatCurrency(totalAmount)} spend`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Refresh */}
          <button onClick={load} disabled={loading}
            title="Refresh"
            style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}
          >
            <RefreshCw style={{ width: 14, height: 14, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>

          <div style={{ width: 1, height: 24, backgroundColor: C.cardBorder, margin: '0 2px', flexShrink: 0 }} />

          {/* Returns */}
          <button
            onClick={() => router.push('/panel/purchases/returns')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 11, border: '1px solid rgba(249,115,22,0.3)', backgroundColor: 'rgba(249,115,22,0.08)', color: '#fb923c', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.15)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.08)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'; }}
          >
            <RotateCcw style={{ width: 13, height: 13 }} /> Returns
          </button>

          {/* Challans */}
          <button
            onClick={() => router.push('/panel/challans')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 11, border: '1px solid rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.08)', color: '#fbbf24', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.15)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.08)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; }}
          >
            <FileText style={{ width: 13, height: 13 }} /> Challans
          </button>

          {/* Reorders */}
          <button
            onClick={() => router.push('/panel/purchases/orders')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 11, border: '1px solid rgba(99,102,241,0.3)', backgroundColor: 'rgba(99,102,241,0.08)', color: C.indigoLight, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.15)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
          >
            <ShoppingCart style={{ width: 13, height: 13 }} /> Reorders
          </button>

          {/* Manual Entry */}
          <button
            onClick={() => router.push('/panel/purchases/manual')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 11, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <Plus style={{ width: 13, height: 13 }} /> Manual Entry
          </button>

          {/* Scan Bill — Primary CTA */}
          <button
            onClick={() => router.push('/panel/purchases/scan')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 11, border: 'none', background: `linear-gradient(135deg, ${C.indigo}, #7c3aed)`, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(99,102,241,0.35)', transition: 'all 0.15s ease', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(99,102,241,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.35)'; }}
          >
            <ScanLine style={{ width: 13, height: 13 }} /> Scan Bill
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Total Spend" value={formatCurrency(totalAmount)} sub={`${filtered.length} invoices`} icon={TrendingUp} color={C.purple} loading={loading} />
        <StatCard label="Pending Payment" value={formatCurrency(pendingAmount)} sub="Unpaid supplier invoices" icon={AlertCircle} color={pendingAmount > 0 ? C.rose : C.emerald} loading={loading} />
        <StatCard label="Paid Invoices" value={String(paidCount)} sub="Fully settled" icon={CheckCircle2} color={C.emerald} loading={loading} />
        <StatCard label="Suppliers" value={String(uniqueSuppliers)} sub="Active in period" icon={Truck} color={C.blue} loading={loading} />
      </div>

      {/* ── Filters row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Date presets */}
        <div style={{ display: 'flex', gap: 5, backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: 4 }}>
          {PRESETS.map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                backgroundColor: preset === p.key ? C.purple : 'transparent',
                color: preset === p.key ? '#fff' : C.muted,
                boxShadow: preset === p.key ? '0 4px 12px rgba(168,85,247,0.3)' : 'none',
              }}
              onMouseEnter={e => { if (preset !== p.key) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text; } }}
              onMouseLeave={e => { if (preset !== p.key) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.muted; } }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date range (visible if 'all' selected as fallback for custom) */}
        {preset === 'all' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', backgroundColor: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10 }}>
            <Calendar style={{ width: 13, height: 13, color: C.muted }} />
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); }}
              style={{ background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} />
            <span style={{ color: C.muted, fontSize: 11 }}>→</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); }}
              style={{ background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} />
          </div>
        )}

        {/* Search */}
        <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 38, backgroundColor: searchFocus ? '#111827' : C.input, border: `1.5px solid ${searchFocus ? C.purple : C.inputBorder}`, borderRadius: 10, transition: 'all 0.15s ease', boxShadow: searchFocus ? '0 0 0 3px rgba(168,85,247,0.12)' : 'none' }}>
          <Search style={{ width: 13, height: 13, color: searchFocus ? C.purple : C.muted, flexShrink: 0 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
            placeholder="Search supplier, bill number..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 12, fontWeight: 500, color: C.text, fontFamily: 'inherit' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 1 }}>
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(168,85,247,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 style={{ width: 22, height: 22, color: C.purple, animation: 'spin 1s linear infinite' }} />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, fontWeight: 500 }}>Loading purchases…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 32px', gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(168,85,247,0.06)', border: `1px solid rgba(168,85,247,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck style={{ width: 26, height: 26, color: 'rgba(168,85,247,0.4)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#334155' }}>No purchases found</p>
            <p style={{ margin: '5px 0 0', fontSize: 12, color: '#1e293b' }}>
              {search ? `No results for "${search}"` : 'No purchases in this period'}
            </p>
          </div>
          {(search || preset !== 'all') && (
            <button onClick={() => { setSearch(''); setPreset('all'); }}
              style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px 36px', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.012)' }}>
            {['Supplier / Bill', 'Date', 'Amount', 'Status', ''].map((h, i) => (
              <p key={i} style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.09em', textAlign: i === 2 || i === 3 ? 'right' : 'left' }}>{h}</p>
            ))}
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 400px)' }}>
            {filtered.map((pur, idx) => {
              const pending = pur.payment_status?.toLowerCase() !== 'paid';
              return (
                <div
                  key={pur.id}
                  onClick={() => router.push(`/panel/purchases/${pur.id}`)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px 36px',
                    alignItems: 'center', padding: '13px 16px', cursor: 'pointer',
                    borderBottom: idx < filtered.length - 1 ? `1px solid rgba(255,255,255,0.025)` : 'none',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.035)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ minWidth: 0, paddingRight: 10 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pur.supplier_name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: C.indigoLight, fontWeight: 700 }}>
                      #{pur.bill_number || pur.id.slice(-6)}
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{formatDate(pur.bill_date)}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted }}>{formatRelativeTime(pur.bill_date)}</p>
                  </div>

                  <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.text, textAlign: 'right', letterSpacing: '-0.01em' }}>
                    {formatCurrency(pur.total_amount)}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 6 }}>
                    <span style={{ padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', ...(pending ? { backgroundColor: `${C.rose}14`, color: C.rose, border: `1px solid ${C.rose}20` } : { backgroundColor: `${C.emerald}14`, color: C.emerald, border: `1px solid ${C.emerald}20` }) }}>
                      {pur.payment_status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <ChevronRight style={{ width: 14, height: 14, color: '#1e293b' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Add Purchase Modal ── */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Purchase Entry" maxWidth="xl">
        <div style={{ backgroundColor: '#0d1225', padding: 24, borderRadius: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>Bill Number</label>
              <input type="text" value={purBillNo} onChange={e => setPurBillNo(e.target.value)} placeholder="INV-001" className={inCls} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>Supplier *</label>
              <input type="text" value={purSupplier} onChange={e => setPurSupplier(e.target.value)} placeholder="Supplier name" className={inCls} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>Date</label>
              <input type="date" value={purDate} onChange={e => setPurDate(e.target.value)} className={inCls} />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 12, fontWeight: 900, color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items</h4>
              <button onClick={addItemRow} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: C.purple, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                <Plus style={{ width: 12, height: 12 }} /> Add Row
              </button>
            </div>
            
            <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 6 }}>
              {purItems.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 60px 80px 80px 40px', gap: 8, alignItems: 'end', backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, border: `1px solid ${C.cardBorder}` }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>Medicine</label>
                    <input type="text" value={item.medicine_name} onChange={e => updateItem(i, 'medicine_name', e.target.value)} placeholder="Name" className={inCls} style={{ padding: '6px 10px', fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>Batch</label>
                    <input type="text" value={item.batch_number} onChange={e => updateItem(i, 'batch_number', e.target.value)} placeholder="Batch" className={inCls} style={{ padding: '6px 10px', fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>Expiry</label>
                    <input type="date" value={item.expiry_date} onChange={e => updateItem(i, 'expiry_date', e.target.value)} className={inCls} style={{ padding: '6px 10px', fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>Qty</label>
                    <input type="number" value={item.quantity || ''} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 0)} className={inCls} style={{ padding: '6px 10px', fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>Rate</label>
                    <input type="number" value={item.purchase_rate || ''} onChange={e => updateItem(i, 'purchase_rate', parseFloat(e.target.value) || 0)} step="0.01" className={inCls} style={{ padding: '6px 10px', fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>MRP</label>
                    <input type="number" value={item.mrp || ''} onChange={e => updateItem(i, 'mrp', parseFloat(e.target.value) || 0)} step="0.01" className={inCls} style={{ padding: '6px 10px', fontSize: 12 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 6 }}>
                    <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', transition: 'color 0.15s ease' }} onMouseEnter={e => e.currentTarget.style.color = C.rose} onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
                      <Trash2 style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: `1px solid ${C.cardBorder}` }}>
            <button onClick={() => setShowAdd(false)} style={{ padding: '10px 18px', background: 'none', border: 'none', color: C.muted, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
            <button
              onClick={handleSavePurchase} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.purple},#9333ea)`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 14, height: 14 }} />}
              {saving ? 'Saving...' : 'Save Purchase'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:0.8; } }
      `}</style>
    </div>
  );
}
