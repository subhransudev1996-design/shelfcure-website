'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency } from '@/lib/utils/format';
import {
  Package2, Plus, AlertTriangle, Clock, ChevronRight, Loader2,
  Search, X, TrendingDown, AlertCircle, BarChart3, RefreshCw, IndianRupee,
  MapPin,
} from 'lucide-react';

/* ─── Types ───────────────────────────────────────────────── */
interface Medicine {
  id: string; name: string; generic_name: string | null;
  manufacturer: string | null; dosage_form: string | null;
  pack_size: number; hsn_code: string | null; gst_rate: number;
  min_stock_level: number;
  sale_unit_mode: 'pack' | 'both' | null;
  units_per_pack: number;
  pack_unit: string | null;
  rack_location: string | null;
  // joined
  total_quantity: number; batch_count: number; min_expiry: string | null;
  purchase_price: number | null; mrp: number | null;
}
type StockFilter = 'all' | 'low' | 'expiring' | 'expired';

/* ─── Palette ─────────────────────────────────────────────── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569', faint: '#1e293b',
  indigo: '#6366f1', indigoLight: '#818cf8',
  emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

/* ─── Sub-components ──────────────────────────────────────── */
function StockBadge({ qty, min, upp, mode, packUnit }: {
  qty: number; min: number;
  upp: number; mode: 'pack' | 'both' | null; packUnit: string | null;
}) {
  const isOut = qty === 0;
  const isLow = qty > 0 && qty < min;
  const color = isOut ? C.rose : isLow ? C.amber : C.emerald;
  const isFlex = mode === 'both' && upp > 1;
  const strips = isFlex ? Math.floor(qty / upp) : 0;
  const loose = isFlex ? qty - strips * upp : 0;
  const stripLabel = (packUnit || 'Strip').toLowerCase().startsWith('strip') ? 'str' : (packUnit || 'pk').slice(0, 3).toLowerCase();
  let primary: string;
  if (isOut) primary = 'Out';
  else if (isFlex) {
    const parts: string[] = [];
    if (strips > 0) parts.push(`${strips} ${stripLabel}`);
    if (loose > 0) parts.push(`${loose} u`);
    primary = parts.length ? parts.join(' + ') : `${qty} u`;
  } else {
    primary = `${qty}`;
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 20,
      backgroundColor: `${color}15`,
      color, fontSize: 11, fontWeight: 800,
      whiteSpace: 'nowrap',
    }}>
      {isOut && <AlertTriangle style={{ width: 10, height: 10 }} />}
      {primary}
      {isLow && !isOut && ' ⚠'}
    </span>
  );
}

function PriceCell({ value }: { value: number | null }) {
  if (value == null) return <span style={{ color: '#334155', fontSize: 11 }}>—</span>;
  return <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{formatCurrency(value)}</span>;
}

