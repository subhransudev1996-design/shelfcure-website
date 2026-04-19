import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <>
      <footer style={{
        padding: "5rem 0 2rem",
        background: "linear-gradient(180deg, var(--color-surface) 0%, #eef2ff 100%)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle ambient glow */}
        <div style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "2px",
          background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.2), rgba(129,140,248,0.3), rgba(99,102,241,0.2), transparent)",
        }} />

        <div className="section-container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "3rem",
            marginBottom: "3rem",
          }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.25rem" }}>
                <Image
                  src="/logo.png"
                  alt="ShelfCure"
                  width={120}
                  height={32}
                  style={{ height: "32px", width: "auto", objectFit: "contain" }}
                />
              </div>
              <p className="text-body-md" style={{ maxWidth: "280px", color: "var(--color-on-surface-variant)" }}>
                AI-powered pharmacy management software. Smart inventory, lightning
                billing, and actionable analytics for the modern pharmacist.
              </p>
              {/* Social icons placeholder */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                {["Twitter", "LinkedIn", "GitHub"].map((s) => (
                  <a key={s} href="#" style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(99,102,241,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6366f1",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                    className="footer-social"
                    title={s}
                  >
                    {s[0]}
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <p className="text-label-lg" style={{ color: "var(--color-on-surface)", marginBottom: "1rem" }}>Product</p>
              {["Features", "Pricing", "Download"].map((l) => (
                <Link key={l} href={l === "Features" ? "/features" : l === "Pricing" ? "/pricing" : l === "Download" ? "/download" : `/#${l.toLowerCase()}`} style={{
                  display: "block",
                  padding: "0.375rem 0",
                  color: "var(--color-on-surface-variant)",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  transition: "color 0.2s ease",
                }}
                  className="footer-link"
                >
                  {l}
                </Link>
              ))}
            </div>

            {/* Company */}
            <div>
              <p className="text-label-lg" style={{ color: "var(--color-on-surface)", marginBottom: "1rem" }}>Company</p>
              {["About", "Blog", "Careers", "Contact"].map((l) => (
                <Link key={l} href={l === "About" ? "/about" : l === "Contact" ? "/contact" : l === "Blog" ? "/blog" : l === "Careers" ? "/careers" : "#"} style={{
                  display: "block",
                  padding: "0.375rem 0",
                  color: "var(--color-on-surface-variant)",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  transition: "color 0.2s ease",
                }}
                  className="footer-link"
                >
                  {l}
                </Link>
              ))}
            </div>

            {/* Legal */}
            <div>
              <p className="text-label-lg" style={{ color: "var(--color-on-surface)", marginBottom: "1rem" }}>Legal</p>
              {["Privacy Policy", "Terms of Service", "Refund Policy"].map((l) => (
                <Link key={l} href={l === "Privacy Policy" ? "/privacy" : l === "Terms of Service" ? "/terms" : "/refund"} style={{
                  display: "block",
                  padding: "0.375rem 0",
                  color: "var(--color-on-surface-variant)",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  transition: "color 0.2s ease",
                }}
                  className="footer-link"
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>

          {/* Footer bottom */}
          <div style={{
            paddingTop: "2rem",
            borderTop: "1px solid rgba(99,102,241,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}>
            <p className="text-label-md" style={{ color: "var(--color-outline)" }}>
              © 2025 ShelfCure. All rights reserved.
            </p>
            <p className="text-label-md" style={{ color: "var(--color-outline)" }}>
              Made with care for pharmacists everywhere.
            </p>
          </div>
        </div>

        {/* Footer responsive */}
        <style>{`
          .footer-link:hover { color: #6366f1 !important; }
          .footer-social:hover {
            background: rgba(99,102,241,0.15) !important;
            transform: translateY(-2px);
          }
          @media (max-width: 768px) {
            footer > div > div:first-child {
              grid-template-columns: 1fr 1fr !important;
              gap: 2rem !important;
            }
          }
          @media (max-width: 480px) {
            footer > div > div:first-child {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </footer>
    </>
  );
}
