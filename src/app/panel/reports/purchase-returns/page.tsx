'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { Loader2, ArrowLeft, PackageMinus, Download, Search, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

/* ─── Palette ────────────────────────────────────────── */
const C = {
  bg: '#060914',
  card: '#0b0f24',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9',
  muted: '#475569',
  mutedLight: '#64748b',
  indigo: '#6366f1',
  indigoLight: '#818cf8',
  emerald: '#10b981',
  emeraldLight: '#34d399',
  violet: '#8b5cf6',
  violetLight: '#a78bfa',
  rowHover: 'rgba(255,255,255,0.025)',
  divider: 'rgba(255,255,255,0.05)',
};

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';

interface PurchaseReturnRecord {
  id: string;
  return_number: string;
  return_date: string;
  total_amount: number;
  item_count: number;
  supplier_name: string | null;
  bill_number: string | null;
}

/* ─── Date helpers ───────────────────────────────────── */
function isToday(d: Date) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
function isYesterday(d: Date) {
  const y = new Date(); y.setDate(y.getDate() - 1);
  return d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate();
}
function isThisWeek(d: Date) {
  const now = new Date();
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return d >= start;
}
function isThisMonth(d: Date) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/* ─── KPI Card ───────────────────────────────────────── */
function KpiCard({ label, value, color, glowColor }: { label: string; value: string; color: string; glowColor: string }) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -24, right: -24, width: 80, height: 80, borderRadius: '50%', backgroundColor: glowColor, filter: 'blur(24px)', opacity: 0.35, pointerEvents: 'none' }} />
      <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>{value}</p>
    </div>
  );
}

