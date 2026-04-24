'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import toast from 'react-hot-toast';
import {
  Building2, ChevronLeft, Phone, Mail,
  MapPin, Save, Loader2, AlertCircle, Tag,
  User, CreditCard,
} from 'lucide-react';

/* ─── Palette ────────────────────────────────────────── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569',
  indigo: '#6366f1', emerald: '#10b981', rose: '#f43f5e',
  teal: '#14b8a6',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

/* ─── Types ─── */
interface FormState {
  name: string;
  contact_person: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  credit_limit: string;
  credit_days: string;
  opening_balance: string;
}

/* ─── Reusable Section Card ─── */
function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: `1px solid ${C.cardBorder}` }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${C.teal}14`, border: `1px solid ${C.teal}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 14, height: 14, color: C.teal }} />
        </div>
        <h2 style={{ margin: 0, fontSize: 11, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ─── Reusable Field ─── */
function Field({ label, icon: Icon, error, children, span = 1 }: { label: string; icon?: React.ElementType; error?: string; children: React.ReactNode; span?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: `span ${span}` }}>
      <label style={{ fontSize: 9, fontWeight: 900, color: error ? C.rose : C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginLeft: 2 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: error ? C.rose : C.muted, pointerEvents: 'none' }} />}
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
export default function AddSupplierPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [form, setForm] = useState<FormState>({
    name: '', contact_person: '', gstin: '', phone: '', email: '',
    address: '', city: '', state: '', pincode: '',
    credit_limit: '', credit_days: '', opening_balance: '',
  });

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  /* ─── Validation ─── */
  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = 'Supplier name required';
    if (form.phone && form.phone.replace(/\D/g, '').length !== 10) {
      e.phone = 'Phone must be 10 digits';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Invalid email';
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
      if (!pharmacyId) setError('Pharmacy ID not found. Please refresh.');
      else setError('Please fix the validation errors below.');
      return;
    }
    setLoading(true);
    try {
      // Insert all supplier columns now that the migration adds them
      const payload: Record<string, any> = {
        pharmacy_id: pharmacyId,
        name: form.name.trim(),
        contact_person: form.contact_person.trim() || null,
        gstin: form.gstin.trim().toUpperCase() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        pincode: form.pincode.trim() || null,
        outstanding_balance: form.opening_balance ? Number(form.opening_balance) : 0,
        opening_balance: form.opening_balance ? Number(form.opening_balance) : 0,
        credit_limit: form.credit_limit ? Number(form.credit_limit) : null,
        credit_days: form.credit_days ? Number(form.credit_days) : null,
      };

      const { error: err } = await supabase.from('suppliers').insert(payload);
      if (err) throw err;
      
      toast.success('Supplier registered successfully!');
      router.push(`/panel/suppliers`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create supplier');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={() => router.push('/panel/suppliers')}
          style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.card; e.currentTarget.style.color = C.muted; }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 style={{ width: 20, height: 20, color: C.teal }} />
            New Supplier Profile
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>Register a vendor for purchase management and inventory tracking</p>
        </div>
      </div>

      {/* ── Global Error ── */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: `${C.rose}12`, border: `1px solid ${C.rose}25`, borderRadius: 14, padding: '12px 16px' }}>
          <AlertCircle style={{ width: 16, height: 16, color: C.rose, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 13, color: C.rose, fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {/* ── Section 1: Company Details ── */}
      <Section title="Company Details" icon={Building2}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Field label="Supplier / Company Name *" icon={Building2} error={errors.name} span={2}>
            <input
              type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Apex Pharma Distributors"
              style={{...(errors.name ? inputErr : inputBase), paddingLeft: 38}}
              onFocus={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.teal}15`; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.name ? `${C.rose}50` : C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
          <Field label="Contact Person" icon={User}>
            <input
              type="text" value={form.contact_person} onChange={e => set('contact_person', e.target.value)}
              placeholder="e.g. Suresh Kumar"
              style={inputBase}
              onFocus={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.teal}15`; }}
              onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
          <Field label="GSTIN" icon={Tag} error={errors.gstin}>
            <input
              type="text" value={form.gstin}
              onChange={e => set('gstin', e.target.value.toUpperCase().slice(0, 15))}
              placeholder="22AAAAA0000A1Z5"
              style={{ ...(errors.gstin ? inputErr : inputBase), fontFamily: 'monospace', letterSpacing: '0.05em' }}
              onFocus={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.teal}15`; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.gstin ? `${C.rose}50` : C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 2: Contact Details ── */}
      <Section title="Contact Details" icon={Phone}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Field label="Phone" icon={Phone} error={errors.phone}>
            <input
              type="tel" value={form.phone}
              onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210"
              style={errors.phone ? inputErr : inputBase}
              onFocus={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.teal}15`; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.phone ? `${C.rose}50` : C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
          <Field label="Email" icon={Mail} error={errors.email}>
            <input
              type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="vendor@example.com"
              style={errors.email ? inputErr : inputBase}
              onFocus={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.teal}15`; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.email ? `${C.rose}50` : C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 3: Address ── */}
      <Section title="Address" icon={MapPin}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 9, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginLeft: 2 }}>Street Address</label>
            <div style={{ position: 'relative' }}>
              <MapPin style={{ position: 'absolute', left: 12, top: 14, width: 14, height: 14, color: C.muted, pointerEvents: 'none' }} />
              <textarea
                value={form.address} onChange={e => set('address', e.target.value)}
                rows={2} placeholder="Street, Area, Building…"
                style={{ ...inputBase, paddingTop: 12, paddingBottom: 12, resize: 'none', lineHeight: 1.5 }}
                onFocus={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.teal}15`; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Field label="City" icon={MapPin}>
              <input
                type="text" value={form.city} onChange={e => set('city', e.target.value)}
                placeholder="e.g. Mumbai"
                style={inputBase}
                onFocus={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.teal}15`; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </Field>
            <Field label="State" icon={MapPin}>
              <input
                type="text" value={form.state} onChange={e => set('state', e.target.value)}
                placeholder="e.g. Maharashtra"
                style={inputBase}
                onFocus={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.teal}15`; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </Field>
            <Field label="Pincode" icon={MapPin}>
              <input
                type="text" value={form.pincode}
                onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="400001"
                style={inputBase}
                onFocus={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.teal}15`; }}
                onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 4: Credit Terms ── */}
      <Section title="Credit Terms" icon={CreditCard}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Field label="Credit Limit (₹)" icon={RupeeIcon as any} error={errors.credit_limit}>
            <input
              type="number" min="0" value={form.credit_limit}
              onChange={e => set('credit_limit', e.target.value)}
              placeholder="0"
              style={errors.credit_limit ? inputErr : inputBase}
              onFocus={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.teal}15`; }}
              onBlur={e => { e.currentTarget.style.borderColor = errors.credit_limit ? `${C.rose}50` : C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
          <Field label="Credit Days" icon={CreditCard}>
            <input
              type="number" min="0" value={form.credit_days}
              onChange={e => set('credit_days', e.target.value)}
              placeholder="30"
              style={inputBase}
              onFocus={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.teal}15`; }}
              onBlur={e => { e.currentTarget.style.borderColor = C.inputBorder; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </Field>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
          Set supplier-specific credit terms for purchase management.
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
            background: `linear-gradient(135deg, ${C.teal}, #0d9488)`,
            color: '#fff', fontSize: 14, fontWeight: 900, cursor: loading ? 'wait' : 'pointer',
            boxShadow: `0 8px 24px ${C.teal}35`,
            opacity: loading ? 0.7 : 1, transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${C.teal}45`; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 24px ${C.teal}35`; }}
        >
          {loading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 16, height: 16 }} />}
          Register Supplier
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
