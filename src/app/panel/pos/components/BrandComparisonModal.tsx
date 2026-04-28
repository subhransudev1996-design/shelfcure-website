'use client';

import { useEffect, useState } from 'react';
import { X, ArrowLeftRight, Package, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { PosMedicine } from '@/store/posCartStore';

const C = {
  card: '#0d1225',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  emerald: '#10b981',
  rose: '#f43f5e',
};

interface Alternative {
  id: string;
  name: string;
  manufacturer: string | null;
  salt_composition: string | null;
  strength: string | null;
  mrp: number | null;
  total_stock: number;
  is_current: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  pharmacyId: string;
  source: PosMedicine | null;
  /** Called when user picks an alternative to add to cart */
  onPick: (medicineId: string) => void;
}

export function BrandComparisonModal({ open, onClose, pharmacyId, source, onPick }: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [alts, setAlts] = useState<Alternative[]>([]);
  const [sortBy, setSortBy] = useState<'price' | 'stock'>('price');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !source?.salt_composition) { setAlts([]); return; }
    let valid = true;
    setLoading(true);
    (async () => {
      try {
        // Fetch medicines with same salt + strength
        let q = supabase
          .from('medicines')
          .select('id, name, manufacturer, salt_composition, strength, batches(mrp, stock_quantity)')
          .eq('pharmacy_id', pharmacyId)
          .ilike('salt_composition', source.salt_composition!.trim())
          .limit(30);
        if (source.strength) q = q.ilike('strength', source.strength);
        const { data } = await q;
        if (!valid) return;
        const list: Alternative[] = (data || []).map((m: any) => {
          const stock = (m.batches || []).reduce((s: number, b: any) => s + (Number(b.stock_quantity) || 0), 0);
          const minMrp = (m.batches || []).reduce(
            (acc: number | null, b: any) => acc == null ? Number(b.mrp) : Math.min(acc, Number(b.mrp)), null,
          );
          return {
            id: String(m.id),
            name: m.name,
            manufacturer: m.manufacturer,
            salt_composition: m.salt_composition,
            strength: m.strength,
            mrp: minMrp,
            total_stock: stock,
            is_current: String(m.id) === source.id,
          };
        });
        setAlts(list);
      } finally {
        if (valid) setLoading(false);
      }
    })();
    return () => { valid = false; };
  }, [open, source, pharmacyId, supabase]);

  if (!open) return null;
  const sorted = [...alts].sort((a, b) => {
    if (sortBy === 'stock') return b.total_stock - a.total_stock;
    return (a.mrp ?? 9999) - (b.mrp ?? 9999);
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 540, maxHeight: '85vh', display: 'flex', flexDirection: 'column', backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeftRight style={{ width: 16, height: 16, color: C.primaryLight }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.text }}>Brand Alternatives</h3>
            {source && (
              <p style={{ margin: '3px 0 0', fontSize: 11, color: C.muted }}>
                <span style={{ color: C.primaryLight, fontWeight: 700 }}>{source.salt_composition}</span>
                {source.strength && ` · ${source.strength}`}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', backgroundColor: 'rgba(255,255,255,0.05)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderBottom: `1px solid ${C.cardBorder}` }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sort</span>
          {(['price', 'stock'] as const).map((s) => (
            <button key={s} onClick={() => setSortBy(s)} style={{
              padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 800,
              background: sortBy === s ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
              color: sortBy === s ? C.primaryLight : C.muted,
            }}>
              {s === 'price' ? '₹ Price' : '📦 Stock'}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <Loader2 style={{ width: 22, height: 22, color: C.primary, animation: 'spin 1s linear infinite', display: 'inline-block' }} />
              <p style={{ margin: '8px 0 0', fontSize: 12, color: C.muted }}>Finding alternatives…</p>
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: C.muted }}>
              <Package style={{ width: 28, height: 28, color: 'rgba(148,163,184,0.4)', display: 'inline-block', marginBottom: 6 }} />
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>No alternatives found</p>
              <p style={{ margin: '4px 0 0', fontSize: 11 }}>No other brands with this salt & strength</p>
            </div>
          ) : (
            sorted.map((alt) => (
              <div key={alt.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                borderBottom: `1px solid rgba(255,255,255,0.03)`,
                background: alt.is_current ? 'rgba(99,102,241,0.05)' : 'transparent',
                opacity: alt.total_stock === 0 ? 0.5 : 1,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package style={{ width: 14, height: 14, color: C.primaryLight }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alt.name}</p>
                    {alt.is_current && (
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: 'rgba(99,102,241,0.2)', color: C.primaryLight }}>CURRENT</span>
                    )}
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alt.manufacturer || '—'}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.primaryLight }}>{alt.mrp != null ? `₹${alt.mrp.toFixed(2)}` : '—'}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 700, color: alt.total_stock > 0 ? C.emerald : C.rose }}>
                    {alt.total_stock > 0 ? `${alt.total_stock} in stock` : 'Out of stock'}
                  </p>
                </div>
                {!alt.is_current && alt.total_stock > 0 && (
                  <button
                    onClick={() => { onPick(alt.id); onClose(); }}
                    style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: C.emerald, color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                  >
                    Add to Bill
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
