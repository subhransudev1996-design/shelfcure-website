'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import toast from 'react-hot-toast';
import {
  UserPlus, ChevronLeft, User, Phone, Mail,
  MapPin, Wallet, Save, Loader2, AlertCircle,
  CreditCard,
} from 'lucide-react';

/* ─── Palette (matching panel theme) ─── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569',
  indigo: '#6366f1', emerald: '#10b981', rose: '#f43f5e',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

/* ─── Types ─── */
interface FormState {
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  state: string;
  customer_type: string;
  credit_limit: string;
  credit_days: string;
}

/* ─── Reusable Section Card ─── */
function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: `1px solid ${C.cardBorder}` }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${C.indigo}14`, border: `1px solid ${C.indigo}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 14, height: 14, color: C.indigo }} />
        </div>
        <h2 style={{ margin: 0, fontSize: 11, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ─── Reusable Field ─── */
function Field({ label, icon: Icon, error, children }: { label: string; icon: React.ElementType; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 9, fontWeight: 900, color: error ? C.rose : C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginLeft: 2 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Icon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: error ? C.rose : C.muted, pointerEvents: 'none' }} />
        {children}
      </div>
      {error && <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.rose, marginLeft: 2 }}>{error}</p>}
    </div>
  );
}

/* ─── Input styles ─── */
const inputBase: React.CSSProperties = {
  width: '100%', paddingLeft: 38, paddingRight: 14, paddingTop: 11, paddingBottom: 11,
  borderRadius: 12, border: `1.5px solid ${C.inputBorder}`, backgroundColor: C.input,
  color: C.text, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', outline: 'none',
  transition: 'all 0.15s ease',
};
const inputErr: React.CSSProperties = { ...inputBase, borderColor: `${C.rose}50` };

/* ─── Rupee icon ─── */
function RupeeIcon({ style }: { style?: React.CSSProperties }) {
  return <span style={{ fontWeight: 800, fontSize: 13, ...style }}>₹</span>;
}

