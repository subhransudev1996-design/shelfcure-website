'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import {
  Upload, Loader2, ChevronLeft, Sparkles, Trash2, AlertTriangle,
  Truck, Plus, X, CheckCircle2, ScanLine, Save, Search,
  PackagePlus, Database,
} from 'lucide-react';

const C = {
  card:'#0b0f24', cardBorder:'rgba(255,255,255,0.06)',
  text:'#f1f5f9', muted:'#475569', subtle:'#94a3b8',
  indigo:'#6366f1', indigoLight:'#818cf8',
  emerald:'#10b981', amber:'#f59e0b', rose:'#f43f5e', sky:'#0ea5e9',
  input:'#111827', inputBorder:'rgba(255,255,255,0.08)',
};

const inp: React.CSSProperties = {
  width:'100%', padding:'9px 12px', borderRadius:10,
  border:`1px solid ${C.inputBorder}`, backgroundColor:C.input,
  color:C.text, fontSize:12, fontWeight:600, outline:'none', boxSizing:'border-box',
};
const lbl: React.CSSProperties = {
  fontSize:10, fontWeight:700, color:C.muted,
  textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4, display:'block',
};

interface ScannedItem {
  medicine_name:string; batch_number:string|null; expiry_date:string|null;
  quantity:number; free_quantity:number|null; purchase_rate:number; mrp:number;
  gst_percentage:number|null; discount_percentage:number|null;
  amount:number; hsn_code:string|null;
  medicine_id?:string|null; linked?:boolean;
}
interface ScannedBill {
  supplier_name:string|null; supplier_gstin:string|null; bill_number:string|null;
  bill_date:string|null; payment_type:string|null; items:ScannedItem[];
  subtotal:number|null; bill_discount:number|null;
  bill_cgst:number|null; bill_sgst:number|null;
  total_amount:number|null; gst_amount:number|null;
}

type Step = 'capture'|'review'|'saving';

/* ══════════════════════════════════════════════════
   Quick Add Medicine Modal  (matches desktop exactly)
   ══════════════════════════════════════════════════ */
