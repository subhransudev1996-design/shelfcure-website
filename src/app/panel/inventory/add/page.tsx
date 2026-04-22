'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Package2, AlertTriangle, Save,
  FlaskConical, ShoppingBag, MapPin, Barcode, RefreshCw,
} from 'lucide-react';

/* ─── Palette ─── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569',
  indigo: '#6366f1', indigoLight: '#818cf8',
  emerald: '#10b981', rose: '#f43f5e',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Ointment', 'Powder', 'Solution', 'Gel', 'Lotion', 'Suppository', 'Other'];
const CATEGORIES = ['Analgesics', 'Antibiotics', 'Antihistamines', 'Antacids', 'Anti-diabetics', 'Antifungals', 'Antivirals', 'Cardiovascular', 'Dermatological', 'Gastrointestinal', 'Hormones', 'Nutritional', 'Ophthalmic', 'Respiratory', 'Vitamins & Supplements', 'Other'];
const GST_RATES = [0, 5, 12, 18, 28];

/* ─── Styled form components (no Tailwind) ─── */
function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>
      {text}{required && <span style={{ color: C.rose, marginLeft: 2 }}>*</span>}
    </label>
  );
}

function FInput({ label, value, onChange, type = 'text', placeholder, required, min, max, step, disabled }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; min?: number | string; max?: number | string; step?: string; disabled?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <Label text={label} required={required} />
      <input
        type={type} value={value} placeholder={placeholder} required={required}
        min={min} max={max} step={step} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: '100%', padding: '9px 12px', boxSizing: 'border-box',
          backgroundColor: disabled ? 'rgba(255,255,255,0.02)' : (focus ? '#131929' : C.input),
          border: `1.5px solid ${focus ? C.indigo : C.inputBorder}`,
          borderRadius: 9, color: disabled ? C.muted : C.text, fontSize: 13, fontWeight: 500,
          outline: 'none', fontFamily: 'inherit',
          boxShadow: focus ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
          transition: 'all 0.15s ease', cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
    </div>
  );
}

function FSelect({ label, value, onChange, children, required }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode; required?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <Label text={label} required={required} />
      <select
        value={value} required={required} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: '100%', padding: '9px 12px', boxSizing: 'border-box',
          backgroundColor: focus ? '#131929' : C.input,
          border: `1.5px solid ${focus ? C.indigo : C.inputBorder}`,
          borderRadius: 9, color: C.text, fontSize: 13, fontWeight: 500,
          outline: 'none', fontFamily: 'inherit', appearance: 'none', cursor: 'pointer',
          boxShadow: focus ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        {children}
      </select>
    </div>
  );
}

function FTextarea({ label, value, onChange, placeholder, rows = 2 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <Label text={label} />
      <textarea
        value={value} rows={rows} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: '100%', padding: '9px 12px', boxSizing: 'border-box', resize: 'vertical',
          backgroundColor: focus ? '#131929' : C.input,
          border: `1.5px solid ${focus ? C.indigo : C.inputBorder}`,
          borderRadius: 9, color: C.text, fontSize: 13, fontWeight: 500,
          outline: 'none', fontFamily: 'inherit', minHeight: 56,
          boxShadow: focus ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
          transition: 'all 0.15s ease',
        }}
      />
    </div>
  );
}

/* ─── Toggle group ─── */
function ToggleGroup({ label, value, onChange, options, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string; icon?: React.ElementType }[];
  hint?: string;
}) {
  return (
    <div>
      <Label text={label} />
      <div style={{ display: 'flex', gap: 8 }}>
        {options.map(o => {
          const active = value === o.value;
          return (
            <button key={o.value} type="button" onClick={() => onChange(o.value)}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                backgroundColor: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                outline: active ? `1.5px solid ${C.indigo}55` : `1px solid ${C.cardBorder}`,
                color: active ? C.indigoLight : C.muted,
                fontSize: 12, fontWeight: 700, transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = C.text; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.color = C.muted; } }}
            >
              {o.icon && <o.icon style={{ width: 13, height: 13 }} />}
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && <p style={{ margin: '5px 0 0', fontSize: 10, color: '#60a5fa' }}>{hint}</p>}
    </div>
  );
}

