'use client';

import { Truck, ChevronDown, X } from 'lucide-react';
import { Supplier } from './types';
import { useState, useRef, useEffect } from 'react';

const C = {
  bg: '#020617',
  card: '#0B1121',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#8b5cf6',
  success: '#10b981',
  danger: '#ef4444',
  inputBg: 'rgba(255,255,255,0.02)',
};

interface Props {
  supplier: Supplier | null;
  supplierQuery: string;
  setSupplierQuery: (q: string) => void;
  suppliers: Supplier[];
  onSelectSupplier: (s: Supplier | null) => void;
  onUpdateSupplierField: (patch: Partial<Supplier>) => void;
  billNumber: string;
  setBillNumber: (v: string) => void;
  billDate: string;
  setBillDate: (v: string) => void;
  paymentStatus: string;
  setPaymentStatus: (v: string) => void;
  paidAmount: number;
  setPaidAmount: (v: number) => void;
  notes: string;
  setNotes: (v: string) => void;
  onQuickAdd: () => void;
}

export function SupplierDetails({
  supplier,
  supplierQuery,
  setSupplierQuery,
  suppliers,
  onSelectSupplier,
  onUpdateSupplierField,
  billNumber,
  setBillNumber,
  billDate,
  setBillDate,
  paymentStatus,
  setPaymentStatus,
  paidAmount,
  setPaidAmount,
  notes,
  setNotes,
  onQuickAdd,
}: Props) {
  const [showDrop, setShowDrop] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDrop(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fieldRowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  };
  const editFieldInputStyle: React.CSSProperties = {
    flex: 1, padding: '6px 8px', borderRadius: 6,
    border: `1px solid ${C.cardBorder}`, background: 'rgba(255,255,255,0.03)',
    color: C.text, fontSize: 11, fontWeight: 600, textAlign: 'right', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Supplier Section ── */}
      <div style={{ backgroundColor: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}`, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck style={{ width: 16, height: 16, color: '#f97316' }} /> Supplier *
          </h3>
          {!supplier && (
            <button onClick={onQuickAdd} style={{ background: 'rgba(99,102,241,0.1)', border: 'none', color: '#818cf8', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}>
              + QUICK ADD
            </button>
          )}
        </div>

        <div style={{ position: 'relative' }} ref={wrapperRef}>
          <input
            value={supplierQuery}
            onChange={(e) => {
              setSupplierQuery(e.target.value);
              setShowDrop(true);
              if (supplier && e.target.value !== supplier.name) {
                onSelectSupplier(null);
              }
            }}
            onFocus={() => setShowDrop(true)}
            placeholder="Search supplier..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${supplier ? C.primary : C.cardBorder}`, backgroundColor: C.inputBg, color: C.text, fontSize: 13, outline: 'none' }}
          />

          {showDrop && !supplier && (() => {
            const q = supplierQuery.toLowerCase().trim();
            const filtered = q
              ? suppliers.filter((s) =>
                  s.name.toLowerCase().includes(q) ||
                  (s.phone || '').includes(q) ||
                  (s.gstin || '').toLowerCase().includes(q)
                )
              : suppliers;
            if (filtered.length === 0) {
              return (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, backgroundColor: '#0f172a', border: `1px solid ${C.cardBorder}`, borderRadius: 12, overflow: 'hidden', zIndex: 50, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
                  <div style={{ padding: 16, textAlign: 'center', color: C.muted, fontSize: 12 }}>
                    {suppliers.length === 0 ? 'No suppliers in database. Add one first.' : `No match for "${supplierQuery}"`}
                  </div>
                </div>
              );
            }
            return (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, backgroundColor: '#0f172a', border: `1px solid ${C.cardBorder}`, borderRadius: 12, overflow: 'hidden', zIndex: 50, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', maxHeight: 240, overflowY: 'auto' }}>
                {filtered.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onSelectSupplier(s);
                      setSupplierQuery(s.name);
                      setShowDrop(false);
                    }}
                    style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: `1px solid ${C.cardBorder}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{s.name}</div>
                    {s.gstin && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>GST: {s.gstin}</div>}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {supplier && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '8px 12px' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>{supplier.name}</span>
              <button onClick={() => { onSelectSupplier(null); setSupplierQuery(''); }} style={{ background: 'transparent', border: 'none', padding: 0, color: C.muted, cursor: 'pointer' }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${C.cardBorder}`, borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={fieldRowStyle}>
                <span style={{ fontSize: 11, color: C.muted }}>GSTIN</span>
                <input
                  type="text" maxLength={15}
                  value={supplier.gstin ?? ''}
                  onChange={(e) => onUpdateSupplierField({ gstin: e.target.value.toUpperCase() })}
                  placeholder="—"
                  style={{ ...editFieldInputStyle, fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
              </div>
              <div style={fieldRowStyle}>
                <span style={{ fontSize: 11, color: C.muted }}>Phone</span>
                <input
                  type="text"
                  value={supplier.phone ?? ''}
                  onChange={(e) => onUpdateSupplierField({ phone: e.target.value })}
                  placeholder="—"
                  style={editFieldInputStyle}
                />
              </div>
              <div style={fieldRowStyle}>
                <span style={{ fontSize: 11, color: C.muted }}>City</span>
                <input
                  type="text"
                  value={supplier.city ?? ''}
                  onChange={(e) => onUpdateSupplierField({ city: e.target.value })}
                  placeholder="—"
                  style={editFieldInputStyle}
                />
              </div>
              <div style={fieldRowStyle}>
                <span style={{ fontSize: 11, color: C.muted }}>State</span>
                <input
                  type="text"
                  value={supplier.state ?? ''}
                  onChange={(e) => onUpdateSupplierField({ state: e.target.value })}
                  placeholder="—"
                  style={editFieldInputStyle}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bill Details Section ── */}
      <div style={{ backgroundColor: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>Bill Details</h3>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 4 }}>Bill Number *</label>
          <input
            value={billNumber}
            onChange={(e) => setBillNumber(e.target.value)}
            placeholder="e.g. INV-2024-001"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${C.cardBorder}`, backgroundColor: C.inputBg, color: C.text, fontSize: 13, outline: 'none' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 4 }}>Bill Date *</label>
          <input
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${C.cardBorder}`, backgroundColor: C.inputBg, color: C.text, fontSize: 13, outline: 'none', colorScheme: 'dark' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 4 }}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional remarks..."
            rows={2}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${C.cardBorder}`, backgroundColor: C.inputBg, color: C.text, fontSize: 13, outline: 'none', resize: 'vertical' }}
          />
        </div>
      </div>

      {/* ── Payment Section ── */}
      <div style={{ backgroundColor: C.card, borderRadius: 16, border: `1px solid ${C.cardBorder}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>Payment</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {(['paid', 'pending', 'partial'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setPaymentStatus(s)}
              style={{
                padding: '8px',
                borderRadius: 10,
                border: `1px solid ${paymentStatus === s ? C.primary : C.cardBorder}`,
                background: paymentStatus === s ? C.primary : 'transparent',
                color: paymentStatus === s ? '#fff' : C.muted,
                fontSize: 11, fontWeight: 800, textTransform: 'capitalize',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          ))}
        </div>
        {paymentStatus === 'partial' && (
          <div>
            <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 4 }}>Amount Paid (₹)</label>
            <input
              type="number"
              value={paidAmount || ''}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${C.cardBorder}`, backgroundColor: C.inputBg, color: C.text, fontSize: 13, outline: 'none' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
