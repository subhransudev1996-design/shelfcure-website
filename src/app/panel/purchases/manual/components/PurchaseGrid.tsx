'use client';

import { Trash2, Search, Plus, PlusCircle, Check, FileSpreadsheet, X } from 'lucide-react';
import { PurchaseLineItem } from './types';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const C = {
  card: '#0B1121',
  cardBorder: 'rgba(255,255,255,0.08)',
  cardBorderUnlinked: 'rgba(245,158,11,0.35)',
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  danger: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  inputBg: 'rgba(255,255,255,0.03)',
};

interface MedicineSearchHit {
  id: string;
  name: string;
  manufacturer: string | null;
  sale_unit_mode: string | null;
  units_per_pack: number | null;
  gst_rate: number | null;
  barcode: string | null;
}

interface Props {
  pharmacyId: string | null;
  lines: PurchaseLineItem[];
  onUpdateLine: (id: string, patch: Partial<PurchaseLineItem>) => void;
  onRemoveLine: (id: string) => void;
  onAddEmpty: () => void;
  onLinkMedicine: (lineId: string, med: MedicineSearchHit) => void;
  onOpenAddMedicine: (lineId: string, name: string) => void;
  csvSummary: { total: number; matched: number } | null;
  onDismissCsvSummary: () => void;
}

const inputXs: React.CSSProperties = {
  width: '100%', padding: '7px 9px', borderRadius: 8,
  border: `1px solid ${C.cardBorder}`, background: C.inputBg, color: C.text,
  fontSize: 12, outline: 'none', fontWeight: 600,
};

const labelXs: React.CSSProperties = {
  display: 'block', fontSize: 9, fontWeight: 800, color: C.muted,
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
};

export function PurchaseGrid({
  pharmacyId, lines, onUpdateLine, onRemoveLine, onAddEmpty,
  onLinkMedicine, onOpenAddMedicine, csvSummary, onDismissCsvSummary,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* CSV Summary banner */}
      {csvSummary && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: 14, background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14,
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileSpreadsheet style={{ width: 14, height: 14, color: C.success }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.success }}>
              CSV Imported · {csvSummary.total} items loaded
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check style={{ width: 11, height: 11, color: C.success }} />
              {csvSummary.matched} auto-matched
              {csvSummary.total - csvSummary.matched > 0 && (
                <span style={{ color: C.warning }}>
                  · {csvSummary.total - csvSummary.matched} need manual linking
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onDismissCsvSummary}
            style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
      )}

      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>
        Items ({lines.length})
      </h3>

      {lines.map((line) => (
        <LineItemCard
          key={line.id}
          pharmacyId={pharmacyId}
          line={line}
          onUpdate={onUpdateLine}
          onRemove={onRemoveLine}
          onLinkMedicine={onLinkMedicine}
          onOpenAddMedicine={onOpenAddMedicine}
        />
      ))}

      <button
        onClick={onAddEmpty}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px',
          background: 'transparent',
          border: `2px dashed ${C.cardBorder}`,
          borderRadius: 14, color: C.muted, fontSize: 13, fontWeight: 700,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.primaryLight; e.currentTarget.style.color = C.primaryLight; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.color = C.muted; }}
      >
        <Plus style={{ width: 14, height: 14 }} />
        Add Another Item
      </button>
    </div>
  );
}