export default function PurchaseReturnsPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [returns, setReturns] = useState<PurchaseReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('month');

  useEffect(() => {
    if (!pharmacyId) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('purchase_returns')
          .select(`
            id, return_number, return_date, total_amount, bill_number, supplier_id,
            suppliers(name),
            purchases(bill_number),
            purchase_return_items(id)
          `)
          .eq('pharmacy_id', pharmacyId)
          .is('deleted_at', null)
          .order('return_date', { ascending: false })
          .limit(10000);

        if (error) throw error;

        const mapped: PurchaseReturnRecord[] = (data ?? []).map((r: any) => ({
          id: r.id,
          return_number: r.return_number ?? `PRN-${String(r.id).slice(0, 8)}`,
          return_date: r.return_date,
          total_amount: r.total_amount ?? 0,
          item_count: Array.isArray(r.purchase_return_items) ? r.purchase_return_items.length : 0,
          supplier_name: r.suppliers?.name ?? null,
          bill_number: r.purchases?.bill_number ?? r.bill_number ?? null,
        }));

        setReturns(mapped);
      } catch (err: any) {
        console.error('Purchase returns load error:', err?.message || err?.details || err?.hint || err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [pharmacyId]);

  /* ─── Filtering ─────────────────────────────────────── */
  const filtered = useMemo(() => {
    return returns.filter(record => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        record.return_number.toLowerCase().includes(q) ||
        (record.bill_number?.toLowerCase().includes(q) ?? false) ||
        (record.supplier_name?.toLowerCase().includes(q) ?? false);
      if (!matchesSearch) return false;

      const rDate = new Date(record.return_date);
      switch (selectedDateFilter) {
        case 'today': return isToday(rDate);
        case 'yesterday': return isYesterday(rDate);
        case 'week': return isThisWeek(rDate);
        case 'month': return isThisMonth(rDate);
        default: return true;
      }
    });
  }, [returns, searchQuery, selectedDateFilter]);

  /* ─── Stats ─────────────────────────────────────────── */
  const stats = useMemo(() => {
    let totalValue = 0;
    let totalItems = 0;
    filtered.forEach(r => {
      totalValue += r.total_amount;
      totalItems += r.item_count;
    });
    return { count: filtered.length, totalValue, totalItems };
  }, [filtered]);

  /* ─── Export CSV ────────────────────────────────────── */
  const handleExport = () => {
    const header = 'Return Number,Date,Supplier,Original Bill,Items Reverted,Reverted Value';
    const rows = filtered.map(r =>
      `"${r.return_number}","${r.return_date}","${r.supplier_name ?? ''}","${r.bill_number ?? ''}",${r.item_count},${r.total_amount.toFixed(2)}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'purchase_returns.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /* ─── Date filter chips ─────────────────────────────── */
  const DATE_FILTERS: { label: string; value: DateFilter }[] = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'All Time', value: 'all' },
  ];

  /* ─── Formatters ────────────────────────────────────── */
  function fmtDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48, width: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
          >
            <ArrowLeft style={{ width: 18, height: 18, color: C.muted }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackageMinus style={{ width: 20, height: 20, color: C.indigo }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Purchase Return Report</h1>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted, fontWeight: 500 }}>Analyze returned batches and total supplier deductions</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBorder}`, borderRadius: 12, color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}
        >
          <Download style={{ width: 15, height: 15 }} />
          Export CSV
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <KpiCard
          label="Total Returns"
          value={`${stats.count} Invoices`}
          color={C.text}
          glowColor={C.muted}
        />
        <KpiCard
          label="Total Reverted Value"
          value={`₹${stats.totalValue.toFixed(2)}`}
          color={C.indigoLight}
          glowColor={C.indigo}
        />
        <KpiCard
          label="Total Items Returned"
          value={`${stats.totalItems}`}
          color={C.emeraldLight}
          glowColor={C.emerald}
        />
      </div>

      {/* ── Filters Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 380 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: C.muted, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by return number, bill number or supplier..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: '10px 14px 10px 36px', color: C.text, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', outline: 'none' }}
            onFocus={e => { e.currentTarget.style.borderColor = C.indigo; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.12)`; }}
            onBlur={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Date Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '4px', marginLeft: 'auto' }}>
          {DATE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setSelectedDateFilter(f.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 9,
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                backgroundColor: selectedDateFilter === f.value ? C.card : 'transparent',
                color: selectedDateFilter === f.value ? C.text : C.muted,
                boxShadow: selectedDateFilter === f.value ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 style={{ width: 22, height: 22, color: C.indigo, animation: 'spin 1s linear infinite' }} />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: C.muted, fontWeight: 500 }}>Loading returns data…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '72px 32px', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText style={{ width: 22, height: 22, color: C.muted }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: C.text }}>No purchase return data found</p>
              <p style={{ margin: 0, fontSize: 12, color: C.muted }}>There are no purchase returns matching your current filters.</p>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.divider}`, backgroundColor: 'rgba(255,255,255,0.015)' }}>
                  {['Return Number', 'Date & Time', 'Supplier', 'Original Bill', 'Items Reverted', 'Reverted Value'].map((col, i) => (
                    <th key={col} style={{
                      padding: '12px 16px',
                      paddingLeft: i === 0 ? 20 : 16,
                      paddingRight: i === 5 ? 20 : 16,
                      textAlign: i >= 4 ? 'right' : 'left',
                      fontSize: 10,
                      fontWeight: 800,
                      color: C.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, idx) => (
                  <tr
                    key={record.id}
                    style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${C.divider}` : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = C.rowHover; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                  >
                    {/* Return Number */}
                    <td style={{ padding: '13px 16px 13px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <PackageMinus style={{ width: 13, height: 13, color: C.indigo }} />
                        </div>
                        <span style={{ fontWeight: 700, color: C.indigoLight, fontSize: 13 }}>{record.return_number}</span>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td style={{ padding: '13px 16px' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{fmtDate(record.return_date)}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>{fmtTime(record.return_date)}</p>
                      </div>
                    </td>

                    {/* Supplier */}
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: record.supplier_name ? C.text : C.muted }}>
                        {record.supplier_name ?? 'N/A'}
                      </span>
                    </td>

                    {/* Original Bill */}
                    <td style={{ padding: '13px 16px' }}>
                      {record.bill_number ? (
                        <span style={{ padding: '2px 8px', backgroundColor: 'rgba(255,255,255,0.06)', border: `1px solid ${C.cardBorder}`, borderRadius: 6, fontSize: 10, fontWeight: 700, color: C.mutedLight, fontFamily: 'monospace' }}>
                          {record.bill_number}
                        </span>
                      ) : (
                        <span style={{ color: C.muted }}>—</span>
                      )}
                    </td>

                    {/* Items Reverted */}
                    <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBorder}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: C.mutedLight, letterSpacing: '0.04em' }}>
                        {record.item_count}
                      </span>
                    </td>

                    {/* Reverted Value */}
                    <td style={{ padding: '13px 20px 13px 16px', textAlign: 'right' }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums' }}>
                        <span style={{ color: C.muted, fontSize: 11, marginRight: 1 }}>₹</span>
                        {record.total_amount.toFixed(2)}
                      </span>
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
