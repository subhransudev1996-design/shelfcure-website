'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import {
  RotateCcw, Loader2, ChevronLeft, ChevronRight,
  Truck, Calendar, Package2, Plus, Search, X, IndianRupee,
  FileText, TrendingUp,
} from 'lucide-react';

/* ─── Palette ────────────────────────────────────────── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569',
  indigo: '#6366f1', purple: '#a855f7',
  emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e', blue: '#3b82f6',
  orange: '#f97316', orangeLight: '#fb923c',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

/* ─── Types ─── */
interface PurchaseReturn {
  id: string;
  return_number: string | null;
  bill_number: string | null;
  supplier_id: string | null;
  return_date: string;
  total_amount: number;
  item_count: number | null;
  reason: string | null;
  supplier_name?: string;
}

/* ─── Sub-components ─── */
function StatCard({ label, value, sub, icon: Icon, color, loading: l }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string; loading?: boolean;
}) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', backgroundColor: `${color}08`, filter: 'blur(20px)' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</p>
        <div style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 13, height: 13, color }} />
        </div>
      </div>
      {l
        ? <div style={{ height: 28, width: '55%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.04)', animation: 'pulse 1.6s ease-in-out infinite' }} />
        : <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      }
      {sub && <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{sub}</p>}
    </div>
  );
}

/* ─── Page ─── */
export default function PurchaseReturnsPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);

  const load = useCallback(async () => {
    if (!pharmacyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchase_returns')
        .select('id, return_number, bill_number, supplier_id, return_date, total_amount, item_count, reason')
        .eq('pharmacy_id', pharmacyId)
        .order('return_date', { ascending: false })
        .limit(300);

      if (error) throw error;

      // Fetch supplier names
      const supplierIds = [...new Set((data || []).map(r => r.supplier_id).filter(Boolean))];
      let supplierMap: Record<string, string> = {};
      if (supplierIds.length > 0) {
        const { data: suppliers } = await supabase
          .from('suppliers')
          .select('id, name')
          .in('id', supplierIds);
        if (suppliers) {
          supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.name]));
        }
      }

      const enriched = (data || []).map(r => ({
        ...r,
        supplier_name: r.supplier_id ? supplierMap[r.supplier_id] || 'Unknown' : 'Unknown',
      }));

      setReturns(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, supabase]);

  useEffect(() => {
    if (pharmacyId) load();
    else setLoading(false);
  }, [pharmacyId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Filtering ─── */
  const filtered = useMemo(() => {
    if (!search.trim()) return returns;
    const q = search.toLowerCase();
    return returns.filter(r =>
      (r.return_number || '').toLowerCase().includes(q) ||
      (r.bill_number || '').toLowerCase().includes(q) ||
      (r.supplier_name || '').toLowerCase().includes(q)
    );
  }, [returns, search]);

  /* ─── Stats ─── */
  const totalValue = filtered.reduce((s, r) => s + (r.total_amount || 0), 0);
  const thisMonthReturns = filtered.filter(r => {
    const d = new Date(r.return_date);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  });
  const thisMonthValue = thisMonthReturns.reduce((s, r) => s + (r.total_amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => router.push('/panel/purchases')}
            style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.orange; e.currentTarget.style.color = C.orange; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.color = C.muted; }}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 10 }}>
              <RotateCcw style={{ width: 22, height: 22, color: C.orange }} />
              Purchase Returns
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>History of goods returned to suppliers</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/panel/purchases/returns/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 12, border: 'none',
            background: `linear-gradient(135deg, ${C.orange}, #ea580c)`,
            color: '#fff', fontSize: 13, fontWeight: 800,
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: `0 4px 14px ${C.orange}40`,
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus style={{ width: 14, height: 14 }} />
          New Return
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard label="Total Returns" value={loading ? '—' : String(filtered.length)} icon={RotateCcw} color={C.orange} loading={loading} />
        <StatCard label="Total Value Returned" value={loading ? '—' : formatCurrency(totalValue)} icon={IndianRupee} color={C.rose} loading={loading} />
        <StatCard label="This Month" value={loading ? '—' : String(thisMonthReturns.length)} sub={loading ? '' : formatCurrency(thisMonthValue)} icon={Calendar} color={C.blue} loading={loading} />
        <StatCard label="Avg. Return Value" value={loading ? '—' : formatCurrency(filtered.length > 0 ? totalValue / filtered.length : 0)} icon={TrendingUp} color={C.purple} loading={loading} />
      </div>

      {/* ── Search ── */}
      <div style={{ position: 'relative' }}>
        <Search style={{ width: 14, height: 14, position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: searchFocus ? C.orange : C.muted, transition: 'color 0.2s' }} />
        <input
          type="text"
          placeholder="Search by return number, bill number, or supplier…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          style={{
            width: '100%', padding: '12px 36px 12px 38px',
            borderRadius: 12, border: `1px solid ${searchFocus ? C.orange + '60' : C.cardBorder}`,
            backgroundColor: C.input, color: C.text, fontSize: 13, fontWeight: 600,
            outline: 'none', transition: 'all 0.2s',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {/* ── List ── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 10, color: C.muted }}>
          <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 13 }}>Loading returns…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: `2px dashed ${C.cardBorder}`, borderRadius: 20 }}>
          <RotateCcw style={{ width: 44, height: 44, color: 'rgba(255,255,255,0.08)', marginBottom: 14 }} />
          <p style={{ margin: 0, color: C.muted, fontWeight: 700, fontSize: 14 }}>
            {search ? 'No returns match your search' : 'No purchase returns yet'}
          </p>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>
            {search ? 'Try a different search term' : 'Create your first return by clicking "New Return"'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {filtered.map(r => (
            <button
              key={r.id}
              onClick={() => router.push(`/panel/purchases/returns/${r.id}`)}
              style={{
                backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18,
                padding: 20, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', gap: 14,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.orange + '50'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${C.orange}18, ${C.orange}08)`, border: `1px solid ${C.orange}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <RotateCcw style={{ width: 18, height: 18, color: C.orange }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontWeight: 800, color: C.text, fontSize: 14, fontFamily: 'monospace' }}>
                    {r.return_number || `RET-${r.id.slice(0, 8)}`}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <Truck style={{ width: 12, height: 12, color: C.muted }} />
                    <span style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.supplier_name || 'Unknown Supplier'}</span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Return Value</p>
                <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 900, color: C.orange, letterSpacing: '-0.02em' }}>{formatCurrency(r.total_amount || 0)}</p>
              </div>

              {/* Footer */}
              <div style={{ borderTop: `1px solid ${C.cardBorder}`, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: C.muted }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar style={{ width: 12, height: 12 }} />
                    {formatDate(r.return_date)}
                  </span>
                  {r.bill_number && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Package2 style={{ width: 12, height: 12 }} />
                      #{r.bill_number}
                    </span>
                  )}
                </div>
                <ChevronRight style={{ width: 14, height: 14, color: C.muted }} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
