"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Icons } from "@/components/Icons";
import { useTypewriter } from "@/components/HeroSection";

/* ═══ HOOKS ═══ */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.unobserve(node); } },
      { threshold }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCounter(end: number, duration: number, start: boolean, suffix = "") {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(eased * end));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, end, duration]);
  return `${value}${suffix}`;
}

/* ═══ MOUSE GLOW ═══ */
function MouseGlow() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const handleMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);
  return (
    <div ref={containerRef} onMouseMove={handleMove} style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "all" }}>
      <div style={{
        position: "absolute", left: pos.x - 200, top: pos.y - 200,
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)",
        transition: "left 0.3s ease, top 0.3s ease", pointerEvents: "none",
      }} />
    </div>
  );
}

/* ═══ FEATURE DATA — 7 CATEGORIES ═══ */
const featureCategories = [
  {
    id: "billing", label: "Smart Billing", icon: Icons.zap,
    problem: "Entering purchase bills takes 2–3 hours every single day",
    title: "Bill Faster. Never Type Again.",
    desc: "AI scans any purchase bill and auto-fills every field in under 8 seconds. The built-in database of 50,000+ medicines means HSN codes, batch numbers, MRP, and GST populate instantly. Scan barcodes with your phone or machine. Add favourites for one-tap repeat billing.",
    stats: [
      { label: "Invoice Scan Speed", value: "< 8s" },
      { label: "Medicine Database", value: "50K+" },
      { label: "Extraction Accuracy", value: "99.8%" },
    ],
    bullets: [
      "AI purchase bill scan — zero manual typing",
      "50,000+ medicine DB with full field auto-fill",
      "Phone barcode scanner — no extra hardware",
      "Machine barcode scanner support",
      "Favourite medicines for one-tap quick sale",
      "Customer's previous medicines shown at billing",
    ],
    mockUI: { header: "Invoice AI Extraction", subheader: "GEMINI AI PROCESSING", badge: "Invoice scanned in 6.2 seconds" },
    mockType: "billing",
  },
  {
    id: "inventory", label: "Inventory Control", icon: Icons.box,
    problem: "Expired stock and empty shelves cost you lakhs every year",
    title: "Never Run Out. Never Expire.",
    desc: "Track every batch and every expiry date automatically. Get alerts 30 days before medicines expire. Smart reorder points calculated from your real sales history. Generate challans instantly. Know exactly what's on your shelves at any moment.",
    stats: [
      { label: "Expiry Alert Lead", value: "30 days" },
      { label: "Waste Reduction", value: "40%" },
      { label: "Stock Accuracy", value: "100%" },
    ],
    bullets: [
      "Built-in 50K+ medicine DB for instant stock entry",
      "Batch-wise expiry tracking with advance alerts",
      "Stock summary with colour-coded low-stock view",
      "Smart reorder point calculation from sales data",
      "Challan generation for outgoing stock",
      "Dead stock and slow-moving item identification",
    ],
    mockUI: { header: "Stock Dashboard", subheader: "INVENTORY INTELLIGENCE", badge: "3 batches expiring in 30 days" },
    mockType: "inventory",
  },
  {
    id: "gst", label: "GST & Compliance", icon: Icons.fileText,
    problem: "GST filing takes days every month and wrong numbers mean penalties",
    title: "GST Done Right, Every Time.",
    desc: "Every sale, return, and purchase is automatically split into CGST, SGST, and IGST with verified HSN codes. Generate GSTR-1 ready reports with one click. Download your full annual GST summary as a PDF. No manual calculation. No errors. No penalties.",
    stats: [
      { label: "GST Split", value: "Auto" },
      { label: "HSN Verification", value: "100%" },
      { label: "Report Types", value: "5+" },
    ],
    bullets: [
      "GSTR-1 ready report generated in one click",
      "Automatic CGST / SGST / IGST split per sale",
      "HSN code auto-verified for every medicine",
      "Sales return GST automatically reversed",
      "Purchase return GST auto-adjusted",
      "Annual GST summary PDF download",
    ],
    mockUI: { header: "GST Compliance Report", subheader: "GSTR-1 READY", badge: "Annual GST PDF ready to download" },
    mockType: "gst",
  },
  {
    id: "reports", label: "Reports & Profit", icon: Icons.trendingUp,
    problem: "You don't actually know if your pharmacy made profit today",
    title: "Know Your Numbers, Every Day.",
    desc: "Every report a pharmacy needs — daily sales, profit & loss, expense analysis, stock valuation, expiry, sales return, and purchase return — all generated automatically. Download as PDF or Excel. Make decisions based on real data, not guesswork.",
    stats: [
      { label: "Report Types", value: "8+" },
      { label: "Auto-generation", value: "Daily" },
      { label: "Export Formats", value: "PDF + Excel" },
    ],
    bullets: [
      "Daily sales report — auto-generated every day",
      "Profit & Loss with gross and net margin",
      "Expense analysis with category breakdown",
      "Stock summary and valuation report",
      "Expiry report with batch-level details",
      "Sales return and purchase return reports",
    ],
    mockUI: { header: "Business Analytics", subheader: "PROFIT & SALES REPORT", badge: "Today's profit: ₹4,440 (+31%)" },
    mockType: "reports",
  },
  {
    id: "customer", label: "Customer & Credit", icon: Icons.users,
    problem: "Credit customers forget dues and regular patients wait too long",
    title: "Every Customer. Every Rupee. Tracked.",
    desc: "Complete profiles for every customer — their credit balance, their regular medicines, their full purchase history. Bill repeat customers in seconds using their saved medicine profiles. Track every rupee owed with a transparent credit ledger.",
    stats: [
      { label: "Customer Profiles", value: "Unlimited" },
      { label: "Credit Tracking", value: "Real-time" },
      { label: "History Retained", value: "Lifetime" },
    ],
    bullets: [
      "Complete customer management with profiles",
      "Credit ledger with outstanding due tracking",
      "Regular medicine profile per customer",
      "Bill repeat customers in seconds from profile",
      "Full previous purchase history at billing",
      "Customer-wise sales and credit analytics",
    ],
    mockUI: { header: "Customer Profile", subheader: "CREDIT & MEDICINE HISTORY", badge: "Regular medicines billed in 11 seconds" },
    mockType: "customer",
  },
  {
    id: "supplier", label: "Supplier Management", icon: Icons.store,
    problem: "Managing returns, challans, and reorders across 10+ suppliers is chaos",
    title: "Suppliers Organised. Returns Tracked.",
    desc: "Complete supplier profiles, full purchase history, purchase return management with records, challan generation, and reorder tracking — all in one place. Know exactly what you've bought from whom, what was returned, and what needs reordering.",
    stats: [
      { label: "Supplier Profiles", value: "Unlimited" },
      { label: "Challan Generation", value: "Instant" },
      { label: "Return Tracking", value: "Complete" },
    ],
    bullets: [
      "Supplier profiles with full purchase history",
      "Purchase return management with records",
      "Challan generation for all stock movements",
      "Reorder request tracking per supplier",
      "Supplier-wise purchase expense analysis",
      "Outstanding payment tracking per supplier",
    ],
    mockUI: { header: "Supplier Portal", subheader: "PURCHASE & RETURNS", badge: "Purchase return processed in 45 seconds" },
    mockType: "supplier",
  },
  {
    id: "promotions", label: "Promotions", icon: Icons.gift,
    problem: "Festival seasons pass without you running meaningful offers",
    title: "Turn Festivals Into Revenue.",
    desc: "Create offer promotions like Buy 2 Get 1 Free or flat discounts on medicine categories. Run festival campaigns for Diwali, Holi, or any occasion. Promotions apply automatically at billing. Track every use and every rupee they generate.",
    stats: [
      { label: "Promotion Types", value: "Offer + Festival" },
      { label: "Auto-apply", value: "At Billing" },
      { label: "Analytics", value: "Real-time" },
    ],
    bullets: [
      "Offer promotions (Buy X Get Y Free)",
      "Flat discount promotions by category",
      "Festival promotion campaigns with date range",
      "Auto-applied at billing — no manual discounting",
      "Usage count and revenue tracked per promotion",
      "Promotions stack correctly with regular pricing",
    ],
    mockUI: { header: "Active Promotions", subheader: "OFFERS & CAMPAIGNS", badge: "Diwali campaign generated ₹28,400" },
    mockType: "promotions",
  },
];

