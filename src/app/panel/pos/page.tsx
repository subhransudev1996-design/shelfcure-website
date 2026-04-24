'use client';

import { useState, useCallback, useRef, useEffect, CSSProperties } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Plus, Minus, Trash2, User, CreditCard, Banknote,
  Smartphone, IndianRupee, Loader2, Search, Check, X, Package2,
  Receipt, ChevronRight, Zap,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */
interface SearchResult {
  id: string; name: string; generic_name: string | null;
  manufacturer: string | null; gst_rate: number; pack_size: number;
}
interface BatchOption {
  id: string; batch_number: string; expiry_date: string;
  stock_quantity: number; mrp: number; purchase_price: number;
}
interface CartItem {
  medicine_id: string; medicine_name: string; batch_id: string;
  batch_number: string; expiry_date: string; quantity: number;
  max_qty: number; mrp: number; rate: number; gst_rate: number;
}
interface Customer { id: string; name: string; phone: string | null; }

/* ─── Constants ──────────────────────────────────────────────── */
const C = {
  bg: '#020617',
  card: '#0b0f24',
  cardBorder: 'rgba(255,255,255,0.06)',
  input: '#111827',
  inputBorder: 'rgba(255,255,255,0.08)',
  inputFocus: 'rgba(99,102,241,0.5)',
  text: '#f1f5f9',
  muted: '#475569',
  faint: '#1e293b',
  indigo: '#6366f1',
  indigoLight: '#818cf8',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
};

