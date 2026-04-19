"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Icons } from "@/components/Icons";
import { useTypewriter } from "@/components/HeroSection";

/* ═══════════════════════════════════════════════════════════
   INTERSECTION-OBSERVER HOOK
   ═══════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════
   INTERACTIVE TAB COMPONENT
   ═══════════════════════════════════════════════════════════ */
const featureCategories = [
  {
    id: "billing",
    label: "AI Billing",
    icon: "⚡",
    title: "Zero-Typing Invoice Extraction",
    desc: "Point your camera at any GST supplier invoice — our Gemini-powered OCR reads every line, splits CGST/SGST/IGST taxes, catches anomalies, maps HSN codes, and pushes items to inventory in seconds. No typing. No errors.",
    stats: [
      { label: "Extraction Accuracy", value: "99.8%" },
      { label: "Time per Invoice", value: "< 8s" },
      { label: "Fields Captured", value: "32+" },
    ],
    bullets: [
      "Automatic Discount Reconciliation",
      "HSN Code Cross-Verification",
      "Batch-wise Inventory Mapping",
      "Multi-page Invoice Support",
    ],
    mockUI: {
      header: "Invoice #GST-4829",
      subheader: "AI EXTRACTION IN PROGRESS",
      items: [
        { name: "Paracetamol 500mg", batch: "B284", status: "Extracted", color: "#10b981" },
        { name: "Amoxicillin 250mg", batch: "AX91", status: "Verified", color: "#6366f1" },
        { name: "Cetirizine 10mg", batch: "CT53", status: "Mapped", color: "#818cf8" },
      ],
      progress: 87,
    }
  },
  {
    id: "scanner",
    label: "Mobile Scanner",
    icon: "📱",
    title: "Wireless Edge Scanning",
    desc: "Turn any smartphone into a professional-grade barcode scanner. No additional hardware needed. High-speed WebSocket sync means your phone talks to your desktop in real-time — scan, search, bill in one seamless flow.",
    stats: [
      { label: "Sync Latency", value: "< 50ms" },
      { label: "Devices Supported", value: "5+" },
      { label: "Pairing Time", value: "2s" },
    ],
    bullets: [
      "QR-Code Instant Pairing",
      "Works on iOS & Android",
      "No App Installation Needed",
      "Offline Queue Support",
    ],
    mockUI: {
      header: "Scanner Active",
      subheader: "WEBSOCKET CONNECTED",
      items: [
        { name: "Crocin Advance 500mg", batch: "EAN-13", status: "Scanned", color: "#10b981" },
        { name: "Dolo 650mg", batch: "EAN-13", status: "Queued", color: "#f59e0b" },
        { name: "Pan 40mg", batch: "EAN-8", status: "Billing", color: "#6366f1" },
      ],
      progress: 100,
    }
  },
  {
    id: "inventory",
    label: "Smart Inventory",
    icon: "📦",
    title: "Intelligent Stock Management",
    desc: "AI analyzes your sales velocity, seasonality, and supplier lead times to predict exactly when you'll run low. Auto-generates purchase orders, tracks batch-wise expiry, and flags slow-moving stock before it becomes dead inventory.",
    stats: [
      { label: "Prediction Accuracy", value: "94%" },
      { label: "Waste Reduction", value: "40%" },
      { label: "Medicines Tracked", value: "50K+" },
    ],
    bullets: [
      "Auto Reorder Point Calculation",
      "Batch & Expiry Tracking",
      "Dead Stock Identification",
      "Supplier Performance Analytics",
    ],
    mockUI: {
      header: "Inventory Intelligence",
      subheader: "REORDER ANALYSIS",
      items: [
        { name: "Azithromycin 500mg", batch: "14 strips left", status: "Reorder", color: "#ef4444" },
        { name: "Metformin 500mg", batch: "248 strips", status: "Optimal", color: "#10b981" },
        { name: "Atorvastatin 10mg", batch: "89 strips", status: "Watch", color: "#f59e0b" },
      ],
      progress: 62,
    }
  },
  {
    id: "offline",
    label: "Offline-First",
    icon: "🛡️",
    title: "Offline-First Architecture",
    desc: "The internet shouldn't be a single point of failure. ShelfCure runs natively on your machine with embedded SQLite. Every sale, return, and adjustment is recorded locally first. Cloud syncs the moment connectivity returns.",
    stats: [
      { label: "Local Query Speed", value: "< 10ms" },
      { label: "Records Capacity", value: "100K+" },
      { label: "Sync Recovery", value: "Auto" },
    ],
    bullets: [
      "Embedded SQLite Engine",
      "Supabase Realtime Sync",
      "AES-256 Encrypted Backups",
      "Zero Data Loss Guarantee",
    ],
    mockUI: {
      header: "System Status",
      subheader: "ARCHITECTURE HEALTH",
      items: [
        { name: "Local Database", batch: "SQLite v3.42", status: "Active", color: "#10b981" },
        { name: "Cloud Sync", batch: "Supabase", status: "Synced", color: "#6366f1" },
        { name: "Encryption", batch: "AES-256", status: "Enabled", color: "#10b981" },
      ],
      progress: 100,
    }
  },
];

