"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Icons } from "@/components/Icons";

/* ─── Typewriter Hook ─── */
export function useTypewriter(words: string[], speed = 80, pause = 2200, deleteSpeed = 40) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // stringify words to prevent infinite re-renders when inline arrays are passed
  const wordsJson = JSON.stringify(words);

  useEffect(() => {
    const parsedWords = JSON.parse(wordsJson);
    const current = parsedWords[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && text === current) {
      timeout = setTimeout(() => setIsDeleting(true), pause);
    } else if (isDeleting && text === "") {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % parsedWords.length);
      }, deleteSpeed);
    } else {
      timeout = setTimeout(
        () => {
          setText(
            isDeleting
              ? current.slice(0, text.length - 1)
              : current.slice(0, text.length + 1)
          );
        },
        isDeleting ? deleteSpeed : speed
      );
    }
    return () => clearTimeout(timeout);
  }, [text, wordIndex, isDeleting, wordsJson, speed, pause, deleteSpeed]);

  return text;
}

/* ─── Count Up Hook ─── */
function useCountUp(end: number, duration = 2000, start = 0, trigger = true) {
  const [value, setValue] = useState(start);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger) return;
    const startTime = performance.now();
    const range = end - start;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart for a satisfying end
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(start + range * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration, start, trigger]);

  return value;
}

/* ─── Notification Toast Data ─── */
const TOASTS = [
  { icon: "📄", title: "Invoice Scanned", desc: "32 items extracted in 2.3s", color: "#6366f1" },
  { icon: "✅", title: "GST Auto-Split", desc: "CGST 9% + SGST 9% applied", color: "#10b981" },
  { icon: "📦", title: "Batch Mapped", desc: "Batch #AX7819 → Paracetamol", color: "#8b5cf6" },
  { icon: "⚡", title: "Anomaly Detected", desc: "MRP mismatch on row 14", color: "#f59e0b" },
  { icon: "📱", title: "Scanner Connected", desc: "Phone scanner linked via Wi-Fi", color: "#3b82f6" },
];

interface HeroSectionProps {
  heroRef: React.RefObject<HTMLDivElement | null>;
  inView: boolean;
}

