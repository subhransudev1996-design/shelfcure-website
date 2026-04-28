"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/Icons";
import { HeroSection } from "@/components/HeroSection";
import { FeatureSetSection } from "@/components/FeatureSetSection";

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
  const aiFeatures = useInView(0.15);

  return (
    <>
      {/* ───────────────────── HERO ───────────────────── */}
      <HeroSection heroRef={hero.ref} inView={hero.inView} />


      {/* ───────────────────── SOCIAL PROOF + IMPACT ───────────────────── */}
      <section
        ref={mission.ref}
        style={{
          padding: "clamp(2rem, 4vw, 3.5rem) 0 clamp(2rem, 4vw, 4rem) 0",
          background: "linear-gradient(180deg, #0c0a1f 0%, #1a1640 8%, #eef2ff 25%, #f0f4ff 50%, #eef2ff 100%)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "100px",
          background: "linear-gradient(180deg, rgba(99,102,241,0.05) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />

        {/* ── Infinite logo marquee ── */}
        <div
          className={mission.inView ? "animate-fade-in-up" : "opacity-0"}
          style={{ marginBottom: "4rem" }}
        >
          <p style={{
            textAlign: "center", fontSize: "0.75rem", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.15em",
            color: "#94A3B8", marginBottom: "1.75rem",
          }}>
            Trusted by pharmacies across India
          </p>
          <div className="marquee-container" style={{
            overflow: "hidden", position: "relative",
            maskImage: "linear-gradient(90deg, transparent, black 15%, black 85%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, black 15%, black 85%, transparent)",
          }}>
            <div className="marquee-track" style={{
              display: "flex", alignItems: "center", gap: "3.5rem",
              width: "max-content",
            }}>
              {[...Array(2)].map((_, setIndex) => (
                <div key={setIndex} style={{ display: "flex", alignItems: "center", gap: "3.5rem" }}>
                  {[
                    "Apollo Pharmacy", "MedPlus", "Netmeds", "PharmEasy", "1mg",
                    "Wellness Forever", "Guardian", "Noble Plus", "Health Mart", "CarePoint",
                  ].map((brand) => (
                    <div key={`${setIndex}-${brand}`} style={{
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      padding: "0.625rem 1.25rem",
                      background: "rgba(255,255,255,0.7)",
                      border: "1px solid rgba(99,102,241,0.06)",
                      borderRadius: "var(--radius-full)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      backdropFilter: "blur(8px)",
                    }}>
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "8px",
                        background: `hsl(${brand.length * 25 + 220}, 70%, 94%)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.7rem", fontWeight: 800,
                        color: `hsl(${brand.length * 25 + 220}, 60%, 45%)`,
                      }}>
                        {brand.charAt(0)}
                      </div>
                      <span style={{
                        fontSize: "0.85rem", fontWeight: 600, color: "#475569",
                        letterSpacing: "-0.01em",
                      }}>
                        {brand}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Impact stats row ── */}
        <div className="section-container">
          <div
            className={`stats-impact-grid ${mission.inView ? "animate-fade-in-up delay-200" : "opacity-0"}`}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.5rem",
              marginBottom: "4.5rem",
            }}
          >
            {[
              {
                value: "10x",
                label: "Faster Invoice Entry",
                desc: "vs. manual typing",
                gradient: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
              },
              {
                value: "98.2%",
                label: "Inventory Accuracy",
                desc: "automated batch tracking",
                gradient: "linear-gradient(135deg, #818cf8 0%, #a5b4fc 100%)",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
              },
              {
                value: "₹0",
                label: "Hardware Required",
                desc: "use your phone as scanner",
                gradient: "linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%)",
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>,
              },
            ].map((stat, i) => (
              <div
                key={stat.value}
                className={mission.inView ? "animate-fade-in-up" : "opacity-0"}
                style={{
                  animationDelay: `${0.3 + i * 0.15}s`,
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(0,0,0,0.04)",
                  borderRadius: "1.5rem",
                  padding: "2.25rem 2rem",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 20px 40px rgba(99,102,241,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  position: "absolute", top: "-30px", right: "-30px",
                  width: "120px", height: "120px", borderRadius: "50%",
                  background: stat.gradient, opacity: 0.06,
                  pointerEvents: "none",
                }} />

                <div style={{
                  width: "52px", height: "52px", borderRadius: "16px",
                  background: stat.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 1.25rem",
                  boxShadow: "0 8px 24px rgba(99,102,241,0.25)",
                }}>
                  {stat.icon}
                </div>

                <div style={{
                  fontSize: "2.75rem", fontWeight: 800, lineHeight: 1,
                  color: "#0f172a",
                  fontFamily: "var(--font-display)",
                  marginBottom: "0.5rem",
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 600, color: "#1E293B", marginBottom: "0.25rem" }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#94A3B8", fontWeight: 500 }}>
                  {stat.desc}
                </div>
              </div>
            ))}
          </div>

          {/* ── Editorial mission statement ── */}
          <div
            className={mission.inView ? "animate-fade-in-up delay-400" : "opacity-0"}
            style={{
              textAlign: "center",
              position: "relative",
              maxWidth: "900px",
              margin: "0 auto",
            }}
          >
            <div style={{
              position: "absolute", top: "-40px", left: "50%", transform: "translateX(-50%)",
              fontSize: "8rem", lineHeight: 1,
              fontFamily: "Georgia, serif", color: "rgba(99,102,241, 0.06)",
              fontWeight: 700, pointerEvents: "none", userSelect: "none",
            }}>
              &ldquo;
            </div>

            <h2
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                lineHeight: 1.4,
                fontWeight: 500,
                color: "#2C3549",
                position: "relative",
              }}
            >
              We&apos;re building software that{" "}
              <span style={{ position: "relative", display: "inline" }}>
                <span style={{ position: "relative", zIndex: 1, fontWeight: 700, color: "#4f46e5" }}>eliminates busywork</span>
                <span style={{ position: "absolute", bottom: "2px", left: "-2px", right: "-2px", height: "12px", background: "rgba(165,180,252,0.3)", borderRadius: "4px", zIndex: 0 }} />
              </span>{" "}
              from pharmacy operations — so pharmacists can focus on what truly matters:{" "}
              <span style={{ position: "relative", display: "inline" }}>
                <span style={{ position: "relative", zIndex: 1, fontWeight: 700, color: "#4f46e5" }}>patient care</span>
                <span style={{ position: "absolute", bottom: "2px", left: "-2px", right: "-2px", height: "12px", background: "rgba(165,180,252,0.3)", borderRadius: "4px", zIndex: 0 }} />
              </span>.
            </h2>

            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "1rem", marginTop: "2.5rem",
            }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {[
                  "https://i.pravatar.cc/100?img=33",
                  "https://i.pravatar.cc/100?img=47",
                  "https://i.pravatar.cc/100?img=12",
                ].map((src, i) => (
                  <div
                    key={src}
                    className={mission.inView ? "animate-fade-in-up" : "opacity-0"}
                    style={{
                      animationDelay: `${0.6 + i * 0.1}s`,
                      position: "relative", zIndex: 10 - i,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt="team member"
                      width={44}
                      height={44}
                      style={{
                        borderRadius: "50%",
                        border: "3px solid #f0f4ff",
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
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1E293B" }}>
                  Built by pharmacists & engineers
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: 500 }}>
                  Team ShelfCure
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee CSS */}
        <style>{`
          @keyframes marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-track {
            animation: marquee-scroll 30s linear infinite;
          }
          .marquee-track:hover {
            animation-play-state: paused;
          }
          @media (max-width: 768px) {
            .marquee-track { animation-duration: 20s; }
          }
          @media (max-width: 640px) {
            .stats-impact-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>

      {/* ───────────────────── ADVANCED FEATURES GRID ───────────────────── */}
      <section
        ref={featuresGrid.ref}
        style={{
          padding: "clamp(2rem, 4vw, 3.5rem) 0 clamp(2.5rem, 5vw, 5rem) 0",
          position: "relative",
          zIndex: 10,
          background: "linear-gradient(180deg, #eef2ff 0%, #e8ecff 40%, #eef2ff 100%)",
        }}
      >
        {/* Background decorative grid dots */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }} />

        <div className="section-container" style={{ position: "relative" }}>

          {/* Section Header */}
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div
              className={featuresGrid.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.4rem 1rem 0.4rem 0.5rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{
                background: "linear-gradient(135deg, #818cf8, #6366f1)", color: "white",
                borderRadius: "var(--radius-full)", width: "24px", height: "24px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              </span>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Core Features
              </span>
            </div>

            <h2
              className={featuresGrid.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700,
                color: "#0f172a", lineHeight: 1.2,
                maxWidth: "700px", margin: "0 auto",
              }}
            >
              Everything you need to{" "}
              <span style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>run your pharmacy</span>
            </h2>
            <p
              className={featuresGrid.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
              style={{
                fontSize: "1.1rem", color: "#64748B", maxWidth: "560px",
                margin: "1.25rem auto 0", lineHeight: 1.7,
              }}
            >
              AI-powered tools that automate billing, inventory, and compliance — so you can serve more patients with less effort.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="features-bento" style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "auto auto",
            gap: "1.5rem",
            maxWidth: "1140px",
            margin: "0 auto",
          }}>

            {/* ── Card 1 (Hero card — spans full width) ── */}
            <div
              className={`features-card ${featuresGrid.inView ? "animate-fade-in-up" : "opacity-0"}`}
              style={{
                gridColumn: "1 / -1",
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #1e1b4b 100%)",
                borderRadius: "1.75rem",
                padding: "3rem",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "3rem",
                alignItems: "center",
                position: "relative",
                overflow: "hidden",
                minHeight: "400px",
                animationDelay: "0.1s",
              }}
            >
              {/* Ambient glow */}
              <div style={{
                position: "absolute", top: "-50%", right: "-20%",
                width: "500px", height: "500px", borderRadius: "50%",
                background: "radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", bottom: "-30%", left: "-10%",
                width: "400px", height: "400px", borderRadius: "50%",
                background: "radial-gradient(circle, rgba(165,180,252,0.1) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              {/* Left content */}
              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.35rem 0.9rem",
                  background: "rgba(129,140,248,0.15)", borderRadius: "var(--radius-full)",
                  marginBottom: "1.25rem",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.06em" }}>AI-Powered</span>
                </div>

                <h3 style={{
                  fontSize: "1.8rem", fontWeight: 700, color: "white",
                  lineHeight: 1.3, marginBottom: "1rem",
                }}>
                  Invoice Extraction<br />Engine
                </h3>
                <p style={{
                  fontSize: "1rem", color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.7, marginBottom: "1.75rem",
                }}>
                  Point your camera at any GST bill — Gemini AI reads every line, splits taxes, catches anomalies, and maps it to inventory in seconds.
                </p>

                {/* Feature pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {["OCR Scan", "GST Auto-Split", "Batch Mapping", "Anomaly Detection"].map((f) => (
                    <span key={f} style={{
                      padding: "0.35rem 0.85rem", borderRadius: "var(--radius-full)",
                      background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.7)",
                    }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right — Interactive mock UI */}
              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{
                  background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "1.25rem", padding: "1.5rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "12px",
                      background: "linear-gradient(135deg, #818cf8, #6366f1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {Icons.sparkle}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Gemini OCR</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "white" }}>Invoice #GST-2847</div>
                    </div>
                    <div style={{
                      marginLeft: "auto", padding: "0.2rem 0.6rem",
                      background: "rgba(129,140,248,0.15)", borderRadius: "var(--radius-full)",
                      fontSize: "0.65rem", fontWeight: 700, color: "#a5b4fc",
                    }}>
                      ✓ Verified
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.25rem" }}>
                    {["HSN", "Batches", "GST Split", "Totals"].map((step, i) => (
                      <div key={step} style={{
                        flex: 1, textAlign: "center", padding: "0.4rem 0",
                        background: i < 3 ? "rgba(129,140,248,0.12)" : "rgba(255,255,255,0.05)",
                        borderRadius: "0.4rem",
                        fontSize: "0.65rem", fontWeight: 600,
                        color: i < 3 ? "#a5b4fc" : "rgba(255,255,255,0.3)",
                      }}>
                        {i < 3 ? "✓ " : ""}{step}
                      </div>
                    ))}
                  </div>

                  {[
                    { name: "Paracetamol 500mg", batch: "B-2847", qty: "100 strips", status: "mapped" },
                    { name: "Amoxicillin 250mg", batch: "B-1038", qty: "50 strips", status: "corrected" },
                  ].map((item, i) => (
                    <div key={item.name} className={featuresGrid.inView ? "animate-fade-in-up" : "opacity-0"} style={{
                      animationDelay: `${0.6 + i * 0.15}s`,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "0.75rem", padding: "0.75rem 1rem",
                      marginBottom: "0.5rem",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "white" }}>{item.name}</div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{item.batch} · {item.qty}</div>
                      </div>
                      <span style={{
                        padding: "0.15rem 0.5rem", borderRadius: "var(--radius-full)",
                        fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase",
                        background: item.status === "mapped" ? "rgba(129,140,248,0.12)" : "rgba(251,146,60,0.15)",
                        color: item.status === "mapped" ? "#a5b4fc" : "#fb923c",
                      }}>
                        {item.status}
                      </span>
                    </div>
                  ))}

                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginTop: "1rem", padding: "0.75rem 1rem",
                    background: "rgba(129,140,248,0.08)", borderRadius: "0.75rem",
                    border: "1px solid rgba(129,140,248,0.15)",
                  }}>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Total extracted</span>
                    <span style={{ fontSize: "1rem", fontWeight: 800, color: "#a5b4fc" }}>32 items</span>
                  </div>
                </div>

                <div className="animate-float" style={{
                  position: "absolute", bottom: "-16px", left: "-20px",
                  background: "white", padding: "0.6rem 1rem",
                  borderRadius: "var(--radius-full)", boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                  display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 3,
                  animationDelay: "1.5s",
                }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#e0e7ff", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1E293B" }}>10x faster</span>
                </div>
              </div>
            </div>

            {/* ── Card 2: Wireless Mobile Scanner ── */}
            <div
              className={`features-card ${featuresGrid.inView ? "animate-fade-in-up" : "opacity-0"}`}
              style={{
                background: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(0,0,0,0.04)",
                borderRadius: "1.5rem",
                padding: "2.25rem",
                display: "flex", flexDirection: "column",
                position: "relative", overflow: "hidden",
                animationDelay: "0.25s",
                backdropFilter: "blur(10px)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 24px 48px rgba(99,102,241,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Gradient top accent */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "4px",
                background: "linear-gradient(90deg, #f43f5e, #fb923c)",
                borderRadius: "1.5rem 1.5rem 0 0",
              }} />

              <div style={{
                width: "48px", height: "48px", borderRadius: "14px",
                background: "linear-gradient(135deg, #f43f5e, #fb923c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "1.25rem",
                boxShadow: "0 8px 20px rgba(244,63,94,0.2)",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>

              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
                Wireless Mobile Scanner
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#64748B", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                Your smartphone becomes a barcode gun via built-in WebSockets. Scan → Search → Bill in one flow.
              </p>

              <div style={{
                flex: 1,
                background: "rgba(238,242,255,0.5)", borderRadius: "1rem",
                padding: "1.25rem",
                display: "flex", flexDirection: "column", gap: "0.625rem",
                border: "1px solid rgba(99,102,241,0.06)",
              }}>
                {[
                  { icon: "●", color: "#818cf8", label: "Phone connected", sub: "192.168.1.14" },
                  { icon: "✓", color: "#6366f1", label: "Crocin 500mg scanned", sub: "EAN-13 verified" },
                  { icon: "✓", color: "#6366f1", label: "Added to billing queue", sub: "Qty: 1 strip" },
                ].map((line, i) => (
                  <div key={i} className={featuresGrid.inView ? "animate-fade-in-up" : "opacity-0"} style={{
                    animationDelay: `${0.5 + i * 0.12}s`,
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.65rem 0.85rem",
                    background: "rgba(255,255,255,0.9)", borderRadius: "0.6rem",
                    border: "1px solid rgba(0,0,0,0.04)",
                  }}>
                    <span style={{
                      color: line.color, fontSize: "0.7rem",
                      width: "20px", height: "20px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: `${line.color}18`, borderRadius: "50%",
                      fontWeight: 800,
                    }}>{line.icon}</span>
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1E293B" }}>{line.label}</div>
                      <div style={{ fontSize: "0.65rem", color: "#94A3B8" }}>{line.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Card 3: Offline-First ERP ── */}
            <div
              className={`features-card ${featuresGrid.inView ? "animate-fade-in-up" : "opacity-0"}`}
              style={{
                background: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(0,0,0,0.04)",
                borderRadius: "1.5rem",
                padding: "2.25rem",
                display: "flex", flexDirection: "column",
                position: "relative", overflow: "hidden",
                animationDelay: "0.35s",
                backdropFilter: "blur(10px)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 24px 48px rgba(99,102,241,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "4px",
                background: "linear-gradient(90deg, #a78bfa, #6366f1)",
                borderRadius: "1.5rem 1.5rem 0 0",
              }} />

              <div style={{
                width: "48px", height: "48px", borderRadius: "14px",
                background: "linear-gradient(135deg, #a78bfa, #6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "1.25rem",
                boxShadow: "0 8px 20px rgba(99,102,241,0.2)",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>

              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
                Offline-First Architecture
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#64748B", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                Embedded SQLite keeps everything local. Cloud syncs when network returns — never lose a sale.
              </p>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "1rem 1.25rem",
                  background: "rgba(238,242,255,0.5)", borderRadius: "1rem",
                  border: "1px solid rgba(99,102,241,0.08)",
                }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "#6366f1", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#312e81" }}>Cloud Synced</div>
                    <div style={{ fontSize: "0.7rem", color: "#818cf8" }}>Last sync: 2 seconds ago</div>
                  </div>
                  <div style={{
                    marginLeft: "auto",
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: "#818cf8", boxShadow: "0 0 8px #818cf8",
                  }} />
                </div>

                <div style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "1rem 1.25rem",
                  background: "#fffbeb", borderRadius: "1rem",
                  border: "1px solid #fef3c7",
                }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "#f59e0b", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#92400e" }}>Offline Mode</div>
                    <div style={{ fontSize: "0.7rem", color: "#d97706" }}>14 transactions queued locally</div>
                  </div>
                </div>

                <div style={{
                  background: "rgba(238,242,255,0.3)", borderRadius: "0.5rem",
                  padding: "0.75rem 1rem",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748B" }}>Storage used</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#0f172a" }}>24 MB / 2 GB</span>
                  </div>
                  <div style={{ background: "#E2E8F0", borderRadius: "var(--radius-full)", height: "6px", overflow: "hidden" }}>
                    <div style={{
                      width: "12%", height: "100%",
                      background: "linear-gradient(90deg, #818cf8, #6366f1)",
                      borderRadius: "var(--radius-full)",
                    }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Responsive override */}
          <style>{`
            @media (max-width: 900px) {
              .features-bento {
                grid-template-columns: 1fr !important;
              }
              .features-bento > div:first-child {
                grid-column: 1 !important;
                grid-template-columns: 1fr !important;
              }
            }
            @media (max-width: 640px) {
              .features-bento > div:first-child {
                grid-template-columns: 1fr !important;
                min-height: auto !important;
                padding: 2rem 1.25rem !important;
                gap: 2rem !important;
              }
            }
          `}</style>
        </div>
      </section>

      {/* ───────────────────── INTEGRATION SECTION ───────────────────── */}
      <section ref={integrations.ref} style={{ padding: "clamp(2.5rem, 5vw, 5rem) 0", background: "white", overflow: "hidden" }}>
        <div className="section-container" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>

          <div className={`insight-chip ${integrations.inView ? "animate-fade-in-up" : "opacity-0"}`} style={{ marginBottom: "1.5rem" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
            <span style={{ color: "var(--color-primary)", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>Integration</span>
          </div>

          <h2 className={`text-display-md integration-heading ${integrations.inView ? "animate-fade-in-up delay-100" : "opacity-0"}`} style={{ color: "#1E293B", fontWeight: 600, maxWidth: "700px", lineHeight: "1.2" }}>
            Seamlessly Integrate With All<br />Your Healthcare Apps
          </h2>

          <p className={`text-body-lg ${integrations.inView ? "animate-fade-in-up delay-200" : "opacity-0"}`} style={{ color: "#64748B", maxWidth: "600px", marginTop: "1.5rem" }}>
            Our prescription app integrates effortlessly with your favorite healthcare tools, ensuring a smooth and connected experience.
          </p>

          <a href="#integrations" className={`btn-primary ${integrations.inView ? "animate-fade-in-up delay-300" : "opacity-0"}`} style={{ marginTop: "2rem", borderRadius: "2rem", padding: "0.75rem 1.5rem" }}>
            Learn More
            <span style={{ background: "white", color: "var(--color-primary)", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "0.5rem" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </span>
          </a>

          {/* ── Mobile-only: Integration Logo Grid ── */}
          <div className="integration-mobile-grid">
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "1.25rem", marginTop: "2.5rem" }}>
              Works with 18+ platforms
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", justifyContent: "center", maxWidth: "360px" }}>
              {[
                "Epic","Cerner","Allscripts","Meditech","Athena","CureMD",
                "eClinicalWorks","Kareo","AdvancedMD","Greenway","Rhythm Health",
                "Optum","McKesson","Amerisource","Cardinal","SureScripts","NextGen",
                "DrFirst","Practo","Zocdoc"
              ].map((name, i) => (
                <span key={name} className="integration-pill" style={{ animationDelay: `${i * 0.05}s` }}>
                  {name}
                </span>
              ))}
            </div>
          </div>

          <style>{`
            /* ── Integration mobile grid ── */
            .integration-mobile-grid {
              display: none;
              flex-direction: column;
              align-items: center;
            }
            .integration-pill {
              display: inline-flex;
              align-items: center;
              gap: 0.35rem;
              padding: 0.35rem 0.85rem;
              background: white;
              border: 1px solid rgba(99,102,241,0.15);
              border-radius: 2rem;
              font-size: 0.78rem;
              font-weight: 600;
              color: #475569;
              box-shadow: 0 2px 8px rgba(0,0,0,0.04);
              white-space: nowrap;
              transition: all 0.25s ease;
            }
            .integration-pill:hover {
              border-color: rgba(99,102,241,0.4);
              color: #6366f1;
              box-shadow: 0 4px 14px rgba(99,102,241,0.12);
              transform: translateY(-1px);
            }
            @media (max-width: 768px) {
              .integration-mobile-grid { display: flex; }
              .integration-orbit-diagram { display: none !important; }
            }
          `}</style>

          <div className={`integration-orbit-diagram ${integrations.inView ? "animate-fade-in-up delay-400" : "opacity-0"}`} style={{ marginTop: "5rem", position: "relative", width: "100%", maxWidth: "1100px", height: "300px" }}>

            {/* Horizontal lines */}
            <div style={{ position: "absolute", top: "50%", left: 0, width: "100%", height: "1px", borderTop: "2px dashed rgba(203,213,225,0.4)" }} />
            <div style={{ position: "absolute", top: "15%", left: "5%", width: "90%", height: "1px", borderTop: "2px dashed rgba(203,213,225,0.3)" }} />
            <div style={{ position: "absolute", top: "85%", left: "5%", width: "90%", height: "1px", borderTop: "2px dashed rgba(203,213,225,0.3)" }} />

            {/* Cross Lines to center */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <path d="M 50 50 L 35 15" stroke="rgba(203,213,225,0.3)" strokeWidth="0.5" strokeDasharray="1.5 1.5" fill="none" />
              <path d="M 50 50 L 35 85" stroke="rgba(203,213,225,0.3)" strokeWidth="0.5" strokeDasharray="1.5 1.5" fill="none" />
              <path d="M 50 50 L 65 15" stroke="rgba(203,213,225,0.3)" strokeWidth="0.5" strokeDasharray="1.5 1.5" fill="none" />
              <path d="M 50 50 L 65 85" stroke="rgba(203,213,225,0.3)" strokeWidth="0.5" strokeDasharray="1.5 1.5" fill="none" />
            </svg>

            {/* ── AI Brain Center Hub ── */}
            <div className="ai-hub-wrapper" style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "180px", height: "180px",
              zIndex: 10,
            }}>
              {/* Outermost pulsing glow ring */}
              <div className="ai-hub-pulse-ring" style={{
                position: "absolute", inset: "-20px",
                borderRadius: "50%",
                border: "1.5px solid rgba(99,102,241,0.12)",
              }} />
              {/* Outer dashed orbit ring */}
              <div className="ai-hub-orbit-ring" style={{
                position: "absolute", inset: "-12px",
                borderRadius: "50%",
                border: "1.5px dashed rgba(99,102,241,0.18)",
              }} />
              {/* Middle ring with dots */}
              <div className="ai-hub-dot-ring" style={{
                position: "absolute", inset: "0",
                borderRadius: "50%",
                border: "2px solid rgba(129,140,248,0.15)",
              }}>
                {/* Orbiting dots */}
                {[0, 90, 180, 270].map((deg) => (
                  <div key={deg} style={{
                    position: "absolute", top: "50%", left: "50%",
                    width: "8px", height: "8px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #818cf8, #6366f1)",
                    boxShadow: "0 0 6px rgba(99,102,241,0.5)",
                    transform: `rotate(${deg}deg) translateX(90px) translateY(-50%)`,
                  }} />
                ))}
              </div>
              {/* Inner glow ring */}
              <div style={{
                position: "absolute", inset: "15px",
                borderRadius: "50%",
                border: "1.5px solid rgba(129,140,248,0.25)",
                boxShadow: "0 0 20px rgba(99,102,241,0.08)",
              }} />
              {/* Main glossy AI sphere */}
              <div className="ai-hub-sphere" style={{
                position: "absolute", inset: "25px",
                borderRadius: "50%",
                background: "linear-gradient(145deg, #818cf8 0%, #6366f1 40%, #4f46e5 70%, #4338ca 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `
                  0 0 0 6px rgba(99,102,241,0.15),
                  0 0 0 12px rgba(99,102,241,0.08),
                  0 10px 40px rgba(99,102,241,0.35),
                  0 20px 60px rgba(79,70,229,0.2),
                  inset 0 -8px 20px rgba(67,56,202,0.4),
                  inset 0 8px 20px rgba(165,180,252,0.3)
                `,
                overflow: "hidden",
              }}>
                {/* Glass highlight arc */}
                <div style={{
                  position: "absolute", top: "6px", left: "15%", right: "15%",
                  height: "40%", borderRadius: "50%",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)",
                  pointerEvents: "none",
                }} />
                {/* AI Bill Scanner icon */}
                <svg width="58" height="58" viewBox="0 0 48 48" fill="none" style={{ position: "relative", zIndex: 2, filter: "drop-shadow(0 0 10px rgba(255,255,255,0.45))" }}>
                  <defs>
                    <linearGradient id="scanBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%"   stopColor="white" stopOpacity="0"/>
                      <stop offset="20%"  stopColor="white" stopOpacity="1"/>
                      <stop offset="80%"  stopColor="white" stopOpacity="1"/>
                      <stop offset="100%" stopColor="white" stopOpacity="0"/>
                    </linearGradient>
                  </defs>

                  {/* Receipt / bill document */}
                  <path d="M10 3 L34 3 L42 11 L42 45 L10 45 Z"
                    stroke="white" strokeWidth="2" strokeLinejoin="round"
                    fill="rgba(255,255,255,0.07)"/>
                  {/* Folded corner */}
                  <path d="M34 3 L34 11 L42 11"
                    stroke="white" strokeWidth="1.5" strokeLinejoin="round"
                    fill="none" strokeOpacity="0.6"/>

                  {/* Bill line items (text rows) */}
                  <line x1="15" y1="19" x2="37" y2="19" stroke="white" strokeWidth="1.4" strokeOpacity="0.28" strokeLinecap="round"/>
                  <line x1="15" y1="25" x2="37" y2="25" stroke="white" strokeWidth="1.4" strokeOpacity="0.28" strokeLinecap="round"/>
                  <line x1="15" y1="31" x2="29" y2="31" stroke="white" strokeWidth="1.4" strokeOpacity="0.28" strokeLinecap="round"/>
                  <line x1="15" y1="37" x2="32" y2="37" stroke="white" strokeWidth="1.4" strokeOpacity="0.28" strokeLinecap="round"/>

                  {/* Animated scan beam */}
                  <rect className="ai-scan-beam" x="6" y="21" width="36" height="3"
                    fill="url(#scanBeamGrad)" rx="1.5"/>
                  {/* Beam glow halo */}
                  <rect className="ai-scan-beam" x="6" y="20" width="36" height="5"
                    fill="url(#scanBeamGrad)" rx="2.5" opacity="0.25"/>

                  {/* AI indicator dot — rides the right edge of the beam */}
                  <circle className="ai-scan-dot" cx="44" cy="22.5" r="3.5" fill="white" fillOpacity="0.95"/>
                  {/* Sparkle cross on the dot */}
                  <line className="ai-scan-dot" x1="44" y1="19.5" x2="44" y2="25.5" stroke="rgba(99,102,241,0.9)" strokeWidth="1.5" strokeLinecap="round"/>
                  <line className="ai-scan-dot" x1="41"  y1="22.5" x2="47"  y2="22.5" stroke="rgba(99,102,241,0.9)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            {/* AI Hub CSS Animations */}
            <style>{`
              .ai-hub-wrapper {
                animation: ai-float 4s ease-in-out infinite;
              }
              @keyframes ai-float {
                0%, 100% { transform: translate(-50%, -50%) translateY(0); }
                50% { transform: translate(-50%, -50%) translateY(-8px); }
              }
              .ai-hub-pulse-ring {
                animation: ai-pulse-ring 3s ease-in-out infinite;
              }
              @keyframes ai-pulse-ring {
                0%, 100% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.15); opacity: 0; }
              }
              .ai-hub-orbit-ring {
                animation: ai-orbit-spin 20s linear infinite;
              }
              @keyframes ai-orbit-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              .ai-hub-dot-ring {
                animation: ai-orbit-spin 12s linear infinite reverse;
              }
              .ai-hub-sphere {
                animation: ai-sphere-glow 4s ease-in-out infinite;
              }
              @keyframes ai-sphere-glow {
                0%, 100% {
                  box-shadow:
                    0 0 0 6px rgba(99,102,241,0.15),
                    0 0 0 12px rgba(99,102,241,0.08),
                    0 10px 40px rgba(99,102,241,0.35),
                    0 20px 60px rgba(79,70,229,0.2),
                    inset 0 -8px 20px rgba(67,56,202,0.4),
                    inset 0 8px 20px rgba(165,180,252,0.3);
                }
                50% {
                  box-shadow:
                    0 0 0 8px rgba(99,102,241,0.2),
                    0 0 0 16px rgba(99,102,241,0.1),
                    0 15px 50px rgba(99,102,241,0.45),
                    0 25px 70px rgba(79,70,229,0.25),
                    inset 0 -8px 20px rgba(67,56,202,0.5),
                    inset 0 8px 20px rgba(165,180,252,0.4);
                }
              }
              .ai-scan-beam {
                transform-box: fill-box;
                animation: ai-scan-sweep 2.2s ease-in-out infinite;
              }
              .ai-scan-dot {
                transform-box: fill-box;
                animation: ai-scan-sweep 2.2s ease-in-out infinite;
              }
              @keyframes ai-scan-sweep {
                0%   { transform: translateY(-7px); }
                50%  { transform: translateY(14px); }
                100% { transform: translateY(-7px); }
              }
            `}</style>

            {/* Left nodes */}
            <IntegrationNode top="15%" left="5%" icon={Icons.sparkle} hoverText="Epic" />
            <IntegrationNode top="15%" left="20%" icon={Icons.box} hoverText="Cerner" />
            <IntegrationNode top="15%" left="35%" icon={Icons.chart} hoverText="Allscripts" />

            <IntegrationNode top="50%" left="3%" icon={Icons.zap} hoverText="Meditech" />
            <IntegrationNode top="50%" left="15%" icon={Icons.users} hoverText="Athena" />
            <IntegrationNode top="50%" left="28%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19A4.5 4.5 0 0 0 18 10h-.5a7.5 7.5 0 0 0-14.9 1.5A4.5 4.5 0 0 0 7 20h10.5Z" /></svg>} hoverText="CureMD" />
            <IntegrationNode top="50%" left="40%" icon={Icons.shield} hoverText="eClinicalWorks" />

            <IntegrationNode top="85%" left="10%" icon={Icons.mail} hoverText="Kareo" />
            <IntegrationNode top="85%" left="25%" icon={Icons.menu} hoverText="AdvancedMD" />
            <IntegrationNode top="85%" left="40%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>} hoverText="Greenway" />

            {/* Right nodes */}
            <IntegrationNode top="15%" right="35%" active={true} hoverText="Rhythm Health" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>} />
            <IntegrationNode top="15%" right="20%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16 12l-4-4-4 4" /></svg>} hoverText="Optum" />
            <IntegrationNode top="15%" right="5%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /></svg>} hoverText="McKesson" />

            <IntegrationNode top="50%" right="40%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>} hoverText="Amerisource" />
            <IntegrationNode top="50%" right="28%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>} hoverText="Cardinal" />
            <IntegrationNode top="50%" right="15%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>} hoverText="SureScripts" />
            <IntegrationNode top="50%" right="3%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>} hoverText="NextGen" />

            <IntegrationNode top="85%" right="40%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>} hoverText="DrFirst" />
            <IntegrationNode top="85%" right="25%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>} hoverText="Practo" />
            <IntegrationNode top="85%" right="10%" icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>} hoverText="Zocdoc" />

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

      {/* ───────────────────── AI-POWERED FEATURES ───────────────────── */}
      <section
        ref={aiFeatures.ref}
        style={{
          padding: "clamp(2rem, 4vw, 4rem) 0",
          background: "linear-gradient(180deg, #eef2ff 0%, #f0f4ff 50%, #f8fafc 100%)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div className="section-container">
          {/* Section Header */}
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div
              className={aiFeatures.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.4rem 1rem 0.4rem 0.5rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{
                background: "linear-gradient(135deg, #818cf8, #6366f1)", color: "white",
                borderRadius: "var(--radius-full)", width: "24px", height: "24px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </span>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                AI-Powered
              </span>
            </div>
            <h2
              className={aiFeatures.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700,
                color: "#0f172a", lineHeight: 1.2,
                maxWidth: "700px", margin: "0 auto",
              }}
            >
              Intelligence built into{" "}
              <span style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>every action</span>
            </h2>
            <p
              className={aiFeatures.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
              style={{ fontSize: "1.05rem", color: "#64748B", maxWidth: "540px", margin: "1.25rem auto 0", lineHeight: 1.7 }}
            >
              Our AI engine analyzes patterns, predicts demand, and automates decisions — so you focus on patient care.
            </p>
          </div>

          {/* 2x2 Grid with Center AI Hub */}
          <div
            className={aiFeatures.inView ? "animate-fade-in-up delay-300" : "opacity-0"}
            style={{ position: "relative", maxWidth: "1000px", margin: "0 auto" }}
          >
            <div className="ai-features-grid" style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}>

              {/* ── Card 1: Smart Inventory Insights ── */}
              <div className="ai-feat-card" style={{
                background: "rgba(255,255,255,0.85)",
                borderRadius: "1.5rem",
                padding: "2rem 2rem 1.5rem",
                border: "1px solid rgba(0,0,0,0.04)",
                backdropFilter: "blur(10px)",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                  <span style={{ width: "32px", height: "32px", borderRadius: "0.625rem", background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  </span>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>Smart Inventory Insights</h3>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "1.5rem", lineHeight: 1.6 }}>AI predicts demand & auto-adjusts reorder levels based on sales patterns</p>

                {/* Mock UI: Medicine Card */}
                <div style={{ position: "relative" }}>
                  <div style={{
                    background: "white", borderRadius: "1rem", padding: "1rem 1.25rem",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.04)",
                    marginBottom: "0.75rem",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "0.5rem", background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ display: "flex", color: "#6366f1" }}>{Icons.pill}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a" }}>Paracetamol 500mg</div>
                          <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>Stock: 2,450 units</div>
                        </div>
                      </div>
                      <div style={{ padding: "0.2rem 0.5rem", background: "#dcfce7", borderRadius: "var(--radius-full)", fontSize: "0.6rem", fontWeight: 700, color: "#15803d" }}>● Optimal</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "end", gap: "3px", height: "32px" }}>
                      {[40, 55, 35, 60, 45, 70, 50, 65, 75, 55, 80, 60].map((h, i) => (
                        <div key={i} style={{
                          flex: 1, height: `${h}%`, borderRadius: "2px",
                          background: i >= 10 ? "linear-gradient(180deg, #818cf8, #6366f1)" : "#e2e8f0",
                          transition: "height 0.3s ease",
                        }} />
                      ))}
                    </div>
                  </div>

                  <div className="ai-feat-float-1" style={{
                    position: "absolute", bottom: "-8px", right: "-4px",
                    background: "white", borderRadius: "0.75rem", padding: "0.5rem 0.75rem",
                    boxShadow: "0 8px 24px rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.1)",
                    display: "flex", alignItems: "center", gap: "0.4rem",
                  }}>
                    <span style={{ display: "flex", color: "#6366f1" }}>{Icons.bot}</span>
                    <div>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#6366f1" }}>AI Prediction</div>
                      <div style={{ fontSize: "0.58rem", color: "#64748b" }}>Reorder in 5 days</div>
                    </div>
                  </div>

                  <div className="ai-feat-float-2" style={{
                    position: "absolute", top: "50%", left: "-12px", transform: "translateY(-50%)",
                    background: "white", borderRadius: "0.75rem", padding: "0.4rem 0.6rem",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)",
                    display: "flex", alignItems: "center", gap: "0.35rem",
                  }}>
                    <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>{Icons.check}</span>
                    <span style={{ fontSize: "0.58rem", fontWeight: 600, color: "#0f172a" }}>Effective<br/>monitoring</span>
                  </div>
                </div>
              </div>

              {/* ── Card 2: Drug Interaction Alerts ── */}
              <div className="ai-feat-card" style={{
                background: "rgba(255,255,255,0.85)",
                borderRadius: "1.5rem",
                padding: "2rem 2rem 1.5rem",
                border: "1px solid rgba(0,0,0,0.04)",
                backdropFilter: "blur(10px)",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                  <span style={{ width: "32px", height: "32px", borderRadius: "0.625rem", background: "linear-gradient(135deg, #fce7f3, #fbcfe8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </span>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>Drug Interaction Alerts</h3>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "1.5rem", lineHeight: 1.6 }}>AI detects harmful combinations before dispensing</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {[
                    { label: "Drug-herb interaction", color: "#f43f5e", bg: "#fff1f2", icon: Icons.leaf },
                    { label: "Drug-disease interaction", color: "#f59e0b", bg: "#fffbeb", icon: Icons.heartPulse },
                    { label: "Drug-drug interaction", color: "#ef4444", bg: "#fef2f2", icon: Icons.pill },
                    { label: "Drug-allergy interaction", color: "#a855f7", bg: "#faf5ff", icon: Icons.alertTriangle },
                  ].map((item, i) => (
                    <div key={item.label} className="ai-feat-alert-row" style={{
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      background: item.bg, borderRadius: "0.625rem",
                      border: `1px solid ${item.color}20`,
                      animationDelay: `${i * 0.15}s`,
                    }}>
                      <span style={{ display: "flex", color: item.color }}>{item.icon}</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: item.color }}>{item.label}</span>
                      <svg style={{ marginLeft: "auto" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  ))}
                </div>

                <div style={{ position: "absolute", top: "2rem", right: "2rem", display: "flex", gap: "0.3rem", opacity: 0.5 }}>
                  {["#f43f5e","#3b82f6","#22c55e","#f59e0b"].map(c => (
                    <div key={c} style={{ width: "8px", height: "8px", borderRadius: "50%", background: c }} />
                  ))}
                </div>
              </div>

              {/* ── Card 3: Seamless Supplier Integration ── */}
              <div className="ai-feat-card" style={{
                background: "rgba(255,255,255,0.85)",
                borderRadius: "1.5rem",
                padding: "2rem 2rem 1.5rem",
                border: "1px solid rgba(0,0,0,0.04)",
                backdropFilter: "blur(10px)",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                  <span style={{ width: "32px", height: "32px", borderRadius: "0.625rem", background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </span>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>Seamless Supplier Integration</h3>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "1.5rem", lineHeight: 1.6 }}>Connect directly with distributors and healthcare providers</p>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "1rem 0" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #dbeafe, #93c5fd)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(59,130,246,0.15)", border: "2px solid white", color: "#3b82f6" }}><span style={{ transform: "scale(1.3)", display: "flex" }}>{Icons.user}</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                    <div style={{ width: "20px", height: "2px", background: "#cbd5e1" }} />
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="#94a3b8"><path d="M0 0L8 4L0 8z"/></svg>
                    <div style={{ width: "20px", height: "2px", background: "#cbd5e1" }} />
                  </div>
                  <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #d1fae5, #6ee7b7)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(16,185,129,0.15)", border: "2px solid white", color: "#059669" }}><span style={{ transform: "scale(1.3)", display: "flex" }}>{Icons.store}</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                    <div style={{ width: "20px", height: "2px", background: "#cbd5e1" }} />
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="#94a3b8"><path d="M0 0L8 4L0 8z"/></svg>
                    <div style={{ width: "20px", height: "2px", background: "#cbd5e1" }} />
                  </div>
                  <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #fef3c7, #fcd34d)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(245,158,11,0.15)", border: "2px solid white", fontSize: "0.6rem", fontWeight: 800, color: "#92400e" }}>DIST</div>
                </div>
              </div>

              {/* ── Card 4: Personalized Notifications ── */}
              <div className="ai-feat-card" style={{
                background: "rgba(255,255,255,0.85)",
                borderRadius: "1.5rem",
                padding: "2rem 2rem 1.5rem",
                border: "1px solid rgba(0,0,0,0.04)",
                backdropFilter: "blur(10px)",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                  <span style={{ width: "32px", height: "32px", borderRadius: "0.625rem", background: "linear-gradient(135deg, #ede9fe, #ddd6fe)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  </span>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>Personalized Notifications</h3>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "1.5rem", lineHeight: 1.6 }}>Context-aware notifications instead of rigid alarms</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {[
                    { icon: Icons.sparkle, title: "Great job!", desc: "Inventory sync 98% accurate this month", bg: "#dcfce7", color: "#15803d" },
                    { icon: Icons.alertTriangle, title: "Expiry Alert", desc: "12 items expiring in next 30 days", bg: "#fef3c7", color: "#92400e" },
                    { icon: Icons.pill, title: "Low Stock", desc: "Reorder Amoxicillin — 45 units left", bg: "#dbeafe", color: "#1d4ed8" },
                  ].map((notif, i) => (
                    <div key={notif.title} className="ai-feat-notif" style={{
                      display: "flex", alignItems: "flex-start", gap: "0.6rem",
                      padding: "0.65rem 0.85rem",
                      background: "white", borderRadius: "0.75rem",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                      border: "1px solid rgba(0,0,0,0.04)",
                      animationDelay: `${i * 0.2}s`,
                    }}>
                      <span style={{
                        width: "28px", height: "28px", borderRadius: "0.5rem", flexShrink: 0,
                        background: notif.bg, display: "flex", alignItems: "center", justifyContent: "center",
                        color: notif.color,
                      }}>{notif.icon}</span>
                      <div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: notif.color }}>{notif.title}</div>
                        <div style={{ fontSize: "0.62rem", color: "#64748b", lineHeight: 1.4 }}>{notif.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Center AI Brain Hub (Intersection) ── */}
            {/* ai-hub-mobile-wrapper: on mobile becomes a flex row that centres the hub */}
            <div className="ai-hub-mobile-wrapper">
            <div className="ai-center-hub" style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 20,
              width: "120px", height: "120px",
            }}>
              <div className="ai-center-pulse" style={{
                position: "absolute", inset: "-16px",
                borderRadius: "50%",
                border: "1.5px solid rgba(99,102,241,0.12)",
              }} />
              <div className="ai-center-orbit" style={{
                position: "absolute", inset: "-8px",
                borderRadius: "50%",
                border: "1.5px dashed rgba(99,102,241,0.2)",
              }} />
              <div className="ai-center-dots" style={{
                position: "absolute", inset: "0",
                borderRadius: "50%",
                border: "2px solid rgba(129,140,248,0.15)",
              }}>
                {[0, 120, 240].map(deg => (
                  <div key={deg} style={{
                    position: "absolute", top: "50%", left: "50%",
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #818cf8, #6366f1)",
                    boxShadow: "0 0 6px rgba(99,102,241,0.5)",
                    transform: `rotate(${deg}deg) translateX(60px) translateY(-50%)`,
                  }} />
                ))}
              </div>
              <div style={{
                position: "absolute", inset: "10px",
                borderRadius: "50%",
                border: "1.5px solid rgba(129,140,248,0.25)",
              }} />
              <div className="ai-center-sphere" style={{
                position: "absolute", inset: "16px",
                borderRadius: "50%",
                background: "linear-gradient(145deg, #818cf8 0%, #6366f1 40%, #4f46e5 70%, #4338ca 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 0 4px rgba(99,102,241,0.15), 0 0 0 8px rgba(99,102,241,0.08), 0 10px 30px rgba(99,102,241,0.35), inset 0 -6px 16px rgba(67,56,202,0.4), inset 0 6px 16px rgba(165,180,252,0.3)",
                overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: "4px", left: "18%", right: "18%", height: "38%", borderRadius: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)", pointerEvents: "none" }} />
                {/* AI Bill Scanner icon */}
                <svg width="38" height="38" viewBox="0 0 48 48" fill="none" style={{ position: "relative", zIndex: 2, filter: "drop-shadow(0 0 8px rgba(255,255,255,0.45))" }}>
                  <defs>
                    <linearGradient id="cScanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%"   stopColor="white" stopOpacity="0"/>
                      <stop offset="20%"  stopColor="white" stopOpacity="1"/>
                      <stop offset="80%"  stopColor="white" stopOpacity="1"/>
                      <stop offset="100%" stopColor="white" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Receipt outline with folded corner */}
                  <path d="M10 3 L34 3 L42 11 L42 45 L10 45 Z"
                    stroke="white" strokeWidth="2" strokeLinejoin="round"
                    fill="rgba(255,255,255,0.07)"/>
                  <path d="M34 3 L34 11 L42 11"
                    stroke="white" strokeWidth="1.5" strokeLinejoin="round"
                    fill="none" strokeOpacity="0.6"/>
                  {/* Bill text rows */}
                  <line x1="15" y1="19" x2="37" y2="19" stroke="white" strokeWidth="1.4" strokeOpacity="0.28" strokeLinecap="round"/>
                  <line x1="15" y1="25" x2="37" y2="25" stroke="white" strokeWidth="1.4" strokeOpacity="0.28" strokeLinecap="round"/>
                  <line x1="15" y1="31" x2="29" y2="31" stroke="white" strokeWidth="1.4" strokeOpacity="0.28" strokeLinecap="round"/>
                  <line x1="15" y1="37" x2="32" y2="37" stroke="white" strokeWidth="1.4" strokeOpacity="0.28" strokeLinecap="round"/>
                  {/* Scan beam */}
                  <rect className="ai-cscan-beam" x="6" y="21" width="36" height="3"   fill="url(#cScanGrad)" rx="1.5"/>
                  <rect className="ai-cscan-beam" x="6" y="20" width="36" height="5"   fill="url(#cScanGrad)" rx="2.5" opacity="0.25"/>
                  {/* AI dot riding the beam */}
                  <circle className="ai-cscan-dot" cx="44" cy="22.5" r="3.5" fill="white" fillOpacity="0.95"/>
                  <line className="ai-cscan-dot" x1="44" y1="19.5" x2="44" y2="25.5" stroke="rgba(99,102,241,0.9)" strokeWidth="1.5" strokeLinecap="round"/>
                  <line className="ai-cscan-dot" x1="41"  y1="22.5" x2="47"  y2="22.5" stroke="rgba(99,102,241,0.9)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            </div>{/* end ai-hub-mobile-wrapper */}
          </div>
        </div>

        {/* AI Features Section CSS */}
        <style>{`
          .ai-feat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 40px rgba(0,0,0,0.06);
          }
          .ai-center-hub {
            animation: ai-center-float 4s ease-in-out infinite;
          }
          @keyframes ai-center-float {
            0%, 100% { transform: translate(-50%, -50%) translateY(0); }
            50% { transform: translate(-50%, -50%) translateY(-6px); }
          }
          .ai-center-pulse {
            animation: ai-center-pulse-anim 3s ease-in-out infinite;
          }
          @keyframes ai-center-pulse-anim {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.2); opacity: 0; }
          }
          .ai-center-orbit {
            animation: ai-center-spin 18s linear infinite;
          }
          .ai-center-dots {
            animation: ai-center-spin 10s linear infinite reverse;
          }
          @keyframes ai-center-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .ai-center-sphere {
            animation: ai-center-glow 4s ease-in-out infinite;
          }
          @keyframes ai-center-glow {
            0%, 100% { box-shadow: 0 0 0 4px rgba(99,102,241,0.15), 0 0 0 8px rgba(99,102,241,0.08), 0 10px 30px rgba(99,102,241,0.35), inset 0 -6px 16px rgba(67,56,202,0.4), inset 0 6px 16px rgba(165,180,252,0.3); }
            50% { box-shadow: 0 0 0 6px rgba(99,102,241,0.2), 0 0 0 12px rgba(99,102,241,0.1), 0 14px 40px rgba(99,102,241,0.45), inset 0 -6px 16px rgba(67,56,202,0.5), inset 0 6px 16px rgba(165,180,252,0.4); }
          }
          .ai-cscan-beam {
            transform-box: fill-box;
            animation: ai-cscan-sweep 2.2s ease-in-out infinite;
          }
          .ai-cscan-dot {
            transform-box: fill-box;
            animation: ai-cscan-sweep 2.2s ease-in-out infinite;
          }
          @keyframes ai-cscan-sweep {
            0%   { transform: translateY(-7px); }
            50%  { transform: translateY(14px); }
            100% { transform: translateY(-7px); }
          }
          .ai-feat-float-1 {
            animation: ai-feat-bob 3s ease-in-out infinite;
          }
          .ai-feat-float-2 {
            animation: ai-feat-bob 3.5s ease-in-out infinite 0.5s;
          }
          @keyframes ai-feat-bob {
            0%, 100% { transform: translateY(-50%) translateY(0); }
            50% { transform: translateY(-50%) translateY(-4px); }
          }

          /* Desktop: wrapper is invisible so absolute hub positions normally */
          .ai-hub-mobile-wrapper {
            display: contents;
          }
          @media (max-width: 768px) {
            .ai-features-grid {
              grid-template-columns: 1fr !important;
            }
            /* On mobile: show the hub as a centred block between cards */
            .ai-hub-mobile-wrapper {
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 0.5rem 0 1rem;
            }
            .ai-center-hub {
              /* switch from absolute to relative so it flows in the column */
              position: relative !important;
              top: auto !important;
              left: auto !important;
              transform: none !important;
              /* scale up slightly so it is readable on mobile */
              width: 150px !important;
              height: 150px !important;
              margin: 0 auto;
              /* mobile-specific float (no translate offset) */
              animation: ai-center-float-mobile 4s ease-in-out infinite !important;
            }
            @keyframes ai-center-float-mobile {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-8px); }
            }
            .ai-feat-float-1, .ai-feat-float-2 {
              display: none;
            }
          }
        `}</style>
      </section>

      {/* ───────────────────── STATS BAR (Modernized) ───────────────────── */}
      <section
        ref={stats.ref}
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)",
          padding: "clamp(2rem, 4vw, 4rem) 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle dot grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(165,180,252,0.08) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
        
        {/* Glow Effects */}
        <div style={{ position: "absolute", top: "50%", left: "20%", width: "40vw", height: "40vw", background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 60%)", transform: "translate(-50%, -50%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", right: "20%", width: "30vw", height: "30vw", background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 60%)", transform: "translate(50%, -50%)", pointerEvents: "none" }} />

        <div className="section-container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "2rem",
          }}>
            {[
              { end: "2,500+", label: "Pharmacies Managed", delay: "0s",
                svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8"/><path d="M5 11V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"/><path d="M12 11V7"/><path d="M10 9h4"/><line x1="3" y1="21" x2="21" y2="21"/></svg> },
              { end: "98%", label: "Inventory Accuracy", delay: "0.1s",
                svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
              { end: "40%", label: "Time Saved on Billing", delay: "0.2s",
                svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
              { end: "24/7", label: "Support Available", delay: "0.3s",
                svg: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
            ].map((s) => (
              <div 
                key={s.label} 
                className="stat-card"
                style={{ 
                  opacity: 0,
                  animation: stats.inView ? `slideUpStat 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards ${s.delay}` : "none",
                }}
              >
                <div className="stat-glass">
                  <div className="stat-icon-wrapper">
                    <span className="stat-icon">{s.svg}</span>
                  </div>
                  <div className="stat-value">{s.end}</div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-glow"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          .stat-card {
            transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
            perspective: 1000px;
          }
          
          .stat-glass {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 1.5rem;
            padding: 2.5rem 2rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
            transform-style: preserve-3d;
            box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
          }
          
          .stat-card:hover .stat-glass {
            transform: translateY(-8px) scale(1.02);
            border-color: rgba(167, 139, 250, 0.3);
            box-shadow: 0 20px 40px -15px rgba(99, 102, 241, 0.4);
            background: rgba(255, 255, 255, 0.05);
          }

          .stat-icon-wrapper {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(167, 139, 250, 0.05));
            width: 64px;
            height: 64px;
            border-radius: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(167, 139, 250, 0.2);
            transition: transform 0.4s ease, box-shadow 0.4s ease;
            color: #a5b4fc;
          }

          .stat-card:hover .stat-icon-wrapper {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 0 20px rgba(167, 139, 250, 0.4);
            border-color: rgba(167, 139, 250, 0.5);
            color: #fff;
          }

          .stat-value {
            font-size: 3rem;
            font-weight: 800;
            background: linear-gradient(to right, #ffffff, #a5b4fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            line-height: 1.1;
            margin-bottom: 0.5rem;
            letter-spacing: -0.02em;
          }

          .stat-label {
            font-size: 1.05rem;
            color: rgba(165, 180, 252, 0.8);
            font-weight: 500;
            letter-spacing: 0.01em;
          }

          .stat-glow {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(180deg, rgba(167, 139, 250, 0) 0%, rgba(167, 139, 250, 0.08) 100%);
            opacity: 0;
            transition: opacity 0.4s ease;
            pointer-events: none;
          }

          .stat-card:hover .stat-glow {
            opacity: 1;
          }
          
          @keyframes slideUpStat {
            0% {
              opacity: 0;
              transform: translateY(40px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </section>

      {/* ───────────────────── WHY SHELFCURE ───────────────────── */}
      <section
        ref={why.ref}
        id="why"
        style={{ padding: "clamp(2.5rem, 5vw, 5rem) 0", background: "var(--color-surface)", position: "relative", overflow: "hidden" }}
      >
        {/* Animated Background Orbs */}
        <div style={{ position: "absolute", top: "5%", left: "-10%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 60%)", borderRadius: "50%", filter: "blur(60px)", animation: "float 15s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "-10%", width: "40vw", height: "40vw", background: "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 60%)", borderRadius: "50%", filter: "blur(60px)", animation: "float 20s ease-in-out infinite reverse" }} />

        <div className="section-container" style={{ position: "relative", zIndex: 10 }}>
          <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 5rem auto" }}>
            <div
              className={why.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.4rem 1rem 0.4rem 0.5rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
                border: "1px solid rgba(99,102,241,0.15)"
              }}
            >
              <span style={{
                background: "linear-gradient(135deg, #818cf8, #6366f1)", color: "white",
                borderRadius: "var(--radius-full)", width: "24px", height: "24px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </span>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>Why ShelfCure</span>
            </div>
            <h2 className={why.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 800, color: "var(--color-on-surface)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Real pharmacy problems,<br /><span className="gradient-primary-text">completely solved.</span>
            </h2>
            <p className={why.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
              style={{ marginTop: "1.5rem", fontSize: "1.125rem", color: "var(--color-on-surface-variant)", lineHeight: 1.7 }}>
              The six biggest pain points pharmacists face every day — and exactly how ShelfCure eliminates each one.
            </p>
          </div>

          <div className="bento-grid">

            {/* ROW 1 — AI Billing (span-2) + Expiry Control (span-1) */}
            <div className={`bento-card span-2 ${why.inView ? "animate-fade-in-up delay-200" : "opacity-0"}`}>
              <div className="bento-glow" style={{ background: "rgba(99,102,241,0.15)" }} />
              <div className="bento-content" style={{ display: "flex", flexDirection: "row", gap: "2rem", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div className="bento-icon" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>{Icons.zap}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.65rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "var(--radius-full)", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#dc2626" }}>Problem: 2–3 hours wasted on billing daily</span>
                  </div>
                  <h3>Scan Any Bill. Zero Typing.</h3>
                  <p>AI reads any purchase bill in under 8 seconds. 50,000+ medicine database auto-fills batch numbers, HSN codes, MRP, and GST — instantly. Phone or machine barcode scanner included.</p>
                </div>
                <div style={{ flex: 1 }} className="hide-mobile">
                  <div style={{ padding: "1.25rem", background: "linear-gradient(135deg, #1e1b4b, #312e81)", borderRadius: "1rem", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(129,140,248,0.9), transparent)", animation: "scan-beam 2.5s linear infinite" }} />
                    <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: "0.75rem", letterSpacing: "0.05em" }}>AI Extracting Invoice</div>
                    {[{ name: "Paracetamol 500mg", tag: "Extracted", c: "#10b981" }, { name: "Amoxicillin 250mg", tag: "Verified", c: "#818cf8" }].map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{item.name}</span>
                        <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "var(--radius-full)", background: `${item.c}22`, color: item.c }}>{item.tag}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: "0.875rem", height: 4, background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ width: "87%", height: "100%", background: "linear-gradient(90deg, #818cf8, #6366f1)", borderRadius: "2px" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`bento-card ${why.inView ? "animate-fade-in-up delay-300" : "opacity-0"}`}>
              <div className="bento-glow" style={{ background: "rgba(245,158,11,0.15)" }} />
              <div className="bento-content">
                <div className="bento-icon" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>{Icons.alertTriangle}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.65rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "var(--radius-full)", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#dc2626" }}>Problem: Expired stock found too late</span>
                </div>
                <h3>Never Expire Stock Again.</h3>
                <p>Batch-wise expiry tracking with 30-day advance alerts. Smart reorder points. Dead stock identified before it costs you.</p>
              </div>
            </div>

            {/* ROW 2 — GST Reports (span-1) + Customer & Credit (span-2) */}
            <div className={`bento-card ${why.inView ? "animate-fade-in-up delay-400" : "opacity-0"}`}>
              <div className="bento-glow" style={{ background: "rgba(16,185,129,0.15)" }} />
              <div className="bento-content">
                <div className="bento-icon" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>{Icons.fileText}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.65rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "var(--radius-full)", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#dc2626" }}>Problem: GST filing takes days every month</span>
                </div>
                <h3>One-Click GST Reports.</h3>
                <p>CGST/SGST/IGST auto-split on every sale. GSTR-1 ready report in seconds. Annual GST PDF downloaded anytime.</p>
              </div>
            </div>

            <div className={`bento-card span-2 ${why.inView ? "animate-fade-in-up delay-500" : "opacity-0"}`}>
              <div className="bento-glow" style={{ background: "rgba(139,92,246,0.15)" }} />
              <div className="bento-content" style={{ display: "flex", flexDirection: "row", gap: "2rem", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div className="bento-icon" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>{Icons.users}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.65rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "var(--radius-full)", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#dc2626" }}>Problem: Regular patients wait in long queues</span>
                  </div>
                  <h3>Every Regular Served in Seconds.</h3>
                  <p>Save each customer&apos;s regular medicines. Bill them with one tap. Track credit dues with a live ledger. Show full purchase history at billing.</p>
                </div>
                <div style={{ flex: "0 0 170px" }} className="hide-mobile">
                  <div style={{ padding: "1rem", background: "var(--color-surface-container-lowest)", borderRadius: "0.875rem", border: "1px solid var(--color-surface-variant)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
                        <span style={{ transform: "scale(0.7)", display: "flex" }}>{Icons.user}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-on-surface)" }}>Ramesh K.</div>
                        <div style={{ fontSize: "0.58rem", color: "#ef4444", fontWeight: 600 }}>₹2,400 due</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--color-on-surface-variant)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>Regular Medicines</div>
                    {["Metformin 500mg", "Amlodipine 5mg"].map(med => (
                      <div key={med} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0" }}>
                        <span style={{ color: "#8b5cf6", display: "flex", transform: "scale(0.75)" }}>{Icons.pill}</span>
                        <span style={{ fontSize: "0.65rem", color: "var(--color-on-surface-variant)" }}>{med}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 3 — Reports & Profit (span-2) + Promotions (span-1) */}
            <div className={`bento-card span-2 ${why.inView ? "animate-fade-in-up delay-600" : "opacity-0"}`}>
              <div className="bento-glow" style={{ background: "rgba(59,130,246,0.15)" }} />
              <div className="bento-content" style={{ display: "flex", flexDirection: "row", gap: "2rem", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div className="bento-icon" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>{Icons.trendingUp}</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.65rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "var(--radius-full)", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#dc2626" }}>Problem: No idea if today was profitable</span>
                  </div>
                  <h3>Your Numbers, Every Day.</h3>
                  <p>Daily sales, Profit &amp; Loss, expense analysis, stock valuation, expiry, sales return and purchase return reports — all generated automatically. PDF or Excel.</p>
                </div>
                <div style={{ flex: 1 }} className="hide-mobile">
                  <div style={{ padding: "1.25rem", background: "var(--color-surface-container-lowest)", borderRadius: "1rem", border: "1px solid var(--color-surface-variant)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--color-on-surface-variant)" }}>This Week</span>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#10b981" }}>+12% profit ↑</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "52px" }}>
                      {[40, 60, 45, 75, 55, 90, 70].map((h, i) => (
                        <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 5 ? "#3b82f6" : "#e2e8f0", borderRadius: "2px 2px 0 0", transition: "height 0.3s ease" }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
                      <span style={{ fontSize: "0.55rem", color: "var(--color-on-surface-variant)" }}>Mon</span>
                      <span style={{ fontSize: "0.55rem", color: "#3b82f6", fontWeight: 700 }}>Sat</span>
                      <span style={{ fontSize: "0.55rem", color: "var(--color-on-surface-variant)" }}>Sun</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`bento-card ${why.inView ? "animate-fade-in-up delay-600" : "opacity-0"}`}>
              <div className="bento-glow" style={{ background: "rgba(245,158,11,0.15)" }} />
              <div className="bento-content">
                <div className="bento-icon" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>{Icons.gift}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.65rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "var(--radius-full)", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#dc2626" }}>Problem: Festival seasons pass without offers</span>
                </div>
                <h3>Turn Festivals Into Revenue.</h3>
                <p>Festival and offer promotions (Buy X Get Y Free) that apply automatically at billing. Track every use and rupee earned per campaign.</p>
              </div>
            </div>

          </div>
        </div>

        <style>{`
           .bento-grid {
             display: grid;
             grid-template-columns: repeat(3, 1fr);
             gap: 1.5rem;
           }
           @media (max-width: 1024px) {
             .bento-grid { grid-template-columns: repeat(2, 1fr); }
           }
           @media (max-width: 640px) {
             .bento-grid { grid-template-columns: 1fr; }
           }
           
           .bento-card {
             position: relative;
             background: rgba(255, 255, 255, 0.7);
             backdrop-filter: blur(24px);
             -webkit-backdrop-filter: blur(24px);
             border: 1px solid rgba(255, 255, 255, 0.9);
             border-radius: 1.5rem;
             overflow: hidden;
             transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.4s ease;
             isolation: isolate;
             box-shadow: 0 4px 15px rgba(0,0,0,0.02);
           }
           
           .bento-card:hover {
             transform: translateY(-4px) scale(1.005);
             box-shadow: 0 20px 40px rgba(99, 102, 241, 0.12), 0 0 0 1px rgba(99, 102, 241, 0.2);
             border-color: transparent;
             z-index: 2;
           }
           
           .bento-card.span-2 {
             grid-column: span 2;
           }
           @media (max-width: 1024px) {
             .bento-card.span-2 { grid-column: span 1; }
             .bento-card .bento-content { flex-direction: column !important; align-items: flex-start !important; }
             .hide-mobile { display: none !important; }
           }
           
           .bento-glow {
             position: absolute;
             top: 50%;
             left: 50%;
             width: 120%;
             height: 120%;
             transform: translate(-50%, -50%);
             border-radius: 50%;
             opacity: 0;
             transition: opacity 0.4s ease;
             z-index: -1;
             pointer-events: none;
             filter: blur(60px);
           }
           
           .bento-card:hover .bento-glow {
             opacity: 1;
           }
           
           .bento-content {
             padding: 2.5rem;
             height: 100%;
             display: flex;
             flex-direction: column;
           }
           
           .bento-icon {
             width: 3.5rem;
             height: 3.5rem;
             border-radius: 1rem;
             display: flex;
             align-items: center;
             justify-content: center;
             margin-bottom: 1.5rem;
             transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
             flex-shrink: 0;
           }
           
           .bento-card:hover .bento-icon {
             transform: scale(1.1) rotate(-5deg);
           }
           
           .bento-content h3 {
             font-size: 1.25rem;
             font-weight: 700;
             color: var(--color-on-surface);
             margin-bottom: 0.75rem;
             letter-spacing: -0.01em;
           }
           
           .bento-content p {
             color: var(--color-on-surface-variant);
             line-height: 1.6;
             font-size: 0.95rem;
             margin: 0;
           }
        `}</style>
      </section>


      <FeatureSetSection />

      {/* ───────────────────── HOW IT WORKS ───────────────────── */}
      <section
        ref={steps.ref}
        id="getting-started"
        style={{ padding: "clamp(2.5rem, 5vw, 5rem) 0", background: "var(--color-surface)", position: "relative", overflow: "hidden" }}
      >
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "100%", height: "2px", background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)" }} />
        
        <div className="section-container" style={{ position: "relative", zIndex: 10 }}>
          <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 5rem auto" }}>
            <div
              className={steps.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.4rem 1rem 0.4rem 0.5rem",
                background: "rgba(99,102,241,0.08)", borderRadius: "var(--radius-full)",
                marginBottom: "1.25rem",
                border: "1px solid rgba(99,102,241,0.15)"
              }}
            >
              <span style={{
                background: "linear-gradient(135deg, #818cf8, #6366f1)", color: "white",
                borderRadius: "var(--radius-full)", width: "24px", height: "24px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              </span>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" }}>Getting Started</span>
            </div>
            <h2 className={steps.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
              style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 800, color: "var(--color-on-surface)", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Up and running in <span className="gradient-primary-text">3 simple steps</span>
            </h2>
          </div>

          <div className="steps-flow-container">
            {/* The Connecting Line */}
            <div className="steps-connector hide-mobile">
               <div className="steps-connector-progress" style={{ width: steps.inView ? "100%" : "0%" }}></div>
            </div>

            <div className="steps-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "2rem",
              position: "relative",
            }}>
              {[
                { step: "01", icon: Icons.upload, title: "Install & Import", desc: "Download ShelfCure and import your existing inventory via CSV or start fresh.", align: "up" },
                { step: "02", icon: Icons.cpu, title: "Let AI Analyze", desc: "Our AI engine categorizes products, detects duplicates, and sets up smart alerts automatically.", align: "down" },
                { step: "03", icon: Icons.download, title: "Start Selling", desc: "Begin billing, track sales, manage customers, and generate reports — all from day one.", align: "up" },
              ].map((s, i) => (
                <div
                  key={s.step}
                  className={`step-card ${s.align} ${steps.inView ? "animate-fade-in-up" : "opacity-0"}`}
                  style={{ animationDelay: `${0.2 + i * 0.2}s` }}
                >
                  <div className="step-glow"></div>
                  
                  <div className="step-number-pill">
                    <span className="step-number-text">{s.step}</span>
                  </div>

                  <div className="step-icon-wrapper">
                    {s.icon}
                  </div>
                  
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <style>{`
            .steps-flow-container {
               position: relative;
               padding-bottom: 2rem;
            }
            .steps-connector {
               position: absolute;
               top: 50%;
               left: 10%;
               right: 10%;
               height: 2px;
               background: rgba(99,102,241,0.1);
               z-index: 0;
               transform: translateY(-50%);
            }
            .steps-connector-progress {
               height: 100%;
               background: linear-gradient(90deg, #818cf8, #a78bfa);
               box-shadow: 0 0 10px rgba(99,102,241,0.5);
               transition: width 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.5s;
            }
            
            .step-card {
              position: relative;
              background: rgba(255,255,255,0.7);
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              border: 1px solid rgba(255,255,255,0.9);
              border-radius: 1.5rem;
              padding: 3rem 2rem;
              text-align: center;
              transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s ease;
              z-index: 1;
            }
            
            .step-card.up { transform: translateY(-20px); }
            .step-card.down { transform: translateY(20px); }
            
            .step-card:hover {
              transform: translateY(calc(var(--base-transform, 0px) - 10px)) scale(1.02) !important;
              box-shadow: 0 20px 40px rgba(99, 102, 241, 0.12), 0 0 0 1px rgba(99, 102, 241, 0.2);
              border-color: transparent;
            }
            .step-card.up:hover { --base-transform: -20px; }
            .step-card.down:hover { --base-transform: 20px; }
            
            .step-glow {
               position: absolute;
               top: 50%; left: 50%; width: 100%; height: 100%;
               transform: translate(-50%, -50%);
               background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
               opacity: 0;
               transition: opacity 0.4s ease;
               pointer-events: none;
               z-index: -1;
               border-radius: 50%;
               filter: blur(20px);
            }
            .step-card:hover .step-glow { opacity: 1; }
            
            .step-number-pill {
               position: absolute;
               top: -16px;
               left: 50%;
               transform: translateX(-50%);
               background: var(--color-surface);
               border: 1px solid rgba(99,102,241,0.2);
               padding: 0.25rem 1rem;
               border-radius: 20px;
               box-shadow: 0 4px 10px rgba(0,0,0,0.05);
               z-index: 2;
               transition: all 0.3s ease;
            }
            .step-card:hover .step-number-pill {
               border-color: #6366f1;
               box-shadow: 0 4px 15px rgba(99,102,241,0.2);
            }
            
            .step-number-text {
               font-family: var(--font-display);
               font-weight: 800;
               font-size: 0.875rem;
               background: linear-gradient(135deg, #6366f1, #a78bfa);
               -webkit-background-clip: text;
               -webkit-text-fill-color: transparent;
            }
            
            .step-icon-wrapper {
               width: 4.5rem;
               height: 4.5rem;
               margin: 0 auto 1.5rem;
               border-radius: 1.25rem;
               background: linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(129,140,248,0.05) 100%);
               color: #6366f1;
               display: flex;
               align-items: center;
               justify-content: center;
               transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .step-card:hover .step-icon-wrapper {
               transform: scale(1.1) rotate(5deg);
               background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(129,140,248,0.1) 100%);
            }
            
            .step-title {
               font-size: 1.25rem;
               font-weight: 700;
               color: var(--color-on-surface);
               margin-bottom: 0.75rem;
            }
            
            .step-desc {
               font-size: 0.95rem;
               color: var(--color-on-surface-variant);
               line-height: 1.6;
            }
            
            @media (max-width: 768px) {
              .steps-grid {
                grid-template-columns: 1fr !important;
                gap: 3rem !important;
              }
              .step-card.up, .step-card.down { transform: none !important; }
              .step-card.up:hover, .step-card.down:hover { --base-transform: 0px; }
              .hide-mobile { display: none !important; }
            }
          `}</style>
        </div>
      </section>

      {/* ───────────────────── CTA / NEWSLETTER ───────────────────── */}
      <section
        ref={cta.ref}
        id="cta"
        style={{
          padding: "clamp(2rem, 4vw, 4rem) 0",
          background: "linear-gradient(180deg, #eef2ff 0%, #f0f4ff 100%)",
        }}
      >
        <div className="section-container">
          <div
            className={cta.inView ? "animate-fade-in-up" : ""}
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)",
              borderRadius: "1.75rem",
              padding: "clamp(2rem, 5vw, 4rem) clamp(1.25rem, 4vw, 3rem)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative circles */}
            <div style={{
              position: "absolute", top: "-60px", right: "-40px",
              width: 200, height: 200, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", bottom: "-40px", left: "-30px",
              width: 160, height: 160, borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              pointerEvents: "none",
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 700, color: "#fff", marginBottom: "1rem", lineHeight: 1.2 }}>
                Ready to transform your pharmacy?
              </h2>
              <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.85)", maxWidth: "500px", margin: "0 auto 2rem", lineHeight: 1.7 }}>
                Join thousands of pharmacies already using ShelfCure to save time,
                reduce waste, and grow revenue.
              </p>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "0.75rem", maxWidth: "480px", margin: "0 auto", flexWrap: "wrap",
              }}>
                <Link
                  href="/panel/register"
                  style={{
                  padding: "1rem 2.5rem",
                  borderRadius: "var(--radius-full)",
                  background: "#fff",
                  color: "#4f46e5",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "1rem",
                  textDecoration: "none",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
                  }}
                >
                  Create Free Account
                </Link>
              </div>

              <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(255,255,255,0.5)", marginTop: "1rem" }}>
                Free 7-day trial • No credit card required
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