/* ═══ MOCK UI INNER CONTENT — per tab ═══ */
function BillingMock() {
  return (
    <>
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
          <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>AI Processing Invoice</span>
          <span style={{ fontSize: "0.65rem", color: "#a5b4fc", fontWeight: 700 }}>87%</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-full)", height: 6, overflow: "hidden" }}>
          <div style={{ width: "87%", height: "100%", background: "linear-gradient(90deg, #818cf8, #6366f1)", borderRadius: "var(--radius-full)", transformOrigin: "left", animation: "fill-bar 1s cubic-bezier(0.25,0.46,0.45,0.94) forwards", boxShadow: "0 0 10px rgba(129,140,248,0.4)" }} />
        </div>
      </div>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {[
          { name: "Paracetamol 500mg", sub: "Batch B284 · HSN 30049099 · GST 5%", status: "Extracted", color: "#10b981" },
          { name: "Amoxicillin 250mg", sub: "Batch AX91 · MRP ₹145/strip · 12%", status: "Verified", color: "#6366f1" },
          { name: "Cetirizine 10mg", sub: "Batch CT53 · Qty 200 strips · 12%", status: "Mapped", color: "#818cf8" },
        ].map((item, i) => (
          <div key={item.name} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem", padding: "0.65rem 0.875rem", display: "flex", alignItems: "center", justifyContent: "space-between", animation: "fadeInUp 0.4s ease forwards", animationDelay: `${0.1 + i * 0.12}s`, opacity: 0 }}>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "white" }}>{item.name}</div>
              <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{item.sub}</div>
            </div>
            <span style={{ padding: "0.15rem 0.5rem", borderRadius: "var(--radius-full)", fontSize: "0.6rem", fontWeight: 700, background: `${item.color}22`, color: item.color, flexShrink: 0, marginLeft: "0.5rem" }}>{item.status}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "0.875rem", padding: "0.55rem 0.875rem", background: "rgba(99,102,241,0.12)", borderRadius: "0.75rem", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", gap: "0.5rem", animation: "fadeInUp 0.4s ease 0.5s forwards", opacity: 0 }}>
        <span style={{ color: "#818cf8", display: "flex" }}>{Icons.phone}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#a5b4fc" }}>Phone Barcode Scanner Active</div>
          <div style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.35)" }}>Crocin 500mg · ₹45/strip · Added to bill</div>
        </div>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981", flexShrink: 0 }} />
      </div>
    </>
  );
}

function InventoryMock() {
  const items = [
    { name: "Paracetamol 500mg", stock: 92, left: "2,450 strips", status: "Optimal", color: "#10b981" },
    { name: "Azithromycin 500mg", stock: 14, left: "14 strips", status: "Reorder", color: "#ef4444" },
    { name: "Metformin 500mg", stock: 55, left: "248 strips", status: "Watch", color: "#f59e0b" },
  ];
  return (
    <>
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.625rem", padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", border: "1px solid rgba(255,255,255,0.06)" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>Search medicine or scan barcode...</span>
      </div>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {items.map((item, i) => (
          <div key={item.name} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem", padding: "0.65rem 0.875rem", animation: "fadeInUp 0.4s ease forwards", animationDelay: `${0.1 + i * 0.12}s`, opacity: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "white" }}>{item.name}</span>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "var(--radius-full)", background: `${item.color}22`, color: item.color }}>{item.status}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{ width: `${item.stock}%`, height: "100%", background: item.color, borderRadius: "var(--radius-full)", transformOrigin: "left", animation: `fill-bar 0.8s ease ${0.2 + i * 0.1}s forwards`, transform: "scaleX(0)" }} />
              </div>
              <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>{item.left}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "0.875rem", padding: "0.6rem 0.875rem", background: "rgba(239,68,68,0.1)", borderRadius: "0.75rem", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", gap: "0.5rem", animation: "fadeInUp 0.4s ease 0.5s forwards", opacity: 0 }}>
        <span style={{ color: "#ef4444", display: "flex" }}>{Icons.alertTriangle}</span>
        <div>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#fca5a5" }}>Expiry Alert — 3 Batches</div>
          <div style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.35)" }}>Azithromycin B-019, Cetirizine B-44, Metformin B-22 · expire in 30 days</div>
        </div>
      </div>
    </>
  );
}

function GSTMock() {
  const rows = [
    { rate: "GST 5%", taxable: "₹42,100", cgst: "₹1,052", sgst: "₹1,052", total: "₹2,104" },
    { rate: "GST 12%", taxable: "₹18,200", cgst: "₹1,092", sgst: "₹1,092", total: "₹2,184" },
    { rate: "GST 18%", taxable: "₹8,900", cgst: "₹801", sgst: "₹801", total: "₹1,602" },
  ];
  return (
    <>
      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "0.625rem", padding: "0.5rem 0.75rem", display: "flex", justifyContent: "space-between", marginBottom: "0.875rem" }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>April 2024 · GSTR-1 Report</span>
        <span style={{ fontSize: "0.6rem", color: "#10b981", fontWeight: 700 }}>● Verified</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "0.75rem", overflow: "hidden", marginBottom: "0.75rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", padding: "0.4rem 0.75rem", background: "rgba(99,102,241,0.15)" }}>
          {["Rate", "Taxable", "CGST", "Total Tax"].map(h => (
            <span key={h} style={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>
        {rows.map((row, i) => (
          <div key={row.rate} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", padding: "0.55rem 0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)", animation: "fadeInUp 0.4s ease forwards", animationDelay: `${0.1 + i * 0.1}s`, opacity: 0 }}>
            <span style={{ fontSize: "0.68rem", color: "#a5b4fc", fontWeight: 600 }}>{row.rate}</span>
            <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)" }}>{row.taxable}</span>
            <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)" }}>{row.cgst}</span>
            <span style={{ fontSize: "0.68rem", color: "white", fontWeight: 700 }}>{row.total}</span>
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", padding: "0.55rem 0.75rem", background: "rgba(99,102,241,0.12)", borderTop: "1px solid rgba(99,102,241,0.2)" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "white" }}>Total</span>
          <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)" }}>₹69,200</span>
          <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)" }}>₹2,945</span>
          <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#818cf8" }}>₹5,890</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", animation: "fadeInUp 0.4s ease 0.4s forwards", opacity: 0 }}>
        <button style={{ padding: "0.55rem", background: "linear-gradient(135deg, #6366f1, #818cf8)", borderRadius: "0.625rem", border: "none", color: "white", fontSize: "0.62rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
          <span style={{ display: "flex" }}>{Icons.download}</span> GSTR-1 PDF
        </button>
        <button style={{ padding: "0.55rem", background: "rgba(255,255,255,0.06)", borderRadius: "0.625rem", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: "0.62rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
          <span style={{ display: "flex" }}>{Icons.fileText}</span> Annual GST
        </button>
      </div>
    </>
  );
}

function ReportsMock() {
  const bars = [55, 72, 48, 88, 65, 94, 78];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <>
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "70px" }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", justifyContent: "flex-end" }}>
              <div style={{ width: "100%", height: `${h}%`, background: i === 5 ? "linear-gradient(180deg, #818cf8, #6366f1)" : "rgba(129,140,248,0.25)", borderRadius: "3px 3px 0 0", transformOrigin: "bottom", animation: "grow-bar 0.6s ease forwards", animationDelay: `${i * 0.07}s`, transform: "scaleY(0)" }} />
              <span style={{ fontSize: "0.48rem", color: "rgba(255,255,255,0.3)" }}>{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
        {[
          { label: "Revenue", value: "₹14,280", color: "#818cf8" },
          { label: "Profit", value: "₹4,440", color: "#10b981" },
          { label: "Returns", value: "₹320", color: "#f59e0b" },
        ].map((s, i) => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.625rem", padding: "0.6rem 0.5rem", textAlign: "center", animation: "fadeInUp 0.4s ease forwards", animationDelay: `${0.3 + i * 0.1}s`, opacity: 0 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: s.color, fontFamily: "var(--font-display)" }}>{s.value}</div>
            <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", animation: "fadeInUp 0.4s ease 0.6s forwards", opacity: 0 }}>
        {[
          { label: "Expenses Today", value: "₹850" },
          { label: "Stock Value", value: "₹3.2L" },
        ].map(item => (
          <div key={item.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.625rem", padding: "0.5rem 0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "white" }}>{item.value}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function CustomerMock() {
  return (
    <>
      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "0.875rem", padding: "0.875rem", marginBottom: "0.75rem", border: "1px solid rgba(255,255,255,0.08)", animation: "fadeInUp 0.4s ease 0.1s forwards", opacity: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><span style={{ transform: "scale(0.8)", display: "flex" }}>{Icons.user}</span></div>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "white" }}>Ramesh Kumar</div>
              <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.4)" }}>Customer since Jan 2023</div>
            </div>
          </div>
          <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "var(--radius-full)", background: "rgba(16,185,129,0.15)", color: "#34d399" }}>Regular</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(239,68,68,0.1)", borderRadius: "0.5rem", padding: "0.4rem 0.6rem" }}>
          <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)" }}>Credit Outstanding</span>
          <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#fca5a5" }}>₹2,400 due</span>
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.875rem", padding: "0.75rem", marginBottom: "0.5rem", border: "1px solid rgba(255,255,255,0.06)", animation: "fadeInUp 0.4s ease 0.25s forwards", opacity: 0 }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "0.5rem" }}>Regular Medicines</div>
        {[
          { name: "Metformin 500mg", freq: "Monthly · 2 strips" },
          { name: "Amlodipine 5mg", freq: "Monthly · 1 strip" },
        ].map((med, i) => (
          <div key={med.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.3rem 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ color: "#818cf8", display: "flex", transform: "scale(0.7)" }}>{Icons.pill}</span>
              <span style={{ fontSize: "0.68rem", color: "white", fontWeight: 600 }}>{med.name}</span>
            </div>
            <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.35)" }}>{med.freq}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", animation: "fadeInUp 0.4s ease 0.4s forwards", opacity: 0 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: "0.625rem", padding: "0.45rem 0.6rem", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)" }}>Last Purchase</div>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "white" }}>15 Mar · ₹890</div>
        </div>
        <button style={{ flex: 1, background: "linear-gradient(135deg, #6366f1, #818cf8)", borderRadius: "0.625rem", border: "none", color: "white", fontSize: "0.62rem", fontWeight: 700, cursor: "pointer" }}>Quick Bill</button>
      </div>
    </>
  );
}

function SupplierMock() {
  const suppliers = [
    { name: "Pharma Distributors", last: "₹45,200", status: "Active", statusColor: "#10b981", tag: "Challan Ready", tagColor: "#818cf8" },
    { name: "MedCo Suppliers", last: "₹18,400", status: "Pending", statusColor: "#f59e0b", tag: "2 Returns", tagColor: "#ef4444" },
    { name: "City Pharma Co.", last: "₹32,100", status: "Active", statusColor: "#10b981", tag: "Reorder Sent", tagColor: "#6366f1" },
  ];
  return (
    <>
      <div style={{ display: "grid", gap: "0.5rem", marginBottom: "0.75rem" }}>
        {suppliers.map((s, i) => (
          <div key={s.name} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem", padding: "0.65rem 0.875rem", animation: "fadeInUp 0.4s ease forwards", animationDelay: `${0.1 + i * 0.12}s`, opacity: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "white" }}>{s.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.statusColor }} />
                <span style={{ fontSize: "0.55rem", color: s.statusColor, fontWeight: 600 }}>{s.status}</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.35)" }}>Last: {s.last}</span>
              <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: "var(--radius-full)", background: `${s.tagColor}22`, color: s.tagColor }}>{s.tag}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: "0.65rem 0.875rem", background: "rgba(99,102,241,0.12)", borderRadius: "0.75rem", border: "1px solid rgba(99,102,241,0.2)", animation: "fadeInUp 0.4s ease 0.5s forwards", opacity: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#a5b4fc" }}>Purchase Return · MedCo</div>
            <div style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.35)" }}>2 items · ₹1,840 credit note generated</div>
          </div>
          <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.15)", padding: "0.1rem 0.4rem", borderRadius: "var(--radius-full)" }}>Processed</span>
        </div>
      </div>
    </>
  );
}

function PromotionsMock() {
  return (
    <>
      {[
        {
          type: "Festival", name: "Diwali Special Offer", desc: "10% off on all Vitamins & Supplements",
          valid: "1–30 Nov", uses: 847, maxUses: 1000, revenue: "₹28,400",
          accent: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)",
          delay: "0.1s",
        },
        {
          type: "Offer", name: "Buy 2 Get 1 Free", desc: "On all OTC & general medicines",
          valid: "Ongoing", uses: 312, maxUses: 500, revenue: "₹9,240",
          accent: "#818cf8", bg: "rgba(129,140,248,0.1)", border: "rgba(129,140,248,0.2)",
          delay: "0.25s",
        },
      ].map((promo) => (
        <div key={promo.name} style={{ background: promo.bg, border: `1px solid ${promo.border}`, borderRadius: "0.875rem", padding: "0.875rem", marginBottom: "0.75rem", animation: "fadeInUp 0.4s ease forwards", animationDelay: promo.delay, opacity: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
            <div>
              <span style={{ fontSize: "0.55rem", fontWeight: 700, color: promo.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>{promo.type}</span>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "white", marginTop: 2 }}>{promo.name}</div>
              <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{promo.desc}</div>
            </div>
            <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.15)", padding: "0.15rem 0.4rem", borderRadius: "var(--radius-full)", flexShrink: 0, marginLeft: "0.5rem" }}>Active</span>
          </div>
          <div style={{ marginTop: "0.6rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)" }}>Used {promo.uses}/{promo.maxUses} times</span>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: promo.accent }}>{promo.revenue} revenue</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
              <div style={{ width: `${(promo.uses / promo.maxUses) * 100}%`, height: "100%", background: promo.accent, borderRadius: "var(--radius-full)", transformOrigin: "left", animation: "fill-bar 0.8s ease 0.3s forwards", transform: "scaleX(0)" }} />
            </div>
          </div>
        </div>
      ))}
      <div style={{ padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: "0.625rem", border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center", animation: "fadeInUp 0.4s ease 0.45s forwards", opacity: 0 }}>
        <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>+ Create New Promotion</span>
      </div>
    </>
  );
}

function TabMockUI({ mockType }: { mockType: string }) {
  if (mockType === "billing") return <BillingMock />;
  if (mockType === "inventory") return <InventoryMock />;
  if (mockType === "gst") return <GSTMock />;
  if (mockType === "reports") return <ReportsMock />;
  if (mockType === "customer") return <CustomerMock />;
  if (mockType === "supplier") return <SupplierMock />;
  if (mockType === "promotions") return <PromotionsMock />;
  return null;
}

/* ═══ PAGE ═══ */
export default function FeaturesPage() {
  const hero = useInView(0.1);
  const showcase = useInView(0.1);
  const allFeatures = useInView(0.1);
  const comparison = useInView(0.15);
  const workflow = useInView(0.15);
  const cta = useInView(0.3);

  const [activeTab, setActiveTab] = useState(0);
  const activeFeature = featureCategories[activeTab];
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    if (!autoRotate || !showcase.inView) return;
    const timer = setInterval(() => {
      setActiveTab(prev => (prev + 1) % featureCategories.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoRotate, showcase.inView]);

  const statsSection = useInView(0.3);
  const s1 = useCounter(10, 1500, statsSection.inView, "x");
  const s2 = useCounter(99, 1500, statsSection.inView, ".8%");
  const s3 = useCounter(2500, 2000, statsSection.inView, "+");
  const s4 = useCounter(24, 1200, statsSection.inView, "/7");

  const typingText = useTypewriter(["Unstoppable Pharmacies.", "Flawless Operations.", "Rapid Growth."], 80, 2200, 40);

  return (
    <div style={{ background: "var(--color-surface)", overflow: "hidden" }}>

      {/* ═══ HERO ═══ */}
      <section
        ref={hero.ref}
        style={{ paddingTop: "160px", paddingBottom: "4rem", position: "relative", background: "linear-gradient(180deg, #0c0a1f 0%, #110e2e 50%, #1a1640 100%)", color: "white", textAlign: "center", minHeight: "80vh", display: "flex", alignItems: "center" }}
      >
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 70%)", pointerEvents: "none" }} />
        <div className="animate-float" style={{ position: "absolute", top: "10%", left: "5%", width: "350px", height: "350px", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
        <div className="animate-float" style={{ position: "absolute", bottom: "5%", right: "8%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none", animationDelay: "3s" }} />
        <MouseGlow />
        <div className="section-container" style={{ position: "relative", zIndex: 10 }}>
          <div className={hero.inView ? "animate-fade-in-up" : "opacity-0"} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", background: "rgba(99,102,241,0.1)", backdropFilter: "blur(12px)", borderRadius: "var(--radius-full)", border: "1px solid rgba(99,102,241,0.2)", marginBottom: "2rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 12px #818cf8" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Complete Feature Tour</span>
          </div>
          <h1 className={hero.inView ? "animate-fade-in-up delay-100" : "opacity-0"} style={{ fontSize: "clamp(2.5rem, 5vw, 5rem)", fontWeight: 800, lineHeight: 1.08, fontFamily: "var(--font-display)", color: "white", maxWidth: "950px", margin: "0 auto 1.5rem" }}>
            Built for{" "}
            <span style={{ background: "linear-gradient(135deg, #818cf8, #c7d2fe, #a78bfa)", backgroundSize: "200% 200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "gradient-shift 4s ease-in-out infinite" }}>
              {typingText}
              <span style={{ display: "inline-block", width: "3px", height: "1em", background: "#818cf8", marginLeft: "4px", animation: "blink 1s step-end infinite", verticalAlign: "text-bottom" }} />
            </span>
          </h1>
          <p className={hero.inView ? "animate-fade-in-up delay-200" : "opacity-0"} style={{ fontSize: "1.2rem", color: "rgba(148,163,184,0.9)", maxWidth: "700px", margin: "0 auto 3rem", lineHeight: 1.7 }}>
            Every tool your pharmacy needs — AI billing, inventory control, GST reports, customer credit, supplier management, and promotions — all in one offline-first software.
          </p>
          <div className={hero.inView ? "animate-fade-in-up delay-300" : "opacity-0"} style={{ position: "relative", height: "120px", width: "100%", maxWidth: "650px", margin: "0 auto", background: "rgba(255,255,255,0.02)", borderRadius: "1.5rem", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", backdropFilter: "blur(8px)" }}>
            <div style={{ position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, #818cf8, transparent)", boxShadow: "0 0 20px #818cf8, 0 0 60px rgba(129,140,248,0.3)", animation: "scan-beam 3.5s linear infinite" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "1.5rem", opacity: 0.4 }}>
              {[{ w: 60, h: 24 }, { w: 45, h: 16 }, { w: 55, h: 20 }, { w: 40, h: 14 }, { w: 70, h: 22 }, { w: 50, h: 18 }].map((b, i) => (
                <div key={i} style={{ width: b.w, height: b.h, background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.1)", borderRadius: "4px" }} />
              ))}
            </div>
          </div>
          <div className={hero.inView ? "animate-fade-in-up delay-500" : "opacity-0"} style={{ marginTop: "3rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "rgba(148,163,184,0.4)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Explore 7 feature areas</span>
            <div style={{ width: 24, height: 40, borderRadius: 12, border: "2px solid rgba(129,140,248,0.3)", display: "flex", justifyContent: "center", paddingTop: 8 }}>
              <div style={{ width: 3, height: 8, borderRadius: 3, background: "#818cf8", animation: "scroll-bounce 2s ease-in-out infinite" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS RIBBON ═══ */}
      <section ref={statsSection.ref} style={{ padding: "4rem 0", background: "linear-gradient(180deg, #1a1640 0%, #0c0a1f 40%, white 100%)" }}>
        <div className="section-container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}>
            {[
              { value: s1, label: "Faster Billing", icon: Icons.zap, gradient: "linear-gradient(135deg, #6366f1, #818cf8)" },
              { value: s2, label: "AI Accuracy", icon: Icons.target, gradient: "linear-gradient(135deg, #818cf8, #a5b4fc)" },
              { value: s3, label: "Pharmacies Trust Us", icon: Icons.store, gradient: "linear-gradient(135deg, #a78bfa, #c4b5fd)" },
              { value: s4, label: "Support Available", icon: Icons.tool, gradient: "linear-gradient(135deg, #7c3aed, #a78bfa)" },
            ].map((stat, i) => (
              <div key={stat.label} className={statsSection.inView ? "animate-fade-in-up" : "opacity-0"} style={{ animationDelay: `${0.1 + i * 0.1}s`, background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(129,140,248,0.12)", borderRadius: "1.5rem", padding: "2rem 1.5rem", textAlign: "center", transition: "all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-8px) scale(1.02)"; e.currentTarget.style.borderColor = "rgba(129,140,248,0.3)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(99,102,241,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.borderColor = "rgba(129,140,248,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ color: "rgba(255,255,255,0.85)", marginBottom: "0.75rem", display: "flex", justifyContent: "center", transform: "scale(1.3)" }}>{stat.icon}</div>
                <div style={{ fontSize: "2.25rem", fontWeight: 800, lineHeight: 1, background: stat.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "var(--font-display)", marginBottom: "0.4rem" }}>{stat.value}</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 7-TAB FEATURE SHOWCASE ═══ */}
      <section ref={showcase.ref} style={{ padding: "3.5rem 0 4rem", background: "white", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.03) 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" }} />
        <div className="section-container" style={{ position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div className={showcase.inView ? "animate-fade-in-up" : "opacity-0"} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem 0.4rem 0.5rem", background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)", marginBottom: "1.25rem" }}>
              <span style={{ background: "linear-gradient(135deg, #818cf8, #6366f1)", color: "white", borderRadius: "var(--radius-full)", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              </span>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>7 Feature Areas</span>
            </div>
            <h2 className={showcase.inView ? "animate-fade-in-up delay-100" : "opacity-0"} style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
              Everything your pharmacy needs,{" "}
              <span style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>in one place</span>
            </h2>
            <p className={showcase.inView ? "animate-fade-in-up delay-200" : "opacity-0"} style={{ fontSize: "1.1rem", color: "#64748b", maxWidth: "600px", margin: "1.25rem auto 0", lineHeight: 1.7 }}>
              Click any tab to see how each feature solves a real problem you face every day.
            </p>
          </div>

          {/* Tab bar — scrollable on mobile */}
          <div className={showcase.inView ? "animate-fade-in-up delay-200" : "opacity-0"} style={{ overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "3.5rem" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", minWidth: "max-content", margin: "0 auto" }}>
              {featureCategories.map((cat, i) => (
                <button key={cat.id} onClick={() => { setActiveTab(i); setAutoRotate(false); }} style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.65rem 1.25rem", borderRadius: "var(--radius-full)", border: activeTab === i ? "2px solid #6366f1" : "2px solid rgba(0,0,0,0.06)", background: activeTab === i ? "linear-gradient(135deg, #6366f1, #818cf8)" : "white", color: activeTab === i ? "white" : "#475569", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.3s cubic-bezier(0.25,0.46,0.45,0.94)", boxShadow: activeTab === i ? "0 8px 24px rgba(99,102,241,0.25)" : "0 2px 8px rgba(0,0,0,0.04)", transform: activeTab === i ? "translateY(-2px)" : "translateY(0)", whiteSpace: "nowrap" }}>
                  <span style={{ display: "flex" }}>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div key={activeTab} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center", animation: "fadeInUp 0.5s cubic-bezier(0.25,0.46,0.45,0.94) forwards" }}>
            {/* Left — text */}
            <div>
              {/* Problem callout */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.875rem", background: "rgba(239,68,68,0.06)", borderRadius: "var(--radius-full)", border: "1px solid rgba(239,68,68,0.15)", marginBottom: "1.25rem" }}>
                <span style={{ color: "#ef4444", display: "flex", transform: "scale(0.8)" }}>{Icons.alertTriangle}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#dc2626" }}>{activeFeature.problem}</span>
              </div>

              <h3 style={{ fontSize: "2rem", fontWeight: 700, color: "#1e293b", marginBottom: "1.25rem", lineHeight: 1.25 }}>{activeFeature.title}</h3>
              <p style={{ color: "#64748b", fontSize: "1.05rem", lineHeight: 1.8, marginBottom: "2rem" }}>{activeFeature.desc}</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
                {activeFeature.stats.map(s => (
                  <div key={s.label} style={{ padding: "1rem", background: "linear-gradient(135deg, #f8fafc, #eef2ff)", borderRadius: "1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#6366f1", fontFamily: "var(--font-display)" }}>{s.value}</div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", marginTop: "0.25rem" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.85rem" }}>
                {activeFeature.bullets.map((item, i) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#1e293b", fontWeight: 600, fontSize: "0.95rem", animation: "fadeInUp 0.4s ease forwards", animationDelay: `${0.1 + i * 0.07}s`, opacity: 0 }}>
                    <div style={{ width: 22, height: 22, background: "linear-gradient(135deg, #6366f1, #818cf8)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — mock UI */}
            <div style={{ position: "relative" }}>
              <div style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", borderRadius: "1.75rem", padding: "2rem", position: "relative", overflow: "hidden", boxShadow: "0 30px 60px rgba(30,27,75,0.3)" }}>
                <div style={{ position: "absolute", top: "-40%", right: "-20%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(129,140,248,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", position: "relative", zIndex: 1 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #818cf8, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>{Icons.sparkle}</div>
                  <div>
                    <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{activeFeature.mockUI.subheader}</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "white" }}>{activeFeature.mockUI.header}</div>
                  </div>
                  <div style={{ marginLeft: "auto", padding: "0.2rem 0.6rem", background: "rgba(16,185,129,0.15)", borderRadius: "var(--radius-full)", fontSize: "0.6rem", fontWeight: 700, color: "#34d399" }}>● Live</div>
                </div>
                {/* Custom mock content */}
                <div style={{ position: "relative", zIndex: 1 }}>
                  <TabMockUI mockType={activeFeature.mockType} />
                </div>
              </div>
              {/* Floating badge */}
              <div className="animate-float" style={{ position: "absolute", bottom: -16, left: -16, background: "white", padding: "0.6rem 1.1rem", borderRadius: "var(--radius-full)", boxShadow: "0 10px 30px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 3 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#e0e7ff", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1E293B" }}>{activeFeature.mockUI.badge}</span>
              </div>
            </div>
          </div>

          {/* Dot indicators */}
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "3rem" }}>
            {featureCategories.map((_, i) => (
              <button key={i} onClick={() => { setActiveTab(i); setAutoRotate(false); }} style={{ width: activeTab === i ? 32 : 8, height: 8, borderRadius: "var(--radius-full)", background: activeTab === i ? "linear-gradient(135deg, #6366f1, #818cf8)" : "rgba(99,102,241,0.15)", border: "none", cursor: "pointer", transition: "all 0.4s ease" }} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ALL FEATURES AT A GLANCE ═══ */}
      <section ref={allFeatures.ref} style={{ padding: "4rem 0", background: "linear-gradient(180deg, #f8fafc, #eef2ff, #f8fafc)" }}>
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div className={allFeatures.inView ? "animate-fade-in-up" : "opacity-0"} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.9rem", background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>Complete List</span>
            </div>
            <h2 className={allFeatures.inView ? "animate-fade-in-up delay-100" : "opacity-0"} style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}>All features at a glance</h2>
            <p className={allFeatures.inView ? "animate-fade-in-up delay-200" : "opacity-0"} style={{ fontSize: "1rem", color: "#64748b", marginTop: "0.75rem" }}>Everything included — no hidden add-ons.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
            {featureCategories.map((cat, ci) => (
              <div key={cat.id} className={allFeatures.inView ? "animate-fade-in-up" : "opacity-0"} style={{ animationDelay: `${0.05 + ci * 0.07}s`, background: "white", borderRadius: "1.5rem", padding: "1.75rem", border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", transition: "all 0.3s ease", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(99,102,241,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.02)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "0.75rem", background: "linear-gradient(135deg, #6366f1, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>{cat.icon}</div>
                  <h4 style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>{cat.label}</h4>
                </div>
                <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.6rem" }}>
                  {cat.bullets.map(b => (
                    <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.82rem", color: "#475569", lineHeight: 1.5 }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1rem" }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WORKFLOW ═══ */}
      <section ref={workflow.ref} style={{ padding: "4rem 0", background: "white" }}>
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div className={workflow.inView ? "animate-fade-in-up" : "opacity-0"} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.9rem", background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>How It Works</span>
            </div>
            <h2 className={workflow.inView ? "animate-fade-in-up delay-100" : "opacity-0"} style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}>From install to first invoice in <span style={{ color: "#6366f1" }}>3 minutes</span></h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", position: "relative" }}>
            <div style={{ position: "absolute", top: "48px", left: "12.5%", right: "12.5%", height: "2px", background: "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.2), rgba(99,102,241,0.08))", zIndex: 0 }} />
            {[
              { step: "01", title: "Download & Install", desc: "One-click Windows installer. Under 100MB. No dependencies needed.", icon: Icons.laptop, color: "#6366f1" },
              { step: "02", title: "Configure GST", desc: "Enter your GSTIN. Business details and tax rates set up automatically.", icon: Icons.settings, color: "#818cf8" },
              { step: "03", title: "Import Stock", desc: "Upload an Excel or scan supplier invoices. AI maps everything instantly.", icon: Icons.inbox, color: "#a78bfa" },
              { step: "04", title: "Start Billing", desc: "You're live. Search, scan barcodes, print invoices. Full pharmacy in minutes.", icon: Icons.rocket, color: "#7c3aed" },
            ].map((item, i) => (
              <div key={item.step} className={workflow.inView ? "animate-fade-in-up" : "opacity-0"} style={{ animationDelay: `${0.15 + i * 0.15}s`, textAlign: "center", position: "relative", zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "white", border: `3px solid ${item.color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", color: item.color, boxShadow: `0 8px 24px ${item.color}25`, transition: "all 0.3s ease", cursor: "default" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.15)"; e.currentTarget.style.boxShadow = `0 12px 32px ${item.color}40`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 8px 24px ${item.color}25`; }}
                >{item.icon}</div>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: item.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Step {item.step}</div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>{item.title}</h4>
                <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ═══ */}
      <section ref={comparison.ref} style={{ padding: "4rem 0", background: "linear-gradient(180deg, #f8fafc, #eef2ff)" }}>
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div className={comparison.inView ? "animate-fade-in-up" : "opacity-0"} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.9rem", background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>Why Switch</span>
            </div>
            <h2 className={comparison.inView ? "animate-fade-in-up delay-100" : "opacity-0"} style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}>ShelfCure vs. Traditional POS</h2>
          </div>
          <div className={comparison.inView ? "animate-fade-in-up delay-200" : "opacity-0"} style={{ maxWidth: "900px", margin: "0 auto", background: "white", borderRadius: "2rem", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", padding: "1.5rem 2rem", background: "linear-gradient(135deg, #1e1b4b, #312e81)", color: "white" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.6)" }}>Feature</div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: "1rem", fontWeight: 800 }}>ShelfCure</div><div style={{ fontSize: "0.65rem", color: "#a5b4fc" }}>AI-Powered</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Others</div><div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>Legacy POS</div></div>
            </div>
            {[
              { feature: "Invoice Entry", ours: "AI Camera Scan (< 8s)", theirs: "Manual typing (hours)" },
              { feature: "Medicine Database", ours: "50,000+ auto-fill", theirs: "Manual entry every time" },
              { feature: "Barcode Scanner", ours: "Phone — free", theirs: "₹8,000+ hardware" },
              { feature: "GST Reports", ours: "GSTR-1 in one click", theirs: "Manual calculation" },
              { feature: "Annual GST PDF", ours: "Download anytime", theirs: "Accountant dependency" },
              { feature: "Expiry Tracking", ours: "Auto batch alerts", theirs: "Manual shelf checks" },
              { feature: "Customer Credit", ours: "Live ledger + alerts", theirs: "Notebook or Excel" },
              { feature: "Regular Medicine Profiles", ours: "Per customer, auto-bill", theirs: "Not available" },
              { feature: "Promotions", ours: "Festival + offer types", theirs: "Manual discounting" },
              { feature: "Works Offline", ours: "100% — always", theirs: "No" },
              { feature: "Reorder & Challan", ours: "Built-in, instant", theirs: "Manual, error-prone" },
              { feature: "Monthly Cost", ours: "From ₹0/mo", theirs: "₹500–2,000/mo" },
            ].map((row, i) => (
              <div key={row.feature} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", padding: "1.1rem 2rem", borderBottom: "1px solid rgba(0,0,0,0.04)", background: i % 2 === 0 ? "white" : "#fafbff", transition: "background 0.2s ease" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#eef2ff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafbff"; }}
              >
                <div style={{ fontWeight: 600, color: "#334155", fontSize: "0.88rem" }}>{row.feature}</div>
                <div style={{ textAlign: "center", fontWeight: 700, color: "#6366f1", fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                  <span style={{ width: 16, height: 16, background: "#dcfce7", color: "#15803d", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  {row.ours}
                </div>
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{row.theirs}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section ref={cta.ref} style={{ padding: "3rem 0", background: "white" }}>
        <div className="section-container">
          <div style={{ background: "linear-gradient(135deg, #0c0a1f 0%, #1a1640 50%, #312e81 100%)", borderRadius: "3rem", padding: "3.5rem 3rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div className="animate-float" style={{ position: "absolute", top: "-50%", left: "-10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />
            <div className="animate-float" style={{ position: "absolute", bottom: "-40%", right: "-5%", width: 350, height: 350, background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", filter: "blur(50px)", animationDelay: "2s" }} />
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px", maskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, black 10%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, black 10%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 10 }}>
              <div className={cta.inView ? "animate-fade-in-up" : "opacity-0"} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", background: "rgba(129,140,248,0.15)", borderRadius: "var(--radius-full)", border: "1px solid rgba(129,140,248,0.2)", marginBottom: "2rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.1em" }}>Ready to Transform?</span>
              </div>
              <h2 className={cta.inView ? "animate-fade-in-up delay-100" : "opacity-0"} style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 800, color: "white", marginBottom: "1.5rem", lineHeight: 1.1 }}>Stop the Busywork Today.</h2>
              <p className={cta.inView ? "animate-fade-in-up delay-200" : "opacity-0"} style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto 3rem", lineHeight: 1.7 }}>
                Download free and see every feature working in your pharmacy today.
              </p>
              <div className={cta.inView ? "animate-fade-in-up delay-300" : "opacity-0"} style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
                <Link href="/download" className="btn-primary" style={{ padding: "1rem 2.5rem", fontSize: "1.05rem" }}>Download Free</Link>
                <Link href="/contact" className="btn-secondary" style={{ padding: "1rem 2.5rem", color: "white", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>Contact Sales</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes gradient-shift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes scan-beam { 0% { top: 0; } 100% { top: 100%; } }
        @keyframes scroll-bounce { 0%, 100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(8px); opacity: 1; } }
        @keyframes grow-bar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes fill-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 1024px) {
          div[style*="grid-template-columns: repeat(3, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; gap: 3rem !important; }
          div[style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1.5fr 1fr 1fr"] { font-size: 0.75rem !important; }
        }
      `}</style>
    </div>
  );
}