/* ─── Section card ─── */
function Section({ icon: Icon, label, color, children }: {
  icon: React.ElementType; label: string; color?: string; children: React.ReactNode;
}) {
  const c = color || C.indigoLight;
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: `${c}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 14, height: 14, color: c }} />
        </div>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.text }}>{label}</p>
      </div>
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function AddMedicinePage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [form, setForm] = useState({
    name: '', generic_name: '', manufacturer: '', dosage_form: 'Tablet',
    strength: '', category: '',
    pack_size: '1', units_per_pack: '10',
    sale_mode: 'strip',            // 'strip' = Pack only | 'both' = Pack & Units | 'unit' = Units only
    gst_rate: '0',
    hsn_code: '',
    min_stock_level: '10', reorder_qty: '50',
    rack_no: '', barcode: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pharmacyId) { setError('Not authenticated'); return; }
    if (!form.name.trim()) { setError('Medicine name is required'); return; }
    setError(null);
    setSaving(true);
    try {
      const { error: dbErr } = await supabase.from('medicines').insert({
        pharmacy_id: pharmacyId,
        name: form.name.trim(),
        generic_name: form.generic_name.trim() || null,
        manufacturer: form.manufacturer.trim() || null,
        dosage_form: form.dosage_form || null,
        pack_size: parseInt(form.pack_size) || 1,
        hsn_code: form.hsn_code.trim() || null,
        gst_rate: parseInt(form.gst_rate) || 0,
        min_stock_level: parseInt(form.min_stock_level) || 10,
      });
      if (dbErr) throw dbErr;
      toast.success('Medicine added!');
      router.push('/panel/inventory');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save medicine');
    } finally { setSaving(false); }
  }

  const saleModeHints: Record<string, string> = {
    strip: 'Sell by Strip/Bottle only. Qty = 1 strip.',
    both: 'Can sell by strip or by individual tablet/unit. Qty will vary.',
    unit: 'Sell individual units only (loose tablets). Qty = 1 unit.',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}
          >
            <ArrowLeft style={{ width: 15, height: 15 }} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Add Medicine</h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>Add a new medicine to your inventory catalog</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={() => router.back()} style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.03)', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease' }}>
            Cancel
          </button>
          <button type="button" onClick={() => { const f = document.getElementById('med-form') as HTMLFormElement; f?.requestSubmit(); }}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', boxShadow: '0 6px 20px rgba(99,102,241,0.3)', transition: 'all 0.15s ease' }}>
            {saving ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 15, height: 15 }} />}
            {saving ? 'Saving...' : 'Save Medicine'}
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{ padding: '10px 16px', backgroundColor: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle style={{ width: 14, height: 14, color: C.rose, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 12, color: '#fda4af' }}>{error}</p>
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#fda4af' }}>✕</button>
        </div>
      )}

      {/* ── Form ── */}
      <form id="med-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Basic Info */}
        <Section icon={Package2} label="Basic Information">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FInput label="Medicine Name" value={form.name} onChange={set('name')} placeholder="e.g. Paracetamol 500mg" required />
            <FInput label="Generic Name / Salt Composition" value={form.generic_name} onChange={set('generic_name')} placeholder="e.g. Paracetamol" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <FInput label="Manufacturer" value={form.manufacturer} onChange={set('manufacturer')} placeholder="e.g. Cipla" />
            <FSelect label="Dosage Form" value={form.dosage_form} onChange={set('dosage_form')} required>
              {DOSAGE_FORMS.map(d => <option key={d} value={d}>{d}</option>)}
            </FSelect>
            <FInput label="Strength" value={form.strength} onChange={set('strength')} placeholder="e.g. 500mg, 10mg/5ml" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FSelect label="Category" value={form.category} onChange={set('category')}>
              <option value="">Select category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </FSelect>
            <FInput label="Barcode / EAN" value={form.barcode} onChange={set('barcode')} placeholder="Scan or type barcode" />
          </div>
        </Section>

        {/* Sale Configuration */}
        <Section icon={ShoppingBag} label="Sale Configuration" color={C.emerald}>
          <ToggleGroup
            label="Sale Mode"
            value={form.sale_mode}
            onChange={set('sale_mode')}
            options={[
              { value: 'strip', label: 'Pack Only' },
              { value: 'both', label: 'Pack + Units' },
              { value: 'unit', label: 'Units Only' },
            ]}
            hint={saleModeHints[form.sale_mode]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FInput label="Pack Size (units/strip/bottle)" value={form.pack_size} onChange={set('pack_size')} type="number" min={1} placeholder="10" />
            <FInput
              label="Units Per Pack"
              value={form.units_per_pack}
              onChange={set('units_per_pack')}
              type="number" min={1} placeholder="1"
              disabled={form.sale_mode === 'strip'}
            />
          </div>
          <div style={{ padding: '10px 14px', backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 10 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#6ee7b7', lineHeight: 1.6 }}>
              {form.sale_mode === 'strip'
                ? `1 strip = ${form.pack_size || 1} units. Sold as full strips only.`
                : form.sale_mode === 'both'
                  ? `1 strip = ${form.pack_size || 1} units. Can sell strips OR individual units at POS.`
                  : `Sold by individual unit only. ${form.units_per_pack || 1} units per pack in stock.`
              }
            </p>
          </div>
        </Section>

        {/* Tax & Regulatory */}
        <Section icon={FlaskConical} label="Tax & Regulatory" color="#f59e0b">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FSelect label="GST Rate" value={form.gst_rate} onChange={set('gst_rate')}>
              {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
            </FSelect>
            <FInput label="HSN Code" value={form.hsn_code} onChange={set('hsn_code')} placeholder="e.g. 3004" />
          </div>
        </Section>

        {/* Stock Management */}
        <Section icon={RefreshCw} label="Stock Management" color="#a78bfa">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FInput label="Min Stock Alert Level" value={form.min_stock_level} onChange={set('min_stock_level')} type="number" min={0} placeholder="10" />
            <FInput label="Reorder Quantity" value={form.reorder_qty} onChange={set('reorder_qty')} type="number" min={0} placeholder="50" />
          </div>
        </Section>

        {/* Storage & Location */}
        <Section icon={MapPin} label="Storage & Location" color="#60a5fa">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FInput label="Rack / Shelf Location" value={form.rack_no} onChange={set('rack_no')} placeholder="e.g. A-12, Shelf-3" />
            <div />
          </div>
          <FTextarea label="Notes / Remarks" value={form.notes} onChange={set('notes')} placeholder="Storage instructions, special handling notes…" />
        </Section>

        {/* Save button at bottom */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
          <button type="button" onClick={() => router.back()} style={{ padding: '10px 22px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.03)', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'wait' : 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
            {saving ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 15, height: 15 }} />}
            {saving ? 'Saving...' : 'Save Medicine'}
          </button>
        </div>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