function QuickAddMedicineModal({
  pharmacyId, supabase, initialName, suggestedGst, suggestedHsn,
  onClose, onCreated,
}: {
  pharmacyId: string;
  supabase: any;
  initialName: string;
  suggestedGst?: number | null;
  suggestedHsn?: string | null;
  onClose: () => void;
  onCreated: (id: string, name: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [genericName, setGenericName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [strength, setStrength] = useState('');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [packUnit, setPackUnit] = useState('Strip');
  const [packSize, setPackSize] = useState(10);
  const [gstRate, setGstRate] = useState(String(suggestedGst ?? 12));
  const [hsn, setHsn] = useState(suggestedHsn ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Local inventory search (already exists?)
  const [localResults, setLocalResults] = useState<any[]>([]);
  // Master DB search
  const [masterQuery, setMasterQuery] = useState(initialName);
  const [masterResults, setMasterResults] = useState<any[]>([]);
  const [masterSearching, setMasterSearching] = useState(false);
  const masterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Search local on open
    searchLocal(initialName);
    // Search master on open
    searchMaster(initialName);
  }, []);

  const searchLocal = async (q: string) => {
    if (!q || q.length < 2) { setLocalResults([]); return; }
    const { data } = await supabase.from('medicines')
      .select('id,name,manufacturer,dosage_form')
      .eq('pharmacy_id', pharmacyId)
      .ilike('name', `%${q}%`).limit(5);
    setLocalResults(data || []);
  };

  const searchMaster = (q: string) => {
    setMasterQuery(q);
    if (masterTimer.current) clearTimeout(masterTimer.current);
    if (!q || q.length < 2) { setMasterResults([]); return; }
    setMasterSearching(true);
    masterTimer.current = setTimeout(async () => {
      try {
        const { data } = await supabase.from('master_medicines')
          .select('id,name,salt_composition,manufacturer,dosage_form,pack_size,default_gst_rate,hsn_code,strength')
          .ilike('name', `%${q}%`).limit(6);
        setMasterResults(data || []);
      } catch { } finally { setMasterSearching(false); }
    }, 350);
  };

  const applyMaster = (m: any) => {
    setName(m.name || name);
    setGenericName(m.salt_composition || '');
    setManufacturer(m.manufacturer || '');
    setStrength(m.strength || '');
    if (m.default_gst_rate != null) setGstRate(String(m.default_gst_rate));
    if (m.hsn_code) setHsn(m.hsn_code);
    if (m.dosage_form) setDosageForm(m.dosage_form);
    if (m.pack_size) setPackSize(m.pack_size);
    const isTabCap = ['tablet','capsule'].includes((m.dosage_form || '').toLowerCase());
    setPackUnit(isTabCap ? 'Strip' : m.dosage_form || 'Strip');
    setMasterResults([]);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Medicine name is required.'); return; }
    setSaving(true); setError('');
    try {
      const { data, error: err } = await supabase.from('medicines').insert({
        pharmacy_id: pharmacyId,
        name: name.trim(),
        generic_name: genericName.trim() || null,
        manufacturer: manufacturer.trim() || 'Unknown',
        dosage_form: dosageForm,
        pack_unit: packUnit,
        pack_size: packSize,
        gst_rate: Number(gstRate) || 12,
        hsn_code: hsn.trim() || null,
        min_stock_level: 10,
        reorder_level: 20,
      }).select('id').single();
      if (err) throw err;
      toast.success(`${name.trim()} added to inventory`);
      onCreated(data.id, name.trim());
    } catch (e: any) {
      setError(e?.message || 'Failed to add medicine.');
    } finally { setSaving(false); }
  };

  const DOSAGE_FORMS = ['Tablet','Capsule','Syrup','Injection','Cream','Drops','Inhaler','Ointment','Powder','Solution','Gel','Lotion','Suspension'];

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:'#0b0f24', border:`1px solid rgba(255,255,255,0.1)`, borderRadius:20, width:'100%', maxWidth:540, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 40px 100px rgba(0,0,0,0.8)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:`1px solid ${C.cardBorder}`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(99,102,241,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <PackagePlus style={{ width:16, height:16, color:C.indigoLight }} />
            </div>
            <div>
              <p style={{ margin:0, fontSize:14, fontWeight:900, color:C.text }}>Add New Medicine</p>
              <p style={{ margin:0, fontSize:11, color:C.muted }}>Create & link to your inventory</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,0.05)', border:'none', color:C.muted, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X style={{ width:14, height:14 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>

          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'10px 14px', color:C.rose, fontSize:12 }}>
              <AlertTriangle style={{ width:14, height:14, flexShrink:0 }} />{error}
            </div>
          )}

          {/* Already in local inventory? */}
          {localResults.length > 0 && (
            <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:12, padding:'12px 14px' }}>
              <p style={{ margin:'0 0 10px', fontSize:11, fontWeight:800, color:C.amber, display:'flex', alignItems:'center', gap:6 }}>
                <AlertTriangle style={{ width:12, height:12 }} />
                Already in your inventory — link instead?
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {localResults.map(m => (
                  <button key={m.id} onClick={() => onCreated(m.id, m.name)}
                    style={{ width:'100%', textAlign:'left', padding:'8px 12px', borderRadius:8, border:`1px solid rgba(245,158,11,0.2)`, background:'rgba(255,255,255,0.02)', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  >
                    <div>
                      <p style={{ margin:0, fontSize:12, fontWeight:700, color:C.text }}>{m.name}</p>
                      {m.manufacturer && <p style={{ margin:'1px 0 0', fontSize:10, color:C.muted }}>{m.manufacturer}</p>}
                    </div>
                    <span style={{ fontSize:10, fontWeight:800, color:C.indigoLight }}>Link →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Master DB search */}
          <div>
            <label style={lbl}><Database style={{ width:11, height:11, display:'inline', marginRight:5, color:C.indigoLight }} />Search Master Medicine Database</label>
            <div style={{ position:'relative' }}>
              <input
                value={masterQuery}
                onChange={e => searchMaster(e.target.value)}
                placeholder="Search 50,000+ medicines…"
                style={{ ...inp, paddingRight:36, background:'rgba(99,102,241,0.06)', border:`1px solid rgba(99,102,241,0.2)` }}
              />
              {masterSearching
                ? <Loader2 style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:C.indigoLight, animation:'spin 1s linear infinite' }} />
                : <Search style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:C.muted }} />
              }
            </div>
            {masterResults.length > 0 && (
              <div style={{ border:`1px solid ${C.cardBorder}`, borderRadius:10, overflow:'hidden', marginTop:4 }}>
                {masterResults.map((m, i) => (
                  <button key={m.id} onClick={() => applyMaster(m)}
                    style={{ width:'100%', textAlign:'left', padding:'10px 14px', border:'none', background:'transparent', cursor:'pointer', borderBottom: i < masterResults.length-1 ? `1px solid rgba(255,255,255,0.03)` : 'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <div>
                      <p style={{ margin:0, fontSize:12, fontWeight:700, color:C.text }}>{m.name}</p>
                      {(m.salt_composition || m.manufacturer) && (
                        <p style={{ margin:'2px 0 0', fontSize:10, color:C.muted }}>{m.salt_composition}{m.manufacturer ? ` · ${m.manufacturer}` : ''}</p>
                      )}
                    </div>
                    {m.strength && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:6, border:`1px solid ${C.cardBorder}`, color:C.subtle, flexShrink:0 }}>{m.strength}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ height:1, background:C.cardBorder }} />
          <p style={{ margin:0, fontSize:10, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em' }}>Or fill manually</p>

          {/* Medicine Name */}
          <div>
            <label style={lbl}>Medicine Name <span style={{ color:C.rose }}>*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="e.g. Amoxicillin 500mg Cap" />
          </div>

          {/* Generic + Manufacturer */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Generic / Salt</label>
              <input value={genericName} onChange={e => setGenericName(e.target.value)} style={inp} placeholder="e.g. Amoxicillin" />
            </div>
            <div>
              <label style={lbl}>Manufacturer</label>
              <input value={manufacturer} onChange={e => setManufacturer(e.target.value)} style={inp} placeholder="e.g. Cipla" />
            </div>
          </div>

          {/* Dosage Form + Strength */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Dosage Form <span style={{ color:C.rose }}>*</span></label>
              <select
                value={dosageForm}
                onChange={e => {
                  const v = e.target.value;
                  setDosageForm(v);
                  const isTabCap = ['Tablet','Capsule'].includes(v);
                  setPackUnit(isTabCap ? 'Strip' : v);
                  setPackSize(isTabCap ? 10 : 1);
                }}
                style={{ ...inp, appearance:'none', cursor:'pointer' }}
              >
                {DOSAGE_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Strength</label>
              <input value={strength} onChange={e => setStrength(e.target.value)} style={inp} placeholder="e.g. 500mg" />
            </div>
          </div>

          {/* Pack Unit + Pack Size */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Pack Unit</label>
              <input value={packUnit} onChange={e => setPackUnit(e.target.value)} style={inp} placeholder="Strip, Bottle…" />
            </div>
            <div>
              <label style={lbl}>Pack Size</label>
              <input type="number" min={1} value={packSize} onChange={e => setPackSize(Number(e.target.value)||1)} style={inp} />
            </div>
          </div>

          {/* HSN + GST */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>HSN Code</label>
              <input value={hsn} onChange={e => setHsn(e.target.value)} style={inp} placeholder="e.g. 300490" maxLength={8} />
            </div>
            <div>
              <label style={lbl}>Default GST Rate</label>
              <select value={gstRate} onChange={e => setGstRate(e.target.value)} style={{ ...inp, appearance:'none', cursor:'pointer' }}>
                {[0,5,12,18,28].map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 24px', borderTop:`1px solid ${C.cardBorder}`, flexShrink:0 }}>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            style={{
              width:'100%', padding:'13px', borderRadius:12, border:'none',
              background: (saving || !name.trim()) ? 'rgba(99,102,241,0.3)' : C.indigo,
              color: (saving || !name.trim()) ? 'rgba(255,255,255,0.4)' : '#fff',
              fontSize:14, fontWeight:800,
              cursor: (saving || !name.trim()) ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}
          >
            {saving
              ? <><Loader2 style={{ width:15, height:15, animation:'spin 1s linear infinite' }} />Saving…</>
              : <><Plus style={{ width:15, height:15 }} />Add Medicine & Link</>
            }
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Main Scan Page
   ══════════════════════════════════════════════════ */
export default function ScanBillPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore(s => s.pharmacyId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('capture');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string|null>(null);
  const [scanned, setScanned] = useState<ScannedBill|null>(null);
  const [items, setItems] = useState<ScannedItem[]>([]);

  const [supplierQuery, setSupplierQuery] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showSupDrop, setShowSupDrop] = useState(false);

  // Add medicine modal state
  const [addMedModal, setAddMedModal] = useState<{ idx: number; item: ScannedItem } | null>(null);

  const [saving, setSaving] = useState(false);

  /* ── File handler ── */
  const handleFile = useCallback(async (file: File) => {
    if (!pharmacyId) return;
    setScanError(null); setScanning(true);
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = ''; bytes.forEach(b => bin += String.fromCharCode(b));
      const base64 = btoa(bin);

      const resp = await fetch('/api/scan-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image: base64, mimeType: file.type }),
      });
      if (!resp.ok) { const e = await resp.json(); throw new Error(e.error || 'Scan failed'); }
      const result: ScannedBill = await resp.json();

      setScanned(result);
      if (result.supplier_name) setSupplierQuery(result.supplier_name);

      // Auto-match supplier
      if (result.supplier_name) {
        const { data: sups } = await supabase.from('suppliers').select('*')
          .eq('pharmacy_id', pharmacyId).ilike('name', `%${result.supplier_name}%`).limit(5);
        if (sups && sups.length > 0) { setSelectedSupplier(sups[0]); setSupplierQuery(sups[0].name); }
      }

      // Try auto-link medicines
      const enriched: ScannedItem[] = [];
      for (const it of result.items) {
        let mid: string | null = null;
        try {
          const { data: meds } = await supabase.from('medicines').select('id,name')
            .eq('pharmacy_id', pharmacyId).ilike('name', `%${it.medicine_name.split(' ')[0]}%`).limit(5);
          const exact = meds?.find((m: any) => m.name.toLowerCase() === it.medicine_name.toLowerCase());
          if (exact) mid = exact.id;
        } catch {}
        enriched.push({ ...it, medicine_id: mid, linked: !!mid });
      }
      setItems(enriched);
      setStep('review');
      toast.success(`${enriched.length} items extracted!`);
    } catch (e: any) {
      setScanError(e?.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  }, [pharmacyId, supabase]);

  const searchSup = async (q: string) => {
    setSupplierQuery(q); setSelectedSupplier(null);
    if (!pharmacyId || q.length < 1) { setSuppliers([]); return; }
    const { data } = await supabase.from('suppliers').select('*').eq('pharmacy_id', pharmacyId).ilike('name', `%${q}%`).limit(8);
    setSuppliers(data || []); setShowSupDrop(true);
  };

  const updateItem = (i: number, p: Partial<ScannedItem>) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...p } : it));
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const subtotal = scanned?.subtotal ?? items.reduce((s, i) => s + (i.amount || i.purchase_rate * i.quantity), 0);
  const gstTotal = scanned?.gst_amount ?? items.reduce((s, i) => s + ((i.gst_percentage || 0) / 100 * (i.amount || 0)), 0);
  const totalAmount = scanned?.total_amount ?? Math.round(subtotal + gstTotal);

  /* ── Save purchase ── */
  const savePurchase = async () => {
    if (!pharmacyId || !selectedSupplier) { toast.error('Select a supplier first'); return; }
    const unlinked = items.filter(i => !i.medicine_id);
    if (unlinked.length > 0) { toast.error(`${unlinked.length} items not linked. Link or remove them.`); return; }
    setSaving(true); setStep('saving');
    try {
      const billNum = scanned?.bill_number || `AI-${Date.now()}`;
      const { data: pur, error: pe } = await supabase.from('purchases').insert({
        pharmacy_id: pharmacyId, supplier_id: selectedSupplier.id,
        bill_number: billNum,
        bill_date: scanned?.bill_date || new Date().toISOString().split('T')[0],
        total_amount: totalAmount,
        payment_status: scanned?.payment_type === 'CASH' ? 'paid' : 'pending',
      }).select('id').single();
      if (pe) throw pe;

      for (const it of items) {
        await supabase.from('purchase_items').insert({
          purchase_id: pur.id, medicine_id: it.medicine_id,
          batch_number: it.batch_number || `B-${Date.now()}`,
          expiry_date: it.expiry_date || null,
          quantity: it.quantity, free_quantity: it.free_quantity || 0,
          purchase_price: it.purchase_rate, mrp: it.mrp,
          gst_rate: it.gst_percentage || 0,
          discount_percent: it.discount_percentage || 0,
          total_amount: it.amount,
        });
        const batchNum = it.batch_number || `B-${Date.now()}`;
        const totalQty = (it.quantity || 0) + (it.free_quantity || 0);
        const { data: batch } = await supabase.from('batches').insert({
          pharmacy_id: pharmacyId, medicine_id: it.medicine_id,
          batch_number: batchNum, expiry_date: it.expiry_date || null,
          purchase_price: it.purchase_rate, mrp: it.mrp,
          stock_quantity: totalQty,
        }).select('id').single();
        if (batch) {
          await supabase.from('inventory_transactions').insert({
            pharmacy_id: pharmacyId, batch_id: batch.id, medicine_id: it.medicine_id,
            transaction_type: 'purchase', reference_type: 'purchase', reference_id: pur.id,
            quantity_change: totalQty, quantity_after: totalQty,
          });
        }
      }
      toast.success('Purchase saved!');
      router.push('/panel/purchases');
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
      setStep('review');
    } finally { setSaving(false); }
  };

  /* ── STEP 1: CAPTURE ── */
  if (step === 'capture') return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={() => router.push('/panel/purchases')} style={{ width:38, height:38, borderRadius:10, border:`1px solid ${C.cardBorder}`, backgroundColor:C.card, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.muted }}>
          <ChevronLeft style={{ width:16, height:16 }} />
        </button>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:C.text, display:'flex', alignItems:'center', gap:10 }}>
            <ScanLine style={{ width:22, height:22, color:C.sky }} />Scan Purchase Bill
          </h1>
          <p style={{ margin:'2px 0 0', fontSize:12, color:C.muted }}>AI will read the invoice and pre-fill all items</p>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, backgroundColor:`${C.indigo}18`, color:C.indigo, fontSize:11, fontWeight:800, padding:'6px 14px', borderRadius:99, border:`1px solid ${C.indigo}25` }}>
          <Sparkles style={{ width:13, height:13 }} />ShelfCure AI
        </div>
      </div>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 0' }}>
        <div style={{ width:500, backgroundColor:C.card, borderRadius:20, border:`1px solid ${C.cardBorder}`, padding:40, textAlign:'center', boxShadow:'0 20px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ width:80, height:80, borderRadius:24, backgroundColor:`${C.sky}15`, border:`1px solid ${C.sky}25`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
            <ScanLine style={{ width:40, height:40, color:C.sky }} />
          </div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:C.text }}>Upload Invoice Image</h2>
          <p style={{ margin:'8px 0 32px', fontSize:14, color:C.muted, lineHeight:1.6 }}>Our AI engine extracts all items, batches, and GST automatically.</p>
          <label
            style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:160, border:`2px dashed ${scanning ? C.indigo : C.sky}`, borderRadius:16, backgroundColor:`${C.sky}05`, cursor:scanning ? 'wait' : 'pointer', marginBottom:24, transition:'all 0.2s' }}
            onMouseEnter={e => { if (!scanning) e.currentTarget.style.backgroundColor = `${C.sky}10`; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${C.sky}05`; }}
          >
            <input ref={fileRef} type="file" style={{ display:'none' }} accept="image/*,.pdf" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            {scanning
              ? <><Loader2 style={{ width:32, height:32, color:C.indigo, marginBottom:12, animation:'spin 1s linear infinite' }} /><p style={{ margin:0, fontSize:14, fontWeight:700, color:C.indigo }}>Scanning with ShelfCure AI…</p><p style={{ margin:'4px 0 0', fontSize:12, color:C.muted }}>This takes a few seconds</p></>
              : <><Upload style={{ width:32, height:32, color:C.sky, marginBottom:12 }} /><p style={{ margin:0, fontSize:14, fontWeight:700, color:C.sky }}>Click to upload invoice</p><p style={{ margin:'4px 0 0', fontSize:12, color:C.muted }}>JPG, PNG, PDF up to 10MB</p></>
            }
          </label>
          {scanError && (
            <div style={{ display:'flex', alignItems:'center', gap:8, backgroundColor:`${C.rose}15`, border:`1px solid ${C.rose}30`, borderRadius:12, padding:'10px 14px', color:C.rose, fontSize:12, fontWeight:600, textAlign:'left' }}>
              <AlertTriangle style={{ width:14, height:14, flexShrink:0 }} />{scanError}
            </div>
          )}
          <p style={{ margin:'20px 0 0', fontSize:12, color:C.muted }}>
            Prefer manual?{' '}
            <button onClick={() => router.push('/panel/purchases/manual')} style={{ background:'none', border:'none', color:C.indigo, fontWeight:700, cursor:'pointer', textDecoration:'underline' }}>Manual entry</button>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── STEP 3: SAVING ── */
  if (step === 'saving') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'120px 0', gap:14 }}>
      <Loader2 style={{ width:28, height:28, color:C.indigo, animation:'spin 1s linear infinite' }} />
      <p style={{ color:C.text, fontWeight:800, fontSize:16 }}>Saving purchase…</p>
      <p style={{ color:C.muted, fontSize:12 }}>Creating batches and inventory records</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── STEP 2: REVIEW ── */
  const linkedCount = items.filter(i => i.linked).length;
  const unlinkedCount = items.length - linkedCount;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, paddingBottom:80 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Add Medicine Modal */}
      {addMedModal && (
        <QuickAddMedicineModal
          pharmacyId={pharmacyId!}
          supabase={supabase}
          initialName={addMedModal.item.medicine_name}
          suggestedGst={addMedModal.item.gst_percentage}
          suggestedHsn={addMedModal.item.hsn_code}
          onClose={() => setAddMedModal(null)}
          onCreated={(id, name) => {
            updateItem(addMedModal.idx, { medicine_id: id, medicine_name: name, linked: true });
            setAddMedModal(null);
          }}
        />
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={() => setStep('capture')} style={{ width:38, height:38, borderRadius:10, border:`1px solid ${C.cardBorder}`, backgroundColor:C.card, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.muted }}>
          <ChevronLeft style={{ width:16, height:16 }} />
        </button>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:900, color:C.text }}>Review Scanned Bill</h1>
          <p style={{ margin:'2px 0 0', fontSize:11, color:C.muted }}>Verify items, link medicines, then save</p>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          {unlinkedCount > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:6, backgroundColor:`${C.amber}18`, color:C.amber, fontSize:11, fontWeight:800, padding:'6px 14px', borderRadius:99, border:`1px solid ${C.amber}25` }}>
              <AlertTriangle style={{ width:12, height:12 }} />{unlinkedCount} unlinked
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:6, backgroundColor:`${C.emerald}18`, color:C.emerald, fontSize:11, fontWeight:800, padding:'6px 14px', borderRadius:99, border:`1px solid ${C.emerald}25` }}>
            <CheckCircle2 style={{ width:12, height:12 }} />{linkedCount}/{items.length} linked
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20 }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Supplier */}
          <div style={{ backgroundColor:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:16, padding:20 }}>
            <h3 style={{ margin:'0 0 12px', fontSize:10, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.12em', display:'flex', alignItems:'center', gap:6 }}>
              <Truck style={{ width:13, height:13, color:C.amber }} />Supplier
            </h3>
            {selectedSupplier ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', backgroundColor:`${C.emerald}15`, border:`1px solid ${C.emerald}25`, borderRadius:10, padding:'10px 12px' }}>
                <div>
                  <p style={{ margin:0, fontSize:12, fontWeight:800, color:C.emerald }}>{selectedSupplier.name}</p>
                  {selectedSupplier.gstin && <p style={{ margin:'2px 0 0', fontSize:10, fontFamily:'monospace', color:`${C.emerald}99` }}>{selectedSupplier.gstin}</p>}
                </div>
                <button onClick={() => { setSelectedSupplier(null); setSupplierQuery(''); }} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer' }}>
                  <X style={{ width:14, height:14 }} />
                </button>
              </div>
            ) : (
              <div style={{ position:'relative' }}>
                <input
                  value={supplierQuery}
                  onChange={e => searchSup(e.target.value)}
                  onFocus={() => setShowSupDrop(true)}
                  placeholder="Search supplier…"
                  style={inp}
                />
                {showSupDrop && suppliers.length > 0 && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, marginTop:4, backgroundColor:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:10, zIndex:20, maxHeight:200, overflow:'auto' }}>
                    {suppliers.map(s => (
                      <button key={s.id} onClick={() => { setSelectedSupplier(s); setSupplierQuery(s.name); setShowSupDrop(false); }}
                        style={{ width:'100%', textAlign:'left', padding:'8px 12px', border:'none', backgroundColor:'transparent', color:C.text, fontSize:12, fontWeight:600, cursor:'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor='rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}
                      >
                        {s.name}{s.gstin && <span style={{ marginLeft:8, fontSize:10, color:C.muted }}>{s.gstin}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bill Info */}
          <div style={{ backgroundColor:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:16, padding:20, display:'flex', flexDirection:'column', gap:10 }}>
            <h3 style={{ margin:0, fontSize:10, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.12em' }}>Bill Info</h3>
            {[
              { l:'Bill #', v:scanned?.bill_number },
              { l:'Date', v:scanned?.bill_date },
              { l:'Payment', v:scanned?.payment_type },
            ].map(({ l, v }) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12 }}>
                <span style={{ color:C.muted }}>{l}</span>
                <span style={{ fontWeight:700, color:C.text }}>{v || '—'}</span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ backgroundColor:C.card, border:`1px solid ${C.cardBorder}`, borderRadius:16, padding:20, display:'flex', flexDirection:'column', gap:8 }}>
            <h3 style={{ margin:0, fontSize:10, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.12em' }}>Summary</h3>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}><span style={{ color:C.muted }}>Subtotal</span><span style={{ fontWeight:700, color:C.text }}>{formatCurrency(subtotal)}</span></div>
            {(scanned?.bill_discount || 0) > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}><span style={{ color:C.muted }}>Discount</span><span style={{ fontWeight:700, color:C.emerald }}>-{formatCurrency(scanned?.bill_discount || 0)}</span></div>}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}><span style={{ color:C.muted }}>GST</span><span style={{ fontWeight:700, color:C.text }}>{formatCurrency(gstTotal)}</span></div>
            <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:`1px solid ${C.cardBorder}`, fontSize:14 }}>
              <span style={{ fontWeight:800, color:C.text }}>Total</span>
              <span style={{ fontWeight:900, color:C.sky, fontSize:20 }}>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={savePurchase}
            disabled={saving || !selectedSupplier || unlinkedCount > 0}
            style={{
              width:'100%', padding:'14px 0', borderRadius:12, border:'none',
              background: (selectedSupplier && unlinkedCount === 0)
                ? `linear-gradient(135deg,${C.indigo},#4f46e5)`
                : 'rgba(255,255,255,0.04)',
              color: (selectedSupplier && unlinkedCount === 0) ? '#fff' : C.muted,
              fontSize:13, fontWeight:900,
              cursor: (selectedSupplier && unlinkedCount === 0) ? 'pointer' : 'not-allowed',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              boxShadow: (selectedSupplier && unlinkedCount === 0) ? `0 4px 14px ${C.indigo}40` : 'none',
            }}
          >
            {saving ? <Loader2 style={{ width:14, height:14, animation:'spin 1s linear infinite' }} /> : <Save style={{ width:14, height:14 }} />}
            Confirm &amp; Save Purchase
          </button>

          {unlinkedCount > 0 && (
            <p style={{ margin:0, fontSize:11, color:C.amber, textAlign:'center' }}>
              Link all {unlinkedCount} unlinked item{unlinkedCount > 1 ? 's' : ''} to enable save
            </p>
          )}
        </div>

        {/* ── RIGHT: Items ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <h3 style={{ margin:0, fontSize:10, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.12em' }}>
            Scanned Items ({items.length})
          </h3>

          {items.map((it, idx) => (
            <div key={idx} style={{ backgroundColor:C.card, border:`1px solid ${it.linked ? `${C.emerald}30` : `${C.amber}30`}`, borderRadius:14, overflow:'hidden', position:'relative' }}>
              <div style={{ display:'flex' }}>
                <div style={{ width:4, flexShrink:0, backgroundColor: it.linked ? C.emerald : C.amber }} />
                <div style={{ padding:14, flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <h4 style={{ margin:0, fontWeight:800, color:C.text, fontSize:13 }}>{it.medicine_name}</h4>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4, flexWrap:'wrap' }}>
                        {it.linked
                          ? <span style={{ fontSize:9, fontWeight:800, color:C.emerald, backgroundColor:`${C.emerald}15`, padding:'2px 8px', borderRadius:99 }}>✓ LINKED</span>
                          : <span style={{ fontSize:9, fontWeight:800, color:C.amber, backgroundColor:`${C.amber}15`, padding:'2px 8px', borderRadius:99 }}>⚠ UNLINKED</span>
                        }
                        {it.batch_number && <span style={{ fontSize:10, color:C.muted, fontFamily:'monospace' }}>Batch: {it.batch_number}</span>}
                        {it.expiry_date && <span style={{ fontSize:10, color:C.muted }}>Exp: {it.expiry_date}</span>}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      {!it.linked && (
                        <>
                          {/* Search existing medicine */}
                          <MedSearchBtn
                            pharmacyId={pharmacyId!}
                            supabase={supabase}
                            itemName={it.medicine_name}
                            onLink={id => updateItem(idx, { medicine_id: id, linked: true })}
                          />
                          {/* Add new medicine */}
                          <button
                            onClick={() => setAddMedModal({ idx, item: it })}
                            title="Add new medicine to inventory"
                            style={{ width:28, height:28, borderRadius:8, border:`1px solid rgba(99,102,241,0.3)`, backgroundColor:'rgba(99,102,241,0.1)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.indigoLight }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor='rgba(99,102,241,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor='rgba(99,102,241,0.1)'}
                          >
                            <Plus style={{ width:12, height:12 }} />
                          </button>
                        </>
                      )}
                      <button onClick={() => removeItem(idx)} title="Remove item"
                        style={{ width:28, height:28, borderRadius:8, border:`1px solid ${C.cardBorder}`, backgroundColor:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.muted }}
                        onMouseEnter={e => e.currentTarget.style.color=C.rose}
                        onMouseLeave={e => e.currentTarget.style.color=C.muted}
                      >
                        <Trash2 style={{ width:12, height:12 }} />
                      </button>
                    </div>
                  </div>

                  {/* Item details grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
                    {[
                      { l:'Qty', v: String(it.quantity) },
                      { l:'Rate', v: `₹${it.purchase_rate}` },
                      { l:'MRP', v: `₹${it.mrp}` },
                      { l:'GST', v: `${it.gst_percentage || 0}%` },
                      { l:'Amount', v: formatCurrency(it.amount) },
                    ].map(({ l, v }) => (
                      <div key={l} style={{ backgroundColor:'rgba(255,255,255,0.02)', border:`1px solid ${C.cardBorder}`, borderRadius:8, padding:'6px 8px' }}>
                        <p style={{ margin:0, fontSize:8, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.1em' }}>{l}</p>
                        <p style={{ margin:'2px 0 0', fontSize:12, fontWeight:800, color:C.text }}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Mini medicine search (link existing) ── */
function MedSearchBtn({ pharmacyId, supabase, itemName, onLink }: { pharmacyId:string; supabase:any; itemName:string; onLink:(id:string)=>void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(itemName);
  const [results, setResults] = useState<any[]>([]);

  const search = async (v: string) => {
    setQ(v);
    if (v.length < 2) { setResults([]); return; }
    const { data } = await supabase.from('medicines').select('id,name,manufacturer')
      .eq('pharmacy_id', pharmacyId).ilike('name', `%${v}%`).limit(6);
    setResults(data || []);
  };

  if (!open) return (
    <button
      onClick={() => { setOpen(true); search(itemName); }}
      title="Search existing medicine"
      style={{ width:28, height:28, borderRadius:8, border:`1px solid ${C.amber}30`, backgroundColor:`${C.amber}10`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.amber }}
    >
      <Search style={{ width:12, height:12 }} />
    </button>
  );

  return (
    <div style={{ position:'absolute', right:14, top:10, width:280, backgroundColor:'#0b0f24', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:10, zIndex:30, boxShadow:'0 8px 24px rgba(0,0,0,0.5)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
        <input value={q} onChange={e => search(e.target.value)} autoFocus placeholder="Search medicine…"
          style={{ flex:1, padding:'6px 8px', borderRadius:8, border:`1px solid ${C.inputBorder}`, backgroundColor:C.input, color:C.text, fontSize:11, outline:'none' }} />
        <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer' }}>
          <X style={{ width:12, height:12 }} />
        </button>
      </div>
      {results.length === 0
        ? <p style={{ margin:0, fontSize:11, color:C.muted, textAlign:'center', padding:8 }}>No results — use + to add new</p>
        : results.map(m => (
          <button key={m.id} onClick={() => { onLink(m.id); setOpen(false); }}
            style={{ width:'100%', textAlign:'left', padding:'6px 8px', border:'none', backgroundColor:'transparent', color:C.text, fontSize:11, fontWeight:600, cursor:'pointer', borderRadius:6 }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor='rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}
          >
            <div>{m.name}</div>
            {m.manufacturer && <div style={{ fontSize:9, color:C.muted }}>{m.manufacturer}</div>}
          </button>
        ))
      }
    </div>
  );
}
