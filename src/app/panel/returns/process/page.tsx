'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, RefreshCcw, Search, User, AlertTriangle, PackageX, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Palette ─── */
const C = {
  bg: '#020617',          
  card: '#0B1121',        
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc', 
  muted: '#94a3b8',
  primary: '#f43f5e',     // Rose 500
  success: '#10b981',
};

const STEPS = ["Type", "Details", "Confirm"];

export default function ProcessReturnPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(0);
  const [returnType, setReturnType] = useState<'patient' | 'expiry' | 'damage' | null>(null);
  
  const [invoiceMode, setInvoiceMode] = useState(true);
  const [invoiceId, setInvoiceId] = useState('');
  const [productName, setProductName] = useState('');
  const [qty, setQty] = useState('');
  
  const handleNext = () => {
     if(step === 0 && !returnType) return toast.error('Select a return type first.');
     if(step === 1) {
        if(invoiceMode && !invoiceId) return toast.error('Enter Invoice ID');
        if(!invoiceMode && (!productName || !qty)) return toast.error('Enter Product and Quantity');
     }
     if(step < 2) setStep(s => s + 1);
     else {
        toast.success(`Return processed successfully!`);
        setTimeout(() => router.push('/panel/returns'), 1000);
     }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', marginTop: -10 }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${C.cardBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => step > 0 ? setStep(s => s-1) : router.push('/panel/returns')}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'transparent', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>Process Return</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Create a new credit note or supplier return.</p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
         
         {/* Stepper */}
         <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
            {STEPS.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: step >= i ? 1 : 0.4 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: step >= i ? C.primary : 'transparent', border: `2px solid ${step >= i ? C.primary : C.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: step >= i ? '#fff' : C.muted, fontSize: 11, fontWeight: 800 }}>
                       {step > i ? <CheckCircle2 style={{ width: 12, height: 12 }} /> : (i + 1)}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: step >= i ? C.text : C.muted }}>{label}</span>
                 </div>
                 {i < STEPS.length - 1 && <div style={{ width: 40, height: 2, backgroundColor: step > i ? C.primary : C.cardBorder }} />}
              </div>
            ))}
         </div>

         {/* Steps Content */}
         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ width: '100%', maxWidth: 600, backgroundColor: C.card, borderRadius: 20, border: `1px solid ${C.cardBorder}`, padding: 32 }}>
            
            {step === 0 && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: C.text }}>What form of return is this?</h3>
                  
                  <button onClick={() => setReturnType('patient')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, borderRadius: 16, border: `2px solid ${returnType === 'patient' ? C.primary : C.cardBorder}`, backgroundColor: returnType === 'patient' ? 'rgba(244,63,94,0.05)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                     <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User style={{ width: 24, height: 24, color: returnType === 'patient' ? C.primary : C.muted }} />
                     </div>
                     <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text }}>Customer Return (Sales)</h4>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Refund a customer for items they are returning.</p>
                     </div>
                  </button>

                  <button onClick={() => setReturnType('expiry')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, borderRadius: 16, border: `2px solid ${returnType === 'expiry' ? C.primary : C.cardBorder}`, backgroundColor: returnType === 'expiry' ? 'rgba(244,63,94,0.05)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                     <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle style={{ width: 24, height: 24, color: returnType === 'expiry' ? C.primary : C.muted }} />
                     </div>
                     <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text }}>Expired Medicines (Supplier)</h4>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Return out-of-date stock securely to your distributors.</p>
                     </div>
                  </button>

                  <button onClick={() => setReturnType('damage')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, borderRadius: 16, border: `2px solid ${returnType === 'damage' ? C.primary : C.cardBorder}`, backgroundColor: returnType === 'damage' ? 'rgba(244,63,94,0.05)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                     <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PackageX style={{ width: 24, height: 24, color: returnType === 'damage' ? C.primary : C.muted }} />
                     </div>
                     <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text }}>Damaged Goods</h4>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Log items damaged during transit or in-store.</p>
                     </div>
                  </button>
               </div>
            )}

            {step === 1 && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>Provide necessary details</h3>
                  
                  {returnType === 'patient' ? (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', padding: 4, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, border: `1px solid ${C.cardBorder}` }}>
                           <button onClick={() => setInvoiceMode(true)} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', backgroundColor: invoiceMode ? 'rgba(255,255,255,0.05)' : 'transparent', color: invoiceMode ? C.text : C.muted, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>By Invoice ID</button>
                           <button onClick={() => setInvoiceMode(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', backgroundColor: !invoiceMode ? 'rgba(255,255,255,0.05)' : 'transparent', color: !invoiceMode ? C.text : C.muted, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>Manual Product</button>
                        </div>

                        {invoiceMode ? (
                           <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Sales Invoice ID</label>
                              <div style={{ position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: 16, top: 14, width: 16, height: 16, color: C.muted }} />
                                <input value={invoiceId} onChange={e => setInvoiceId(e.target.value)} placeholder="e.g. SL-129038" style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.02)', color: C.text, fontSize: 15, outline: 'none' }} />
                              </div>
                           </div>
                        ) : (
                           <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                 <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Product Name</label>
                                 <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Search product..." style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.02)', color: C.text, fontSize: 15, outline: 'none' }} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                 <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Return Qty</label>
                                 <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.02)', color: C.text, fontSize: 15, outline: 'none' }} />
                              </div>
                           </div>
                        )}
                     </div>
                  ) : (
                     <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                           <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Select {returnType === 'expiry' ? 'Expired' : 'Damaged'} Inventory Batch</label>
                           <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Scan Barcode or Search..." style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.02)', color: C.text, fontSize: 15, outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                           <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Return Qty</label>
                           <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.02)', color: C.text, fontSize: 15, outline: 'none' }} />
                        </div>
                     </div>
                  )}

               </div>
            )}

            {step === 2 && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                     <RefreshCcw style={{ width: 36, height: 36, color: C.success }} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>Review & Confirm</h3>
                  <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>By confirming this return action, you are generating a formal credit note mapping the current transaction against the specified quantities. Please ensure inputs are 100% accurate before proceeding.</p>

                  <div style={{ padding: 24, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${C.cardBorder}`, textAlign: 'left', marginTop: 12 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Return Type</span>
                        <span style={{ fontSize: 13, color: C.text, fontWeight: 800, textTransform: 'capitalize' }}>{returnType} Return</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Target</span>
                        <span style={{ fontSize: 13, color: C.text, fontWeight: 800 }}>{invoiceMode && returnType === 'patient' ? `INV #${invoiceId}` : `${qty}x ${productName}`}</span>
                     </div>
                  </div>
               </div>
            )}

            <button 
              onClick={handleNext}
              style={{ width: '100%', marginTop: 32, padding: '14px', borderRadius: 12, border: 'none', backgroundColor: C.text, color: '#000', fontSize: 15, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
               {step === 2 ? 'Confirm Returns Process' : 'Continue'} <ArrowRight style={{ width: 18, height: 18 }} />
            </button>
            
         </div>

      </div>
    </div>
  );
}
