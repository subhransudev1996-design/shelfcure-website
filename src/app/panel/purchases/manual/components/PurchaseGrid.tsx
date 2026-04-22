"use client";

import { Trash2, Search, Check, Plus, Package } from 'lucide-react';
import { PurchaseLineItem } from './types';
import { useState } from 'react';
import toast from 'react-hot-toast';

const C = {
  bg: '#020617',          
  card: '#0B1121',        
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc', 
  muted: '#94a3b8',
  primary: '#8b5cf6',     
  danger: '#ef4444',
  success: '#10b981',
  inputBg: 'rgba(255,255,255,0.02)',
};

const mockMedicines = [
  { id: '1', name: 'Dolo 650', barcode: '123456789', manufacturer: 'Micro Labs', sale_unit_mode: 'pack_only', units_per_pack: 1 },
  { id: '2', name: 'Paracetamol 500mg', barcode: '987654321', manufacturer: 'Generic', sale_unit_mode: 'both', units_per_pack: 10 },
  { id: '3', name: 'Amoxicillin 250mg', barcode: '456123789', manufacturer: 'Cipla', sale_unit_mode: 'pack_only', units_per_pack: 1 },
];

interface Props {
  lines: PurchaseLineItem[];
  onAddLine: (item: PurchaseLineItem) => void;
  onRemoveLine: (id: string) => void;
}

const emptyItem = (): PurchaseLineItem => ({
  id: crypto.randomUUID(),
  medicine_id: null,
  medicine_name: '', 
  batch_number: '', 
  expiry_date: '', 
  quantity: 0, 
  free_quantity: 0, 
  purchase_rate: 0, 
  mrp: 0, 
  selling_price: 0,
  gst_percentage: 12, 
  discount_percentage: 0,
  sale_unit_mode: 'pack_only',
  units_per_pack: 1,
  barcode: '',
  original_barcode: ''
});

