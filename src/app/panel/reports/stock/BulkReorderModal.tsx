'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, CheckCircle2, ChevronRight, Share2, Printer, Loader2 } from 'lucide-react';

export interface StockSummaryItem {
  medicine_id: number;
  medicine_name: string;
  batch_count: number;
  total_quantity: number;
  stock_value: number;
  min_stock_level: number;
  is_low_stock: boolean;
  nearest_expiry: string | null;
  days_to_expiry: number | null;
}

interface Supplier { id: number; name: string; phone: string | null; }

interface Props {
  pharmacyId: string;
  pharmacyName: string;
  selectedItems: StockSummaryItem[];
  onClose: () => void;
  onSuccess: () => void;
  onClearSelection: () => void;
}

/* ─── Palette ────────────────────────────────────────── */
const C = {
  bg: '#060914', card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.07)',
  text: '#f1f5f9', muted: '#475569', subtle: '#94a3b8',
  indigo: '#6366f1', indigoLight: '#818cf8',
  emerald: '#10b981', emeraldLight: '#34d399',
  input: '#0d1127', inputBorder: 'rgba(255,255,255,0.1)',
};

export default function BulkReorderModal({ pharmacyId, pharmacyName, selectedItems, onClose, onSuccess, onClearSelection }: Props) {
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    selectedItems.forEach(item => {
      const diff = item.min_stock_level - item.total_quantity;
      init[item.medicine_id] = diff > 0 ? diff : 10;
    });
    return init;
  });

  useEffect(() => {
    supabase.from('suppliers').select('id, name, phone')
      .eq('pharmacy_id', pharmacyId).eq('is_active', true)
      .then(({ data }) => setSuppliers(data || []))
      .catch(console.error)
      .finally(() => setLoadingSuppliers(false));
  }, [pharmacyId]);

  const handleQtyChange = (id: number, val: string) => {
    const num = parseInt(val, 10);
    setQuantities(prev => ({ ...prev, [id]: isNaN(num) || num < 1 ? 1 : num }));
  };

  const handleConfirm = async () => {
    if (!selectedSupplierId) return;
    setSaving(true);
    try {
      const { data: po, error: poErr } = await supabase
        .from('purchase_orders')
        .insert({ pharmacy_id: pharmacyId, supplier_id: selectedSupplierId, status: 'pending' })
        .select('id').single();
      if (poErr || !po) throw poErr;

      const items = selectedItems.map(item => ({
        purchase_order_id: po.id,
        medicine_id: item.medicine_id,
        requested_quantity: quantities[item.medicine_id],
        pharmacy_id: pharmacyId,
      }));
      const { error: itemErr } = await supabase.from('purchase_order_items').insert(items);
      if (itemErr) throw itemErr;
      setDone(true);
    } catch (e) {
      console.error(e);
      alert('Failed to create Purchase Order');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    const supplier = suppliers.find(s => s.id === Number(selectedSupplierId));
    let text = `*Purchase Order Request*\nFrom: ${pharmacyName}\nTo: ${supplier?.name || 'Supplier'}\n\n`;
    selectedItems.forEach((item, i) => {
      text += `${i + 1}. ${item.medicine_name} - ${quantities[item.medicine_id]} Units\n`;
    });
    const phone = supplier?.phone?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    onSuccess();
    onClearSelection();
  };

  const handlePrint = () => {
    const supplier = suppliers.find(s => s.id === Number(selectedSupplierId));
    const rows = selectedItems.map((item, i) =>
      `<tr><td>${i + 1}</td><td>${item.medicine_name}</td><td style="text-align:center">${quantities[item.medicine_id]}</td><td>Units</td></tr>`
    ).join('');
    const html = `
      <html><head><title>Purchase Order</title><style>
        body{font-family:sans-serif;padding:32px;color:#1e293b}
        h1{font-size:22px;font-weight:900;margin:0}
        p{margin:4px 0;font-size:13px;color:#64748b}
        table{width:100%;border-collapse:collapse;margin-top:24px}
        th{background:#f1f5f9;text-align:left;padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
        td{padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px}
        .badge{display:inline-block;background:#eef2ff;color:#4f46e5;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:700;margin-top:8px}
      </style></head><body>
        <h1>${pharmacyName}</h1>
        <p class="badge">Purchase Order Request</p>
        <p style="margin-top:16px"><strong>To:</strong> ${supplier?.name || '—'}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        <table><thead><tr><th>Sn</th><th>Medicine</th><th style="text-align:center">Qty</th><th>Unit</th></tr></thead>
        <tbody>${rows}</tbody></table>
        <p style="margin-top:32px;font-size:11px;color:#94a3b8">This is a purchase request only. Generated by ShelfCure.</p>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
    onSuccess();
    onClearSelection();
  };

  const inp: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    backgroundColor: C.input, border: `1.5px solid ${C.inputBorder}`,
    borderRadius: 12, padding: '10px 14px', color: C.text,
    fontSize: 13, fontWeight: 600, fontFamily: 'inherit', outline: 'none',
  };

  if (done) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 24, padding: 40, maxWidth: 380, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <CheckCircle2 style={{ width: 30, height: 30, color: C.emerald }} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: C.text }}>Request Saved!</h2>
          <p style={{ margin: '0 0 28px', fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            The purchase order has been added to Pending Requests.
          </p>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={handlePrint}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#18181b', color: C.text, border: 'none', borderRadius: 14, padding: '14px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              <Printer style={{ width: 16, height: 16 }} /> Print Request
            </button>
            <button onClick={handleShare}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(34,197,94,0.1)', color: C.emeraldLight, border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: '14px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              <Share2 style={{ width: 16, height: 16 }} /> Share via WhatsApp
            </button>
            <button onClick={() => { onSuccess(); onClearSelection(); }}
              style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '10px 0' }}>
              Done for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', overflowY: 'auto' }}>
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 24, width: '100%', maxWidth: 760, boxShadow: '0 24px 60px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', margin: 'auto' }}>

        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}>
          <X style={{ width: 16, height: 16, color: C.muted }} />
        </button>

        {/* Header */}
        <div style={{ padding: '28px 32px 24px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.text }}>Bulk Reorder Request</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: C.muted }}>
            Review {selectedItems.length} selected medicines and set request quantities.
          </p>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 0 }}>
          {/* Item list */}
          <div style={{ flex: 1, padding: '24px 28px', maxHeight: '55vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedItems.map(item => (
                <div key={item.medicine_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: '14px 18px' }}>
                  <div style={{ flex: 1, paddingRight: 16 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{item.medicine_name}</p>
                    <div style={{ display: 'flex', gap: 16, marginTop: 5 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>Stock: <strong style={{ color: C.subtle }}>{item.total_quantity}</strong></span>
                      <span style={{ fontSize: 11, color: C.muted }}>Min: <strong style={{ color: C.subtle }}>{item.min_stock_level}</strong></span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <input
                      type="number" min={1}
                      value={quantities[item.medicine_id] || ''}
                      onChange={e => handleQtyChange(item.medicine_id, e.target.value)}
                      style={{ ...inp, width: 90, textAlign: 'center', fontSize: 16, fontWeight: 900, border: `2px solid rgba(99,102,241,0.2)`, padding: '8px 10px' }}
                    />
                    <span style={{ fontSize: 9, fontWeight: 800, color: C.indigo, textTransform: 'uppercase', letterSpacing: '0.08em' }}>units</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ width: 300, flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.02)', borderLeft: `1px solid ${C.cardBorder}`, padding: '24px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 9.5, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Select Supplier</label>
                {loadingSuppliers ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                    <Loader2 style={{ width: 18, height: 18, color: C.muted, animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : (
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value ? Number(e.target.value) : '')}
                    style={{ ...inp, cursor: 'pointer', colorScheme: 'dark' as any }}
                  >
                    <option value="" disabled>— Choose Supplier —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>

              <div style={{ backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ margin: 0, fontSize: 12, color: C.subtle, lineHeight: 1.6 }}>
                  This will create a draft <strong style={{ color: C.indigoLight }}>Purchase Order</strong>. When the supplier delivers, you can convert it directly to an invoice.
                </p>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!selectedSupplierId || saving}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: (!selectedSupplierId || saving) ? 'rgba(99,102,241,0.3)' : C.indigo,
                color: '#fff', border: 'none', borderRadius: 14, padding: '15px 0',
                fontSize: 15, fontWeight: 900, cursor: (!selectedSupplierId || saving) ? 'not-allowed' : 'pointer',
                boxShadow: (!selectedSupplierId || saving) ? 'none' : '0 8px 20px rgba(99,102,241,0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              {saving ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> : <>Save &amp; Continue <ChevronRight style={{ width: 18, height: 18 }} /></>}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