/* ═══════════════════════════════════════════════════════════
   MOUSE GLOW
   ═══════════════════════════════════════════════════════════ */
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

export default function FeaturesPage() {
  const hero = useInView(0.1);
  const showcase = useInView(0.1);
  const architecture = useInView(0.1);
  const bentoFeatures = useInView(0.1);
  const comparison = useInView(0.15);
  const workflow = useInView(0.15);
  const cta = useInView(0.3);

  /* Feature tab state */
  const [activeTab, setActiveTab] = useState(0);
  const activeFeature = featureCategories[activeTab];

  /* Auto-rotate tabs */
  const [autoRotate, setAutoRotate] = useState(true);
  useEffect(() => {
    if (!autoRotate || !showcase.inView) return;
    const timer = setInterval(() => {
      setActiveTab(prev => (prev + 1) % featureCategories.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoRotate, showcase.inView]);

  /* Animated stats */
  const statsSection = useInView(0.3);
  const s1 = useCounter(10, 1500, statsSection.inView, "x");
  const s2 = useCounter(99, 1500, statsSection.inView, ".8%");
  const s3 = useCounter(2500, 2000, statsSection.inView, "+");
  const s4 = useCounter(24, 1200, statsSection.inView, "/7");

  /* Title Typing Effect */
  const typingText = useTypewriter(["Unstoppable Pharmacies.", "Flawless Operations.", "Rapid Growth."], 80, 2200, 40);

  return (
    <div style={{ background: "var(--color-surface)", overflow: "hidden" }}>

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section
        ref={hero.ref}
        style={{
          paddingTop: "160px", paddingBottom: "4rem",
          position: "relative",
          background: "linear-gradient(180deg, #0c0a1f 0%, #110e2e 50%, #1a1640 100%)",
          color: "white", textAlign: "center", minHeight: "80vh",
          display: "flex", alignItems: "center",
        }}
      >
        {/* Grid background */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Animated orbs */}
        <div className="animate-float" style={{
          position: "absolute", top: "10%", left: "5%", width: "350px", height: "350px",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />
        <div className="animate-float" style={{
          position: "absolute", bottom: "5%", right: "8%", width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none", animationDelay: "3s",
        }} />

        {/* Sparkle dots */}
        {[
          { top: "20%", left: "15%", size: 4, delay: "0s" },
          { top: "35%", right: "12%", size: 6, delay: "1.5s" },
          { top: "65%", left: "25%", size: 5, delay: "2.5s" },
          { top: "45%", right: "30%", size: 3, delay: "0.8s" },
        ].map((dot, i) => (
          <div key={i} className="animate-pulse-glow" style={{
            position: "absolute", ...dot, width: dot.size, height: dot.size,
            borderRadius: "50%", background: "#818cf8", animationDelay: dot.delay,
          }} />
        ))}

        <MouseGlow />

        <div className="section-container" style={{ position: "relative", zIndex: 10 }}>
          <div
            className={hero.inView ? "animate-fade-in-up" : "opacity-0"}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.4rem 1rem",
              background: "rgba(99,102,241,0.1)", backdropFilter: "blur(12px)",
              borderRadius: "var(--radius-full)", border: "1px solid rgba(99,102,241,0.2)",
              marginBottom: "2rem",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#818cf8", boxShadow: "0 0 12px #818cf8" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Feature Deep-Dive
            </span>
          </div>

          <h1
            className={hero.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
            style={{
              fontSize: "clamp(2.5rem, 5vw, 5rem)", fontWeight: 800,
              lineHeight: 1.08, fontFamily: "var(--font-display)",
              color: "white",
              maxWidth: "950px", margin: "0 auto 1.5rem",
            }}
          >
            Engineered for{" "}
            <span style={{
              background: "linear-gradient(135deg, #818cf8, #c7d2fe, #a78bfa)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "gradient-shift 4s ease-in-out infinite",
            }}>
              {typingText}
              <span style={{
                display: "inline-block",
                width: "3px",
                height: "1em",
                background: "#818cf8",
                marginLeft: "4px",
                animation: "blink 1s step-end infinite",
                verticalAlign: "text-bottom",
              }} />
            </span>
          </h1>
          
          <p
            className={hero.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
            style={{
              fontSize: "1.2rem", color: "rgba(148, 163, 184, 0.9)",
              maxWidth: "700px", margin: "0 auto 3rem", lineHeight: 1.7,
            }}
          >
            Move beyond manual entries. ShelfCure combines Gemini AI, Offline-First architecture, 
            and mobile edge computing to give you a clinical-grade advantage.
          </p>

          {/* Scanning beam visual */}
          <div 
            className={hero.inView ? "animate-fade-in-up delay-300" : "opacity-0"}
            style={{
              position: "relative", height: "120px", width: "100%", maxWidth: "650px", margin: "0 auto",
              background: "rgba(255,255,255,0.02)", borderRadius: "1.5rem",
              border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden",
              backdropFilter: "blur(8px)",
            }}
          >
             <div style={{
               position: "absolute", left: 0, right: 0, height: "2px",
               background: "linear-gradient(90deg, transparent, #818cf8, transparent)",
               boxShadow: "0 0 20px #818cf8, 0 0 60px rgba(129,140,248,0.3)",
               animation: "scan-beam 3.5s linear infinite",
             }} />
             <div style={{
               display: "flex", alignItems: "center", justifyContent: "center",
               height: "100%", gap: "1.5rem", opacity: 0.4,
             }}>
                {[
                  { w: 60, h: 24 }, { w: 45, h: 16 }, { w: 55, h: 20 },
                  { w: 40, h: 14 }, { w: 70, h: 22 }, { w: 50, h: 18 },
                ].map((b, i) => (
                  <div key={i} style={{
                    width: b.w, height: b.h,
                    background: "rgba(129,140,248,0.15)",
                    border: "1px solid rgba(129,140,248,0.1)",
                    borderRadius: "4px",
                  }} />
                ))}
             </div>
          </div>

          {/* Scroll hint */}
          <div
            className={hero.inView ? "animate-fade-in-up delay-500" : "opacity-0"}
            style={{ marginTop: "3rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}
          >
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "rgba(148,163,184,0.4)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Explore features
            </span>
            <div style={{
              width: 24, height: 40, borderRadius: 12, border: "2px solid rgba(129,140,248,0.3)",
              display: "flex", justifyContent: "center", paddingTop: 8,
            }}>
              <div style={{ width: 3, height: 8, borderRadius: 3, background: "#818cf8", animation: "scroll-bounce 2s ease-in-out infinite" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS RIBBON ═══════════════ */}
      <section
        ref={statsSection.ref}
        style={{
          padding: "4rem 0",
          background: "linear-gradient(180deg, #1a1640 0%, #0c0a1f 40%, white 100%)",
        }}
      >
        <div className="section-container">
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem",
          }}>
            {[
              { value: s1, label: "Faster Billing", icon: "⚡", gradient: "linear-gradient(135deg, #6366f1, #818cf8)" },
              { value: s2, label: "AI Accuracy", icon: "🎯", gradient: "linear-gradient(135deg, #818cf8, #a5b4fc)" },
              { value: s3, label: "Pharmacies Trust Us", icon: "🏪", gradient: "linear-gradient(135deg, #a78bfa, #c4b5fd)" },
              { value: s4, label: "Support Available", icon: "🛠️", gradient: "linear-gradient(135deg, #7c3aed, #a78bfa)" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={statsSection.inView ? "animate-fade-in-up" : "opacity-0"}
                style={{
                  animationDelay: `${0.1 + i * 0.1}s`,
                  background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)",
                  border: "1px solid rgba(129,140,248,0.12)", borderRadius: "1.5rem",
                  padding: "2rem 1.5rem", textAlign: "center",
                  transition: "all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)", cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                  e.currentTarget.style.borderColor = "rgba(129,140,248,0.3)";
                  e.currentTarget.style.boxShadow = "0 20px 60px rgba(99,102,241,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.borderColor = "rgba(129,140,248,0.12)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{stat.icon}</div>
                <div style={{
                  fontSize: "2.25rem", fontWeight: 800, lineHeight: 1,
                  background: stat.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  fontFamily: "var(--font-display)", marginBottom: "0.4rem",
                }}>{stat.value}</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ INTERACTIVE FEATURE SHOWCASE ═══════════════ */}
      <section
        ref={showcase.ref}
        style={{ padding: "6rem 0 8rem", background: "white", position: "relative" }}
      >
        {/* Background dots */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px", pointerEvents: "none",
        }} />

        <div className="section-container" style={{ position: "relative" }}>
          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div
              className={showcase.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.4rem 1rem 0.4rem 0.5rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{
                background: "linear-gradient(135deg, #818cf8, #6366f1)", color: "white",
                borderRadius: "var(--radius-full)", width: 24, height: 24,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              </span>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Core Platform
              </span>
            </div>
            <h2
              className={showcase.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}
            >
              Four pillars of{" "}
              <span style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                pharmacy intelligence
              </span>
            </h2>
            <p
              className={showcase.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
              style={{ fontSize: "1.1rem", color: "#64748b", maxWidth: "600px", margin: "1.25rem auto 0", lineHeight: 1.7 }}
            >
              Click any feature to explore it in depth. Each one is designed to eliminate a critical pain point.
            </p>
          </div>

          {/* Tab bar */}
          <div
            className={showcase.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
            style={{
              display: "flex", justifyContent: "center", gap: "0.75rem",
              marginBottom: "3.5rem", flexWrap: "wrap",
            }}
          >
            {featureCategories.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => { setActiveTab(i); setAutoRotate(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "var(--radius-full)",
                  border: activeTab === i ? "2px solid #6366f1" : "2px solid rgba(0,0,0,0.06)",
                  background: activeTab === i ? "linear-gradient(135deg, #6366f1, #818cf8)" : "white",
                  color: activeTab === i ? "white" : "#475569",
                  fontWeight: 700, fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
                  boxShadow: activeTab === i ? "0 8px 24px rgba(99,102,241,0.25)" : "0 2px 8px rgba(0,0,0,0.04)",
                  transform: activeTab === i ? "translateY(-2px)" : "translateY(0)",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div
            key={activeTab}
            style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem",
              alignItems: "center",
              animation: "fadeInUp 0.5s cubic-bezier(0.25,0.46,0.45,0.94) forwards",
            }}
          >
            {/* Left content */}
            <div>
              <h3 style={{
                fontSize: "2rem", fontWeight: 700, color: "#1e293b",
                marginBottom: "1.25rem", lineHeight: 1.25,
              }}>{activeFeature.title}</h3>
              <p style={{
                color: "#64748b", fontSize: "1.05rem", lineHeight: 1.8,
                marginBottom: "2rem",
              }}>{activeFeature.desc}</p>

              {/* Mini stats row */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem", marginBottom: "2rem",
              }}>
                {activeFeature.stats.map(s => (
                  <div key={s.label} style={{
                    padding: "1rem",
                    background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
                    borderRadius: "1rem",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#6366f1", fontFamily: "var(--font-display)" }}>{s.value}</div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", marginTop: "0.25rem" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Bullet list */}
              <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.85rem" }}>
                {activeFeature.bullets.map((item, i) => (
                  <li key={item} style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    color: "#1e293b", fontWeight: 600, fontSize: "0.95rem",
                    animation: "fadeInUp 0.4s ease forwards",
                    animationDelay: `${0.1 + i * 0.08}s`,
                    opacity: 0,
                  }}>
                    <div style={{
                      width: 22, height: 22,
                      background: "linear-gradient(135deg, #6366f1, #818cf8)",
                      borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right mock UI */}
            <div style={{ position: "relative" }}>
              <div style={{
                background: "linear-gradient(135deg, #1e1b4b, #312e81)",
                borderRadius: "1.75rem", padding: "2rem",
                position: "relative", overflow: "hidden",
                boxShadow: "0 30px 60px rgba(30,27,75,0.3)",
              }}>
                {/* Ambient glow */}
                <div style={{
                  position: "absolute", top: "-40%", right: "-20%",
                  width: 300, height: 300, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(129,140,248,0.2) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", position: "relative", zIndex: 1 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: "linear-gradient(135deg, #818cf8, #6366f1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                  }}>{Icons.sparkle}</div>
                  <div>
                    <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {activeFeature.mockUI.subheader}
                    </div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "white" }}>
                      {activeFeature.mockUI.header}
                    </div>
                  </div>
                  <div style={{
                    marginLeft: "auto", padding: "0.2rem 0.6rem",
                    background: "rgba(16,185,129,0.15)", borderRadius: "var(--radius-full)",
                    fontSize: "0.6rem", fontWeight: 700, color: "#34d399",
                  }}>● Live</div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: "1.25rem", position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Processing</span>
                    <span style={{ fontSize: "0.65rem", color: "#a5b4fc", fontWeight: 700 }}>{activeFeature.mockUI.progress}%</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "var(--radius-full)", height: 6, overflow: "hidden" }}>
                    <div style={{
                      width: `${activeFeature.mockUI.progress}%`, height: "100%",
                      background: "linear-gradient(90deg, #818cf8, #6366f1)",
                      borderRadius: "var(--radius-full)",
                      transition: "width 0.8s cubic-bezier(0.25,0.46,0.45,0.94)",
                      boxShadow: "0 0 12px rgba(129,140,248,0.4)",
                    }} />
                  </div>
                </div>

                {/* Items */}
                <div style={{ display: "grid", gap: "0.5rem", position: "relative", zIndex: 1 }}>
                  {activeFeature.mockUI.items.map((item, i) => (
                    <div key={item.name} style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "0.75rem", padding: "0.75rem 1rem",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      animation: "fadeInUp 0.4s ease forwards",
                      animationDelay: `${0.15 + i * 0.12}s`,
                      opacity: 0,
                    }}>
                      <div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "white" }}>{item.name}</div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{item.batch}</div>
                      </div>
                      <span style={{
                        padding: "0.15rem 0.5rem", borderRadius: "var(--radius-full)",
                        fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase",
                        background: `${item.color}20`, color: item.color,
                      }}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badge */}
              <div className="animate-float" style={{
                position: "absolute", bottom: -16, left: -16,
                background: "white", padding: "0.6rem 1.1rem",
                borderRadius: "var(--radius-full)", boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 3,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "#e0e7ff", color: "#6366f1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1E293B" }}>AI Verified</span>
              </div>
            </div>
          </div>

          {/* Tab progress indicators */}
          <div style={{
            display: "flex", justifyContent: "center", gap: "0.5rem",
            marginTop: "3rem",
          }}>
            {featureCategories.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActiveTab(i); setAutoRotate(false); }}
                style={{
                  width: activeTab === i ? 32 : 8, height: 8,
                  borderRadius: "var(--radius-full)",
                  background: activeTab === i ? "linear-gradient(135deg, #6366f1, #818cf8)" : "rgba(99,102,241,0.15)",
                  border: "none", cursor: "pointer",
                  transition: "all 0.4s ease",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ BENTO GRID — MORE CAPABILITIES ═══════════════ */}
      <section
        ref={bentoFeatures.ref}
        style={{ padding: "7rem 0", background: "linear-gradient(180deg, #f8fafc, #eef2ff, #f8fafc)" }}
      >
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div
              className={bentoFeatures.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.9rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>Capabilities</span>
            </div>
            <h2
              className={bentoFeatures.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}
            >Everything else you need</h2>
          </div>

          <div className="bento-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "auto auto",
            gap: "1.5rem",
          }}>
            {/* Tall card */}
            <div
              className={bentoFeatures.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                gridRow: "span 2",
                background: "linear-gradient(180deg, #1e1b4b, #312e81)",
                padding: "2.5rem", borderRadius: "1.75rem",
                position: "relative", overflow: "hidden",
                color: "white",
                transition: "transform 0.4s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{
                position: "absolute", bottom: "-30%", right: "-20%", width: 250, height: 250,
                background: "radial-gradient(circle, rgba(129,140,248,0.2) 0%, transparent 70%)",
                borderRadius: "50%", pointerEvents: "none",
              }} />
              <div style={{ fontSize: "2.5rem", marginBottom: "1.25rem" }}>📈</div>
              <h4 style={{ fontWeight: 700, fontSize: "1.3rem", marginBottom: "0.75rem" }}>Advanced Analytics</h4>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "2rem" }}>
                Identify your most profitable medicines, peak billing hours, and seasonal trends with beautiful automated daily reports.
              </p>
              {/* Mini chart */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
                {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                  <div key={i} style={{
                    flex: 1, height: `${h}%`,
                    background: `linear-gradient(180deg, rgba(129,140,248,${0.4 + h / 200}) 0%, rgba(99,102,241,${0.2 + h / 300}) 100%)`,
                    borderRadius: "3px 3px 0 0",
                    animationName: bentoFeatures.inView ? "grow-bar" : "none",
                    animationDuration: "0.8s",
                    animationTimingFunction: "ease",
                    animationFillMode: "forwards",
                    animationDelay: `${0.3 + i * 0.06}s`,
                    transform: "scaleY(0)",
                    transformOrigin: "bottom",
                  }} />
                ))}
              </div>
            </div>

            {/* Wide card */}
            <div
              className={bentoFeatures.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{
                gridColumn: "span 2",
                background: "white", padding: "2.5rem", borderRadius: "1.5rem",
                border: "1px solid rgba(0,0,0,0.04)",
                display: "flex", alignItems: "center", gap: "2rem",
                transition: "all 0.3s ease", cursor: "default",
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(99,102,241,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.02)";
              }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: "1rem",
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2rem", flexShrink: 0,
                boxShadow: "0 8px 20px rgba(99,102,241,0.2)",
              }}>💊</div>
              <div>
                <h4 style={{ fontWeight: 700, fontSize: "1.2rem", color: "#0f172a", marginBottom: "0.5rem" }}>Smart Reorder Points</h4>
                <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.7 }}>
                  AI analyzes sales velocity, seasonality, and supplier lead times to predict when you&apos;ll run out — and auto-generates purchase orders.
                </p>
              </div>
            </div>

            {/* Two small cards */}
            {[
              {
                icon: "👥", title: "Patient Profiles",
                desc: "Track medication history, credit dues, and recurring prescriptions with full timeline.",
                gradient: "linear-gradient(135deg, #a78bfa, #8b5cf6)",
              },
              {
                icon: "🧾", title: "GST Compliance",
                desc: "Generate GSTR-1 ready reports in one click with verified HSN codes and tax splits.",
                gradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
              },
            ].map((card, i) => (
              <div
                key={card.title}
                className={bentoFeatures.inView ? "animate-fade-in-up" : "opacity-0"}
                style={{
                  animationDelay: `${0.2 + i * 0.1}s`,
                  background: "white", padding: "2.25rem", borderRadius: "1.5rem",
                  border: "1px solid rgba(0,0,0,0.04)",
                  position: "relative", overflow: "hidden",
                  transition: "all 0.3s ease", cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 16px 40px rgba(99,102,241,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 4,
                  background: card.gradient, borderRadius: "1.5rem 1.5rem 0 0",
                }} />
                <div style={{
                  width: 48, height: 48, borderRadius: "14px",
                  background: card.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem", marginBottom: "1rem",
                  boxShadow: "0 8px 20px rgba(99,102,241,0.15)",
                }}>{card.icon}</div>
                <h4 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f172a", marginBottom: "0.5rem" }}>{card.title}</h4>
                <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.65 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ WORKFLOW SECTION ═══════════════ */}
      <section
        ref={workflow.ref}
        style={{ padding: "7rem 0", background: "white" }}
      >
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div
              className={workflow.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.9rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>How It Works</span>
            </div>
            <h2
              className={workflow.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}
            >From install to first invoice in <span style={{ color: "#6366f1" }}>3 minutes</span></h2>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem",
            position: "relative",
          }}>
            {/* Connecting line */}
            <div style={{
              position: "absolute", top: "48px", left: "12.5%", right: "12.5%",
              height: "2px",
              background: "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.2), rgba(99,102,241,0.08))",
              zIndex: 0,
            }} />

            {[
              { step: "01", title: "Download & Install", desc: "One-click Windows installer. Under 100MB. No dependencies needed.", icon: "💻", color: "#6366f1" },
              { step: "02", title: "Configure GST", desc: "Enter your GSTIN. We auto-fetch your business details and set up tax rates.", icon: "⚙️", color: "#818cf8" },
              { step: "03", title: "Import Stock", desc: "Upload an Excel or scan supplier invoices. AI maps everything to your shelves.", icon: "📥", color: "#a78bfa" },
              { step: "04", title: "Start Billing", desc: "You're live. Search medicines, scan barcodes, print invoices. Done.", icon: "🚀", color: "#7c3aed" },
            ].map((item, i) => (
              <div
                key={item.step}
                className={workflow.inView ? "animate-fade-in-up" : "opacity-0"}
                style={{
                  animationDelay: `${0.15 + i * 0.15}s`,
                  textAlign: "center",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "white",
                  border: `3px solid ${item.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 1.5rem",
                  fontSize: "1.75rem",
                  boxShadow: `0 8px 24px ${item.color}25`,
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.15)";
                  e.currentTarget.style.boxShadow = `0 12px 32px ${item.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = `0 8px 24px ${item.color}25`;
                }}
                >{item.icon}</div>
                <div style={{
                  fontSize: "0.7rem", fontWeight: 800, color: item.color,
                  textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem",
                }}>Step {item.step}</div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>{item.title}</h4>
                <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ COMPARISON TABLE ═══════════════ */}
      <section
        ref={comparison.ref}
        style={{ padding: "7rem 0", background: "linear-gradient(180deg, #f8fafc, #eef2ff)" }}
      >
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div
              className={comparison.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.9rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>Why Switch</span>
            </div>
            <h2
              className={comparison.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}
            >ShelfCure vs. Traditional POS</h2>
          </div>

          <div
            className={comparison.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
            style={{
              maxWidth: "900px", margin: "0 auto",
              background: "white", borderRadius: "2rem",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.04)",
            }}
          >
            {/* Header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr",
              padding: "1.5rem 2rem",
              background: "linear-gradient(135deg, #1e1b4b, #312e81)",
              color: "white",
            }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.6)" }}>Feature</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1rem", fontWeight: 800 }}>ShelfCure</div>
                <div style={{ fontSize: "0.65rem", color: "#a5b4fc" }}>AI-Powered</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Others</div>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>Legacy POS</div>
              </div>
            </div>

            {/* Rows */}
            {[
              { feature: "Invoice Entry Method", ours: "AI Camera Scan", theirs: "Manual Typing" },
              { feature: "Barcode Scanner", ours: "Phone (Free)", theirs: "₹8,000+ Hardware" },
              { feature: "Works Offline", ours: "Yes — Full offline", theirs: "No" },
              { feature: "GST Auto-Split", ours: "CGST/SGST/IGST", theirs: "Manual calculation" },
              { feature: "Expiry Tracking", ours: "Auto batch alerts", theirs: "Manual sheets" },
              { feature: "Reorder Prediction", ours: "AI-Powered", theirs: "Not available" },
              { feature: "Monthly Cost", ours: "From ₹0/mo", theirs: "₹500–2000/mo" },
            ].map((row, i) => (
              <div key={row.feature} style={{
                display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr",
                padding: "1.25rem 2rem",
                borderBottom: "1px solid rgba(0,0,0,0.04)",
                background: i % 2 === 0 ? "white" : "#fafbff",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#eef2ff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafbff"; }}
              >
                <div style={{ fontWeight: 600, color: "#334155", fontSize: "0.9rem" }}>{row.feature}</div>
                <div style={{
                  textAlign: "center", fontWeight: 700, color: "#6366f1", fontSize: "0.85rem",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                }}>
                  <span style={{ width: 16, height: 16, background: "#dcfce7", color: "#15803d", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem" }}>✓</span>
                  {row.ours}
                </div>
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.85rem" }}>{row.theirs}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section
        ref={cta.ref}
        style={{ padding: "8rem 0", background: "white" }}
      >
        <div className="section-container">
          <div style={{
            background: "linear-gradient(135deg, #0c0a1f 0%, #1a1640 50%, #312e81 100%)",
            borderRadius: "3rem", padding: "5rem 3rem",
            textAlign: "center", position: "relative", overflow: "hidden",
          }}>
            {/* Animated orbs */}
            <div className="animate-float" style={{
              position: "absolute", top: "-50%", left: "-10%", width: 400, height: 400,
              background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", filter: "blur(60px)",
            }} />
            <div className="animate-float" style={{
              position: "absolute", bottom: "-40%", right: "-5%", width: 350, height: 350,
              background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", filter: "blur(50px)",
              animationDelay: "2s",
            }} />

            {/* Grid pattern */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, black 10%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, black 10%, transparent 70%)",
              pointerEvents: "none",
            }} />

            <div style={{ position: "relative", zIndex: 10 }}>
              <div
                className={cta.inView ? "animate-fade-in-up" : "opacity-0"}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.4rem 1rem",
                  background: "rgba(129,140,248,0.15)", borderRadius: "var(--radius-full)",
                  border: "1px solid rgba(129,140,248,0.2)", marginBottom: "2rem",
                }}
              >
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Ready to Transform?
                </span>
              </div>

              <h2
                className={cta.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 800, color: "white", marginBottom: "1.5rem", lineHeight: 1.1 }}
              >Stop the Busywork Today.</h2>
              <p
                className={cta.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
                style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto 3rem", lineHeight: 1.7 }}
              >
                Experience the pharmacy management software built for the next decade.
              </p>
              <div
                className={cta.inView ? "animate-fade-in-up delay-300" : "opacity-0"}
                style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}
              >
                <Link href="/download" className="btn-primary" style={{ padding: "1rem 2.5rem", fontSize: "1.05rem" }}>
                  Download Free
                </Link>
                <Link href="/contact" className="btn-secondary" style={{
                  padding: "1rem 2.5rem", color: "white",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}>
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes scan-beam {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes scroll-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(8px); opacity: 1; }
        }
        @keyframes grow-bar {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }

        @media (max-width: 900px) {
          .bento-grid {
            grid-template-columns: 1fr !important;
          }
          .bento-grid > div:first-child {
            grid-row: span 1 !important;
          }
          .bento-grid > div:nth-child(2) {
            grid-column: span 1 !important;
          }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1.5fr 1fr 1fr"] {
            grid-template-columns: 1.5fr 1fr 1fr !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
