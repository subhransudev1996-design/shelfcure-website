"use client";

import { useRef, useState, useEffect } from "react";
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

export default function ContactPage() {
  const hero = useInView(0.1);
  const contactDetails = useInView(0.1);
  const faq = useInView(0.1);

  const [formState, setFormState] = useState({ name: "", email: "", subject: "General Inquiry", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });
      if (res.ok) {
        setSubmitted(true);
        setFormState({ name: "", email: "", subject: "General Inquiry", message: "" });
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        console.error("Failed to send message");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

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
          textAlign: "center"
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

        {/* Orbs */}
        <div style={{
          position: "absolute", top: "5%", left: "10%", width: 300, height: 300,
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
          animation: "float 6s ease-in-out infinite"
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "10%", width: 400, height: 400,
          background: "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
          animation: "float 8s ease-in-out infinite reverse"
        }} />

        <div className="section-container" style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>
          <div
            className={hero.inView ? "animate-fade-in-up" : "opacity-0"}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1.25rem",
              background: "rgba(99,102,241,0.15)",
              borderRadius: "var(--radius-full)",
              border: "1px solid rgba(99,102,241,0.2)",
              marginBottom: "2rem",
              backdropFilter: "blur(10px)"
            }}
          >
            <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275z"/></svg>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Support & Contact
            </span>
          </div>

          <h1
            className={hero.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
            style={{
              fontSize: "clamp(3rem, 6vw, 5rem)",
              fontWeight: 800,
              lineHeight: 1.05,
              fontFamily: "var(--font-display)",
              color: "white",
              letterSpacing: "-0.03em",
              marginBottom: "1.5rem"
            }}
          >
            We're here to help you <span style={{ background: "linear-gradient(135deg, #818cf8, #c7d2fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>scale.</span>
          </h1>
          
          <p
            className={hero.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
            style={{
               fontSize: "clamp(1.1rem, 2vw, 1.25rem)",
               color: "rgba(148, 163, 184, 0.9)",
               maxWidth: "600px",
               margin: "0 auto",
               lineHeight: 1.6,
            }}
          >
            Whether you have a technical question, want a custom quote, or need a localized implementation plan, our team is ready.
          </p>
        </div>
      </section>

      {/* ───────────────────── CONTACT FORM & INFO ───────────────────── */}
      <section
        ref={contactDetails.ref}
        style={{ padding: "4rem 0 8rem", position: "relative", zIndex: 20 }}
      >
        <div className="section-container" style={{ maxWidth: "1150px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "4rem", alignItems: "start" }}>
            
            {/* Contact Form */}
            <div 
              className={contactDetails.inView ? "animate-fade-in-up" : "opacity-0"}
              style={{
                background: "rgba(255,255,255,0.7)",
                padding: "3.5rem",
                borderRadius: "2rem",
                boxShadow: "0 30px 60px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1)",
                border: "1px solid var(--color-border)",
                backdropFilter: "blur(20px)",
                position: "relative"
              }}
            >
              {submitted && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(5px)",
                  borderRadius: "2rem", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  animation: "fadeIn 0.3s ease"
                }}>
                  <div style={{ width: "64px", height: "64px", background: "#10b981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", marginBottom: "1.5rem", boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h3 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text)", fontFamily: "var(--font-display)" }}>Request Received</h3>
                  <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem" }}>We'll get back to you within 24 hours.</p>
                </div>
              )}

              <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "2.5rem", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Send us a message</h2>
              <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.5rem", opacity: 0.8 }}>Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="John Doe"
                      className="form-input"
                      value={formState.name}
                      onChange={e => setFormState(s => ({...s, name: e.target.value}))}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.5rem", opacity: 0.8 }}>Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="john@pharmacy.com"
                      className="form-input"
                      value={formState.email}
                      onChange={e => setFormState(s => ({...s, email: e.target.value}))}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.5rem", opacity: 0.8 }}>Subject</label>
                  <select 
                    className="form-input" 
                    value={formState.subject}
                    onChange={e => setFormState(s => ({...s, subject: e.target.value}))}
                    style={{ appearance: "none", backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23b1b1b1%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%00-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%000%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')", backgroundRepeat: "no-repeat", backgroundPosition: "right 1.25rem center", backgroundSize: "0.65em auto" }}
                  >
                    <option>General Inquiry</option>
                    <option>Technical Support</option>
                    <option>Get a Quote</option>
                    <option>Partnerships</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.5rem", opacity: 0.8 }}>Message</label>
                  <textarea 
                    rows={5} 
                    required
                    placeholder="How can we help you scale today?"
                    className="form-input"
                    value={formState.message}
                    onChange={e => setFormState(s => ({...s, message: e.target.value}))}
                    style={{ resize: "vertical" }}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={submitted || submitting}
                  className="luminous-btn" 
                  style={{ padding: "1.1rem", fontSize: "1rem", width: "100%", justifyContent: "center", borderRadius: "1rem", marginTop: "0.5rem", opacity: (submitted || submitting) ? 0.7 : 1 }}
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "1rem" }}>
               {[
                 { title: "Direct Contact", desc: "Speak directly with our implementation experts.", info: "+91-7064844320", icon: Icons.phone },
                 { title: "Email Support", desc: "Technical issues? Drop us an email anytime.", info: "info@shelfcure.com", icon: Icons.mail }
               ].map((item, i) => (
                 <div 
                   key={item.title}
                   className={contactDetails.inView ? "animate-fade-in-up hover-lift" : "opacity-0"}
                   style={{
                     padding: "2rem", background: "rgba(255,255,255,0.4)", borderRadius: "1.5rem",
                     border: "1px solid var(--color-border)", animationDelay: `${(i * 0.1) + 0.2}s`,
                     backdropFilter: "blur(10px)", display: "flex", gap: "1.5rem", alignItems: "flex-start",
                     transition: "transform 0.3s ease, background 0.3s ease", cursor: "default"
                   }}
                 >
                    <div style={{ width: "3.5rem", height: "3.5rem", background: "rgba(99,102,241,0.1)", color: "var(--color-primary)", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(99,102,241,0.2)" }}>
                      {item.icon}
                    </div>
                    <div>
                       <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "0.5rem", fontFamily: "var(--font-display)" }}>{item.title}</h3>
                       <p style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", marginBottom: "0.75rem", lineHeight: 1.5 }}>{item.desc}</p>
                       <div style={{ fontWeight: 700, color: "var(--color-primary)" }}>{item.info}</div>
                    </div>
                 </div>
               ))}
            </div>

          </div>
        </div>
      </section>

      {/* ───────────────────── FAQ SECTION (INTERACTIVE) ───────────────────── */}
      <section
        ref={faq.ref}
        style={{ padding: "6rem 0 8rem" }}
      >
        <div className="section-container" style={{ maxWidth: "850px" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "var(--color-text)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Frequently Asked Questions</h2>
            <p style={{ color: "var(--color-text-muted)", marginTop: "1rem", fontSize: "1.1rem" }}>Everything you need to know about the onboarding process.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { q: "How long does it take to set up?", a: "Most pharmacies are up and running within 24 hours. Our AI automatically imports your existing CSV data to speed up the process. A dedicated integration specialist will be assigned to guide you step-by-step." },
              { q: "Do I need special hardware?", a: "No. You can use any existing Windows desktop and turn your smartphone into a barcode scanner using our built-in QR wireless bridge." },
              { q: "How frequently is the database updated?", a: "The AI drug dictionary and compliance rules are updated weekly in the background. Your software will seamlessly fetch the latest medicine catalogs without manual intervention." },
              { q: "Is my data secure?", a: "Absolutely. We use AES-256 encryption for local storage and secure TLS connections for any integrations. We strictly align with HIPAA and GDPR requirements for patient privacy." },
              { q: "Can I manage multiple pharmacy branches?", a: "Yes, our Enterprise plan allows you to network multiple branches, providing centralized dashboard oversight, inter-store stock transfers, and unified reporting." }
            ].map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div 
                  key={i}
                  className={faq.inView ? "animate-fade-in-up" : "opacity-0"}
                  style={{
                    background: isOpen ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)", 
                    borderRadius: "1.5rem",
                    border: "1px solid",
                    borderColor: isOpen ? "rgba(99,102,241,0.3)" : "var(--color-border)", 
                    animationDelay: `${i * 0.1}s`,
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    boxShadow: isOpen ? "0 10px 30px rgba(0,0,0,0.03)" : "none"
                  }}
                >
                  <button 
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{ 
                      width: "100%", padding: "1.5rem 2rem", background: "transparent", border: "none", 
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      cursor: "pointer", textAlign: "left", color: "var(--color-text)"
                    }}
                  >
                    <h4 style={{ fontSize: "1.15rem", fontWeight: 700, fontFamily: "var(--font-display)" }}>{item.q}</h4>
                    <div style={{ 
                      width: "32px", height: "32px", borderRadius: "50%", background: isOpen ? "var(--color-primary)" : "var(--color-surface)", 
                      display: "flex", alignItems: "center", justifyContent: "center", color: isOpen ? "white" : "var(--color-text)",
                      border: `1px solid ${isOpen ? "var(--color-primary)" : "var(--color-border)"}`,
                      transition: "transform 0.3s ease, background 0.3s ease",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0)"
                    }}>
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </button>
                  <div style={{ 
                    maxHeight: isOpen ? "200px" : "0", opacity: isOpen ? 1 : 0, 
                    transition: "all 0.3s ease", padding: isOpen ? "0 2rem 2rem" : "0 2rem",
                    color: "var(--color-text-muted)", lineHeight: 1.6
                  }}>
                    {item.a}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────────── FINAL CTA ───────────────────── */}
      <section style={{ padding: "0 0 8rem 0" }}>
        <div className="section-container" style={{ textAlign: "center", maxWidth: "1000px" }}>
           <div 
             style={{
               background: "linear-gradient(135deg, #0c0a1f 0%, #1a1640 100%)",
               borderRadius: "3rem", padding: "6rem 3rem", color: "white",
               position: "relative", overflow: "hidden",
               boxShadow: "0 30px 60px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"
             }}
           >
              <div style={{ position: "absolute", top: "-50%", left: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: "-50%", right: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", opacity: 0.5 }} />

              <div style={{ position: "relative", zIndex: 1 }}>
                 <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, marginBottom: "1.5rem", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Experience ShelfCure Live.</h2>
                 <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.15rem", maxWidth: "600px", margin: "0 auto 3rem", lineHeight: 1.6 }}>
                    Get a personalized walkthrough with one of our implementation architects.
                 </p>
                 <Link href="/pricing" className="btn-primary" style={{ padding: "1.2rem 3.5rem", fontSize: "1.1rem", borderRadius: "1.2rem", display: "inline-flex", textDecoration: "none" }}>
                    Book a Free Demo
                 </Link>
              </div>
           </div>
        </div>
      </section>

      <style>{`
        .form-input {
           width: 100%;
           padding: 1rem 1.25rem;
           border-radius: 1rem;
           border: 1px solid var(--color-border);
           background: rgba(255,255,255,0.5);
           color: var(--color-text);
           outline: none;
           font-size: 1rem;
           font-family: inherit;
           transition: all 0.3s ease;
        }
        .form-input:focus {
           border-color: rgba(99,102,241,0.5);
           background: rgba(255,255,255,0.9);
           box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
        }
        .form-input::placeholder {
           color: #94a3b8;
        }
        
        .luminous-btn {
           background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
           color: white;
           font-weight: 700;
           border: 1px solid rgba(255,255,255,0.2);
           box-shadow: 0 4px 15px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
           display: flex;
           align-items: center;
           cursor: pointer;
        }
        .luminous-btn:hover {
           transform: translateY(-2px);
           box-shadow: 0 8px 25px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.3);
           filter: brightness(1.1);
        }
        
        .hover-lift:hover {
           transform: translateY(-4px) !important;
           background: rgba(255,255,255,0.8) !important;
           border-color: rgba(99,102,241,0.2) !important;
           box-shadow: 0 10px 30px rgba(0,0,0,0.05) !important;
        }
        
        @keyframes fadeIn {
           from { opacity: 0; transform: translateY(10px); }
           to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 900px) {
           div[style*="grid-template-columns: 1.2fr 0.8fr"] {
              grid-template-columns: 1fr !important;
              gap: 3rem !important;
           }
           div[style*="grid-template-columns: 1fr 1fr"] {
              grid-template-columns: 1fr !important;
           }
        }
      `}</style>
    </div>
  );
}
