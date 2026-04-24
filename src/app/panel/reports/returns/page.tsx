'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency } from '@/lib/utils/format';
import {
  RotateCcw, Download, Search, ArrowLeft,
  Banknote, CreditCard, Loader2, FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

/* ─── Palette ────────────────────────────────────────── */
const C = {
  bg: '#060914', card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.07)',
  text: '#f1f5f9', muted: '#475569', subtle: '#94a3b8',
  rose: '#f43f5e', roseLight: '#fb7185',
  emerald: '#10b981', emeraldLight: '#34d399',
  blue: '#3b82f6', blueLight: '#93c5fd',
  indigo: '#6366f1', indigoLight: '#818cf8',
  input: '#0d1127', inputBorder: 'rgba(255,255,255,0.1)',
};

/* ─── Types ─────────────────────────────────────────── */
interface ReturnRecord {
  id: number;
  return_number: string;
  return_date: string;
  customer_name: string | null;
  bill_number: string | null;
  items_count: number;
  total_amount: number;
  refund_method: string | null;
}

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';

/* ─── Date helpers ────────────────────────────────────── */
function isToday(d: Date) {
  const n = new Date();
  return d.toDateString() === n.toDateString();
}
function isYesterday(d: Date) {
  const n = new Date(); n.setDate(n.getDate() - 1);
  return d.toDateString() === n.toDateString();
}
function isThisWeek(d: Date) {
  const n = new Date(); n.setDate(n.getDate() - 6);
  return d >= n;
}
function isThisMonth(d: Date) {
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/* ─── KPI Card ──────────────────────────────────────── */
function KpiCard({ label, value, color, glow }: { label: string; value: string; color: string; glow: string }) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -24, right: -24, width: 100, height: 100, borderRadius: '50%', backgroundColor: glow, filter: 'blur(32px)', pointerEvents: 'none' }} />
      <p style={{ margin: '0 0 8px', fontSize: 9.5, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function SalesReturnsPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore(s => s.pharmacyId);
  const pharmacyIdRef = useRef(pharmacyId);
  useEffect(() => { pharmacyIdRef.current = pharmacyId; }, [pharmacyId]);

  const [records, setRecords] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);

  /* ─── Load ─── */
  async function load() {
    const pid = pharmacyIdRef.current;
    if (!pid) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sale_returns')
        .select(`
          id, return_number, return_date, total_amount, refund_method,
          sales(bill_number, customer_id, customers(name)),
          sale_return_items(id)
        `)
        .eq('pharmacy_id', pid)
        .is('deleted_at', null)
        .order('return_date', { ascending: false })
        .limit(2000);

      if (error) throw error;

      setRecords((data || []).map((r: any) => ({
        id: r.id,
        return_number: r.return_number,
        return_date: r.return_date,
        customer_name: r.sales?.customers?.name ?? null,
        bill_number: r.sales?.bill_number ?? null,
        items_count: Array.isArray(r.sale_return_items) ? r.sale_return_items.length : 0,
        total_amount: r.total_amount ?? 0,
        refund_method: r.refund_method,
      })));
    } catch (err: any) {
      console.error('Sale returns load error:', err?.message || err?.details || err?.hint || err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pharmacyId) load();
    else setLoading(false);
  }, [pharmacyId]);

  /* ─── Filter ─── */
  const filtered = useMemo(() => {
    return records.filter(r => {
      const d = new Date(r.return_date);
      const passDate = (() => {
        switch (dateFilter) {
          case 'today':     return isToday(d);
          case 'yesterday': return isYesterday(d);
          case 'week':      return isThisWeek(d);
          case 'month':     return isThisMonth(d);
          default:          return true;
        }
      })();
      if (!passDate) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.return_number.toLowerCase().includes(q) ||
        (r.bill_number?.toLowerCase().includes(q) ?? false) ||
        (r.customer_name?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [records, dateFilter, search]);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    let totalRefunds = 0, totalItems = 0, cashRefunds = 0, creditRefunds = 0;
    filtered.forEach(r => {
      totalRefunds += r.total_amount;
      totalItems += r.items_count;
      if (r.refund_method === 'cash') cashRefunds += r.total_amount;
      else creditRefunds += r.total_amount;
    });
    return { count: filtered.length, totalRefunds, totalItems, cashRefunds, creditRefunds };
  }, [filtered]);

  /* ─── Export CSV ─── */
  function handleExport() {
    const header = 'Return Number,Date,Customer,Original Bill,Items,Amount,Refund Method';
    const rows = filtered.map(r =>
      `"${r.return_number}","${fmtDate(r.return_date)}","${r.customer_name || 'Walk-in'}","${r.bill_number || ''}",${r.items_count},${r.total_amount},"${r.refund_method || ''}"`
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sales_returns.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const DATE_FILTERS: { label: string; value: DateFilter }[] = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'All Time', value: 'all' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}>
            <ArrowLeft style={{ width: 17, height: 17, color: C.muted }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ padding: 10, backgroundColor: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.18)', borderRadius: 14 }}>
              <RotateCcw style={{ width: 22, height: 22, color: C.rose }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Sales Return Report</h1>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>Analyze returned items, refunds, and credit notes issued</p>
            </div>
          </div>
        </div>

        <button onClick={handleExport}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: `1px solid ${C.cardBorder}`, backgroundColor: C.card, color: C.subtle, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.color = C.subtle; }}>
          <Download style={{ width: 15, height: 15 }} />
          Export CSV
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        <KpiCard label="Total Returns" value={`${stats.count} Invoices`} color={C.text} glow="rgba(255,255,255,0.03)" />
        <KpiCard label="Total Refunded" value={formatCurrency(stats.totalRefunds)} color={C.rose} glow="rgba(244,63,94,0.08)" />
        <KpiCard label="Cash Refunds" value={formatCurrency(stats.cashRefunds)} color={C.emerald} glow="rgba(16,185,129,0.08)" />
        <KpiCard label="Credit Issued" value={formatCurrency(stats.creditRefunds)} color={C.blue} glow="rgba(59,130,246,0.08)" />
      </div>

      {/* ── Filters Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 440 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: searchFocus ? C.rose : C.muted, transition: 'color 0.15s ease' }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
            placeholder="Search by return number, bill number or customer…"
            style={{ width: '100%', boxSizing: 'border-box', backgroundColor: C.input, border: `1.5px solid ${searchFocus ? C.rose : C.inputBorder}`, borderRadius: 12, padding: '10px 14px 10px 36px', fontSize: 13, fontWeight: 500, color: C.text, outline: 'none', fontFamily: 'inherit', transition: 'all 0.15s ease', boxShadow: searchFocus ? '0 0 0 3px rgba(244,63,94,0.1)' : 'none' }}
          />
        </div>

        {/* Date filter chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 4, marginLeft: 'auto' }}>
          {DATE_FILTERS.map(f => (
            <button key={f.value} onClick={() => setDateFilter(f.value)}
              style={{ padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s ease', whiteSpace: 'nowrap', fontFamily: 'inherit',
                backgroundColor: dateFilter === f.value ? C.card : 'transparent',
                color: dateFilter === f.value ? C.text : C.muted,
                boxShadow: dateFilter === f.value ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 style={{ width: 32, height: 32, color: C.rose, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', gap: 14, backgroundColor: 'rgba(255,255,255,0.01)' }}>
            <div style={{ width: 56, height: 56, backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
              <FileText style={{ width: 22, height: 22, color: C.muted }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.subtle }}>No return data found</p>
              <p style={{ margin: '5px 0 0', fontSize: 12, color: C.muted }}>There are no sale returns matching your current filters.</p>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800, fontSize: 13 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'rgba(11,15,36,0.98)', backdropFilter: 'blur(8px)' }}>
                <tr style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                  {[
                    { label: 'Return Number', align: 'left', pl: 20 },
                    { label: 'Date & Time', align: 'left' },
                    { label: 'Customer', align: 'left' },
                    { label: 'Original Bill', align: 'left' },
                    { label: 'Items Reverted', align: 'right' },
                    { label: 'Refund Amount', align: 'right', pr: 20 },
                  ].map(h => (
                    <th key={h.label} style={{ padding: '12px 12px', paddingLeft: h.pl ?? 12, paddingRight: h.pr ?? 12, textAlign: h.align as any, fontSize: 9.5, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, idx) => (
                  <tr key={record.id}
                    style={{ borderBottom: idx < filtered.length - 1 ? `1px solid rgba(255,255,255,0.03)` : 'none', transition: 'background 0.12s ease', cursor: 'default' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>

                    {/* Return Number */}
                    <td style={{ padding: '13px 12px 13px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <RotateCcw style={{ width: 13, height: 13, color: C.rose }} />
                        </div>
                        <span style={{ fontWeight: 800, color: C.text, fontSize: 13 }}>{record.return_number}</span>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td style={{ padding: '13px 12px' }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.subtle }}>{fmtDate(record.return_date)}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>{fmtTime(record.return_date)}</p>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: '13px 12px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: record.customer_name ? C.indigoLight : C.muted }}>
                        {record.customer_name || 'Walk-in'}
                      </span>
                    </td>

                    {/* Original Bill */}
                    <td style={{ padding: '13px 12px' }}>
                      {record.bill_number ? (
                        <span style={{ padding: '3px 8px', backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${C.cardBorder}`, borderRadius: 6, fontSize: 11, fontWeight: 800, color: C.subtle, fontFamily: 'monospace' }}>
                          {record.bill_number}
                        </span>
                      ) : (
                        <span style={{ color: C.muted, fontSize: 12 }}>—</span>
                      )}
                    </td>

                    {/* Items Count */}
                    <td style={{ padding: '13px 12px', textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 12, fontWeight: 800, color: C.subtle }}>
                        {record.items_count}
                      </span>
                    </td>

                    {/* Refund Amount */}
                    <td style={{ padding: '13px 20px 13px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: C.text, letterSpacing: '-0.01em' }}>
                          <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>₹</span>
                          {record.total_amount.toFixed(2)}
                        </span>
                        <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {record.refund_method === 'cash'
                            ? <Banknote style={{ width: 10, height: 10 }} />
                            : <CreditCard style={{ width: 10, height: 10 }} />}
                          {record.refund_method || '—'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
