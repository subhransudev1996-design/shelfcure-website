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
function useCounter(end: number, duration: number, start: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      setValue(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, end, duration]);
  return value;
}

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

/* ═══════════════════════════════════════════════════════════
   DOWNLOAD PROGRESS SIMULATION
   ═══════════════════════════════════════════════════════════ */
function DownloadButton({ platform, icon, ext, size, color, featured }: {
  platform: string; icon: string; ext: string; size: string; color: string; featured?: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!downloading) return;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDone(true);
          setDownloading(false);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [downloading]);

  const handleClick = () => {
    if (done || downloading) return;
    setDownloading(true);
    setProgress(0);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        width: "100%", padding: done ? "0.85rem 1.5rem" : "0.85rem 1.5rem",
        borderRadius: "var(--radius-full)",
        border: featured ? "none" : `2px solid ${done ? "#10b981" : "#e2e8f0"}`,
        background: done
          ? "linear-gradient(135deg, #10b981, #34d399)"
          : featured
            ? "linear-gradient(135deg, #6366f1, #818cf8)"
            : "white",
        color: featured || done ? "white" : "#1e293b",
        fontWeight: 700, fontSize: "0.95rem",
        cursor: done ? "default" : "pointer",
        transition: "all 0.3s ease",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
        position: "relative", overflow: "hidden",
        boxShadow: featured ? "0 8px 24px rgba(99,102,241,0.25)" : "none",
      }}
    >
      {/* Progress fill */}
      {downloading && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${Math.min(progress, 100)}%`,
          background: featured
            ? "rgba(255,255,255,0.2)"
            : "rgba(99,102,241,0.08)",
          transition: "width 0.2s ease",
          borderRadius: "var(--radius-full)",
        }} />
      )}
      <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {done ? (
          <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Downloaded</>
        ) : downloading ? (
          <>{Math.min(Math.floor(progress), 100)}% Downloading...</>
        ) : (
          <>
            {Icons.download}
            Download {ext}
          </>
        )}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHANGELOG DATA
   ═══════════════════════════════════════════════════════════ */
const changelog = [
  { version: "2.4.0", date: "April 2025", tag: "latest", items: ["Gemini 2.0 AI engine upgrade", "Multi-page invoice scanning", "Smart reorder predictions", "Performance: 40% faster startup"] },
  { version: "2.3.2", date: "March 2025", tag: null, items: ["WhatsApp delivery status tracking", "Batch-wise expiry alerts", "GSTR-1 export improvements"] },
  { version: "2.3.0", date: "February 2025", tag: null, items: ["Mobile scanner v2 with offline queue", "Patient profile timeline", "Dark mode support"] },
];

export default function DownloadPage() {
  const hero = useInView(0.1);
  const platforms = useInView(0.1);
  const stats = useInView(0.15);
  const mobile = useInView(0.1);
  const setup = useInView(0.15);
  const changelogSection = useInView(0.1);
  const requirements = useInView(0.1);
  const cta = useInView(0.3);

  /* Animated counters */
  const downloads = useCounter(48000, 2000, stats.inView);
  const rating = useCounter(49, 1500, stats.inView);
  const size = useCounter(84, 1200, stats.inView);

  /* Title Typing Effect */
  const typingText = useTypewriter(["pharmacy deserves.", "staff will love.", "business needs."], 80, 2200, 40);

  return (
    <div style={{ background: "var(--color-surface)", overflow: "hidden" }}>

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section
        ref={hero.ref}
        className="dl-hero-section"
        style={{
          paddingTop: "160px", paddingBottom: "5rem",
          position: "relative",
          background: "linear-gradient(180deg, #0c0a1f 0%, #110e2e 50%, #1a1640 100%)",
          color: "white", textAlign: "center",
        }}
      >
        {/* Grid bg */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Orbs */}
        <div className="animate-float" style={{
          position: "absolute", top: "5%", left: "10%", width: 300, height: 300,
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />
        <div className="animate-float" style={{
          position: "absolute", bottom: "10%", right: "5%", width: 350, height: 350,
          background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none", animationDelay: "3s",
        }} />

        <MouseGlow />

        <div className="section-container" style={{ position: "relative", zIndex: 10 }}>
          {/* Badge */}
          <div
            className={hero.inView ? "animate-fade-in-up" : "opacity-0"}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.6rem",
              padding: "0.4rem 1rem",
              background: "rgba(99,102,241,0.1)", backdropFilter: "blur(12px)",
              borderRadius: "var(--radius-full)", border: "1px solid rgba(99,102,241,0.2)",
              marginBottom: "2rem",
            }}
          >
            <span style={{
              padding: "0.15rem 0.5rem", borderRadius: "var(--radius-full)",
              background: "linear-gradient(135deg, #10b981, #34d399)",
              fontSize: "0.6rem", fontWeight: 800, color: "white",
            }}>NEW</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Version 2.4.0 — Now Available
            </span>
          </div>

          <h1
            className={hero.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 800,
              lineHeight: 1.08, fontFamily: "var(--font-display)",
              color: "white",
              maxWidth: "850px", margin: "0 auto 1.5rem",
            }}
          >
            The software your{" "}
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
              fontSize: "1.2rem", color: "rgba(148,163,184,0.9)",
              maxWidth: "600px", margin: "0 auto 3rem", lineHeight: 1.7,
            }}
          >
            Download ShelfCure Desktop for AI billing, offline-first reliability, and lightning-fast POS. Free 7-day trial, no credit card needed.
          </p>

          {/* Quick download */}
          <div
            className={hero.inView ? "animate-fade-in-up delay-300" : "opacity-0"}
            style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}
          >
            <button
              className="btn-primary"
              style={{
                padding: "1.1rem 2.5rem", fontSize: "1.1rem",
                display: "flex", alignItems: "center", gap: "0.6rem",
              }}
            >
              {Icons.download}
              Download for Windows
            </button>
          </div>

          {/* Quick info */}
          <div
            className={`dl-quick-info ${hero.inView ? "animate-fade-in-up delay-500" : "opacity-0"}`}
            style={{
              display: "flex", justifyContent: "center", gap: "2rem", marginTop: "2rem", flexWrap: "wrap",
            }}
          >
            {[
              { label: "v2.4.0", icon: Icons.box },
              { label: "84 MB", icon: Icons.hardDrive },
              { label: "Windows 10+", icon: Icons.windows },
              { label: "Free Trial", icon: Icons.gift },
            ].map(item => (
              <div key={item.label} style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                fontSize: "0.8rem", color: "rgba(148,163,184,0.6)", fontWeight: 600,
              }}>
                <span style={{ display: "flex" }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ DOWNLOAD STATS ═══════════════ */}
      <section
        ref={stats.ref}
        style={{
          padding: "4rem 0",
          background: "linear-gradient(180deg, #1a1640 0%, white 100%)",
        }}
      >
        <div className="section-container">
          <div className="dl-stats-grid">
            {[
              { value: `${downloads.toLocaleString()}+`, label: "Total Downloads", icon: Icons.inbox },
              { value: `${(rating / 10).toFixed(1)} ★`, label: "User Rating", icon: Icons.star },
              { value: `${size} MB`, label: "Installer Size", icon: Icons.hardDrive },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={stats.inView ? "animate-fade-in-up" : "opacity-0"}
                style={{
                  animationDelay: `${0.1 + i * 0.1}s`,
                  background: "rgba(255,255,255,0.06)", backdropFilter: "blur(16px)",
                  border: "1px solid rgba(129,140,248,0.12)", borderRadius: "1.5rem",
                  padding: "1.75rem", textAlign: "center",
                  transition: "all 0.4s ease", cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.borderColor = "rgba(129,140,248,0.3)";
                  e.currentTarget.style.boxShadow = "0 16px 40px rgba(99,102,241,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(129,140,248,0.12)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ color: "rgba(255,255,255,0.85)", marginBottom: "0.5rem", display: "flex", justifyContent: "center" }}>{stat.icon}</div>
                <div style={{
                  fontSize: "1.75rem", fontWeight: 800, color: "white",
                  fontFamily: "var(--font-display)",
                }}>{stat.value}</div>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ WINDOWS DOWNLOAD ═══════════════ */}
      <section
        id="platforms"
        ref={platforms.ref}
        style={{ padding: "3rem 0", background: "white" }}
      >
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div
              className={platforms.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.9rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>Windows Desktop App</span>
            </div>
            <h2
              className={platforms.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}
            >Download for Windows</h2>
          </div>

          {/* Single Windows Card */}
          <div
            className={platforms.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
            style={{
              maxWidth: "620px", margin: "0 auto",
              padding: "3rem",
              borderRadius: "2.5rem",
              background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
              border: "2px solid rgba(99,102,241,0.15)",
              boxShadow: "0 24px 60px rgba(99,102,241,0.08)",
              position: "relative", overflow: "hidden",
              transition: "all 0.4s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 30px 70px rgba(99,102,241,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 24px 60px rgba(99,102,241,0.08)"; }}
          >
            {/* Top accent bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 4,
              background: "linear-gradient(90deg, #6366f1, #818cf8, #a78bfa)",
            }} />

            <div className="dl-win-header">
              {/* Windows icon */}
              <div style={{
                width: 90, height: 90, borderRadius: "1.5rem",
                background: "linear-gradient(135deg, #0078d4, #00a4ef)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", flexShrink: 0,
                boxShadow: "0 8px 24px rgba(0,120,212,0.2)",
              }}><div style={{ transform: "scale(2)" }}>{Icons.windows}</div></div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>ShelfCure for Windows</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>v2.4.0</span>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1" }} />
                  <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>84 MB</span>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#cbd5e1" }} />
                  <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>.exe installer</span>
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="dl-details-grid">
              {[
                { label: "Architecture", value: "x64 / ARM64" },
                { label: "Requires", value: "Windows 10 or later" },
                { label: "Framework", value: "Tauri 2.0 (Rust)" },
                { label: "License", value: "7-day Free Trial" },
              ].map(d => (
                <div key={d.label} style={{
                  padding: "0.75rem 1rem", background: "rgba(255,255,255,0.7)",
                  borderRadius: "0.75rem", border: "1px solid rgba(0,0,0,0.04)",
                }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{d.label}</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b", marginTop: "0.15rem" }}>{d.value}</div>
                </div>
              ))}
            </div>

            {/* Download button */}
            <DownloadButton
              platform="Windows"
              icon="🪟"
              ext=".exe"
              size="84 MB"
              color="#00a4ef"
              featured={true}
            />
          </div>

          {/* Trust badges */}
          <div
            className={platforms.inView ? "animate-fade-in-up delay-300" : "opacity-0"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "2rem",
              marginTop: "2.5rem", flexWrap: "wrap",
            }}
          >
            {[
              { icon: Icons.shield, text: "Digitally Signed" },
              { icon: Icons.check, text: "SHA-256 Verified" },
              { icon: Icons.zap, text: "Auto-Update Built In" },
            ].map(item => (
              <div key={item.text} style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600,
              }}>
                <div style={{ color: "#6366f1" }}>{item.icon}</div>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SETUP STEPS ═══════════════ */}
      <section
        ref={setup.ref}
        style={{ padding: "4rem 0", background: "linear-gradient(180deg, #f8fafc, #eef2ff, #f8fafc)" }}
      >
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div
              className={setup.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.9rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>Installation</span>
            </div>
            <h2
              className={setup.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}
            >Up and running in <span style={{ color: "#6366f1" }}>3 minutes</span></h2>
          </div>

          <div className="dl-setup-grid">
            {/* Connecting line */}
            <div className="dl-setup-line" style={{
              position: "absolute", top: 52, left: "12.5%", right: "12.5%", height: 2,
              background: "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.2), rgba(99,102,241,0.08))",
              zIndex: 0,
            }} />

            {[
              { step: "01", title: "Download", desc: "Click download above. The installer is under 100MB.", icon: Icons.inbox, color: "#6366f1" },
              { step: "02", title: "Install", desc: "Run the installer. No admin rights needed. Takes 30 seconds.", icon: Icons.zap, color: "#818cf8" },
              { step: "03", title: "Configure", desc: "Enter your GSTIN. We auto-fetch your business details.", icon: Icons.settings, color: "#a78bfa" },
              { step: "04", title: "Start Billing", desc: "You're live! Scan invoices, bill customers, grow.", icon: Icons.rocket, color: "#7c3aed" },
            ].map((item, i) => (
              <div
                key={item.step}
                className={setup.inView ? "animate-fade-in-up" : "opacity-0"}
                style={{
                  animationDelay: `${0.15 + i * 0.12}s`,
                  textAlign: "center", position: "relative", zIndex: 1,
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "white", border: `3px solid ${item.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 1.5rem", color: item.color,
                  boxShadow: `0 8px 24px ${item.color}25`,
                  transition: "all 0.3s ease", cursor: "default",
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
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: item.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                  Step {item.step}
                </div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>{item.title}</h4>
                <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ MOBILE COMPANION ═══════════════ */}
      <section
        ref={mobile.ref}
        style={{ padding: "4rem 0", background: "white" }}
      >
        <div className="section-container">
          <div className="dl-mobile-layout">
            {/* Left: Phone Mockup */}
            <div className={mobile.inView ? "animate-fade-in-up" : "opacity-0"}>
              <div style={{
                position: "relative", display: "flex", justifyContent: "center",
                padding: "3rem",
              }}>
                {/* Background ring */}
                <div style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                  width: 340, height: 340, borderRadius: "50%",
                  border: "1px solid rgba(99,102,241,0.1)",
                }} />
                <div style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                  width: 440, height: 440, borderRadius: "50%",
                  border: "1px dashed rgba(99,102,241,0.06)",
                }} />

                {/* Phone */}
                <div style={{
                  width: 220, height: 440, background: "linear-gradient(180deg, #1e1b4b, #312e81)",
                  borderRadius: "2.5rem", border: "6px solid #e2e8f0",
                  boxShadow: "0 30px 60px rgba(30,27,75,0.25), 0 0 0 1px rgba(255,255,255,0.1) inset",
                  position: "relative", zIndex: 2, overflow: "hidden",
                }}>
                  {/* Notch */}
                  <div style={{
                    width: 80, height: 24, background: "#e2e8f0", borderRadius: "0 0 16px 16px",
                    margin: "0 auto", position: "relative", zIndex: 3,
                  }} />

                  {/* Scanner area */}
                  <div style={{ height: "45%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {/* Scan line */}
                    <div style={{
                      position: "absolute", left: "15%", right: "15%", height: 2,
                      background: "linear-gradient(90deg, transparent, #818cf8, transparent)",
                      boxShadow: "0 0 20px #818cf8",
                      animation: "scan-line-phone 2.5s ease-in-out infinite",
                    }} />
                    {/* Corners */}
                    {[
                      { top: "15%", left: "15%" },
                      { top: "15%", right: "15%" },
                      { bottom: "15%", left: "15%" },
                      { bottom: "15%", right: "15%" },
                    ].map((pos, i) => (
                      <div key={i} style={{
                        position: "absolute", ...pos, width: 24, height: 24,
                        borderColor: "rgba(129,140,248,0.5)", borderStyle: "solid", borderWidth: 0,
                        ...(i === 0 ? { borderTopWidth: 3, borderLeftWidth: 3, borderRadius: "8px 0 0 0" } :
                           i === 1 ? { borderTopWidth: 3, borderRightWidth: 3, borderRadius: "0 8px 0 0" } :
                           i === 2 ? { borderBottomWidth: 3, borderLeftWidth: 3, borderRadius: "0 0 0 8px" } :
                           { borderBottomWidth: 3, borderRightWidth: 3, borderRadius: "0 0 8px 0" }),
                      }} />
                    ))}
                  </div>

                  {/* Result area */}
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <div style={{
                      background: "rgba(255,255,255,0.06)", borderRadius: "0.75rem",
                      padding: "0.75rem", border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                      <div style={{ fontSize: "0.6rem", color: "#818cf8", fontWeight: 800, marginBottom: "0.4rem" }}>SCANNED ITEM</div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "white" }}>Crocin Advance</div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginTop: "0.2rem" }}>500mg · 1 Strip · ₹42.00</div>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                      marginTop: "0.75rem",
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                      <span style={{ fontSize: "0.6rem", color: "#34d399", fontWeight: 700 }}>Synced to Desktop</span>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="animate-float" style={{
                  position: "absolute", top: "12%", right: "5%",
                  background: "white", padding: "0.5rem 0.8rem",
                  borderRadius: "var(--radius-full)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  zIndex: 3,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#1e293b" }}>Connected</span>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className={mobile.inView ? "animate-fade-in-up delay-200" : "opacity-0"}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.9rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
              }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Companion App
                </span>
              </div>
              <h2 style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "1.5rem", lineHeight: 1.2 }}>
                The Mobile Scanner
              </h2>
              <p style={{ color: "#64748b", fontSize: "1.1rem", lineHeight: 1.7, marginBottom: "2rem" }}>
                Turn any smartphone into a wireless barcode scanner. Connects to your desktop via QR code pairing. No extra hardware needed.
              </p>

              {/* Feature pills */}
              <div className="dl-feature-pills">
                {[
                  { title: "< 50ms Sync", desc: "Real-time WebSocket" },
                  { title: "QR Pairing", desc: "Connect in 2 seconds" },
                  { title: "iOS & Android", desc: "Universal support" },
                  { title: "Offline Queue", desc: "Never lose a scan" },
                ].map(f => (
                  <div key={f.title} style={{
                    padding: "1rem", background: "#f8fafc", borderRadius: "1rem",
                    border: "1px solid rgba(0,0,0,0.04)",
                    transition: "all 0.3s ease", cursor: "default",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#eef2ff"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.04)"; }}
                  >
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.9rem" }}>{f.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>{f.desc}</div>
                  </div>
                ))}
              </div>

              {/* Store buttons */}
              <div className="dl-store-btns">
                {[
                  { store: "App Store", sub: "Download on the", icon: Icons.apple },
                  { store: "Google Play", sub: "Get it on", icon: Icons.playTriangle },
                ].map(s => (
                  <div key={s.store} style={{
                    padding: "0.75rem 1.5rem", background: "#0f172a", borderRadius: "0.75rem",
                    display: "flex", alignItems: "center", gap: "0.75rem", color: "white",
                    cursor: "pointer", transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ display: "flex", color: "white" }}>{s.icon}</div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: "0.55rem", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>{s.sub}</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>{s.store}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CHANGELOG ═══════════════ */}
      <section
        ref={changelogSection.ref}
        style={{ padding: "4rem 0", background: "#f8fafc" }}
      >
        <div className="section-container" style={{ maxWidth: "800px" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div
              className={changelogSection.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.9rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>What&apos;s New</span>
            </div>
            <h2
              className={changelogSection.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}
            >Release History</h2>
          </div>

          <div style={{ display: "grid", gap: "1.5rem" }}>
            {changelog.map((release, ri) => (
              <div
                key={release.version}
                className={changelogSection.inView ? "animate-fade-in-up" : "opacity-0"}
                style={{
                  animationDelay: `${0.15 + ri * 0.1}s`,
                  background: "white", borderRadius: "1.5rem",
                  border: ri === 0 ? "2px solid rgba(99,102,241,0.15)" : "1px solid rgba(0,0,0,0.04)",
                  padding: "2rem",
                  boxShadow: ri === 0 ? "0 16px 40px rgba(99,102,241,0.06)" : "none",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", fontFamily: "var(--font-display)" }}>v{release.version}</span>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500 }}>{release.date}</span>
                  {release.tag && (
                    <span style={{
                      marginLeft: "auto",
                      padding: "0.2rem 0.6rem", borderRadius: "var(--radius-full)",
                      background: "linear-gradient(135deg, #6366f1, #818cf8)",
                      color: "white", fontSize: "0.6rem", fontWeight: 800,
                      textTransform: "uppercase",
                    }}>{release.tag}</span>
                  )}
                </div>
                <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.6rem" }}>
                  {release.items.map(item => (
                    <li key={item} style={{
                      display: "flex", alignItems: "center", gap: "0.6rem",
                      fontSize: "0.9rem", color: "#475569",
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: ri === 0 ? "#6366f1" : "#cbd5e1",
                        flexShrink: 0,
                      }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SYSTEM REQUIREMENTS ═══════════════ */}
      <section
        ref={requirements.ref}
        style={{ padding: "4rem 0", background: "white" }}
      >
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div
              className={requirements.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.9rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>Requirements</span>
            </div>
            <h2
              className={requirements.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}
            >System Requirements</h2>
          </div>

          <div className="dl-req-grid">
            {[
              { title: "Processor", desc: "Intel i3 / Apple M1 or equivalent", icon: Icons.cpu, value: "Dual Core" },
              { title: "Memory", desc: "4GB minimum, 8GB recommended", icon: Icons.database, value: "4GB+" },
              { title: "Storage", desc: "500MB for app + local database", icon: Icons.hardDrive, value: "500MB" },
              { title: "Display", desc: "1280×720 minimum resolution", icon: Icons.monitor, value: "720p" },
            ].map((item, i) => (
              <div
                key={item.title}
                className={requirements.inView ? "animate-fade-in-up" : "opacity-0"}
                style={{
                  animationDelay: `${0.1 + i * 0.1}s`,
                  padding: "2rem 1.5rem", textAlign: "center",
                  background: "#f8fafc", borderRadius: "1.5rem",
                  border: "1px solid rgba(0,0,0,0.04)",
                  transition: "all 0.3s ease", cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 12px 30px rgba(99,102,241,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ color: "#6366f1", marginBottom: "0.75rem", display: "flex", justifyContent: "center", transform: "scale(1.35)" }}>{item.icon}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#6366f1", fontFamily: "var(--font-display)", marginBottom: "0.25rem" }}>{item.value}</div>
                <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>{item.title}</h4>
                <p style={{ color: "#94a3b8", fontSize: "0.8rem", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section
        ref={cta.ref}
        style={{ padding: "3.5rem 0 4rem", background: "#f8fafc" }}
      >
        <div className="section-container">
          <div className="dl-cta-inner">
            {/* Orbs */}
            <div className="animate-float" style={{
              position: "absolute", top: "-50%", left: "-10%", width: 400, height: 400,
              background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", filter: "blur(60px)",
            }} />
            <div className="animate-float" style={{
              position: "absolute", bottom: "-40%", right: "-5%", width: 350, height: 350,
              background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", filter: "blur(50px)",
              animationDelay: "2s",
            }} />

            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, black 10%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, black 10%, transparent 70%)",
              pointerEvents: "none",
            }} />

            <div style={{ position: "relative", zIndex: 10 }}>
              <h2
                className={cta.inView ? "animate-fade-in-up" : "opacity-0"}
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "white", marginBottom: "1.5rem", lineHeight: 1.15 }}
              >Need help installing?</h2>
              <p
                className={cta.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
                style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.15rem", maxWidth: "600px", margin: "0 auto 3rem", lineHeight: 1.7 }}
              >
                Our support team is available 24/7 to help you migrate data and get your pharmacy running.
              </p>
              <div
                className={cta.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
                style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}
              >
                <Link href="/contact" className="btn-primary" style={{ padding: "1rem 2.5rem", fontSize: "1.05rem" }}>
                  Get Support
                </Link>
                <Link href="/features" className="btn-secondary" style={{
                  padding: "1rem 2.5rem", color: "white",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}>
                  Explore Features
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
        @keyframes scan-line-phone {
          0%, 100% { top: 20%; }
          50% { top: 70%; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; } 50% { opacity: 0; }
        }

        /* ── BASE LAYOUTS ── */
        .dl-stats-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem; max-width: 700px; margin: 0 auto;
        }
        .dl-win-header { display: flex; align-items: center; gap: 2rem; }
        .dl-details-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1rem; margin: 2rem 0;
        }
        .dl-setup-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem; position: relative;
        }
        .dl-mobile-layout {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 5rem; align-items: center;
        }
        .dl-feature-pills {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1rem; margin-bottom: 2.5rem;
        }
        .dl-store-btns { display: flex; gap: 1rem; flex-wrap: wrap; }
        .dl-req-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem; max-width: 900px; margin: 0 auto;
        }
        .dl-cta-inner {
          background: linear-gradient(135deg, #0c0a1f 0%, #1a1640 50%, #312e81 100%);
          border-radius: 3rem; padding: 5rem 3rem;
          text-align: center; position: relative; overflow: hidden;
        }
        .dl-quick-info { gap: 2rem; }
        .dl-win-icon { width: 90px; height: 90px; flex-shrink: 0; }

        /* ════════════ TABLET (≤900px) ════════════ */
        @media (max-width: 900px) {
          .dl-mobile-layout {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .dl-setup-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .dl-setup-line { display: none; }
          .dl-req-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        /* ════════════ MOBILE (≤768px) ════════════ */
        @media (max-width: 768px) {
          .dl-hero-section {
            padding-top: 110px !important;
            padding-bottom: 3rem !important;
          }
          .dl-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .dl-win-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
          }
          .dl-details-grid {
            grid-template-columns: 1fr !important;
          }
          .dl-quick-info { gap: 1rem !important; }
          .dl-cta-inner {
            padding: 3rem 1.5rem !important;
            border-radius: 1.75rem !important;
          }
          .dl-store-btns { flex-direction: column !important; }
        }

        /* ════════════ SMALL MOBILE (≤640px) ════════════ */
        @media (max-width: 640px) {
          .dl-hero-section {
            padding-top: 90px !important;
          }
          .dl-setup-grid {
            grid-template-columns: 1fr !important;
          }
          .dl-req-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .dl-feature-pills {
            grid-template-columns: 1fr !important;
          }
          .dl-stats-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.75rem !important;
          }
          .dl-cta-inner {
            padding: 2.5rem 1.25rem !important;
          }
        }

        /* ════════════ XS (≤400px) ════════════ */
        @media (max-width: 400px) {
          .dl-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .dl-req-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
