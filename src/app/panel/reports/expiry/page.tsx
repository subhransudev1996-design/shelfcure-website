'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency } from '@/lib/utils/format';
import {
  Loader2, ArrowLeft, AlertTriangle, Package,
  Search, X, RotateCcw, Truck, Trash2,
  CheckSquare, Square,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

/* ─── Palette ────────────────────────────────────────── */
const C = {
  bg: '#060914', card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.07)',
  text: '#f1f5f9', muted: '#475569', subtle: '#94a3b8',
  rose: '#f43f5e', roseLight: '#fb7185',
  amber: '#f59e0b', amberLight: '#fbbf24',
  orange: '#f97316', orangeLight: '#fdba74',
  indigo: '#6366f1', indigoLight: '#818cf8',
  input: '#0d1127', inputBorder: 'rgba(255,255,255,0.1)',
};

/* ─── Types ────────────────────────────────────────────── */
interface ExpiryItem {
  batch_id: number;
  medicine_id: number;
  medicine_name: string;
  batch_number: string;
  expiry_date: string;
  days_to_expiry: number;
  is_expired: boolean;
  stock_quantity: number;
  purchase_price: number;
  mrp: number;
  value_at_mrp: number;
  purchase_id: number | null;
  purchase_item_id: number | null;
  supplier_id: number | null;
  supplier_name: string | null;
}

interface SupplierGroup {
  supplierId: number;
  supplierName: string;
  purchaseId: number;
  items: ExpiryItem[];
}

/* ─── Group helper ─────────────────────────────────────── */
function groupBySupplier(items: ExpiryItem[]): SupplierGroup[] {
  const map = new Map<number, SupplierGroup>();
  for (const item of items) {
    if (!item.supplier_id || !item.purchase_id) continue;
    const key = item.supplier_id;
    if (!map.has(key)) {
      map.set(key, {
        supplierId: item.supplier_id,
        supplierName: item.supplier_name ?? 'Unknown Supplier',
        purchaseId: item.purchase_id,
        items: [],
      });
    }
    map.get(key)!.items.push(item);
  }
  return Array.from(map.values());
}