export function HeroSection({ heroRef, inView }: HeroSectionProps) {
  /* Typewriter */
  const typewriterText = useTypewriter(
    ["Zero Typing Required.", "AI-Powered Billing.", "Instant Inventory Sync.", "Smart Batch Tracking."],
    70,
    2400,
    35
  );

  /* Count-up stats */
  const countInvoices = useCountUp(47820, 2500, 0, inView);
  const countAccuracy = useCountUp(982, 2200, 0, inView);
  const countPharmacies = useCountUp(2500, 2000, 0, inView);

  /* Sequential toasts */
  const [activeToast, setActiveToast] = useState(0);
  const [toastVisible, setToastVisible] = useState(true);
  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setToastVisible(false);
      setTimeout(() => {
        setActiveToast((prev) => (prev + 1) % TOASTS.length);
        setToastVisible(true);
      }, 400);
    }, 3200);
    return () => clearInterval(interval);
  }, [inView]);

  /* Mouse parallax orb */
  const sectionRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  /* 3D tilt on dashboard card */
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setTilt({ x, y });
  }, []);
  const resetTilt = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  /* Scanning beam Y position */
  const [scanY, setScanY] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let frame: number;
    let start: number | null = null;
    function animate(ts: number) {
      if (!start) start = ts;
      const elapsed = (ts - start) % 4000;
      setScanY((elapsed / 4000) * 100);
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [inView]);

  const currentToast = TOASTS[activeToast];

  return (
    <div ref={heroRef}>
      <section
        ref={sectionRef}
        className="hero-section"
        onMouseMove={handleMouseMove}
        style={{
          paddingTop: "140px",
          paddingBottom: "0",
          position: "relative",
          overflow: "hidden",
          minHeight: "100vh",
          background: "linear-gradient(180deg, #0c0a1f 0%, #110e2e 30%, #151136 60%, #0c0a1f 100%)",
        }}
      >
      {/* ── MOUSE-FOLLOWING GRADIENT ORB ── */}
      <div
        style={{
          position: "absolute",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(129,140,248,0.05) 50%, transparent 70%)",
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          transform: "translate(-50%, -50%)",
          transition: "left 0.6s ease-out, top 0.6s ease-out",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Animated mesh lines ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Floating particles ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="hero-particle"
            style={{
              position: "absolute",
              width: `${2 + (i % 4)}px`,
              height: `${2 + (i % 4)}px`,
              borderRadius: "50%",
              background: `rgba(129, 140, 248, ${0.15 + (i % 4) * 0.1})`,
              top: `${(i * 3.3) % 100}%`,
              left: `${(i * 7.1 + 2) % 100}%`,
              animationDelay: `${(i * 0.3) % 10}s`,
              animationDuration: `${5 + (i % 7)}s`,
            }}
          />
        ))}
      </div>

      {/* ── Ambient glow spots ── */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "20%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "15%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ═══ MAIN CONTENT ═══ */}
      <div
        className="section-container"
        style={{
          position: "relative",
          zIndex: 2,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4rem",
          alignItems: "center",
          minHeight: "calc(100vh - 140px)",
        }}
      >
        {/* ── LEFT COLUMN: Text + CTAs ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {/* Glowing AI badge */}
          <div
            className={inView ? "animate-fade-in-up" : ""}
            style={{
              marginBottom: "1.75rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.4rem 1rem 0.4rem 0.5rem",
              background: "rgba(99,102,241,0.1)",
              backdropFilter: "blur(12px)",
              borderRadius: "var(--radius-full)",
              border: "1px solid rgba(99,102,241,0.2)",
              width: "fit-content",
            }}
          >
            <span
              className="hero-badge-glow"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #818cf8, #6366f1)",
                boxShadow: "0 0 12px rgba(99,102,241,0.4)",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M12 3l1.9 5.8a2 2 0 001.3 1.3L21 12l-5.8 1.9a2 2 0 00-1.3 1.3L12 21l-1.9-5.8a2 2 0 00-1.3-1.3L3 12l5.8-1.9a2 2 0 001.3-1.3z" />
              </svg>
            </span>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#c7d2fe", letterSpacing: "0.03em" }}>
              Powered by Shelfcure AI
            </span>
            <span
              className="hero-badge-dot"
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#818cf8",
                boxShadow: "0 0 8px #818cf8",
              }}
            />
          </div>

          {/* Main headline */}
          <h1
            className={inView ? "animate-fade-in-up delay-100" : ""}
            style={{
              fontSize: "clamp(2.5rem, 4.5vw, 4rem)",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "white",
              fontFamily: "var(--font-display)",
            }}
          >
            Automate Your
            <br />
            Pharmacy Billing.
          </h1>

          {/* Typewriter line */}
          <div
            className={inView ? "animate-fade-in-up delay-200" : ""}
            style={{
              marginTop: "0.75rem",
              fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              fontFamily: "var(--font-display)",
              minHeight: "3.5rem",
            }}
          >
            <span
              style={{
                background: "linear-gradient(135deg, #818cf8 0%, #a5b4fc 40%, #c7d2fe 80%, #818cf8 100%)",
                backgroundSize: "300% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "gradient-shift 6s ease-in-out infinite",
              }}
            >
              {typewriterText}
            </span>
            <span
              className="hero-cursor-blink"
              style={{
                display: "inline-block",
                width: "3px",
                height: "1.2em",
                background: "#818cf8",
                marginLeft: "2px",
                verticalAlign: "text-bottom",
                borderRadius: "2px",
              }}
            />
          </div>

          {/* Subtext */}
          <p
            className={inView ? "animate-fade-in-up delay-200" : ""}
            style={{
              maxWidth: "520px",
              marginTop: "1.5rem",
              color: "rgba(148,163,184,0.9)",
              lineHeight: 1.75,
              fontSize: "1.05rem",
            }}
          >
            Upload purchase bills and let AI extract batch numbers, HSN codes, and GST splits — instantly.
            Turn any smartphone into a wireless barcode scanner.
          </p>

          {/* CTA buttons */}
          <div
            className={`hero-flex-container ${inView ? "animate-fade-in-up delay-300" : ""}`}
            style={{
              marginTop: "2.25rem",
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <a
              href="#pricing"
              className="hero-cta-primary"
              style={{
                padding: "1rem 2.25rem",
                fontSize: "1rem",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "white",
                borderRadius: "var(--radius-full)",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 24px rgba(99,102,241,0.4), 0 12px 48px rgba(99,102,241,0.2)",
                transition: "all 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <span style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                Start Free Trial
                {Icons.arrowRight}
              </span>
            </a>
            <a
              href="#demo"
              className="hero-cta-secondary"
              style={{
                padding: "1rem 2.25rem",
                fontSize: "1rem",
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "#c7d2fe",
                borderRadius: "var(--radius-full)",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s ease",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Watch Demo
            </a>
          </div>

          {/* Live stats bar */}
          <div
            className={`hero-flex-container ${inView ? "animate-fade-in-up delay-400" : ""}`}
            style={{
              marginTop: "2.75rem",
              display: "flex",
              gap: "2.5rem",
              flexWrap: "wrap",
            }}
          >
            {[
              { value: `${countPharmacies.toLocaleString()}+`, label: "Pharmacies", icon: "🏪" },
              { value: `${(countAccuracy / 10).toFixed(1)}%`, label: "Accuracy", icon: "🎯" },
              { value: `₹${countInvoices.toLocaleString()}`, label: "Avg Revenue/Day", icon: "📈" },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.9rem" }}>{stat.icon}</span>
                  <span
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 800,
                      color: "white",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "rgba(148,163,184,0.7)", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Interactive Dashboard Showcase ── */}
        <div
          className={`hero-right-col ${inView ? "animate-fade-in-up delay-300" : ""}`}
          style={{ position: "relative", perspective: "1200px" }}
        >
          {/* The 3D-tilt dashboard card */}
          <div
            ref={cardRef}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={resetTilt}
            style={{
              position: "relative",
              borderRadius: "1.5rem",
              overflow: "hidden",
              background: "#0f0f23",
              boxShadow: "0px 30px 80px rgba(0,0,0,0.5), 0px 8px 32px rgba(99,102,241,0.15), 0 0 120px rgba(99,102,241,0.08)",
              transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
              transition: "transform 0.15s ease-out",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Glowing border */}
            <div
              style={{
                position: "absolute",
                inset: "-1px",
                borderRadius: "1.5rem",
                background: "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.2), rgba(99,102,241,0.15))",
                zIndex: 0,
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative", zIndex: 1, borderRadius: "1.5rem", overflow: "hidden", background: "#0f0f23" }}>
              {/* Browser chrome bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.125rem",
                  background: "linear-gradient(180deg, #1a1b2e 0%, #141525 100%)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ display: "flex", gap: "5px" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
                </div>
                <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.3rem 1.25rem",
                      fontSize: "0.65rem",
                      color: "rgba(255,255,255,0.35)",
                      fontFamily: "var(--font-body)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    app.shelfcure.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard content area */}
              <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", background: "#0f0f23" }}>
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  onPlaying={(e) => {
                    const fallback = e.currentTarget.parentElement?.querySelector(".video-fallback") as HTMLElement;
                    if (fallback) fallback.style.opacity = "0";
                  }}
                  onCanPlay={(e) => {
                    e.currentTarget.play().catch(() => {});
                  }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                >
                  <source src="https://videos.pexels.com/video-files/7579956/7579956-hd_1920_1080_30fps.mp4" type="video/mp4" />
                  <source src="https://videos.pexels.com/video-files/5752729/5752729-hd_1920_1080_30fps.mp4" type="video/mp4" />
                </video>

                <div
                  className="video-fallback"
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    transition: "opacity 0.8s ease-out",
                    pointerEvents: "none",
                  }}
                >
                  <Image
                    src="/dashboard-preview.png"
                    alt="ShelfCure Dashboard"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>

                {/* Gradient overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(15,15,35,0.2) 0%, rgba(15,15,35,0.1) 50%, rgba(15,15,35,0.5) 100%)",
                    pointerEvents: "none",
                    zIndex: 2,
                  }}
                />

                {/* ── SCANNING BEAM ── */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: `${scanY}%`,
                    height: "2px",
                    background: "linear-gradient(90deg, transparent 0%, #818cf8 20%, #a5b4fc 50%, #818cf8 80%, transparent 100%)",
                    boxShadow: "0 0 20px rgba(129,140,248,0.5), 0 0 60px rgba(129,140,248,0.2)",
                    zIndex: 3,
                    pointerEvents: "none",
                    transition: "top 0.05s linear",
                  }}
                />

                {/* ── FLOATING METRIC CARDS ── */}
                {/* Revenue card — top right */}
                <div
                  className="hero-floating-card animate-float"
                  style={{
                    position: "absolute",
                    top: "10%",
                    right: "4%",
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "0.875rem",
                    padding: "0.75rem 1rem",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    zIndex: 5,
                    animationDelay: "0s",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #6366f1, #a5b4fc)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.6rem", color: "#64748B", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Revenue
                    </div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1E293B" }}>₹{countInvoices.toLocaleString()}</div>
                  </div>
                </div>

                {/* Items extracted — bottom left */}
                <div
                  className="hero-floating-card animate-float"
                  style={{
                    position: "absolute",
                    bottom: "12%",
                    left: "3%",
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "0.875rem",
                    padding: "0.6rem 0.9rem",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    zIndex: 5,
                    animationDelay: "1.5s",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "8px",
                      background: "#e0e7ff",
                      color: "#6366f1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.58rem", color: "#64748B", fontWeight: 500 }}>Invoice Scanned</div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1E293B" }}>32 items extracted</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── NOTIFICATION TOAST (animated) ── */}
          <div
            style={{
              position: "absolute",
              bottom: "-20px",
              left: "-30px",
              zIndex: 10,
              opacity: toastVisible ? 1 : 0,
              transform: toastVisible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.95)",
              transition: "all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.875rem 1.25rem",
                background: "rgba(15,15,35,0.85)",
                backdropFilter: "blur(20px)",
                borderRadius: "1rem",
                border: `1px solid ${currentToast.color}33`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${currentToast.color}15`,
                minWidth: "260px",
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>{currentToast.icon}</span>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "white" }}>{currentToast.title}</div>
                <div style={{ fontSize: "0.68rem", color: "rgba(148,163,184,0.8)", fontWeight: 500 }}>
                  {currentToast.desc}
                </div>
              </div>
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: currentToast.color,
                  boxShadow: `0 0 8px ${currentToast.color}`,
                  marginLeft: "auto",
                  flexShrink: 0,
                }}
              />
            </div>
          </div>

          {/* Scanners connected pill */}
          <div
            className="hero-floating-card animate-float"
            style={{
              position: "absolute",
              top: "15%",
              right: "-20px",
              background: "rgba(15,15,35,0.85)",
              backdropFilter: "blur(16px)",
              borderRadius: "var(--radius-full)",
              padding: "0.5rem 1rem",
              border: "1px solid rgba(99,102,241,0.2)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              zIndex: 5,
              animationDelay: "2s",
            }}
          >
            <div
              className="hero-status-pulse"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#34d399",
                boxShadow: "0 0 8px #34d399",
              }}
            />
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#e2e8f0" }}>3 scanners connected</span>
          </div>
        </div>
      </div>

      {/* ── Bottom gradient fade into next section ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "120px",
          background: "linear-gradient(180deg, transparent 0%, #0c0a1f 100%)",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />

      {/* ═══ Hero Styles ═══ */}
      <style>{`
        @keyframes particle-drift {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          15% { opacity: 0.8; }
          85% { opacity: 0.3; }
          100% { transform: translateY(-150px) translateX(40px) scale(0.2); opacity: 0; }
        }
        .hero-particle { animation: particle-drift linear infinite; }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes badge-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .hero-badge-dot { animation: badge-pulse 2s ease-in-out infinite; }

        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .hero-cursor-blink { animation: cursor-blink 0.8s step-end infinite; }

        @keyframes badge-glow-pulse {
          0%, 100% { box-shadow: 0 0 12px rgba(99,102,241,0.4); }
          50% { box-shadow: 0 0 24px rgba(99,102,241,0.6); }
        }
        .hero-badge-glow { animation: badge-glow-pulse 3s ease-in-out infinite; }

        @keyframes status-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .hero-status-pulse { animation: status-pulse 2s ease-in-out infinite; }

        .hero-floating-card { transition: transform 0.3s ease; }

        .hero-cta-primary:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 32px rgba(99,102,241,0.5), 0 16px 56px rgba(99,102,241,0.25) !important;
        }
        .hero-cta-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(135deg, transparent, rgba(255,255,255,0.15));
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .hero-cta-primary:hover::after { opacity: 1; }

        .hero-cta-secondary:hover {
          background: rgba(99,102,241,0.12) !important;
          border-color: rgba(99,102,241,0.35) !important;
          transform: translateY(-2px);
        }

        /* ── Mobile responsive ── */
        @media (max-width: 1024px) {
          .section-container {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .hero-right-col {
            max-width: 560px;
            margin: 0 auto;
          }
          .section-container > div:first-child {
            align-items: center;
          }
          .hero-flex-container {
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .hero-floating-card { display: none !important; }
          .hero-section {
            min-height: auto !important;
            padding-bottom: 4rem !important;
          }
          .hero-right-col {
            max-width: 100%;
          }
        }

        @media (max-width: 480px) {
          .section-container {
            gap: 2rem !important;
          }
        }
      `}</style>
      </section>
    </div>
  );
}
