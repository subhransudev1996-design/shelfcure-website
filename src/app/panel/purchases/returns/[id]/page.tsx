'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import {
  ChevronLeft, Loader2, RotateCcw, Truck, Package2,
  CalendarDays, FileText, IndianRupee, Hash,
} from 'lucide-react';

const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569',
  indigo: '#6366f1', orange: '#f97316', rose: '#f43f5e',
};

export default function PurchaseReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const id = params.id as string;

  const [header, setHeader] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data: ret, error: rErr } = await supabase.from('purchase_returns').select('*').eq('id', id).maybeSingle();
        if (rErr) throw rErr;
        if (!ret) { setError('Return not found.'); return; }

        // Get supplier name
        let supplierName = 'Unknown';
        if (ret.supplier_id) {
          const { data: sup } = await supabase.from('suppliers').select('name').eq('id', ret.supplier_id).maybeSingle();
          if (sup) supplierName = sup.name;
        }
        setHeader({ ...ret, supplier_name: supplierName });

        // Get items with medicine names
        const { data: retItems } = await supabase.from('purchase_return_items').select('*').eq('purchase_return_id', id);
        const enriched: any[] = [];
        for (const ri of (retItems || [])) {
          const { data: med } = await supabase.from('medicines').select('name').eq('id', ri.medicine_id).maybeSingle();
          // Get batch number from purchase item
          let batchNumber = 'N/A';
          let purchaseRate = 0;
          let gstRate = 0;
          if (ri.purchase_item_id) {
            const { data: pi } = await supabase.from('purchase_items').select('batch_number, purchase_rate, gst_rate').eq('id', ri.purchase_item_id).maybeSingle();
            if (pi) { batchNumber = pi.batch_number || 'N/A'; purchaseRate = pi.purchase_rate || 0; gstRate = pi.gst_rate || 0; }
          }
          enriched.push({ ...ri, medicine_name: med?.name || 'Unknown', batch_number: batchNumber, purchase_rate: purchaseRate, gst_rate: gstRate });
        }
        setItems(enriched);
      } catch (e: any) {
        setError(e?.message || 'Failed to load return.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: 10, color: C.muted }}>
        <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 13 }}>Loading return…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !header) {
    return (
      <div style={{ padding: '120px 40px', textAlign: 'center' }}>
        <p style={{ color: C.rose, fontWeight: 700, fontSize: 14 }}>{error ?? 'Return not found'}</p>
        <button onClick={() => router.push('/panel/purchases/returns')} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.card, color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>← Back to Returns</button>
      </div>
    );
  }

  const infoCards = [
    { icon: Truck, label: 'Supplier', value: header.supplier_name, color: C.orange },
    header.bill_number ? { icon: Package2, label: 'Original Bill', value: `#${header.bill_number}`, color: C.muted } : null,
    { icon: CalendarDays, label: 'Return Date', value: formatDate(header.return_date), color: C.muted },
    header.reason ? { icon: FileText, label: 'Reason', value: header.reason, color: C.muted } : null,
  ].filter(Boolean) as { icon: any; label: string; value: string; color: string }[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => router.push('/panel/purchases/returns')} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.text }}>Purchase Return</h1>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>{header.return_number}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: C.orange + '18', color: C.orange, fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 99, border: `1px solid ${C.orange}25` }}>
          <RotateCcw style={{ width: 13, height: 13 }} />Return
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Left sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Amount hero */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: 24, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Return Value</p>
            <p style={{ margin: '10px 0 0', fontSize: 34, fontWeight: 900, color: C.orange, letterSpacing: '-0.03em' }}>{formatCurrency(header.total_amount || 0)}</p>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{header.return_number}</p>
          </div>

          {/* Info cards */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {infoCards.map((card, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${card.color}10`, border: `1px solid ${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <card.icon style={{ width: 15, height: 15, color: card.color }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{card.label}</p>
                  <p style={{ margin: '2px 0 0', fontWeight: 800, color: C.text, fontSize: 13 }}>{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Financial summary */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: C.muted }}>Items</span>
              <span style={{ fontWeight: 700, color: C.text }}>{items.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: C.muted }}>Total Qty</span>
              <span style={{ fontWeight: 700, color: C.text }}>{items.reduce((s, i) => s + (i.quantity || 0), 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: C.text, paddingTop: 10, borderTop: `1px solid ${C.cardBorder}` }}>
              <span>Total Return</span>
              <span style={{ color: C.orange }}>{formatCurrency(header.total_amount || 0)}</span>
            </div>
          </div>
        </div>

        {/* Right — Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package2 style={{ width: 15, height: 15, color: C.orange }} />
            Returned Items ({items.length})
          </h3>

          {items.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: C.muted, backgroundColor: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}`, fontSize: 13 }}>No items found</div>
          ) : items.map(item => (
            <div key={item.id} style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'flex' }}>
                <div style={{ width: 4, flexShrink: 0, backgroundColor: C.orange }} />
                <div style={{ padding: 18, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 800, color: C.text, fontSize: 14 }}>{item.medicine_name}</h4>
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: C.muted }}>Batch: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#94a3b8' }}>{item.batch_number}</span></p>
                    </div>
                    <span style={{ color: C.orange, fontWeight: 900, fontSize: 18, flexShrink: 0 }}>{formatCurrency(item.total_amount || 0)}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[
                      { label: 'Qty Returned', value: String(item.quantity || 0) },
                      { label: 'Purchase Rate', value: `₹${(item.purchase_rate || 0).toFixed(2)}` },
                      { label: 'GST', value: `${item.gst_rate || 0}%` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 10 }}>
                        <p style={{ margin: 0, fontSize: 8, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</p>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
