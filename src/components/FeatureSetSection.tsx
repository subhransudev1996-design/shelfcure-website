"use client";
import { useState } from "react";
import { Icons } from "./Icons";

const categories = [
  {
    id: "billing",
    icon: Icons.zap,
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #6366f1, #818cf8)",
    bg: "rgba(99,102,241,0.1)",
    label: "Smart Billing",
    tagline: "Bill smarter, sell faster",
    href: "/features#billing",
    features: [
      { text: "AI-powered bill scanning", hot: true },
      { text: "Barcode scanner support", hot: false },
      { text: "Edit bill after saving", hot: false },
      { text: "Sales & purchase returns", hot: false },
      { text: "Quick favourites list", hot: true },
      { text: "Auto medicine suggestions", hot: false },
    ],
  },
  {
    id: "inventory",
    icon: Icons.box,
    color: "#0ea5e9",
    gradient: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
    bg: "rgba(14,165,233,0.1)",
    label: "Inventory Control",
    tagline: "Never run out of stock",
    href: "/features#inventory",
    features: [
      { text: "12,000+ medicine database", hot: true },
      { text: "Expiry date alerts", hot: false },
      { text: "Low stock reorder alerts", hot: true },
      { text: "Batch & lot tracking", hot: false },
      { text: "Auto-generate challan", hot: false },
      { text: "Real-time stock levels", hot: false },
    ],
  },
  {
    id: "gst",
    icon: Icons.fileText,
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #34d399)",
    bg: "rgba(16,185,129,0.1)",
    label: "GST & Compliance",
    tagline: "Stay compliant, always",
    href: "/features#gst",
    features: [
      { text: "GSTR-1 ready reports", hot: true },
      { text: "Auto HSN code mapping", hot: false },
      { text: "CGST/SGST/IGST split", hot: false },
      { text: "Annual PDF export", hot: false },
      { text: "Tax summary dashboard", hot: true },
      { text: "One-click filing prep", hot: false },
    ],
  },
  {
    id: "reports",
    icon: Icons.trendingUp,
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
    bg: "rgba(245,158,11,0.1)",
    label: "Reports & Profit",
    tagline: "Know your numbers daily",
    href: "/features#reports",
    features: [
      { text: "Daily profit & loss", hot: true },
      { text: "Top selling medicines", hot: false },
      { text: "Slow-moving stock report", hot: false },
      { text: "Expense tracker", hot: false },
      { text: "Net profit trend chart", hot: true },
      { text: "Monthly comparison", hot: false },
    ],
  },
  {
    id: "customers",
    icon: Icons.user,
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
    bg: "rgba(139,92,246,0.1)",
    label: "Customer & Credit",
    tagline: "Build loyal relationships",
    href: "/features#customers",
    features: [
      { text: "Credit ledger per customer", hot: true },
      { text: "Regular medicine profiles", hot: false },
      { text: "Outstanding dues tracker", hot: false },
      { text: "One-click rebill", hot: true },
      { text: "Customer visit history", hot: false },
      { text: "SMS due reminders", hot: false },
    ],
  },
  {
    id: "suppliers",
    icon: Icons.store,
    color: "#ec4899",
    gradient: "linear-gradient(135deg, #ec4899, #f472b6)",
    bg: "rgba(236,72,153,0.1)",
    label: "Supplier Mgmt",
    tagline: "Manage your supply chain",
    href: "/features#suppliers",
    features: [
      { text: "Supplier ledger & history", hot: false },
      { text: "Purchase return tracking", hot: true },
      { text: "Payment due alerts", hot: false },
      { text: "Multi-supplier comparison", hot: false },
      { text: "Order history log", hot: false },
      { text: "Pending challan view", hot: true },
    ],
  },
  {
    id: "promotions",
    icon: Icons.sparkle,
    color: "#f97316",
    gradient: "linear-gradient(135deg, #f97316, #fb923c)",
    bg: "rgba(249,115,22,0.1)",
    label: "Promotions",
    tagline: "Drive more sales",
    href: "/features#promotions",
    features: [
      { text: "Festival discount offers", hot: true },
      { text: "Buy X get Y free", hot: false },
      { text: "Scheme management", hot: false },
      { text: "Promotion usage tracking", hot: false },
      { text: "Date-range scheduling", hot: true },
      { text: "Category-level offers", hot: false },
    ],
  },
];

