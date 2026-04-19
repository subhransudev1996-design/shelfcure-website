"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog-data";
import { Icons } from "@/components/Icons";

/* ═══════════════════════════════════════════════════════════
   INTERSECTION-OBSERVER HOOK
   ═══════════════════════════════════════════════════════════ */
function useInView(threshold = 0.1) {
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

export default function BlogPage() {
  const hero = useInView(0.1);
  const filterSection = useInView(0.1);
  const posts = useInView(0.1);
  const newsletter = useInView(0.2);

  const [activeCategory, setActiveCategory] = useState("All Posts");
  const categories = ["All Posts", "AI & Innovation", "Operations", "Compliance", "Success Stories"];

  // Filter posts based on active category
  const filteredPosts = activeCategory === "All Posts" 
    ? BLOG_POSTS 
    : BLOG_POSTS.filter(p => p.category === activeCategory);

  const featuredPost = filteredPosts.find(p => p.featured) || filteredPosts[0];
  const gridPosts = filteredPosts.filter(p => p.id !== featuredPost?.id);

  return (
    <div style={{ background: "var(--color-surface)", overflow: "hidden", minHeight: "100vh" }}>
      {/* ───────────────────── HERO SECTION ───────────────────── */}
      <section
        ref={hero.ref}
        style={{
          paddingTop: "180px",
          paddingBottom: "8rem",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh"
        }}
      >
        {/* Luminous Background */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(12,10,31,0.02) 0%, rgba(99,102,241,0.05) 50%, rgba(12,10,31,0.02) 100%)",
          zIndex: 0
        }} />
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translate(-50%, -50%)",
          width: "60vw", height: "60vw",
          background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 60%)",
          filter: "blur(80px)", zIndex: 0, pointerEvents: "none"
        }} />

        <div className="section-container" style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: "900px" }}>
          <div
            className={hero.inView ? "animate-fade-in-up" : "opacity-0"}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1.25rem",
              background: "rgba(99,102,241,0.1)",
              borderRadius: "var(--radius-full)",
              border: "1px solid rgba(99,102,241,0.2)",
              marginBottom: "2rem",
              boxShadow: "0 4px 20px rgba(99,102,241,0.1)",
              backdropFilter: "blur(10px)"
            }}
          >
            <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275z"/></svg>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Insights & Intelligence
            </span>
          </div>

          <h1
            className={hero.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
            style={{
              fontSize: "clamp(3rem, 6vw, 5rem)",
              fontWeight: 800,
              lineHeight: 1.05,
              fontFamily: "var(--font-display)",
              color: "var(--color-text)",
              letterSpacing: "-0.03em",
              marginBottom: "1.5rem"
            }}
          >
            The modern <span style={{ color: "var(--color-primary)" }}>pharmacy</span><br />
            playbook.
          </h1>
          
          <p
            className={hero.inView ? "animate-fade-in-up delay-200" : "opacity-0"}
            style={{
              fontSize: "clamp(1.1rem, 2vw, 1.25rem)",
              color: "var(--color-text-muted)",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Discover deep-dive strategies, AI innovations, and actionable intelligence to scale your retail pharmacy operations.
          </p>
        </div>
      </section>

      {/* ───────────────────── BLOG CONTENT ───────────────────── */}
      <section style={{ padding: "2rem 0 8rem", position: "relative", zIndex: 20 }}>
        <div className="section-container">
          
          {/* Categories / Filter Chips */}
          <div ref={filterSection.ref} className={`${filterSection.inView ? "animate-fade-in-up" : "opacity-0"} hide-scrollbar`} style={{ 
            display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "3rem", justifyContent: "center",
            WebkitOverflowScrolling: "touch"
          }}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    whiteSpace: "nowrap",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "var(--radius-full)",
                    background: isActive ? "var(--color-primary)" : "rgba(255,255,255,0.8)",
                    color: isActive ? "white" : "var(--color-text-muted)",
                    border: "1px solid",
                    borderColor: isActive ? "var(--color-primary)" : "var(--color-border)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: isActive ? "0 8px 25px rgba(99,102,241,0.3)" : "0 2px 10px rgba(0,0,0,0.02)",
                    backdropFilter: "blur(10px)"
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.borderColor = "var(--color-primary)";
                      e.currentTarget.style.color = "var(--color-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "var(--color-border)";
                      e.currentTarget.style.color = "var(--color-text-muted)";
                    }
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          {/* Featured Post (Only show if there are posts) */}
          {featuredPost && (
            <div style={{ marginBottom: "5rem" }}>
               <Link href={`/blog/${featuredPost.slug}`} style={{ textDecoration: "none" }}>
                  <div 
                    className={posts.inView ? "animate-fade-in-up delay-100" : "opacity-0"}
                    style={{
                       display: "grid", gridTemplateColumns: "1.3fr 0.9fr", gap: "0",
                       background: "rgba(255,255,255,0.8)", borderRadius: "2rem", overflow: "hidden",
                       border: "1px solid var(--color-border)", 
                       boxShadow: "0 20px 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)",
                       backdropFilter: "blur(20px)",
                       transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-6px)";
                      e.currentTarget.style.boxShadow = "0 30px 60px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,1)";
                      const img = e.currentTarget.querySelector('.featured-img') as HTMLElement;
                      if (img) img.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)";
                      const img = e.currentTarget.querySelector('.featured-img') as HTMLElement;
                      if (img) img.style.transform = "scale(1)";
                    }}
                  >
                     <div style={{ position: "relative", minHeight: "450px", overflow: "hidden" }}>
                        <div style={{ position: "absolute", zIndex: 10, top: "1rem", left: "1rem", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(10px)", color: "white", padding: "0.5rem 1rem", borderRadius: "var(--radius-full)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                          Featured Article
                        </div>
                        <Image className="featured-img" src={featuredPost.image} alt={featuredPost.title} fill sizes="(max-width: 768px) 100vw, 60vw" style={{ objectFit: "cover", transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                     </div>
                     <div style={{ padding: "4rem 3.5rem", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
                        <div style={{ color: "var(--color-primary)", fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "1.25rem" }}>{featuredPost.category}</div>
                        <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 800, color: "var(--color-text)", lineHeight: 1.15, marginBottom: "1.5rem", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{featuredPost.title}</h2>
                        <p style={{ color: "var(--color-text-muted)", fontSize: "1.1rem", lineHeight: 1.7, marginBottom: "2.5rem" }}>{featuredPost.excerpt}</p>
                        
                        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "1rem" }}>
                           <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", border: "1px solid rgba(99,102,241,0.2)" }}>
                             👔
                           </div>
                           <div>
                              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text)" }}>{featuredPost.author}</div>
                              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{featuredPost.date} · {featuredPost.readTime}</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </Link>
            </div>
          )}

          {/* Recent Posts Grid */}
          <div ref={posts.ref} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2.5rem" }}>
            {gridPosts.length > 0 ? gridPosts.map((post, i) => (
              <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                 <div 
                   className={posts.inView ? "animate-fade-in-up" : "opacity-0"}
                   style={{ 
                     background: "rgba(255,255,255,0.6)", borderRadius: "1.5rem", overflow: "hidden",
                     border: "1px solid var(--color-border)",
                     boxShadow: "0 10px 30px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,1)",
                     backdropFilter: "blur(10px)",
                     display: "flex", flexDirection: "column", height: "100%",
                     transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                     animationDelay: `${(i * 0.1) + 0.2}s`
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.transform = "translateY(-8px)";
                     e.currentTarget.style.boxShadow = "0 20px 40px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,1)";
                     const img = e.currentTarget.querySelector('.grid-img') as HTMLElement;
                     if (img) img.style.transform = "scale(1.05)";
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.transform = "translateY(0)";
                     e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,1)";
                     const img = e.currentTarget.querySelector('.grid-img') as HTMLElement;
                     if (img) img.style.transform = "scale(1)";
                   }}
                 >
                    <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
                       <Image className="grid-img" src={post.image} alt={post.title} fill sizes="(max-width: 768px) 100vw, 320px" style={{ objectFit: "cover", transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                    </div>
                    <div style={{ padding: "2rem", flex: 1, display: "flex", flexDirection: "column" }}>
                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                         <div style={{ color: "var(--color-primary)", fontWeight: 800, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em" }}>{post.category}</div>
                         <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 500 }}>{post.readTime}</div>
                       </div>
                       <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-text)", lineHeight: 1.3, marginBottom: "1rem", fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>{post.title}</h3>
                       <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem", flex: 1 }}>{post.excerpt}</p>
                       
                       <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-surface)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: "0.9rem", border: "1px solid var(--color-border)" }}>👔</div>
                          <div>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text)" }}>{post.author}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{post.date}</div>
                          </div>
                       </div>
                    </div>
                 </div>
              </Link>
            )) : (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem 0", color: "var(--color-text-muted)" }}>
                 No posts found for this category.
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ───────────────────── NEWSLETTER SECTION ───────────────────── */}
      <section
        ref={newsletter.ref}
        style={{ padding: "8rem 0", position: "relative" }}
      >
        <div className="section-container" style={{ textAlign: "center", maxWidth: "1000px" }}>
           <div 
             className={newsletter.inView ? "animate-fade-in-up" : "opacity-0"}
             style={{
               background: "linear-gradient(135deg, #0c0a1f 0%, #1a1640 100%)",
               borderRadius: "2.5rem", padding: "6rem 3rem", color: "white",
               position: "relative", overflow: "hidden",
               boxShadow: "0 30px 60px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)"
             }}
           >
              {/* Decorative elements */}
              <div style={{ position: "absolute", top: "-50%", left: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: "-50%", right: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", opacity: 0.5 }} />
              
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                 <div style={{ width: "60px", height: "60px", background: "rgba(99,102,241,0.2)", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2rem", border: "1px solid rgba(99,102,241,0.4)" }}>
                    <svg className="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                 </div>
                 
                 <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, marginBottom: "1rem", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                    Stay Ahead of the Curve
                 </h2>
                 <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.15rem", maxWidth: "600px", margin: "0 auto 3rem", lineHeight: 1.6 }}>
                    Get the latest pharmacy automation insights, regulatory updates, and success stories delivered straight to your inbox.
                 </p>
                 
                 <form 
                   onSubmit={(e) => { e.preventDefault(); alert("Subscribed successfully!"); }}
                   style={{ display: "flex", gap: "0.75rem", maxWidth: "500px", width: "100%", margin: "0 auto", position: "relative" }}
                   className="newsletter-form"
                 >
                    <input 
                      type="email" 
                      placeholder="Enter your work email" 
                      required
                      style={{ 
                        flex: 1, padding: "1.1rem 1.5rem", borderRadius: "1rem", 
                        border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)",
                        color: "white", outline: "none", fontSize: "1rem",
                        backdropFilter: "blur(10px)",
                        transition: "all 0.3s ease"
                      }} 
                      onFocus={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; e.target.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.1)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.boxShadow = "none"; }}
                    />
                    <button type="submit" className="luminous-btn" style={{ padding: "0 2.5rem", borderRadius: "1rem" }}>
                       Subscribe 
                       <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </button>
                 </form>
                 <div style={{ marginTop: "1.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
                    No spam. Unsubscribe at any time.
                 </div>
              </div>
           </div>
        </div>
      </section>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .luminous-btn {
           background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
           color: white;
           font-weight: 600;
           border: 1px solid rgba(255,255,255,0.2);
           box-shadow: 0 4px 15px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
           display: flex;
           align-items: center;
           justify-content: center;
           cursor: pointer;
        }
        .luminous-btn:hover {
           transform: translateY(-2px);
           box-shadow: 0 8px 25px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.3);
           filter: brightness(1.1);
        }
        
        @media (max-width: 900px) {
           div[style*="grid-template-columns: 1.3fr 0.9fr"] {
              grid-template-columns: 1fr !important;
           }
           .newsletter-form {
              flex-direction: column;
           }
           .luminous-btn {
              padding: 1.1rem !important;
           }
        }
      `}</style>
    </div>
  );
}
