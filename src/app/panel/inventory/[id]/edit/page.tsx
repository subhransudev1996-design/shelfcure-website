'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Pill, Settings, Layout, ShieldCheck,
  MapPin, Hash, Save, AlertTriangle, Sparkles, Plus, X, Check,
} from 'lucide-react';
import { C, FInput, FSelect, Section, PreviewRow, DOSAGE_FORMS, PACK_UNITS, GST_RATES } from '../../add/components';

export default function EditMedicinePage() {
  const router = useRouter();
  const params = useParams();
  const medicineId = String(params.id);
  const { pharmacyId } = usePanelStore();
  const supabase = createClient();

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [catError, setCatError] = useState('');

  const [form, setForm] = useState({
    name: '', saltComposition: '', manufacturer: '', dosageForm: 'Tablet',
    strength: '', categoryId: '', packUnit: 'Strip', packSize: '10',
    saleMode: 'both', unitsPerPack: '10', gstRate: '0', hsnCode: '',
    minStock: '10', reorderLevel: '20', rackLocation: '', barcode: '',
  });

  const set = (k: string) => (v: string) => { setForm((f) => ({ ...f, [k]: v })); setError(''); };
  const isTabCap = ['tablet', 'capsule'].includes(form.dosageForm.toLowerCase());

  useEffect(() => {
    if (!pharmacyId || !medicineId) return;
    (async () => {
      setLoading(true);
      try {
        const [medRes, catRes] = await Promise.all([
          supabase.from('medicines').select('*').eq('id', medicineId).eq('pharmacy_id', pharmacyId).single(),
          supabase.from('categories').select('id,name').eq('pharmacy_id', pharmacyId),
        ]);
        if (catRes.data) setCategories(catRes.data);

        const m = medRes.data;
        if (!m) {
          toast.error('Medicine not found');
          router.replace('/panel/inventory');
          return;
        }
        // Map DB row → form
        const sm = m.sale_unit_mode === 'both' ? 'both' : 'pack_only';
        setForm({
          name: m.name || '',
          saltComposition: m.generic_name || '',
          manufacturer: m.manufacturer || '',
          dosageForm: m.dosage_form || 'Tablet',
          strength: m.strength || '',
          categoryId: m.category_id || '',
          packUnit: m.pack_unit || 'Strip',
          packSize: String(m.pack_size ?? 10),
          saleMode: sm,
          unitsPerPack: String(m.units_per_pack ?? 10),
          gstRate: String(m.gst_rate ?? 0),
          hsnCode: m.hsn_code || '',
          minStock: String(m.min_stock_level ?? 10),
          reorderLevel: String(m.reorder_level ?? 20),
          rackLocation: m.rack_location || '',
          barcode: m.barcode || '',
        });
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load medicine');
      } finally {
        setLoading(false);
      }
    })();
  }, [pharmacyId, medicineId, supabase, router]);

  async function handleAddCat() {
    if (!newCatName.trim()) { setCatError('Name required'); return; }
    if (!pharmacyId) return;
    setAddingCat(true); setCatError('');
    try {
      const { data, error: e } = await supabase
        .from('categories')
        .insert({ pharmacy_id: pharmacyId, name: newCatName.trim() })
        .select('id,name')
        .single();
      if (e) throw e;
      setCategories((p) => [...p, data]);
      setForm((f) => ({ ...f, categoryId: data.id }));
      setNewCatName('');
      setShowNewCat(false);
    } catch {
      setCatError('Failed');
    } finally {
      setAddingCat(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!pharmacyId) { setError('Not authenticated'); return; }
    if (!form.name.trim()) { setError('Medicine Name is required.'); return; }
    setSaving(true); setError('');
    try {
      const { error: dbErr } = await supabase
        .from('medicines')
        .update({
          name: form.name.trim(),
          generic_name: form.saltComposition.trim() || null,
          manufacturer: form.manufacturer.trim() || null,
          dosage_form: form.dosageForm || null,
          strength: form.strength.trim() || null,
          category_id: form.categoryId || null,
          pack_size: parseInt(form.packSize) || 1,
          pack_unit: form.packUnit || 'Strip',
          sale_unit_mode: isTabCap ? form.saleMode : 'pack_only',
          units_per_pack: parseInt(form.unitsPerPack) || 1,
          hsn_code: form.hsnCode.trim() || null,
          gst_rate: parseInt(form.gstRate) || 0,
          min_stock_level: parseInt(form.minStock) || 10,
          reorder_level: parseInt(form.reorderLevel) || 20,
          rack_location: form.rackLocation.trim() || null,
          barcode: form.barcode.trim() || null,
        })
        .eq('id', medicineId)
        .eq('pharmacy_id', pharmacyId);
      if (dbErr) throw dbErr;
      toast.success('Medicine updated!');
      router.push(`/panel/inventory/${medicineId}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
      <Loader2 style={{ width: 24, height: 24, color: C.indigo, animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => router.push(`/panel/inventory/${medicineId}`)}
          style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Edit Medicine</h1>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>Update details for <strong style={{ color: C.text }}>{form.name}</strong></p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 16px', backgroundColor: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle style={{ width: 14, height: 14, color: C.rose, flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 12, color: '#fda4af', flex: 1 }}>{error}</p>
        </div>
      )}

      <form id="med-edit-form" onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* LEFT — Form sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Basic Information */}
          <Section icon={Pill} label="Basic Information">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
              <FInput label="Medicine Name" value={form.name} required placeholder="e.g. Paracetamol 500mg" onChange={set('name')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FInput label="Salt / Composition" value={form.saltComposition} onChange={set('saltComposition')} placeholder="e.g. Paracetamol, Amoxicillin" />
              <FInput label="Manufacturer" value={form.manufacturer} onChange={set('manufacturer')} placeholder="e.g. Cipla, Sun Pharma" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FInput label="Strength / Concentration" value={form.strength} onChange={set('strength')} placeholder="e.g. 500mg, 10mg/5ml" />
              <FSelect label="Dosage Form" value={form.dosageForm} onChange={set('dosageForm')} required>
                {DOSAGE_FORMS.map((d) => <option key={d} value={d}>{d}</option>)}
              </FSelect>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FSelect label="Pack Unit" value={form.packUnit} onChange={set('packUnit')}>
                {PACK_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </FSelect>
              <FInput label="Pack Size (qty per pack)" value={form.packSize} onChange={set('packSize')} type="number" min={1} placeholder="10" />
            </div>
          </Section>

          {/* Sale Configuration — Tablet/Capsule only */}
          {isTabCap && (
            <Section icon={Settings} label="Sale Configuration" color={C.emerald}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { mode: 'pack_only', label: `Pack Only (${form.packUnit})`, desc: 'Sold in complete packs only' },
                  { mode: 'both', label: `Flexible (Unit / ${form.packUnit})`, desc: 'Can sell individual units or full packs' },
                ].map(({ mode, label, desc }) => {
                  const active = form.saleMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => set('saleMode')(mode)}
                      style={{
                        padding: '14px 16px', borderRadius: 12, border: 'none', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                        backgroundColor: active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                        outline: active ? `2px solid ${C.emerald}44` : `1px solid ${C.cardBorder}`,
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: active ? C.emeraldLight : C.muted }}>{label}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 10, color: C.muted }}>{desc}</p>
                    </button>
                  );
                })}
              </div>
              {form.saleMode === 'both' && (
                <FInput label={`Units per ${form.packUnit}`} value={form.unitsPerPack} onChange={set('unitsPerPack')} type="number" min={1} placeholder="10" />
              )}
            </Section>
          )}

          {/* Classification & Storage */}
          <Section icon={Layout} label="Classification & Storage" color={C.emerald}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FInput label="Rack Location" value={form.rackLocation} onChange={set('rackLocation')} placeholder="e.g. A-12, B-04" icon={<MapPin style={{ width: 13, height: 13 }} />} />
              <FInput label="HSN Code" value={form.hsnCode} onChange={set('hsnCode')} placeholder="e.g. 3004" icon={<Hash style={{ width: 13, height: 13 }} />} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FSelect label="Default GST Rate" value={form.gstRate} onChange={set('gstRate')}>
                {GST_RATES.map((r) => <option key={r} value={String(r)}>{r === 0 ? '0% (Exempt)' : `${r}%`}</option>)}
              </FSelect>
              <FInput label="Barcode" value={form.barcode} onChange={set('barcode')} placeholder="Scan or enter barcode" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <FSelect label="Category" value={form.categoryId} onChange={set('categoryId')}>
                    <option value="">Uncategorized</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </FSelect>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowNewCat((v) => !v); setNewCatName(''); setCatError(''); }}
                  style={{
                    width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 18, transition: 'all 0.15s',
                    backgroundColor: showNewCat ? 'rgba(244,63,94,0.1)' : 'rgba(99,102,241,0.1)',
                    color: showNewCat ? C.rose : C.indigo,
                  }}
                >
                  {showNewCat ? <X style={{ width: 14, height: 14 }} /> : <Plus style={{ width: 14, height: 14 }} />}
                </button>
              </div>
              {showNewCat && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1 }}>
                    <input
                      autoFocus
                      type="text"
                      value={newCatName}
                      onChange={(e) => { setNewCatName(e.target.value); setCatError(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCat(); } if (e.key === 'Escape') setShowNewCat(false); }}
                      placeholder="New category name…"
                      style={{ width: '100%', padding: '8px 12px', boxSizing: 'border-box', backgroundColor: C.input, border: `1.5px solid ${C.indigo}`, borderRadius: 9, color: C.text, fontSize: 12, fontWeight: 500, outline: 'none', fontFamily: 'inherit' }}
                    />
                    {catError && <p style={{ margin: '4px 0 0', fontSize: 10, color: C.rose }}>{catError}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCat}
                    disabled={addingCat || !newCatName.trim()}
                    style={{ width: 34, height: 34, borderRadius: 9, border: 'none', backgroundColor: 'rgba(16,185,129,0.15)', color: C.emerald, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (addingCat || !newCatName.trim()) ? 0.5 : 1 }}
                  >
                    {addingCat ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Check style={{ width: 14, height: 14 }} />}
                  </button>
                </div>
              )}
            </div>
          </Section>

          {/* Alert Settings */}
          <Section icon={ShieldCheck} label="Alert Settings" color={C.amber}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FInput label="Min Stock Level" value={form.minStock} onChange={set('minStock')} type="number" min={0} placeholder="10" />
              <FInput label="Reorder Level" value={form.reorderLevel} onChange={set('reorderLevel')} type="number" min={0} placeholder="20" />
            </div>
          </Section>
        </div>

        {/* RIGHT — Preview sidebar (sticky) */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Sparkles style={{ width: 14, height: 14, color: C.indigo }} />
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>Preview</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <PreviewRow label="Name" value={form.name} />
              <PreviewRow label="Salt" value={form.saltComposition} />
              <PreviewRow label="Manufacturer" value={form.manufacturer} />
              <PreviewRow label="Form" value={form.dosageForm} />
              <PreviewRow label="Strength" value={form.strength} />
              <PreviewRow label="Unit" value={`${form.packUnit}${form.saleMode === 'both' ? ' + Units' : ''}`} />
              <PreviewRow label="Rack" value={form.rackLocation} />
              <PreviewRow label="HSN" value={form.hsnCode} />
              <PreviewRow label="Barcode" value={form.barcode} />
              <PreviewRow label="Category" value={categories.find((c) => c.id === form.categoryId)?.name ?? ''} />
              <PreviewRow label="GST" value={`${form.gstRate}%`} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
              <button
                type="submit"
                disabled={saving || !form.name}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', cursor: saving ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 6px 24px rgba(99,102,241,0.3)', transition: 'all 0.15s',
                  opacity: (saving || !form.name) ? 0.6 : 1,
                }}
              >
                {saving ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 15, height: 15 }} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/panel/inventory/${medicineId}`)}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 12, border: `1px solid ${C.cardBorder}`,
                  backgroundColor: 'transparent', color: C.muted, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
