'use client';

import { useEffect, useState } from 'react';
import { X, User, Loader2, AlertCircle, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const C = {
  card: '#0d1225',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc',
  muted: '#94a3b8',
  inputBg: 'rgba(255,255,255,0.03)',
  primary: '#6366f1',
  rose: '#f43f5e',
};

export interface NewCustomer {
  id: string;
  name: string;
  phone: string;
  credit_limit: number;
  outstanding_balance: number;
  state: string | null;
  gstin: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  pharmacyId: string;
  onCreated: (c: NewCustomer) => void;
}

export function QuickAddCustomerModal({ open, onClose, pharmacyId, onCreated }: Props) {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setName(''); setPhone(''); setError(''); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function handleSave() {
    const digits = phone.replace(/\D/g, '');
    if (!name.trim()) { setError('Name is required'); return; }
    if (digits.length !== 10) { setError('Mobile number must be 10 digits'); return; }
    setSaving(true); setError('');
    try {
      const { data, error: dbErr } = await supabase
        .from('customers')
        .insert({ pharmacy_id: pharmacyId, name: name.trim(), phone: digits })
        .select('id, name, phone, credit_limit, outstanding_balance')
        .single();
      if (dbErr) throw dbErr;
      onCreated({
        id: String(data.id),
        name: data.name,
        phone: data.phone,
        credit_limit: Number(data.credit_limit) || 0,
        outstanding_balance: Number(data.outstanding_balance) || 0,
        state: null,
        gstin: null,
      });
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User style={{ width: 16, height: 16, color: '#818cf8' }} />
          </div>
          <h3 style={{ margin: 0, flex: 1, fontSize: 14, fontWeight: 900, color: C.text }}>Quick Add Customer</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', backgroundColor: 'rgba(255,255,255,0.05)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(244,63,94,0.1)', border: `1px solid rgba(244,63,94,0.25)`, borderRadius: 8, color: C.rose, fontSize: 12 }}>
              <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
              {error}
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Full Name *</label>
            <input
              autoFocus value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, background: C.inputBg, color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mobile Number *</label>
            <input
              value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit number"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, background: C.inputBg, color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, background: 'transparent', color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button
              onClick={handleSave} disabled={saving || !name.trim() || !phone.trim()}
              style={{
                flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                background: C.primary, color: '#fff', fontSize: 12, fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving || !name.trim() || !phone.trim() ? 0.55 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {saving ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 0.8s linear infinite' }} /> : <Plus style={{ width: 13, height: 13 }} />}
              {saving ? 'Saving…' : 'Save & Apply'}
            </button>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
