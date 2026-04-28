'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency, monthRange } from '@/lib/utils/format';
import {
  PieChart, ChevronLeft, Loader2, TrendingUp,
  TrendingDown, IndianRupee, Calendar, BarChart3,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

/* ─── Palette ────────────────────────────────────────── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  cardHover: '#0f1530',
  text: '#f1f5f9', muted: '#475569', subtle: '#94a3b8',
  indigo: '#6366f1', indigoLight: '#818cf8',
  emerald: '#10b981', emeraldLight: '#34d399',
  rose: '#f43f5e', roseLight: '#fb7185',
  blue: '#3b82f6', blueLight: '#93c5fd',
  orange: '#f97316',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.1)',
};

/* ─── Quick range helpers ────────────────────────────── */
function getMonthRange(offset = 0) {
  const { from, to } = monthRange(offset);
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const label = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  return { from, to, label };
}

// FIX 1: "This Year" used wrong fiscal year logic.
// April 2025–March 2026 is FY 2025-26.
// If current month < April, fiscal year started in the previous calendar year.
function getFiscalYearRange() {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();
  // Fiscal year starts April 1 of current calendar year if month >= March (3), else previous year
  const fyStart = month >= 3 ? year : year - 1;
  const fyEnd = fyStart + 1;
  return {
    from: `${fyStart}-04-01`,
    to:   `${fyEnd}-03-31`,
    label: `FY ${fyStart}-${String(fyEnd).slice(2)}`,
  };
}

const QUICK_RANGES = [
  { label: 'Current Month', getRange: () => getMonthRange(0) },
  { label: 'Last Month',    getRange: () => getMonthRange(-1) },
  {
    label: 'Last 3 Months',
    getRange: () => {
      const d = new Date();
      d.setMonth(d.getMonth() - 2);
      const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      return { from, to: getMonthRange(0).to, label: 'Last 3 Months' };
    },
  },
  {
    label: 'This Year',
    getRange: getFiscalYearRange,
  },
];

/* ─── Metric Card ────────────────────────────────────── */
function MetricCard({
  label, value, sub, positive, icon: Icon,
}: {
  label: string; value: string; sub?: string; positive?: boolean; icon: React.ElementType;
}) {
  const [hov, setHov] = useState(false);
  const color =
    positive === undefined ? C.indigo :
    positive ? C.emerald : C.rose;

  return (
    <div
      style={{
        backgroundColor: hov ? C.cardHover : C.card,
        border: `1px solid ${hov ? `rgba(${positive === undefined ? '99,102,241' : positive ? '16,185,129' : '244,63,94'},0.3)` : C.cardBorder}`,
        borderRadius: 18, padding: 22,
        position: 'relative', overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: hov ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 100, height: 100, borderRadius: '50%',
        backgroundColor: color, opacity: hov ? 0.1 : 0.05,
        filter: 'blur(28px)', pointerEvents: 'none',
        transition: 'opacity 0.3s ease',
      }} />

      {/* Top row: icon + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          backgroundColor: `${color}22`,
          border: `1px solid ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon style={{ width: 16, height: 16, color }} />
        </div>
        {positive !== undefined && (
          <span style={{
            fontSize: 9, fontWeight: 900, padding: '3px 9px', borderRadius: 99,
            textTransform: 'uppercase' as const, letterSpacing: '0.08em',
            backgroundColor: positive ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
            color: positive ? C.emerald : C.rose,
            border: `1px solid ${positive ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
          }}>
            {positive ? 'Profit' : 'Loss'}
          </span>
        )}
      </div>

      {/* Label */}
      <p style={{ margin: 0, fontSize: 9.5, fontWeight: 900, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 6 }}>
        {label}
      </p>
      {/* Value */}
      <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </p>
      {/* Sub */}
      {sub && (
        <p style={{ margin: '6px 0 0', fontSize: 11, color: C.subtle, fontWeight: 600 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ─── Waterfall Row ──────────────────────────────────── */
function WaterfallRow({
  label, amount, maxVal, color,
}: {
  label: string; amount: number; maxVal: number; color: string;
}) {
  // FIX 2: When maxVal is 0 (no revenue), bar should stay at 0 not crash
  const pct = maxVal > 0 ? (Math.abs(amount) / maxVal) * 100 : 0;
  const isNeg = amount < 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <div style={{ width: 130, fontSize: 11.5, fontWeight: 700, color: C.subtle, flexShrink: 0 }}>
        {label}
      </div>
      <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 99, height: 20, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          // FIX 3: Cap bar at 100% — previously COGS > Revenue would overflow
          width: `${Math.min(Math.max(pct, 0.5), 100)}%`,
          background: color,
          transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
      <div style={{
        width: 110, textAlign: 'right' as const, fontSize: 12, fontWeight: 900,
        color: isNeg ? C.rose : C.text, flexShrink: 0,
      }}>
        {isNeg ? '−' : ''}{formatCurrency(Math.abs(amount))}
      </div>
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────── */
function EmptyState({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '64px 0', gap: 10,
    }}>
      <PieChart style={{ width: 36, height: 36, color: C.muted, opacity: 0.4 }} />
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.muted }}>No data for {label}</p>
      <p style={{ margin: 0, fontSize: 12, color: C.muted, opacity: 0.7 }}>Try selecting a different date range</p>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────── */
export default function ProfitReportPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [activeRange, setActiveRange] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [fromDate, setFromDate] = useState(getMonthRange(0).from);
  const [toDate,   setToDate]   = useState(getMonthRange(0).to);
  const [loading, setLoading] = useState(true);
  // FIX 4: Track current range label for the empty state message
  const [rangeLabel, setRangeLabel] = useState(getMonthRange(0).label);
  // FIX 5: Track fetch errors separately so UI can show an error state
  const [error, setError] = useState<string | null>(null);

  const [totalSales,     setTotalSales]     = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalExpenses,  setTotalExpenses]  = useState(0);

  const pharmacyIdRef = useRef(pharmacyId);
  pharmacyIdRef.current = pharmacyId;

  // FIX 6: Wrap `load` in useCallback so it's stable across renders.
  // Previously the function was recreated on every render, and the useEffect
  // dependency-lint suppression was hiding that it depended on stale closures.
  const load = useCallback(async (from: string, to: string) => {
    const pid = pharmacyIdRef.current;
    if (!pid) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [salesRes, purchasesRes, expensesRes] = await Promise.all([
        // FIX 7a: Sales date filter — `bill_date` in sales is stored as a date string
        // (YYYY-MM-DD), so using lte with plain `to` (no time suffix) is correct.
        // Appending T23:59:59 to a date-only column causes Postgres to coerce it, which
        // works but is misleading. Use consistent date-only comparison for all three queries.
        supabase.from('sales').select('total_amount')
          .eq('pharmacy_id', pid)
          .gte('bill_date', from)
          .lte('bill_date', to),
        supabase.from('purchases').select('total_amount')
          .eq('pharmacy_id', pid)
          .gte('bill_date', from)
          .lte('bill_date', to),
        supabase.from('expenses').select('amount')
          .eq('pharmacy_id', pid)
          .gte('expense_date', from)
          .lte('expense_date', to),
      ]);

      // FIX 7b: Supabase errors were silently ignored — check each result's error
      if (salesRes.error)     throw new Error(`Sales: ${salesRes.error.message}`);
      if (purchasesRes.error) throw new Error(`Purchases: ${purchasesRes.error.message}`);
      if (expensesRes.error)  throw new Error(`Expenses: ${expensesRes.error.message}`);

      setTotalSales(    (salesRes.data     || []).reduce((s: number, r: { total_amount: number | null }) => s + (r.total_amount || 0), 0));
      setTotalPurchases((purchasesRes.data || []).reduce((s: number, r: { total_amount: number | null }) => s + (r.total_amount || 0), 0));
      setTotalExpenses( (expensesRes.data  || []).reduce((s: number, r: { amount: number | null }) => s + (r.amount || 0), 0));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []); // supabase client is stable; pharmacyId accessed via ref

  useEffect(() => {
    if (pharmacyId) load(fromDate, toDate);
    else setLoading(false);
  }, [pharmacyId, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyRange = (idx: number) => {
    setActiveRange(idx);
    setCustomMode(false);
    const { from, to, label } = QUICK_RANGES[idx].getRange();
    setFromDate(from);
    setToDate(to);
    setRangeLabel(label);
    load(from, to);
  };

  const applyCustom = () => {
    if (!fromDate || !toDate) return;
    // FIX 8: Validate that from ≤ to before fetching
    if (fromDate > toDate) {
      setError('Start date cannot be after end date');
      return;
    }
    setRangeLabel(`${fromDate} – ${toDate}`);
    load(fromDate, toDate);
  };

  const grossProfit = totalSales - totalPurchases;
  const netProfit   = grossProfit - totalExpenses;
  const grossMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
  const netMargin   = totalSales > 0 ? (netProfit   / totalSales) * 100 : 0;

  const hasData = totalSales > 0 || totalPurchases > 0 || totalExpenses > 0;

  /* input focus style helper */
  const dateInputStyle: React.CSSProperties = {
    backgroundColor: C.input, border: `1px solid ${C.inputBorder}`,
    borderRadius: 10, padding: '8px 12px', color: C.text, fontSize: 13,
    fontWeight: 600, fontFamily: 'inherit', outline: 'none',
    colorScheme: 'dark' as any,
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 38, height: 38, borderRadius: 11,
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: `1px solid ${C.cardBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
        >
          <ChevronLeft style={{ width: 18, height: 18, color: C.muted }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PieChart style={{ width: 18, height: 18, color: C.blue }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>
              Profit &amp; Loss Report
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>
              Gross &amp; net margin vs COGS and operational expenses
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick range selector ────────────────────────── */}
      <div style={{
        backgroundColor: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* Chips row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {QUICK_RANGES.map((r, i) => {
            const active = activeRange === i && !customMode;
            return (
              <button
                key={r.label}
                onClick={() => applyRange(i)}
                style={{
                  padding: '8px 16px', borderRadius: 12,
                  fontSize: 12, fontWeight: 700,
                  border: `1px solid ${active ? C.indigo : C.cardBorder}`,
                  backgroundColor: active ? C.indigo : 'transparent',
                  color: active ? '#fff' : C.subtle,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = C.indigoLight; e.currentTarget.style.color = C.indigoLight; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.color = C.subtle; } }}
              >
                {r.label}
              </button>
            );
          })}
          {/* Custom button */}
          <button
            onClick={() => setCustomMode(true)}
            style={{
              padding: '8px 16px', borderRadius: 12,
              fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
              border: `1px solid ${customMode ? C.indigo : C.cardBorder}`,
              backgroundColor: customMode ? C.indigo : 'transparent',
              color: customMode ? '#fff' : C.subtle,
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { if (!customMode) { e.currentTarget.style.borderColor = C.indigoLight; e.currentTarget.style.color = C.indigoLight; } }}
            onMouseLeave={e => { if (!customMode) { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.color = C.subtle; } }}
          >
            <Calendar style={{ width: 13, height: 13 }} />
            Custom
          </button>
        </div>

        {/* Custom date picker row */}
        {customMode && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            paddingTop: 16, borderTop: `1px solid ${C.cardBorder}`,
            flexWrap: 'wrap',
          }}>
            <input
              type="date" value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              style={dateInputStyle}
            />
            <span style={{ color: C.muted, fontSize: 13, fontWeight: 700 }}>to</span>
            <input
              type="date" value={toDate}
              onChange={e => setToDate(e.target.value)}
              style={dateInputStyle}
            />
            <button
              onClick={applyCustom}
              style={{
                padding: '9px 20px', borderRadius: 10,
                backgroundColor: C.indigo, color: '#fff',
                fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.indigoLight; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.indigo; }}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* ── Error banner ────────────────────────────────── */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(244,63,94,0.08)',
          border: `1px solid rgba(244,63,94,0.2)`,
          borderRadius: 12, padding: '12px 18px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 13, color: C.rose, fontWeight: 700 }}>⚠ {error}</span>
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 10 }}>
          <Loader2 style={{ width: 20, height: 20, color: C.blue, animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>Calculating…</span>
        </div>
      ) : !hasData ? (
        <EmptyState label={rangeLabel} />
      ) : (
        <>
          {/* ── Metric cards ─────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            <MetricCard
              label="Revenue"
              value={formatCurrency(totalSales)}
              icon={TrendingUp}
            />
            <MetricCard
              label="Cost of Goods (COGS)"
              value={formatCurrency(totalPurchases)}
              icon={BarChart3}
            />
            <MetricCard
              label="Gross Profit"
              value={formatCurrency(grossProfit)}
              sub={`${grossMargin.toFixed(1)}% margin`}
              positive={grossProfit >= 0}
              icon={IndianRupee}
            />
            <MetricCard
              label="Total Expenses"
              value={formatCurrency(totalExpenses)}
              icon={TrendingDown}
            />
            <MetricCard
              label="Net Profit"
              value={formatCurrency(netProfit)}
              sub={`${netMargin.toFixed(1)}% net margin`}
              positive={netProfit >= 0}
              icon={PieChart}
            />
          </div>

          {/* ── P&L Waterfall ─────────────────────────────── */}
          <div style={{
            backgroundColor: C.card, border: `1px solid ${C.cardBorder}`,
            borderRadius: 20, padding: 28,
          }}>
            <h3 style={{
              margin: '0 0 22px', fontSize: 10, fontWeight: 900,
              color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em',
            }}>
              P&amp;L Waterfall
            </h3>

            {[
              { label: 'Revenue',        amount: totalSales,      color: C.blue },
              { label: '− COGS',         amount: -totalPurchases, color: C.subtle },
              { label: '= Gross Profit', amount: grossProfit,     color: C.emerald },
              { label: '− Expenses',     amount: -totalExpenses,  color: C.orange },
              {
                label: '= Net Profit',
                amount: netProfit,
                color: netProfit >= 0 ? C.indigo : C.rose,
              },
            ].map((row) => (
              <WaterfallRow
                key={row.label}
                label={row.label}
                amount={row.amount}
                maxVal={totalSales}
                color={row.color}
              />
            ))}
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
