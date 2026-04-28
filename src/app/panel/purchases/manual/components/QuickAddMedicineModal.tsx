'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { masterMedicineApi, type MasterMedicine } from '@/lib/masterMedicineApi';
import {
  PlusCircle, X, Loader2, AlertTriangle, Database, Truck, ChevronDown,
} from 'lucide-react';
import type { Supplier } from './types';

const C = {
  card: '#0B1121',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc',
  muted: '#94a3b8',
  inputBg: 'rgba(255,255,255,0.02)',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Ointment', 'Powder', 'Solution', 'Gel', 'Lotion', 'Suppository', 'Other'];
const PACK_UNITS = ['Strip', 'Box', 'Bottle', 'Tube', 'Vial', 'Ampoule', 'Sachet', 'Piece'];
const GST_RATES = [0, 5, 12, 18, 28];

export interface QuickAddMedicineResult {
  id: string;
  name: string;
  sale_unit_mode: string;
  units_per_pack: number;
  gst_rate: number;
  barcode: string | null;
}

interface LocalMatch {
  id: string;
  name: string;
  manufacturer: string | null;
  sale_unit_mode: string | null;
  units_per_pack: number | null;
  gst_rate: number | null;
  barcode: string | null;
}

interface Category { id: string; name: string }

interface Props {
  open: boolean;
  onClose: () => void;
  pharmacyId: string;
  initialName: string;
  suggestedGst?: number | null;
  initialSupplier?: Supplier | null;
  onCreated: (med: QuickAddMedicineResult) => void;
}

export function QuickAddMedicineModal({
  open, onClose, pharmacyId, initialName, suggestedGst, initialSupplier, onCreated,
}: Props) {
  const supabase = createClient();

  const [name, setName] = useState('');
  const [salt, setSalt] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [strength, setStrength] = useState('');
  const [hsn, setHsn] = useState('');
  const [gstRate, setGstRate] = useState('12');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [packUnit, setPackUnit] = useState('Strip');
  const [packSize, setPackSize] = useState(10);
  const [categoryId, setCategoryId] = useState('');
  const [barcode, setBarcode] = useState('');
  const [rackLocation, setRackLocation] = useState('');
  const [minStock, setMinStock] = useState(10);
  const [reorderLevel, setReorderLevel] = useState(20);
  const [saleUnitMode, setSaleUnitMode] = useState('pack_only');
  const [unitsPerPack, setUnitsPerPack] = useState(10);

  const [categories, setCategories] = useState<Category[]>([]);
  const [masterQuery, setMasterQuery] = useState('');
  const [masterResults, setMasterResults] = useState<MasterMedicine[]>([]);
  const [masterSearching, setMasterSearching] = useState(false);
  const [localMatches, setLocalMatches] = useState<LocalMatch[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const masterTimer = useRef<NodeJS.Timeout | null>(null);

  const isTabOrCap = ['tablet', 'capsule'].includes(dosageForm.toLowerCase());

  // Reset state on open
  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setSalt('');
    setManufacturer('');
    setStrength('');
    setHsn('');
    setGstRate(String(suggestedGst ?? 12));
    setDosageForm('Tablet');
    setPackUnit('Strip');
    setPackSize(10);
    setCategoryId('');
    setBarcode('');
    setRackLocation('');
    setMinStock(10);
    setReorderLevel(20);
    setSaleUnitMode('pack_only');
    setUnitsPerPack(10);
    setMasterQuery(initialName);
    setMasterResults([]);
    setLocalMatches([]);
    setError('');

    // initial searches
    void doMasterSearch(initialName);
    void doLocalSearch(initialName);
    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('pharmacy_id', pharmacyId);
    if (data) setCategories(data);
  }

  async function doMasterSearch(q: string) {
    setMasterQuery(q);
    if (masterTimer.current) clearTimeout(masterTimer.current);
    if (!q || q.length < 2) {
      setMasterResults([]);
      return;
    }
    setMasterSearching(true);
    masterTimer.current = setTimeout(async () => {
      try {
        const res = await masterMedicineApi.search(q);
        setMasterResults(res.slice(0, 6));
      } catch {
        // ignore
      } finally {
        setMasterSearching(false);
      }
    }, 350);
  }

  async function doLocalSearch(q: string) {
    if (!q || q.length < 2) {
      setLocalMatches([]);
      return;
    }
    const { data } = await supabase
      .from('medicines')
      .select('id, name, manufacturer, sale_unit_mode, units_per_pack, gst_rate, barcode')
      .eq('pharmacy_id', pharmacyId)
      .ilike('name', `%${q}%`)
      .limit(5);
    setLocalMatches((data as LocalMatch[]) || []);
  }

  function applyMaster(m: MasterMedicine) {
    setName(m.name);
    setSalt(m.salt_composition ?? '');
    setManufacturer(m.manufacturer ?? '');
    setStrength(m.strength ?? '');
    if (m.default_gst_rate !== null && m.default_gst_rate !== undefined) {
      setGstRate(String(m.default_gst_rate));
    }
    if (m.dosage_form) {
      const norm = DOSAGE_FORMS.find((d) => d.toLowerCase() === m.dosage_form?.toLowerCase());
      if (norm) setDosageForm(norm);
    }
    if (m.pack_unit) {
      const u = PACK_UNITS.find((p) => p.toLowerCase() === m.pack_unit?.toLowerCase());
      if (u) setPackUnit(u);
    }
    if (m.pack_size) setPackSize(m.pack_size);
    if (m.units_per_pack) setUnitsPerPack(m.units_per_pack);
    if (m.hsn_code) setHsn(m.hsn_code);
    if (m.barcode) setBarcode(m.barcode);
    setMasterResults([]);
  }

  async function handleSave() {
    if (!name.trim()) { setError('Medicine name is required'); return; }
    if (!dosageForm) { setError('Dosage form is required'); return; }

    const finalSaleMode = isTabOrCap ? saleUnitMode : 'pack_only';
    const finalUnitsPerPack = isTabOrCap && saleUnitMode === 'both' ? unitsPerPack : 1;

    setSaving(true);
    setError('');
    try {
      const { data, error: dbErr } = await supabase
        .from('medicines')
        .insert({
          pharmacy_id: pharmacyId,
          name: name.trim(),
          generic_name: salt.trim() || null,
          manufacturer: manufacturer.trim() || 'Unknown',
          dosage_form: dosageForm,
          strength: strength.trim() || null,
          category_id: categoryId || null,
          pack_size: packSize || 1,
          pack_unit: packUnit || 'Strip',
          sale_unit_mode: finalSaleMode,
          units_per_pack: finalUnitsPerPack,
          hsn_code: hsn.trim() || null,
          gst_rate: Number(gstRate) || 0,
          min_stock_level: minStock || 0,
          reorder_level: reorderLevel || 0,
          rack_location: rackLocation.trim() || null,
          barcode: barcode.trim() || null,
        })
        .select('id')
        .single();
      if (dbErr) throw dbErr;

      // Silent crowdsource to master DB (best-effort)
      try {
        await masterMedicineApi.insertMasterMedicine({
          name: name.trim(),
          salt_composition: salt.trim() || null,
          manufacturer: manufacturer.trim() || null,
          dosage_form: dosageForm,
          strength: strength.trim() || null,
          pack_size: packSize || null,
          pack_unit: packUnit || null,
          units_per_pack: finalUnitsPerPack || null,
          hsn_code: hsn.trim() || null,
          default_gst_rate: Number(gstRate) || null,
          barcode: barcode.trim() || null,
        });
      } catch { /* silent */ }

      onCreated({
        id: String(data.id),
        name: name.trim(),
        sale_unit_mode: finalSaleMode,
        units_per_pack: finalUnitsPerPack,
        gst_rate: Number(gstRate) || 0,
        barcode: barcode.trim() || null,
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to add medicine');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: 9,
    border: `1px solid ${C.cardBorder}`, background: C.inputBg, color: C.text,
    fontSize: 13, outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5,
  };

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(2,4,15,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 560, maxHeight: '90vh',
        background: C.card, border: `1px solid ${C.cardBorder}`,
        borderRadius: 18, boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: `1px solid ${C.cardBorder}`, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlusCircle style={{ width: 15, height: 15, color: C.primaryLight }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>Add New Medicine</h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>Create &amp; link this medicine to your inventory</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', padding: 6, borderRadius: 8 }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.25)`, borderRadius: 8, color: C.danger, fontSize: 12 }}>
              <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Local matches → suggest linking instead */}
          {localMatches.length > 0 && (
            <div style={{ background: 'rgba(245,158,11,0.07)', border: `1px solid rgba(245,158,11,0.25)`, borderRadius: 10, padding: 10 }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: C.warning, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle style={{ width: 13, height: 13 }} />
                Already in your inventory — select to link instead:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {localMatches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onCreated({
                      id: m.id,
                      name: m.name,
                      sale_unit_mode: m.sale_unit_mode ?? 'pack_only',
                      units_per_pack: m.units_per_pack ?? 1,
                      gst_rate: m.gst_rate ?? 0,
                      barcode: m.barcode,
                    })}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '8px 10px', background: C.inputBg,
                      border: `1px solid ${C.cardBorder}`, borderRadius: 8,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      color: C.text,
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{m.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted }}>{m.manufacturer || '—'}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.primaryLight }}>Link →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Master DB search */}
          <div>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Database style={{ width: 12, height: 12, color: C.primaryLight }} />
              Search ShelfCure Master Database
            </label>
            <div style={{ position: 'relative' }}>
              <input
                value={masterQuery}
                onChange={(e) => doMasterSearch(e.target.value)}
                placeholder="Search by medicine name…"
                style={{ ...inputStyle, paddingRight: 32, borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.04)' }}
              />
              {masterSearching && (
                <Loader2 style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: C.primaryLight, animation: 'spin 0.8s linear infinite' }} />
              )}
            </div>
            {masterResults.length > 0 && (
              <div style={{ marginTop: 4, border: `1px solid rgba(99,102,241,0.2)`, borderRadius: 9, overflow: 'hidden', background: C.card }}>
                {masterResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => applyMaster(m)}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '8px 10px', background: 'transparent', border: 'none',
                      borderBottom: `1px solid ${C.cardBorder}`,
                      cursor: 'pointer', color: C.text,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{m.name}</p>
                      {(m.salt_composition || m.manufacturer) && (
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted }}>
                          {m.salt_composition || ''}{m.salt_composition && m.manufacturer ? ' · ' : ''}{m.manufacturer || ''}
                        </p>
                      )}
                    </div>
                    {m.strength && (
                      <span style={{ fontSize: 10, padding: '2px 6px', border: `1px solid ${C.cardBorder}`, borderRadius: 5, color: C.muted, flexShrink: 0 }}>
                        {m.strength}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: `1px solid ${C.cardBorder}`, marginLeft: -20, marginRight: -20 }} />
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: '0.08em' }}>OR FILL MANUALLY</p>

          {/* Supplier context */}
          {initialSupplier ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(59,130,246,0.08)', border: `1px solid rgba(59,130,246,0.2)`, borderRadius: 9 }}>
              <Truck style={{ width: 13, height: 13, color: '#60a5fa', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Supplier (from this bill)</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{initialSupplier.name}</p>
              </div>
              <span style={{ fontSize: 10, color: '#60a5fa', fontWeight: 600 }}>optional</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: C.inputBg, border: `1px solid ${C.cardBorder}`, borderRadius: 9 }}>
              <Truck style={{ width: 13, height: 13, color: C.muted, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 11, color: C.muted }}>No supplier selected — set one on the bill before saving.</p>
            </div>
          )}

          <div>
            <label style={labelStyle}>Medicine Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amoxicillin 500mg Cap" style={{ ...inputStyle, fontWeight: 600 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Salt / Composition</label>
              <input value={salt} onChange={(e) => setSalt(e.target.value)} placeholder="e.g. Amoxicillin" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Manufacturer</label>
              <input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="e.g. Cipla" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Dosage Form *</label>
              <div style={{ position: 'relative' }}>
                <select value={dosageForm} onChange={(e) => setDosageForm(e.target.value)} style={{ ...inputStyle, appearance: 'none', paddingRight: 28 }}>
                  {DOSAGE_FORMS.map((d) => <option key={d} value={d} style={{ background: '#0b1121' }}>{d}</option>)}
                </select>
                <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: C.muted, pointerEvents: 'none' }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Strength</label>
              <input value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="e.g. 500mg" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Pack Unit</label>
              <div style={{ position: 'relative' }}>
                <select value={packUnit} onChange={(e) => setPackUnit(e.target.value)} style={{ ...inputStyle, appearance: 'none', paddingRight: 28 }}>
                  {PACK_UNITS.map((u) => <option key={u} value={u} style={{ background: '#0b1121' }}>{u}</option>)}
                </select>
                <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: C.muted, pointerEvents: 'none' }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Pack Size (qty per pack)</label>
              <input type="number" min={1} value={packSize} onChange={(e) => setPackSize(Number(e.target.value) || 1)} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>HSN Code</label>
              <input value={hsn} onChange={(e) => setHsn(e.target.value)} placeholder="e.g. 300490" maxLength={8} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Default GST Rate</label>
              <div style={{ position: 'relative' }}>
                <select value={gstRate} onChange={(e) => setGstRate(e.target.value)} style={{ ...inputStyle, appearance: 'none', paddingRight: 28 }}>
                  {GST_RATES.map((r) => <option key={r} value={String(r)} style={{ background: '#0b1121' }}>{r === 0 ? '0% (Exempt)' : `${r}%`}</option>)}
                </select>
                <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: C.muted, pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <div style={{ position: 'relative' }}>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ ...inputStyle, appearance: 'none', paddingRight: 28 }}>
                  <option value="" style={{ background: '#0b1121' }}>Select Category</option>
                  {categories.map((c) => <option key={c.id} value={c.id} style={{ background: '#0b1121' }}>{c.name}</option>)}
                </select>
                <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: C.muted, pointerEvents: 'none' }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Barcode</label>
              <input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan or type" style={inputStyle} />
            </div>
          </div>

          {isTabOrCap && (
            <div style={{ background: C.inputBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={labelStyle}>Sale Configuration</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['pack_only', 'both'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSaleUnitMode(mode)}
                    style={{
                      padding: '9px',
                      borderRadius: 8,
                      border: `2px solid ${saleUnitMode === mode ? C.primary : C.cardBorder}`,
                      background: saleUnitMode === mode ? 'rgba(99,102,241,0.12)' : 'transparent',
                      color: saleUnitMode === mode ? C.primaryLight : C.muted,
                      fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {mode === 'pack_only' ? 'Pack Only' : 'Flexible (Pill)'}
                  </button>
                ))}
              </div>
              {saleUnitMode === 'both' && (
                <div>
                  <label style={labelStyle}>Pills per Pack</label>
                  <input type="number" min={1} value={unitsPerPack} onChange={(e) => setUnitsPerPack(Number(e.target.value) || 1)} style={inputStyle} />
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Rack</label>
              <input value={rackLocation} onChange={(e) => setRackLocation(e.target.value)} placeholder="e.g. A-12" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Min Stock</label>
              <input type="number" value={minStock} onChange={(e) => setMinStock(Number(e.target.value) || 0)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Reorder</label>
              <input type="number" value={reorderLevel} onChange={(e) => setReorderLevel(Number(e.target.value) || 0)} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.cardBorder}`, flexShrink: 0 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '12px', borderRadius: 11, border: 'none',
              background: C.primary, color: '#fff', fontSize: 13, fontWeight: 800,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {saving ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} /> Adding Medicine…</> : <><PlusCircle style={{ width: 14, height: 14 }} /> Add Medicine &amp; Link</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
