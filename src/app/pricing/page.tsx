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
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(eased * end));
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
   PLAN DATA
   ═══════════════════════════════════════════════════════════ */
const plans = {
  annual: {
    label: "Annual Pass",
    price: "4,000",
    period: "/year",
    subtext: "Best for growing pharmacies",
    savings: null,
    cta: "Start Annual Plan",
    ctaStyle: "secondary" as const,
    features: [
      { text: "Unlimited AI Billing", included: true },
      { text: "Wireless Mobile Scanner", included: true },
      { text: "Real-time Cloud Sync", included: true },
      { text: "Priority Email Support", included: true },
      { text: "Daily Automated Backups", included: true },
      { text: "Multi-Device Sync (1 user)", included: true },
      { text: "Dedicated Success Manager", included: false },
      { text: "White-glove Data Migration", included: false },
    ],
  },
  lifetime: {
    label: "Lifetime Ownership",
    price: "8,000",
    period: " one-time",
    subtext: "Pay once, own forever",
    savings: "₹10,000",
    cta: "Grab Lifetime Access",
    ctaStyle: "primary" as const,
    features: [
      { text: "Unlimited AI Billing", included: true },
      { text: "Wireless Mobile Scanner", included: true },
      { text: "Real-time Cloud Sync", included: true },
      { text: "Priority Email Support", included: true },
      { text: "Daily Automated Backups", included: true },
      { text: "Multi-Device Sync (2 users)", included: true },
      { text: "Dedicated Success Manager", included: true },
      { text: "White-glove Data Migration", included: true },
    ],
  }
};

const comparisonFeatures = [
  { feature: "AI Invoice Scanning", annual: "Unlimited", lifetime: "Unlimited" },
  { feature: "Medicine Database", annual: "Unlimited", lifetime: "Unlimited" },
  { feature: "Mobile Barcode Scanner", annual: "✓", lifetime: "✓" },
  { feature: "Cloud Sync & Backups", annual: "✓", lifetime: "✓" },
  { feature: "GST Reports & Invoicing", annual: "✓", lifetime: "✓" },
  { feature: "Expiry & Batch Tracking", annual: "✓", lifetime: "✓" },
  { feature: "Multi-Device Users", annual: "1 User", lifetime: "2 Users" },
  { feature: "WhatsApp Alerts", annual: "✓", lifetime: "✓" },
  { feature: "Success Manager", annual: "✗", lifetime: "Dedicated" },
  { feature: "Data Migration Help", annual: "Self-service", lifetime: "White-glove" },
  { feature: "Future Updates", annual: "While subscribed", lifetime: "Forever" },
];

const faqItems = [
  { q: "Is there a free trial?", a: "Yes! ShelfCure is free to download and try. You get full access to all features for 14 days without entering any payment details." },
  { q: "What happens after the first 100 Lifetime buyers?", a: "The Lifetime price will increase from ₹8,000 to ₹10,000 once we hit the 100-user milestone. Lock in the lower price while seats remain." },
  { q: "Can I switch from Annual to Lifetime later?", a: "Absolutely. You can upgrade at any time. We'll credit your remaining annual balance towards the lifetime purchase — no money lost." },
  { q: "Are there any hidden costs for Lifetime users?", a: "None. All current features plus every future update are included forever. No recurring charges, no upsells." },
  { q: "Is the price inclusive of GST?", a: "Yes. All listed prices are inclusive of 18% GST. You'll receive a proper GST invoice for your records." },
  { q: "What payment methods are accepted?", a: "We accept UPI, credit/debit cards, net banking, and bank transfer. Enterprise customers can also pay via invoice." },
];

