'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Package, Clock, FileText,
  PieChart, ShieldCheck, RotateCcw, PackageMinus,
  ChevronRight, Receipt, Zap
} from 'lucide-react';

/* ─── Palette ────────────────────────────────────────── */
const C = {
  bg: '#060914',
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  cardHover: '#0f1530',
  text: '#f1f5f9', muted: '#475569', subtle: '#94a3b8',
  emerald: '#10b981', emeraldLight: '#34d399',
  indigo: '#6366f1', indigoLight: '#818cf8',
  rose: '#f43f5e', roseLight: '#fb7185',
  purple: '#a855f7', purpleLight: '#c084fc',
  amber: '#f59e0b', amberLight: '#fbbf24',
  teal: '#14b8a6', tealLight: '#5eead4',
  blue: '#3b82f6', blueLight: '#93c5fd',
  orange: '#f97316', orangeLight: '#fdba74',
};

/* ─── Report definitions ─────────────────────────────── */
const REPORTS = [
  {
    title: 'Daily Sales',
    desc: 'Revenue & transaction analysis by date range',
    icon: TrendingUp,
    href: '/panel/sales',
    base: C.emerald, light: C.emeraldLight,
  },
  {
    title: 'Profit & Loss',
    desc: 'Gross & net margin vs COGS and expenses',
    icon: PieChart,
    href: '/panel/reports/profit',
    base: C.blue, light: C.blueLight,
  },
  {
    title: 'Stock Summary',
    desc: 'Inventory valuation, movement & low-stock alert',
    icon: Package,
    href: '/panel/reports/stock',
    base: C.purple, light: C.purpleLight,
  },
  {
    title: 'Expiry Report',
    desc: 'Batches nearing or past expiry with value loss',
    icon: Clock,
    href: '/panel/reports/expiry',
    base: C.orange, light: C.orangeLight,
  },
  {
    title: 'Expense Analysis',
    desc: 'Operational costs breakdown by category',
    icon: BarChart3,
    href: '/panel/finance',
    base: C.indigo, light: C.indigoLight,
  },
  {
    title: 'GST Summary',
    desc: 'Input / output tax breakdown for monthly filing',
    icon: FileText,
    href: '/panel/reports/gst',
    base: C.teal, light: C.tealLight,
  },
  {
    title: 'Annual GST (GSTR-9)',
    desc: 'Full financial year GST summary — GSTR-9 ready',
    icon: ShieldCheck,
    href: '/panel/reports/gst/annual',
    base: C.emerald, light: C.emeraldLight,
  },
  {
    title: 'Sales Returns',
    desc: 'Refunds, credit notes & restocked inventory',
    icon: RotateCcw,
    href: '/panel/reports/returns',
    base: C.rose, light: C.roseLight,
  },
  {
    title: 'Purchase Returns',
    desc: 'Debit notes & items reverted to suppliers',
    icon: PackageMinus,
    href: '/panel/reports/purchase-returns',
    base: C.indigo, light: C.indigoLight,
  },
];

/* ─── Utility ────────────────────────────────────────── */
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function getFiscalYear() {
  const now = new Date();
  return now.getMonth() >= 3
    ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(-2)}`
    : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(-2)}`;
}

/* ─── Report Card ─────────────────────────────────────── */
function ReportCard({ report, index }: { report: typeof REPORTS[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const rgb = hexToRgb(report.base);

  return (
    <Link
      href={report.href}
      style={{
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: hovered ? C.cardHover : C.card,
        border: `1px solid ${hovered ? `rgba(${rgb},0.35)` : C.cardBorder}`,
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(${rgb},0.15) inset, 0 0 32px rgba(${rgb},0.08)`
          : '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        animationDelay: `${index * 40}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent bar */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, ${report.base}, ${report.light})`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }} />

      {/* Card body */}
      <div style={{ padding: '22px 24px 0', flex: 1 }}>
        {/* Glow blob */}
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 110, height: 110, borderRadius: '50%',
          backgroundColor: report.base,
          opacity: hovered ? 0.08 : 0.03,
          filter: 'blur(28px)',
          pointerEvents: 'none',
          transition: 'opacity 0.3s ease',
        }} />

        {/* Icon */}
        <div style={{
          width: 50, height: 50, borderRadius: 14,
          backgroundColor: `rgba(${rgb},${hovered ? '0.18' : '0.10'})`,
          border: `1px solid rgba(${rgb},${hovered ? '0.35' : '0.15'})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 18,
          transition: 'all 0.25s ease',
          boxShadow: hovered ? `0 0 16px rgba(${rgb},0.2)` : 'none',
        }}>
          <report.icon style={{ width: 22, height: 22, color: report.base }} />
        </div>

        {/* Text */}
        <h3 style={{
          margin: 0, fontSize: 15, fontWeight: 800,
          color: hovered ? report.light : C.text,
          letterSpacing: '-0.02em',
          transition: 'color 0.2s ease',
        }}>
          {report.title}
        </h3>
        <p style={{
          margin: '6px 0 0', fontSize: 11.5, color: C.subtle,
          lineHeight: 1.55, fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          {report.desc}
        </p>
      </div>

      {/* Bottom row */}
      <div style={{
        margin: '18px 24px 0',
        borderTop: `1px solid ${hovered ? `rgba(${rgb},0.15)` : 'rgba(255,255,255,0.05)'}`,
        padding: '14px 0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'border-color 0.25s ease',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 800,
          color: hovered ? C.subtle : C.muted,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          transition: 'color 0.2s ease',
        }}>
          Open Report
        </span>
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          backgroundColor: hovered ? `rgba(${rgb},0.15)` : 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}>
          <ChevronRight style={{
            width: 14, height: 14,
            color: hovered ? report.base : C.muted,
            transform: hovered ? 'translateX(2px)' : 'none',
            transition: 'all 0.2s ease',
          }} />
        </div>
      </div>
    </Link>
  );
}

/* ─── Page ─────────────────────────────────────────────── */
export default function ReportsPage() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 48 }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            backgroundColor: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Receipt style={{ width: 20, height: 20, color: C.indigo }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>
              Reports &amp; Analytics
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>
              Business intelligence for your pharmacy
            </p>
          </div>
        </div>

        {/* Meta bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          backgroundColor: C.card,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        }}>
          <div style={{ padding: '10px 20px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Fiscal Year
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 900, color: C.text }}>
              {getFiscalYear()}
            </p>
          </div>

          <div style={{ width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.06)' }} />

          <div style={{ padding: '10px 20px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Last Updated
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 900, color: C.text }}>
              {time || '—'}
            </p>
          </div>

          <div style={{ width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.06)' }} />

          <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap style={{ width: 12, height: 12, color: C.emerald }} />
            <div>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: C.emerald, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Live Engine
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: C.emerald,
                  boxShadow: `0 0 6px ${C.emerald}`,
                  animation: 'pulse 2s infinite',
                }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: C.emeraldLight }}>Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Summary strip ──────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        backgroundColor: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.12)',
        borderRadius: 14, padding: '12px 20px',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          backgroundColor: 'rgba(99,102,241,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: C.indigoLight }}>{REPORTS.length}</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.subtle }}>
          <span style={{ color: C.indigoLight, fontWeight: 800 }}>{REPORTS.length} report modules</span> available — select any card to view detailed analytics, export data, or share insights.
        </p>
      </div>

      {/* ── Grid ──────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
        position: 'relative',
      }}>
        {REPORTS.map((report, i) => (
          <ReportCard key={report.title} report={report} index={i} />
        ))}
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