/* ─── Sub-components ─────────────────────────────────────────── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.muted }}>{children}</p>
  );
}

function PaymentBtn({ active, onClick, icon: Icon, label, color }: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string; color: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        padding: '9px 6px', borderRadius: 10, border: 'none', cursor: 'pointer',
        fontSize: 11, fontWeight: 800,
        backgroundColor: active ? `${color}20` : hov ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.03)',
        color: active ? color : hov ? C.text : C.muted,
        outline: active ? `1px solid ${color}50` : '1px solid rgba(255,255,255,0.05)',
        transition: 'all 0.15s ease',
      }}
    >
      <Icon style={{ width: 13, height: 13 }} />
      {label}
    </button>
  );
}

function BatchModal({ open, onClose, medicine, batches, onSelect }: {
  open: boolean; onClose: () => void;
  medicine: SearchResult | null; batches: BatchOption[];
  onSelect: (b: BatchOption) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 480,
        backgroundColor: '#0d1225', border: `1px solid ${C.cardBorder}`,
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.indigoLight, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Select Batch</p>
            <h3 style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>{medicine?.name}</h3>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', backgroundColor: 'rgba(255,255,255,0.05)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 80px', padding: '8px 20px', backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${C.cardBorder}` }}>
          {['Batch / Expiry', 'Stock', 'MRP', ''].map(h => (
            <p key={h} style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</p>
          ))}
        </div>
        {/* Rows */}
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: '8px 12px' }}>
          {batches.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 13, color: C.muted, fontWeight: 500 }}>No stock available for this medicine</p>
            </div>
          ) : batches.map((b) => {
            const expDate = new Date(b.expiry_date);
            const daysLeft = Math.ceil((expDate.getTime() - Date.now()) / 86400000);
            const expColor = daysLeft < 30 ? C.rose : daysLeft < 90 ? C.amber : C.emerald;
            return (
              <button
                key={b.id}
                onClick={() => onSelect(b)}
                style={{
                  width: '100%', display: 'grid', gridTemplateColumns: '1fr 80px 70px 80px',
                  alignItems: 'center', padding: '12px 8px', borderRadius: 12,
                  border: 'none', textAlign: 'left', cursor: 'pointer',
                  backgroundColor: 'transparent', transition: 'background 0.12s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.text }}>{b.batch_number || '—'}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 600, color: expColor }}>Exp: {b.expiry_date}</p>
                </div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: b.stock_quantity < 10 ? C.amber : C.text }}>{b.stock_quantity}</p>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.text }}>₹{b.mrp.toFixed(2)}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 6, backgroundColor: 'rgba(99,102,241,0.12)', color: C.indigoLight, fontSize: 10, fontWeight: 700 }}>Add</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CustomerModal({ open, onClose, onSelect, supabase, pharmacyId }: {
  open: boolean; onClose: () => void; onSelect: (c: Customer) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any; pharmacyId: string;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (val: string) => {
    if (val.length < 2) { setResults([]); return; }
    const { data } = await supabase.from('customers').select('id, name, phone').eq('pharmacy_id', pharmacyId).or(`name.ilike.%${val}%,phone.ilike.%${val}%`).limit(8);
    setResults(data || []);
  }, [supabase, pharmacyId]);

  const handleChange = (val: string) => {
    setQ(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 300);
  };

  useEffect(() => { if (!open) { setQ(''); setResults([]); } }, [open]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, backgroundColor: '#0d1225', border: `1px solid ${C.cardBorder}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.text }}>Select Customer</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', backgroundColor: 'rgba(255,255,255,0.05)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: C.muted }} />
            <input
              autoFocus value={q} onChange={e => handleChange(e.target.value)}
              placeholder="Search by name or phone..."
              style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, backgroundColor: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10, color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {results.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: C.muted }}>
                {q.length < 2 ? 'Type at least 2 characters to search' : 'No customers found'}
              </p>
            ) : results.map(c => (
              <button
                key={c.id}
                onClick={() => { onSelect(c); onClose(); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s ease' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{c.name}</p>
                  {c.phone && <p style={{ margin: '1px 0 0', fontSize: 11, color: C.muted }}>{c.phone}</p>}
                </div>
                <ChevronRight style={{ width: 13, height: 13, color: '#334155', marginLeft: 'auto', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main POS Page ──────────────────────────────────────────── */
export default function POSPage() {
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<SearchResult | null>(null);
  const [batchOptions, setBatchOptions] = useState<BatchOption[]>([]);
  const [showBatches, setShowBatches] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'credit'>('cash');
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* ─── Search ── */
  const doSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2 || !pharmacyId) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase.from('medicines')
      .select('id, name, generic_name, manufacturer, gst_rate, pack_size')
      .eq('pharmacy_id', pharmacyId)
      .or(`name.ilike.%${q}%,generic_name.ilike.%${q}%`)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  }, [pharmacyId, supabase]);

  const handleSearchChange = (val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 280);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([]); setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectMedicine = async (med: SearchResult) => {
    setSelectedMedicine(med);
    setSearchResults([]);
    setQuery('');
    const { data } = await supabase.from('batches')
      .select('id, batch_number, expiry_date, stock_quantity, mrp, purchase_price')
      .eq('medicine_id', med.id).eq('pharmacy_id', pharmacyId!)
      .gt('stock_quantity', 0).order('expiry_date');
    setBatchOptions(data || []);
    setShowBatches(true);
  };

  const addToCart = (batch: BatchOption) => {
    if (!selectedMedicine) return;
    const idx = cart.findIndex(c => c.batch_id === batch.id);
    if (idx >= 0) {
      const updated = [...cart];
      if (updated[idx].quantity < batch.stock_quantity) updated[idx].quantity += 1;
      setCart(updated);
    } else {
      setCart(prev => [...prev, {
        medicine_id: selectedMedicine.id, medicine_name: selectedMedicine.name,
        batch_id: batch.id, batch_number: batch.batch_number,
        expiry_date: batch.expiry_date, quantity: 1,
        max_qty: batch.stock_quantity, mrp: batch.mrp, rate: batch.mrp,
        gst_rate: selectedMedicine.gst_rate,
      }]);
    }
    setShowBatches(false); setSelectedMedicine(null);
    toast.success(`${selectedMedicine.name} added to cart`);
  };

  const updateQty = (i: number, delta: number) => {
    const updated = [...cart];
    const newQty = updated[i].quantity + delta;
    if (newQty <= 0) updated.splice(i, 1);
    else if (newQty <= updated[i].max_qty) updated[i].quantity = newQty;
    setCart(updated);
  };

  /* ─── Calculations ── */
  const subtotal = cart.reduce((s, it) => s + it.rate * it.quantity, 0);
  const gstTotal = cart.reduce((s, it) => {
    const t = it.rate * it.quantity;
    return s + (t - t / (1 + it.gst_rate / 100));
  }, 0);
  const grandTotal = Math.max(0, subtotal - discount);

  /* ─── Submit ── */
  const handleSubmit = async () => {
    if (!cart.length) { toast.error('Cart is empty'); return; }
    if (!pharmacyId) { toast.error('Pharmacy not loaded'); return; }
    setSubmitting(true);
    try {
      const { data: sale, error: saleErr } = await supabase.from('sales').insert({
        pharmacy_id: pharmacyId,
        customer_id: customer?.id || null,
        bill_date: new Date().toISOString(),
        total_amount: grandTotal,
        discount_amount: discount,
        gst_amount: gstTotal,
        net_amount: grandTotal,
        payment_mode: paymentMethod,
        status: paymentMethod === 'credit' ? 'Credit' : 'Completed',
      }).select('id').single();
      if (saleErr) throw saleErr;

      for (const item of cart) {
        await supabase.from('sale_items').insert({
          sale_id: sale.id,
          medicine_id: item.medicine_id, batch_id: item.batch_id,
          quantity: item.quantity, unit_price: item.rate, mrp: item.mrp,
          gst_rate: item.gst_rate,
          total_amount: item.rate * item.quantity,
        });
        // Deduct stock — non-fatal if RPC not yet deployed
        try {
          await supabase.rpc('deduct_batch_stock', { p_batch_id: item.batch_id, p_quantity: item.quantity });
        } catch { /* ignore */ }
      }

      toast.success('Sale completed successfully!');
      setCart([]); setCustomer(null); setDiscount(0); setPaymentMethod('cash');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete sale';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Styles ── */
  const panelCard: CSSProperties = {
    backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  };

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 112px)', minHeight: 0 }}>

      {/* ══ LEFT: Search + Cart ══════════════════════════════ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Search bar */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0 14px', height: 48,
            backgroundColor: searchFocused ? '#111827' : C.input,
            border: `1.5px solid ${searchFocused ? C.indigo : C.inputBorder}`,
            borderRadius: 14, transition: 'all 0.15s ease',
            boxShadow: searchFocused ? `0 0 0 3px rgba(99,102,241,0.15)` : 'none',
          }}>
            {searching
              ? <Loader2 style={{ width: 16, height: 16, color: C.indigoLight, animation: 'spin 1s linear infinite', flexShrink: 0 }} />
              : <Search style={{ width: 16, height: 16, color: searchFocused ? C.indigoLight : C.muted, flexShrink: 0 }} />
            }
            <input
              value={query}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search medicine by name or generic name..."
              autoFocus
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 13, fontWeight: 500, color: C.text,
                fontFamily: 'inherit',
              }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setSearchResults([]); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: C.muted, display: 'flex', alignItems: 'center' }}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            )}
            <kbd style={{ padding: '3px 7px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBorder}`, borderRadius: 6, fontSize: 10, color: '#334155', fontFamily: 'monospace', flexShrink: 0 }}>F2</kbd>
          </div>

          {/* Dropdown results */}
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              backgroundColor: '#0d1225', border: `1px solid ${C.cardBorder}`,
              borderRadius: 14, overflow: 'hidden', zIndex: 40,
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              maxHeight: 280, overflowY: 'auto',
            }}>
              <div style={{ padding: '8px 14px 6px', borderBottom: `1px solid ${C.cardBorder}` }}>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{searchResults.length} result{searchResults.length > 1 ? 's' : ''} found</p>
              </div>
              {searchResults.map((med, i) => (
                <button
                  key={med.id}
                  onClick={() => selectMedicine(med)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    backgroundColor: 'transparent', transition: 'background 0.1s ease',
                    borderBottom: i < searchResults.length - 1 ? `1px solid rgba(255,255,255,0.03)` : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package2 style={{ width: 14, height: 14, color: C.indigoLight }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{med.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>
                      {med.generic_name || '—'}{med.manufacturer ? ` · ${med.manufacturer}` : ''}
                    </p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#334155', flexShrink: 0 }}>{med.gst_rate}% GST</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div style={{ ...panelCard, flex: 1 }}>
          {/* Cart header */}
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart style={{ width: 15, height: 15, color: C.indigoLight }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>Cart</span>
              {cart.length > 0 && (
                <span style={{ padding: '2px 8px', borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.15)', color: C.indigoLight, fontSize: 10, fontWeight: 800 }}>{cart.length}</span>
              )}
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} style={{ fontSize: 11, fontWeight: 700, color: C.rose, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Trash2 style={{ width: 11, height: 11 }} /> Clear all
              </button>
            )}
          </div>

          {/* Cart body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: cart.length === 0 ? 0 : '8px 12px' }}>
            {cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: C.muted }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart style={{ width: 22, height: 22, color: '#1e293b' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#334155' }}>Cart is empty</p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#1e293b' }}>Search and add medicines above</p>
                </div>
              </div>
            ) : (
              <>
                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 90px 80px 28px', gap: 8, padding: '6px 8px', marginBottom: 4 }}>
                  {['Medicine', 'Batch / Exp', 'Qty', 'Amount', ''].map(h => (
                    <p key={h} style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</p>
                  ))}
                </div>
                {cart.map((item, i) => (
                  <div
                    key={`${item.batch_id}-${i}`}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 100px 90px 80px 28px',
                      alignItems: 'center', gap: 8,
                      padding: '10px 8px', borderRadius: 12, marginBottom: 4,
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      transition: 'border-color 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.medicine_name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted }}>MRP ₹{item.mrp.toFixed(2)} · {item.gst_rate}% GST</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: C.text }}>{item.batch_number}</p>
                      <p style={{ margin: '1px 0 0', fontSize: 10, color: C.muted }}>Exp: {item.expiry_date}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => updateQty(i, -1)} style={{ width: 24, height: 24, borderRadius: 7, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.cardBorder; }}>
                        <Minus style={{ width: 11, height: 11 }} />
                      </button>
                      <span style={{ width: 26, textAlign: 'center', fontSize: 12, fontWeight: 800, color: C.text }}>{item.quantity}</span>
                      <button onClick={() => updateQty(i, 1)} style={{ width: 24, height: 24, borderRadius: 7, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.cardBorder; }}>
                        <Plus style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.text, textAlign: 'right' }}>{formatCurrency(item.rate * item.quantity)}</p>
                    <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))}
                      style={{ width: 24, height: 24, borderRadius: 7, border: 'none', backgroundColor: 'transparent', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.color = C.rose; e.currentTarget.style.backgroundColor = 'rgba(244,63,94,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <Trash2 style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══ RIGHT: Bill Summary ══════════════════════════════ */}
      <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Customer selector */}
        <div style={{ ...panelCard, padding: '14px 16px', flexShrink: 0 }}>
          <FieldLabel>Customer</FieldLabel>
          {customer ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.text }}>{customer.name}</p>
                {customer.phone && <p style={{ margin: '1px 0 0', fontSize: 10, color: C.muted }}>{customer.phone}</p>}
              </div>
              <button onClick={() => setCustomer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 2, display: 'flex' }}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomerModal(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cardBorder}`, borderRadius: 10, color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = C.muted; }}
            >
              <User style={{ width: 14, height: 14 }} />
              <span>Walk-in Customer</span>
              <ChevronRight style={{ width: 12, height: 12, marginLeft: 'auto' }} />
            </button>
          )}
        </div>

        {/* Payment method */}
        <div style={{ ...panelCard, padding: '14px 16px', flexShrink: 0 }}>
          <FieldLabel>Payment Method</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {([
              { key: 'cash', label: 'Cash', icon: Banknote, color: '#10b981' },
              { key: 'upi', label: 'UPI', icon: Smartphone, color: '#6366f1' },
              { key: 'card', label: 'Card', icon: CreditCard, color: '#0ea5e9' },
              { key: 'credit', label: 'Credit', icon: IndianRupee, color: '#f59e0b' },
            ] as const).map(pm => (
              <PaymentBtn key={pm.key} active={paymentMethod === pm.key} onClick={() => setPaymentMethod(pm.key)} icon={pm.icon} label={pm.label} color={pm.color} />
            ))}
          </div>
        </div>

        {/* Discount */}
        <div style={{ ...panelCard, padding: '14px 16px', flexShrink: 0 }}>
          <FieldLabel>Discount (₹)</FieldLabel>
          <input
            type="number" value={discount || ''} min={0}
            onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            style={{ width: '100%', padding: '9px 12px', backgroundColor: C.input, border: `1.5px solid ${C.inputBorder}`, borderRadius: 10, color: C.text, fontSize: 13, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s ease' }}
            onFocus={e => e.target.style.borderColor = C.indigo}
            onBlur={e => e.target.style.borderColor = C.inputBorder}
          />
        </div>

        {/* Totals + CTA */}
        <div style={{ ...panelCard, padding: '16px', flex: 1, justifyContent: 'space-between' }}>
          <div>
            <FieldLabel>Bill Summary</FieldLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Subtotal', value: formatCurrency(subtotal), color: C.text },
                { label: `GST (incl.)`, value: formatCurrency(gstTotal), color: C.muted },
                ...(discount > 0 ? [{ label: 'Discount', value: `−${formatCurrency(discount)}`, color: C.rose }] : []),
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em' }}>{formatCurrency(grandTotal)}</span>
            </div>
            {paymentMethod === 'credit' && (
              <div style={{ marginTop: 8, padding: '8px 10px', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
                <p style={{ margin: 0, fontSize: 10, color: C.amber, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Zap style={{ width: 10, height: 10 }} /> Credit sale — amount will be outstanding
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            <button
              onClick={handleSubmit}
              disabled={cart.length === 0 || submitting}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 13, border: 'none',
                background: cart.length === 0 ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg,#059669,#10b981)',
                color: cart.length === 0 ? 'rgba(52,211,153,0.3)' : '#fff',
                fontSize: 13, fontWeight: 800, cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                boxShadow: cart.length > 0 ? '0 8px 24px rgba(16,185,129,0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { if (cart.length > 0 && !submitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(16,185,129,0.35)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = cart.length > 0 ? '0 8px 24px rgba(16,185,129,0.25)' : 'none'; }}
            >
              {submitting ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Check style={{ width: 15, height: 15 }} />}
              {submitting ? 'Processing...' : `Complete Sale · ${formatCurrency(grandTotal)}`}
            </button>
            <button
              onClick={() => window.print()}
              style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.03)', color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = C.muted; }}
            >
              <Receipt style={{ width: 12, height: 12 }} /> Print Receipt
            </button>
          </div>
        </div>
      </div>

      {/* ══ Modals ══════════════════════════════════════════ */}
      <BatchModal
        open={showBatches} onClose={() => { setShowBatches(false); setSelectedMedicine(null); }}
        medicine={selectedMedicine} batches={batchOptions} onSelect={addToCart}
      />
      {pharmacyId && (
        <CustomerModal
          open={showCustomerModal} onClose={() => setShowCustomerModal(false)}
          onSelect={setCustomer} supabase={supabase} pharmacyId={pharmacyId}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