/* ════════════════════════════════════════════════════════ */
export default function AddCustomerPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [form, setForm] = useState<FormState>({
    name: '', phone: '', email: '', address: '', gstin: '',
    state: '', customer_type: 'b2c', credit_limit: '', credit_days: '',
  });

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  /* ─── Validation (matching desktop logic) ─── */
  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.phone && form.phone.replace(/\D/g, '').length !== 10) {
      e.phone = 'Phone must be 10 digits';
    } else if (!form.phone.trim()) {
      e.phone = 'Phone is required';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Invalid email format';
    }
    if (form.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(form.gstin)) {
      e.gstin = 'Invalid GSTIN format';
    }
    if (form.credit_limit && Number.isNaN(Number(form.credit_limit))) {
      e.credit_limit = 'Invalid amount';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    setError(null);
    if (!validate() || !pharmacyId) {
      setError('Please fix the validation errors below.');
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, any> = {
        pharmacy_id: pharmacyId,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        outstanding_balance: 0,
      };
      // Insert optional fields only if the columns exist (safe upsert)
      if (form.gstin.trim()) payload.gstin = form.gstin.trim().toUpperCase();
      if (form.state.trim()) payload.state = form.state.trim();
      if (form.customer_type) payload.customer_type = form.customer_type;
      if (form.credit_limit) payload.credit_limit = Number(form.credit_limit);
      if (form.credit_days) payload.credit_days = Number(form.credit_days);

      const { data, error: err } = await supabase.from('customers').insert(payload).select('id').single();
      if (err) throw err;
      toast.success('Customer registered successfully!');
      router.push(`/panel/customers`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create customer');
      setLoading(false);
    }
  };

  /* ─── Customer Type Pill ─── */
  const TypePill = ({ value, label, desc }: { value: string; label: string; desc: string }) => {
    const active = form.customer_type === value;
    return (
      <button
        type="button"
        onClick={() => set('customer_type', value)}
        style={{
          flex: 1, padding: '14px 16px', borderRadius: 12,
          border: `1.5px solid ${active ? C.indigo + '50' : C.inputBorder}`,
          backgroundColor: active ? C.indigo + '12' : C.input,
          cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
        }}
      >
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: active ? C.indigo : C.text }}>{label}</p>
        <p style={{ margin: '3px 0 0', fontSize: 10, color: C.muted }}>{desc}</p>
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={() => router.push('/panel/customers')}
          style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.card; e.currentTarget.style.color = C.muted; }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserPlus style={{ width: 20, height: 20, color: C.emerald }} />
            New Customer Profile
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>Register a patient for billing and credit management</p>
        </div>
      </div>

      {/* ── Global Error ── */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: `${C.rose}12`, border: `1px solid ${C.rose}25`, borderRadius: 14, padding: '12px 16px' }}>
          <AlertCircle style={{ width: 16, height: 16, color: C.rose, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 13, color: C.rose, fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {/* ── Section 1: Personal Details ── */}
      <Section title="Personal Details" icon={User}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Field label="Full Name *" icon={User} error={errors.name}>
            <input
              type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              style={errors.name ? inputErr : inputBase}
              onFocus={e => { e.currentTarget.style.borderColor = C.indigo; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.indigo}15`; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.name ? `${C.rose}50` : C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
          <Field label="Phone *" icon={Phone} error={errors.phone}>
            <input
              type="tel" value={form.phone}
              onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210"
              style={errors.phone ? inputErr : inputBase}
              onFocus={e => { e.currentTarget.style.borderColor = C.indigo; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.indigo}15`; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.phone ? `${C.rose}50` : C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
          <Field label="Email" icon={Mail} error={errors.email}>
            <input
              type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="email@example.com"
              style={errors.email ? inputErr : inputBase}
              onFocus={e => { e.currentTarget.style.borderColor = C.indigo; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.indigo}15`; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.email ? `${C.rose}50` : C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
        </div>

        {/* Customer Type Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 9, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginLeft: 2 }}>Customer Type</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <TypePill value="b2c" label="B2C — Individual" desc="Walk-in patient or retail customer" />
            <TypePill value="b2b" label="B2B — Business" desc="Hospital, clinic, or institution" />
          </div>
        </div>
      </Section>

      {/* ── Section 2: Address / Location ── */}
      <Section title="Address / Location" icon={MapPin}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 9, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginLeft: 2 }}>Address</label>
            <div style={{ position: 'relative' }}>
              <MapPin style={{ position: 'absolute', left: 12, top: 14, width: 14, height: 14, color: C.muted, pointerEvents: 'none' }} />
              <textarea
                value={form.address} onChange={e => set('address', e.target.value)}
                rows={3} placeholder="Street, Area, City…"
                style={{ ...inputBase, paddingTop: 12, paddingBottom: 12, resize: 'none', lineHeight: 1.5 }}
                onFocus={e => { e.currentTarget.style.borderColor = C.indigo; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.indigo}15`; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Field label="State" icon={MapPin}>
              <input
                type="text" value={form.state} onChange={e => set('state', e.target.value)}
                placeholder="e.g. Karnataka"
                style={inputBase}
                onFocus={e => { e.currentTarget.style.borderColor = C.indigo; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.indigo}15`; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </Field>
            <Field label="GSTIN" icon={CreditCard} error={errors.gstin}>
              <input
                type="text" value={form.gstin}
                onChange={e => set('gstin', e.target.value.toUpperCase())}
                maxLength={15} placeholder="e.g. 29AAACR5055K1Z5"
                style={{ ...(errors.gstin ? inputErr : inputBase), fontFamily: 'monospace', letterSpacing: '0.05em' }}
                onFocus={e => { e.currentTarget.style.borderColor = C.indigo; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.indigo}15`; }}
                onBlur={e => { e.currentTarget.style.borderColor = errors.gstin ? `${C.rose}50` : C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 3: Credit Terms ── */}
      <Section title="Credit Terms" icon={Wallet}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Field label="Credit Limit (₹)" icon={RupeeIcon as any} error={errors.credit_limit}>
            <input
              type="number" min="0" value={form.credit_limit}
              onChange={e => set('credit_limit', e.target.value)}
              placeholder="0"
              style={errors.credit_limit ? inputErr : inputBase}
              onFocus={e => { e.currentTarget.style.borderColor = C.indigo; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.indigo}15`; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.credit_limit ? `${C.rose}50` : C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
          <Field label="Credit Days" icon={CreditCard}>
            <input
              type="number" min="0" value={form.credit_days}
              onChange={e => set('credit_days', e.target.value)}
              placeholder="30"
              style={inputBase}
              onFocus={e => { e.currentTarget.style.borderColor = C.indigo; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.indigo}15`; }}
              onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
          Credit limit restricts unpaid billing in POS when the limit is reached. Credit days define the payment window.
        </p>
      </Section>

      {/* ── Submit Button ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 32px',
            borderRadius: 14, border: 'none',
            background: `linear-gradient(135deg, ${C.emerald}, #059669)`,
            color: '#fff', fontSize: 14, fontWeight: 900, cursor: loading ? 'wait' : 'pointer',
            boxShadow: `0 8px 24px ${C.emerald}35`,
            opacity: loading ? 0.7 : 1, transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${C.emerald}45`; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 24px ${C.emerald}35`; }}
        >
          {loading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 16, height: 16 }} />}
          Register Customer
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