/* ─── Return Modal ─────────────────────────────────────── */
function ReturnModal({
  supplierGroups, writeOffItems, pharmacyId, onClose, onSuccess,
}: {
  supplierGroups: SupplierGroup[];
  writeOffItems: ExpiryItem[];
  pharmacyId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const [returnQty, setReturnQty] = useState<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    for (const g of supplierGroups) for (const item of g.items) map[item.batch_id] = item.stock_quantity;
    for (const item of writeOffItems) map[item.batch_id] = item.stock_quantity;
    return map;
  });
  const [submitting, setSubmitting] = useState(false);

  function adjustQty(batchId: number, max: number, delta: number) {
    setReturnQty(prev => ({ ...prev, [batchId]: Math.min(Math.max((prev[batchId] ?? 0) + delta, 0), max) }));
  }

  function calcGroupTotals(group: SupplierGroup) {
    let subtotal = 0, gstAmount = 0;
    for (const item of group.items) {
      const qty = returnQty[item.batch_id] ?? 0;
      if (qty <= 0) continue;
      const line = qty * item.purchase_price;
      subtotal += line;
      gstAmount += line * (0 / 100);
    }
    return { subtotal, gstAmount, total: subtotal + gstAmount };
  }

  const grandSubtotal = supplierGroups.reduce((s, g) => s + calcGroupTotals(g).subtotal, 0);
  const grandGst = supplierGroups.reduce((s, g) => s + calcGroupTotals(g).gstAmount, 0);
  const grandTotal = grandSubtotal + grandGst;
  const hasAnyQty = Object.values(returnQty).some(q => q > 0);

  async function handleSubmit() {
    setSubmitting(true);
    let successCount = 0, errorCount = 0;
    try {
      // Supplier returns — create purchase_return + purchase_return_items
      for (const group of supplierGroups) {
        const groupItems: Array<{ purchase_item_id: number; medicine_id: number; batch_id: number; quantity: number; amount: number; pharmacy_id: string; }> = [];
        let subtotal = 0, gstAmount = 0;
        for (const item of group.items) {
          const qty = returnQty[item.batch_id] ?? 0;
          if (qty <= 0) continue;
          const line = qty * item.purchase_price;
          const lineGst = line * (0 / 100);
          subtotal += line; gstAmount += lineGst;
          groupItems.push({
            purchase_item_id: item.purchase_item_id ?? 0,
            medicine_id: item.medicine_id,
            batch_id: item.batch_id,
            quantity: qty,
            amount: line + lineGst,
            pharmacy_id: pharmacyId,
          });
        }
        if (groupItems.length === 0) continue;

        // Generate return number
        const returnNumber = `PRN-${Date.now()}-${group.supplierId}`;

        const { data: pr, error: prErr } = await supabase
          .from('purchase_returns')
          .insert({
            pharmacy_id: pharmacyId,
            purchase_id: group.purchaseId,
            supplier_id: group.supplierId,
            return_number: returnNumber,
            subtotal,
            gst_amount: gstAmount,
            total_amount: subtotal + gstAmount,
            reason: 'Expired / Near Expiry Return',
          })
          .select('id').single();

        if (prErr || !pr) { errorCount++; continue; }

        const { error: itemsErr } = await supabase
          .from('purchase_return_items')
          .insert(groupItems.map(i => ({ ...i, purchase_return_id: pr.id })));

        if (itemsErr) { errorCount++; continue; }

        // Deduct stock
        for (const item of groupItems) {
          const origItem = group.items.find(i => i.batch_id === item.batch_id);
          const newQty = Math.max(0, (origItem?.stock_quantity ?? 0) - item.quantity);
          await supabase.from('batches').update({ stock_quantity: newQty }).eq('id', item.batch_id);
          await supabase.from('inventory_transactions').insert({
            pharmacy_id: pharmacyId,
            batch_id: item.batch_id,
            medicine_id: item.medicine_id,
            transaction_type: 'purchase_return',
            quantity_change: -item.quantity,
            quantity_after: newQty,
            reference_type: 'purchase_return',
            reference_id: pr.id,
          });
        }
        successCount++;
      }

      // Write-offs — just log inventory_transactions as 'expired'
      for (const item of writeOffItems) {
        const qty = returnQty[item.batch_id] ?? 0;
        if (qty <= 0) continue;
        const newQty = Math.max(0, item.stock_quantity - qty);
        const { error } = await supabase.from('inventory_transactions').insert({
          pharmacy_id: pharmacyId,
          batch_id: item.batch_id,
          medicine_id: item.medicine_id,
          transaction_type: 'expired',
          quantity_change: -qty,
          quantity_after: newQty,
          reference_type: 'write_off',
          reference_id: null,
        });
        if (!error) {
          await supabase.from('batches').update({ stock_quantity: newQty }).eq('id', item.batch_id);
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (errorCount === 0) {
        alert('Return processed successfully!');
      } else if (successCount > 0) {
        alert(`Partially processed — ${errorCount} item(s) failed.`);
      } else {
        alert('All returns failed. Please try again.');
        return;
      }
      onSuccess();
    } catch (e) {
      console.error(e);
      alert('Failed to process return.');
    } finally {
      setSubmitting(false);
    }
  }

  const inp: React.CSSProperties = {
    width: 56, textAlign: 'center', fontWeight: 900, fontSize: 14,
    backgroundColor: C.input, border: `1.5px solid ${C.inputBorder}`,
    borderRadius: 8, padding: '6px 4px', color: C.text,
    fontFamily: 'inherit', outline: 'none',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}>
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 24, width: '100%', maxWidth: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RotateCcw style={{ width: 18, height: 18, color: C.orange }} />
              Process Expiry Returns
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>
              {supplierGroups.length > 0 && `${supplierGroups.length} supplier return${supplierGroups.length > 1 ? 's' : ''}`}
              {supplierGroups.length > 0 && writeOffItems.length > 0 && ' · '}
              {writeOffItems.length > 0 && `${writeOffItems.length} stock write-off${writeOffItems.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: 15, height: 15, color: C.muted }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Supplier return groups */}
          {supplierGroups.map(group => {
            const totals = calcGroupTotals(group);
            return (
              <div key={group.supplierId} style={{ border: `1px solid rgba(99,102,241,0.15)`, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ backgroundColor: 'rgba(99,102,241,0.08)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Truck style={{ width: 15, height: 15, color: C.indigo }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.indigoLight }}>{group.supplierName}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: C.indigo, backgroundColor: 'rgba(99,102,241,0.12)', padding: '3px 10px', borderRadius: 99 }}>Purchase Return</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {group.items.map(item => {
                    const qty = returnQty[item.batch_id] ?? 0;
                    return (
                      <div key={item.batch_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: `1px solid ${C.cardBorder}` }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{item.medicine_name}</p>
                          <p style={{ margin: '3px 0 0', fontSize: 11, color: C.muted }}>
                            Batch <span style={{ fontFamily: 'monospace', color: C.subtle }}>{item.batch_number}</span>
                            {' · '}Exp: <span style={{ color: item.is_expired ? C.rose : C.orange, fontWeight: 700 }}>{item.expiry_date}</span>
                            {' · '}Avail: <span style={{ color: C.subtle, fontWeight: 700 }}>{item.stock_quantity} units</span>
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button onClick={() => adjustQty(item.batch_id, item.stock_quantity, -1)} disabled={qty <= 0}
                            style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${C.cardBorder}`, color: C.text, cursor: qty <= 0 ? 'not-allowed' : 'pointer', opacity: qty <= 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>−</button>
                          <input type="number" min={0} max={item.stock_quantity}
                            value={qty || ''}
                            onChange={e => {
                              const v = Math.min(Math.max(parseInt(e.target.value) || 0, 0), item.stock_quantity);
                              setReturnQty(prev => ({ ...prev, [item.batch_id]: v }));
                            }}
                            style={inp} />
                          <button onClick={() => adjustQty(item.batch_id, item.stock_quantity, 1)} disabled={qty >= item.stock_quantity}
                            style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${C.cardBorder}`, color: C.text, cursor: qty >= item.stock_quantity ? 'not-allowed' : 'pointer', opacity: qty >= item.stock_quantity ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>+</button>
                        </div>
                        <div style={{ width: 90, textAlign: 'right' }}>
                          <p style={{ margin: 0, fontSize: 11, color: C.muted }}>@{formatCurrency(item.purchase_price)}</p>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.orange }}>{formatCurrency(qty * item.purchase_price)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px 16px', display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: `1px solid ${C.cardBorder}` }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Supplier Total:</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: C.text }}>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            );
          })}

          {/* Write-off group */}
          {writeOffItems.length > 0 && (
            <div style={{ border: `1px solid rgba(245,158,11,0.15)`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ backgroundColor: 'rgba(245,158,11,0.07)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trash2 style={{ width: 15, height: 15, color: C.amber }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: C.amberLight }}>Stock Write-Off</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: C.amber, backgroundColor: 'rgba(245,158,11,0.12)', padding: '3px 10px', borderRadius: 99 }}>No Supplier</span>
              </div>
              <div style={{ padding: '10px 16px', backgroundColor: 'rgba(245,158,11,0.04)', borderTop: `1px solid rgba(245,158,11,0.1)` }}>
                <p style={{ margin: 0, fontSize: 11, color: C.amber, fontWeight: 600 }}>
                  These batches were not linked to a purchase. Stock will be written off without a supplier credit note.
                </p>
              </div>
              {writeOffItems.map(item => {
                const qty = returnQty[item.batch_id] ?? 0;
                return (
                  <div key={item.batch_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: `1px solid ${C.cardBorder}` }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{item.medicine_name}</p>
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: C.muted }}>
                        Batch <span style={{ fontFamily: 'monospace', color: C.subtle }}>{item.batch_number}</span>
                        {' · '}Exp: <span style={{ color: item.is_expired ? C.rose : C.orange, fontWeight: 700 }}>{item.expiry_date}</span>
                        {' · '}Avail: <span style={{ color: C.subtle, fontWeight: 700 }}>{item.stock_quantity} units</span>
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => adjustQty(item.batch_id, item.stock_quantity, -1)} disabled={qty <= 0}
                        style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${C.cardBorder}`, color: C.text, cursor: qty <= 0 ? 'not-allowed' : 'pointer', opacity: qty <= 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>−</button>
                      <input type="number" min={0} max={item.stock_quantity}
                        value={qty || ''}
                        onChange={e => {
                          const v = Math.min(Math.max(parseInt(e.target.value) || 0, 0), item.stock_quantity);
                          setReturnQty(prev => ({ ...prev, [item.batch_id]: v }));
                        }}
                        style={inp} />
                      <button onClick={() => adjustQty(item.batch_id, item.stock_quantity, 1)} disabled={qty >= item.stock_quantity}
                        style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${C.cardBorder}`, color: C.text, cursor: qty >= item.stock_quantity ? 'not-allowed' : 'pointer', opacity: qty >= item.stock_quantity ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>+</button>
                    </div>
                    <div style={{ width: 90, textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 11, color: C.muted }}>MRP</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.amber }}>{formatCurrency(qty * item.mrp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${C.cardBorder}`, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {supplierGroups.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: C.muted }}>Subtotal (at purchase rate)</span>
                <span style={{ color: C.subtle, fontWeight: 600 }}>{formatCurrency(grandSubtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: C.muted }}>GST</span>
                <span style={{ color: C.subtle, fontWeight: 600 }}>{formatCurrency(grandGst)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, borderTop: `1px solid ${C.cardBorder}` }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Credit from Supplier</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: '13px 0', border: `1px solid ${C.cardBorder}`, borderRadius: 14, backgroundColor: 'transparent', color: C.subtle, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting || !hasAnyQty}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 0', borderRadius: 14, border: 'none', backgroundColor: (submitting || !hasAnyQty) ? 'rgba(249,115,22,0.3)' : C.orange, color: '#fff', fontSize: 14, fontWeight: 900, cursor: (submitting || !hasAnyQty) ? 'not-allowed' : 'pointer', boxShadow: (submitting || !hasAnyQty) ? 'none' : '0 8px 24px rgba(249,115,22,0.3)', transition: 'all 0.2s ease' }}>
              {submitting ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <RotateCcw style={{ width: 16, height: 16 }} />}
              Process Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Urgency helpers ──────────────────────────────────── */
function urgencyLabel(item: ExpiryItem) {
  if (item.is_expired) return `Expired ${Math.abs(item.days_to_expiry)}d ago`;
  if (item.days_to_expiry <= 7) return `${item.days_to_expiry}d — CRITICAL`;
  if (item.days_to_expiry <= 30) return `${item.days_to_expiry}d — Soon`;
  return `${item.days_to_expiry}d left`;
}
function urgencyColors(item: ExpiryItem): { bg: string; color: string; border: string } {
  if (item.is_expired) return { bg: 'rgba(244,63,94,0.1)', color: C.rose, border: 'rgba(244,63,94,0.25)' };
  if (item.days_to_expiry <= 30) return { bg: 'rgba(249,115,22,0.1)', color: C.orange, border: 'rgba(249,115,22,0.25)' };
  return { bg: 'rgba(245,158,11,0.1)', color: C.amber, border: 'rgba(245,158,11,0.25)' };
}

/* ─── Stat Card ─────────────────────────────────────────── */
function StatCard({ label, value, color, bg, icon: Icon }: { label: string; value: string | number; color: string; bg: string; icon: React.ElementType }) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 18, height: 18, color }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 9.5, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
        <p style={{ margin: '3px 0 0', fontSize: 20, fontWeight: 900, color }}>{value}</p>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function ExpiryReportPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore(s => s.pharmacyId);
  const pharmacyIdRef = useRef(pharmacyId);
  useEffect(() => { pharmacyIdRef.current = pharmacyId; }, [pharmacyId]);

  const [items, setItems] = useState<ExpiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysAhead, setDaysAhead] = useState(90);
  const [search, setSearch] = useState('');
  const [showExpired, setShowExpired] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showReturnModal, setShowReturnModal] = useState(false);

  async function load(days: number) {
    const pid = pharmacyIdRef.current;
    if (!pid) { setLoading(false); return; }
    setLoading(true);
    setSelected(new Set());
    try {
      const today = new Date().toISOString().split('T')[0];
      const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('batches')
        .select(`
          id, medicine_id, batch_number, expiry_date,
          stock_quantity, purchase_price, mrp,
          purchase_item_id,
          medicines!inner(name),
          purchase_items!purchase_item_id(
            id,
            purchases(id, supplier_id, suppliers(id, name))
          )
        `)
        .eq('pharmacy_id', pid)
        .gt('stock_quantity', 0)
        .lte('expiry_date', future)
        .order('expiry_date');

      if (error) throw error;

      const todayMs = new Date(today).getTime();

      setItems(
        (data || []).map((b: any) => {
          const expiryMs = new Date(b.expiry_date).getTime();
          const daysToExpiry = Math.round((expiryMs - todayMs) / (1000 * 60 * 60 * 24));
          const is_expired = daysToExpiry < 0;

          const purchase = b.purchase_items?.purchases;
          const supplier = purchase?.suppliers;

          return {
            batch_id: b.id,
            medicine_id: b.medicine_id,
            medicine_name: b.medicines?.name || 'Unknown',
            batch_number: b.batch_number,
            expiry_date: b.expiry_date,
            days_to_expiry: daysToExpiry,
            is_expired,
            stock_quantity: b.stock_quantity,
            purchase_price: b.purchase_price,
            mrp: b.mrp,
            value_at_mrp: b.stock_quantity * b.mrp,
            purchase_id: purchase?.id ?? null,
            purchase_item_id: b.purchase_item_id ?? null,
            supplier_id: supplier?.id ?? null,
            supplier_name: supplier?.name ?? null,
          } as ExpiryItem;
        })
      );
    } catch (err: any) {
      console.error('Expiry report load error:', err?.message || err?.details || err?.hint || err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pharmacyId) load(daysAhead);
    else setLoading(false);
  }, [pharmacyId]);

  useEffect(() => {
    if (pharmacyId) load(daysAhead);
  }, [daysAhead]);

  const filtered = useMemo(() => {
    let list = items;
    if (!showExpired) list = list.filter(i => !i.is_expired);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.medicine_name.toLowerCase().includes(q) ||
        i.batch_number.toLowerCase().includes(q) ||
        (i.supplier_name?.toLowerCase().includes(q) ?? false)
      );
    }
    return [...list].sort((a, b) => a.days_to_expiry - b.days_to_expiry);
  }, [items, search, showExpired]);

  const expiredItems = items.filter(i => i.is_expired);
  const soonItems = items.filter(i => !i.is_expired);
  const totalLoss = expiredItems.reduce((s, i) => s + i.value_at_mrp, 0);

  const allSelected = filtered.length > 0 && filtered.every(i => selected.has(i.batch_id));

  function toggleSelect(batchId: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(batchId) ? next.delete(batchId) : next.add(batchId);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map(i => i.batch_id)));
  }

  const selectedItems = filtered.filter(i => selected.has(i.batch_id));
  const supplierGroups = groupBySupplier(selectedItems);
  const writeOffItems = selectedItems.filter(i => !i.supplier_id || !i.purchase_id);
  const canOpenModal = supplierGroups.length > 0 || writeOffItems.length > 0;

  /* ── Day filter chips ─────────────────────────────────── */
  const DAY_CHIPS = [30, 60, 90, 180];

  const thChip: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.15s ease', border: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button onClick={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft style={{ width: 18, height: 18, color: C.muted }} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle style={{ width: 20, height: 20, color: C.orange }} />
            Expiry Report
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>
            Batches nearing or past expiry · Select to return / write-off
          </p>
        </div>
        {selected.size > 0 && (
          <button onClick={() => setShowReturnModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', backgroundColor: C.orange, border: 'none', borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 20px rgba(249,115,22,0.35)', transition: 'all 0.2s ease' }}>
            <RotateCcw style={{ width: 16, height: 16 }} />
            Process {selected.size} Selected
          </button>
        )}
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard label="Total Batches" value={loading ? '—' : items.length} color={C.text} bg="rgba(255,255,255,0.06)" icon={Package} />
        <StatCard label="Expired" value={loading ? '—' : expiredItems.length} color={C.rose} bg="rgba(244,63,94,0.1)" icon={X} />
        <StatCard label={`Expiring ≤ ${daysAhead}d`} value={loading ? '—' : soonItems.length} color={C.orange} bg="rgba(249,115,22,0.1)" icon={AlertTriangle} />
        <StatCard label="Loss Value (MRP)" value={loading ? '—' : formatCurrency(totalLoss)} color={C.roseLight} bg="rgba(244,63,94,0.1)" icon={AlertTriangle} />
      </div>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Day chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4, border: `1px solid ${C.cardBorder}` }}>
          {DAY_CHIPS.map(d => (
            <button key={d} onClick={() => setDaysAhead(d)}
              style={{
                ...thChip,
                backgroundColor: daysAhead === d ? C.orange : 'transparent',
                color: daysAhead === d ? '#fff' : C.muted,
                boxShadow: daysAhead === d ? '0 4px 12px rgba(249,115,22,0.3)' : 'none',
              }}>
              {d}d
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: C.muted }} />
          <input
            type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Medicine, batch, or supplier…"
            style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, backgroundColor: C.input, border: `1.5px solid ${C.inputBorder}`, borderRadius: 12, color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          />
        </div>

        {/* Include expired toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: C.subtle, cursor: 'pointer' }}>
          <input type="checkbox" checked={showExpired} onChange={e => setShowExpired(e.target.checked)}
            style={{ width: 15, height: 15, accentColor: C.rose, cursor: 'pointer' }} />
          Include expired
        </label>
      </div>

      {/* ── Table / States ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(249,115,22,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 style={{ width: 22, height: 22, color: C.orange, animation: 'spin 1s linear infinite' }} />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, fontWeight: 500 }}>Scanning inventory…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ backgroundColor: C.card, border: `2px dashed ${C.cardBorder}`, borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 32px', gap: 14 }}>
          <AlertTriangle style={{ width: 36, height: 36, color: 'rgba(255,255,255,0.08)' }} />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.muted }}>No expiry alerts in this window</p>
        </div>
      ) : (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '40px minmax(160px,2fr) 110px 120px 1fr 90px 90px 100px 120px', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.015)' }}>
            {/* Select all */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={toggleAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 0 }}>
                {allSelected
                  ? <CheckSquare style={{ width: 16, height: 16, color: C.orange }} />
                  : <Square style={{ width: 16, height: 16 }} />}
              </button>
            </div>
            {['Medicine', 'Batch', 'Supplier', 'Expiry Date', 'Qty', 'Pur. Rate', 'Value (MRP)', 'Status'].map(h => (
              <p key={h} style={{ margin: 0, fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>{h}</p>
            ))}
          </div>

          {/* Rows */}
          <div>
            {filtered.map((item, idx) => {
              const isSelected = selected.has(item.batch_id);
              const uc = urgencyColors(item);
              return (
                <div key={item.batch_id}
                  onClick={() => toggleSelect(item.batch_id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '40px minmax(160px,2fr) 110px 120px 1fr 90px 90px 100px 120px',
                    alignItems: 'center', padding: '14px 16px',
                    borderBottom: idx < filtered.length - 1 ? `1px solid ${C.cardBorder}` : 'none',
                    backgroundColor: isSelected ? 'rgba(249,115,22,0.04)' : 'transparent',
                    cursor: 'pointer', transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = isSelected ? 'rgba(249,115,22,0.04)' : 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleSelect(item.batch_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                      {isSelected
                        ? <CheckSquare style={{ width: 16, height: 16, color: C.orange }} />
                        : <Square style={{ width: 16, height: 16, color: C.muted }} />}
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>{item.medicine_name}</p>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.muted, fontFamily: 'monospace' }}>{item.batch_number}</p>
                  <div>
                    {item.supplier_id ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: C.indigoLight }}>
                        <Truck style={{ width: 12, height: 12 }} />
                        {item.supplier_name}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: C.amber, fontStyle: 'italic', fontWeight: 600 }}>Write-off</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: item.is_expired ? C.rose : C.orange }}>{item.expiry_date}</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>{item.stock_quantity}</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{item.purchase_price > 0 ? formatCurrency(item.purchase_price) : '—'}</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.roseLight }}>{formatCurrency(item.value_at_mrp)}</p>
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, backgroundColor: uc.bg, color: uc.color, border: `1px solid ${uc.border}` }}>
                      <AlertTriangle style={{ width: 9, height: 9 }} />
                      {urgencyLabel(item)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && pharmacyId && canOpenModal && (
        <ReturnModal
          supplierGroups={supplierGroups}
          writeOffItems={writeOffItems}
          pharmacyId={pharmacyId}
          onClose={() => setShowReturnModal(false)}
          onSuccess={() => {
            setShowReturnModal(false);
            setSelected(new Set());
            load(daysAhead);
          }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
