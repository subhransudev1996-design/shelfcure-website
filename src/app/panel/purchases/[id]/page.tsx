'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ChevronLeft, Truck, CheckCircle2, Clock, Loader2,
  Sparkles, AlertCircle, PackageCheck, RotateCcw,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import toast from 'react-hot-toast';

/* ─── Palette (panel dark theme) ─── */
const C = {
  bg: '#020617',
  card: '#0B1121',
  cardBorder: 'rgba(255,255,255,0.08)',
  cardSoft: 'rgba(255,255,255,0.02)',
  text: '#f8fafc',
  textSoft: '#cbd5e1',
  muted: '#94a3b8',
  mutedDim: '#64748b',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  blue: '#3b82f6',
  orange: '#fb923c',
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; bg: string; border: string; color: string; label: string }> = {
  paid: {
    icon: <CheckCircle2 style={{ width: 16, height: 16 }} />,
    bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: C.emerald,
    label: 'Payment Successful',
  },
  pending: {
    icon: <Clock style={{ width: 16, height: 16 }} />,
    bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: C.amber,
    label: 'Payment Pending (Credit)',
  },
  partial: {
    icon: <AlertCircle style={{ width: 16, height: 16 }} />,
    bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', color: C.blue,
    label: 'Partially Paid',
  },
};

interface PurchaseHeader {
  id: string;
  bill_number: string | null;
  bill_date: string;
  subtotal: number | null;
  gst_amount: number | null;
  discount_amount: number | null;
  total_amount: number;
  payment_status: string;
  paid_amount: number | null;
  payment_method: string | null;
  is_ai_scanned: boolean | null;
  notes: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
}

interface PurchaseDetailItem {
  id: string;
  medicine_id: string;
  medicine_name: string | null;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  free_quantity: number | null;
  returned_quantity: number;
  purchase_price: number;
  mrp: number;
  gst_rate: number;
  discount_percent: number | null;
  total_amount: number;
  sale_unit_mode: string | null;
  units_per_pack: number | null;
}

function formatExpiry(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
}

