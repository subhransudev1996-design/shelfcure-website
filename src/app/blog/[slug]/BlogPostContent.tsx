"use client";

import Image from "next/image";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog-data";

export default function BlogPostContent({ slug }: { slug: string }) {
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div style={{ padding: "160px 0", textAlign: "center", background: "white", minHeight: "100vh" }}>
        <h1>Post not found</h1>
        <Link href="/blog" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Back to Blog</Link>
      </div>
    );
  }

  const relatedPosts = BLOG_POSTS.filter(p => p.slug !== slug).sort(() => 0.5 - Math.random()).slice(0, 2);

  return (
    <div style={{ background: "var(--color-surface)", overflow: "hidden", minHeight: "100vh" }}>
      {/* ───────────────────── HERO HEADER (DARK) ───────────────────── */}
      <section
        style={{
          paddingTop: "180px",
          paddingBottom: "10rem",
          position: "relative",
          background: "linear-gradient(180deg, #0c0a1f 0%, #110e2e 70%, #17143a 100%)",
          color: "white",
          textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center"
        }}
      >
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "0", left: "50%", transform: "translateX(-50%)",
          width: "100%", height: "100%",
          background: "radial-gradient(circle at top, rgba(99,102,241,0.15) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />

        <div className="section-container animate-fade-in-up" style={{ position: "relative", zIndex: 10, maxWidth: "900px", margin: "0 auto" }}>
          
          <Link href="/blog" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--color-primary)", fontSize: "0.9rem", fontWeight: 600, textDecoration: "none", marginBottom: "2rem", transition: "opacity 0.2s ease" }} className="hover-opacity">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Back to all insights
          </Link>

          <div>
             <div style={{
               display: "inline-flex", alignItems: "center", gap: "0.5rem",
               padding: "0.4rem 1rem",
               background: "rgba(99,102,241,0.15)",
               borderRadius: "var(--radius-full)",
               border: "1px solid rgba(99,102,241,0.3)",
               marginBottom: "2rem",
             }}>
               <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                 {post.category}
               </span>
             </div>
          </div>

          <h1 style={{
            fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            fontFamily: "var(--font-display)",
            color: "white",
            marginBottom: "2.5rem",
            letterSpacing: "-0.02em"
          }}>
            {post.title}
          </h1>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2rem", flexWrap: "wrap", padding: "1.5rem", background: "rgba(0,0,0,0.2)", backdropFilter: "blur(10px)", borderRadius: "var(--radius-full)", border: "1px solid rgba(255,255,255,0.05)", maxWidth: "max-content", margin: "0 auto" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", border: "1px solid rgba(99,102,241,0.4)" }}>
                   👔
                </div>
                <div style={{ textAlign: "left" }}>
                   <div style={{ fontSize: "1rem", fontWeight: 700 }}>{post.author}</div>
                   <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>{post.authorRole}</div>
                </div>
             </div>
             <div style={{ width: "1px", height: "30px", background: "rgba(255,255,255,0.1)" }} />
             <div style={{ display: "flex", gap: "2rem", fontSize: "0.95rem", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><svg className="w-4 h-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {post.date}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><svg className="w-4 h-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {post.readTime}</span>
             </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── FEATURED IMAGE & CONTENT ───────────────────── */}
      <section style={{ padding: "0 0 4rem 0", position: "relative" }}>
         <div className="section-container" style={{ maxWidth: "1100px", marginTop: "-8rem", position: "relative", zIndex: 20 }}>
            {/* Featured Image */}
            <div className="animate-fade-in-up delay-200" style={{ 
               position: "relative", height: "clamp(300px, 50vw, 600px)", borderRadius: "2rem", overflow: "hidden",
               boxShadow: "0 30px 60px rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.5)",
               background: "var(--color-surface)"
            }}>
               <Image src={post.image} alt={post.title} fill sizes="(max-width: 1024px) 100vw, 1024px" style={{ objectFit: "cover" }} priority />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "5rem", marginTop: "5rem" }}>
               {/* Main Article Content */}
               <article className="blog-content" style={{ fontSize: "1.15rem", lineHeight: 1.85, color: "var(--color-text)" }}>
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                  
                  {/* Share Component */}
                  <div style={{ 
                     marginTop: "5rem", padding: "3rem", background: "rgba(255,255,255,0.5)", borderRadius: "2rem",
                     border: "1px solid var(--color-border)", textAlign: "center", backdropFilter: "blur(10px)",
                     boxShadow: "0 10px 30px rgba(0,0,0,0.02)"
                  }}>
                     <h4 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "1rem", fontFamily: "var(--font-display)" }}>Enjoyed this insight?</h4>
                     <p style={{ color: "var(--color-text-muted)", marginBottom: "2.5rem" }}>Share it with your colleagues and help modernize the retail pharmacy industry.</p>
                     
                     <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
                        {["Twitter", "LinkedIn", "WhatsApp", "Copy Link"].map(s => (
                           <button key={s} className="share-btn" style={{ 
                             padding: "0.85rem 1.75rem", borderRadius: "1rem", 
                             border: "1px solid var(--color-border)", background: "white", 
                             fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
                             color: "var(--color-text)", transition: "all 0.2s ease"
                           }}>
                             {s}
                           </button>
                        ))}
                     </div>
                  </div>
               </article>

               {/* Sidebar */}
               <aside>
                  <div style={{ position: "sticky", top: "120px" }}>
                     <h4 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-text)", marginBottom: "2rem", fontFamily: "var(--font-display)" }}>Related Reads</h4>
                     <div style={{ display: "grid", gap: "2rem" }}>
                        {relatedPosts.map(rp => (
                           <Link key={rp.id} href={`/blog/${rp.slug}`} style={{ textDecoration: "none" }}>
                              <div className="related-post-card" style={{ 
                                transition: "transform 0.3s ease",
                                padding: "1rem",
                                borderRadius: "1.5rem",
                                background: "rgba(255,255,255,0.4)",
                                border: "1px solid transparent"
                              }}>
                                 <div style={{ position: "relative", height: "160px", borderRadius: "1rem", overflow: "hidden", marginBottom: "1.25rem" }}>
                                    <Image src={rp.image} alt={rp.title} fill sizes="(max-width: 768px) 100vw, 320px" style={{ objectFit: "cover", transition: "transform 0.5s ease" }} />
                                 </div>
                                 <div style={{ color: "var(--color-primary)", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>{rp.category}</div>
                                 <h5 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text)", lineHeight: 1.4 }}>{rp.title}</h5>
                              </div>
                           </Link>
                        ))}
                     </div>

                     <div style={{ 
                        marginTop: "4rem", padding: "2.5rem", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", 
                        borderRadius: "2rem", color: "white",
                        boxShadow: "0 20px 40px rgba(99,102,241,0.3)"
                     }}>
                        <h4 style={{ fontWeight: 800, marginBottom: "1rem", fontSize: "1.5rem", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Ready to automate?</h4>
                        <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.8)", marginBottom: "2rem", lineHeight: 1.6 }}>Join 2,500+ pharmacies using ShelfCure today to scale operations.</p>
                        <Link href="/pricing" className="luminous-btn" style={{ 
                          background: "white", color: "#6366f1", width: "100%", justifyContent: "center", padding: "1rem",
                          borderRadius: "1rem"
                        }}>
                          See Pricing
                        </Link>
                     </div>
                  </div>
               </aside>
            </div>
         </div>
      </section>

      <style>{`
         .hover-opacity:hover {
            opacity: 0.8;
         }
         
         .blog-content h2 {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--color-text);
            margin: 4rem 0 1.5rem;
            font-family: var(--font-display);
            letter-spacing: -0.02em;
            line-height: 1.2;
         }
         
         .blog-content h3 {
            font-size: 1.85rem;
            font-weight: 800;
            color: var(--color-text);
            margin: 3.5rem 0 1.5rem;
            font-family: var(--font-display);
            letter-spacing: -0.01em;
         }
         
         .blog-content p {
            margin-bottom: 1.75rem;
         }
         
         .blog-content strong {
            font-weight: 700;
            color: #0f172a;
         }
         
         .blog-content blockquote {
            border-left: 4px solid var(--color-primary);
            padding: 1.5rem 2.5rem;
            margin: 3.5rem 0;
            font-style: italic;
            font-size: 1.5rem;
            font-weight: 500;
            color: var(--color-text);
            background: rgba(99,102,241,0.05);
            borderRadius: 0 1.5rem 1.5rem 0;
            line-height: 1.6;
         }
         
         .blog-content ul, .blog-content ol {
            margin-bottom: 2rem;
            padding-left: 2rem;
         }
         
         .blog-content li {
            margin-bottom: 0.75rem;
         }
         
         .share-btn:hover {
            border-color: var(--color-primary) !important;
            color: var(--color-primary) !important;
            transform: translateY(-2px);
         }
         
         .related-post-card:hover {
            transform: translateY(-4px);
            background: rgba(255,255,255,0.8) !important;
            border-color: rgba(99,102,241,0.2) !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
         }
         
         .related-post-card:hover img {
            transform: scale(1.05);
         }
         
         .luminous-btn {
           font-weight: 700;
           box-shadow: 0 4px 15px rgba(0,0,0,0.1);
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
           display: inline-flex;
           align-items: center;
           cursor: pointer;
           border: none;
           text-decoration: none;
        }
        .luminous-btn:hover {
           transform: translateY(-2px);
           box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
         
         @media (max-width: 1000px) {
            div[style*="grid-template-columns: 1fr 320px"] {
               grid-template-columns: 1fr !important;
            }
            aside {
               margin-top: 2rem;
               padding-top: 3rem;
               border-top: 1px solid var(--color-border);
            }
            .blog-content blockquote {
               font-size: 1.25rem;
               padding: 1.5rem;
            }
         }
      `}</style>
    </div>
  );
}
