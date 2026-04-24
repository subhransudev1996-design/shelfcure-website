'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency } from '@/lib/utils/format';
import {
  ArrowLeft, Printer, Loader2, Receipt, User,
  CreditCard, Banknote, Smartphone, IndianRupee, Package,
  AlertTriangle, CheckCircle2, RotateCcw, X, Minus, Plus,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

/* ─── Types ──────────────────────────────────────────────────── */
interface Sale {
  id: string;
  patient_name: string | null;
  doctor_name: string | null;
  customer_id: string | null;
  bill_date: string;
  total_amount: number;
  discount_amount: number | null;
  gst_amount: number | null;
  net_amount: number | null;
  payment_mode: string | null;
  status: string;
  created_at: string;
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
  const [done, setDone] = useState(false);
  const [finalRefund, setFinalRefund] = useState(0);

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

      setFinalRefund(totals.totalRefund);
      setDone(true);
      onSuccess();
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

  /* ── Success screen ── */
  if (done) return (
    <div style={overlay}>
      <div style={{ ...modalBox, maxWidth: 440, textAlign: 'center', padding: '48px 32px' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle2 style={{ width: 36, height: 36, color: C.emerald }} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 900, color: C.text }}>Return Processed</h2>
        <p style={{ margin: '0 0 8px', fontSize: 14, color: C.muted }}>Refund of</p>
        <p style={{ margin: '0 0 28px', fontSize: 32, fontWeight: 900, color: C.emerald }}>{formatCurrency(finalRefund)}</p>
        <p style={{ margin: '0 0 28px', fontSize: 12, color: C.muted }}>via <strong style={{ color: C.subtle, textTransform: 'capitalize' }}>{refundMethod}</strong> · Stock restored</p>
        <button
          onClick={onClose}
          style={{ width: '100%', padding: '12px', borderRadius: 12, background: C.indigo, border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
        >
          Done
        </button>
      </div>
    </div>
  );

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
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);
  const pharmacyName = usePanelStore((s) => s.pharmacyName);

  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReturn, setShowReturn] = useState(false);

  const saleId = params.id as string;

  const load = useCallback(async () => {
    if (!pharmacyId || !saleId) return;
    setLoading(true);
    setError(null);
    try {
      const [saleRes, itemsRes] = await Promise.all([
        supabase
          .from('sales')
          .select('id, patient_name, doctor_name, customer_id, bill_date, total_amount, discount_amount, gst_amount, net_amount, payment_mode, status, created_at')
          .eq('id', saleId)
          .eq('pharmacy_id', pharmacyId)
          .single(),
        supabase
          .from('sale_items')
          .select('id, medicine_id, batch_id, quantity, mrp, unit_price, gst_rate, total_amount, medicines(name), batches(batch_number)')
          .eq('sale_id', saleId),
      ]);

      if (saleRes.error) throw saleRes.error;
      setSale(saleRes.data);

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

      setItems(
        (itemsRes.data || []).map((item: any) => ({
          ...item,
          medicine_name: item.medicines?.name || 'Unknown Medicine',
          batch_number: item.batches?.batch_number || '—',
          already_returned: returnedMap[item.id] ?? 0,
        }))
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to load sale details');
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, saleId]);

  useEffect(() => { load(); }, [load]);

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
  const isCredit = (sale.payment_mode || '').toLowerCase() === 'credit';
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
      <div class="row"><span><b>Date:</b> ${fmtDate(sale.bill_date)}</span><span><b>Patient:</b> ${sale.patient_name || 'Walk-in'}</span></div>
      <div class="row"><span><b>Doctor:</b> ${sale.doctor_name || '—'}</span><span><b>Payment:</b> ${sale.payment_mode || '—'}</span></div>
      <table><thead><tr><th>#</th><th>Medicine</th><th>Batch</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">GST%</th><th class="r">Amount</th></tr></thead>
      <tbody>${items.map((item, i) => `<tr><td>${i + 1}</td><td>${item.medicine_name}</td><td>${item.batch_number}</td><td class="r">${item.quantity}</td><td class="r">₹${item.unit_price.toFixed(2)}</td><td class="r">${item.gst_rate}%</td><td class="r">₹${item.total_amount.toFixed(2)}</td></tr>`).join('')}</tbody></table>
      <div class="tot">
        <div class="tr"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
        ${gst > 0 ? `<div class="tr"><span>GST</span><span>₹${gst.toFixed(2)}</span></div>` : ''}
        ${discount > 0 ? `<div class="tr"><span>Discount (${discountPct}%)</span><span>-₹${discount.toFixed(2)}</span></div>` : ''}
        <div class="tr grand"><span>Net Payable</span><span>₹${netPayable.toFixed(2)}</span></div>
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

            {/* Patient card */}
            <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <User style={{ width: 13, height: 13, color: C.muted }} />
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Patient</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 900, flexShrink: 0 }}>
                  {(sale.patient_name || 'W')[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>{sale.patient_name || 'Walk-in Customer'}</p>
                  {sale.doctor_name && (
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>Dr. {sale.doctor_name}</p>
                  )}
                </div>
              </div>
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
            <div style={{ padding: '12px 16px', borderRadius: 14, background: isCredit ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${isCredit ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              {isCredit
                ? <AlertTriangle style={{ width: 16, height: 16, color: C.amber, flexShrink: 0 }} />
                : <CheckCircle2 style={{ width: 16, height: 16, color: C.emerald, flexShrink: 0 }} />}
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: isCredit ? C.amber : C.emerald }}>
                  {isCredit ? 'Payment Pending (Credit)' : 'Payment Successful'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted }}>{sale.status}</p>
              </div>
            </div>

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
