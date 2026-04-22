'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency } from '@/lib/utils/format';
import {
  Loader2, ArrowLeft, FileText, Download,
  ChevronLeft as ArrowL, ChevronRight as ArrowR,
  TrendingUp, TrendingDown, AlertCircle, ShieldCheck, Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';

/* ─── Palette ────────────────────────────────────────── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569',
  teal: '#14b8a6', tealLight: '#5eead4', tealBg: 'rgba(20,184,166,0.1)',
  indigo: '#6366f1', indigoLight: '#818cf8', indigoBg: 'rgba(99,102,241,0.1)',
  blue: '#3b82f6', blueBg: 'rgba(59,130,246,0.1)',
  orange: '#f97316', orangeBg: 'rgba(249,115,22,0.1)',
  emerald: '#10b981', emeraldLight: '#34d399', emeraldBg: 'rgba(16,185,129,0.1)',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.1)',
  amber: '#f59e0b', amberBg: 'rgba(245,158,11,0.1)',
  purple: '#a855f7',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

interface GstSlab {
  gst_rate: number;
  transactions: number;
  taxable_amount: number;
  cgst: number;
  sgst: number;
  igst: number; // Assuming intra-state for simplicity, but we will keep the structure
  total_gst: number;
}

interface GstReportData {
  out_total_gst: number;
  out_taxable: number;
  out_cgst: number;
  out_sgst: number;
  out_igst: number;
  out_b2b_taxable: number;
  out_b2c_taxable: number;
  out_slabs: GstSlab[];
  
  in_total_gst: number;
  in_taxable: number;
  in_cgst: number;
  in_sgst: number;
  in_igst: number;
  in_slabs: GstSlab[];
  
  sr_gst: number;
  pr_gst: number;
  
  net_output_gst: number;
  net_itc: number;
  net_payable: number;
}

function StatCard({
  label, value, color, bg, sub
}: {
  label: string; value: string; color: string; bg: string; sub?: string;
}) {
  return (
    <div style={{
      backgroundColor: bg,
      border: `1px solid ${color.replace(')', ', 0.2)').replace('rgb', 'rgba')}`,
      borderRadius: 16,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 11, color: color, opacity: 0.8, fontWeight: 600 }}>{sub}</p>}
    </div>
  );
}

export default function GstReportPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [activeTab, setActiveTab] = useState<'output' | 'input' | 'net'>('output');
  const [report, setReport] = useState<GstReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!pharmacyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const pad = (n: number) => String(n).padStart(2, '0');
      const lastDay = new Date(year, month, 0).getDate();
      const fromDateStr = `${year}-${pad(month)}-01T00:00:00.000Z`;
      const toDateStr = `${year}-${pad(month)}-${lastDay}T23:59:59.999Z`;

      // 1. Fetch Sales and Sale Items
      const { data: salesData } = await supabase
        .from('sales')
        .select(`
          id, customer_id, customers(name),
          sale_items(total_amount, gst_rate, quantity, unit_price, mrp)
        `)
        .eq('pharmacy_id', pharmacyId)
        .gte('bill_date', fromDateStr)
        .lte('bill_date', toDateStr)
        .neq('status', 'Cancelled');

      // 2. Fetch Purchases and Purchase Items
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select(`
          id, 
          purchase_items(total_amount, gst_amount, quantity, purchase_price)
        `)
        .eq('pharmacy_id', pharmacyId)
        .gte('bill_date', fromDateStr)
        .lte('bill_date', toDateStr);

      // 3. Fetch Sale Returns
      const { data: srData } = await supabase
        .from('sale_returns')
        .select(`
          id, refund_amount,
          sale_return_items(quantity, refund_amount, sale_items(gst_rate))
        `)
        .eq('pharmacy_id', pharmacyId)
        .gte('return_date', fromDateStr)
        .lte('return_date', toDateStr);

      // 4. Fetch Purchase Returns
      const { data: prData } = await supabase
        .from('purchase_returns')
        .select(`
          id, total_amount,
          purchase_return_items(quantity, total_amount, purchase_items(gst_amount, total_amount))
        `)
        .eq('pharmacy_id', pharmacyId)
        .gte('return_date', fromDateStr)
        .lte('return_date', toDateStr);

      // --- Process Output (Sales) ---
      let out_taxable = 0;
      let out_cgst = 0;
      let out_sgst = 0;
      let out_total_gst = 0;
      let out_b2b_taxable = 0;
      let out_b2c_taxable = 0;
      const outSlabsMap = new Map<number, GstSlab>();

      for (const sale of (salesData || [])) {
        const isB2B = false; // B2B not tracked in current customers schema
        let saleTaxable = 0;

        for (const item of (sale.sale_items || [])) {
          const rate = item.gst_rate || 0;
          // Reverse calculate taxable and gst from total_amount since sale_items might just have total_amount and gst_rate in older records
          // Wait, modern sale_items might have gst_amount? No, schema says sale_items has total_amount, gst_rate.
          // gst_amount = total_amount - (total_amount / (1 + gst_rate / 100))
          const itemTaxable = item.total_amount / (1 + rate / 100);
          const itemGst = item.total_amount - itemTaxable;
          const halfGst = itemGst / 2;

          saleTaxable += itemTaxable;
          out_taxable += itemTaxable;
          out_total_gst += itemGst;
          out_cgst += halfGst;
          out_sgst += halfGst;

          const existing = outSlabsMap.get(rate);
          if (existing) {
            existing.transactions += 1;
            existing.taxable_amount += itemTaxable;
            existing.cgst += halfGst;
            existing.sgst += halfGst;
            existing.total_gst += itemGst;
          } else {
            outSlabsMap.set(rate, {
              gst_rate: rate,
              transactions: 1,
              taxable_amount: itemTaxable,
              cgst: halfGst,
              sgst: halfGst,
              igst: 0,
              total_gst: itemGst,
            });
          }
        }

        if (isB2B) out_b2b_taxable += saleTaxable;
        else out_b2c_taxable += saleTaxable;
      }

      // --- Process Input (Purchases) ---
      let in_taxable = 0;
      let in_cgst = 0;
      let in_sgst = 0;
      let in_total_gst = 0;
      const inSlabsMap = new Map<number, GstSlab>();

      for (const pur of (purchasesData || [])) {
        for (const item of (pur.purchase_items || [])) {
          // purchase_items has gst_amount and total_amount
          const itemGst = item.gst_amount || 0;
          const itemTotal = item.total_amount || 0;
          const itemTaxable = itemTotal - itemGst;
          const halfGst = itemGst / 2;
          
          // Try to deduce rate to group it
          let rate = 0;
          if (itemTaxable > 0 && itemGst > 0) {
             const calcRate = Math.round((itemGst / itemTaxable) * 100);
             // snap to nearest standard rate
             const std = [0, 5, 12, 18, 28];
             rate = std.reduce((prev, curr) => Math.abs(curr - calcRate) < Math.abs(prev - calcRate) ? curr : prev);
          }

          in_taxable += itemTaxable;
          in_total_gst += itemGst;
          in_cgst += halfGst;
          in_sgst += halfGst;

          const existing = inSlabsMap.get(rate);
          if (existing) {
            existing.transactions += 1;
            existing.taxable_amount += itemTaxable;
            existing.cgst += halfGst;
            existing.sgst += halfGst;
            existing.total_gst += itemGst;
          } else {
            inSlabsMap.set(rate, {
              gst_rate: rate,
              transactions: 1,
              taxable_amount: itemTaxable,
              cgst: halfGst,
              sgst: halfGst,
              igst: 0,
              total_gst: itemGst,
            });
          }
        }
      }

      // --- Process Sale Returns ---
      let sr_gst = 0;
      for (const sr of (srData || [])) {
        for (const item of (sr.sale_return_items || [])) {
          // Extract GST portion from refund amount
          const rate = (item.sale_items as any)?.gst_rate || 0;
          const refundAmt = item.refund_amount || 0;
          const itemGst = refundAmt - (refundAmt / (1 + rate / 100));
          sr_gst += itemGst;
        }
      }

      // --- Process Purchase Returns ---
      let pr_gst = 0;
      for (const pr of (prData || [])) {
        for (const item of (pr.purchase_return_items || [])) {
           // Deduced reversed GST
           const retTotal = item.total_amount || 0;
           const origGst = (item.purchase_items as any)?.gst_amount || 0;
           const origTotal = (item.purchase_items as any)?.total_amount || 0;
           if (origTotal > 0) {
             pr_gst += (origGst / origTotal) * retTotal;
           }
        }
      }

      // Calculate final Net Position
      const net_output_gst = out_total_gst - sr_gst;
      const net_itc = in_total_gst - pr_gst;
      const net_payable = net_output_gst - net_itc;

      setReport({
        out_total_gst, out_taxable, out_cgst, out_sgst, out_igst: 0,
        out_b2b_taxable, out_b2c_taxable,
        out_slabs: Array.from(outSlabsMap.values()).sort((a,b) => a.gst_rate - b.gst_rate),
        in_total_gst, in_taxable, in_cgst, in_sgst, in_igst: 0,
        in_slabs: Array.from(inSlabsMap.values()).sort((a,b) => a.gst_rate - b.gst_rate),
        sr_gst, pr_gst,
        net_output_gst, net_itc, net_payable
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, month, year]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    const nm = month === 1 ? 12 : month - 1;
    const ny = month === 1 ? year - 1 : year;
    setMonth(nm); setYear(ny);
  };

  const nextMonth = () => {
    const nm = month === 12 ? 1 : month + 1;
    const ny = month === 12 ? year + 1 : year;
    setMonth(nm); setYear(ny);
  };

  const monthLabel = new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });

  const downloadJson = () => {
    if (!report) return;
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const pad = (n: number) => String(n).padStart(2, "0");
    a.download = `GST_Summary_${year}_${pad(month)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48, width: '100%' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}>
            <ArrowLeft style={{ width: 18, height: 18, color: C.muted }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.tealBg, border: `1px solid ${C.teal}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText style={{ width: 18, height: 18, color: C.teal }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>GST Summary Report</h1>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>Output Tax · Input Tax Credit · Net Payable</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => router.push('/panel/reports/gst/annual')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, backgroundColor: C.emeraldBg, border: `1px solid ${C.emerald}44`, color: C.emeraldLight, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
          >
            <ShieldCheck style={{ width: 14, height: 14 }} />
            Annual Report
          </button>
          <button
            onClick={downloadJson}
            disabled={loading || !report}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${C.cardBorder}`, color: C.text, fontSize: 12, fontWeight: 800, cursor: (loading || !report) ? 'not-allowed' : 'pointer', opacity: (loading || !report) ? 0.5 : 1 }}
          >
            <Download style={{ width: 14, height: 14 }} />
            JSON Export
          </button>
        </div>
      </div>

      {/* ── Month Navigator ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '12px' }}>
        <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none' }}>
          <ArrowL style={{ width: 16, height: 16, color: C.text }} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 900, color: C.text, minWidth: 160, textAlign: 'center' }}>{monthLabel}</span>
        <button onClick={nextMonth}
          disabled={month === now.getMonth() + 1 && year === now.getFullYear()}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', opacity: (month === now.getMonth() + 1 && year === now.getFullYear()) ? 0.3 : 1 }}>
          <ArrowR style={{ width: 16, height: 16, color: C.text }} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 14 }}>
           <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.tealBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 style={{ width: 22, height: 22, color: C.teal, animation: 'spin 1s linear infinite' }} />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, fontWeight: 500 }}>Analyzing GST data for {monthLabel}…</p>
        </div>
      ) : report ? (
        <>
          {/* ── Net Position Hero ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <StatCard
              label="Output GST (Sales)"
              value={formatCurrency(report.out_total_gst)}
              color={C.teal}
              bg={C.tealBg}
              sub={`Taxable: ${formatCurrency(report.out_taxable)}`}
            />
            <StatCard
              label="Input ITC (Purchases)"
              value={formatCurrency(report.in_total_gst)}
              color={C.blue}
              bg={C.blueBg}
              sub={`Taxable: ${formatCurrency(report.in_taxable)}`}
            />
            <div style={{
              backgroundColor: report.net_payable > 0 ? C.orangeBg : C.emeraldBg,
              border: `1px solid ${report.net_payable > 0 ? `${C.orange}44` : `${C.emerald}44`}`,
              borderRadius: 16,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: report.net_payable > 0 ? C.orange : C.emerald, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net GST Payable</p>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: C.text }}>{formatCurrency(report.net_payable)}</p>
              <p style={{ margin: 0, fontSize: 11, color: report.net_payable > 0 ? C.orange : C.emerald, opacity: 0.8, fontWeight: 600 }}>
                {report.net_payable > 0 ? "Amount to deposit to govt" : "No payable this month"}
              </p>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div style={{ display: 'flex', gap: 8, backgroundColor: 'rgba(255,255,255,0.03)', padding: 6, borderRadius: 16, border: `1px solid ${C.cardBorder}` }}>
            {[
              { id: 'output' as const, label: '📤 Output (Sales)' },
              { id: 'input' as const, label: '📥 Input ITC (Purchases)' },
              { id: 'net' as const, label: '🧾 Net Payable' },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 800,
                  backgroundColor: activeTab === id ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: activeTab === id ? C.text : C.muted,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── OUTPUT TAB ── */}
          {activeTab === 'output' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <StatCard label="Taxable Amount" value={formatCurrency(report.out_taxable)} color={C.muted} bg={C.card} />
                <StatCard label="CGST" value={formatCurrency(report.out_cgst)} color={C.blue} bg={C.card} />
                <StatCard label="SGST" value={formatCurrency(report.out_sgst)} color={C.blue} bg={C.card} />
                <StatCard label="IGST" value={formatCurrency(report.out_igst)} color={C.purple} bg={C.card} />
              </div>

              {/* B2B vs B2C */}
              <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 20 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>B2B vs B2C Split</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ backgroundColor: C.indigoBg, border: `1px solid ${C.indigo}33`, borderRadius: 14, padding: 16 }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: C.indigo, textTransform: 'uppercase', letterSpacing: '0.05em' }}>B2B (Business)</p>
                    <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 900, color: C.text }}>{formatCurrency(report.out_b2b_taxable)}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.indigoLight }}>Taxable value</p>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 16 }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>B2C (Retail)</p>
                    <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 900, color: C.text }}>{formatCurrency(report.out_b2c_taxable)}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>Taxable value</p>
                  </div>
                </div>
                {report.sr_gst > 0 && (
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.redBg, border: `1px solid ${C.red}33`, borderRadius: 12, padding: '12px 16px' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>Sale Returns GST deducted</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#f87171' }}>− {formatCurrency(report.sr_gst)}</span>
                  </div>
                )}
              </div>

              {/* Slab breakdown */}
              {report.out_slabs.length > 0 && (
                <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.cardBorder}` }}>
                     <h3 style={{ margin: 0, fontSize: 11, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Slab-wise Output Breakdown</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) 1fr 1.5fr 1fr 1fr 1fr 1.5fr', alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.012)' }}>
                     {['Rate', 'Trans.', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total GST'].map(h => (
                       <p key={h} style={{ margin: 0, fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.09em', textAlign: h === 'Rate' ? 'left' : 'right' }}>{h}</p>
                     ))}
                  </div>
                  <div>
                    {report.out_slabs.map((slab, idx) => (
                      <div key={slab.gst_rate} style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) 1fr 1.5fr 1fr 1fr 1fr 1.5fr', alignItems: 'center', padding: '16px 20px', borderBottom: idx < report.out_slabs.length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}>
                         <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 8px', borderRadius: 20, backgroundColor: C.tealBg, border: `1px solid ${C.teal}33`, width: 'fit-content' }}>
                           <span style={{ fontSize: 11, fontWeight: 900, color: C.tealLight }}>{slab.gst_rate}%</span>
                         </div>
                         <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.muted, textAlign: 'right' }}>{slab.transactions}</p>
                         <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>{formatCurrency(slab.taxable_amount)}</p>
                         <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.blue, textAlign: 'right' }}>{formatCurrency(slab.cgst)}</p>
                         <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.blue, textAlign: 'right' }}>{formatCurrency(slab.sgst)}</p>
                         <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.purple, textAlign: 'right' }}>{formatCurrency(slab.igst)}</p>
                         <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.text, textAlign: 'right' }}>{formatCurrency(slab.total_gst)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── INPUT TAB ── */}
          {activeTab === 'input' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <StatCard label="Purchase Taxable" value={formatCurrency(report.in_taxable)} color={C.muted} bg={C.card} />
                <StatCard label="Input CGST" value={formatCurrency(report.in_cgst)} color={C.blue} bg={C.card} />
                <StatCard label="Input SGST" value={formatCurrency(report.in_sgst)} color={C.blue} bg={C.card} />
                <StatCard label="Input IGST" value={formatCurrency(report.in_igst)} color={C.purple} bg={C.card} />
              </div>

              {report.pr_gst > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.amberBg, border: `1px solid ${C.amber}33`, borderRadius: 12, padding: '12px 16px' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>Purchase Returns — ITC Reversal</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24' }}>− {formatCurrency(report.pr_gst)}</span>
                </div>
              )}

              <div style={{ backgroundColor: C.blueBg, border: `1px solid ${C.blue}44`, borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#60a5fa' }}>Net ITC Available</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: C.text }}>{formatCurrency(report.net_itc)}</span>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#93c5fd', opacity: 0.8 }}>
                  Verify with GSTR-2B before claiming. ITC shown is based on purchase entries in ShelfCure.
                </p>
              </div>

              {report.in_slabs.length > 0 && (
                <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.cardBorder}` }}>
                     <h3 style={{ margin: 0, fontSize: 11, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Slab-wise Input Breakdown</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) 1fr 1.5fr 1fr 1fr 1fr 1.5fr', alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.012)' }}>
                     {['Rate', 'Items', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total ITC'].map(h => (
                       <p key={h} style={{ margin: 0, fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.09em', textAlign: h === 'Rate' ? 'left' : 'right' }}>{h}</p>
                     ))}
                  </div>
                  <div>
                    {report.in_slabs.map((slab, idx) => (
                      <div key={slab.gst_rate} style={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 1fr) 1fr 1.5fr 1fr 1fr 1fr 1.5fr', alignItems: 'center', padding: '16px 20px', borderBottom: idx < report.in_slabs.length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}>
                         <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 8px', borderRadius: 20, backgroundColor: C.blueBg, border: `1px solid ${C.blue}33`, width: 'fit-content' }}>
                           <span style={{ fontSize: 11, fontWeight: 900, color: '#60a5fa' }}>{slab.gst_rate}%</span>
                         </div>
                         <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.muted, textAlign: 'right' }}>{slab.transactions}</p>
                         <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>{formatCurrency(slab.taxable_amount)}</p>
                         <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.blue, textAlign: 'right' }}>{formatCurrency(slab.cgst)}</p>
                         <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.blue, textAlign: 'right' }}>{formatCurrency(slab.sgst)}</p>
                         <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.purple, textAlign: 'right' }}>{formatCurrency(slab.igst)}</p>
                         <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#60a5fa', textAlign: 'right' }}>{formatCurrency(slab.total_gst)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── NET PAYABLE TAB ── */}
          {activeTab === 'net' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>GSTR-3B Position (Simplified)</h3>
                {[
                  { label: "Output GST Collected (Sales)", value: report.out_total_gst, color: C.tealLight, prefix: "" },
                  { label: "Less: Sale Returns GST", value: -report.sr_gst, color: "#f87171", prefix: "−" },
                  { label: "Net Output GST", value: report.net_output_gst, color: C.tealLight, prefix: "", bold: true, border: true },
                  { label: "Input Tax Credit (Purchases)", value: -report.net_itc, color: "#60a5fa", prefix: "−" },
                  { label: "Add: Purchase Return Reversal", value: report.pr_gst, color: "#fbbf24", prefix: "+" },
                ].map(({ label, value, color, prefix, bold, border }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: border ? `1px solid ${C.cardBorder}` : 'none', marginTop: border ? 8 : 0 }}>
                    <span style={{ fontSize: 14, fontWeight: bold ? 900 : 600, color: bold ? C.text : C.muted }}>{label}</span>
                    <span style={{ fontSize: bold ? 18 : 14, fontWeight: 900, color: color }}>
                      {prefix} {formatCurrency(Math.abs(value))}
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, marginTop: 8, borderTop: `2px solid ${C.cardBorder}` }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: C.text }}>= Net GST Payable to Govt</span>
                  <span style={{ fontSize: 28, fontWeight: 900, color: report.net_payable > 0 ? C.orange : C.emerald }}>
                    {formatCurrency(report.net_payable)}
                  </span>
                </div>
              </div>

              {/* Filing tip */}
              <div style={{ display: 'flex', gap: 12, backgroundColor: C.indigoBg, border: `1px solid ${C.indigo}44`, borderRadius: 16, padding: 16 }}>
                <Info style={{ width: 18, height: 18, color: C.indigoLight, flexShrink: 0, marginTop: 2 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.text }}>GSTR-3B Filing Tips</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#a5b4fc' }}>• GSTR-3B due on 20th of the following month (monthly filers)</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#a5b4fc' }}>• ITC shown here must be verified against GSTR-2B before claiming</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#a5b4fc' }}>• Pay net GST via GST portal before filing</p>
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ display: 'flex', gap: 12, backgroundColor: C.amberBg, border: `1px solid ${C.amber}44`, borderRadius: 16, padding: 16 }}>
             <AlertCircle style={{ width: 16, height: 16, color: '#fbbf24', flexShrink: 0, marginTop: 2 }} />
             <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#fbbf24' }}>
               <strong>Disclaimer:</strong> GST figures are computed from data entered in ShelfCure and are for reference only. 
               Input Tax Credit must be verified against GSTR-2B on the official GST portal before claiming. 
               Final filing of GSTR-1, GSTR-3B, and GSTR-9 must be done at <strong>gst.gov.in</strong>.
             </p>
          </div>
        </>
      ) : (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 32px', gap: 14 }}>
           <FileText style={{ width: 26, height: 26, color: 'rgba(255,255,255,0.1)' }} />
           <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.muted }}>No GST data available for this period</p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