function formatQty(item: PurchaseDetailItem): string {
  const upp = item.units_per_pack ?? 1;
  const free = item.free_quantity ?? 0;
  const isPack = item.sale_unit_mode === 'both' || item.sale_unit_mode === 'unit';
  if (isPack && upp > 1) {
    const qStrips = Math.floor(item.quantity / upp);
    const qUnits = item.quantity % upp;
    const fStrips = Math.floor(free / upp);
    const fUnits = free % upp;
    const qStr = qUnits > 0 ? `${qStrips}s ${qUnits}u` : `${qStrips} strips`;
    if (free > 0) {
      const fStr = fUnits > 0 ? `${fStrips}s ${fUnits}u` : `${fStrips} strips`;
      return `${qStr} + ${fStr} free`;
    }
    return qStr;
  }
  return free > 0 ? `${item.quantity} + ${free} free` : String(item.quantity);
}

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const id = params.id as string;
  const [purchase, setPurchase] = useState<PurchaseHeader | null>(null);
  const [items, setItems] = useState<PurchaseDetailItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id || ['manual', 'orders', 'new', 'returns', 'scan'].includes(id)) {
        setLoading(false); return;
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) { setLoading(false); return; }

      try {
        const { data: pur, error: purErr } = await supabase
          .from('purchases')
          .select('id, bill_number, bill_date, subtotal, gst_amount, discount_amount, total_amount, payment_status, paid_amount, payment_method, is_ai_scanned, notes, supplier_id, suppliers(name)')
          .eq('id', id)
          .maybeSingle();
        if (purErr) throw purErr;

        if (pur) {
          const header: PurchaseHeader = {
            id: String(pur.id),
            bill_number: pur.bill_number,
            bill_date: pur.bill_date,
            subtotal: pur.subtotal,
            gst_amount: pur.gst_amount,
            discount_amount: pur.discount_amount,
            total_amount: Number(pur.total_amount) || 0,
            payment_status: pur.payment_status || 'pending',
            paid_amount: pur.paid_amount,
            payment_method: pur.payment_method,
            is_ai_scanned: pur.is_ai_scanned,
            notes: pur.notes,
            supplier_id: pur.supplier_id ? String(pur.supplier_id) : null,
            supplier_name: (pur as any).suppliers?.name ?? null,
          };
          setPurchase(header);

          const { data: itm, error: itmErr } = await supabase
            .from('purchase_items')
            .select('id, medicine_id, batch_number, expiry_date, quantity, free_quantity, purchase_price, mrp, gst_rate, discount_percent, total_amount, medicines(name, sale_unit_mode, units_per_pack)')
            .eq('purchase_id', id);
          if (itmErr) throw itmErr;

          // Aggregate returned quantities for these items
          const itemIds = (itm || []).map((it: any) => it.id);
          let returnedMap = new Map<string, number>();
          if (itemIds.length > 0) {
            const { data: rets } = await supabase
              .from('purchase_return_items')
              .select('purchase_item_id, quantity')
              .in('purchase_item_id', itemIds);
            (rets || []).forEach((r: any) => {
              const k = String(r.purchase_item_id);
              returnedMap.set(k, (returnedMap.get(k) || 0) + (Number(r.quantity) || 0));
            });
          }

          const detailItems: PurchaseDetailItem[] = (itm || []).map((it: any) => ({
            id: String(it.id),
            medicine_id: String(it.medicine_id),
            medicine_name: it.medicines?.name ?? null,
            batch_number: it.batch_number,
            expiry_date: it.expiry_date,
            quantity: Number(it.quantity) || 0,
            free_quantity: it.free_quantity != null ? Number(it.free_quantity) : 0,
            returned_quantity: returnedMap.get(String(it.id)) || 0,
            purchase_price: Number(it.purchase_price) || 0,
            mrp: Number(it.mrp) || 0,
            gst_rate: Number(it.gst_rate) || 0,
            discount_percent: it.discount_percent != null ? Number(it.discount_percent) : 0,
            total_amount: Number(it.total_amount) || 0,
            sale_unit_mode: it.medicines?.sale_unit_mode ?? null,
            units_per_pack: it.medicines?.units_per_pack ?? 1,
          }));
          setItems(detailItems);
        }
      } catch (err: any) {
        toast.error('Failed to load purchase details');
        console.error('Purchase Load Error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, supabase]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: C.muted, padding: '128px 0', fontSize: 13 }}>
        <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
        <span>Loading purchase…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div style={{ padding: 40, textAlign: 'center', backgroundColor: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}`, color: C.text }}>
        <h2 style={{ marginBottom: 12 }}>Purchase not found.</h2>
        <button onClick={() => router.push('/panel/purchases')} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: C.primary, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Back</button>
      </div>
    );
  }

  const status = STATUS_CONFIG[purchase.payment_status] ?? STATUS_CONFIG.pending;

  // Net payable adjusted by returned amounts
  const returnedAmount = items.reduce((acc, it) => {
    if (it.returned_quantity > 0 && it.quantity > 0) {
      return acc + (it.total_amount / it.quantity) * it.returned_quantity;
    }
    return acc;
  }, 0);
  const showAdjusted = returnedAmount > 0
    && !items.every(it => (it.quantity + (it.free_quantity ?? 0)) <= it.returned_quantity);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 40 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.push('/panel/purchases')}
          style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'transparent', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Purchase Invoice</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>Bill #{purchase.bill_number || purchase.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {purchase.is_ai_scanned && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(99,102,241,0.12)', color: C.primaryLight, fontSize: 11, fontWeight: 800, padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(99,102,241,0.25)' }}>
              <Sparkles style={{ width: 12, height: 12 }} />
              AI Scanned
            </div>
          )}
          <button
            onClick={() => router.push(`/panel/purchases/returns/new?bill=${encodeURIComponent(purchase.bill_number || '')}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(249,115,22,0.1)', color: C.orange, fontSize: 11, fontWeight: 800, padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(249,115,22,0.3)', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.1)'; }}
          >
            <RotateCcw style={{ width: 12, height: 12 }} />
            Process Return
          </button>
        </div>
      </div>

      {/* ── Body grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start' }}>
        {/* ── LEFT SIDEBAR ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Hero card */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: '24px 20px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 10, color: C.muted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Bill #{purchase.bill_number || '—'}</p>
            <p style={{ margin: '12px 0 4px', fontSize: 36, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {formatCurrency(purchase.total_amount)}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{formatDate(purchase.bill_date)}</p>
          </div>

          {/* Supplier */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck style={{ width: 20, height: 20, color: C.orange }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 9, color: C.muted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Supplier</p>
              <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {purchase.supplier_name || 'Unknown'}
              </p>
            </div>
          </div>

          {/* Summary breakdown */}
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: C.muted }}>Subtotal</span>
              <span style={{ color: C.textSoft, fontWeight: 600 }}>{formatCurrency(purchase.subtotal ?? 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: C.muted }}>GST</span>
              <span style={{ color: C.textSoft, fontWeight: 600 }}>{formatCurrency(purchase.gst_amount ?? 0)}</span>
            </div>
            {purchase.discount_amount != null && Number(purchase.discount_amount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: C.emerald }}>Discount</span>
                <span style={{ color: C.emerald, fontWeight: 600 }}>-{formatCurrency(Number(purchase.discount_amount))}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, color: C.text, paddingTop: 10, borderTop: `1px solid ${C.cardBorder}` }}>
              <span>Net Payable</span>
              <span>{formatCurrency(purchase.total_amount)}</span>
            </div>
            {showAdjusted && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, paddingTop: 4 }}>
                <span>Paid Amount After Return</span>
                <span>{formatCurrency(purchase.total_amount - returnedAmount)}</span>
              </div>
            )}
          </div>

          {/* Payment status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: status.bg, border: `1px solid ${status.border}`, color: status.color, fontSize: 13, fontWeight: 800 }}>
            {status.icon}
            <span>{status.label}</span>
          </div>

          {/* Notes */}
          {purchase.notes && (
            <div style={{ backgroundColor: C.cardSoft, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 14 }}>
              <p style={{ margin: 0, fontSize: 9, color: C.muted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Notes</p>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: C.textSoft, lineHeight: 1.5 }}>{purchase.notes}</p>
            </div>
          )}
        </div>

        {/* ── RIGHT — ITEMS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.textSoft, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PackageCheck style={{ width: 14, height: 14, color: C.primaryLight }} />
            Purchased Items ({items.length})
          </h3>

          {items.length === 0 ? (
            <div style={{ padding: '64px 0', textAlign: 'center', backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, color: C.muted, fontSize: 13 }}>
              No items found
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: 4, flexShrink: 0, backgroundColor: C.primary }} />
                <div style={{ padding: 18, flex: 1, minWidth: 0 }}>
                  {/* Title row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.medicine_name ?? `Medicine #${item.medicine_id}`}
                    </h4>
                    <span style={{ flexShrink: 0, fontSize: 17, fontWeight: 900, color: C.primaryLight, letterSpacing: '-0.01em' }}>
                      {formatCurrency(item.total_amount)}
                    </span>
                  </div>

                  {/* Batch / Expiry / Qty grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                    {[
                      { label: 'Batch', value: item.batch_number || '—' },
                      { label: 'Expiry', value: formatExpiry(item.expiry_date) },
                      { label: 'Qty', value: formatQty(item) },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ backgroundColor: C.cardSoft, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 10 }}>
                        <p style={{ margin: 0, fontSize: 9, color: C.muted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Rate / MRP / GST / Disc */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, paddingTop: 12, borderTop: `1px solid ${C.cardBorder}` }}>
                    {[
                      { label: 'Rate', value: `₹${item.purchase_price.toFixed(2)}` },
                      { label: 'MRP', value: `₹${item.mrp.toFixed(2)}` },
                      { label: 'GST', value: `${item.gst_rate}%` },
                      { label: 'Disc', value: `${(item.discount_percent ?? 0).toFixed(1)}%`, highlight: (item.discount_percent ?? 0) > 0 },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 800, color: highlight ? C.emerald : C.textSoft }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {item.returned_quantity > 0 && (
                    <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 10, fontSize: 11, color: C.orange, fontWeight: 700 }}>
                      Returned: {item.returned_quantity} unit{item.returned_quantity > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
