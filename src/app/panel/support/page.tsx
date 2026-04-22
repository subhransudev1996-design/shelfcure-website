'use client';

import { useState } from 'react';
import { LifeBuoy, Search, MessageSquare, Phone, Mail, ChevronDown, CheckCircle2, Send, Paperclip, X } from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Palette ─── */
const C = {
  bg: '#020617',          
  card: '#0B1121',        
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc', 
  muted: '#94a3b8',
  primary: '#14b8a6',     // Teal 500
  primaryHover: '#0d9488',// Teal 600
  emerald: '#10b981', 
};

// Mock FAQs
const FAQS = [
  { q: "How do I process a partial return?", a: "Navigate to the Sales tab, select the specific invoice, and click 'Initiate Return'. You will be given the option to select specific items for partial return." },
  { q: "My barcode scanner isn't reading properly", a: "Ensure the scanner is in 'Keyboard Wedge' mode. Try scanning into a raw text editor to verify the scanner is emitting the enter key after scanning." },
  { q: "How do I add a new supplier?", a: "Go to Business > Suppliers and click the '+ Add Supplier' button. You'll need their GSTIN and basic contact details." },
  { q: "Can I manage multiple branch stores?", a: "Currently, ShelfCure Desktop handles single stores. Multi-branch cloud sync is a beta feature coming in Q4 2026." },
];

export default function SupportPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const filteredFaqs = FAQS.filter(f => f.q.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleTicketSubmit = (e: any) => {
    e.preventDefault();
    if(!subject || !message) return toast.error('Please fill out all fields');
    toast.success('Ticket submitted! Our team will reach out shortly.');
    setSubject('');
    setMessage('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', marginTop: -10 }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${C.cardBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(20,184,166,0.1)', border: `1px solid rgba(20,184,166,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LifeBuoy style={{ width: 22, height: 22, color: C.primary }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>Help & Support</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Get assistance with the ShelfCure platform.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
           <a href="tel:0000000000" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.card, color: C.text, fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }}>
             <Phone style={{ width: 14, height: 14, color: C.primary }} /> Call Support
           </a>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 32, flex: 1, minHeight: 0 }}>
        
        {/* ── Left Column: FAQs ── */}
        <div style={{ flex: 1, overflowY: 'auto' }} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div style={{ marginBottom: 24 }}>
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', height: 42, backgroundColor: searchFocus ? '#111827' : C.card, border: `1.5px solid ${searchFocus ? C.primary : C.cardBorder}`, borderRadius: 12, transition: 'all 0.15s ease', boxShadow: searchFocus ? `0 0 0 3px rgba(20,184,166,0.12)` : 'none' }}>
                <Search style={{ width: 14, height: 14, color: searchFocus ? C.primary : C.muted, flexShrink: 0 }} />
                <input
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
                  placeholder="Search knowledge base..."
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: C.text, fontFamily: 'inherit' }}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 2 }}>
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                )}
             </div>
           </div>

           <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800, color: C.text }}>Frequently Asked Questions</h3>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
             {filteredFaqs.map((faq, idx) => {
               const isOpen = openFaq === idx;
               return (
                 <div key={idx} style={{ backgroundColor: C.card, border: `1px solid ${isOpen ? C.primary : C.cardBorder}`, borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s', boxShadow: isOpen ? '0 4px 20px rgba(20,184,166,0.1)' : 'none' }}>
                    <button 
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isOpen ? 'rgba(20,184,166,0.05)' : 'transparent', border: 'none', cursor: 'pointer', color: C.text, fontSize: 14, fontWeight: 700, textAlign: 'left' }}
                    >
                      {faq.q}
                      <ChevronDown style={{ width: 16, height: 16, color: C.muted, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 20px 20px', color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
                         <div style={{ width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 16 }} />
                         {faq.a}
                      </div>
                    )}
                 </div>
               )
             })}
             
             {filteredFaqs.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12 }}>
                  <p style={{ margin: 0, fontSize: 14, color: C.muted }}>No matching articles found.</p>
                </div>
             )}
           </div>
        </div>

        {/* ── Right Column: Ticket Form ── */}
        <div style={{ width: 420, flexShrink: 0 }} className="animate-in fade-in slide-in-from-bottom-6 duration-700">
           <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                 <div style={{ padding: 8, borderRadius: 8, backgroundColor: 'rgba(20,184,166,0.1)' }}>
                    <MessageSquare style={{ width: 20, height: 20, color: C.primary }} />
                 </div>
                 <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>Open a Support Ticket</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Average response time: ~2 Hours</p>
                 </div>
              </div>

              <form onSubmit={handleTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue Subject</label>
                    <input 
                      value={subject} onChange={e => setSubject(e.target.value)}
                      placeholder="e.g. Printer not connecting" 
                      style={{ padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.02)', color: C.text, fontSize: 14, outline: 'none' }}
                      onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.15)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none' }}
                    />
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detailed Description</label>
                    <textarea 
                      value={message} onChange={e => setMessage(e.target.value)}
                      placeholder="Please describe exactly what happened..."
                      rows={5}
                      style={{ padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.02)', color: C.text, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                      onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.15)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none' }}
                    />
                 </div>

                 <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', background: 'none', border: 'none', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.muted}>
                    <Paperclip style={{ width: 14, height: 14 }} /> Attach Screenshot
                 </button>

                 <button 
                   type="submit" 
                   style={{ marginTop: 8, padding: '12px', borderRadius: 10, border: 'none', backgroundColor: C.text, color: '#000', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'transform 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                   onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                 >
                   Submit Ticket <Send style={{ width: 16, height: 16 }} />
                 </button>

              </form>
           </div>
        </div>

      </div>
    </div>
  );
}
