'use client';

import { useEffect } from 'react';
import { X, Layers, CalendarClock, Package } from 'lucide-react';
import type { PosBatch, PosMedicine } from '@/store/posCartStore';

const C = {
  card: '#0d1225',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  rose: '#f43f5e',
  amber: '#f59e0b',
  emerald: '#10b981',
};

interface Props {
  open: boolean;
  onClose: () => void;
  medicine: PosMedicine | null;
  batches: PosBatch[];
  onSelect: (b: PosBatch) => void;
  /** if true, this is a "change batch" flow (existing item swap) */
  isChange?: boolean;
}

export function BatchModal({ open, onClose, medicine, batches, onSelect, isChange }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 480,
        backgroundColor: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers style={{ width: 16, height: 16, color: C.primaryLight }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.primaryLight, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {isChange ? 'Change Batch' : 'Select Batch'}
            </p>
            <h3 style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 900, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{medicine?.name}</h3>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', backgroundColor: 'rgba(255,255,255,0.05)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div style={{ padding: 12, maxHeight: 360, overflowY: 'auto' }}>
          {batches.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: C.muted }}>No stock available</p>
          ) : batches.map((b) => {
            const expDate = new Date(b.expiry_date);
            const daysLeft = Math.ceil((expDate.getTime() - Date.now()) / 86400000);
            const expired = daysLeft <= 0;
            const expColor = expired ? C.rose : daysLeft < 30 ? C.rose : daysLeft < 90 ? C.amber : C.emerald;
            return (
              <button
                key={b.id}
                disabled={expired}
                onClick={() => !expired && onSelect(b)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 10, padding: '12px 14px', borderRadius: 12,
                  border: `1px solid ${expired ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  backgroundColor: expired ? 'rgba(244,63,94,0.05)' : 'rgba(255,255,255,0.02)',
                  cursor: expired ? 'not-allowed' : 'pointer', opacity: expired ? 0.5 : 1,
                  textAlign: 'left', marginBottom: 6, transition: 'background 0.12s ease',
                }}
                onMouseEnter={(e) => { if (!expired) e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.08)'; }}
                onMouseLeave={(e) => { if (!expired) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{b.batch_number || '—'}</span>
                    {expired && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: 'rgba(244,63,94,0.15)', color: C.rose }}>EXPIRED</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: 11, color: C.muted }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: expColor, fontWeight: 600 }}>
                      <CalendarClock style={{ width: 11, height: 11 }} />
                      {expDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Package style={{ width: 11, height: 11 }} />
                      {b.stock_quantity} units
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: C.primaryLight, flexShrink: 0 }}>
                  ₹{(b.selling_price ?? b.mrp).toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
