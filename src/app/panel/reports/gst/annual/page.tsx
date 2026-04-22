'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency } from '@/lib/utils/format';
import { 
  Loader2, ArrowLeft, ShieldCheck, Download, 
  CalendarDays, TrendingUp, TrendingDown, Info, AlertCircle 
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
  emerald: '#10b981', emeraldBg: 'rgba(16,185,129,0.1)',
  red: '#ef4444', redBg: 'rgba(239,68,68,0.1)',
  amber: '#f59e0b', amberBg: 'rgba(245,158,11,0.1)',
  purple: '#a855f7',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

function getFinYear(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed, so April = 3
  const startYear = m >= 3 ? y : y - 1;
  return `${startYear}-${String(startYear + 1).slice(2)}`;
}

function buildFinYearOptions(): string[] {
  const current = new Date();
  const options: string[] = [];
  const currentFY = parseInt(getFinYear(current).split("-")[0]);
  for (let y = currentFY; y >= currentFY - 4; y--) {
    options.push(`${y}-${String(y + 1).slice(2)}`);
  }
  return options;
}

const MONTH_NAMES = [
  "Apr", "May", "Jun", "Jul", "Aug", "Sep",
  "Oct", "Nov", "Dec", "Jan", "Feb", "Mar",
];

interface AnnualGstRow {
  month_idx: number;
  out_total_gst: number;
  in_total_gst: number;
  net_payable: number;
}

interface AnnualReportData {
  fin_year: string;
  out_total_gst: number;
  out_taxable: number;
  out_cgst: number;
  out_sgst: number;
  out_igst: number;
  out_b2b_taxable: number;
  out_b2c_taxable: number;
  in_total_gst: number;
  in_taxable: number;
  in_cgst: number;
  in_sgst: number;
  in_igst: number;
  sr_gst: number;
  pr_gst: number;
  net_output_gst: number;
  net_itc: number;
  net_payable: number;
  monthly_rows: AnnualGstRow[];
}

export default function AnnualGstReportPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [finYear, setFinYear] = useState(() => getFinYear(new Date()));
  const [report, setReport] = useState<AnnualReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!pharmacyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const startYear = parseInt(finYear.split('-')[0]);
      const fromDateStr = `${startYear}-04-01T00:00:00.000Z`;
      const toDateStr = `${startYear + 1}-03-31T23:59:59.999Z`;

      // 1. Fetch Sales and Sale Items
      const { data: salesData, error: salesErr } = await supabase
        .from('sales')
        .select(`
          id, bill_date, customer_id, customers(name),
          sale_items(total_amount, gst_rate, quantity, unit_price, mrp)
        `)
        .eq('pharmacy_id', pharmacyId)
        .gte('bill_date', fromDateStr)
        .lte('bill_date', toDateStr)
        .neq('status', 'Cancelled');

      // 2. Fetch Purchases and Purchase Items
      const { data: purchasesData, error: purErr } = await supabase
        .from('purchases')
        .select(`
          id, bill_date,
          purchase_items(total_amount, gst_amount, quantity, purchase_price)
        `)
        .eq('pharmacy_id', pharmacyId)
        .gte('bill_date', fromDateStr)
        .lte('bill_date', toDateStr);

      // 3. Fetch Sale Returns
      const { data: srData, error: srErr } = await supabase
        .from('sale_returns')
        .select(`
          id, return_date, refund_amount,
          sale_return_items(quantity, refund_amount, sale_items(gst_rate))
        `)
        .eq('pharmacy_id', pharmacyId)
        .gte('return_date', fromDateStr)
        .lte('return_date', toDateStr);

      // 4. Fetch Purchase Returns
      const { data: prData, error: prErr } = await supabase
        .from('purchase_returns')
        .select(`
          id, return_date, total_amount,
          purchase_return_items(quantity, total_amount, purchase_items(gst_amount, total_amount))
        `)
        .eq('pharmacy_id', pharmacyId)
        .gte('return_date', fromDateStr)
        .lte('return_date', toDateStr);

      if (salesErr) throw new Error(`Sales error: ${salesErr.message}`);
      if (purErr) throw new Error(`Purchases error: ${purErr.message}`);
      if (srErr) throw new Error(`Sale Returns error: ${srErr.message}`);
      if (prErr) throw new Error(`Purchase Returns error: ${prErr.message}`);

      let out_taxable = 0, out_cgst = 0, out_sgst = 0, out_total_gst = 0;
      let out_b2b_taxable = 0, out_b2c_taxable = 0;
      let in_taxable = 0, in_cgst = 0, in_sgst = 0, in_total_gst = 0;
      let sr_gst = 0, pr_gst = 0;

      // Helper to map a date string to 0-11 index (0 = Apr, 11 = Mar)
      const getMonthIndex = (dateStr: string) => {
        const d = new Date(dateStr);
        const m = d.getMonth();
        return m >= 3 ? m - 3 : m + 9;
      };

      const monthlyBuckets = Array.from({ length: 12 }, (_, i) => ({
        month_idx: i,
        out_total_gst: 0,
        in_total_gst: 0,
        net_payable: 0,
        _sr_gst: 0,
        _pr_gst: 0,
      }));

      // --- Process Output (Sales) ---
      for (const sale of (salesData || [])) {
        const isB2B = false; // B2B not tracked in current customers schema
        let saleTaxable = 0;
        let saleGst = 0;
        const mIdx = getMonthIndex(sale.bill_date);

        for (const item of (sale.sale_items || [])) {
          const rate = item.gst_rate || 0;
          const itemTaxable = item.total_amount / (1 + rate / 100);
          const itemGst = item.total_amount - itemTaxable;
          const halfGst = itemGst / 2;

          saleTaxable += itemTaxable;
          saleGst += itemGst;

          out_taxable += itemTaxable;
          out_total_gst += itemGst;
          out_cgst += halfGst;
          out_sgst += halfGst;
        }

        if (isB2B) out_b2b_taxable += saleTaxable;
        else out_b2c_taxable += saleTaxable;

        if (mIdx >= 0 && mIdx < 12) monthlyBuckets[mIdx].out_total_gst += saleGst;
      }

      // --- Process Input (Purchases) ---
      for (const pur of (purchasesData || [])) {
        const mIdx = getMonthIndex(pur.bill_date);
        let purGst = 0;

        for (const item of (pur.purchase_items || [])) {
          const itemGst = item.gst_amount || 0;
          const itemTotal = item.total_amount || 0;
          const itemTaxable = itemTotal - itemGst;
          const halfGst = itemGst / 2;

          purGst += itemGst;

          in_taxable += itemTaxable;
          in_total_gst += itemGst;
          in_cgst += halfGst;
          in_sgst += halfGst;
        }
        if (mIdx >= 0 && mIdx < 12) monthlyBuckets[mIdx].in_total_gst += purGst;
      }

      // --- Process Sale Returns ---
      for (const sr of (srData || [])) {
        const mIdx = getMonthIndex(sr.return_date);
        let retGst = 0;
        for (const item of (sr.sale_return_items || [])) {
          const rate = (item.sale_items as any)?.gst_rate || 0;
          const refundAmt = item.refund_amount || 0;
          const itemGst = refundAmt - (refundAmt / (1 + rate / 100));
          retGst += itemGst;
        }
        sr_gst += retGst;
        if (mIdx >= 0 && mIdx < 12) monthlyBuckets[mIdx]._sr_gst += retGst;
      }

      // --- Process Purchase Returns ---
      for (const pr of (prData || [])) {
        const mIdx = getMonthIndex(pr.return_date);
        let retGst = 0;
        for (const item of (pr.purchase_return_items || [])) {
           const retTotal = item.total_amount || 0;
           const origGst = (item.purchase_items as any)?.gst_amount || 0;
           const origTotal = (item.purchase_items as any)?.total_amount || 0;
           if (origTotal > 0) {
             retGst += (origGst / origTotal) * retTotal;
           }
        }
        pr_gst += retGst;
        if (mIdx >= 0 && mIdx < 12) monthlyBuckets[mIdx]._pr_gst += retGst;
      }

      // Calculate monthly net payable
      for (const b of monthlyBuckets) {
        const netOut = b.out_total_gst - b._sr_gst;
        const netIn = b.in_total_gst - b._pr_gst;
        b.net_payable = netOut - netIn;
      }

      const net_output_gst = out_total_gst - sr_gst;
      const net_itc = in_total_gst - pr_gst;
      const net_payable = net_output_gst - net_itc;

      setReport({
        fin_year: finYear,
        out_total_gst, out_taxable, out_cgst, out_sgst, out_igst: 0,
        out_b2b_taxable, out_b2c_taxable,
        in_total_gst, in_taxable, in_cgst, in_sgst, in_igst: 0,
        sr_gst, pr_gst,
        net_output_gst, net_itc, net_payable,
        monthly_rows: monthlyBuckets
      });

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while fetching report data.');
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, finYear]);

  useEffect(() => { load(); }, [load]);

  const handleExportJson = () => {
    if (!report) return;
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Annual_GST_Summary_FY_${finYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48, width: '100%' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push('/panel/reports/gst')}
            style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}>
            <ArrowLeft style={{ width: 18, height: 18, color: C.muted }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.emeraldBg, border: `1px solid ${C.emerald}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck style={{ width: 18, height: 18, color: C.emerald }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Annual GST Summary</h1>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>GSTR-9 Ready · April to March Financial Year</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, padding: '8px 16px', borderRadius: 14 }}>
            <CalendarDays style={{ width: 14, height: 14, color: C.emerald }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financial Year</span>
            <div style={{ width: 1, height: 16, backgroundColor: C.cardBorder }} />
            <select 
              value={finYear} 
              onChange={e => setFinYear(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 13, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              {buildFinYearOptions().map(fy => (
                <option key={fy} value={fy} style={{ backgroundColor: C.input, color: C.text }}>FY {fy}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportJson}
            disabled={loading || !report}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${C.cardBorder}`, color: C.text, fontSize: 12, fontWeight: 800, cursor: (loading || !report) ? 'not-allowed' : 'pointer', opacity: (loading || !report) ? 0.5 : 1 }}
          >
            <Download style={{ width: 14, height: 14 }} />
            Export JSON
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 14 }}>
           <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.emeraldBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 style={{ width: 22, height: 22, color: C.emerald, animation: 'spin 1s linear infinite' }} />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, fontWeight: 500 }}>Generating annual GST summary…</p>
        </div>
      ) : errorMsg ? (
        <div style={{ backgroundColor: C.redBg, border: `1px solid ${C.red}33`, borderRadius: 16, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <AlertCircle style={{ width: 32, height: 32, color: C.red }} />
          <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.red }}>Failed to Load Data</p>
          <p style={{ margin: 0, fontSize: 14, color: '#fca5a5', textAlign: 'center', maxWidth: 400 }}>{errorMsg}</p>
        </div>
      ) : report ? (
        <>
          {/* ── Summary Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ backgroundColor: C.tealBg, border: `1px solid ${C.teal}33`, borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp style={{ width: 14, height: 14, color: C.teal }} />
                <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: C.tealLight, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Annual Output GST</p>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 900, color: C.text }}>{formatCurrency(report.out_total_gst)}</p>
              <p style={{ margin: 0, fontSize: 12, color: C.tealLight, opacity: 0.8, fontWeight: 600 }}>Taxable: {formatCurrency(report.out_taxable)}</p>
            </div>
            
            <div style={{ backgroundColor: C.blueBg, border: `1px solid ${C.blue}33`, borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingDown style={{ width: 14, height: 14, color: C.blue }} />
                <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Annual Input ITC</p>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 900, color: C.text }}>{formatCurrency(report.in_total_gst)}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#60a5fa', opacity: 0.8, fontWeight: 600 }}>Taxable: {formatCurrency(report.in_taxable)}</p>
            </div>

            <div style={{
              backgroundColor: report.net_payable > 0 ? C.orangeBg : C.emeraldBg,
              border: `1px solid ${report.net_payable > 0 ? `${C.orange}44` : `${C.emerald}44`}`,
              borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', gap: 6
            }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: report.net_payable > 0 ? C.orange : C.emerald, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Annual GST Payable</p>
              <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 900, color: C.text }}>{formatCurrency(report.net_payable)}</p>
              <p style={{ margin: 0, fontSize: 12, color: report.net_payable > 0 ? C.orange : C.emerald, opacity: 0.8, fontWeight: 600 }}>For FY {report.fin_year}</p>
            </div>
          </div>

          {/* ── Output & Input Detailed Breakdown ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Output */}
            <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output Tax (Outward Supplies)</h3>
              {[
                { label: "B2B (Business) Taxable", value: report.out_b2b_taxable, color: C.indigoLight },
                { label: "B2C (Retail) Taxable", value: report.out_b2c_taxable, color: C.text },
                { label: "CGST Collected", value: report.out_cgst, color: '#93c5fd' },
                { label: "SGST Collected", value: report.out_sgst, color: '#93c5fd' },
                { label: "IGST Collected", value: report.out_igst, color: C.purple },
                { label: "Sale Returns GST", value: -report.sr_gst, color: "#f87171" },
              ].map(({ label, value, color }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? `1px solid ${C.cardBorder}` : 'none' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: color }}>
                    {value < 0 ? `− ${formatCurrency(Math.abs(value))}` : formatCurrency(value)}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, marginTop: 4, borderTop: `1px solid ${C.cardBorder}` }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: C.text }}>Net Output GST</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: C.tealLight }}>{formatCurrency(report.net_output_gst)}</span>
              </div>
            </div>

            {/* Input */}
            <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Input Tax Credit (ITC)</h3>
              {[
                { label: "CGST Paid (Purchases)", value: report.in_cgst, color: '#93c5fd' },
                { label: "SGST Paid (Purchases)", value: report.in_sgst, color: '#93c5fd' },
                { label: "IGST Paid (Purchases)", value: report.in_igst, color: C.purple },
                { label: "Purchase Returns — Reversal", value: -report.pr_gst, color: "#f87171" },
              ].map(({ label, value, color }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? `1px solid ${C.cardBorder}` : 'none' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: color }}>
                    {value < 0 ? `− ${formatCurrency(Math.abs(value))}` : formatCurrency(value)}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, marginTop: 'auto', borderTop: `1px solid ${C.cardBorder}` }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: C.text }}>Net ITC Available</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#60a5fa' }}>{formatCurrency(report.net_itc)}</span>
              </div>
            </div>
          </div>

          {/* ── Monthly Breakdown Table ── */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.cardBorder}` }}>
                <h3 style={{ margin: 0, fontSize: 11, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Month-wise GST Summary (April → March)</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.012)' }}>
                {["Month", "Output GST", "Input ITC", "Net Payable"].map((h, i) => (
                  <p key={h} style={{ margin: 0, fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.09em', textAlign: i === 0 ? 'left' : 'right' }}>{h}</p>
                ))}
            </div>
            <div>
              {report.monthly_rows.map((row, idx) => (
                <div key={row.month_idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', alignItems: 'center', padding: '16px 20px', borderBottom: idx < 11 ? `1px solid ${C.cardBorder}` : 'none' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>{MONTH_NAMES[row.month_idx]}</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.tealLight, textAlign: 'right' }}>{formatCurrency(row.out_total_gst)}</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#93c5fd', textAlign: 'right' }}>{formatCurrency(row.in_total_gst)}</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: row.net_payable > 0 ? C.orange : C.muted, textAlign: 'right' }}>{formatCurrency(row.net_payable)}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', alignItems: 'center', padding: '16px 20px', borderTop: `2px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.03)' }}>
               <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: C.text, textTransform: 'uppercase' }}>Annual Total</p>
               <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: C.tealLight, textAlign: 'right' }}>{formatCurrency(report.out_total_gst)}</p>
               <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#60a5fa', textAlign: 'right' }}>{formatCurrency(report.in_total_gst)}</p>
               <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: report.net_payable > 0 ? C.orange : C.emerald, textAlign: 'right' }}>{formatCurrency(report.net_payable)}</p>
            </div>
          </div>

          {/* GSTR-9 Info */}
          <div style={{ display: 'flex', gap: 12, backgroundColor: C.indigoBg, border: `1px solid ${C.indigo}44`, borderRadius: 16, padding: 16 }}>
            <Info style={{ width: 18, height: 18, color: C.indigoLight, flexShrink: 0, marginTop: 2 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.text }}>About GSTR-9 (Annual Return)</p>
              <p style={{ margin: 0, fontSize: 13, color: '#a5b4fc' }}>• GSTR-9 is due by 31st December following the financial year end</p>
              <p style={{ margin: 0, fontSize: 13, color: '#a5b4fc' }}>• It consolidates all outward and inward supplies during the year</p>
              <p style={{ margin: 0, fontSize: 13, color: '#a5b4fc' }}>• Compute turnover and ITC from this report for Table 4, 5, 6, 7, 8 of GSTR-9</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ display: 'flex', gap: 12, backgroundColor: C.amberBg, border: `1px solid ${C.amber}44`, borderRadius: 16, padding: 16 }}>
             <AlertCircle style={{ width: 16, height: 16, color: '#fbbf24', flexShrink: 0, marginTop: 2 }} />
             <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#fbbf24' }}>
               <strong>Important Disclaimer:</strong> This annual GST summary is generated from data entered in ShelfCure. 
               It is for reference and preliminary computation only. Input Tax Credit must be verified against GSTR-2A/2B. 
               Sale/purchase values should be reconciled with your books of accounts. Final filing must be done at <strong>gst.gov.in</strong>.
             </p>
          </div>
        </>
      ) : (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 32px', gap: 14 }}>
           <ShieldCheck style={{ width: 26, height: 26, color: 'rgba(255,255,255,0.1)' }} />
           <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.muted }}>No GST data available for this year</p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
