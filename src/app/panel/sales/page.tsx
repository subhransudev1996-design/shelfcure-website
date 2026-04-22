'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency, formatDate, formatRelativeTime, monthRange } from '@/lib/utils/format';
import {
  Receipt, ChevronRight, Loader2, IndianRupee, Search, X,
  Calendar, RefreshCw, TrendingUp, ShoppingBag, Users, CreditCard,
  Banknote, Smartphone, BarChart3,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────── */
interface Sale {
  id: string;
  patient_name: string | null;
  doctor_name: string | null;
  bill_date: string;
  total_amount: number;
  discount_amount: number | null;
  net_amount: number | null;
  payment_mode: string | null;
  status: string;
  item_count?: number;
}

/* ─── Palette ────────────────────────────────────── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569', faint: '#1e293b',
  indigo: '#6366f1', indigoLight: '#818cf8',
  emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e',
  purple: '#a855f7', blue: '#3b82f6',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

/* ─── Payment mode config ────────────────────────── */
const PAYMENT_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  cash:   { color: C.emerald, icon: Banknote,    label: 'Cash' },
  upi:    { color: C.purple,  icon: Smartphone,  label: 'UPI' },
  card:   { color: C.blue,    icon: CreditCard,  label: 'Card' },
  credit: { color: C.amber,   icon: Receipt,     label: 'Credit' },
};
function getPayment(mode: string | null) {
  const k = (mode || '').toLowerCase();
  return PAYMENT_CONFIG[k] || { color: C.muted, icon: IndianRupee, label: mode || 'N/A' };
}

/* ─── Sub-components ─────────────────────────────── */
function StatCard({
  label, value, sub, icon: Icon, color, loading,
}: { label: string; value: string; sub?: string; icon: React.ElementType; color: string; loading?: boolean }) {
  return (
    <div style={{
      backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden',
    }}>
      {/* bg glow */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', backgroundColor: `${color}08`, filter: 'blur(20px)' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</p>
        <div style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 13, height: 13, color }} />
        </div>
      </div>
      {loading
        ? <div style={{ height: 28, width: '60%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.04)', animation: 'pulse 1.6s ease-in-out infinite' }} />
        : <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      }
      {sub && <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{sub}</p>}
    </div>
  );
}

function PaymentBadge({ mode }: { mode: string | null }) {
  const p = getPayment(mode);
  const Icon = p.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 800,
      backgroundColor: `${p.color}14`, color: p.color,
      border: `1px solid ${p.color}22`,
    }}>
      <Icon style={{ width: 10, height: 10 }} /> {p.label}
    </span>
  );
}

/* ─── Quick date presets ─────────────────────────── */
type Preset = 'today' | 'week' | 'month' | 'last3';
function getPresetRange(p: Preset): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = fmt(now);
  if (p === 'today') return { from: today, to: today };
  if (p === 'week') {
    const d = new Date(now); d.setDate(now.getDate() - 6);
    return { from: fmt(d), to: today };
  }
  if (p === 'month') return monthRange(0);
  // last 3 months
  const d = new Date(now); d.setMonth(now.getMonth() - 2); d.setDate(1);
  return { from: fmt(d), to: today };
}