export function FeatureSetSection() {
  const [active, setActive] = useState(0);
  const cat = categories[active];

  return (
    <section
      style={{
        padding: "clamp(2.5rem, 5vw, 5rem) 0",
        background: "var(--color-background)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: "var(--radius-full)",
              padding: "0.35rem 1rem",
              marginBottom: "1.5rem",
            }}
          >
            <span style={{ display: "flex", color: "#6366f1" }}>{Icons.sparkle}</span>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#6366f1",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Complete Feature Set
            </span>
          </div>
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "var(--color-on-surface)",
              letterSpacing: "-0.03em",
              marginBottom: "1rem",
              lineHeight: 1.1,
            }}
          >
            One software.{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #6366f1, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Every pharmacy need.
            </span>
          </h2>
          <p
            style={{
              fontSize: "1.05rem",
              color: "var(--color-on-surface-variant)",
              maxWidth: "520px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            From AI billing to GST — everything built into one offline-first desktop app.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="feat-tab-scroll">
          {categories.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActive(i)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1.1rem",
                borderRadius: "var(--radius-full)",
                border: active === i ? "1.5px solid transparent" : "1.5px solid var(--color-outline-variant)",
                background:
                  active === i
                    ? c.gradient
                    : "var(--color-surface)",
                color: active === i ? "#fff" : "var(--color-on-surface-variant)",
                fontWeight: 600,
                fontSize: "0.82rem",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                boxShadow: active === i ? `0 4px 16px ${c.bg}` : "none",
                transform: active === i ? "scale(1.04)" : "scale(1)",
              }}
            >
              <span
                style={{
                  display: "flex",
                  color: active === i ? "rgba(255,255,255,0.9)" : c.color,
                  transition: "color 0.2s",
                }}
              >
                {c.icon}
              </span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Main Panel */}
        <div
          key={cat.id}
          className="feat-main-panel"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            maxWidth: "960px",
            margin: "0 auto 3rem",
            animation: "feat-panel-in 0.35s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {/* Left: Info + features list */}
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "1.5rem",
              padding: "2rem",
              border: `1.5px solid ${cat.color}30`,
              boxShadow: `0 8px 32px ${cat.bg}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top accent bar */}
            <div
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: "3px",
                background: cat.gradient,
                borderRadius: "1.5rem 1.5rem 0 0",
              }}
            />

            {/* Icon + title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "1rem",
                  background: cat.gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  boxShadow: `0 6px 20px ${cat.bg}`,
                  flexShrink: 0,
                }}
              >
                {cat.icon}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "1.2rem",
                    color: "var(--color-on-surface)",
                    lineHeight: 1.2,
                  }}
                >
                  {cat.label}
                </div>
                <div style={{ fontSize: "0.82rem", color: cat.color, fontWeight: 600 }}>
                  {cat.tagline}
                </div>
              </div>
            </div>

            {/* Feature count pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: cat.bg,
                border: `1px solid ${cat.color}30`,
                borderRadius: "var(--radius-full)",
                padding: "0.25rem 0.75rem",
                marginBottom: "1.5rem",
                marginTop: "0.5rem",
              }}
            >
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: cat.color }}>
                {cat.features.length} features included
              </span>
            </div>

            {/* Feature list */}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {cat.features.map((f, i) => (
                <li
                  key={f.text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "0.75rem",
                    background: "var(--color-background)",
                    border: "1px solid var(--color-outline-variant)",
                    fontSize: "0.875rem",
                    color: "var(--color-on-surface)",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                    animationDelay: `${i * 0.06}s`,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = `${cat.color}50`;
                    (e.currentTarget as HTMLElement).style.background = cat.bg;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-outline-variant)";
                    (e.currentTarget as HTMLElement).style.background = "var(--color-background)";
                  }}
                >
                  <span
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: cat.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {Icons.check}
                  </span>
                  <span style={{ flex: 1 }}>{f.text}</span>
                  {f.hot && (
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        color: "#fff",
                        background: cat.gradient,
                        padding: "0.1rem 0.45rem",
                        borderRadius: "99px",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      Popular
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Visual preview card */}
          <div
            style={{
              background: cat.gradient,
              borderRadius: "1.5rem",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
              minHeight: "380px",
            }}
          >
            {/* Decorative circles */}
            <div
              style={{
                position: "absolute",
                top: "-40px", right: "-40px",
                width: "180px", height: "180px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-30px", left: "-30px",
                width: "140px", height: "140px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "0.75rem",
                }}
              >
                Why pharmacies love it
              </div>
              <div
                style={{
                  fontSize: "clamp(1.4rem, 3vw, 2rem)",
                  fontWeight: 800,
                  color: "#fff",
                  lineHeight: 1.25,
                  marginBottom: "1.5rem",
                }}
              >
                {cat.label} built for real Indian pharmacies
              </div>

              {/* Mini stat cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { label: "Setup time", value: "< 5 min" },
                  { label: "Features in module", value: `${cat.features.length}+` },
                  { label: "Pharmacies using", value: "2,400+" },
                ].map(s => (
                  <div
                    key={s.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "rgba(255,255,255,0.14)",
                      borderRadius: "0.875rem",
                      padding: "0.75rem 1rem",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
                      {s.label}
                    </span>
                    <span style={{ fontSize: "1rem", fontWeight: 800, color: "#fff" }}>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href={cat.href}
              style={{
                position: "relative",
                zIndex: 1,
                marginTop: "1.5rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(255,255,255,0.95)",
                color: cat.color,
                padding: "0.7rem 1.5rem",
                borderRadius: "var(--radius-full)",
                fontWeight: 700,
                fontSize: "0.875rem",
                textDecoration: "none",
                transition: "all 0.25s ease",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                alignSelf: "flex-start",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.18)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
              }}
            >
              Explore {cat.label}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom category quick-links (all 7 as mini cards on desktop) */}
        <div className="feat-bottom-grid">
          {categories.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActive(i)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.875rem 0.5rem",
                borderRadius: "1rem",
                border: active === i ? `1.5px solid ${c.color}` : "1.5px solid var(--color-outline-variant)",
                background: active === i ? c.bg : "var(--color-surface)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: active === i ? `0 4px 16px ${c.bg}` : "none",
              }}
              onMouseEnter={e => {
                if (active !== i) {
                  (e.currentTarget as HTMLElement).style.borderColor = `${c.color}50`;
                  (e.currentTarget as HTMLElement).style.background = c.bg;
                }
              }}
              onMouseLeave={e => {
                if (active !== i) {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-outline-variant)";
                  (e.currentTarget as HTMLElement).style.background = "var(--color-surface)";
                }
              }}
            >
              <span style={{ display: "flex", color: c.color }}>{c.icon}</span>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: active === i ? c.color : "var(--color-on-surface-variant)",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {c.label}
              </span>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <a
            href="/features"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              color: "#fff",
              padding: "0.875rem 2.25rem",
              borderRadius: "var(--radius-full)",
              fontWeight: 700,
              fontSize: "0.95rem",
              textDecoration: "none",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(99,102,241,0.4)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(99,102,241,0.3)";
            }}
          >
            <span style={{ display: "flex" }}>{Icons.sparkle}</span>
            View all features in detail
          </a>
        </div>
      </div>

      <style>{`
        @keyframes feat-panel-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .feat-tab-scroll {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 3rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .feat-bottom-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.75rem;
          margin-bottom: 3rem;
        }
        @media (max-width: 768px) {
          .feat-main-panel {
            grid-template-columns: 1fr !important;
          }
          .feat-tab-scroll, .feat-bottom-grid {
            display: flex;
            flex-wrap: nowrap;
            justify-content: flex-start;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding-bottom: 0.5rem;
          }
          .feat-tab-scroll::-webkit-scrollbar, .feat-bottom-grid::-webkit-scrollbar {
            display: none;
          }
          .feat-tab-scroll > button {
            flex-shrink: 0;
            white-space: nowrap;
          }
          .feat-bottom-grid > button {
            flex-shrink: 0;
            min-width: 120px;
          }
        }
      `}</style>
    </section>
  );
}
