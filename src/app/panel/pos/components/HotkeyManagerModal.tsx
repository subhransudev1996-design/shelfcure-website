'use client';

import { useEffect, useState } from 'react';
import { X, Keyboard, Search, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { type PosHotkey, setHotkey as persistHotkey, removeHotkey as persistRemove } from '@/lib/posDraft';

const C = {
  card: '#0d1225',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc',
  muted: '#94a3b8',
  inputBg: 'rgba(255,255,255,0.03)',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  rose: '#f43f5e',
  emerald: '#10b981',
  violet: '#8b5cf6',
};

interface SearchHit {
  id: string;
  name: string;
  manufacturer: string | null;
  mrp: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  pharmacyId: string;
  hotkeys: PosHotkey[];
  onChange: (next: PosHotkey[]) => void;
}

export function HotkeyManagerModal({ open, onClose, pharmacyId, hotkeys, onChange }: Props) {
  const supabase = createClient();
  const [assigning, setAssigning] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) { setAssigning(null); setQuery(''); setResults([]); }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('medicines')
        .select('id, name, manufacturer, batches(mrp)')
        .eq('pharmacy_id', pharmacyId)
        .ilike('name', `%${query}%`)
        .limit(8);
      setResults((data || []).map((m: any) => ({
        id: String(m.id),
        name: m.name,
        manufacturer: m.manufacturer,
        mrp: (m.batches?.[0]?.mrp ?? null) as number | null,
      })));
    }, 250);
    return () => clearTimeout(t);
  }, [query, pharmacyId, supabase]);

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 540, maxHeight: '85vh', display: 'flex', flexDirection: 'column', backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Keyboard style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.text }}>Quick Access Hotkeys</h3>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>Press Alt + [1–9] anywhere on this page to add instantly</p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', backgroundColor: 'rgba(255,255,255,0.05)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
            const assigned = hotkeys.find((h) => h.digit === digit);
            const isAssigning = assigning === digit;
            return (
              <div key={digit} style={{ marginBottom: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                  borderRadius: 12,
                  border: `2px ${isAssigning ? 'solid' : assigned ? 'solid' : 'dashed'} ${isAssigning ? 'rgba(139,92,246,0.5)' : assigned ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  background: isAssigning ? 'rgba(139,92,246,0.08)' : assigned ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                }}>
                  <kbd style={{ minWidth: 64, height: 30, padding: '0 8px', borderRadius: 8, background: '#1e293b', color: '#fff', fontSize: 11, fontWeight: 800, fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    Alt+{digit}
                  </kbd>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {assigned ? (
                      <>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assigned.medicine_name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {assigned.manufacturer || '—'}{assigned.mrp ? ` · ₹${assigned.mrp.toFixed(2)}` : ''}
                        </p>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: 11, color: C.muted, fontStyle: 'italic' }}>Empty slot</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {assigned && (
                      <button
                        onClick={() => onChange(persistRemove(pharmacyId, digit))}
                        style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(244,63,94,0.25)', background: 'rgba(244,63,94,0.1)', color: C.rose, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    )}
                    <button
                      onClick={() => { setAssigning(isAssigning ? null : digit); setQuery(''); setResults([]); }}
                      style={{
                        padding: '5px 10px', borderRadius: 8, border: 'none',
                        background: isAssigning ? C.violet : 'rgba(139,92,246,0.15)',
                        color: isAssigning ? '#fff' : C.violet,
                        fontSize: 10, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      {isAssigning ? 'Cancel' : assigned ? 'Change' : 'Assign'}
                    </button>
                  </div>
                </div>
                {isAssigning && (
                  <div style={{ marginLeft: 76, marginTop: 8 }}>
                    <div style={{ position: 'relative' }}>
                      <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: C.muted }} />
                      <input
                        autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search medicine to assign…"
                        style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: `1px solid rgba(139,92,246,0.3)`, background: C.inputBg, color: C.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    {results.length > 0 && (
                      <div style={{ marginTop: 6, background: 'rgba(255,255,255,0.02)', border: `1px solid rgba(139,92,246,0.2)`, borderRadius: 10, maxHeight: 180, overflowY: 'auto' }}>
                        {results.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              const next = persistHotkey(pharmacyId, {
                                digit, medicine_id: m.id, medicine_name: m.name,
                                manufacturer: m.manufacturer, mrp: m.mrp,
                              });
                              onChange(next);
                              setAssigning(null); setQuery(''); setResults([]);
                            }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid rgba(255,255,255,0.03)` }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Package style={{ width: 13, height: 13, color: C.muted, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {m.manufacturer || '—'}{m.mrp ? ` · ₹${m.mrp.toFixed(2)}` : ''}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '10px 20px', borderTop: `1px solid ${C.cardBorder}`, background: 'rgba(255,255,255,0.02)' }}>
          <p style={{ margin: 0, fontSize: 10, color: C.muted, textAlign: 'center' }}>
            Hotkeys persist per browser. Press <kbd style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: 9 }}>Alt + digit</kbd> on the POS page.
          </p>
        </div>
      </div>
    </div>
  );
}