/* ─── Page ───────────────────────────────────────── */
export default function SalesPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const { from: mFrom, to: mTo } = monthRange(0);
  const [dateFrom, setDateFrom] = useState(mFrom);
  const [dateTo, setDateTo] = useState(mTo);
  const [activePreset, setActivePreset] = useState<Preset>('month');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Load ─── */
  const load = useCallback(async () => {
    if (!pharmacyId) { setLoading(false); return; }
    setLoading(true);
    try {
      let q = supabase
        .from('sales')
        .select('id, patient_name, doctor_name, bill_date, total_amount, discount_amount, net_amount, payment_mode, status')
        .eq('pharmacy_id', pharmacyId)
        .gte('bill_date', dateFrom)
        .lte('bill_date', dateTo + 'T23:59:59')
        .order('bill_date', { ascending: false })
        .limit(300);

      if (search.trim()) {
        q = q.or(`patient_name.ilike.%${search}%,doctor_name.ilike.%${search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;

      // Enrich with item count
      const enriched = await Promise.all(
        (data || []).map(async (sale) => {
          const { count } = await supabase
            .from('sale_items')
            .select('id', { count: 'exact', head: true })
            .eq('sale_id', sale.id);
          return { ...sale, item_count: count ?? 0 };
        })
      );
      setSales(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, search, dateFrom, dateTo, supabase]);

  useEffect(() => {
    if (pharmacyId) { load(); }
    else { setLoading(false); }
  }, [pharmacyId, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { if (pharmacyId) load(); }, 300);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Derived stats ─── */
  const totalRevenue = sales.reduce((s, r) => s + (r.net_amount ?? r.total_amount ?? 0), 0);
  const avgBill = sales.length > 0 ? totalRevenue / sales.length : 0;
  const uniquePatients = new Set(sales.map(s => s.patient_name || 'Walk-in')).size;
  const topPaymentEntry = Object.entries(
    sales.reduce<Record<string, number>>((acc, s) => {
      const k = (s.payment_mode || 'cash').toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0];
  const topPayment = topPaymentEntry ? getPayment(topPaymentEntry[0]) : null;

  /* ─── Preset switcher ─── */
  function applyPreset(p: Preset) {
    const range = getPresetRange(p);
    setActivePreset(p);
    setDateFrom(range.from);
    setDateTo(range.to);
  }

  const PRESETS: { key: Preset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'last3', label: 'Last 3 Months' },
  ];

  /* ─── Colors for row status ─── */
  const statusColor = (s: string) => s === 'Completed' ? C.emerald : s === 'Cancelled' ? C.rose : C.amber;

  /* ─── Render ─── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Sales History</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>
            {loading ? 'Loading…' : `${sales.length} bill${sales.length !== 1 ? 's' : ''} · ${formatCurrency(totalRevenue)} total`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={load} disabled={loading}
            style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}
          >
            <RefreshCw style={{ width: 14, height: 14, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button
            onClick={() => router.push('/panel/pos')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(16,185,129,0.3)', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(16,185,129,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16,185,129,0.3)'; }}
          >
            <IndianRupee style={{ width: 15, height: 15 }} />
            New Sale
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} sub={`${sales.length} transactions`} icon={TrendingUp} color={C.emerald} loading={loading} />
        <StatCard label="Average Bill" value={formatCurrency(avgBill)} sub="Per transaction" icon={BarChart3} color={C.indigoLight} loading={loading} />
        <StatCard label="Unique Patients" value={String(uniquePatients)} sub="In selected period" icon={Users} color={C.blue} loading={loading} />
        <StatCard label="Top Payment" value={topPayment ? topPayment.label : '—'} sub={topPaymentEntry ? `${topPaymentEntry[1]} transactions` : 'No data'} icon={topPayment ? topPayment.icon : IndianRupee} color={topPayment ? topPayment.color : C.muted} loading={loading} />
      </div>

      {/* ── Filters row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

        {/* Date presets */}
        <div style={{ display: 'flex', gap: 6, backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: 4 }}>
          {PRESETS.map(p => (
            <button key={p.key} onClick={() => applyPreset(p.key)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all 0.15s ease',
                backgroundColor: activePreset === p.key ? C.indigo : 'transparent',
                color: activePreset === p.key ? '#fff' : C.muted,
                boxShadow: activePreset === p.key ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
              }}
              onMouseEnter={e => { if (activePreset !== p.key) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text; } }}
              onMouseLeave={e => { if (activePreset !== p.key) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.muted; } }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', backgroundColor: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10 }}>
          <Calendar style={{ width: 13, height: 13, color: C.muted }} />
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset('month'); }}
            style={{ background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} />
          <span style={{ color: C.muted, fontSize: 11 }}>→</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset('month'); }}
            style={{ background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} />
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 38, backgroundColor: searchFocus ? '#111827' : C.input, border: `1.5px solid ${searchFocus ? C.indigo : C.inputBorder}`, borderRadius: 10, transition: 'all 0.15s ease', boxShadow: searchFocus ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none' }}>
          <Search style={{ width: 13, height: 13, color: searchFocus ? C.indigoLight : C.muted, flexShrink: 0 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
            placeholder="Search patient, doctor..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 12, fontWeight: 500, color: C.text, fontFamily: 'inherit' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 1 }}>
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table / States ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 style={{ width: 22, height: 22, color: C.indigo, animation: 'spin 1s linear infinite' }} />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, fontWeight: 500 }}>Loading bills…</p>
        </div>
      ) : sales.length === 0 ? (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 32px', gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Receipt style={{ width: 26, height: 26, color: '#1e293b' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#334155' }}>No sales found</p>
            <p style={{ margin: '5px 0 0', fontSize: 12, color: '#1e293b' }}>
              {search ? `No results for "${search}"` : 'No bills were created in this date range'}
            </p>
          </div>
          <button onClick={() => router.push('/panel/pos')}
            style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            Create New Bill
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 1fr 130px 80px 80px 110px 36px', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.012)' }}>
            {['#', 'Patient / Doctor', 'Date & Time', 'Payment', 'Items', 'Discount', 'Net Amount', ''].map((h, i) => (
              <p key={i} style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.09em', textAlign: i >= 5 && i < 7 ? 'right' : 'left' }}>{h}</p>
            ))}
          </div>

          {/* Rows */}
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 400px)' }}>
            {sales.map((sale, idx) => {
              const payBill = sale.net_amount ?? sale.total_amount ?? 0;
              const discount = sale.discount_amount ?? 0;
              const sColor = statusColor(sale.status);
              return (
                <div
                  key={sale.id}
                  onClick={() => router.push(`/panel/sales/${sale.id}`)}
                  style={{
                    display: 'grid', gridTemplateColumns: '44px 1fr 1fr 130px 80px 80px 110px 36px',
                    alignItems: 'center', padding: '13px 16px', cursor: 'pointer',
                    borderBottom: idx < sales.length - 1 ? `1px solid rgba(255,255,255,0.025)` : 'none',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.035)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {/* Row number / status dot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: sColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: '#334155', fontWeight: 700 }}>{idx + 1}</span>
                  </div>

                  {/* Patient / Doctor */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sale.patient_name || 'Walk-in Patient'}
                    </p>
                    {sale.doctor_name && (
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Dr. {sale.doctor_name}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{formatDate(sale.bill_date)}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted }}>{formatRelativeTime(sale.bill_date)}</p>
                  </div>

                  {/* Payment */}
                  <div><PaymentBadge mode={sale.payment_mode} /></div>

                  {/* Items */}
                  <p style={{ margin: 0, fontSize: 12, color: C.muted, fontWeight: 600, textAlign: 'left' }}>
                    {sale.item_count ?? 0} item{(sale.item_count ?? 0) !== 1 ? 's' : ''}
                  </p>

                  {/* Discount */}
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: discount > 0 ? C.amber : '#334155', textAlign: 'right' }}>
                    {discount > 0 ? `−${formatCurrency(discount)}` : '—'}
                  </p>

                  {/* Amount */}
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.text, textAlign: 'right', letterSpacing: '-0.01em' }}>
                    {formatCurrency(payBill)}
                  </p>

                  {/* Arrow */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <ChevronRight style={{ width: 14, height: 14, color: '#1e293b' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.01)', display: 'grid', gridTemplateColumns: '44px 1fr 1fr 130px 80px 80px 110px 36px', alignItems: 'center' }}>
            <div /><div /><div /><div />
            <p style={{ margin: 0, fontSize: 10, color: C.muted, fontWeight: 700 }}>{sales.length} bills</p>
            {/* Total discount */}
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: C.amber, textAlign: 'right' }}>
              {formatCurrency(sales.reduce((s, r) => s + (r.discount_amount ?? 0), 0))}
            </p>
            {/* Grand total */}
            <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.emerald, textAlign: 'right' }}>
              {formatCurrency(totalRevenue)}
            </p>
            <div />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  );
}