function LineItemCard({
  pharmacyId, line, onUpdate, onRemove, onLinkMedicine, onOpenAddMedicine,
}: {
  pharmacyId: string | null;
  line: PurchaseLineItem;
  onUpdate: (id: string, patch: Partial<PurchaseLineItem>) => void;
  onRemove: (id: string) => void;
  onLinkMedicine: (lineId: string, med: MedicineSearchHit) => void;
  onOpenAddMedicine: (lineId: string, name: string) => void;
}) {
  const supabase = createClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<MedicineSearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const doSearch = useCallback((q: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!pharmacyId || q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('medicines')
        .select('id, name, manufacturer, sale_unit_mode, units_per_pack, gst_rate, barcode')
        .eq('pharmacy_id', pharmacyId)
        .ilike('name', `%${q}%`)
        .limit(10);
      setSearchResults((data as MedicineSearchHit[]) || []);
      setSearchLoading(false);
    }, 200);
  }, [pharmacyId, supabase]);

  const lineAmount = (() => {
    const base = line.purchase_rate * line.quantity;
    return base - (base * line.discount_percentage) / 100;
  })();

  const isLinked = !!line.medicine_id;
  const isFlex = line.sale_unit_mode === 'both' && line.units_per_pack > 1;
  const barcodeChanged = line.barcode.trim() !== line.original_barcode.trim();

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${isLinked ? C.cardBorder : C.cardBorderUnlinked}`,
      borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Search row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div ref={searchWrapperRef} style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: isLinked ? C.success : C.muted, pointerEvents: 'none' }} />
          <input
            value={line.medicine_name}
            onChange={(e) => {
              onUpdate(line.id, { medicine_name: e.target.value, medicine_id: null });
              setSearchOpen(true);
              doSearch(e.target.value);
            }}
            onFocus={() => { if (line.medicine_name.length >= 2) { setSearchOpen(true); doSearch(line.medicine_name); } }}
            placeholder="Search medicine..."
            style={{
              width: '100%', padding: '8px 10px 8px 28px', borderRadius: 9,
              border: `1px solid ${isLinked ? 'rgba(16,185,129,0.4)' : C.cardBorder}`,
              background: isLinked ? 'rgba(16,185,129,0.06)' : C.inputBg,
              color: C.text, fontSize: 13, outline: 'none', fontWeight: 600,
            }}
          />
          {searchOpen && (searchResults.length > 0 || searchLoading || line.medicine_name.length >= 2) && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
              background: '#0f172a', border: `1px solid ${C.cardBorder}`,
              borderRadius: 10, overflow: 'hidden', zIndex: 50,
              boxShadow: '0 14px 30px rgba(0,0,0,0.5)', maxHeight: 280, overflowY: 'auto',
            }}>
              {searchResults.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onLinkMedicine(line.id, m);
                    setSearchOpen(false);
                    setSearchResults([]);
                  }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 12px',
                    background: 'transparent', border: 'none',
                    borderBottom: `1px solid ${C.cardBorder}`,
                    cursor: 'pointer', color: C.text,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{m.name}</span>
                  {m.manufacturer && <span style={{ fontSize: 10, color: C.muted, marginLeft: 8 }}>{m.manufacturer}</span>}
                </button>
              ))}
              {!searchLoading && searchResults.length === 0 && line.medicine_name.length >= 2 && (
                <p style={{ padding: '10px 12px', margin: 0, fontSize: 11, fontStyle: 'italic', color: C.muted, borderBottom: `1px solid ${C.cardBorder}` }}>
                  No medicine found for &quot;{line.medicine_name}&quot;
                </p>
              )}
              <button
                onClick={() => { onOpenAddMedicine(line.id, line.medicine_name); setSearchOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', background: 'rgba(99,102,241,0.08)',
                  border: 'none', color: C.primaryLight, fontSize: 11, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus style={{ width: 12, height: 12 }} />
                Add &quot;{line.medicine_name || 'new medicine'}&quot; as new medicine
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => onRemove(line.id)}
          style={{
            width: 32, height: 32, borderRadius: 8, background: 'transparent',
            border: 'none', color: C.muted, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = C.danger; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}
          title="Remove line"
        >
          <Trash2 style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Inline "Add as New Medicine" button (when not linked) */}
      {!isLinked && (
        <button
          onClick={() => onOpenAddMedicine(line.id, line.medicine_name || '')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 12px', background: C.primary, border: 'none',
            color: '#fff', fontSize: 12, fontWeight: 800, borderRadius: 9, cursor: 'pointer',
          }}
        >
          <PlusCircle style={{ width: 13, height: 13 }} />
          {line.medicine_name ? `Add "${line.medicine_name}" as New Medicine` : 'Add as New Medicine'}
        </button>
      )}

      {/* Numeric row 1: Qty, Free, PTR, MRP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <div>
          <label style={labelXs}>{isFlex ? 'Qty (Strips)' : 'Qty'}</label>
          <input
            type="number" min={0}
            value={line.quantity || ''}
            onChange={(e) => onUpdate(line.id, { quantity: parseFloat(e.target.value) || 0 })}
            style={inputXs}
          />
        </div>
        <div>
          <label style={labelXs}>Free Qty</label>
          <input
            type="number" min={0}
            value={line.free_quantity || ''}
            onChange={(e) => onUpdate(line.id, { free_quantity: parseFloat(e.target.value) || 0 })}
            style={inputXs}
          />
        </div>
        <div>
          <label style={labelXs}>Purchase Rate</label>
          <input
            type="number" step="0.01" min={0}
            value={line.purchase_rate || ''}
            onChange={(e) => onUpdate(line.id, { purchase_rate: parseFloat(e.target.value) || 0 })}
            style={inputXs}
          />
        </div>
        <div>
          <label style={labelXs}>MRP</label>
          <input
            type="number" step="0.01" min={0}
            value={line.mrp || ''}
            onChange={(e) => onUpdate(line.id, { mrp: parseFloat(e.target.value) || 0 })}
            style={inputXs}
          />
        </div>
      </div>

      {/* Numeric row 2: Sell Price, GST%, Disc%, Amount */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <div>
          <label style={labelXs}>Sell Price</label>
          <input
            type="number" step="0.01" min={0}
            value={line.selling_price || ''}
            onChange={(e) => onUpdate(line.id, { selling_price: parseFloat(e.target.value) || 0 })}
            style={inputXs}
          />
        </div>
        <div>
          <label style={labelXs}>GST %</label>
          <input
            type="number" step="0.01" min={0} max={100}
            value={line.gst_percentage || ''}
            onChange={(e) => onUpdate(line.id, { gst_percentage: parseFloat(e.target.value) || 0 })}
            style={inputXs}
          />
        </div>
        <div>
          <label style={labelXs}>Disc %</label>
          <input
            type="number" step="0.01" min={0} max={100}
            value={line.discount_percentage || ''}
            onChange={(e) => onUpdate(line.id, { discount_percentage: parseFloat(e.target.value) || 0 })}
            style={inputXs}
          />
        </div>
        <div>
          <label style={labelXs}>Amount</label>
          <div style={{
            padding: '7px 9px', borderRadius: 8,
            border: `1px solid rgba(99,102,241,0.25)`,
            background: 'rgba(99,102,241,0.1)',
            color: C.primaryLight, fontSize: 12, fontWeight: 800,
          }}>
            ₹{lineAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Batch + Expiry + Barcode */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div>
          <label style={labelXs}>Batch Number</label>
          <input
            value={line.batch_number}
            onChange={(e) => onUpdate(line.id, { batch_number: e.target.value.toUpperCase() })}
            placeholder="e.g. ABC123"
            style={inputXs}
          />
        </div>
        <div>
          <label style={labelXs}>Expiry Date</label>
          <input
            type="month"
            value={line.expiry_date?.slice(0, 7) || ''}
            onChange={(e) => onUpdate(line.id, { expiry_date: e.target.value ? `${e.target.value}-01` : '' })}
            style={{ ...inputXs, colorScheme: 'dark' }}
          />
        </div>
        <div>
          <label style={labelXs}>Barcode</label>
          <input
            value={line.barcode}
            onChange={(e) => onUpdate(line.id, { barcode: e.target.value })}
            placeholder="Scan or type barcode"
            style={{
              ...inputXs,
              borderColor: barcodeChanged && line.barcode ? 'rgba(245,158,11,0.4)' : C.cardBorder,
              background: barcodeChanged && line.barcode ? 'rgba(245,158,11,0.07)' : C.inputBg,
            }}
          />
        </div>
      </div>
    </div>
  );
}
