"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/Icons";

/* ═══════════════════════════════════════════════════════════
   INTERSECTION-OBSERVER HOOK  — reveal-on-scroll
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

export default function Home() {
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Reveal sections */
  const hero = useInView(0.1);
  const why = useInView();
  const features = useInView();
  const stats = useInView();
  const steps = useInView();
  const pricing = useInView();
  const faq = useInView();
  const cta = useInView();
  const video = useInView();
  const mission = useInView(0.3);
  const featuresGrid = useInView(0.2);
  const integrations = useInView(0.2);

  return (
    <>
      {/* ───────────────────── NAVIGATION ───────────────────── */}
      <nav
        className="glass"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transition: "all 0.35s ease",
          borderBottom: scrolled ? "1px solid rgba(65,73,66,0.08)" : "none",
          ...(scrolled
            ? { boxShadow: "0px 2px 8px rgba(20,30,21,0.03), 0px 6px 20px rgba(20,30,21,0.05)" }
            : {}),
        }}
      >
        <div className="section-container" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "72px",
        }}>
          {/* Logo */}
          <a href="#" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
            <Image
              src="/logo.png"
              alt="ShelfCure"
              width={140}
              height={36}
              style={{ height: "36px", width: "auto", objectFit: "contain" }}
              priority
            />
          </a>

          {/* Desktop Links */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "2.5rem",
          }}
            className="nav-desktop"
          >
            {[
              { label: "Features", href: "/features" },
              { label: "Pricing", href: "/pricing" },
              { label: "FAQ", href: "/pricing#faq" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--color-on-surface-variant)",
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-on-surface-variant)")}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="nav-desktop">
            <a href="#pricing" className="btn-tertiary" style={{ padding: "0.625rem 1.25rem", fontSize: "0.875rem" }}>
              Log in
            </a>
            <a href="#cta" className="btn-primary" style={{ padding: "0.625rem 1.5rem", fontSize: "0.875rem" }}>
              Get Started
            </a>
          </div>

          {/* Mobile Toggle */}
          <button
            className="nav-mobile-toggle"
            onClick={() => setMobileNav(!mobileNav)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-on-surface)", display: "none" }}
            aria-label="Toggle navigation"
          >
            {mobileNav ? Icons.x : Icons.menu}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileNav && (
          <div className="nav-mobile-menu" style={{
            padding: "1rem 2rem 2rem",
            background: "var(--color-surface-container-lowest)",
            borderBottomLeftRadius: "var(--radius-xl)",
            borderBottomRightRadius: "var(--radius-xl)",
          }}>
            {[
              { label: "Features", href: "/features" },
              { label: "Pricing", href: "/pricing" },
              { label: "FAQ", href: "/pricing#faq" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileNav(false)}
                style={{
                  display: "block",
                  padding: "0.875rem 0",
                  fontFamily: "var(--font-body)",
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: "var(--color-on-surface-variant)",
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(65,73,66,0.06)",
                }}
              >
                {item.label}
              </Link>
            ))}
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
              <a href="#cta" className="btn-primary" style={{ flex: 1, textAlign: "center", fontSize: "0.875rem" }}>
                Get Started
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Nav Styles */}
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: block !important; }
        }
      `}</style>

      {/* ───────────────────── HERO ───────────────────── */}
      <section
        ref={hero.ref}
        style={{
          paddingTop: "160px",
          paddingBottom: "100px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div className="gradient-hero-glow" style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "100%",
          pointerEvents: "none",
        }} />

        <div className="section-container" style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}>
          {/* Insight Chip */}
          <div
            className={`insight-chip ${hero.inView ? "animate-fade-in-up" : ""}`}
            style={{ marginBottom: "2rem" }}
          >
            {Icons.sparkle}
            <span>Zero-Entry AI Invoice Scanning</span>
          </div>

          <h1
            className={`text-display-lg ${hero.inView ? "animate-fade-in-up delay-100" : ""}`}
            style={{ maxWidth: "800px" }}
          >
            Automate Billing.{" "}
            <span className="gradient-primary-text">Zero Typing.</span>
          </h1>

          <p
            className={`text-body-lg ${hero.inView ? "animate-fade-in-up delay-200" : ""}`}
            style={{ maxWidth: "620px", marginTop: "1.5rem" }}
          >
            Say goodbye to manual data entry. Upload purchase bills and let our Gemini AI engine extract batch numbers, HSN codes, and GST splits instantly. Plus, turn any smartphone into a wireless barcode scanner natively.
          </p>

          <div
            className={hero.inView ? "animate-fade-in-up delay-300" : ""}
            style={{ marginTop: "2.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}
          >
            <a href="#pricing" className="btn-primary">
              Start Free Trial
              {Icons.arrowRight}
            </a>
            <a href="#features" className="btn-secondary">
              See Features
            </a>
          </div>

          {/* Hero dashboard image */}
          <div
            className={`${hero.inView ? "animate-fade-in-up delay-400" : ""}`}
            style={{
              marginTop: "4rem",
              width: "100%",
              maxWidth: "960px",
              borderRadius: "var(--radius-2xl)",
              overflow: "hidden",
              boxShadow:
                "0px 8px 32px rgba(20, 30, 21, 0.06), 0px 20px 60px rgba(20, 30, 21, 0.1)",
            }}
          >
            <Image
              src="/dashboard-preview.png"
              alt="ShelfCure AI Dashboard — pharmacy analytics and inventory management"
              width={1920}
              height={1080}
              style={{ width: "100%", height: "auto", display: "block" }}
              priority
            />
          </div>
        </div>
      </section>

      {/* ───────────────────── MISSION STATEMENT ───────────────────── */}
      <section
        ref={mission.ref}
        style={{
          padding: "4rem 0 6rem 0",
          background: "var(--color-surface)",
          overflow: "hidden",
        }}
      >
        <div className="section-container" style={{ textAlign: "center", position: "relative" }}>
          
          <h2 
            className={`text-display-md ${mission.inView ? "animate-fade-in-up" : "opacity-0"}`}
            style={{
              lineHeight: 1.5,
              fontWeight: 500,
              color: "#2C3549", /* Custom dark blue-slate to match the aesthetic */
              maxWidth: "1000px",
              margin: "0 auto",
            }}
          >
            Our solution{" "}
            <span 
              className={`inline-flex items-center justify-center align-middle rounded-full shadow-ambient-sm ${mission.inView ? "animate-float" : ""}`}
              style={{
                width: "56px",
                height: "56px",
                margin: "0 0.5rem",
                background: "#8BE0D6", /* Mint green */
                transform: "translateY(-4px)"
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="7" y="5" width="10" height="15" rx="3" />
                <path d="M9 2h6v3H9z" />
                <line x1="12" y1="10" x2="12" y2="15" />
                <line x1="9.5" y1="12.5" x2="14.5" y2="12.5" />
              </svg>
            </span>{" "}
            effectively empowers<br />
            the home-based healthcare{" "}
            <span 
              className={`inline-flex items-center justify-center align-middle rounded-full shadow-ambient-sm ${mission.inView ? "animate-float" : ""}`}
              style={{
                width: "56px",
                height: "56px",
                margin: "0 0.5rem",
                background: "#DAB6FC", /* Soft Purple */
                transform: "translateY(-4px)",
                animationDelay: "0.2s"
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(-45deg)" }}>
                <path d="M14 4.5l5.5 5.5"/>
                <path d="M4.5 14l5.5 5.5"/>
                <path d="M2.5 16l5.5 5.5c1.1 1.1 2.9 1.1 4 0l9.5-9.5c1.1-1.1 1.1-2.9 0-4l-5.5-5.5c-1.1-1.1-2.9-1.1-4 0l-9.5 9.5C1.4 13.1 1.4 14.9 2.5 16z" />
                <line x1="8" y1="8" x2="16" y2="16" />
              </svg>
            </span>{" "}
            industry<br />
            by enhancing ({" "}
            <span className="inline-flex items-center align-middle mx-1" style={{ verticalAlign: "-10px" }}>
              {[
                "https://i.pravatar.cc/100?img=33", 
                "https://i.pravatar.cc/100?img=47", 
                "https://i.pravatar.cc/100?img=12"
              ].map((src, i) => (
                <div 
                  key={src} 
                  className={mission.inView ? "animate-fade-in-up" : "opacity-0"} 
                  style={{ 
                    animationDelay: `${0.4 + i * 0.15}s`, 
                    zIndex: 10 - i,
                    position: "relative",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt="avatar"
                    width={52}
                    height={52}
                    style={{
                      borderRadius: "50%",
                      border: "3px solid var(--color-surface)",
                      marginLeft: i > 0 ? "-16px" : "0",
                      boxShadow: "0 4px 12px rgba(20,30,21,0.08)",
                      background: "white",
                      display: "block",
                      objectFit: "cover"
                    }}
                  />
                </div>
              ))}
            </span>{" "}
            ) patient outcomes
          </h2>
          
        </div>
      </section>

      {/* ───────────────────── ADVANCED FEATURES GRID ───────────────────── */}
      <section
        ref={featuresGrid.ref}
        style={{
          padding: "4rem 0 8rem 0",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div className="section-container">
          <div style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "2rem",
            maxWidth: "1140px",
            margin: "0 auto",
          }}>

            {/* Card 1: Smart Medication Insights */}
            <div className={`shadow-ambient-lg ${featuresGrid.inView ? "animate-fade-in-up" : "opacity-0"}`} style={{
              background: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.8)",
              padding: "2.5rem",
              borderRadius: "1.5rem",
              display: "flex",
              flexDirection: "column",
              animationDelay: "0.1s",
              minHeight: "440px",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <span style={{ color: "#0ea5e9", display: "flex", background: "#e0f2fe", padding: "0.5rem", borderRadius: "0.75rem" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
                </span>
                <h3 className="text-headline-sm" style={{ fontSize: "1.25rem", color: "#1E293B", fontWeight: 700 }}>AI Invoice Extraction Engine</h3>
              </div>
              <p className="text-body-md" style={{ color: "#64748B", marginBottom: "1.5rem" }}>Intelligently reads physical GST bills and maps lines to inventory — 10x faster than typing.</p>
              
              <div style={{ flex: 1, position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
                {/* Background ambient glow inside card */}
                <div style={{ position: "absolute", background: "radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)", width: "100%", height: "100%", top: 0, left: 0, zIndex: 0 }}></div>
                
                <div style={{ 
                  background: "white", 
                  borderRadius: "1.25rem", 
                  padding: "1.5rem", 
                  width: "100%", 
                  maxWidth: "300px", 
                  boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
                  zIndex: 2,
                  border: "1px solid #F1F5F9"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#0ea5e9", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
                         {Icons.sparkle}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.65rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Gemini OCR</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E293B" }}>Invoice Analyzed</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", fontSize: "0.8rem", color: "#94A3B8" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.5 }}><div>HSN</div><div style={{fontWeight: 700}}>✓</div></div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.5 }}><div>Batches</div><div style={{fontWeight: 700}}>✓</div></div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", borderBottom: "3px solid #0ea5e9", color: "#0ea5e9", fontWeight: 700, paddingBottom: "4px" }}><div>GST</div><div style={{color: "#1E293B"}}>Split</div></div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.5 }}><div>Totals</div><div style={{fontWeight: 700}}>✓</div></div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem", background: "#F8FAFC", padding: "0.75rem", borderRadius: "0.75rem" }}>
                    <div style={{ color: "#F97316", marginTop: "4px" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="10"/></svg></div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500, marginBottom: "2px" }}>Corrected Anomaly</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1E293B" }}>Batch shifted from HSN</div>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ color: "#3B82F6", marginTop: "4px" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="10"/></svg></div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500, marginBottom: "2px" }}>Auto Calculation</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1E293B" }}>Disc % inferred: <span style={{ color: "#94A3B8", fontWeight: 500 }}>12.5%</span></div>
                    </div>
                  </div>
                </div>

                <div className="animate-float" style={{ position: "absolute", left: "-10%", bottom: "25%", background: "white", padding: "0.75rem 1rem", borderRadius: "1rem", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 3, animationDelay: "1s" }}>
                  <div style={{ background: "#D1FAE5", color: "#10B981", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1E293B" }}>Effective</div>
                </div>
              </div>
            </div>

            {/* Card 2: Drug Interaction Alerts */}
            <div className={`shadow-ambient-lg ${featuresGrid.inView ? "animate-fade-in-up" : "opacity-0"}`} style={{
              background: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.8)",
              padding: "2.5rem",
              borderRadius: "1.5rem",
              display: "flex",
              flexDirection: "column",
              animationDelay: "0.2s",
              minHeight: "440px",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", zIndex: 2 }}>
                <span style={{ color: "#F43F5E", display: "flex", background: "#FFE4E6", padding: "0.5rem", borderRadius: "0.75rem" }}>
                  {Icons.zap}
                </span>
                <h3 className="text-headline-sm" style={{ fontSize: "1.25rem", color: "#1E293B", fontWeight: 700 }}>Wireless Mobile Scanner</h3>
              </div>
              <p className="text-body-md" style={{ color: "#64748B", marginBottom: "1.5rem", zIndex: 2 }}>A built-in WebSockets server turns your smartphone camera into an instant barcode gun.</p>
              
              <div style={{ flex: 1, position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
                {/* Background pill visualizer */}
                <div style={{ position: "absolute", inset: 0, opacity: 0.5, display: "flex", justifyContent: "center", alignItems: "center", background: "radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 60%)" }}>
                   <div className="animate-float" style={{ position: "absolute", top: "15%", left: "10%", background: "white", padding: "0.5rem", borderRadius: "1rem", boxShadow: "0 10px 20px rgba(0,0,0,0.05)"}}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#F472B6" }}></div>
                   </div>
                   <div className="animate-float" style={{ position: "absolute", bottom: "10%", left: "20%", background: "white", padding: "0.5rem", borderRadius: "1rem", boxShadow: "0 10px 20px rgba(0,0,0,0.05)", animationDelay: "1s"}}>
                      <div style={{ width: 24, height: 12, borderRadius: "10px", background: "#34D399", transform: "rotate(30deg)" }}></div>
                   </div>
                   <div className="animate-float" style={{ position: "absolute", top: "25%", right: "15%", background: "white", padding: "0.5rem", borderRadius: "1rem", boxShadow: "0 10px 20px rgba(0,0,0,0.05)", animationDelay: "1.5s"}}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#60A5FA" }}></div>
                   </div>
                </div>

                {/* Interaction Alerts Box */}
                <div style={{ background: "rgba(255, 255, 255, 0.95)", borderRadius: "1rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: "260px", zIndex: 2, boxShadow: "0 20px 40px rgba(244,63,94,0.1)", border: "1px solid #FFE4E6" }}>
                  <div style={{ background: "white", padding: "0.75rem 1rem", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", border: "1px solid #F1F5F9" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}></div>
                    <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: 600 }}>Phone Connected</span>
                  </div>
                  <div style={{ background: "white", padding: "0.75rem 1rem", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", border: "1px solid #F1F5F9" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: 600 }}>Crocine 500mg Scanned</span>
                  </div>
                  <div style={{ background: "white", padding: "0.75rem 1rem", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", border: "1px solid #F1F5F9" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span style={{ fontSize: "0.85rem", color: "#334155", fontWeight: 600 }}>Sync to Billing Queue</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Seamless Integrations */}
            <div className={`shadow-ambient-lg ${featuresGrid.inView ? "animate-fade-in-up" : "opacity-0"}`} style={{
              background: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.8)",
              padding: "2.5rem",
              borderRadius: "1.5rem",
              display: "flex",
              flexDirection: "column",
              animationDelay: "0.3s",
              minHeight: "440px",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <span style={{ color: "#34D399", display: "flex", background: "#D1FAE5", padding: "0.5rem", borderRadius: "0.75rem" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
                </span>
                <h3 className="text-headline-sm" style={{ fontSize: "1.25rem", color: "#1E293B", fontWeight: 700 }}>Seamless Integrations</h3>
              </div>
              <p className="text-body-md" style={{ color: "#64748B", marginBottom: "1.5rem" }}>Direct pipeline connecting prescribers, patients, and fulfillment APIs safely.</p>

              <div style={{ flex: 1, position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
                {/* Integration Graphics Box */}
                <div style={{ background: "white", padding: "2rem", borderRadius: "1.25rem", boxShadow: "0 20px 40px rgba(0,0,0,0.06)", border: "1px solid #F1F5F9", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", position: "relative", overflow: "hidden" }}>
                  
                  {/* Glowing background inside map */}
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "120%", height: "4px", background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.3), transparent)" }}></div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0 10px", zIndex: 2 }}>
                    {/* Node 1 */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <div className="animate-float" style={{ width: "64px", height: "64px", borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "3px solid #E2E8F0", boxShadow: "0 8px 16px rgba(0,0,0,0.05)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://i.pravatar.cc/100?img=60" alt="Doctor" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>Provider</span>
                    </div>

                    {/* Arrow 1 */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>

                    {/* Node 2 */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <div className="animate-float" style={{ width: "72px", height: "72px", borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "4px solid #34D399", boxShadow: "0 10px 25px rgba(52,211,153,0.2)", animationDelay: "0.5s" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="https://i.pravatar.cc/100?img=47" alt="Patient" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1E293B" }}>Patient</span>
                    </div>

                    {/* Arrow 2 */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>

                    {/* Node 3 */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <div className="animate-float" style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "white", border: "3px solid white", fontSize: "0.75rem", letterSpacing: "0.5px", boxShadow: "0 8px 16px rgba(14,165,233,0.2)", animationDelay: "1s" }}>
                        AMGEN
                      </div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>Pharmacy</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Card 4: Personalized Reminders */}
            <div className={`shadow-ambient-lg ${featuresGrid.inView ? "animate-fade-in-up" : "opacity-0"}`} style={{
              background: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.8)",
              padding: "2.5rem",
              borderRadius: "1.5rem",
              display: "flex",
              flexDirection: "column",
              animationDelay: "0.4s",
              minHeight: "440px",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <span style={{ color: "#A855F7", display: "flex", background: "#F3E8FF", padding: "0.5rem", borderRadius: "0.75rem" }}>
                  {Icons.shield}
                </span>
                <h3 className="text-headline-sm" style={{ fontSize: "1.25rem", color: "#1E293B", fontWeight: 700 }}>Offline-First ERP</h3>
              </div>
              <p className="text-body-md" style={{ color: "#64748B", marginBottom: "1.5rem" }}>Embedded SQLite syncs to the cloud securely. You never lose a sale even if internet fails.</p>
              
              <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "1rem" }}>
                
                {/* Background glow */}
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.1) 0%, transparent 70%)" }}></div>

                {/* Details Stack */}
                <div style={{ background: "white", padding: "1.25rem", borderRadius: "1.25rem", boxShadow: "0 20px 40px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "1rem", width: "95%", zIndex: 3, border: "1px solid #F1F5F9" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#D1FAE5", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E293B", marginBottom: "2px" }}>Auto-Sync Active</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748B", letterSpacing: "0.2px" }}>Changes backed up to Supabase.</div>
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(4px)", padding: "1.25rem", borderRadius: "1.25rem", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "1rem", width: "90%", zIndex: 2, transform: "scale(0.95) translateY(-5px)", border: "1px solid rgba(255,255,255,0.5)"}}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#FEF3C7", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E293B", marginBottom: "2px" }}>Offline Mode</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748B", letterSpacing: "0.2px" }}>Network lost. Transactions mapped locally.</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          
          <style>{`
            @media (max-width: 900px) {
              section:has(> div > div > [style*="grid-template-columns: repeat(2"]) div[style*="grid-template-columns: repeat(2"] {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </div>
      </section>

      {/* ───────────────────── INTEGRATION SECTION ───────────────────── */}
      <section ref={integrations.ref} style={{ padding: "8rem 0", background: "white", overflow: "hidden" }}>
        <div className="section-container" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          
          <div className={`insight-chip ${integrations.inView ? "animate-fade-in-up" : "opacity-0"}`} style={{ marginBottom: "1.5rem" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <span style={{ color: "var(--color-primary)", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>Integration</span>
          </div>

          <h2 className={`text-display-md ${integrations.inView ? "animate-fade-in-up delay-100" : "opacity-0"}`} style={{ color: "#1E293B", fontWeight: 600, maxWidth: "700px", lineHeight: "1.2" }}>
            Seamlessly Integrate With All<br />Your Healthcare Apps
          </h2>

          <p className={`text-body-lg ${integrations.inView ? "animate-fade-in-up delay-200" : "opacity-0"}`} style={{ color: "#64748B", maxWidth: "600px", marginTop: "1.5rem" }}>
            Our prescription app integrates effortlessly with your favorite healthcare tools, ensuring a smooth and connected experience.
          </p>

          <a href="#integrations" className={`btn-primary ${integrations.inView ? "animate-fade-in-up delay-300" : "opacity-0"}`} style={{ marginTop: "2rem", borderRadius: "2rem", padding: "0.75rem 1.5rem" }}>
            Learn More
            <span style={{ background: "white", color: "var(--color-primary)", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "0.5rem" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </span>
          </a>

          <div className={`${integrations.inView ? "animate-fade-in-up delay-400" : "opacity-0"}`} style={{ marginTop: "5rem", position: "relative", width: "100%", maxWidth: "1100px", height: "300px" }}>
            
            {/* Horizontal lines */}
            <div style={{ position: "absolute", top: "50%", left: 0, width: "100%", height: "1px", borderTop: "2px dashed rgba(203,213,225,0.4)" }} />
            <div style={{ position: "absolute", top: "15%", left: "5%", width: "90%", height: "1px", borderTop: "2px dashed rgba(203,213,225,0.3)" }} />
            <div style={{ position: "absolute", top: "85%", left: "5%", width: "90%", height: "1px", borderTop: "2px dashed rgba(203,213,225,0.3)" }} />

            {/* Cross Lines to center */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
               <path d="M 50% 50% L 35% 15%" stroke="rgba(203,213,225,0.3)" strokeWidth="2" strokeDasharray="4 4" fill="none" />
               <path d="M 50% 50% L 35% 85%" stroke="rgba(203,213,225,0.3)" strokeWidth="2" strokeDasharray="4 4" fill="none" />
               <path d="M 50% 50% L 65% 15%" stroke="rgba(203,213,225,0.3)" strokeWidth="2" strokeDasharray="4 4" fill="none" />
               <path d="M 50% 50% L 65% 85%" stroke="rgba(203,213,225,0.3)" strokeWidth="2" strokeDasharray="4 4" fill="none" />
            </svg>

            {/* Center Node */}
            <div className="shadow-ambient-lg gradient-primary" style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              width: "140px", height: "140px", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
              boxShadow: "0 0 0 12px rgba(0, 109, 55, 0.1), 0 0 0 24px rgba(0, 109, 55, 0.05), 0 20px 40px rgba(0, 109, 55, 0.25)"
            }}>
              <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2A10 10 0 1 0 22 12 10 10 0 0 0 12 2ZM6 12A6 6 0 1 1 18 12 6 6 0 0 1 6 12Z"/>
                <path d="M12 6v12M6 12h12M7.75 7.75l8.5 8.5M7.75 16.25l8.5-8.5"/>
              </svg>
            </div>

            {/* Left nodes */}
            <IntegrationNode top="15%" left="5%" icon={Icons.sparkle} hoverText="Epic" />
            <IntegrationNode top="15%" left="20%" icon={Icons.box} hoverText="Cerner" />
            <IntegrationNode top="15%" left="35%" icon={Icons.chart} hoverText="Allscripts" />

            <IntegrationNode top="50%" left="3%" icon={Icons.zap} hoverText="Meditech" />
            <IntegrationNode top="50%" left="15%" icon={Icons.users} hoverText="Athena" />
            <IntegrationNode top="50%" left="28%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19A4.5 4.5 0 0 0 18 10h-.5a7.5 7.5 0 0 0-14.9 1.5A4.5 4.5 0 0 0 7 20h10.5Z"/></svg>} hoverText="CureMD" />
            <IntegrationNode top="50%" left="40%" icon={Icons.shield} hoverText="eClinicalWorks" />

            <IntegrationNode top="85%" left="10%" icon={Icons.mail} hoverText="Kareo" />
            <IntegrationNode top="85%" left="25%" icon={Icons.menu} hoverText="AdvancedMD" />
            <IntegrationNode top="85%" left="40%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>} hoverText="Greenway" />

            {/* Right nodes */}
            <IntegrationNode top="15%" right="35%" active={true} hoverText="Rhythm Health" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>} />
            <IntegrationNode top="15%" right="20%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 12l-4-4-4 4"/></svg>} hoverText="Optum" />
            <IntegrationNode top="15%" right="5%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>} hoverText="McKesson" />

            <IntegrationNode top="50%" right="40%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>} hoverText="Amerisource" />
            <IntegrationNode top="50%" right="28%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} hoverText="Cardinal" />
            <IntegrationNode top="50%" right="15%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} hoverText="SureScripts" />
            <IntegrationNode top="50%" right="3%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>} hoverText="NextGen" />

            <IntegrationNode top="85%" right="40%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>} hoverText="DrFirst" />
            <IntegrationNode top="85%" right="25%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>} hoverText="Practo" />
            <IntegrationNode top="85%" right="10%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>} hoverText="Zocdoc" />

          </div>
          
          {/* Internal CSS for nodes */}
          <style>{`
            .integration-node-container {
               position: absolute;
               z-index: 5;
            }
            .integration-node {
               height: 56px;
               min-width: 56px;
               background: white;
               border-radius: 28px;
               box-shadow: 0 10px 25px rgba(148, 163, 184, 0.2), inset 0 0 0 1px rgba(255,255,255,0.8);
               display: flex;
               align-items: center;
               justify-content: center;
               color: #94A3B8;
               cursor: pointer;
               transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
               padding: 0 18px;
               overflow: hidden;
            }
            .integration-node:hover, .integration-node.active {
               color: var(--color-primary);
               box-shadow: 0 15px 35px rgba(0, 109, 55, 0.15), inset 0 0 0 1px rgba(255,255,255,0.9);
               transform: scale(1.05);
               z-index: 20;
            }
            .integration-node .hover-text {
               max-width: 0;
               opacity: 0;
               font-weight: 600;
               color: #1E293B;
               font-size: 0.875rem;
               white-space: nowrap;
               transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .integration-node:hover .hover-text, .integration-node.active .hover-text {
               max-width: 150px;
               opacity: 1;
               margin-left: 8px;
            }
          `}</style>
        </div>
      </section>

      {/* ───────────────────── STATS BAR ───────────────────── */}
      <section
        ref={stats.ref}
        style={{
          background: "var(--color-surface-container-low)",
          padding: "4rem 0",
        }}
      >
        <div className="section-container" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "2.5rem",
        }}>
          <StatCounter end={2500} suffix="+" label="Pharmacies Managed" />
          <StatCounter end={98} suffix="%" label="Inventory Accuracy" />
          <StatCounter end={40} suffix="%" label="Time Saved on Billing" />
          <StatCounter end={24} suffix="/7" label="Support Available" />
        </div>
      </section>

      {/* ───────────────────── WHY SHELFCURE ───────────────────── */}
      <section
        ref={why.ref}
        id="why"
        style={{ padding: "6rem 0" }}
      >
        <div className="section-container">
          <div style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto" }}>
            <p className={`text-label-md ${why.inView ? "animate-fade-in-up" : ""}`}
              style={{ color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              Why ShelfCure
            </p>
            <h2 className={`text-headline-lg ${why.inView ? "animate-fade-in-up delay-100" : ""}`}>
              Everything your pharmacy needs,
              <br />intelligently connected
            </h2>
            <p className={`text-body-lg ${why.inView ? "animate-fade-in-up delay-200" : ""}`}
              style={{ marginTop: "1rem" }}>
              Move beyond spreadsheets and outdated POS systems. ShelfCure brings modern
              AI to every corner of your pharmacy workflow.
            </p>
          </div>

          <div style={{
            marginTop: "3.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}>
            {[
              { icon: Icons.box, title: "1-Click Inventory Match", desc: "Instantly cross-reference scanned bills with existing database stocks & identify expiring products safely." },
              { icon: Icons.chart, title: "Gemini OCR Extraction", desc: "Zero-typing! Just load your supplier invoice — we automatically extract GSTs, Batches, and Subtotals natively." },
              { icon: Icons.zap, title: "Lightning Billing Engine", desc: "Complete POS transactions in seconds with automated GST calculations and fast search functionality." },
              { icon: Icons.shield, title: "Offline Resilience", desc: "Your data stays physically secured in local SQLite and safely syncs to Supabase on reconnection." },
              { icon: Icons.users, title: "Customer Credit & Challans", desc: "Track patient outstanding dues, issue delivery challans easily, and process seamless returns." },
              { icon: Icons.sparkle, title: "Smartphone Scanner", desc: "No native hardware required. Run our WebSocket server to transform any local iPhone/Android into a lightning-fast barcode scanner." },
            ].map((card, i) => (
              <div
                key={card.title}
                className={`card ${why.inView ? "animate-fade-in-up" : ""}`}
                style={{ animationDelay: `${0.15 + i * 0.1}s` }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-lg)",
                  background: "var(--color-surface-container-low)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-primary)",
                  marginBottom: "1.25rem",
                }}>
                  {card.icon}
                </div>
                <h3 className="text-headline-sm" style={{ marginBottom: "0.625rem" }}>{card.title}</h3>
                <p className="text-body-md">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────── FEATURES SHOWCASE ───────────────────── */}
      <section
        ref={features.ref}
        id="features"
        style={{
          padding: "6rem 0",
          background: "var(--color-surface-container-low)",
        }}
      >
        <div className="section-container">
          <div style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto 3.5rem auto" }}>
            <p className={`text-label-md ${features.inView ? "animate-fade-in-up" : ""}`}
              style={{ color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              Product Tour
            </p>
            <h2 className={`text-headline-lg ${features.inView ? "animate-fade-in-up delay-100" : ""}`}>
              Built for modern pharmacies
            </h2>
          </div>

          {/* Feature 1 — large */}
          <div className={`${features.inView ? "animate-fade-in-up delay-200" : ""}`} style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            marginBottom: "2rem",
          }}>
            <div className="card-elevated" style={{
              gridColumn: "1 / -1",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "3rem",
              alignItems: "center",
              padding: "3rem",
            }}>
              <div>
                <div className="insight-chip" style={{ marginBottom: "1.25rem" }}>
                  {Icons.sparkle}
                  <span>AI-Powered</span>
                </div>
                <h3 className="text-headline-md" style={{ marginBottom: "1rem" }}>
                  Intelligent Dashboard
                </h3>
                <p className="text-body-lg" style={{ marginBottom: "1.5rem" }}>
                  Get a real-time overview of your entire pharmacy — sales velocity,
                  inventory health, expiring stock, and AI-generated action items — all
                  on a single, beautiful screen.
                </p>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {["Real-time sales tracking", "Expiry risk alerts", "AI-driven reorder suggestions"].map((item) => (
                    <li key={item} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <span style={{ color: "var(--color-primary)" }}>{Icons.check}</span>
                      <span className="text-body-md" style={{ color: "var(--color-on-surface)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
                <Image
                  src="/analytics-preview.png"
                  alt="ShelfCure intelligent dashboard with AI analytics"
                  width={800}
                  height={500}
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
            </div>
          </div>

          {/* Feature 2 + 3 — two cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
          }}>
            <div className={`card-elevated ${features.inView ? "animate-fade-in-up delay-300" : ""}`} style={{ padding: "2.5rem" }}>
              <div style={{
                width: 48, height: 48,
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", marginBottom: "1.5rem",
              }}>
                {Icons.zap}
              </div>
              <h3 className="text-headline-sm" style={{ marginBottom: "0.75rem" }}>Point of Sale</h3>
              <p className="text-body-md">
                Blazing-fast billing with smart medicine search, automatic batch selection by
                expiry (FEFO), GST calculation, and receipt printing — all under 10 seconds.
              </p>
            </div>

            <div className={`card-elevated ${features.inView ? "animate-fade-in-up delay-400" : ""}`} style={{ padding: "2.5rem" }}>
              <div style={{
                width: 48, height: 48,
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, var(--color-tertiary) 0%, var(--color-tertiary-container) 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", marginBottom: "1.5rem",
              }}>
                {Icons.chart}
              </div>
              <h3 className="text-headline-sm" style={{ marginBottom: "0.75rem" }}>Reports & Insights</h3>
              <p className="text-body-md">
                Generate GST reports, purchase summaries, profit margin analysis, and
                customer credit statements — all exportable to Excel in one click.
              </p>
            </div>
          </div>
        </div>

        {/* Responsive override for feature grids */}
        <style>{`
          @media (max-width: 768px) {
            .card-elevated[style*="grid-column: 1 / -1"] {
              grid-template-columns: 1fr !important;
            }
            .card-elevated[style*="grid-column: 1 / -1"] > div:last-child {
              order: -1;
            }
          }
          @media (max-width: 640px) {
            section#features > div > div:last-child {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>

      {/* ───────────────────── VIDEO DEMO ───────────────────── */}
      <section
        ref={video.ref}
        id="demo"
        style={{ padding: "6rem 0" }}
      >
        <div className="section-container">
          <div style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto 3rem auto" }}>
            <p className={`text-label-md ${video.inView ? "animate-fade-in-up" : ""}`}
              style={{ color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              See It In Action
            </p>
            <h2 className={`text-headline-lg ${video.inView ? "animate-fade-in-up delay-100" : ""}`}>
              Watch how ShelfCure transforms your workflow
            </h2>
            <p className={`text-body-lg ${video.inView ? "animate-fade-in-up delay-200" : ""}`}
              style={{ marginTop: "1rem" }}>
              From inventory import to your first sale — see how pharmacies save 40% of their daily operational time.
            </p>
          </div>

          <div
            className={video.inView ? "animate-fade-in-up delay-300" : ""}
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              borderRadius: "var(--radius-2xl)",
              overflow: "hidden",
              boxShadow: "0px 8px 32px rgba(20, 30, 21, 0.06), 0px 20px 60px rgba(20, 30, 21, 0.1)",
              background: "var(--color-surface-container-lowest)",
              position: "relative",
            }}
          >
            {/* 16:9 responsive video container */}
            <div style={{
              position: "relative",
              paddingBottom: "56.25%",
              height: 0,
              overflow: "hidden",
            }}>
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1"
                title="ShelfCure Product Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            </div>
          </div>

          {/* Video CTA */}
          <div
            className={video.inView ? "animate-fade-in-up delay-400" : ""}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "2rem",
              marginTop: "2.5rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "var(--color-primary)" }}>{Icons.check}</span>
              <span className="text-body-md" style={{ color: "var(--color-on-surface)" }}>No credit card required</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "var(--color-primary)" }}>{Icons.check}</span>
              <span className="text-body-md" style={{ color: "var(--color-on-surface)" }}>Setup in under 5 minutes</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "var(--color-primary)" }}>{Icons.check}</span>
              <span className="text-body-md" style={{ color: "var(--color-on-surface)" }}>Works offline</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── HOW IT WORKS ───────────────────── */}
      <section
        ref={steps.ref}
        style={{ padding: "6rem 0" }}
      >
        <div className="section-container">
          <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 4rem auto" }}>
            <p className={`text-label-md ${steps.inView ? "animate-fade-in-up" : ""}`}
              style={{ color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              Getting Started
            </p>
            <h2 className={`text-headline-lg ${steps.inView ? "animate-fade-in-up delay-100" : ""}`}>
              Up and running in 3 steps
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "2rem",
          }}>
            {[
              { step: "01", icon: Icons.upload, title: "Install & Import", desc: "Download ShelfCure and import your existing inventory via CSV or start fresh." },
              { step: "02", icon: Icons.cpu, title: "Let AI Analyze", desc: "Our AI engine categorizes products, detects duplicates, and sets up smart alerts automatically." },
              { step: "03", icon: Icons.download, title: "Start Selling", desc: "Begin billing, track sales, manage customers, and generate reports — all from day one." },
            ].map((s, i) => (
              <div
                key={s.step}
                className={`${steps.inView ? "animate-fade-in-up" : ""}`}
                style={{
                  animationDelay: `${0.15 + i * 0.15}s`,
                  textAlign: "center",
                  position: "relative",
                }}
              >
                {/* Step number */}
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "var(--color-surface-container-lowest)",
                  boxShadow: "0px 4px 20px rgba(20,30,21,0.04), 0px 12px 40px rgba(20,30,21,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem",
                  color: "var(--color-primary)",
                }}>
                  {s.icon}
                </div>
                <div style={{
                  position: "absolute",
                  top: "-10px",
                  right: "calc(50% - 54px)",
                  fontFamily: "var(--font-display)",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  color: "var(--color-on-primary)",
                  background: "var(--color-primary)",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {s.step}
                </div>
                <h3 className="text-headline-sm" style={{ marginBottom: "0.625rem" }}>{s.title}</h3>
                <p className="text-body-md" style={{ maxWidth: "280px", margin: "0 auto" }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <style>{`
            @media (max-width: 640px) {
              section:has(> div > div > [style*="grid-template-columns: repeat(3"]) div[style*="grid-template-columns: repeat(3"] {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </div>
      </section>

      {/* ───────────────────── CTA / NEWSLETTER ───────────────────── */}
      <section
        ref={cta.ref}
        id="cta"
        style={{
          padding: "6rem 0",
          background: "var(--color-surface-container-low)",
        }}
      >
        <div className="section-container">
          <div
            className={cta.inView ? "animate-fade-in-up" : ""}
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, #00a04f 50%, var(--color-primary-container) 100%)",
              borderRadius: "var(--radius-2xl)",
              padding: "4rem 3rem",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative circles */}
            <div style={{
              position: "absolute",
              top: "-60px",
              right: "-40px",
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute",
              bottom: "-40px",
              left: "-30px",
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              pointerEvents: "none",
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <h2 className="text-headline-lg" style={{ color: "#fff", marginBottom: "1rem" }}>
                Ready to transform your pharmacy?
              </h2>
              <p className="text-body-lg" style={{ color: "rgba(255,255,255,0.85)", maxWidth: "500px", margin: "0 auto 2rem" }}>
                Join thousands of pharmacies already using ShelfCure to save time,
                reduce waste, and grow revenue.
              </p>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                maxWidth: "480px",
                margin: "0 auto",
                flexWrap: "wrap",
              }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  style={{
                    flex: 1,
                    minWidth: "240px",
                    padding: "0.875rem 1.25rem",
                    borderRadius: "var(--radius-full)",
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    background: "rgba(255,255,255,0.12)",
                    color: "#fff",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9375rem",
                    outline: "none",
                    transition: "all 0.25s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.18)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                  }}
                />
                <button style={{
                  padding: "0.875rem 2rem",
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  background: "#fff",
                  color: "var(--color-primary)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0px 4px 16px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Get Started {Icons.arrowRight}
                </button>
              </div>

              <p className="text-label-md" style={{ color: "rgba(255,255,255,0.5)", marginTop: "1rem" }}>
                Free 14-day trial • No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      
    </>
  );
}

const IntegrationNode = ({ top, left, right, bottom, icon, hoverText, active = false }: any) => {
  return (
    <div className="integration-node-container" style={{ top, left, right, bottom }}>
      <div className={`integration-node ${active ? 'active' : ''}`} title={hoverText}>
        {icon}
        <span className="hover-text">{hoverText}</span>
      </div>
    </div>
  );
};

const StatCounter = ({ end, suffix, label }: any) => {
  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-primary)", lineHeight: 1.2 }}>
        {end}{suffix}
      </div>
      <div style={{ fontSize: "1rem", color: "var(--color-on-surface-variant)", fontWeight: 500, marginTop: "0.5rem" }}>
        {label}
      </div>
    </div>
  );
};
