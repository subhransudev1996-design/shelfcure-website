'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import {
  Search, ChevronLeft, Loader2, Minus, Plus,
  RotateCcw, PackageSearch, AlertCircle, CheckCircle2, ArrowRight,
  CheckSquare, XSquare, IndianRupee,
} from 'lucide-react';

const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569',
  indigo: '#6366f1', orange: '#f97316', rose: '#f43f5e',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

interface ReturnQtyMap { [itemId: string]: number; }

export default function NewPurchaseReturnPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [billInput, setBillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [returnQty, setReturnQty] = useState<ReturnQtyMap>({});

  async function handleSearch(billOverride?: string) {
    const bill = (billOverride ?? billInput).trim();
    if (!bill || !pharmacyId) return;
    setLoading(true); setError(null); setPurchase(null); setItems([]); setReturnQty({});
    try {
      const { data: pur } = await supabase
        .from('purchases')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .ilike('bill_number', bill)
        .maybeSingle();
      if (!pur) { setError('Purchase invoice not found.'); return; }
      setPurchase(pur);

      const { data: pItems } = await supabase
        .from('purchase_items')
        .select('*')
        .eq('purchase_id', pur.id);

      const enriched: any[] = [];
      for (const pi of (pItems || [])) {
        const { data: med } = await supabase.from('medicines').select('name, sale_unit_mode, pack_size').eq('id', pi.medicine_id).maybeSingle();
        const { data: batch } = await supabase.from('batches').select('id, current_quantity, received_quantity').eq('pharmacy_id', pharmacyId).eq('medicine_id', pi.medicine_id).eq('batch_number', pi.batch_number || '').maybeSingle();
        
        // Check already returned qty for this purchase item
        const { data: retItems } = await supabase.from('purchase_return_items').select('quantity').eq('purchase_item_id', pi.id);
        const alreadyReturned = (retItems || []).reduce((s: number, r: any) => s + (r.quantity || 0), 0);

        enriched.push({
          ...pi,
          medicine_name: med?.name || `Medicine #${pi.medicine_id?.slice(0, 8)}`,
          sale_unit_mode: med?.sale_unit_mode || 'pack_only',
          units_per_pack: med?.pack_size || 1,
          batch_id: batch?.id || null,
          batch_current_quantity: batch?.current_quantity || 0,
          returned_quantity: alreadyReturned,
        });
      }
      setItems(enriched);
    } catch (e: any) {
      setError(e?.message || 'Failed to search.');
    } finally {
      setLoading(false);
    }
  }

  function getUpp(item: any) {
    return item.sale_unit_mode === 'both' && (item.units_per_pack ?? 1) > 1 ? (item.units_per_pack ?? 1) : 1;
  }
  function getTotalReceived(item: any) {
    return Math.floor(((item.quantity || 0) + (item.free_quantity || 0)) / getUpp(item));
  }
  function getMaxReturnable(item: any) {
    const upp = getUpp(item);
    const notYetReturned = getTotalReceived(item) - Math.floor((item.returned_quantity || 0) / upp);
    const currentInStock = Math.floor((item.batch_current_quantity || 0) / upp);
    return Math.max(0, Math.min(notYetReturned, currentInStock));
  }
  function adjustQty(item: any, delta: number) {
    const current = returnQty[item.id] ?? 0;
    const next = Math.min(Math.max(current + delta, 0), getMaxReturnable(item));
    setReturnQty(prev => ({ ...prev, [item.id]: next }));
  }
  function returnAllItems() {
    const map: ReturnQtyMap = {};
    for (const item of items) { const max = getMaxReturnable(item); if (max > 0) map[item.id] = max; }
    setReturnQty(map);
  }

  const selectedItems = items.filter(i => (returnQty[i.id] ?? 0) > 0);
  const hasSelection = selectedItems.length > 0;
  const returningTotal = selectedItems.reduce((s, item) => {
    const totalReceived = getTotalReceived(item);
    const unitRate = totalReceived > 0 ? ((item.purchase_rate || 0) * (item.quantity || 0) / totalReceived) : 0;
    return s + unitRate * (returnQty[item.id] ?? 0);
  }, 0);

  async function handleSubmit() {
    if (!purchase || !pharmacyId || !hasSelection) return;
    setSubmitting(true);
    try {
      const returnNumber = `PR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
      const { data: retRecord, error: retErr } = await supabase
        .from('purchase_returns')
        .insert({
          pharmacy_id: pharmacyId,
          supplier_id: purchase.supplier_id || null,
          return_number: returnNumber,
          bill_number: purchase.bill_number,
          return_date: new Date().toISOString(),
          total_amount: returningTotal,
          item_count: selectedItems.length,
          reason: 'Standard Return',
        })
        .select('id')
        .single();
      if (retErr) throw retErr;

      for (const item of selectedItems) {
        const uiQty = returnQty[item.id] ?? 0;
        const rawQty = uiQty * getUpp(item);
        const totalReceived = getTotalReceived(item);
        const unitRate = totalReceived > 0 ? ((item.purchase_rate || 0) * (item.quantity || 0) / totalReceived) : 0;

        await supabase.from('purchase_return_items').insert({
          purchase_return_id: retRecord.id,
          purchase_item_id: item.id,
          medicine_id: item.medicine_id,
          quantity: rawQty,
          total_amount: unitRate * uiQty,
        });

        if (item.batch_id) {
          const newQty = Math.max(0, (item.batch_current_quantity || 0) - rawQty);
          await supabase.from('batches').update({ current_quantity: newQty }).eq('id', item.batch_id);
          await supabase.from('inventory_transactions').insert({
            pharmacy_id: pharmacyId, batch_id: item.batch_id, medicine_id: item.medicine_id,
            transaction_type: 'adjustment', reference_type: 'purchase_return',
            reference_id: retRecord.id, quantity_change: -rawQty, quantity_after: newQty,
          });
        }
      }

      toast.success(`Return processed! ${formatCurrency(returningTotal)} credited.`);
      router.push('/panel/purchases/returns');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to process return.');
    } finally {
      setSubmitting(false);
    }
  }

  const sty = {
    btn: (bg: string): React.CSSProperties => ({ padding: '8px 14px', borderRadius: 10, border: 'none', background: bg, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }),
    stepper: (disabled: boolean): React.CSSProperties => ({ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.3 : 1, color: C.text, transition: 'all 0.15s' }),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => router.push('/panel/purchases/returns')} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.text }}>Purchase Return</h1>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>Return goods to supplier by searching the purchase invoice</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 20 }}>
        <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Purchase Invoice Number</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ width: 14, height: 14, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input type="text" value={billInput} onChange={e => setBillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Enter bill number…"
              style={{ width: '100%', padding: '12px 14px 12px 36px', borderRadius: 12, border: `1px solid ${C.inputBorder}`, backgroundColor: C.input, color: C.text, fontSize: 13, fontWeight: 600, fontFamily: 'monospace', outline: 'none' }}
              onFocus={e => e.currentTarget.style.borderColor = C.indigo + '60'}
              onBlur={e => e.currentTarget.style.borderColor = C.inputBorder}
            />
          </div>
          <button onClick={() => handleSearch()} disabled={loading || !billInput.trim()} style={{ ...sty.btn(C.indigo), opacity: loading || !billInput.trim() ? 0.5 : 1, padding: '12px 20px' }}>
            {loading ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <ArrowRight style={{ width: 14, height: 14 }} />}
            Search
          </button>
        </div>
        {error && <p style={{ margin: '10px 0 0', fontSize: 12, color: C.rose, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle style={{ width: 13, height: 13 }} />{error}</p>}
      </div>

      {/* Invoice header */}
      {purchase && (
        <div style={{ background: `linear-gradient(135deg, ${C.indigo}15, ${C.indigo}05)`, border: `1px solid ${C.indigo}25`, borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: C.indigo, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Invoice Found</span>
              {items.length > 0 && items.every(i => getMaxReturnable(i) <= 0) && (
                <span style={{ fontSize: 9, fontWeight: 800, color: C.rose, backgroundColor: C.rose + '18', padding: '2px 8px', borderRadius: 99 }}>FULLY RETURNED</span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.text }}>Bill #{purchase.bill_number}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>{purchase.supplier_name || 'Unknown'} · {formatCurrency(purchase.total_amount || 0)}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: C.indigo + '20', color: C.indigo, fontSize: 11, fontWeight: 800, padding: '6px 12px', borderRadius: 99 }}>
            <CheckCircle2 style={{ width: 13, height: 13 }} />{items.length} items
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 10, color: C.muted }}>
          <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /><span style={{ fontSize: 13 }}>Searching invoice…</span>
        </div>
      ) : !purchase ? (
        <div style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: `2px dashed ${C.cardBorder}`, borderRadius: 20 }}>
          <PackageSearch style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.08)', marginBottom: 14 }} />
          <p style={{ margin: 0, color: C.muted, fontWeight: 700, fontSize: 14 }}>No invoice loaded</p>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>Search a purchase bill number above to get started</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Select items to return ({items.length})</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={returnAllItems} disabled={items.every(i => getMaxReturnable(i) <= 0)} style={{ ...sty.btn(C.orange + '20'), color: C.orange, border: `1px solid ${C.orange}30`, opacity: items.every(i => getMaxReturnable(i) <= 0) ? 0.4 : 1 }}>
                  <CheckSquare style={{ width: 12, height: 12 }} />Return Full Bill
                </button>
                {hasSelection && (
                  <button onClick={() => setReturnQty({})} style={{ ...sty.btn('rgba(255,255,255,0.04)'), color: C.muted, border: `1px solid ${C.cardBorder}` }}>
                    <XSquare style={{ width: 12, height: 12 }} />Clear
                  </button>
                )}
              </div>
            </div>

            {items.map(item => {
              const qty = returnQty[item.id] ?? 0;
              const upp = getUpp(item);
              const maxR = getMaxReturnable(item);
              const fullyReturned = maxR <= 0;
              const totalReceived = getTotalReceived(item);
              const unitRate = totalReceived > 0 ? ((item.purchase_rate || 0) * (item.quantity || 0) / totalReceived) : 0;

              return (
                <div key={item.id} style={{ backgroundColor: C.card, border: `1px solid ${qty > 0 ? C.orange + '40' : C.cardBorder}`, borderRadius: 16, overflow: 'hidden', opacity: fullyReturned ? 0.45 : 1, transition: 'all 0.2s', boxShadow: qty > 0 ? `0 0 0 1px ${C.orange}15` : 'none' }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: 4, flexShrink: 0, backgroundColor: qty > 0 ? C.orange : 'rgba(255,255,255,0.04)' }} />
                    <div style={{ padding: 16, flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                        <div>
                          <h4 style={{ margin: 0, fontWeight: 800, color: C.text, fontSize: 13 }}>{item.medicine_name}</h4>
                          <p style={{ margin: '3px 0 0', fontSize: 11, color: C.muted }}>
                            Batch: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#94a3b8' }}>{item.batch_number || 'N/A'}</span>
                            {' · '}Received: <span style={{ fontWeight: 700 }}>{totalReceived}</span>
                            {(item.returned_quantity || 0) > 0 && <span style={{ color: C.orange, marginLeft: 6 }}>({Math.floor(item.returned_quantity / upp)} returned)</span>}
                          </p>
                          <p style={{ margin: '3px 0 0', fontSize: 10, color: C.muted }}>
                            <span style={{ color: C.indigo, fontWeight: 700 }}>In Stock: {Math.floor((item.batch_current_quantity || 0) / upp)}</span>
                            {' · '}<span>Max: {maxR}</span>
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.text }}>{formatCurrency(unitRate * totalReceived)}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 9, color: C.muted }}>@₹{unitRate.toFixed(2)}/un</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Return Qty:</span>
                          <button onClick={() => adjustQty(item, -1)} disabled={qty === 0 || fullyReturned} style={sty.stepper(qty === 0 || fullyReturned)}><Minus style={{ width: 12, height: 12 }} /></button>
                          <input type="number" min={0} max={maxR} value={qty || ''} placeholder="0" disabled={fullyReturned}
                            onChange={e => { const v = Math.min(Math.max(parseInt(e.target.value) || 0, 0), maxR); setReturnQty(prev => ({ ...prev, [item.id]: v })); }}
                            style={{ width: 50, textAlign: 'center', fontWeight: 900, color: C.text, border: 'none', outline: 'none', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '6px 4px', fontSize: 14 }}
                          />
                          <button onClick={() => adjustQty(item, 1)} disabled={qty >= maxR || fullyReturned} style={sty.stepper(qty >= maxR || fullyReturned)}><Plus style={{ width: 12, height: 12 }} /></button>
                          {fullyReturned && <span style={{ fontSize: 9, fontWeight: 800, color: C.muted, backgroundColor: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 99 }}>FULLY RETURNED</span>}
                        </div>
                        {qty > 0 && (
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.orange }}>{formatCurrency(unitRate * qty)}</p>
                            <p style={{ margin: 0, fontSize: 9, color: C.muted }}>Return value</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 20, position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Return Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.muted }}>Items Selected</span><span style={{ fontWeight: 800, color: C.text }}>{selectedItems.length} of {items.length}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${C.cardBorder}` }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Return</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{formatCurrency(returningTotal)}</span>
                </div>
              </div>
              <button onClick={handleSubmit} disabled={submitting || !hasSelection}
                style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', background: hasSelection ? `linear-gradient(135deg, ${C.orange}, #ea580c)` : 'rgba(255,255,255,0.04)', color: hasSelection ? '#fff' : C.muted, fontSize: 13, fontWeight: 900, cursor: submitting || !hasSelection ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: submitting ? 0.6 : 1, boxShadow: hasSelection ? `0 4px 14px ${C.orange}40` : 'none' }}
              >
                {submitting ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <RotateCcw style={{ width: 14, height: 14 }} />}
                Process Return
              </button>
              {!hasSelection && <p style={{ margin: 0, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.12)' }}>Select return quantities above</p>}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
