'use client';
import { useState } from 'react';

export const C = {
  bg: '#060914', card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569', mutedLight: '#64748b',
  indigo: '#6366f1', indigoLight: '#818cf8',
  emerald: '#10b981', emeraldLight: '#34d399',
  violet: '#8b5cf6', violetLight: '#a78bfa',
  amber: '#f59e0b', amberLight: '#fbbf24',
  rose: '#f43f5e', roseLight: '#fb7185',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

export const DOSAGE_FORMS = ['Tablet','Capsule','Syrup','Injection','Cream','Drops','Inhaler','Ointment','Powder','Solution','Gel','Lotion','Suppository','Other'];
export const PACK_UNITS = ['Strip','Box','Bottle','Tube','Vial','Ampoule','Sachet','Piece'];
export const GST_RATES = [0, 5, 12, 18, 28];

export function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>
      {text}{required && <span style={{ color: C.rose, marginLeft: 2 }}>*</span>}
    </label>
  );
}

export function FInput({ label, value, onChange, type = 'text', placeholder, required, min, max, step, disabled, onFocus, onBlur, hasIcon, icon }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; min?: number | string; max?: number | string; step?: string; disabled?: boolean;
  onFocus?: () => void; onBlur?: () => void; hasIcon?: boolean; icon?: React.ReactNode;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <Label text={label} required={required} />
      <div style={{ position: 'relative' }}>
        {icon && <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none', display: 'flex' }}>{icon}</div>}
        <input
          type={type} value={value} placeholder={placeholder} required={required}
          min={min} max={max} step={step} disabled={disabled}
          onChange={e => onChange(e.target.value)}
          onFocus={() => { setFocus(true); onFocus?.(); }}
          onBlur={() => { setFocus(false); onBlur?.(); }}
          style={{
            width: '100%', padding: icon ? '9px 12px 9px 32px' : '9px 12px', boxSizing: 'border-box',
            backgroundColor: disabled ? 'rgba(255,255,255,0.02)' : (focus ? '#131929' : C.input),
            border: `1.5px solid ${focus ? C.indigo : C.inputBorder}`,
            borderRadius: 9, color: disabled ? C.muted : C.text, fontSize: 13, fontWeight: 500,
            outline: 'none', fontFamily: 'inherit',
            boxShadow: focus ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
            transition: 'all 0.15s ease', cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
      </div>
    </div>
  );
}

export function FSelect({ label, value, onChange, children, required }: {
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
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
        }}
      >
        {children}
      </select>
    </div>
  );
}

export function Section({ icon: Icon, label, color, children }: {
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

export function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${C.cardBorder}` }}>
      <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: value ? C.text : C.muted, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
        {value || '—'}
      </span>
    </div>
  );
}