export default function PricingPage() {
  const hero = useInView(0.1);
  const cards = useInView(0.1);
  const trustSection = useInView(0.15);
  const comp = useInView(0.1);
  const faq = useInView(0.1);
  const cta = useInView(0.3);

  /* Toggle annual/lifetime highlight */
  const [highlightLifetime, setHighlightLifetime] = useState(true);

  /* FAQ accordion */
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  /* Scarcity counter */
  const remainingSeats = 42;

  /* Trust stats */
  const pharmacies = useCounter(2500, 2000, trustSection.inView);
  const uptime = useCounter(99, 1500, trustSection.inView);
  const invoices = useCounter(12, 1500, trustSection.inView);

  /* Title Typing Effect */
  const typingText = useTypewriter(["pharmacy's future.", "growth potential.", "digital success."], 80, 2200, 40);

  return (
    <div style={{ background: "var(--color-surface)", overflow: "hidden" }}>

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section
        ref={hero.ref}
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

        {/* Ambient orbs */}
        <div className="animate-float" style={{
          position: "absolute", top: "5%", left: "8%", width: "300px", height: "300px",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />
        <div className="animate-float" style={{
          position: "absolute", bottom: "10%", right: "5%", width: "350px", height: "350px",
          background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none", animationDelay: "3s",
        }} />

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
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 12px #10b981" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Simple, Transparent Pricing
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
            Invest in your{" "}
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
              maxWidth: "600px", margin: "0 auto 2.5rem", lineHeight: 1.7,
            }}
          >
            No complex tiers. No hidden charges. Choose annual flexibility or a one-time lifetime investment.
          </p>

          {/* Plan toggle */}
          <div
            className={hero.inView ? "animate-fade-in-up delay-300" : "opacity-0"}
            style={{
              display: "inline-flex", alignItems: "center", gap: "1rem",
              padding: "0.4rem",
              background: "rgba(255,255,255,0.06)", backdropFilter: "blur(16px)",
              borderRadius: "var(--radius-full)", border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <button
              onClick={() => setHighlightLifetime(false)}
              style={{
                padding: "0.7rem 2rem", borderRadius: "var(--radius-full)",
                border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem",
                background: !highlightLifetime ? "white" : "transparent",
                color: !highlightLifetime ? "#0f172a" : "rgba(255,255,255,0.5)",
                transition: "all 0.3s ease",
                boxShadow: !highlightLifetime ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
              }}
            >
              Annual
            </button>
            <button
              onClick={() => setHighlightLifetime(true)}
              style={{
                padding: "0.7rem 2rem", borderRadius: "var(--radius-full)",
                border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem",
                background: highlightLifetime ? "linear-gradient(135deg, #6366f1, #818cf8)" : "transparent",
                color: highlightLifetime ? "white" : "rgba(255,255,255,0.5)",
                transition: "all 0.3s ease",
                boxShadow: highlightLifetime ? "0 4px 16px rgba(99,102,241,0.3)" : "none",
              }}
            >
              Lifetime
              <span style={{
                marginLeft: "0.5rem",
                background: highlightLifetime ? "rgba(255,255,255,0.2)" : "rgba(129,140,248,0.15)",
                padding: "0.15rem 0.5rem", borderRadius: "var(--radius-full)",
                fontSize: "0.65rem", fontWeight: 800,
                color: highlightLifetime ? "white" : "#818cf8",
              }}>SAVE 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING CARDS ═══════════════ */}
      <section
        ref={cards.ref}
        style={{
          padding: "0 0 6rem",
          background: "linear-gradient(180deg, #1a1640, white 35%)",
          position: "relative", zIndex: 20,
        }}
      >
        <div className="section-container">
          <div className="pricing-grid" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem",
            maxWidth: "1000px", margin: "0 auto",
          }}>

            {/* ── ANNUAL CARD ── */}
            <div
              className={cards.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                background: "white", borderRadius: "2rem", padding: "3rem",
                border: !highlightLifetime ? "2px solid #6366f1" : "1px solid rgba(0,0,0,0.06)",
                boxShadow: !highlightLifetime ? "0 30px 60px rgba(99,102,241,0.12)" : "0 20px 40px rgba(0,0,0,0.03)",
                display: "flex", flexDirection: "column",
                transition: "all 0.5s cubic-bezier(0.25,0.46,0.45,0.94)",
                transform: !highlightLifetime ? "scale(1.03)" : "scale(1)",
                position: "relative", overflow: "hidden",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = `${!highlightLifetime ? "scale(1.03)" : "scale(1)"} translateY(-8px)`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = !highlightLifetime ? "scale(1.03)" : "scale(1)"; }}
            >
              {!highlightLifetime && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 4,
                  background: "linear-gradient(90deg, #6366f1, #818cf8, #a78bfa)",
                }} />
              )}

              <div style={{ marginBottom: "2rem" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "1rem",
                }}>
                  <div style={{
                    fontSize: "0.8rem", fontWeight: 700, color: "#6366f1",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>Annual Pass</div>
                  {!highlightLifetime && (
                    <span style={{
                      padding: "0.25rem 0.75rem", borderRadius: "var(--radius-full)",
                      background: "linear-gradient(135deg, #6366f1, #818cf8)",
                      color: "white", fontSize: "0.65rem", fontWeight: 800,
                    }}>RECOMMENDED</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 600, color: "#94a3b8" }}>₹</span>
                  <span style={{
                    fontSize: "3.5rem", fontWeight: 800, color: "#0f172a",
                    fontFamily: "var(--font-display)", lineHeight: 1,
                  }}>4,000</span>
                  <span style={{ fontSize: "1.1rem", color: "#94a3b8", fontWeight: 500 }}>/year</span>
                </div>
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                  Best for growing pharmacies
                </p>
              </div>

              {/* All 7 modules */}
              <div style={{ marginBottom: "1.5rem", padding: "1.25rem", background: "#f8fafc", borderRadius: "1rem", border: "1px solid rgba(99,102,241,0.08)" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>All 7 modules included</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {["Smart Billing", "Inventory Control", "GST & Compliance", "Reports & Profit", "Customer & Credit", "Supplier Management", "Promotions"].map(m => (
                    <div key={m} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "#475569", fontWeight: 500 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      {m}
                    </div>
                  ))}
                </div>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2.5rem 0", display: "grid", gap: "0.875rem", flex: 1 }}>
                <li style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Plan perks</li>
                {plans.annual.features.map((f) => (
                  <li key={f.text} style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    color: f.included ? "#475569" : "#cbd5e1", fontWeight: 500, fontSize: "0.9rem",
                  }}>
                    <div style={{
                      width: 20, height: 20,
                      background: f.included ? "linear-gradient(135deg, #6366f1, #818cf8)" : "#f1f5f9",
                      color: f.included ? "white" : "#cbd5e1",
                      borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {f.included
                        ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        : <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      }
                    </div>
                    <span style={{ textDecoration: f.included ? "none" : "line-through" }}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <Link href="/download" className="btn-secondary" style={{
                width: "100%", padding: "1rem", textAlign: "center",
                display: "block", fontWeight: 700, fontSize: "1rem",
              }}>
                Start Annual Plan
              </Link>
            </div>

            {/* ── LIFETIME CARD ── */}
            <div
              className={cards.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{
                background: "linear-gradient(135deg, #1e1b4b, #312e81)",
                borderRadius: "2rem", padding: "3rem", color: "white",
                position: "relative", overflow: "hidden",
                boxShadow: highlightLifetime ? "0 30px 60px rgba(99,102,241,0.25)" : "0 20px 40px rgba(99,102,241,0.1)",
                display: "flex", flexDirection: "column",
                transition: "all 0.5s cubic-bezier(0.25,0.46,0.45,0.94)",
                transform: highlightLifetime ? "scale(1.03)" : "scale(1)",
                border: highlightLifetime ? "2px solid rgba(129,140,248,0.4)" : "2px solid transparent",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = `${highlightLifetime ? "scale(1.03)" : "scale(1)"} translateY(-8px)`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = highlightLifetime ? "scale(1.03)" : "scale(1)"; }}
            >
              {/* Ambient glows */}
              <div style={{
                position: "absolute", top: "-15%", right: "-15%", width: 250, height: 250,
                background: "rgba(99,102,241,0.2)", borderRadius: "50%", filter: "blur(50px)",
              }} />
              <div style={{
                position: "absolute", bottom: "-10%", left: "-10%", width: 180, height: 180,
                background: "rgba(139,92,246,0.12)", borderRadius: "50%", filter: "blur(40px)",
              }} />

              <div style={{ position: "relative", zIndex: 1, marginBottom: "2rem" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "1rem",
                }}>
                  <div style={{
                    fontSize: "0.8rem", fontWeight: 700, color: "#a5b4fc",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>Lifetime Ownership</div>
                  {highlightLifetime && (
                    <span style={{
                      padding: "0.25rem 0.75rem", borderRadius: "var(--radius-full)",
                      background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                      color: "white", fontSize: "0.65rem", fontWeight: 800,
                      border: "1px solid rgba(255,255,255,0.1)",
                      display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    }}>
                      <span style={{ color: "#fbbf24" }}>{Icons.flame}</span>
                      MOST POPULAR
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 600, color: "#a5b4fc" }}>₹</span>
                  <span style={{
                    fontSize: "3.5rem", fontWeight: 800,
                    fontFamily: "var(--font-display)", lineHeight: 1,
                  }}>8,000</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)", textDecoration: "line-through" }}>₹10,000</span>
                  <span style={{
                    padding: "0.15rem 0.6rem", borderRadius: "var(--radius-full)",
                    background: "rgba(16,185,129,0.15)", color: "#34d399",
                    fontSize: "0.7rem", fontWeight: 700,
                  }}>SAVE ₹2,000</span>
                </div>

                {/* Scarcity badge */}
                <div style={{
                  marginTop: "1.25rem",
                  display: "inline-flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.5rem 1rem",
                  background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)",
                  borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#f59e0b",
                    boxShadow: "0 0 10px rgba(245,158,11,0.5)",
                    animation: "pulse-dot 2s ease-in-out infinite",
                  }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fbbf24" }}>
                    Only {remainingSeats} seats left at this price
                  </span>
                </div>
              </div>

              {/* All 7 modules */}
              <div style={{ marginBottom: "1.5rem", padding: "1.25rem", background: "rgba(255,255,255,0.05)", borderRadius: "1rem", border: "1px solid rgba(165,180,252,0.15)", position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>All 7 modules included</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {["Smart Billing", "Inventory Control", "GST & Compliance", "Reports & Profit", "Customer & Credit", "Supplier Management", "Promotions"].map(m => (
                    <div key={m} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      {m}
                    </div>
                  ))}
                </div>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2.5rem 0", display: "grid", gap: "0.875rem", flex: 1, position: "relative", zIndex: 1 }}>
                <li style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(165,180,252,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Plan perks</li>
                {plans.lifetime.features.map((f) => (
                  <li key={f.text} style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    color: "rgba(255,255,255,0.85)", fontWeight: 500, fontSize: "0.9rem",
                  }}>
                    <div style={{
                      width: 20, height: 20,
                      background: "rgba(129,140,248,0.2)",
                      color: "#a5b4fc",
                      borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>

              <Link href="/download" className="btn-primary" style={{
                width: "100%", padding: "1rem", textAlign: "center",
                display: "block", fontWeight: 700, fontSize: "1rem",
                position: "relative", zIndex: 1,
              }}>
                Grab Lifetime Access →
              </Link>
            </div>
          </div>

          {/* Money-back guarantee */}
          <div
            className={cards.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
            style={{
              textAlign: "center", marginTop: "2.5rem",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981, #34d399)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#64748b" }}>
              7-day free trial · No credit card required · Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════ TRUST STATS ═══════════════ */}
      <section
        ref={trustSection.ref}
        style={{ padding: "5rem 0", background: "white" }}
      >
        <div className="section-container">
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem",
            maxWidth: "800px", margin: "0 auto",
          }}>
            {[
              { value: `${pharmacies.toLocaleString()}+`, label: "Pharmacies Trust Us", icon: Icons.store },
              { value: `${uptime}.9%`, label: "Uptime Record", icon: Icons.zap },
              { value: `${invoices}M+`, label: "Invoices Processed", icon: Icons.fileText },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={trustSection.inView ? "animate-fade-in-up" : "opacity-0"}
                style={{
                  animationDelay: `${0.1 + i * 0.12}s`,
                  textAlign: "center", padding: "2rem",
                  background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
                  borderRadius: "1.5rem",
                  transition: "all 0.3s ease", cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 16px 40px rgba(99,102,241,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ color: "#6366f1", marginBottom: "0.75rem", display: "flex", justifyContent: "center", transform: "scale(1.35)" }}>{stat.icon}</div>
                <div style={{
                  fontSize: "2rem", fontWeight: 800, color: "#0f172a",
                  fontFamily: "var(--font-display)",
                }}>{stat.value}</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", marginTop: "0.25rem" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ DETAILED COMPARISON TABLE ═══════════════ */}
      <section
        ref={comp.ref}
        style={{ padding: "7rem 0", background: "#f8fafc" }}
      >
        <div className="section-container" style={{ maxWidth: "900px" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div
              className={comp.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.9rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                What&apos;s Included
              </span>
            </div>
            <h2
              className={comp.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}
            >
              Full Feature Comparison
            </h2>
          </div>

          <div
            className={comp.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
            style={{
              background: "white", borderRadius: "2rem", overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)",
            }}
          >
            {/* Header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr",
              padding: "1.5rem 2rem",
              background: "linear-gradient(135deg, #1e1b4b, #312e81)", color: "white",
            }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.6)" }}>Feature</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>Annual</div>
                <div style={{ fontSize: "0.65rem", color: "#a5b4fc" }}>₹4,000/yr</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>Lifetime</div>
                <div style={{ fontSize: "0.65rem", color: "#fbbf24" }}>₹8,000 once</div>
              </div>
            </div>

            {/* Rows */}
            {comparisonFeatures.map((row, i) => (
              <div key={row.feature} style={{
                display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr",
                padding: "1.1rem 2rem",
                borderBottom: i === comparisonFeatures.length - 1 ? "none" : "1px solid rgba(0,0,0,0.04)",
                background: i % 2 === 0 ? "white" : "#fafbff",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#eef2ff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafbff"; }}
              >
                <div style={{ fontWeight: 600, color: "#334155", fontSize: "0.9rem" }}>{row.feature}</div>
                <div style={{
                  textAlign: "center", fontSize: "0.85rem", fontWeight: 600,
                  color: row.annual === "✗" ? "#cbd5e1" : "#475569",
                }}>{row.annual}</div>
                <div style={{
                  textAlign: "center", fontSize: "0.85rem", fontWeight: 700,
                  color: "#6366f1",
                }}>{row.lifetime}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ACCORDION ═══════════════ */}
      <section
        ref={faq.ref}
        style={{ padding: "7rem 0", background: "white" }}
      >
        <div className="section-container" style={{ maxWidth: "800px" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div
              className={faq.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.9rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>Support</span>
            </div>
            <h2
              className={faq.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}
            >Pricing FAQ</h2>
          </div>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            {faqItems.map((item, i) => (
              <div
                key={i}
                className={faq.inView ? "animate-fade-in-up" : "opacity-0"}
                style={{
                  animationDelay: `${0.1 + i * 0.06}s`,
                  borderRadius: "1.25rem",
                  border: openFaq === i ? "1px solid rgba(99,102,241,0.15)" : "1px solid rgba(0,0,0,0.04)",
                  background: openFaq === i ? "linear-gradient(135deg, #fafbff, #eef2ff)" : "#f8fafc",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%", padding: "1.25rem 1.5rem",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", border: "none", background: "transparent",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem" }}>{item.q}</span>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: openFaq === i ? "linear-gradient(135deg, #6366f1, #818cf8)" : "#e2e8f0",
                    color: openFaq === i ? "white" : "#94a3b8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.3s ease",
                    transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                    flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </button>
                <div style={{
                  maxHeight: openFaq === i ? "200px" : "0",
                  overflow: "hidden",
                  transition: "max-height 0.4s cubic-bezier(0.25,0.46,0.45,0.94)",
                }}>
                  <div style={{ padding: "0 1.5rem 1.25rem" }}>
                    <p style={{ color: "#64748b", lineHeight: 1.7, fontSize: "0.95rem" }}>{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section
        ref={cta.ref}
        style={{ padding: "6rem 0 8rem", background: "#f8fafc" }}
      >
        <div className="section-container">
          <div style={{
            background: "linear-gradient(135deg, #0c0a1f 0%, #1a1640 50%, #312e81 100%)",
            borderRadius: "3rem", padding: "5rem 3rem",
            textAlign: "center", position: "relative", overflow: "hidden",
          }}>
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

            {/* Grid */}
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
                  Ready to Start?
                </span>
              </div>

              <h2
                className={cta.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 800, color: "white", marginBottom: "1.5rem", lineHeight: 1.1 }}
              >Take the Next Step.</h2>
              <p
                className={cta.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
                style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto 3rem", lineHeight: 1.7 }}
              >
                Modernize your pharmacy with AI billing and offline-first reliability.
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
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @media (max-width: 768px) {
          .pricing-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1.6fr"] {
            grid-template-columns: 1.6fr 1fr 1fr !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
