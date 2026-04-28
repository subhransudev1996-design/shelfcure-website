"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Icons } from "@/components/Icons";

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
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "all" }}
    >
      <div style={{
        position: "absolute", left: pos.x - 200, top: pos.y - 200,
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 70%)",
        transition: "left 0.3s ease, top 0.3s ease",
        pointerEvents: "none",
      }} />
    </div>
  );
}

export default function CareersPage() {
  const hero = useInView(0.1);

  const openRoles = [
    {
      title: "Senior Full Stack Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-Time",
    },
    {
      title: "Machine Learning Engineer (NLP/OCR)",
      department: "AI & Data",
      location: "Remote",
      type: "Full-Time",
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-Time",
    },
    {
      title: "Customer Success Lead",
      department: "Operations",
      location: "Remote",
      type: "Full-Time",
    }
  ];

  const benefits = [
    {
      title: "Impactful Work",
      desc: "Every line of code you write directly helps pharmacists save time and improve patient outcomes.",
      icon: "❤️"
    },
    {
      title: "Remote Flexibility",
      desc: "Work from wherever you're most productive. We care about output, not hours spent at a desk.",
      icon: "🌍"
    },
    {
      title: "Health & Wellness",
      desc: "Comprehensive health insurance for you and your dependents, plus generous mental health leaves.",
      icon: "🏥"
    },
    {
      title: "Continuous Growth",
      desc: "Annual learning stipends and a culture that prioritizes mentorship and internal mobility.",
      icon: "📈"
    }
  ];

  return (
    <div style={{ background: "var(--color-surface)", overflow: "hidden", minHeight: "100vh" }}>
      {/* ───────────────────── HERO SECTION ───────────────────── */}
      <section
        ref={hero.ref}
        style={{
          paddingTop: "160px",
          paddingBottom: "5rem",
          position: "relative",
          background: "linear-gradient(180deg, #0c0a1f 0%, #110e2e 50%, #1a1640 100%)",
          color: "white",
          textAlign: "center",
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
              background: "#10b981", boxShadow: "0 0 12px #10b981",
              display: "inline-block",
            }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Join Our Team
            </span>
          </div>

          <h1
            className={hero.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              fontWeight: 800,
              lineHeight: 1.08,
              fontFamily: "var(--font-display)",
              color: "white",
              marginBottom: "1.5rem",
            }}
          >
            Help us cure <br />
            <span style={{
              background: "linear-gradient(135deg, #818cf8, #c7d2fe, #a78bfa)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "gradient-shift 4s ease-in-out infinite",
            }}>
              pharmacy chaos.
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
            We&apos;re a team of engineers, designers, and pharmacists building the AI-powered nervous system for modern healthcare retail.
          </p>
        </div>
      </section>

      {/* ───────────────────── WHITE BACKGROUND START ───────────────────── */}
      <div style={{ background: "white", position: "relative", zIndex: 20 }}>
        
        {/* Benefits Section */}
        <section style={{ padding: "4rem 0" }}>
          <div className="section-container">
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <h2 style={{ fontSize: "2.5rem", fontWeight: 700, color: "#1e293b" }}>Why ShelfCure?</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
              {benefits.map((b) => (
                <div key={b.title} style={{
                  background: "rgba(238,242,255,0.4)",
                  border: "1px solid rgba(99,102,241,0.1)",
                  borderRadius: "1.5rem",
                  padding: "2.5rem 2rem",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  cursor: "default"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 10px 40px rgba(99,102,241,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "1.5rem" }}>{b.icon}</div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem" }}>{b.title}</h3>
                  <p style={{ color: "#64748B", lineHeight: 1.6, fontSize: "0.95rem" }}>{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section style={{ padding: "3.5rem 0 4rem" }}>
          <div className="section-container" style={{ maxWidth: "800px" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 700, color: "#1e293b", marginBottom: "2.5rem" }}>Open Roles</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {openRoles.map((role) => (
                <Link key={role.title} href="#apply" style={{ textDecoration: "none" }}>
                  <div style={{
                    padding: "2rem",
                    background: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#818cf8";
                      e.currentTarget.style.boxShadow = "0 10px 25px rgba(99,102,241,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>{role.title}</h3>
                      <div style={{ display: "flex", gap: "1rem", color: "#64748B", fontSize: "0.85rem", fontWeight: 500, flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                          {role.department}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                          {role.location}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          {role.type}
                        </span>
                      </div>
                    </div>
                    <div style={{ color: "#4f46e5", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, fontSize: "0.9rem" }}>
                      Apply <span style={{ display: "inline-flex", width: "16px", height: "16px" }}>{Icons.arrowRight}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div style={{ marginTop: "4rem", textAlign: "center", padding: "3rem", background: "rgba(241,245,249,0.5)", borderRadius: "1.5rem" }}>
              <h4 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>Don&apos;t see a perfect fit?</h4>
              <p style={{ color: "#64748B", marginBottom: "1.5rem", fontSize: "0.95rem" }}>We&apos;re always looking for exceptional talent to join our mission.</p>
              <a href="mailto:info@shelfcure.com" style={{ 
                display: "inline-block", padding: "0.75rem 1.5rem", background: "white", 
                border: "1px solid #cbd5e1", borderRadius: "100px", color: "#0f172a", 
                fontWeight: 600, textDecoration: "none", fontSize: "0.9rem",
                transition: "box-shadow 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
              >
                Email us your resume
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
