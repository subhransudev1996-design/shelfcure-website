'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, FileText, Printer, Mail, DownloadCloud, Loader2, Package, Tag, Clock, Hash } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import toast from 'react-hot-toast';

/* ─── Palette ─── */
const C = {
  bg: '#020617',          
  card: '#0B1121',        
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc', 
  muted: '#94a3b8',
  primary: '#8b5cf6',     // Violet 500
  info: '#3b82f6',
  emerald: '#10b981', 
};

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  
  const id = params.id as string;
  const [purchase, setPurchase] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
       if (!id || id === 'manual' || id === 'orders' || id === 'new' || id === 'returns' || id === 'scan') {
         setLoading(false);
         return;
       }
       
       // Optional UUID format check to be extra safe
       const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
       if (!uuidRegex.test(id)) {
         setLoading(false);
         return;
       }

       try {
         const { data: pur, error: purErr } = await supabase.from('purchases').select('*').eq('id', id).maybeSingle();
         if (purErr) throw purErr;
         setPurchase(pur);

         if (pur) {
           const { data: itm, error: itmErr } = await supabase.from('purchase_items').select('*, medicines(name)').eq('purchase_id', id);
           if (itmErr) throw itmErr;
           setItems(itm || []);
         }
       } catch(err: any) {
         toast.error("Failed to load purchase details");
         console.error("Purchase Load Error:", err);
       } finally {
         setLoading(false);
       }
    }
    load();
  }, [id, supabase]);

  if (loading) {
     return (
       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 100px)' }}>
          <Loader2 style={{ width: 32, height: 32, color: C.primary }} className="animate-spin" />
       </div>
     );
  }

  if (!purchase) {
     return (
       <div style={{ padding: 40, textAlign: 'center', backgroundColor: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}` }}>
          <h2>Purchase not found.</h2>
          <button onClick={() => router.push('/panel/purchases')} style={{ padding: '8px 16px', marginTop: 16, borderRadius: 8, border: 'none', backgroundColor: C.primary, color: '#fff', cursor: 'pointer' }}>Back</button>
       </div>
     );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${C.cardBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => router.push('/panel/purchases')}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'transparent', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
               Invoice #{purchase.bill_number || purchase.id.slice(0,8).toUpperCase()}
               <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6, backgroundColor: purchase.payment_status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: purchase.payment_status === 'paid' ? C.emerald : '#f59e0b', textTransform: 'uppercase' }}>
                 {purchase.payment_status}
               </span>
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>From: {purchase.supplier_name}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
           <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.02)', color: C.text, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
             <Printer style={{ width: 14, height: 14 }} /> Print
           </button>
           <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.02)', color: C.text, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
             <DownloadCloud style={{ width: 14, height: 14 }} /> PDF
           </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        
        {/* Top Summaries */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          
           <div style={{ padding: 20, backgroundColor: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', marginBottom: 12 }}><Clock style={{ width: 14, height: 14 }} /> Bill Date</div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>{formatDate(purchase.bill_date)}</p>
           </div>
           
           <div style={{ padding: 20, backgroundColor: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', marginBottom: 12 }}><Package style={{ width: 14, height: 14 }} /> Total Items</div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>{items.length} Products</p>
           </div>

           <div style={{ padding: 20, backgroundColor: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}` }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.muted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', marginBottom: 12 }}><Tag style={{ width: 14, height: 14 }} /> Total Quantity</div>
               <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>{items.reduce((s,i) => s + i.quantity, 0)} Units</p>
           </div>

           <div style={{ padding: 20, backgroundColor: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}`, background: `linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.02))` }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.primary, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', marginBottom: 12 }}><Hash style={{ width: 14, height: 14 }} /> Invoice Total</div>
               <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text }}>{formatCurrency(purchase.total_amount)}</p>
           </div>

        </div>

        {/* Invoice Grid */}
        <div style={{ backgroundColor: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}`, overflow: 'hidden' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 3fr) 1.5fr 1fr 1fr 1.5fr 1.5fr 1fr', gap: 8, padding: '16px 24px', backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${C.cardBorder}`, fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
             <div>Product Detail</div>
             <div>Batch</div>
             <div style={{ textAlign: 'center' }}>Qty</div>
             <div style={{ textAlign: 'center' }}>Free</div>
             <div style={{ textAlign: 'right' }}>PTR (₹)</div>
             <div style={{ textAlign: 'center' }}>GST %</div>
             <div style={{ textAlign: 'right', color: C.primary }}>Amount</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
             {items.map((item, idx) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 3fr) 1.5fr 1fr 1fr 1.5fr 1.5fr 1fr', gap: 8, padding: '16px 24px', alignItems: 'center', borderBottom: idx < items.length-1 ? `1px solid ${C.cardBorder}` : 'none' }}>
                   
                   <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>{item.medicines?.name || 'Unknown Item'}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>MRP: {formatCurrency(item.mrp)}</p>
                   </div>
                   
                   <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{item.batch_number}</p>
                   <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, textAlign: 'center' }}>{item.quantity}</p>
                   <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.emerald, textAlign: 'center' }}>+{item.free_quantity}</p>
                   <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' }}>{formatCurrency(item.purchase_rate)}</p>
                   <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.muted, textAlign: 'center' }}>{item.gst_rate}%</p>
                   <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: C.text, textAlign: 'right' }}>{formatCurrency(item.total_amount)}</p>
                   
                </div>
             ))}
          </div>

        </div>
      </div>
    </div>
  );
}
