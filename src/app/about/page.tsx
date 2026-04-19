"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTypewriter } from "@/components/HeroSection";

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

/* ═══════════════════════════════════════════════════════════
   ANIMATED COUNTER HOOK
   ═══════════════════════════════════════════════════════════ */
function useCounter(end: number, duration: number, start: boolean, suffix = "") {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, end, duration]);

  return `${value}${suffix}`;
}

/* ═══════════════════════════════════════════════════════════
   MOUSE GLOW COMPONENT
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
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "all" }}
    >
      <div style={{
        position: "absolute",
        left: pos.x - 200,
        top: pos.y - 200,
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 70%)",
        transition: "left 0.3s ease, top 0.3s ease",
        pointerEvents: "none",
      }} />
    </div>
  );
}

export default function About() {
  /* Reveal sections */
  const hero = useInView(0.1);
  const stats = useInView(0.3);
  const story = useInView(0.2);
  const timeline = useInView(0.15);
  const vision = useInView(0.2);
  const values = useInView(0.15);
  const team = useInView(0.2);
  const techStack = useInView(0.2);
  const cta = useInView(0.3);

  /* Animated counters */
  const pharmacies = useCounter(2500, 2000, stats.inView, "+");
  const uptime = useCounter(99, 1600, stats.inView, ".9%");
  const invoices = useCounter(12, 1800, stats.inView, "M+");
  const cities = useCounter(150, 1500, stats.inView, "+");

  /* Active value card */
  const [activeValue, setActiveValue] = useState<number | null>(null);

  /* Typing effect for hero */
  const displayText = useTypewriter(
    ["Empowering Pharmacies.", "Enriching Lives.", "Advancing Healthcare."],
    80,
    2000,
    40
  );

  return (
    <div style={{ background: "var(--color-surface)", overflow: "hidden" }}>

      {/* ───────────────────── HERO SECTION ───────────────────── */}
      <section
        ref={hero.ref}
        style={{
          paddingTop: "160px",
          paddingBottom: "7rem",
          position: "relative",
          background: "linear-gradient(180deg, #0c0a1f 0%, #110e2e 50%, #1a1640 100%)",
          color: "white",
          minHeight: "85vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Animated grid background */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Moving orbs */}
        <div className="animate-float" style={{
          position: "absolute", top: "15%", left: "8%",
          width: "300px", height: "300px",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />
        <div className="animate-float" style={{
          position: "absolute", bottom: "10%", right: "5%",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
          animationDelay: "3s",
        }} />
        <div className="animate-pulse-glow" style={{
          position: "absolute", top: "40%", right: "20%",
          width: "6px", height: "6px", borderRadius: "50%",
          background: "#818cf8",
        }} />
        <div className="animate-pulse-glow" style={{
          position: "absolute", top: "25%", left: "30%",
          width: "4px", height: "4px", borderRadius: "50%",
          background: "#c4b5fd",
          animationDelay: "1.5s",
        }} />

        <MouseGlow />

        <div className="section-container" style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
          <div
            className={hero.inView ? "animate-fade-in-up" : "opacity-0"}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.4rem 1rem",
              background: "rgba(99,102,241,0.1)",
              backdropFilter: "blur(12px)",
              borderRadius: "var(--radius-full)",
              border: "1px solid rgba(99,102,241,0.2)",
              marginBottom: "2rem",
            }}
          >
            <span style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: "#818cf8", boxShadow: "0 0 12px #818cf8",
              display: "inline-block",
            }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              About ShelfCure
            </span>
          </div>

          <h1
            className={hero.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
            style={{
              fontSize: "clamp(2.5rem, 5vw, 5rem)",
              fontWeight: 800,
              lineHeight: 1.08,
              fontFamily: "var(--font-display)",
              color: "white",
              marginBottom: "1.5rem",
            }}
          >
            Modernizing Pharmacy,<br />
            <span style={{
              background: "linear-gradient(135deg, #818cf8, #c7d2fe, #a78bfa)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "gradient-shift 4s ease-in-out infinite",
            }}>
              {displayText}
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
              fontSize: "1.2rem",
              color: "rgba(148, 163, 184, 0.9)",
              maxWidth: "700px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            We&apos;re on a mission to be the intelligence layer for healthcare retail — combining 
            deep pharmacy expertise with cutting-edge AI to make operations seamless.
          </p>

          {/* Scroll indicator */}
          <div
            className={hero.inView ? "animate-fade-in-up delay-500" : "opacity-0"}
            style={{
              marginTop: "4rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "rgba(148,163,184,0.5)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Scroll to explore
            </span>
            <div style={{
              width: "24px", height: "40px", borderRadius: "12px",
              border: "2px solid rgba(129,140,248,0.3)",
              display: "flex", justifyContent: "center", paddingTop: "8px",
            }}>
              <div style={{
                width: "3px", height: "8px", borderRadius: "3px",
                background: "#818cf8",
                animation: "scroll-bounce 2s ease-in-out infinite",
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── IMPACT STATS ───────────────────── */}
      <section
        ref={stats.ref}
        style={{
          padding: "5rem 0",
          background: "linear-gradient(180deg, #1a1640 0%, #0c0a1f 30%, #0c0a1f 70%, white 100%)",
          position: "relative",
        }}
      >
        <div className="section-container">
          <div
            className={stats.inView ? "animate-fade-in-up" : "opacity-0"}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1.5rem",
            }}
          >
            {[
              { value: pharmacies, label: "Pharmacies", icon: "🏪", gradient: "linear-gradient(135deg, #6366f1, #818cf8)" },
              { value: uptime, label: "Uptime SLA", icon: "⚡", gradient: "linear-gradient(135deg, #818cf8, #a5b4fc)" },
              { value: invoices, label: "Invoices Processed", icon: "📄", gradient: "linear-gradient(135deg, #a78bfa, #c4b5fd)" },
              { value: cities, label: "Cities Covered", icon: "🌍", gradient: "linear-gradient(135deg, #7c3aed, #a78bfa)" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={stats.inView ? "animate-fade-in-up" : "opacity-0"}
                style={{
                  animationDelay: `${0.1 + i * 0.1}s`,
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(129,140,248,0.12)",
                  borderRadius: "1.5rem",
                  padding: "2rem 1.5rem",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  cursor: "default",
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
                <div style={{
                  position: "absolute", top: "-30px", right: "-30px",
                  width: "100px", height: "100px", borderRadius: "50%",
                  background: stat.gradient, opacity: 0.08,
                }} />
                <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{stat.icon}</div>
                <div style={{
                  fontSize: "2.5rem", fontWeight: 800, lineHeight: 1,
                  background: stat.gradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "var(--font-display)",
                  marginBottom: "0.4rem",
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────── THE STORY SECTION ───────────────────── */}
      <section
        ref={story.ref}
        style={{
          padding: "8rem 0",
          background: "white",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="section-container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "5rem",
            alignItems: "center",
          }}>
            <div className={story.inView ? "animate-fade-in-up" : "opacity-0"}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.9rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.5rem",
              }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>Our Origin</span>
              </div>

              <h2 style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 700,
                color: "#0f172a",
                lineHeight: 1.2,
                marginBottom: "2rem",
              }}>
                From Pharmacy Floors to <span style={{ color: "#6366f1" }}>Code Repositories.</span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", color: "#64748b", fontSize: "1.1rem", lineHeight: 1.8 }}>
                <p>
                  ShelfCure was born out of a simple observation: pharmacists spend more time managing paper trails and inventory spreadsheets than they do talking to their patients.
                </p>
                <p>
                  Our founders, a team of pharmacists and software engineers, realized that the tools available were either too complex or hopelessly outdated. We decided to build the tool we wished we had.
                </p>
                <p>
                  Today, ShelfCure is used by thousands of pharmacies to automate billing, track batches, and ensure compliance — without the headache of manual entry.
                </p>
              </div>
            </div>

            <div 
              className={story.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
              style={{ position: "relative" }}
            >
              {/* Decorative graphic: Neural/Circuit box */}
              <div style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                borderRadius: "2rem",
                padding: "3rem",
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.02)",
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  opacity: 0.05,
                  backgroundImage: "radial-gradient(#6366f1 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }} />
                
                <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                   {[
                     { label: "Founded", value: "2022", icon: "🚀", accent: "#6366f1" },
                     { label: "Pharmacies", value: "2,500+", icon: "🏪", accent: "#8b5cf6" },
                     { label: "Support", value: "24/7", icon: "🛠️", accent: "#a78bfa" },
                   ].map((item, i) => (
                     <div key={item.label} style={{
                       display: "flex", alignItems: "center", gap: "1.25rem",
                       padding: "1.25rem", background: "white", borderRadius: "1rem",
                       boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                       transform: `translateX(${i * 20}px)`,
                       transition: "all 0.3s ease",
                       cursor: "default",
                       borderLeft: `4px solid ${item.accent}`,
                     }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.transform = `translateX(${i * 20 + 8}px)`;
                       e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.1)";
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.transform = `translateX(${i * 20}px)`;
                       e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.03)";
                     }}
                     >
                        <span style={{ fontSize: "1.5rem" }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{item.label}</div>
                          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b" }}>{item.value}</div>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              {/* Floating badge */}
              <div className="animate-float" style={{
                position: "absolute", top: "-20px", right: "-10px",
                background: "linear-gradient(135deg, #6366f1, #818cf8)",
                color: "white",
                padding: "0.75rem 1.25rem",
                borderRadius: "var(--radius-full)",
                boxShadow: "0 10px 30px rgba(99,102,241,0.3)",
                fontSize: "0.8rem",
                fontWeight: 700,
                zIndex: 5,
              }}>
                ✨ Made in India
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── JOURNEY TIMELINE ───────────────────── */}
      <section
        ref={timeline.ref}
        style={{
          padding: "7rem 0",
          background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
          position: "relative",
        }}
      >
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div
              className={timeline.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.9rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>Our Journey</span>
            </div>
            <h2
              className={timeline.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}
            >
              Milestones that shaped us
            </h2>
          </div>

          <div style={{ position: "relative", maxWidth: "800px", margin: "0 auto" }}>
            {/* Central line */}
            <div style={{
              position: "absolute", left: "50%", top: 0, bottom: 0,
              width: "2px",
              background: "linear-gradient(180deg, rgba(99,102,241,0.3), rgba(99,102,241,0.05))",
              transform: "translateX(-50%)",
            }} />

            {[
              { year: "2022", title: "The Spark", desc: "Founded by a team of pharmacists tired of outdated POS systems.", icon: "💡", side: "left" },
              { year: "2023", title: "AI Integration", desc: "Launched Gemini-powered invoice scanning — 10x faster than manual.", icon: "🤖", side: "right" },
              { year: "2024", title: "Scaling Up", desc: "Crossed 1,000 pharmacies. Introduced offline-first architecture.", icon: "📈", side: "left" },
              { year: "2025", title: "National Reach", desc: "2,500+ pharmacies in 150+ cities. Mobile scanner feature launched.", icon: "🚀", side: "right" },
            ].map((item, i) => (
              <div
                key={item.year}
                className={timeline.inView ? "animate-fade-in-up" : "opacity-0"}
                style={{
                  animationDelay: `${0.15 + i * 0.2}s`,
                  display: "flex",
                  justifyContent: item.side === "left" ? "flex-end" : "flex-start",
                  paddingLeft: item.side === "right" ? "calc(50% + 2rem)" : "0",
                  paddingRight: item.side === "left" ? "calc(50% + 2rem)" : "0",
                  marginBottom: i < 3 ? "3rem" : "0",
                  position: "relative",
                }}
              >
                {/* Node dot */}
                <div style={{
                  position: "absolute", left: "50%", top: "1.5rem",
                  width: "16px", height: "16px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #818cf8)",
                  border: "3px solid white",
                  boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                  transform: "translateX(-50%)",
                  zIndex: 2,
                }} />

                <div style={{
                  background: "white",
                  borderRadius: "1.5rem",
                  padding: "2rem",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  border: "1px solid rgba(99,102,241,0.08)",
                  maxWidth: "340px",
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 16px 40px rgba(99,102,241,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.04)";
                }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>{item.icon}</span>
                    <span style={{
                      fontSize: "0.75rem", fontWeight: 700, color: "#6366f1",
                      background: "rgba(99,102,241,0.08)", padding: "0.25rem 0.75rem",
                      borderRadius: "var(--radius-full)",
                    }}>{item.year}</span>
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>{item.title}</h3>
                  <p style={{ fontSize: "0.95rem", color: "#64748b", lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────── VISION & MISSION BENTO ───────────────────── */}
      <section
        ref={vision.ref}
        style={{
          padding: "7rem 0",
          background: "white",
        }}
      >
        <div className="section-container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
          }}>
            {/* Vision Card */}
            <div
              className={vision.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                borderRadius: "2rem",
                padding: "3.5rem",
                color: "white",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.4s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "200px", height: "200px", background: "rgba(99,102,241,0.2)", borderRadius: "50%", filter: "blur(40px)" }} />
              <div className="animate-pulse-glow" style={{ position: "absolute", bottom: "20%", left: "15%", width: "6px", height: "6px", borderRadius: "50%", background: "#a5b4fc" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  width: "56px", height: "56px", background: "rgba(255,255,255,0.1)",
                  borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.75rem", marginBottom: "1.5rem",
                  backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)",
                }}>🔭</div>
                <h3 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1.25rem" }}>Our Vision</h3>
                <p style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>
                  To be the global intelligence layer for healthcare retail, transforming every local pharmacy into a center of technological excellence.
                </p>
                <div style={{
                  marginTop: "2rem", display: "flex", gap: "0.5rem", flexWrap: "wrap",
                }}>
                  {["Intelligence", "Global Scale", "Innovation"].map(tag => (
                    <span key={tag} style={{
                      padding: "0.3rem 0.8rem", borderRadius: "var(--radius-full)",
                      background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "0.7rem", fontWeight: 600, color: "rgba(255,255,255,0.6)",
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Mission Card */}
            <div
              className={vision.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{
                background: "white",
                borderRadius: "2rem",
                padding: "3.5rem",
                border: "1px solid rgba(0,0,0,0.05)",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 20px 40px rgba(0,0,0,0.03)",
                transition: "transform 0.4s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <div style={{
                position: "absolute", bottom: "-20%", right: "-10%",
                width: "200px", height: "200px",
                background: "rgba(99,102,241,0.05)", borderRadius: "50%", filter: "blur(40px)",
              }} />
              <div style={{
                width: "56px", height: "56px", background: "rgba(99,102,241,0.1)",
                borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.75rem", marginBottom: "1.5rem"
              }}>🎯</div>
              <h3 style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a", marginBottom: "1.25rem" }}>Our Mission</h3>
              <p style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "#64748b" }}>
                To eliminate operational friction for pharmacists through AI automation, allowing them to focus on what matters most: patient health and safety.
              </p>
              <div style={{
                marginTop: "2rem", display: "flex", gap: "0.5rem", flexWrap: "wrap",
              }}>
                {["AI Automation", "Patient First", "Compliance"].map(tag => (
                  <span key={tag} style={{
                    padding: "0.3rem 0.8rem", borderRadius: "var(--radius-full)",
                    background: "rgba(99,102,241,0.06)",
                    fontSize: "0.7rem", fontWeight: 600, color: "#6366f1",
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── CORE VALUES ───────────────────── */}
      <section
        ref={values.ref}
        style={{
          padding: "8rem 0",
          background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%)",
          position: "relative",
        }}
      >
        {/* Background dots */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }} />

        <div className="section-container" style={{ position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div
              className={values.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.35rem 0.9rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>Our DNA</span>
            </div>
            <h2
              className={values.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0f172a" }}
            >
              Values That Drive Us
            </h2>
            <p
              className={values.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
              style={{ color: "#64748b", marginTop: "1rem", fontSize: "1.1rem" }}
            >
              The principles we live by every single day.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "2rem",
          }}>
            {[
              {
                title: "Pharmacist-First",
                desc: "We build for the person behind the counter, not just the business. Every feature starts with their workflow.",
                icon: "🩺",
                gradient: "linear-gradient(135deg, #6366f1, #818cf8)",
              },
              {
                title: "Relentless Innovation",
                desc: "We push the boundaries of what's possible with AI in healthcare. Status quo isn't good enough.",
                icon: "💡",
                gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
              },
              {
                title: "Absolute Integrity",
                desc: "When it comes to patient data and compliance, there are no shortcuts. Trust is non-negotiable.",
                icon: "🛡️",
                gradient: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
              },
              {
                title: "Speed of Execution",
                desc: "Healthcare doesn't wait, and neither do we. Ship fast, iterate faster, and always deliver quality.",
                icon: "⚡",
                gradient: "linear-gradient(135deg, #6366f1, #a78bfa)",
              },
              {
                title: "Data-Driven Decisions",
                desc: "Every product decision is backed by real pharmacy data, user feedback, and measurable outcomes.",
                icon: "📊",
                gradient: "linear-gradient(135deg, #818cf8, #c4b5fd)",
              },
              {
                title: "Community Over Clients",
                desc: "We build a community of pharmacists who grow together. Your success is our success.",
                icon: "🤝",
                gradient: "linear-gradient(135deg, #a78bfa, #6366f1)",
              },
            ].map((value, i) => (
              <div
                key={value.title}
                className={values.inView ? "animate-fade-in-up" : "opacity-0"}
                style={{
                  animationDelay: `${0.1 + i * 0.1}s`,
                  padding: "2.5rem",
                  borderRadius: "1.5rem",
                  background: activeValue === i 
                    ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)" 
                    : "white",
                  border: activeValue === i ? "none" : "1px solid rgba(0,0,0,0.04)",
                  boxShadow: activeValue === i 
                    ? "0 20px 60px rgba(99,102,241,0.2)" 
                    : "0 4px 12px rgba(0,0,0,0.02)",
                  transition: "all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={() => setActiveValue(i)}
                onMouseLeave={() => setActiveValue(null)}
              >
                {activeValue === i && (
                  <div style={{
                    position: "absolute", top: "-30%", right: "-20%",
                    width: "200px", height: "200px",
                    background: "rgba(129,140,248,0.15)", borderRadius: "50%",
                    filter: "blur(30px)", pointerEvents: "none",
                  }} />
                )}
                <div style={{
                  fontSize: "2.25rem", marginBottom: "1.25rem",
                  transition: "transform 0.3s ease",
                  transform: activeValue === i ? "scale(1.2)" : "scale(1)",
                }}>{value.icon}</div>
                <h3 style={{
                  fontSize: "1.25rem", fontWeight: 700,
                  color: activeValue === i ? "white" : "#0f172a",
                  marginBottom: "0.75rem",
                  transition: "color 0.3s ease",
                }}>{value.title}</h3>
                <p style={{
                  color: activeValue === i ? "rgba(255,255,255,0.7)" : "#64748b",
                  lineHeight: 1.6,
                  transition: "color 0.3s ease",
                }}>{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────── EDITORIAL TEAM SECTION ───────────────────── */}
      <section
        ref={team.ref}
        style={{
          padding: "8rem 0",
          background: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle gradient orb */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }} />

        <div className="section-container">
           <div style={{
             textAlign: "center",
             position: "relative",
             maxWidth: "900px",
             margin: "0 auto",
           }}>
            <div style={{
              position: "absolute", top: "-40px", left: "50%", transform: "translateX(-50%)",
              fontSize: "8rem", lineHeight: 1,
              fontFamily: "Georgia, serif", color: "rgba(99,102,241, 0.06)",
              fontWeight: 700, pointerEvents: "none", userSelect: "none",
            }}>
              &ldquo;
            </div>

            <h2
              className={team.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                lineHeight: 1.4,
                fontWeight: 500,
                color: "#2C3549",
                position: "relative",
              }}
            >
              Building a team that understands both{" "}
              <span style={{
                fontWeight: 700, color: "#4f46e5",
                position: "relative",
              }}>
                pharmacology
                <span style={{
                  position: "absolute", bottom: "2px", left: "-2px", right: "-2px",
                  height: "12px", background: "rgba(165,180,252,0.3)", borderRadius: "4px",
                  zIndex: -1,
                }} />
              </span> and{" "}
              <span style={{
                fontWeight: 700, color: "#4f46e5",
                position: "relative",
              }}>
                deep learning
                <span style={{
                  position: "absolute", bottom: "2px", left: "-2px", right: "-2px",
                  height: "12px", background: "rgba(165,180,252,0.3)", borderRadius: "4px",
                  zIndex: -1,
                }} />
              </span> wasn&apos;t easy — but it was necessary to build the future of pharmacy.
            </h2>

            <div 
              className={team.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "1rem", marginTop: "3rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                {[
                  "https://i.pravatar.cc/100?img=33",
                  "https://i.pravatar.cc/100?img=47",
                  "https://i.pravatar.cc/100?img=12",
                  "https://i.pravatar.cc/100?img=22",
                  "https://i.pravatar.cc/100?img=56",
                ].map((src, i) => (
                  <div
                    key={src}
                    style={{ position: "relative", zIndex: 10 - i }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt="team member"
                      width={48}
                      height={48}
                      style={{
                        borderRadius: "50%",
                        border: "3px solid #fff",
                        marginLeft: i > 0 ? "-12px" : "0",
                        boxShadow: "0 4px 12px rgba(99,102,241,0.08)",
                        background: "white",
                        display: "block",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1E293B" }}>
                  The ShelfCure Collective
                </div>
                <div style={{ fontSize: "0.8rem", color: "#94A3B8", fontWeight: 500 }}>
                  25+ Pharmacists &amp; Engineers
                </div>
              </div>
            </div>

            {/* Team composition */}
            <div
              className={team.inView ? "animate-fade-in-up delay-300" : "opacity-0"}
              style={{
                marginTop: "3rem",
                display: "flex",
                justifyContent: "center",
                gap: "2rem",
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "Pharmacists", count: "8", color: "#6366f1" },
                { label: "Engineers", count: "12", color: "#818cf8" },
                { label: "AI / ML", count: "3", color: "#a78bfa" },
                { label: "Design", count: "2", color: "#c4b5fd" },
              ].map(role => (
                <div key={role.label} style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.75rem 1.5rem",
                  background: "#f8fafc",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid rgba(0,0,0,0.04)",
                }}>
                  <div style={{
                    width: "10px", height: "10px", borderRadius: "50%",
                    background: role.color,
                  }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{role.count}</span>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{role.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── TECHNOLOGY STACK MARQUEE ───────────────────── */}
      <section
        ref={techStack.ref}
        style={{
          padding: "5rem 0",
          background: "linear-gradient(180deg, #f0f4ff 0%, #eef2ff 100%)",
          overflow: "hidden",
        }}
      >
        <div className="section-container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h3
              className={techStack.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem",
              }}
            >
              Built with Modern Technology
            </h3>
            <p
              className={techStack.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{ color: "#64748b", fontSize: "0.95rem" }}
            >
              Enterprise-grade stack. Startup-speed execution.
            </p>
          </div>
        </div>

        <div style={{
          overflow: "hidden",
          maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
        }}>
          <div className="tech-marquee-track" style={{
            display: "flex", alignItems: "center", gap: "2rem",
            width: "max-content",
          }}>
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                {[
                  "Rust + Tauri", "SQLite", "React", "TypeScript", "Gemini AI",
                  "WebSockets", "Supabase", "Next.js", "Tailwind CSS", "GPT Vision",
                ].map((tech) => (
                  <div key={`${setIndex}-${tech}`} style={{
                    padding: "0.75rem 1.5rem",
                    background: "rgba(255,255,255,0.8)",
                    border: "1px solid rgba(99,102,241,0.08)",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#334155",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    backdropFilter: "blur(8px)",
                    transition: "all 0.2s ease",
                  }}>
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #6366f1, #818cf8)",
                    }} />
                    {tech}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────── CTA SECTION ───────────────────── */}
      <section
        ref={cta.ref}
        style={{
          padding: "8rem 0",
          background: "white",
        }}
      >
        <div className="section-container">
          <div style={{
            background: "linear-gradient(135deg, #0c0a1f 0%, #1a1640 50%, #312e81 100%)",
            borderRadius: "3rem",
            padding: "5rem 3rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Animated orbs */}
            <div className="animate-float" style={{
              position: "absolute", top: "-50%", left: "-10%", width: "400px", height: "400px",
              background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", filter: "blur(60px)"
            }} />
            <div className="animate-float" style={{
              position: "absolute", bottom: "-40%", right: "-5%", width: "350px", height: "350px",
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
                  background: "rgba(129,140,248,0.15)",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid rgba(129,140,248,0.2)",
                  marginBottom: "2rem",
                }}
              >
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Get Started Today
                </span>
              </div>

              <h2
                className={cta.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
                style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 800, color: "white", marginBottom: "1.5rem", lineHeight: 1.1 }}
              >
                Join the Mission.
              </h2>
              <p
                className={cta.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
                style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto 3rem", lineHeight: 1.7 }}
              >
                Whether you&apos;re a pharmacy owner or a builder looking to make a difference, we&apos;d love to have you.
              </p>
              <div
                className={cta.inView ? "animate-fade-in-up delay-300" : "opacity-0"}
                style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}
              >
                 <Link href="/download" className="btn-primary" style={{ padding: "1rem 2.5rem" }}>
                   Get Started Free
                 </Link>
                 <Link href="/contact" className="btn-secondary" style={{ padding: "1rem 2.5rem", color: "white", background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.15)" }}>
                   Contact Us
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
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes scroll-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(8px); opacity: 1; }
        }
        @keyframes tech-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .tech-marquee-track {
          animation: tech-scroll 35s linear infinite;
        }
        .tech-marquee-track:hover {
          animation-play-state: paused;
        }

        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          div[style*="padding-left: calc(50%"],
          div[style*="padding-right: calc(50%"] {
            padding-left: 2.5rem !important;
            padding-right: 0 !important;
          }
        }

        @media (max-width: 480px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