export function PurchaseGrid({ lines, onAddLine, onRemoveLine }: Props) {
  const [form, setForm] = useState<PurchaseLineItem>(emptyItem());
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLink = (med: any) => {
    setForm(prev => ({
      ...prev,
      medicine_id: med.id,
      medicine_name: med.name,
      barcode: med.barcode,
      sale_unit_mode: med.sale_unit_mode,
      units_per_pack: med.units_per_pack
    }));
    setSearchOpen(false);
  };

  const lineAmount = (l: PurchaseLineItem) => {
    const base = l.purchase_rate * l.quantity;
    return base - (base * l.discount_percentage) / 100;
  };

  const handleAdd = () => {
    if (!form.medicine_name.trim()) {
      toast.error("Please enter or select a medicine name.");
      return;
    }
    if (form.quantity <= 0) {
      toast.error("Quantity must be greater than 0.");
      return;
    }
    if (form.purchase_rate <= 0) {
      toast.error("Please enter a valid purchase rate.");
      return;
    }

    onAddLine({ ...form, id: crypto.randomUUID() });
    setForm(emptyItem());
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${C.cardBorder}`,
    backgroundColor: C.inputBg,
    color: C.text,
    fontSize: 13,
    outline: 'none',
    transition: 'all 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: C.muted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── ENTRY FORM ── */}
      <div style={{ 
        backgroundColor: C.card,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: 16,
        padding: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ padding: 6, backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: 8 }}>
            <Plus size={16} color={C.primary} />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>Add Item to Invoice</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Row 1: Product & Barcode */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>Product Name</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  {form.medicine_id ? <Check size={16} color={C.success} /> : <Search size={16} color={C.muted} />}
                </div>
                <input 
                  value={form.medicine_name} 
                  onChange={e => {
                    setForm(prev => ({ ...prev, medicine_name: e.target.value, medicine_id: null }));
                    if (e.target.value.length > 1) setSearchOpen(true);
                  }} 
                  onFocus={() => { if (form.medicine_name.length > 1) setSearchOpen(true); }}
                  placeholder="Search for a medicine..." 
                  style={{ 
                    ...inputStyle, 
                    paddingLeft: 36, 
                    borderColor: form.medicine_id ? 'rgba(16, 185, 129, 0.3)' : (form.medicine_name ? C.cardBorder : 'rgba(245, 158, 11, 0.3)'), 
                  }} 
                />
                {searchOpen && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: 4, backgroundColor: '#0f172a', border: `1px solid ${C.cardBorder}`, borderRadius: 8, overflow: 'hidden', zIndex: 50, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
                    {mockMedicines.map(m => (
                      <div 
                        key={m.id} 
                        onClick={() => handleLink(m)}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div>
                          <div style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{m.manufacturer}</div>
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                          {m.sale_unit_mode === 'pack_only' ? 'Pack' : 'Loose'}
                        </div>
                      </div>
                    ))}
                    <div 
                      onClick={() => setSearchOpen(false)}
                      style={{ padding: '8px', textAlign: 'center', fontSize: 12, color: C.primary, cursor: 'pointer', fontWeight: 600, backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
                    >
                      + Add "{form.medicine_name}" as New
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Barcode</label>
              <input 
                value={form.barcode} 
                onChange={e => setForm(prev => ({ ...prev, barcode: e.target.value }))} 
                placeholder="Scan or type" 
                style={inputStyle} 
              />
            </div>
          </div>

          {/* Row 2: Batch, Expiry, Qty, Free */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Batch No.</label>
              <input 
                value={form.batch_number} 
                onChange={e => setForm(prev => ({ ...prev, batch_number: e.target.value.toUpperCase() }))} 
                placeholder="e.g. BATCH123" 
                style={inputStyle} 
              />
            </div>
            <div>
              <label style={labelStyle}>Expiry (MM/YYYY)</label>
              <input 
                type="month" 
                value={form.expiry_date?.slice(0, 7) || ''} 
                onChange={e => setForm(prev => ({ ...prev, expiry_date: e.target.value ? `${e.target.value}-01` : '' }))} 
                style={{ ...inputStyle, colorScheme: 'dark' }} 
              />
            </div>
            <div>
              <label style={labelStyle}>Quantity</label>
              <input 
                type="number" 
                min="0"
                value={form.quantity || ''} 
                onChange={e => { const val = parseInt(e.target.value); setForm(prev => ({ ...prev, quantity: isNaN(val) ? 0 : val })); }} 
                placeholder="0"
                style={inputStyle} 
              />
            </div>
            <div>
              <label style={labelStyle}>Free Qty</label>
              <input 
                type="number" 
                min="0"
                value={form.free_quantity || ''} 
                onChange={e => { const val = parseInt(e.target.value); setForm(prev => ({ ...prev, free_quantity: isNaN(val) ? 0 : val })); }} 
                placeholder="0"
                style={inputStyle} 
              />
            </div>
          </div>

          {/* Row 3: Rates & Pricing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>PTR (₹)</label>
              <input 
                type="number" step="0.01" min="0"
                value={form.purchase_rate || ''} 
                onChange={e => { const val = parseFloat(e.target.value); setForm(prev => ({ ...prev, purchase_rate: isNaN(val) ? 0 : val })); }} 
                placeholder="0.00" style={inputStyle} 
              />
            </div>
            <div>
              <label style={labelStyle}>MRP (₹)</label>
              <input 
                type="number" step="0.01" min="0"
                value={form.mrp || ''} 
                onChange={e => { const val = parseFloat(e.target.value); setForm(prev => ({ ...prev, mrp: isNaN(val) ? 0 : val })); }} 
                placeholder="0.00" style={inputStyle} 
              />
            </div>
            <div>
              <label style={labelStyle}>Sell Price (₹)</label>
              <input 
                type="number" step="0.01" min="0"
                value={form.selling_price || ''} 
                onChange={e => { const val = parseFloat(e.target.value); setForm(prev => ({ ...prev, selling_price: isNaN(val) ? 0 : val })); }} 
                placeholder="0.00" style={inputStyle} 
              />
            </div>
            <div>
              <label style={labelStyle}>GST %</label>
              <input 
                type="number" step="0.01" min="0" max="100"
                value={form.gst_percentage || ''} 
                onChange={e => { const val = parseFloat(e.target.value); setForm(prev => ({ ...prev, gst_percentage: isNaN(val) ? 0 : val })); }} 
                placeholder="12" style={inputStyle} 
              />
            </div>
            <div>
              <label style={labelStyle}>Discount %</label>
              <input 
                type="number" step="0.01" min="0" max="100"
                value={form.discount_percentage || ''} 
                onChange={e => { const val = parseFloat(e.target.value); setForm(prev => ({ ...prev, discount_percentage: isNaN(val) ? 0 : val })); }} 
                placeholder="0" style={inputStyle} 
              />
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <button 
              onClick={handleAdd}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                color: C.primary,
                border: `1px solid rgba(139, 92, 246, 0.2)`,
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.15)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)'}
            >
              <Check size={16} /> Add to Invoice
            </button>
          </div>
        </div>
      </div>

      {/* ── ADDED ITEMS LIST ── */}
      <div>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Added Items
          <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 999, fontSize: 11 }}>
            {lines.filter(l => l.medicine_name).length} items
          </span>
        </h3>

        {lines.filter(l => l.medicine_name).length === 0 ? (
          <div style={{ 
            padding: 40, 
            textAlign: 'center', 
            backgroundColor: 'rgba(255,255,255,0.01)', 
            border: `1px dashed ${C.cardBorder}`, 
            borderRadius: 12 
          }}>
            <Package size={32} color={C.muted} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ margin: 0, color: C.muted, fontSize: 14, fontWeight: 500 }}>No items added yet.</p>
            <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 12 }}>Fill the form above to add medicines to this invoice.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lines.filter(l => l.medicine_name).map((l, idx) => (
              <div key={l.id} style={{ 
                backgroundColor: C.card,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: 12,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>{idx + 1}.</span>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text }}>{l.medicine_name}</h4>
                    {!l.medicine_id && (
                      <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>NEW</span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px', fontSize: 12, color: C.muted, marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 6 }}><span style={{ fontWeight: 600 }}>Batch:</span> <span style={{ color: C.text }}>{l.batch_number || 'N/A'}</span></div>
                    <div style={{ display: 'flex', gap: 6 }}><span style={{ fontWeight: 600 }}>Exp:</span> <span style={{ color: C.text }}>{l.expiry_date ? l.expiry_date.slice(0,7) : 'N/A'}</span></div>
                    <div style={{ display: 'flex', gap: 6 }}><span style={{ fontWeight: 600 }}>Qty:</span> <span style={{ color: C.text }}>{l.quantity}</span> {l.free_quantity > 0 && <span style={{ color: C.success }}>(+{l.free_quantity} Free)</span>}</div>
                    <div style={{ display: 'flex', gap: 6 }}><span style={{ fontWeight: 600 }}>PTR:</span> <span style={{ color: C.text }}>₹{l.purchase_rate.toFixed(2)}</span></div>
                    <div style={{ display: 'flex', gap: 6 }}><span style={{ fontWeight: 600 }}>MRP:</span> <span style={{ color: C.text }}>₹{l.mrp.toFixed(2)}</span></div>
                    <div style={{ display: 'flex', gap: 6 }}><span style={{ fontWeight: 600 }}>GST:</span> <span style={{ color: C.text }}>{l.gst_percentage}%</span></div>
                    {l.discount_percentage > 0 && <div style={{ display: 'flex', gap: 6 }}><span style={{ fontWeight: 600 }}>Disc:</span> <span style={{ color: C.success }}>{l.discount_percentage}%</span></div>}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.primary }}>
                    ₹{lineAmount(l).toFixed(2)}
                  </div>
                  <button 
                    onClick={() => onRemoveLine(l.id)} 
                    style={{ 
                      padding: '6px 10px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 4,
                      backgroundColor: 'transparent', 
                      border: `1px solid rgba(239, 68, 68, 0.2)`, 
                      color: C.danger, 
                      borderRadius: 6, 
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }} 
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} 
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
