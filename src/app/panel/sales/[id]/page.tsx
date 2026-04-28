'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency } from '@/lib/utils/format';
import {
  ArrowLeft, Printer, Loader2, Receipt, User,
  CreditCard, Banknote, Smartphone, IndianRupee, Package,
  AlertTriangle, CheckCircle2, RotateCcw, X, Minus, Plus,
  Wallet, AlertCircle, Save,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

/* ─── Types ──────────────────────────────────────────────────── */
interface Sale {
  id: string;
  patient_name: string | null;
  doctor_name: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  bill_date: string;
  total_amount: number;
  discount_amount: number | null;
  gst_amount: number | null;
  net_amount: number | null;
  payment_mode: string | null;
  payment_status: string | null;
  paid_amount: number | null;
  status: string;
  created_at: string;
}

interface PaymentEntry {
  id: string;
  amount: number;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  balance_after: number | null;
}

interface SaleItem {
  id: string;
  medicine_id: string;
  batch_id: string | null;
  quantity: number;
  mrp: number;
  unit_price: number;
  gst_rate: number;
  total_amount: number;
  medicine_name: string;
  batch_number: string;
  already_returned: number; // from sale_return_items
}

/* ─── Palette ────────────────────────────────────────────────── */
const C = {
  bg: '#07091a', card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569', subtle: '#94a3b8',
  indigo: '#6366f1', indigoLight: '#818cf8',
  emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e',
  purple: '#a855f7', blue: '#3b82f6', red: '#ef4444',
};

/* ─── Helpers ────────────────────────────────────────────────── */
function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function PaymentIcon({ mode }: { mode: string | null }) {
  const m = (mode || '').toLowerCase();
  if (m === 'cash') return <Banknote style={{ width: 14, height: 14 }} />;
  if (m === 'upi') return <Smartphone style={{ width: 14, height: 14 }} />;
  if (m === 'card') return <CreditCard style={{ width: 14, height: 14 }} />;
  return <IndianRupee style={{ width: 14, height: 14 }} />;
}

function paymentColor(mode: string | null) {
  const m = (mode || '').toLowerCase();
  if (m === 'cash') return C.emerald;
  if (m === 'upi') return C.purple;
  if (m === 'card') return C.blue;
  if (m === 'credit') return C.amber;
  return C.muted;
}

/* ─── Return Modal ───────────────────────────────────────────── */
function ReturnModal({
  sale, items, onClose, onSuccess,
}: {
  sale: Sale;
  items: SaleItem[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [returnQtys, setReturnQtys] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.id, 0]))
  );
  const [refundMethod, setRefundMethod] = useState<string>('cash');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function maxReturnable(item: SaleItem) {
    return Math.max(0, item.quantity - item.already_returned);
  }

  function setQty(itemId: string, val: number, item: SaleItem) {
    const clamped = Math.max(0, Math.min(val, maxReturnable(item)));
    setReturnQtys((prev) => ({ ...prev, [itemId]: clamped }));
  }

  /* ── Totals calculation (mirrors desktop logic) ── */
  const totals = useMemo(() => {
    let subtotal = 0;
    let gstAmount = 0;
    let grossRefund = 0;

    for (const item of items) {
      const qty = returnQtys[item.id] ?? 0;
      if (qty === 0) continue;
      const proportion = qty / item.quantity;
      const returnedBase = item.total_amount * proportion;
      // GST is inclusive in unit_price — extract it
      const taxable = item.gst_rate > 0
        ? returnedBase / (1 + item.gst_rate / 100)
        : returnedBase;
      const gst = returnedBase - taxable;
      subtotal += taxable;
      gstAmount += gst;
      grossRefund += returnedBase;
    }

    // Prorate bill-level discount
    const billDiscount = sale.discount_amount ?? 0;
    const originalGross = (sale.net_amount ?? sale.total_amount) + billDiscount;
    const returnProportion = originalGross > 0 ? grossRefund / originalGross : 0;
    const proratedDiscount = billDiscount * returnProportion;
    const totalRefund = Math.max(0, grossRefund - proratedDiscount);

    return { subtotal, gstAmount, proratedDiscount, totalRefund };
  }, [returnQtys, items, sale]);

  const totalUnits = Object.values(returnQtys).reduce((s, v) => s + v, 0);
  const canSubmit = totalUnits > 0 && refundMethod && !submitting;

  async function handleSubmit() {
    if (!canSubmit || !pharmacyId) return;
    setSubmitting(true);
    try {
      // 1. Insert sale_return header
      const { data: ret, error: retErr } = await supabase
        .from('sale_returns')
        .insert({
          pharmacy_id: pharmacyId,
          sale_id: sale.id,
          refund_amount: totals.totalRefund,
          refund_method: refundMethod,
          reason: reason.trim() || null,
          return_date: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (retErr) throw retErr;

      // 2. Insert return items + restore stock
      for (const item of items) {
        const qty = returnQtys[item.id] ?? 0;
        if (qty === 0) continue;
        const itemRefund = item.total_amount * (qty / item.quantity);

        // Insert return item
        const { error: riErr } = await supabase.from('sale_return_items').insert({
          sale_return_id: ret.id,
          sale_item_id: item.id,
          medicine_id: item.medicine_id,
          quantity: qty,
          refund_amount: itemRefund,
        });
        if (riErr) throw riErr;

        // Restore stock on batch
        if (item.batch_id) {
          const { data: batch } = await supabase
            .from('batches')
            .select('stock_quantity')
            .eq('id', item.batch_id)
            .single();
          if (batch) {
            const newQty = (batch.stock_quantity ?? 0) + qty;
            await supabase.from('batches').update({ stock_quantity: newQty }).eq('id', item.batch_id);
            // Log inventory transaction
            await supabase.from('inventory_transactions').insert({
              pharmacy_id: pharmacyId,
              batch_id: item.batch_id,
              medicine_id: item.medicine_id,
              transaction_type: 'sale_return',
              reference_type: 'sale_return',
              reference_id: ret.id,
              quantity_change: qty,
              quantity_after: newQty,
            });
          }
        }
      }

      toast.success(`Return processed · Refund ${formatCurrency(totals.totalRefund)}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process return');
    } finally {
      setSubmitting(false);
    }
  }

  const methods = [
    { key: 'cash', label: 'Cash', Icon: Banknote },
    { key: 'upi', label: 'UPI', Icon: Smartphone },
    { key: 'card', label: 'Card', Icon: CreditCard },
    { key: 'credit', label: 'Credit', Icon: IndianRupee },
  ];

  /* ── Main return modal ── */
  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...modalBox, maxWidth: 780, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${C.cardBorder}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCcw style={{ width: 16, height: 16, color: C.red }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: C.text }}>Process Return</h2>
              <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Select quantities to return to inventory</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: 'none', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Original bill summary — so the user knows what the sale was worth */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 24px', borderBottom: `1px solid ${C.cardBorder}`, background: 'rgba(99,102,241,0.05)', flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bill Total</p>
              <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 900, color: C.indigoLight, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {formatCurrency(sale.net_amount ?? sale.total_amount)}
              </p>
            </div>
            {(sale.discount_amount ?? 0) > 0 && (
              <div>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Discount</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: C.rose, lineHeight: 1 }}>
                  −{formatCurrency(sale.discount_amount ?? 0)}
                </p>
              </div>
            )}
            {(sale.gst_amount ?? 0) > 0 && (
              <div>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>GST</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: C.subtle, lineHeight: 1 }}>
                  {formatCurrency(sale.gst_amount ?? 0)}
                </p>
              </div>
            )}
            <div>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Items</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: C.subtle, lineHeight: 1 }}>
                {items.length}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', border: `1px solid rgba(99,102,241,0.2)` }}>
            <Receipt style={{ width: 12, height: 12, color: C.indigoLight }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: C.indigoLight }}>
              #{sale.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Body: items left, summary right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', flex: 1, overflow: 'hidden' }}>

          {/* Items list */}
          <div style={{ overflowY: 'auto', padding: '16px 24px', borderRight: `1px solid ${C.cardBorder}` }}>
            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Return Items</p>
            {items.map((item) => {
              const qty = returnQtys[item.id] ?? 0;
              const max = maxReturnable(item);
              const fullyReturned = max === 0;
              const lineRefund = qty > 0 ? item.total_amount * (qty / item.quantity) : 0;

              return (
                <div
                  key={item.id}
                  style={{
                    background: qty > 0 ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${qty > 0 ? 'rgba(239,68,68,0.15)' : C.cardBorder}`,
                    borderRadius: 14, padding: '14px 16px', marginBottom: 10,
                    opacity: fullyReturned ? 0.5 : 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>{item.medicine_name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>
                        Batch: {item.batch_number} · Sold: {item.quantity} · Rate: {formatCurrency(item.unit_price)}
                      </p>
                      {item.already_returned > 0 && (
                        <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 700, color: C.rose }}>
                          Already returned: {item.already_returned}
                        </p>
                      )}
                    </div>
                    {fullyReturned ? (
                      <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: C.muted, fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                        FULLY RETURNED
                      </span>
                    ) : qty > 0 ? (
                      <span style={{ fontSize: 13, fontWeight: 900, color: C.red, flexShrink: 0 }}>
                        −{formatCurrency(lineRefund)}
                      </span>
                    ) : null}
                  </div>

                  {/* Qty control */}
                  {!fullyReturned && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <p style={{ margin: 0, fontSize: 11, color: C.muted, flexShrink: 0 }}>Return qty:</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'rgba(255,255,255,0.05)', borderRadius: 10, border: `1px solid ${C.cardBorder}`, overflow: 'hidden' }}>
                        <button
                          onClick={() => setQty(item.id, qty - 1, item)}
                          disabled={qty === 0}
                          style={{ width: 32, height: 32, background: 'none', border: 'none', color: qty === 0 ? C.muted : C.subtle, cursor: qty === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}
                        >
                          <Minus style={{ width: 13, height: 13 }} />
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={max}
                          value={qty}
                          onChange={(e) => setQty(item.id, parseInt(e.target.value) || 0, item)}
                          style={{ width: 44, height: 32, background: 'none', border: 'none', color: C.text, fontSize: 13, fontWeight: 800, textAlign: 'center', outline: 'none' }}
                        />
                        <button
                          onClick={() => setQty(item.id, qty + 1, item)}
                          disabled={qty >= max}
                          style={{ width: 32, height: 32, background: 'none', border: 'none', color: qty >= max ? C.muted : C.red, cursor: qty >= max ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Plus style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: C.muted }}>of {max} available</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Refund Summary */}
          <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Refund Summary</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Items</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.subtle }}>{totalUnits}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Subtotal</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.subtle }}>{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.gstAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: C.muted }}>GST</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.subtle }}>{formatCurrency(totals.gstAmount)}</span>
                  </div>
                )}
                {totals.proratedDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: C.muted }}>Discount reversal</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.rose }}>−{formatCurrency(totals.proratedDiscount)}</span>
                  </div>
                )}
                <div style={{ height: 1, background: C.cardBorder }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>Total Refund</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: C.red }}>{formatCurrency(totals.totalRefund)}</span>
                </div>
              </div>
            </div>

            {/* Refund method */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Refund Method</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {methods.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => setRefundMethod(key)}
                    style={{
                      padding: '10px 8px', borderRadius: 10, border: `1px solid ${refundMethod === key ? C.indigo : C.cardBorder}`,
                      background: refundMethod === key ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                      color: refundMethod === key ? C.indigoLight : C.muted,
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}
                  >
                    <Icon style={{ width: 14, height: 14 }} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reason (optional)</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Wrong medicine, damaged packaging..."
                rows={3}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBorder}`, borderRadius: 10, color: C.text, fontSize: 12, padding: '10px 12px', resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                background: canSubmit ? C.indigo : 'rgba(99,102,241,0.3)',
                color: canSubmit ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: 14, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {submitting
                ? <><Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> Processing...</>
                : <><RotateCcw style={{ width: 15, height: 15 }} /> Process Return</>
              }
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 100,
  background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
};
const modalBox: React.CSSProperties = {
  background: '#0b0f24', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20, width: '100%', overflow: 'hidden',
  boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
};

/* ─── Main Page ──────────────────────────────────────────────── */
export default function SaleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);
  const pharmacyName = usePanelStore((s) => s.pharmacyName);

  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReturn, setShowReturn] = useState(false);

  // Pay credit modal state
  const [showPay, setShowPay] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const saleId = params.id as string;

  const load = useCallback(async () => {
    if (!pharmacyId || !saleId) return;
    setLoading(true);
    setError(null);
    try {
      const [saleRes, itemsRes] = await Promise.all([
        supabase
          .from('sales')
          .select('id, patient_name, doctor_name, customer_id, bill_date, total_amount, discount_amount, gst_amount, net_amount, payment_mode, payment_status, paid_amount, status, created_at, customers(name, phone)')
          .eq('id', saleId)
          .eq('pharmacy_id', pharmacyId)
          .single(),
        supabase
          .from('sale_items')
          // Real schema columns: mrp (per-unit price), amount (line total),
          // gst_percentage. The page UI uses unit_price/total_amount/gst_rate
          // names — we map them at coercion time below.
          .select('id, medicine_id, batch_id, quantity, mrp, amount, gst_percentage, discount_percentage, medicines(name), batches(batch_number)')
          .eq('sale_id', saleId),
      ]);

      if (saleRes.error) throw saleRes.error;
      const sd: any = saleRes.data;
      setSale({
        ...sd,
        customer_name: sd?.customers?.name ?? null,
        customer_phone: sd?.customers?.phone ?? null,
      });

      // Step 1: get return IDs for this sale
      const { data: saleReturnRows } = await supabase
        .from('sale_returns')
        .select('id')
        .eq('sale_id', saleId)
        .eq('pharmacy_id', pharmacyId);

      const returnIds = (saleReturnRows || []).map((r: any) => r.id);

      // Step 2: get returned quantities per sale_item
      let returnItems: any[] = [];
      if (returnIds.length > 0) {
        const { data } = await supabase
          .from('sale_return_items')
          .select('sale_item_id, quantity')
          .in('sale_return_id', returnIds);
        returnItems = data || [];
      }

      const returnedMap: Record<string, number> = {};
      for (const ri of returnItems || []) {
        returnedMap[ri.sale_item_id] = (returnedMap[ri.sale_item_id] ?? 0) + ri.quantity;
      }

      // Load credit payments tied to this bill (customer_ledger rows we
      // wrote in handlePayCredit / customer detail per-bill payment).
      if (sd?.customer_id) {
        const { data: payRows } = await supabase
          .from('customer_ledger')
          .select('id, amount, payment_method, notes, created_at, balance_after, transaction_type, reference_type, reference_id')
          .eq('pharmacy_id', pharmacyId)
          .eq('customer_id', sd.customer_id)
          .eq('reference_type', 'sale')
          .eq('reference_id', saleId)
          .eq('transaction_type', 'payment')
          .order('created_at', { ascending: true });
        setPayments(
          (payRows || []).map((p: any) => ({
            id: p.id,
            amount: Number(p.amount) || 0,
            payment_method: p.payment_method ?? null,
            notes: p.notes ?? null,
            created_at: p.created_at,
            balance_after: p.balance_after != null ? Number(p.balance_after) : null,
          }))
        );
      } else {
        setPayments([]);
      }

      setItems(
        (itemsRes.data || []).map((item: any) => {
          // Map real DB columns (mrp, amount, gst_percentage) onto the
          // page's UI fields (unit_price, total_amount, gst_rate).
          const qty = Number(item.quantity) || 0;
          const mrp = Number(item.mrp) || 0;
          const amount = Number(item.amount) || 0;
          // unit_price = effective per-unit price actually charged. Prefer
          // amount/qty (true rate after discount), fall back to mrp.
          const unitPrice = qty > 0 && amount > 0 ? +(amount / qty).toFixed(2) : mrp;
          // total_amount = line total. Use amount; fall back to mrp*qty.
          const totalAmount = amount > 0 ? amount : +(mrp * qty).toFixed(2);
          return {
            ...item,
            quantity: qty,
            mrp,
            unit_price: unitPrice,
            gst_rate: Number(item.gst_percentage) || 0,
            total_amount: totalAmount,
            medicine_name: item.medicines?.name || 'Unknown Medicine',
            batch_number: item.batches?.batch_number || '—',
            already_returned: returnedMap[item.id] ?? 0,
          };
        })
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to load sale details');
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, saleId]);

  useEffect(() => { load(); }, [load]);

  // Auto-open the return modal when arriving with ?action=return — used by
  // the standalone Process Return flow which routes here after looking up
  // the sale by bill number.
  useEffect(() => {
    if (loading || !sale || items.length === 0) return;
    if (searchParams?.get('action') === 'return') setShowReturn(true);
  }, [loading, sale, items.length, searchParams]);

  /* ─── Pay credit on this bill ─── */
  async function handlePayCredit() {
    if (!sale || !pharmacyId) return;
    const due = Math.max(0, (sale.net_amount ?? sale.total_amount) - Number(sale.paid_amount ?? 0));
    const amt = Number(payAmount);
    if (!amt || amt <= 0) { setPayError('Enter a valid amount'); return; }
    if (amt > due + 0.01) { setPayError(`Amount exceeds credit due (${formatCurrency(due)})`); return; }
    setPaying(true); setPayError(null);
    try {
      const newPaid = +(Number(sale.paid_amount ?? 0) + amt).toFixed(2);
      const newDue = +(due - amt).toFixed(2);
      const newStatus = newDue <= 0.01 ? 'paid' : 'partial';

      // 1. Update sales row
      const { error: sErr } = await supabase
        .from('sales')
        .update({ paid_amount: newPaid, payment_status: newStatus })
        .eq('id', sale.id)
        .eq('pharmacy_id', pharmacyId);
      if (sErr) throw sErr;

      // 2. If the sale is linked to a customer, decrement their outstanding
      //    balance and write a customer_ledger entry so the payment shows in
      //    their ledger and on the customer detail page.
      if (sale.customer_id) {
        const { data: cust } = await supabase
          .from('customers')
          .select('outstanding_balance')
          .eq('id', sale.customer_id)
          .eq('pharmacy_id', pharmacyId)
          .maybeSingle();
        const currentOut = Number(cust?.outstanding_balance ?? 0);
        const nextOut = Math.max(0, +(currentOut - amt).toFixed(2));

        await supabase.from('customer_ledger').insert({
          pharmacy_id: pharmacyId,
          customer_id: sale.customer_id,
          transaction_type: 'payment',
          amount: amt,
          balance_after: nextOut,
          payment_method: payMethod,
          notes: payNote.trim() ? `Bill payment · ${payNote.trim()}` : `Payment for bill #${sale.id}`,
          reference_type: 'sale',
          reference_id: sale.id,
        });
        await supabase
          .from('customers')
          .update({ outstanding_balance: nextOut })
          .eq('id', sale.customer_id)
          .eq('pharmacy_id', pharmacyId);
      }

      toast.success(newDue <= 0.01 ? 'Bill fully paid' : `${formatCurrency(amt)} recorded`);
      setShowPay(false); setPayAmount(''); setPayNote(''); setPayMethod('cash');
      await load();
    } catch (e: any) {
      setPayError(e?.message || 'Failed to record payment');
    } finally {
      setPaying(false);
    }
  }

  /* ─── Loading ── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <Loader2 style={{ width: 28, height: 28, color: C.indigo, animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !sale) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
      <AlertTriangle style={{ width: 36, height: 36, color: C.amber }} />
      <p style={{ color: C.muted, fontSize: 14 }}>{error || 'Sale not found'}</p>
      <button onClick={() => router.back()} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.cardBorder}`, color: C.subtle, fontSize: 13, cursor: 'pointer' }}>
        Go Back
      </button>
    </div>
  );

  /* ─── Derived values ── */
  const subtotal = items.reduce((s, i) => s + (i.unit_price * i.quantity), 0);
  const gst = sale.gst_amount ?? 0;
  const discount = sale.discount_amount ?? 0;
  const netPayable = sale.net_amount ?? sale.total_amount;
  const discountPct = subtotal > 0 ? ((discount / subtotal) * 100).toFixed(1) : '0';
  const status = (sale.payment_status || '').toLowerCase();
  const paid = Math.max(0, Number(sale.paid_amount ?? 0));
  const credit = Math.max(0, +(netPayable - paid).toFixed(2));
  const isPartial = status === 'partial' || (paid > 0 && credit > 0);
  const isCredit = !isPartial && ((sale.payment_mode || '').toLowerCase() === 'credit' || status === 'unpaid' || status === 'credit' || (paid <= 0 && netPayable > 0));
  const isPaid = !isPartial && !isCredit;
  const pColor = paymentColor(sale.payment_mode);
  const isFullyReturned = items.length > 0 && items.every((i) => i.already_returned >= i.quantity);
  const hasAnyReturn = items.some((i) => i.already_returned > 0);

  /* ─── Print handler ── */
  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Sale #${saleId}</title><style>
      body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:20px}
      h1{font-size:18px;margin:0 0 4px}h2{font-size:13px;margin:0 0 16px;color:#555}
      .hdr{text-align:center;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:12px}
      .row{display:flex;justify-content:space-between;margin-bottom:4px}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      th{text-align:left;border-bottom:1px solid #ccc;padding:6px 4px;font-size:11px}
      td{padding:5px 4px;border-bottom:1px solid #eee;font-size:11px}
      .r{text-align:right}.tot{margin-top:10px;border-top:1px solid #ccc;padding-top:8px}
      .tr{display:flex;justify-content:space-between;margin-bottom:3px}
      .grand{font-weight:bold;font-size:14px;border-top:2px solid #111;padding-top:6px;margin-top:6px}
      @media print{body{margin:10px}}
    </style></head><body>
      <div class="hdr"><h1>${pharmacyName || 'ShelfCure Pharmacy'}</h1><h2>Tax Invoice</h2></div>
      <div class="row"><span><b>Date:</b> ${fmtDate(sale.bill_date)}</span><span><b>${sale.customer_name ? 'Customer' : 'Patient'}:</b> ${sale.customer_name || sale.patient_name || 'Walk-in'}${sale.customer_phone ? ` (${sale.customer_phone})` : ''}</span></div>
      <div class="row"><span><b>Doctor:</b> ${sale.doctor_name || '—'}</span><span><b>Payment:</b> ${sale.payment_mode || '—'}</span></div>
      <table><thead><tr><th>#</th><th>Medicine</th><th>Batch</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">GST%</th><th class="r">Amount</th></tr></thead>
      <tbody>${items.map((item, i) => {
        const qty = Number(item.quantity) || 0;
        const rate = Number(item.unit_price) || 0;
        const amt = Number(item.total_amount) || 0;
        const gstR = Number(item.gst_rate) || 0;
        return `<tr><td>${i + 1}</td><td>${item.medicine_name ?? '—'}</td><td>${item.batch_number ?? '—'}</td><td class="r">${qty}</td><td class="r">₹${rate.toFixed(2)}</td><td class="r">${gstR}%</td><td class="r">₹${amt.toFixed(2)}</td></tr>`;
      }).join('')}</tbody></table>
      <div class="tot">
        <div class="tr"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
        ${gst > 0 ? `<div class="tr"><span>GST</span><span>₹${gst.toFixed(2)}</span></div>` : ''}
        ${discount > 0 ? `<div class="tr"><span>Discount (${discountPct}%)</span><span>-₹${discount.toFixed(2)}</span></div>` : ''}
        <div class="tr grand"><span>Net Payable</span><span>₹${netPayable.toFixed(2)}</span></div>
        ${(isPartial || credit > 0.01) ? `
          <div class="tr"><span>Paid</span><span>₹${paid.toFixed(2)}</span></div>
          <div class="tr"><span><b>Credit Due</b></span><span><b>₹${credit.toFixed(2)}</b></span></div>
        ` : ''}
      </div>
      <p style="text-align:center;margin-top:20px;font-size:11px;color:#777">Thank you for your visit! • Get well soon.</p>
    </body></html>`);
    win.document.close();
    win.print();
  };

  /* ─── Render ── */
  return (
    <>
      <Toaster position="top-right" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

      {showReturn && (
        <ReturnModal
          sale={sale}
          items={items}
          onClose={() => setShowReturn(false)}
          onSuccess={() => load()}
        />
      )}

      {showPay && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={() => { setShowPay(false); setPayError(null); }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 460, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: 22, boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet style={{ width: 16, height: 16, color: C.emerald }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.text }}>Pay Credit on This Bill</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>{sale.customer_name || sale.patient_name || 'Walk-in'} · Due {formatCurrency(credit)}</p>
                </div>
              </div>
              <button onClick={() => { setShowPay(false); setPayError(null); }}
                style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {payError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', border: `1px solid rgba(244,63,94,0.25)`, color: C.rose, fontSize: 12, marginBottom: 12 }}>
                <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                <span>{payError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 9, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                  Amount (₹) — Max: {formatCurrency(credit)}
                </label>
                <input
                  type="number" min="1" max={credit} step="0.01" autoFocus
                  value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', fontSize: 18, fontWeight: 900, color: C.text, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cardBorder}`, borderRadius: 10, outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <button type="button" onClick={() => setPayAmount(credit.toFixed(2))}
                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, color: C.emerald, background: 'rgba(16,185,129,0.1)', border: `1px solid rgba(16,185,129,0.2)`, borderRadius: 6, cursor: 'pointer' }}>
                    Full ({formatCurrency(credit)})
                  </button>
                  <button type="button" onClick={() => setPayAmount((credit / 2).toFixed(2))}
                    style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700, color: C.indigoLight, background: 'rgba(99,102,241,0.1)', border: `1px solid rgba(99,102,241,0.2)`, borderRadius: 6, cursor: 'pointer' }}>
                    Half
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 9, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Payment Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13, color: C.text, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cardBorder}`, borderRadius: 10, outline: 'none', cursor: 'pointer', boxSizing: 'border-box', colorScheme: 'dark' }}>
                  {['cash', 'upi', 'card', 'bank_transfer', 'cheque'].map((m) => (
                    <option key={m} value={m} style={{ background: '#0B1121', color: C.text }}>
                      {m.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 9, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Notes (optional)</label>
                <input value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="Reference, voucher no…"
                  style={{ width: '100%', padding: '10px 12px', fontSize: 13, color: C.text, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cardBorder}`, borderRadius: 10, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => { setShowPay(false); setPayError(null); }}
                style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${C.cardBorder}`, background: 'transparent', color: C.muted, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handlePayCredit} disabled={paying}
                style={{ flex: 1, padding: 11, borderRadius: 10, border: 'none', background: C.emerald, color: '#fff', fontSize: 12, fontWeight: 800, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: paying ? 0.7 : 1 }}>
                {paying ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <IndianRupee style={{ width: 14, height: 14 }} />}
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '0 0 48px', animation: 'fadeIn 0.3s ease' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => router.back()}
              style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.cardBorder}`, color: C.subtle, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = C.subtle; }}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>Sale Invoice</h1>
                <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.12)', color: C.indigoLight, fontSize: 12, fontWeight: 800 }}>
                  #{saleId.slice(0, 8).toUpperCase()}
                </span>
                {isFullyReturned && (
                  <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: C.red, fontSize: 11, fontWeight: 800 }}>RETURNED</span>
                )}
                {hasAnyReturn && !isFullyReturned && (
                  <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.12)', color: C.amber, fontSize: 11, fontWeight: 800 }}>PARTIAL RETURN</span>
                )}
                {isCredit && !isFullyReturned && (
                  <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.12)', color: C.amber, fontSize: 11, fontWeight: 800 }}>CREDIT</span>
                )}
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>{fmtDate(sale.bill_date)}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Process Return button */}
            <button
              onClick={() => setShowReturn(true)}
              disabled={isFullyReturned}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
                borderRadius: 12,
                background: isFullyReturned ? 'rgba(255,255,255,0.03)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${isFullyReturned ? C.cardBorder : 'rgba(239,68,68,0.25)'}`,
                color: isFullyReturned ? C.muted : C.red,
                fontSize: 13, fontWeight: 700, cursor: isFullyReturned ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!isFullyReturned) e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
              onMouseLeave={e => { if (!isFullyReturned) e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
              title={isFullyReturned ? 'All items have been returned' : 'Process a return for this sale'}
            >
              <RotateCcw style={{ width: 15, height: 15 }} />
              {isFullyReturned ? 'Fully Returned' : 'Process Return'}
            </button>

            {/* Pay Credit button — only when there's outstanding credit on this bill */}
            {credit > 0.01 && (
              <button
                onClick={() => { setPayAmount(credit.toFixed(2)); setPayError(null); setShowPay(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, background: 'rgba(16,185,129,0.12)', border: `1px solid rgba(16,185,129,0.3)`, color: C.emerald, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; }}
                title={`Pay ${formatCurrency(credit)} credit due on this bill`}
              >
                <Wallet style={{ width: 15, height: 15 }} />
                Pay Credit · {formatCurrency(credit)}
              </button>
            )}

            {/* Print button */}
            <button
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: `1px solid rgba(99,102,241,0.25)`, color: C.indigoLight, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
            >
              <Printer style={{ width: 15, height: 15 }} />
              Print Bill
            </button>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

          {/* ── LEFT SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Invoice hero */}
            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(124,58,237,0.08))', border: `1px solid rgba(99,102,241,0.2)`, borderRadius: 18, padding: '20px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt style={{ width: 16, height: 16, color: C.indigoLight }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Invoice</p>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.subtle }}>#{saleId.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>{formatCurrency(netPayable)}</p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: C.muted }}>{fmtDate(sale.bill_date)}</p>
            </div>

            {/* Customer card */}
            <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <User style={{ width: 13, height: 13, color: C.muted }} />
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {sale.customer_name ? 'Customer' : 'Patient'}
                </p>
              </div>
              {(() => {
                const displayName = sale.customer_name || sale.patient_name || 'Walk-in Customer';
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 900, flexShrink: 0 }}>
                      {displayName[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>{displayName}</p>
                      {sale.customer_phone && (
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>{sale.customer_phone}</p>
                      )}
                      {sale.doctor_name && (
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>Dr. {sale.doctor_name}</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Summary */}
            <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '16px 18px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Summary</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Subtotal</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.subtle }}>{formatCurrency(subtotal)}</span>
                </div>
                {gst > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: C.muted }}>GST</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.subtle }}>{formatCurrency(gst)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: C.muted }}>Discount ({discountPct}%)</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.rose }}>−{formatCurrency(discount)}</span>
                  </div>
                )}
                <div style={{ height: 1, background: C.cardBorder }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>Net Payable</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: C.indigoLight }}>{formatCurrency(netPayable)}</span>
                </div>
              </div>
            </div>

            {/* Payment status */}
            {(() => {
              const accent = isPartial ? C.amber : isCredit ? C.rose : C.emerald;
              const bg = isPartial ? 'rgba(245,158,11,0.08)' : isCredit ? 'rgba(244,63,94,0.08)' : 'rgba(16,185,129,0.08)';
              const border = isPartial ? 'rgba(245,158,11,0.25)' : isCredit ? 'rgba(244,63,94,0.25)' : 'rgba(16,185,129,0.25)';
              const Icon = isPartial ? AlertTriangle : isCredit ? AlertTriangle : CheckCircle2;
              const heading = isPartial ? 'Partially Paid' : isCredit ? 'Payment Pending (Credit)' : 'Payment Successful';
              const paidPct = netPayable > 0 ? Math.min(100, Math.round((paid / netPayable) * 100)) : (isPaid ? 100 : 0);
              return (
                <div style={{ padding: '14px 16px', borderRadius: 14, background: bg, border: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon style={{ width: 16, height: 16, color: accent, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: accent }}>{heading}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted, textTransform: 'capitalize' }}>
                        {sale.payment_status || sale.status}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 900, color: accent, background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 999, border: `1px solid ${border}` }}>
                      {paidPct}% paid
                    </span>
                  </div>

                  {/* Progress bar */}
                  {netPayable > 0 && (
                    <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${paidPct}%`, background: accent, borderRadius: 999, transition: 'width 0.4s ease' }} />
                    </div>
                  )}

                  {/* Paid / Credit breakdown — only show split when partial OR when there's any credit */}
                  {(isPartial || credit > 0.01) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: 'rgba(16,185,129,0.08)', border: `1px solid rgba(16,185,129,0.2)`, borderRadius: 10, padding: '8px 10px' }}>
                        <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Paid</p>
                        <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 900, color: C.emerald, lineHeight: 1 }}>
                          {formatCurrency(paid)}
                        </p>
                        {sale.payment_mode && paid > 0 && (
                          <p style={{ margin: '3px 0 0', fontSize: 9, color: C.muted, textTransform: 'capitalize' }}>via {sale.payment_mode}</p>
                        )}
                      </div>
                      <div style={{ background: 'rgba(244,63,94,0.08)', border: `1px solid rgba(244,63,94,0.2)`, borderRadius: 10, padding: '8px 10px' }}>
                        <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Credit Due</p>
                        <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 900, color: C.rose, lineHeight: 1 }}>
                          {formatCurrency(credit)}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: 9, color: C.muted }}>added to outstanding</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Credit Payment History — show when the bill ever had credit
                 (i.e. there are recorded payments, or there's still due) */}
            {(payments.length > 0 || (isPartial || isCredit) && credit > 0.01) && (
              <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Wallet style={{ width: 13, height: 13, color: C.muted }} />
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Credit Payments
                    </p>
                  </div>
                  {payments.length > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.emerald, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 999, border: `1px solid rgba(16,185,129,0.2)` }}>
                      {formatCurrency(payments.reduce((s, p) => s + p.amount, 0))} received
                    </span>
                  )}
                </div>

                {payments.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 11, color: C.muted, textAlign: 'center', padding: '12px 0' }}>
                    No payments recorded yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {payments.map((p) => {
                      const method = (p.payment_method || '').toLowerCase();
                      const mColor = paymentColor(method);
                      return (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(16,185,129,0.05)', border: `1px solid rgba(16,185,129,0.15)` }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${mColor}1a`, color: mColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <PaymentIcon mode={method || 'cash'} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.emerald }}>
                                +{formatCurrency(p.amount)}
                              </p>
                              <p style={{ margin: 0, fontSize: 10, color: C.muted, textTransform: 'capitalize', flexShrink: 0 }}>
                                {(p.payment_method || 'cash').replace('_', ' ')}
                              </p>
                            </div>
                            <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted }}>
                              {fmtDate(p.created_at)}
                            </p>
                            {p.notes && (
                              <p style={{ margin: '4px 0 0', fontSize: 10, color: C.subtle, fontStyle: 'italic', wordBreak: 'break-word' }}>
                                {p.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Payment method */}
            <div style={{ background: '#0d1117', border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${pColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pColor, flexShrink: 0 }}>
                <PaymentIcon mode={sale.payment_mode} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment Method</p>
                <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: pColor, textTransform: 'capitalize' }}>{sale.payment_mode || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Items ── */}
          <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package style={{ width: 14, height: 14, color: C.indigoLight }} />
              </div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>Items Sold ({items.length})</p>
            </div>

            {items.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: C.muted, fontSize: 13 }}>No items found</div>
            ) : (
              <div>
                {items.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderBottom: idx < items.length - 1 ? `1px solid rgba(255,255,255,0.03)` : 'none' }}>
                    <div style={{ width: 3, height: 44, borderRadius: 2, background: item.already_returned >= item.quantity ? C.muted : C.indigo, flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: item.already_returned >= item.quantity ? C.muted : C.text }}>{item.medicine_name}</p>
                          {item.already_returned > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: item.already_returned >= item.quantity ? C.muted : C.rose }}>
                              {item.already_returned >= item.quantity ? '✓ Fully Returned' : `${item.already_returned} returned`}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: item.already_returned >= item.quantity ? C.muted : C.indigoLight, flexShrink: 0 }}>{formatCurrency(item.total_amount)}</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                        {[
                          { label: 'Batch', value: item.batch_number },
                          { label: 'Rate', value: formatCurrency(item.unit_price) },
                          { label: 'Qty', value: String(item.quantity) },
                          { label: 'GST', value: `${item.gst_rate}%` },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '6px 8px' }}>
                            <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                            <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 700, color: C.subtle }}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Footer */}
                <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.cardBorder}`, background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                  <div style={{ display: 'flex', gap: 24 }}>
                    {discount > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: 10, color: C.muted }}>Discount</p>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.rose }}>−{formatCurrency(discount)}</p>
                      </div>
                    )}
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 10, color: C.muted }}>Net Payable</p>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: C.text }}>{formatCurrency(netPayable)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
