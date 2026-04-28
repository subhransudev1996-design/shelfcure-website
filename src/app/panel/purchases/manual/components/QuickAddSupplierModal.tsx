'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Truck, X, Loader2, AlertTriangle } from 'lucide-react';
import { Supplier } from './types';

const C = {
  card: '#0B1121',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc',
  muted: '#94a3b8',
  inputBg: 'rgba(255,255,255,0.02)',
  primary: '#6366f1',
  danger: '#ef4444',
};

interface Props {
  open: boolean;
  onClose: () => void;
  pharmacyId: string;
  initialName?: string;
  initialPhone?: string;
  onCreated: (s: Supplier) => void;
}

export function QuickAddSupplierModal({ open, onClose, pharmacyId, initialName = '', initialPhone = '', onCreated }: Props) {
  const supabase = createClient();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setPhone(initialPhone);
      setError('');
    }
  }, [open, initialName, initialPhone]);

  if (!open) return null;

  async function handleSave() {
    if (!name.trim()) { setError('Supplier name is required'); return; }
    const digits = phone.replace(/\D/g, '');
    if (!digits) { setError('Mobile number is required'); return; }
    if (digits.length !== 10) { setError('Mobile number must be 10 digits'); return; }

    setSaving(true);
    setError('');
    try {
      const { data, error: dbErr } = await supabase
        .from('suppliers')
        .insert({ pharmacy_id: pharmacyId, name: name.trim(), phone: digits })
        .select('id, name, phone, gstin, address, city, state')
        .single();
      if (dbErr) throw dbErr;
      onCreated(data as Supplier);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to create supplier');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(2,4,15,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 420, background: C.card,
        border: `1px solid ${C.cardBorder}`, borderRadius: 18,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.cardBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck style={{ width: 15, height: 15, color: '#818cf8' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>Quick Add Supplier</h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>Create a new supplier profile instantly</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: 6, borderRadius: 8 }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.25)`, borderRadius: 8, color: C.danger, fontSize: 12 }}>
              <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
              {error}
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6 }}>Company / Supplier Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apollo Distributors"
              autoFocus
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, background: C.inputBg, color: C.text, fontSize: 13, outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6 }}>Mobile Number *</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, background: C.inputBg, color: C.text, fontSize: 13, outline: 'none' }}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !phone.trim()}
            style={{
              padding: '11px', borderRadius: 10, border: 'none',
              background: C.primary, color: '#fff',
              fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving || !name.trim() || !phone.trim() ? 0.55 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 0.2s',
            }}
          >
            {saving ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} /> Saving…</> : 'Save Supplier & Select'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