function ExpiryBadge({ date }: { date: string | null }) {
  if (!date) return <span style={{ color: C.muted, fontSize: 11 }}>—</span>;
  const today = new Date().toISOString().split('T')[0];
  const d30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const expired = date < today;
  const expiring = !expired && date <= d30;
  const color = expired ? C.rose : expiring ? C.amber : C.muted;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color }}>
      {(expired || expiring) && <Clock style={{ width: 10, height: 10 }} />}
      {date}
    </span>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function InventoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [all, setAll] = useState<Medicine[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [searchFocus, setSearchFocus] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!pharmacyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: meds } = await supabase
        .from('medicines')
        .select('id, name, generic_name, manufacturer, dosage_form, pack_size, hsn_code, gst_rate, min_stock_level, sale_unit_mode, units_per_pack, pack_unit, rack_location')
        .eq('pharmacy_id', pharmacyId)
        .order('name')
        .limit(300);

      const enriched: Medicine[] = await Promise.all(
        (meds || []).map(async (med: {
          id: string; name: string; generic_name: string | null; manufacturer: string | null;
          dosage_form: string | null; pack_size: number; hsn_code: string | null;
          gst_rate: number; min_stock_level: number;
          sale_unit_mode: 'pack' | 'both' | null; units_per_pack: number | null; pack_unit: string | null;
          rack_location: string | null;
        }) => {
          const { data: batches } = await supabase
            .from('batches')
            .select('stock_quantity, expiry_date, purchase_price, mrp')
            .eq('medicine_id', med.id)
            .eq('pharmacy_id', pharmacyId);

          const active = (batches || []).filter(b => b.stock_quantity > 0);
          const totalQty = active.reduce((s, b) => s + (b.stock_quantity || 0), 0);
          const minExpiry = active.length
            ? active.reduce((min, b) => (!min || b.expiry_date < min ? b.expiry_date : min), '')
            : null;
          // latest batch prices
          const last = batches && batches.length > 0 ? batches[batches.length - 1] : null;

          return {
            ...med,
            sale_unit_mode: med.sale_unit_mode ?? null,
            units_per_pack: med.units_per_pack ?? 1,
            pack_unit: med.pack_unit ?? null,
            total_quantity: totalQty,
            batch_count: batches?.length ?? 0, min_expiry: minExpiry,
            purchase_price: last?.purchase_price ?? null,
            mrp: last?.mrp ?? null,
          };
        })
      );
      setAll(enriched);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [pharmacyId, supabase]);

  // Trigger load whenever pharmacyId becomes available
  useEffect(() => {
    if (pharmacyId) { load(); }
    else { setLoading(false); }
  }, [pharmacyId]); // eslint-disable-line react-hooks/exhaustive-deps

  // debounced search + filter
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];
      const d30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      let f = all;
      if (search) {
        const q = search.toLowerCase();
        f = f.filter(m =>
          m.name.toLowerCase().includes(q) ||
          (m.generic_name || '').toLowerCase().includes(q) ||
          (m.manufacturer || '').toLowerCase().includes(q) ||
          (m.dosage_form || '').toLowerCase().includes(q) ||
          (m.rack_location || '').toLowerCase().includes(q)
        );
      }
      if (filter === 'low') f = f.filter(m => m.total_quantity > 0 && m.total_quantity < m.min_stock_level);
      else if (filter === 'expired') f = f.filter(m => m.min_expiry && m.min_expiry < today);
      else if (filter === 'expiring') f = f.filter(m => m.min_expiry && m.min_expiry >= today && m.min_expiry <= d30);
      setMedicines(f);
    }, 150);
  }, [all, search, filter]);

  /* ─── Stats ── */
  const today = new Date().toISOString().split('T')[0];
  const d30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const stats = {
    total: all.length,
    low: all.filter(m => m.total_quantity > 0 && m.total_quantity < m.min_stock_level).length,
    expiring: all.filter(m => m.min_expiry && m.min_expiry >= today && m.min_expiry <= d30).length,
    expired: all.filter(m => m.min_expiry && m.min_expiry < today).length,
  };

  const filters: { key: StockFilter; label: string; icon: React.ElementType; count: number; color: string }[] = [
    { key: 'all', label: 'All Medicines', icon: BarChart3, count: stats.total, color: C.indigoLight },
    { key: 'low', label: 'Low Stock', icon: TrendingDown, count: stats.low, color: C.amber },
    { key: 'expiring', label: 'Expiring Soon', icon: Clock, count: stats.expiring, color: C.amber },
    { key: 'expired', label: 'Expired', icon: AlertCircle, count: stats.expired, color: C.rose },
  ];

  /* ─── Columns ── */
  const COL = '1fr 90px 75px 80px 90px 100px 105px 105px 36px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Inventory</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>{all.length} medicines in catalog</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={load}
            disabled={loading}
            style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}
          >
            <RefreshCw style={{ width: 14, height: 14, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button
            onClick={() => router.push('/panel/inventory/add')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.3)', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.3)'; }}
          >
            <Plus style={{ width: 15, height: 15 }} />
            Add Medicine
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
              backgroundColor: filter === f.key ? `${f.color}18` : 'rgba(255,255,255,0.03)',
              outline: filter === f.key ? `1.5px solid ${f.color}40` : `1px solid ${C.cardBorder}`,
              color: filter === f.key ? f.color : C.muted,
              fontSize: 12, fontWeight: 700, transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { if (filter !== f.key) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.text; } }}
            onMouseLeave={e => { if (filter !== f.key) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = C.muted; } }}
          >
            <f.icon style={{ width: 13, height: 13 }} />
            {f.label}
            <span style={{ padding: '1px 7px', borderRadius: 10, backgroundColor: filter === f.key ? `${f.color}25` : 'rgba(255,255,255,0.04)', fontSize: 10, fontWeight: 900, color: filter === f.key ? f.color : '#334155' }}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 44, backgroundColor: searchFocus ? '#111827' : C.input, border: `1.5px solid ${searchFocus ? C.indigo : C.inputBorder}`, borderRadius: 12, transition: 'all 0.15s ease', boxShadow: searchFocus ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none' }}>
        <Search style={{ width: 15, height: 15, color: searchFocus ? C.indigoLight : C.muted, flexShrink: 0 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          placeholder="Search by name, manufacturer, rack..."
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: C.text, fontFamily: 'inherit' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 2 }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 style={{ width: 20, height: 20, color: C.indigo, animation: 'spin 1s linear infinite' }} />
          </div>
          <p style={{ margin: 0, fontSize: 12, color: C.muted }}>Loading medicines...</p>
        </div>
      ) : medicines.length === 0 ? (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 32px', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package2 style={{ width: 24, height: 24, color: '#1e293b' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#334155' }}>No medicines found</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#1e293b' }}>
              {search ? 'Try a different search term' : 'Start by adding your first medicine'}
            </p>
          </div>
          {!search && (
            <button onClick={() => router.push('/panel/inventory/add')} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
              Add Medicine
            </button>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: COL, padding: '10px 20px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.015)', alignItems: 'center' }}>
            {['Medicine', 'Form', 'Rack', 'Stock', 'Batches', 'Nearest Expiry',
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IndianRupee style={{ width: 10, height: 10 }} />Purchase</span>,
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IndianRupee style={{ width: 10, height: 10 }} />MRP</span>,
              '',
            ].map((h, idx) => (
              <p key={idx} style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{h}</p>
            ))}
          </div>
          {/* Rows */}
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 360px)' }}>
            {medicines.map((med, i) => (
              <div
                key={med.id}
                onClick={() => router.push(`/panel/inventory/${med.id}`)}
                style={{
                  display: 'grid', gridTemplateColumns: COL,
                  alignItems: 'center', padding: '13px 20px', cursor: 'pointer',
                  borderBottom: i < medicines.length - 1 ? `1px solid rgba(255,255,255,0.03)` : 'none',
                  transition: 'background 0.12s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {/* Medicine name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package2 style={{ width: 14, height: 14, color: C.indigoLight }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{med.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[med.generic_name, med.manufacturer].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                {/* Form */}
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {med.dosage_form || '—'}
                </span>
                {/* Rack */}
                {med.rack_location ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, padding: '2px 8px', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)', color: C.text, fontWeight: 700, fontFamily: 'monospace', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <MapPin style={{ width: 9, height: 9, color: C.indigoLight, flexShrink: 0 }} />
                    {med.rack_location}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: '#334155' }}>—</span>
                )}
                {/* Stock */}
                <div><StockBadge qty={med.total_quantity} min={med.min_stock_level || 10} upp={med.units_per_pack || 1} mode={med.sale_unit_mode} packUnit={med.pack_unit} /></div>
                {/* Batches */}
                <p style={{ margin: 0, fontSize: 12, color: C.muted, fontWeight: 600 }}>{med.batch_count}</p>
                {/* Expiry */}
                <div><ExpiryBadge date={med.min_expiry} /></div>
                {/* Purchase */}
                <PriceCell value={med.purchase_price} />
                {/* MRP */}
                <PriceCell value={med.mrp} />
                {/* Arrow */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ChevronRight style={{ width: 14, height: 14, color: '#1e293b' }} />
                </div>
              </div>
            ))}
          </div>
          {/* Footer */}
          <div style={{ padding: '10px 20px', borderTop: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.01)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#334155', fontWeight: 500 }}>Showing {medicines.length} of {all.length} medicines</p>
            {(filter !== 'all' || search) && (
              <button onClick={() => { setFilter('all'); setSearch(''); }} style={{ fontSize: 11, fontWeight: 700, color: C.indigo, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <X style={{ width: 10, height: 10 }} /> Clear filters
              </button>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
