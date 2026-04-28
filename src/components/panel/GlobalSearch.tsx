'use client';

import { useState, useEffect, useRef, useCallback, useMemo, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import {
  Search, X, Users, Truck, Package, Receipt, FileText, Loader2, CornerDownLeft,
} from 'lucide-react';

const BORDER = 'rgba(255,255,255,0.06)';

type ResultKind = 'customer' | 'supplier' | 'medicine' | 'sale' | 'purchase';

interface SearchResult {
  kind: ResultKind;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

const KIND_META: Record<ResultKind, { label: string; icon: typeof Users; color: string; bg: string }> = {
  customer: { label: 'Customers', icon: Users, color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
  supplier: { label: 'Suppliers', icon: Truck, color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  medicine: { label: 'Medicines', icon: Package, color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  sale: { label: 'Sales', icon: Receipt, color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
  purchase: { label: 'Purchases', icon: FileText, color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
};

const KIND_ORDER: ResultKind[] = ['medicine', 'customer', 'supplier', 'sale', 'purchase'];

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reqIdRef = useRef(0);

  // Focus input on open, reset state on close
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQuery('');
      setResults([]);
      setActiveIdx(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q || !pharmacyId) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const myReq = ++reqIdRef.current;
    const handle = setTimeout(async () => {
      const like = `%${q.replace(/[%_]/g, (c) => `\\${c}`)}%`;
      const [meds, customers, suppliers, sales, purchases] = await Promise.all([
        supabase
          .from('medicines')
          .select('id, name, generic_name, manufacturer')
          .eq('pharmacy_id', pharmacyId)
          .or(`name.ilike.${like},generic_name.ilike.${like},manufacturer.ilike.${like}`)
          .limit(5),
        supabase
          .from('customers')
          .select('id, name, phone')
          .eq('pharmacy_id', pharmacyId)
          .or(`name.ilike.${like},phone.ilike.${like}`)
          .limit(5),
        supabase
          .from('suppliers')
          .select('id, name, phone, gstin')
          .eq('pharmacy_id', pharmacyId)
          .or(`name.ilike.${like},phone.ilike.${like},gstin.ilike.${like}`)
          .limit(5),
        supabase
          .from('sales')
          .select('id, patient_name, doctor_name, bill_date, total_amount')
          .eq('pharmacy_id', pharmacyId)
          .or(`patient_name.ilike.${like},doctor_name.ilike.${like}`)
          .order('bill_date', { ascending: false })
          .limit(5),
        supabase
          .from('purchases')
          .select('id, bill_number, bill_date, total_amount, suppliers(name)')
          .eq('pharmacy_id', pharmacyId)
          .ilike('bill_number', like)
          .order('bill_date', { ascending: false })
          .limit(5),
      ]);

      // Drop stale responses
      if (myReq !== reqIdRef.current) return;

      const next: SearchResult[] = [];

      (meds.data || []).forEach((m: any) => {
        const sub = [m.generic_name, m.manufacturer].filter(Boolean).join(' · ') || undefined;
        next.push({ kind: 'medicine', id: m.id, title: m.name, subtitle: sub, href: `/panel/inventory/${m.id}` });
      });
      (customers.data || []).forEach((c: any) => {
        next.push({ kind: 'customer', id: c.id, title: c.name, subtitle: c.phone || undefined, href: '/panel/customers' });
      });
      (suppliers.data || []).forEach((s: any) => {
        const sub = [s.phone, s.gstin].filter(Boolean).join(' · ') || undefined;
        next.push({ kind: 'supplier', id: s.id, title: s.name, subtitle: sub, href: '/panel/suppliers' });
      });
      (sales.data || []).forEach((s: any) => {
        const date = s.bill_date ? new Date(s.bill_date).toLocaleDateString() : '';
        const amt = s.total_amount ? `₹${Number(s.total_amount).toFixed(0)}` : '';
        const sub = [date, amt, s.doctor_name && `Dr. ${s.doctor_name}`].filter(Boolean).join(' · ');
        next.push({ kind: 'sale', id: s.id, title: s.patient_name || 'Walk-in', subtitle: sub || undefined, href: `/panel/sales/${s.id}` });
      });
      (purchases.data || []).forEach((p: any) => {
        const date = p.bill_date ? new Date(p.bill_date).toLocaleDateString() : '';
        const amt = p.total_amount ? `₹${Number(p.total_amount).toFixed(0)}` : '';
        const sup = p.suppliers?.name;
        const sub = [sup, date, amt].filter(Boolean).join(' · ');
        next.push({ kind: 'purchase', id: p.id, title: `Bill #${p.bill_number || p.id.slice(0, 8)}`, subtitle: sub || undefined, href: `/panel/purchases/${p.id}` });
      });

      // Sort by KIND_ORDER for consistent grouping
      next.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));

      setResults(next);
      setActiveIdx(0);
      setLoading(false);
    }, 250);

    return () => clearTimeout(handle);
  }, [query, pharmacyId, open, supabase]);

  const navigate = useCallback((r: SearchResult) => {
    router.push(r.href);
    onClose();
  }, [router, onClose]);

  // Keyboard handlers
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        const r = results[activeIdx];
        if (r) {
          e.preventDefault();
          navigate(r);
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, results, activeIdx, navigate, onClose]);

  // Scroll active row into view
  useEffect(() => {
    if (!listRef.current) return;
    const row = listRef.current.querySelector<HTMLElement>(`[data-row-idx="${activeIdx}"]`);
    if (row) row.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  if (!open) return null;

  // Group results by kind (preserves the KIND_ORDER sort applied earlier)
  const grouped: { kind: ResultKind; items: SearchResult[]; startIdx: number }[] = [];
  let runningIdx = 0;
  for (const kind of KIND_ORDER) {
    const items = results.filter((r) => r.kind === kind);
    if (items.length) {
      grouped.push({ kind, items, startIdx: runningIdx });
      runningIdx += items.length;
    }
  }

  const overlay: CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(2,4,15,0.7)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    paddingTop: '12vh', paddingLeft: 16, paddingRight: 16,
    animation: 'gsFade 0.15s ease',
  };

  const panel: CSSProperties = {
    width: '100%', maxWidth: 640,
    background: '#0b0f24',
    border: `1px solid rgba(255,255,255,0.08)`,
    borderRadius: 18,
    boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
    overflow: 'hidden',
    animation: 'gsPop 0.18s cubic-bezier(0.4,0,0.2,1)',
  };

  return (
    <div style={overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panel}>
        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${BORDER}` }}>
          <Search style={{ width: 16, height: 16, color: '#64748b', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, suppliers, medicines, sales, purchases…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#f1f5f9', fontSize: 14, fontWeight: 500,
            }}
          />
          {loading && <Loader2 style={{ width: 14, height: 14, color: '#818cf8', animation: 'gsSpin 0.8s linear infinite' }} />}
          <button
            onClick={onClose}
            style={{
              border: 'none', background: 'rgba(255,255,255,0.04)', color: '#64748b',
              borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
            title="Close (Esc)"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Results / states */}
        <div ref={listRef} style={{ maxHeight: '60vh', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
          {!query.trim() ? (
            <EmptyHint />
          ) : !pharmacyId ? (
            <CenterMessage title="No pharmacy selected" subtitle="Pick a pharmacy from the sidebar to enable search." />
          ) : loading && results.length === 0 ? (
            <CenterMessage title="Searching…" subtitle="Looking across your pharmacy data." />
          ) : results.length === 0 ? (
            <CenterMessage title="No matches" subtitle={`Nothing found for "${query.trim()}".`} />
          ) : (
            grouped.map(({ kind, items, startIdx }) => {
              const meta = KIND_META[kind];
              const Icon = meta.icon;
              return (
                <div key={kind}>
                  <div style={{
                    padding: '10px 16px 6px', fontSize: 10, fontWeight: 800,
                    color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <Icon style={{ width: 11, height: 11, color: meta.color }} />
                    {meta.label}
                  </div>
                  {items.map((r, i) => {
                    const idx = startIdx + i;
                    const active = idx === activeIdx;
                    return (
                      <div
                        key={`${r.kind}-${r.id}`}
                        data-row-idx={idx}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => navigate(r)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 16px', cursor: 'pointer',
                          background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                          borderLeft: `3px solid ${active ? '#818cf8' : 'transparent'}`,
                          transition: 'background 0.1s',
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                          background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon style={{ width: 14, height: 14, color: meta.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.title}
                          </p>
                          {r.subtitle && (
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {r.subtitle}
                            </p>
                          )}
                        </div>
                        {active && (
                          <CornerDownLeft style={{ width: 13, height: 13, color: '#818cf8', flexShrink: 0 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '10px 16px', borderTop: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', gap: 14, fontSize: 10, color: '#475569', fontWeight: 600,
          background: 'rgba(255,255,255,0.01)',
        }}>
          <KbdHint label="↑↓" desc="navigate" />
          <KbdHint label="↵" desc="open" />
          <KbdHint label="esc" desc="close" />
        </div>
      </div>

      <style>{`
        @keyframes gsFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes gsPop { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes gsSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function EmptyHint() {
  return (
    <div style={{ padding: '28px 20px' }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Search across
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {KIND_ORDER.map((k) => {
          const meta = KIND_META[k];
          const Icon = meta.icon;
          return (
            <div key={k} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', borderRadius: 999,
              background: meta.bg, border: `1px solid ${meta.color}22`,
              fontSize: 11, fontWeight: 700, color: meta.color,
            }}>
              <Icon style={{ width: 11, height: 11 }} />
              {meta.label}
            </div>
          );
        })}
      </div>
      <p style={{ margin: '14px 0 0', fontSize: 11, color: '#475569', lineHeight: 1.5 }}>
        Try a name, phone number, GSTIN, bill number, or medicine.
      </p>
    </div>
  );
}

function CenterMessage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{title}</p>
      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#475569' }}>{subtitle}</p>
    </div>
  );
}

function KbdHint({ label, desc }: { label: string; desc: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <kbd style={{
        padding: '2px 6px', background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${BORDER}`, borderRadius: 5, fontSize: 9,
        color: '#94a3b8', fontFamily: 'monospace',
      }}>{label}</kbd>
      <span>{desc}</span>
    </span>
  );
}
