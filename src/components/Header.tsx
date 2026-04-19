"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "./Icons";

export function Header() {
  const pathname = usePathname();
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" });
    }
    setMobileNav(false);
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Download", href: "/download" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          transition: "all 0.35s ease",
          background: scrolled ? "rgba(248,250,252,0.82)" : "rgba(12,10,31,0.4)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: scrolled ? "1px solid rgba(99,102,241,0.08)" : "1px solid rgba(255,255,255,0.05)",
          ...(scrolled
            ? { boxShadow: "0px 2px 20px rgba(99,102,241,0.04), 0px 6px 30px rgba(99,102,241,0.06)" }
            : {}),
        }}
      >
        <div className="section-container" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "72px",
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
            <Image
              src="/logo.png"
              alt="ShelfCure"
              width={140}
              height={36}
              style={{
                height: "36px",
                width: "auto",
                objectFit: "contain",
                filter: scrolled ? "none" : "brightness(10)",
                transition: "filter 0.35s ease",
              }}
              priority
            />
          </Link>

          {/* Desktop Links */}
          <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }} className="nav-desktop">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`nav-link ${scrolled ? "" : "nav-link-dark"}`}
                  style={{
                    color: isActive
                      ? "#818cf8"
                      : scrolled
                        ? "var(--color-on-surface-variant)"
                        : "rgba(255,255,255,0.8)",
                    fontWeight: isActive ? 600 : 500,
                    transition: "color 0.35s ease",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="nav-desktop">
            <Link href="/#cta" onClick={handleCtaClick} className="btn-primary" style={{ padding: "0.625rem 1.5rem", fontSize: "0.875rem" }}>
              Get Started
            </Link>
          </div>
          
          {/* Mobile Menu Toggle */}
          <button
            className="nav-mobile-toggle"
            onClick={() => setMobileNav(!mobileNav)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: scrolled ? "var(--color-on-surface)" : "white",
              display: "none",
              transition: "color 0.35s ease",
            }}
          >
            {mobileNav ? Icons.x : Icons.menu}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {mobileNav && (
          <div className="nav-mobile-menu" style={{
            padding: "1rem 2rem 2rem",
            background: "rgba(248,250,252,0.95)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderBottomLeftRadius: "var(--radius-xl)",
            borderBottomRightRadius: "var(--radius-xl)",
          }}>
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileNav(false)}
                  className="mobile-nav-link"
                  style={{ color: isActive ? "#6366f1" : "var(--color-on-surface-variant)" }}
                >
                  {item.label}
                </Link>
              );
            })}
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
              <Link href="/#cta" onClick={handleCtaClick} className="btn-primary" style={{ flex: 1, textAlign: "center", fontSize: "0.875rem" }}>
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: block !important; }
        }
        .nav-link {
          font-family: var(--font-body);
          font-size: 0.875rem;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .nav-link:hover { color: #6366f1 !important; }
        .nav-link-dark:hover { color: #c7d2fe !important; }
        .mobile-nav-link {
          display: block;
          padding: 0.875rem 0;
          font-family: var(--font-body);
          font-size: 1rem;
          font-weight: 500;
          text-decoration: none;
          border-bottom: 1px solid rgba(99,102,241,0.08);
        }
      `}</style>
    </>
  );
}
