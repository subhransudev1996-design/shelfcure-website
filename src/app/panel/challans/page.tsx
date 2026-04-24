'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatDate, formatRelativeTime, monthRange } from '@/lib/utils/format';
import {
  FileText, RefreshCw, Calendar, Search, X,
  ChevronRight, Loader2, Play, CheckCircle2, RotateCcw, AlertCircle
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────── */
interface Challan {
  id: string;
  challan_number: string | null;
  supplier_id: string | null;
  supplier_name: string;
  status: string;
  total_quantity: number;
  total_items: number;
  notes: string | null;
  created_at: string;
  // These may not exist in the current schema
  challan_date: string;
  expected_return_date: string | null;
  linked_purchase_id: string | null;
}

type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'all';

/* ─── Palette ────────────────────────────────────────── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569',
  indigo: '#6366f1', purple: '#a855f7', purpleLight: '#c084fc',
  emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e', blue: '#3b82f6', teal: '#14b8a6',
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
function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
      {sub && <p style={{ margin: 0, fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>}
    </div>
  );
}

const STATUS_CONFIG: Record<string, { color: string, bg: string, icon: React.ElementType, label: string }> = {
  pending:  { color: C.amber, bg: `${C.amber}15`, icon: AlertCircle, label: 'Pending' },
  accepted: { color: C.emerald, bg: `${C.emerald}15`, icon: CheckCircle2, label: 'Accepted' },
  returned: { color: C.rose, bg: `${C.rose}15`, icon: RotateCcw, label: 'Returned' },
  partial:  { color: C.blue, bg: `${C.blue}15`, icon: Play, label: 'Partial' },
  partially_accepted: { color: C.blue, bg: `${C.blue}15`, icon: AlertCircle, label: 'Partial' },
};

/* ─── Page ───────────────────────────────────────────── */
export default function ChallansPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [preset, setPreset] = useState<DatePreset>('month');

  const { from: mFrom, to: mTo } = monthRange(0);
  const [dateFrom, setDateFrom] = useState(mFrom);
  const [dateTo, setDateTo] = useState(mTo);

  /* ─── Load ─── */
  const load = useCallback(async () => {
    if (!pharmacyId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Use wildcard + supplier join to avoid missing-column errors
      const { data, error } = await supabase
        .from('challans')
        .select('*, suppliers(name)')
        .eq('pharmacy_id', pharmacyId)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      // Map the joined supplier name and provide fallbacks for optional fields
      const mapped = (data || []).map((c: any) => ({
        ...c,
        supplier_name: c.suppliers?.name || 'Unknown Supplier',
        challan_date: c.challan_date || c.created_at,
        total_items: c.total_items || 0,
        total_quantity: c.total_quantity || 0,
        expected_return_date: c.expected_return_date || null,
        linked_purchase_id: c.linked_purchase_id || null,
      }));
      setChallans(mapped);
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
    return challans.filter(c => {
      const d = new Date(c.challan_date);
      // Date filter
      const passDate = (() => {
        if (preset === 'today')     return isToday(d);
        if (preset === 'yesterday') return isYesterday(d);
        if (preset === 'week')      return isThisWeek(d);
        if (preset === 'month')     return isThisMonth(d);
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
        (c.challan_number || '').toLowerCase().includes(q) ||
        (c.supplier_name || '').toLowerCase().includes(q)
      );
    });
  }, [challans, preset, search, dateFrom, dateTo]);

  /* ─── Stats ─── */
  const countTotal = filtered.length;
  const countPending = filtered.filter(c => c.status === 'pending').length;
  const countAccepted = filtered.filter(c => c.status === 'accepted' || c.status === 'partially_accepted').length;
  const countReturned = filtered.filter(c => c.status === 'returned').length;
  const totalPendingItems = filtered.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.total_quantity || 0), 0);

  const PRESETS: { key: DatePreset; label: string }[] = [
    { key: 'today',     label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week',      label: 'This Week' },
    { key: 'month',     label: 'This Month' },
    { key: 'all',       label: 'All/Custom' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText style={{ width: 18, height: 18, color: C.purple }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Delivery Challans</h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>
              {loading ? 'Crunching numbers…' : `${countTotal} document${countTotal !== 1 ? 's' : ''} in selected period`}
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
            onClick={() => router.push('/panel/challans/new')}
            style={{
              padding: '0 16px', height: 38, borderRadius: 10, border: 'none',
              backgroundColor: C.purple, color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(168,85,247,0.3)', transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'none'}
          >
            <FileText style={{ width: 14, height: 14 }} />
            New Challan
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Pending Review" value={String(countPending)} sub="Needs processing" icon={AlertCircle} color={countPending > 0 ? C.amber : C.muted} loading={loading} />
        <StatCard label="Accepted" value={String(countAccepted)} sub="Fully verified" icon={CheckCircle2} color={C.emerald} loading={loading} />
        <StatCard label="Returned" value={String(countReturned)} sub="Rejected items" icon={RotateCcw} color={countReturned > 0 ? C.rose : C.muted} loading={loading} />
        <StatCard label="Pending Items" value={String(totalPendingItems)} sub="Total qty to process" icon={FileText} color={totalPendingItems > 0 ? C.purple : C.muted} loading={loading} />
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
            placeholder="Search challan number or supplier..."
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
          <p style={{ margin: 0, fontSize: 13, color: C.muted, fontWeight: 500 }}>Loading documents…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 32px', gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(168,85,247,0.06)', border: `1px solid rgba(168,85,247,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText style={{ width: 26, height: 26, color: 'rgba(168,85,247,0.4)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#334155' }}>No challans found</p>
            <p style={{ margin: '5px 0 0', fontSize: 12, color: '#1e293b' }}>
              {search ? `No results for "${search}"` : 'Delivery challans will appear here when added from purchases'}
            </p>
          </div>
          {(search || preset !== 'month') && (
            <button onClick={() => { setSearch(''); setPreset('month'); }}
              style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map((c) => {
            const st = STATUS_CONFIG[c.status] || { color: C.muted, bg: 'rgba(255,255,255,0.05)', icon: Play, label: c.status };
            const daysLeft = daysUntil(c.expected_return_date);
            const isUrgent = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0 && c.status === "pending";

            return (
              <button
                key={c.id}
                onClick={() => window.location.href = `/panel/challans/${c.id}`}
                style={{
                  backgroundColor: C.card,
                  border: `1px solid ${isUrgent ? 'rgba(244,63,94,0.3)' : C.cardBorder}`,
                  borderRadius: 16,
                  padding: 20,
                  textAlign: 'left',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  boxShadow: isUrgent ? '0 0 16px rgba(244,63,94,0.05)' : 'none'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = isUrgent ? 'rgba(244,63,94,0.5)' : 'rgba(168,85,247,0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = isUrgent ? 'rgba(244,63,94,0.3)' : C.cardBorder;
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Status Badges */}
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isUrgent && (
                    <div style={{ padding: '3px 8px', borderRadius: 20, backgroundColor: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: C.rose, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ⏰ {daysLeft}d left
                    </div>
                  )}
                  {c.linked_purchase_id && (
                    <div style={{ padding: '3px 8px', borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: C.indigo, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Converted
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    backgroundColor: c.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${c.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <FileText style={{ width: 20, height: 20, color: c.status === 'pending' ? C.amber : C.muted }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.supplier_name || 'Unknown Supplier'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>CHN-{c.challan_number || c.id}</span>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                      <span style={{ fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar style={{ width: 10, height: 10 }} />
                        {formatDate(c.challan_date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items</p>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 800, color: C.text }}>{c.total_items}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qty</p>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 800, color: C.text }}>{c.total_quantity || 0}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 10, backgroundColor: st.bg, color: st.color }}>
                    <st.icon style={{ width: 14, height: 14 }} />
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{st.label}</span>
                  </div>
                </div>

                <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: C.muted }}>
                    {c.expected_return_date ? `Return by ${formatDate(c.expected_return_date)}` : 'No return deadline'}
                  </span>
                  <ChevronRight style={{ width: 14, height: 14, color: C.muted }} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:0.8; } }
      `}</style>
    </div>
  );
}
