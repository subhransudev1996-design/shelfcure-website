'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency } from '@/lib/utils/format';
import {
  FileBarChart, ChevronLeft, Loader2, Search,
  AlertTriangle, CheckCircle2, Package,
  TrendingDown, IndianRupee, ShoppingCart, Download,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import BulkReorderModal, { type StockSummaryItem } from './BulkReorderModal';

/* ─── Palette ────────────────────────────────────────── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  cardHover: '#0f1530',
  text: '#f1f5f9', muted: '#475569', subtle: '#94a3b8',
  purple: '#a855f7', purpleLight: '#c084fc',
  indigo: '#6366f1', indigoLight: '#818cf8',
  emerald: '#10b981', emeraldLight: '#34d399',
  rose: '#f43f5e', roseLight: '#fb7185',
  orange: '#f97316',
  input: '#0d1127', inputBorder: 'rgba(255,255,255,0.1)',
};

type SortKey = 'name' | 'qty' | 'value' | 'expiry';
type FilterKey = 'all' | 'low' | 'ok';

export default function StockReportPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId  = usePanelStore((s) => s.pharmacyId);
  const pharmacyName = usePanelStore((s) => s.pharmacyName);

  const pharmacyIdRef = useRef(pharmacyId);
  pharmacyIdRef.current = pharmacyId;

  const [items, setItems]   = useState<StockSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<FilterKey>('all');
  const [sortBy, setSortBy]   = useState<SortKey>('name');

  const [selectedIds, setSelectedIds]         = useState<Set<number>>(new Set());
  const [showReorderModal, setShowReorderModal] = useState(false);

  /* ── Data fetch ── */
  const load = async () => {
    const pid = pharmacyIdRef.current;
    if (!pid) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: batches } = await supabase
        .from('batches')
        .select('medicine_id, current_quantity, mrp, expiry_date, medicines(name, min_stock_level)')
        .eq('pharmacy_id', pid)
        .gt('current_quantity', 0)
        .is('deleted_at', null);

      const map = new Map<number, StockSummaryItem>();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const b of batches || []) {
        const med = (b as any).medicines;
        const medName = med?.name || 'Unknown';
        const minLevel: number = med?.min_stock_level ?? 10;
        const expDate = b.expiry_date ? new Date(b.expiry_date) : null;

        const existing = map.get(b.medicine_id);
        if (existing) {
          existing.total_quantity += b.current_quantity;
          existing.stock_value    += b.current_quantity * b.mrp;
          existing.batch_count    += 1;
          // keep nearest expiry
          if (expDate && (!existing.nearest_expiry || expDate < new Date(existing.nearest_expiry))) {
            existing.nearest_expiry = b.expiry_date;
            existing.days_to_expiry = Math.floor((expDate.getTime() - today.getTime()) / 86_400_000);
          }
        } else {
          map.set(b.medicine_id, {
            medicine_id:    b.medicine_id,
            medicine_name:  medName,
            total_quantity: b.current_quantity,
            stock_value:    b.current_quantity * b.mrp,
            batch_count:    1,
            min_stock_level: minLevel,
            is_low_stock:   false, // computed below
            nearest_expiry: b.expiry_date || null,
            days_to_expiry: expDate
              ? Math.floor((expDate.getTime() - today.getTime()) / 86_400_000)
              : null,
          });
        }
      }

      // finalize is_low_stock after all batches summed
      const result: StockSummaryItem[] = Array.from(map.values()).map(item => ({
        ...item,
        is_low_stock: item.total_quantity < item.min_stock_level,
      }));

      setItems(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pharmacyId) load();
    else setLoading(false);
  }, [pharmacyId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Derived stats ── */
  const totalValue = items.reduce((s, i) => s + i.stock_value, 0);
  const lowCount   = items.filter(i => i.is_low_stock).length;

  /* ── Filtered + sorted list ── */
  const filtered = useMemo(() => {
    let list = items;
    if (filter === 'low') list = list.filter(i => i.is_low_stock);
    if (filter === 'ok')  list = list.filter(i => !i.is_low_stock);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.medicine_name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'name')   return a.medicine_name.localeCompare(b.medicine_name);
      if (sortBy === 'qty')    return b.total_quantity - a.total_quantity;
      if (sortBy === 'value')  return b.stock_value - a.stock_value;
      if (sortBy === 'expiry') {
        const da = a.days_to_expiry ?? Infinity;
        const db = b.days_to_expiry ?? Infinity;
        return da - db;
      }
      return 0;
    });
  }, [items, filter, search, sortBy]);

  /* ── Selection helpers ── */
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? new Set(filtered.map(i => i.medicine_id)) : new Set());
  };
  const handleSelectOne = (id: number) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };
  const selectedItemsList = items.filter(i => selectedIds.has(i.medicine_id));

  /* ── CSV export ── */
  const handleExport = () => {
    const csv = [
      'Medicine,Batches,Quantity,Min Level,Stock Value,Nearest Expiry,Status',
      ...filtered.map(r =>
        `"${r.medicine_name}",${r.batch_count},${r.total_quantity},${r.min_stock_level},${r.stock_value.toFixed(2)},"${r.nearest_expiry || ''}","${r.is_low_stock ? 'Low' : 'OK'}"`
      ),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'stock_report.csv';
    a.click();
  };

  /* ── Shared input style ── */
  const inputStyle: React.CSSProperties = {
    backgroundColor: C.input, border: `1px solid ${C.inputBorder}`,
    borderRadius: 12, padding: '9px 14px', color: C.text,
    fontSize: 13, fontWeight: 600, fontFamily: 'inherit', outline: 'none',
    colorScheme: 'dark' as any,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 120 }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => router.back()}
            style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
          >
            <ChevronLeft style={{ width: 18, height: 18, color: C.muted }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileBarChart style={{ width: 18, height: 18, color: C.purple }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Stock Summary Report</h1>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>Inventory valuation with batch tracking</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 12, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.text, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
        >
          <Download style={{ width: 14, height: 14, color: C.purpleLight }} />
          Export CSV
        </button>
      </div>

      {/* ── Stats row ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total SKUs',  value: loading ? '—' : String(items.length),       icon: Package,       color: C.subtle,   rgb: '148,163,184' },
          { label: 'Stock Value', value: loading ? '—' : formatCurrency(totalValue), icon: IndianRupee,   color: C.indigo,   rgb: '99,102,241'  },
          { label: 'Low Stock',   value: loading ? '—' : String(lowCount),           icon: TrendingDown,  color: C.rose,     rgb: '244,63,94'   },
          { label: 'Healthy',     value: loading ? '—' : String(items.length - lowCount), icon: CheckCircle2, color: C.emerald, rgb: '16,185,129' },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: C.card, border: `1px solid ${C.cardBorder}`,
            borderRadius: 16, padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', backgroundColor: s.color, opacity: 0.06, filter: 'blur(20px)', pointerEvents: 'none' }} />
            <div style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: `rgba(${s.rgb},0.12)`, border: `1px solid rgba(${s.rgb},0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon style={{ width: 16, height: 16, color: s.color }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{s.label}</p>
              <p style={{ margin: '3px 0 0', fontSize: 18, fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Controls ───────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <Search style={{ width: 15, height: 15, color: C.muted, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="search" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search medicine…"
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', paddingLeft: 36 }}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, gap: 2 }}>
          {(['all', 'low', 'ok'] as FilterKey[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
                backgroundColor: filter === f ? C.card : 'transparent',
                color: filter === f ? C.text : C.muted,
                boxShadow: filter === f ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Healthy'}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="name">Sort: Name A-Z</option>
          <option value="qty">Sort: Quantity ↓</option>
          <option value="value">Sort: Value ↓</option>
          <option value="expiry">Sort: Nearest Expiry</option>
        </select>
      </div>

      {/* ── Table ──────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 10 }}>
          <Loader2 style={{ width: 20, height: 20, color: C.purple, animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 13, color: C.muted }}>Loading inventory…</span>
        </div>
      ) : (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '36px 3fr 1fr 1fr 1fr 1.4fr 1.5fr 1fr', alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.02)', gap: 12 }}>
            <div>
              <input
                type="checkbox"
                checked={filtered.length > 0 && selectedIds.size === filtered.length}
                onChange={handleSelectAll}
                style={{ width: 15, height: 15, accentColor: C.indigo, cursor: 'pointer' }}
              />
            </div>
            {['Medicine', 'Batches', 'Total Qty', 'Min Level', 'Stock Value', 'Expiry', 'Status'].map(h => (
              <p key={h} style={{ margin: 0, fontSize: 9.5, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.09em', whiteSpace: 'nowrap' }}>{h}</p>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 32px', gap: 12 }}>
              <Package style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.08)' }} />
              <p style={{ margin: 0, fontSize: 14, color: C.muted, fontWeight: 600 }}>No items match</p>
            </div>
          ) : filtered.map((item, idx) => {
            const nearExpiry = item.days_to_expiry !== null && item.days_to_expiry <= 60;
            const expired    = item.days_to_expiry !== null && item.days_to_expiry < 0;
            const isSelected = selectedIds.has(item.medicine_id);

            return (
              <div
                key={item.medicine_id}
                onClick={() => handleSelectOne(item.medicine_id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 3fr 1fr 1fr 1fr 1.4fr 1.5fr 1fr',
                  alignItems: 'center', gap: 12,
                  padding: '13px 20px',
                  borderBottom: idx < filtered.length - 1 ? `1px solid ${C.cardBorder}` : 'none',
                  backgroundColor: isSelected ? 'rgba(99,102,241,0.07)' : 'transparent',
                  cursor: 'pointer', transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.04)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectOne(item.medicine_id)}
                    style={{ width: 15, height: 15, accentColor: C.indigo, cursor: 'pointer' }}
                  />
                </div>

                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.medicine_name}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: C.muted }}>{item.batch_count}</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: item.is_low_stock ? C.rose : C.text }}>
                  {item.total_quantity}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: C.muted }}>{item.min_stock_level}</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.purpleLight }}>
                  {formatCurrency(item.stock_value)}
                </p>

                {/* Expiry */}
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: expired ? C.rose : nearExpiry ? C.orange : C.muted }}>
                  {item.nearest_expiry ? (
                    <>
                      {item.nearest_expiry}
                      <span style={{ opacity: 0.7, marginLeft: 4, fontSize: 11 }}>
                        ({expired ? 'expired' : `${item.days_to_expiry}d`})
                      </span>
                    </>
                  ) : '—'}
                </p>

                {/* Status badge */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 900,
                  backgroundColor: item.is_low_stock ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
                  color: item.is_low_stock ? C.rose : C.emerald,
                  border: `1px solid ${item.is_low_stock ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}`,
                  whiteSpace: 'nowrap',
                }}>
                  {item.is_low_stock
                    ? <><AlertTriangle style={{ width: 10, height: 10 }} />Low</>
                    : <><CheckCircle2 style={{ width: 10, height: 10 }} />OK</>}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Floating Reorder Bar ────────────────────────── */}
      {selectedIds.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '16px 24px 24px',
          background: 'linear-gradient(to top, rgba(6,9,20,0.95) 0%, transparent 100%)',
          display: 'flex', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 40,
        }}>
          <div style={{
            pointerEvents: 'auto',
            backgroundColor: '#0f1120', border: `1px solid ${C.cardBorder}`,
            borderRadius: 20, padding: '16px 28px',
            display: 'flex', alignItems: 'center', gap: 24,
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Selected</p>
              <p style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 900, color: C.text }}>{selectedIds.size} medicines</p>
            </div>
            <div style={{ width: 1, height: 40, backgroundColor: C.cardBorder }} />
            <button
              onClick={() => setShowReorderModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                backgroundColor: C.indigo, color: '#fff',
                border: 'none', borderRadius: 13, padding: '11px 22px',
                fontSize: 14, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.indigoLight; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.indigo; }}
            >
              <ShoppingCart style={{ width: 16, height: 16 }} />
              Reorder Selected
            </button>
          </div>
        </div>
      )}

      {/* ── Bulk Reorder Modal ──────────────────────────── */}
      {showReorderModal && pharmacyId && (
        <BulkReorderModal
          pharmacyId={pharmacyId}
          pharmacyName={pharmacyName || 'My Pharmacy'}
          selectedItems={selectedItemsList}
          onClose={() => setShowReorderModal(false)}
          onSuccess={() => setShowReorderModal(false)}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
