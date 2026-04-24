'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency, formatDate, formatRelativeTime, monthRange } from '@/lib/utils/format';
import {
  RotateCcw, Loader2, Search, X, RefreshCw, Plus,
  Banknote, CreditCard, Smartphone, IndianRupee,
  Calendar, ChevronRight, TrendingDown, Receipt, Users, Package2,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────── */
interface ReturnRow {
  id: string;
  sale_id: string | null;
  return_date: string;
  refund_amount: number;
  reason: string | null;
  // joined from sales
  patient_name?: string | null;
  bill_date?: string | null;
}

type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'all';

/* ─── Palette ────────────────────────────────────────── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569',
  indigo: '#6366f1', indigoLight: '#818cf8',
  emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e',
  orange: '#f97316', blue: '#3b82f6', purple: '#a855f7',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

/* ─── Reason tag colours ─────────────────────────────── */
const REASON_COLORS: Record<string, string> = {
  expired: C.rose,
  damaged: C.orange,
  'wrong medicine': C.amber,
  'duplicate bill': C.purple,
  'customer request': C.blue,
};
function getReasonColor(reason: string | null): string {
  if (!reason) return C.muted;
  const key = reason.toLowerCase();
  for (const [k, v] of Object.entries(REASON_COLORS)) {
    if (key.includes(k)) return v;
  }
  return C.muted;
}

/* ─── Refund method config ───────────────────────────── */
type RefundMethod = 'cash' | 'upi' | 'card' | string;
const REFUND_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  cash:   { color: C.emerald, icon: Banknote },
  upi:    { color: C.purple,  icon: Smartphone },
  card:   { color: C.blue,    icon: CreditCard },
};
function getRefundConfig(method: RefundMethod) {
  return REFUND_CONFIG[(method || '').toLowerCase()] || { color: C.muted, icon: IndianRupee };
}

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
export default function ReturnsPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [preset, setPreset] = useState<DatePreset>('month');

  // Custom date range (used when preset is overridden)
  const { from: mFrom, to: mTo } = monthRange(0);
  const [dateFrom, setDateFrom] = useState(mFrom);
  const [dateTo, setDateTo] = useState(mTo);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Load ─── */
  const load = useCallback(async () => {
    if (!pharmacyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sale_returns')
        .select('id, sale_id, return_date, refund_amount, reason, sales(patient_name, bill_date)')
        .eq('pharmacy_id', pharmacyId)
        .order('return_date', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Supabase returns foreign-key joins as arrays
      type RawReturn = {
        id: string; sale_id: string | null; return_date: string;
        refund_amount: number; reason: string | null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sales: any;
      };
      setReturns(
        (data as RawReturn[] || []).map((r) => {
          // sales may come back as array or object depending on relation type
          const sale = Array.isArray(r.sales) ? r.sales[0] : r.sales;
          return {
            id: r.id,
            sale_id: r.sale_id,
            return_date: r.return_date,
            refund_amount: r.refund_amount,
            reason: r.reason,
            patient_name: sale?.patient_name ?? null,
            bill_date: sale?.bill_date ?? null,
          };
        })
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

  /* ─── Client-side filter (date preset + search) ─── */
  const filtered = useMemo(() => {
    return returns.filter(r => {
      const d = new Date(r.return_date);
      // Date filter
      const passDate = (() => {
        if (preset === 'today')     return isToday(d);
        if (preset === 'yesterday') return isYesterday(d);
        if (preset === 'week')      return isThisWeek(d);
        if (preset === 'month')     return isThisMonth(d);
        return true; // 'all'
      })();
      if (!passDate) return false;
      // Search filter
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (r.patient_name || '').toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q) ||
        (r.sale_id || '').toLowerCase().includes(q)
      );
    });
  }, [returns, preset, search]);

  /* ─── Derived stats from filtered ─── */
  const totalRefunds = filtered.reduce((s, r) => s + (r.refund_amount ?? 0), 0);
  const uniquePatients = new Set(filtered.map(r => r.patient_name || 'Walk-in')).size;

  /* ─── Date presets ─── */
  const PRESETS: { key: DatePreset; label: string }[] = [
    { key: 'today',     label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week',      label: 'This Week' },
    { key: 'month',     label: 'This Month' },
    { key: 'all',       label: 'All Time' },
  ];

  /* ─── Render ─── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <RotateCcw style={{ width: 18, height: 18, color: C.orange }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Sales Returns</h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>
              {loading ? 'Loading…' : `${filtered.length} return${filtered.length !== 1 ? 's' : ''} · ${formatCurrency(totalRefunds)} refunded`}
            </p>
          </div>
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
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${C.orange},#ea580c)`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(249,115,22,0.3)', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(249,115,22,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(249,115,22,0.3)'; }}
          >
            <Plus style={{ width: 15, height: 15 }} />
            New Return
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Total Refunded" value={formatCurrency(totalRefunds)} sub={`${filtered.length} returns`} icon={TrendingDown} color={C.rose} loading={loading} />
        <StatCard label="Total Returns" value={String(filtered.length)} sub="In selected period" icon={RotateCcw} color={C.orange} loading={loading} />
        <StatCard label="Unique Patients" value={String(uniquePatients)} sub="With returns" icon={Users} color={C.blue} loading={loading} />
        <StatCard label="Avg Refund" value={filtered.length > 0 ? formatCurrency(totalRefunds / filtered.length) : '₹0'} sub="Per return" icon={Receipt} color={C.amber} loading={loading} />
      </div>

      {/* ── Filters row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Date presets */}
        <div style={{ display: 'flex', gap: 5, backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: 4 }}>
          {PRESETS.map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                backgroundColor: preset === p.key ? C.orange : 'transparent',
                color: preset === p.key ? '#fff' : C.muted,
                boxShadow: preset === p.key ? '0 4px 12px rgba(249,115,22,0.3)' : 'none',
              }}
              onMouseEnter={e => { if (preset !== p.key) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text; } }}
              onMouseLeave={e => { if (preset !== p.key) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.muted; } }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 38, backgroundColor: searchFocus ? '#111827' : C.input, border: `1.5px solid ${searchFocus ? C.orange : C.inputBorder}`, borderRadius: 10, transition: 'all 0.15s ease', boxShadow: searchFocus ? '0 0 0 3px rgba(249,115,22,0.12)' : 'none' }}>
          <Search style={{ width: 13, height: 13, color: searchFocus ? C.orange : C.muted, flexShrink: 0 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
            placeholder="Search patient, reason, bill number..."
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
          <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(249,115,22,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 style={{ width: 22, height: 22, color: C.orange, animation: 'spin 1s linear infinite' }} />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, fontWeight: 500 }}>Loading returns…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 32px', gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(249,115,22,0.06)', border: `1px solid rgba(249,115,22,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RotateCcw style={{ width: 26, height: 26, color: 'rgba(249,115,22,0.3)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#334155' }}>No returns found</p>
            <p style={{ margin: '5px 0 0', fontSize: 12, color: '#1e293b' }}>
              {search ? `No results for "${search}"` : 'No sales returns in this period'}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Summary ribbon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: 'rgba(249,115,22,0.06)', border: `1px solid rgba(249,115,22,0.1)`, borderRadius: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#fdba74', fontWeight: 600 }}>
              {filtered.length} return{filtered.length !== 1 ? 's' : ''} in selected period
            </p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.rose }}>
              Total refunded: {formatCurrency(totalRefunds)}
            </p>
          </div>

          {/* Return cards */}
          {filtered.map((ret, idx) => {
            const reasonColor = getReasonColor(ret.reason);
            return (
              <div
                key={ret.id}
                style={{
                  backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16,
                  padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                  cursor: 'default', transition: 'all 0.15s ease', position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)'; e.currentTarget.style.backgroundColor = '#0d1225'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.backgroundColor = C.card; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Left accent bar */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: reasonColor, borderRadius: '16px 0 0 16px' }} />

                {/* Icon */}
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 8 }}>
                  <RotateCcw style={{ width: 18, height: 18, color: C.orange }} />
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                      {ret.patient_name || 'Walk-in Patient'}
                    </span>
                    {ret.sale_id && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)', color: C.muted, fontWeight: 700, border: `1px solid ${C.cardBorder}` }}>
                        Sale #{ret.sale_id.slice(-6)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.muted }}>
                      <Calendar style={{ width: 11, height: 11 }} />
                      {formatDate(ret.return_date)}
                    </span>
                    <span style={{ fontSize: 10, color: C.muted }}>{formatRelativeTime(ret.return_date)}</span>
                    {ret.reason && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, backgroundColor: `${reasonColor}12`, color: reasonColor, fontWeight: 700, border: `1px solid ${reasonColor}20` }}>
                        {ret.reason}
                      </span>
                    )}
                  </div>
                </div>

                {/* Refund amount */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.rose, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    −{formatCurrency(ret.refund_amount)}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 10, color: C.muted, fontWeight: 600 }}>refunded</p>
                </div>

                {/* Arrow */}
                <ChevronRight style={{ width: 16, height: 16, color: '#1e293b', flexShrink: 0 }} />
              </div>
            );
          })}

          {/* Bottom total */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px', backgroundColor: 'rgba(244,63,94,0.06)', border: `1px solid rgba(244,63,94,0.1)`, borderRadius: 12 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.rose }}>
              Total Refunded: {formatCurrency(totalRefunds)}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:0.8; } }
      `}</style>
    </div>
  );
}
