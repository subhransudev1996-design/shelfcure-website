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
                  style={{ height: "auto", width: "auto", maxWidth: "120px", objectFit: "contain" }}
                />
              </div>
              <p className="text-body-md" style={{ maxWidth: "280px", color: "var(--color-on-surface-variant)" }}>
                AI-powered pharmacy management software. Smart inventory, lightning
                billing, and actionable analytics for the modern pharmacist.
              </p>
              {/* Social icons */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                {[
                  {
                    label: "X (Twitter)",
                    href: "#",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    ),
                  },
                  {
                    label: "LinkedIn",
                    href: "#",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    ),
                  },
                  {
                    label: "Instagram",
                    href: "#",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                      </svg>
                    ),
                  },
                  {
                    label: "YouTube",
                    href: "#",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    ),
                  },
                ].map(({ label, href, icon }) => (
                  <a key={label} href={href} aria-label={label} style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(99,102,241,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6366f1",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                    className="footer-social"
                  >
                    {icon}
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
