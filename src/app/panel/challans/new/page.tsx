"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Truck, Search, Trash2, Plus, FileText, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';

const C = {
  bg: '#020617',          
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc', 
  muted: '#94a3b8',
  inputBg: 'rgba(255,255,255,0.02)',
  warning: '#f59e0b',
  purple: '#a855f7',
  indigo: '#6366f1'
};

/* ─── Local Line Item ─── */
interface ChallanLine {
  id: string;
  medicine_id: number | null;
  medicine_name: string;
  batch_number: string;
  expiry_date: string;
  received_quantity: number;
  purchase_rate: number;
  mrp: number;
  gst_percentage: number;
  sale_unit_mode: string;
  units_per_pack: number;
}

const safeUUID = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const emptyLine = (): ChallanLine => ({
  id: safeUUID(),
  medicine_id: null,
  medicine_name: "",
  batch_number: "",
  expiry_date: "",
  received_quantity: 1,
  purchase_rate: 0,
  mrp: 0,
  gst_percentage: 12,
  sale_unit_mode: "pack_only",
  units_per_pack: 1,
});

export default function CreateChallanPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [challanNumber, setChallanNumber] = useState("");
  const [challanDate, setChallanDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [notes, setNotes] = useState("");

  /* ── Supplier ── */
  const [supplierQuery, setSupplierQuery] = useState("");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [showSupplierDrop, setShowSupplierDrop] = useState(false);

  /* ── Line items ── */
  const [lines, setLines] = useState<ChallanLine[]>([emptyLine()]);

  /* ── Medicine search per row ── */
  const [medSearch, setMedSearch] = useState<{
    lineId: string;
    query: string;
    results: any[];
    open: boolean;
  } | null>(null);

  /* ── UI state ── */
  const [saving, setSaving] = useState(false);

  // Search suppliers
  const searchSuppliers = useCallback(async (q: string) => {
    setSupplierQuery(q);
    setSelectedSupplier(null);
    if (!pharmacyId || q.length < 1) { setSuppliers([]); return; }
    
    const { data } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('pharmacy_id', pharmacyId)
      .ilike('name', `%${q}%`)
      .limit(10);
      
    if (data) {
      setSuppliers(data);
      setShowSupplierDrop(true);
    }
  }, [pharmacyId, supabase]);

  // Search medicines
  const searchMedicine = useCallback(async (lineId: string, q: string) => {
    setMedSearch({ lineId, query: q, results: [], open: true });
    if (!pharmacyId || q.length < 2) return;
    
    const { data } = await supabase
      .from('medicines')
      .select('id, name, manufacturer, sale_unit_mode, units_per_pack')
      .eq('pharmacy_id', pharmacyId)
      .ilike('name', `%${q}%`)
      .limit(10);
      
    if (data) {
      setMedSearch((s) => (s?.lineId === lineId ? { ...s, results: data } : s));
    }
  }, [pharmacyId, supabase]);

  const linkMedicine = (lineId: string, med: any) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? {
              ...l,
              medicine_id: med.id,
              medicine_name: med.name,
              sale_unit_mode: med.sale_unit_mode,
              units_per_pack: med.units_per_pack ?? 1,
            }
          : l
      )
    );
    setMedSearch(null);
  };

  const updateLine = (id: string, patch: Partial<ChallanLine>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const removeLine = (id: string) =>
    setLines((prev) => prev.filter((l) => l.id !== id));

  /* ── Save ── */
  const save = async () => {
    if (!pharmacyId) return;
    if (!selectedSupplier) return toast.error("Please select a supplier.");
    if (!challanNumber.trim()) return toast.error("Challan number is required.");
    
    const unlinked = lines.filter((l) => !l.medicine_id);
    if (unlinked.length > 0) return toast.error(`${unlinked.length} item(s) not linked to a medicine.`);
    if (lines.length === 0) return toast.error("At least one item is required.");

    setSaving(true);
    try {
      // Create challan
      const { data: challan, error: challanErr } = await supabase
        .from('challans')
        .insert({
          pharmacy_id: pharmacyId,
          supplier_id: selectedSupplier.id,
          supplier_name: selectedSupplier.name,
          challan_number: challanNumber.trim(),
          challan_date: challanDate,
          expected_return_date: expectedReturnDate || null,
          notes: notes || null,
          status: 'pending',
          total_items: lines.length,
          total_quantity: lines.reduce((acc, l) => acc + (l.received_quantity || 0), 0)
        })
        .select('id')
        .single();

      if (challanErr) throw challanErr;

      // Create items
      const itemsToInsert = lines.map((l) => ({
        challan_id: challan.id,
        medicine_id: l.medicine_id!,
        batch_number: l.batch_number || `CHN-${Date.now().toString().slice(-6)}`,
        expiry_date: l.expiry_date || `${new Date().getFullYear() + 1}-12-31`,
        received_quantity: l.received_quantity,
        accepted_quantity: 0,
        returned_quantity: 0,
        purchase_rate: l.purchase_rate,
        mrp: l.mrp,
        gst_percentage: l.gst_percentage,
        status: 'pending'
      }));

      const { error: itemsErr } = await supabase
        .from('challan_items')
        .insert(itemsToInsert);

      if (itemsErr) throw itemsErr;

      // Create provisional batches so medicines are immediately available in POS
      for (const line of lines) {
        if (!line.medicine_id) continue;

        const qty = line.received_quantity || 0;
        if (qty <= 0) continue;

        // Check if a batch with same medicine+batch_number already exists for this challan context
        const { data: existingBatch } = await supabase
          .from('batches')
          .select('id, stock_quantity')
          .eq('pharmacy_id', pharmacyId)
          .eq('medicine_id', line.medicine_id)
          .eq('batch_number', line.batch_number || `CHN-${Date.now().toString().slice(-6)}`)
          .maybeSingle();

        let batchId: string | null = null;

        if (existingBatch) {
          // Update existing batch quantity
          const newQty = (existingBatch.stock_quantity || 0) + qty;
          await supabase
            .from('batches')
            .update({
              stock_quantity: newQty,
            })
            .eq('id', existingBatch.id);
          batchId = existingBatch.id;
        } else {
          // Create new batch
          const { data: newBatch } = await supabase
            .from('batches')
            .insert({
              pharmacy_id: pharmacyId,
              medicine_id: line.medicine_id,
              batch_number: line.batch_number || `CHN-${Date.now().toString().slice(-6)}`,
              expiry_date: line.expiry_date || `${new Date().getFullYear() + 2}-12-31`,
              stock_quantity: qty,
              purchase_price: line.purchase_rate,
              mrp: line.mrp,
              challan_id: challan.id,
            })
            .select('id')
            .single();
          batchId = newBatch?.id || null;
        }

        // Log inventory transaction for provisional stock
        if (batchId) {
          await supabase.from('inventory_transactions').insert({
            pharmacy_id: pharmacyId,
            batch_id: batchId,
            medicine_id: line.medicine_id,
            transaction_type: 'purchase',
            reference_type: 'challan',
            reference_id: String(challan.id),
            quantity_change: qty,
            quantity_after: qty,
          });
        }
      }

      toast.success("Challan created successfully — stock is now available in POS");
      router.push("/panel/challans");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to save challan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: -10 }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${C.cardBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => router.push('/panel/challans')}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'transparent', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>Receive Challan</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Record goods received on approval from supplier</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }} className="pb-24">
        
        {/* ── Left Sidebar (Details) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Supplier */}
          <div style={{ backgroundColor: '#0b0f24', border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Truck style={{ width: 16, height: 16, color: C.warning }} />
              Supplier Details
            </h3>
            
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600 }}>SEARCH SUPPLIER *</label>
              <input
                value={selectedSupplier ? selectedSupplier.name : supplierQuery}
                onChange={(e) => searchSuppliers(e.target.value)}
                onFocus={() => setShowSupplierDrop(true)}
                placeholder="Type to search..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.inputBg, color: C.text, fontSize: 13, outline: 'none' }}
              />
              {showSupplierDrop && suppliers.length > 0 && !selectedSupplier && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, backgroundColor: '#1e293b', border: `1px solid ${C.cardBorder}`, borderRadius: 10, overflow: 'hidden', zIndex: 20 }}>
                  {suppliers.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => { setSelectedSupplier(s); setSupplierQuery(s.name); setShowSupplierDrop(false); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: C.text, borderBottom: `1px solid rgba(255,255,255,0.05)` }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {s.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {selectedSupplier && (
              <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>{selectedSupplier.name}</span>
                <button onClick={() => { setSelectedSupplier(null); setSupplierQuery(""); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: 2 }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            )}
          </div>

          {/* Challan Info */}
          <div style={{ backgroundColor: '#0b0f24', border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText style={{ width: 16, height: 16, color: C.purple }} />
              Challan Information
            </h3>
            
            <div>
              <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600 }}>CHALLAN NUMBER *</label>
              <input
                value={challanNumber}
                onChange={(e) => setChallanNumber(e.target.value)}
                placeholder="e.g. DC-2024-001"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.inputBg, color: C.text, fontSize: 13, outline: 'none' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600 }}>CHALLAN DATE *</label>
              <input
                type="date"
                value={challanDate}
                onChange={(e) => setChallanDate(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.inputBg, color: C.text, fontSize: 13, outline: 'none', colorScheme: 'dark' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600 }}>RETURN DEADLINE (OPTIONAL)</label>
              <input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.inputBg, color: C.text, fontSize: 13, outline: 'none', colorScheme: 'dark' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600 }}>NOTES</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional notes..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.inputBg, color: C.text, fontSize: 13, outline: 'none', resize: 'none' }}
              />
            </div>
          </div>

          <button onClick={save} disabled={saving} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12, border: 'none', backgroundColor: C.indigo, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'transform 0.2s', boxShadow: `0 4px 12px rgba(99, 102, 241, 0.3)`, opacity: saving ? 0.7 : 1 }}>
            <Save style={{ width: 16, height: 16 }} /> {saving ? 'Saving...' : 'Save Challan'}
          </button>
        </div>

        {/* ── Right Content (Line Items) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>Line Items ({lines.length})</h3>
            <p style={{ margin: 0, fontSize: 13, color: C.muted }}>Total Qty: <span style={{ color: C.text, fontWeight: 700 }}>{lines.reduce((s, l) => s + (l.received_quantity || 0), 0)}</span></p>
          </div>

          {lines.map((line, index) => (
            <div key={line.id} style={{ backgroundColor: '#0b0f24', border: `1px solid ${line.medicine_id ? C.cardBorder : 'rgba(245,158,11,0.3)'}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
              
              {/* Row Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 12, fontWeight: 700 }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: 12, width: 14, height: 14, color: C.muted }} />
                    <input
                      value={medSearch?.lineId === line.id ? medSearch.query : line.medicine_name}
                      onChange={(e) => {
                        updateLine(line.id, { medicine_name: e.target.value, medicine_id: null });
                        searchMedicine(line.id, e.target.value);
                      }}
                      placeholder="Search medicine..."
                      style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10, border: `1px solid ${line.medicine_id ? 'rgba(16,185,129,0.3)' : C.cardBorder}`, backgroundColor: line.medicine_id ? 'rgba(16,185,129,0.05)' : C.inputBg, color: C.text, fontSize: 13, outline: 'none', fontWeight: 600 }}
                    />
                  </div>
                  {medSearch?.lineId === line.id && medSearch.open && medSearch.results.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, backgroundColor: '#1e293b', border: `1px solid ${C.cardBorder}`, borderRadius: 10, overflow: 'hidden', zIndex: 20 }}>
                      {medSearch.results.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => linkMedicine(line.id, m)}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid rgba(255,255,255,0.05)` }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{m.manufacturer}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => removeLine(line.id)} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 style={{ width: 16, height: 16 }} />
                </button>
              </div>

              {/* Data Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {(() => {
                  const isFlexible = line.sale_unit_mode === "both" && line.units_per_pack > 1;
                  return [
                    { label: isFlexible ? "Qty (Strips)" : "Received Qty", key: "received_quantity" },
                    { label: "Purchase Rate", key: "purchase_rate" },
                    { label: "MRP", key: "mrp" },
                    { label: "GST %", key: "gst_percentage" },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 10, color: C.muted, marginBottom: 6, fontWeight: 600 }}>{label}</label>
                      <input
                        type="number"
                        value={(line as any)[key] || ""}
                        onChange={(e) => updateLine(line.id, { [key]: parseFloat(e.target.value) || 0 } as any)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.cardBorder}`, backgroundColor: C.inputBg, color: C.text, fontSize: 13, outline: 'none' }}
                      />
                      {key === "received_quantity" && isFlexible && (
                        <div style={{ fontSize: 10, color: C.indigo, marginTop: 4, fontWeight: 600 }}>
                          = {((line as any)[key] || 0) * line.units_per_pack} loose units
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>

              {/* Batch & Expiry */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: C.muted, marginBottom: 6, fontWeight: 600 }}>BATCH NUMBER</label>
                  <input
                    value={line.batch_number}
                    onChange={(e) => updateLine(line.id, { batch_number: e.target.value })}
                    placeholder="Leave empty to auto-generate"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.cardBorder}`, backgroundColor: C.inputBg, color: C.text, fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: C.muted, marginBottom: 6, fontWeight: 600 }}>EXPIRY DATE</label>
                  <input
                    type="date"
                    value={line.expiry_date}
                    onChange={(e) => updateLine(line.id, { expiry_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.cardBorder}`, backgroundColor: C.inputBg, color: C.text, fontSize: 13, outline: 'none', colorScheme: 'dark' }}
                  />
                </div>
              </div>

            </div>
          ))}

          <button
            onClick={() => setLines(prev => [...prev, emptyLine()])}
            style={{ width: '100%', padding: '16px', borderRadius: 16, border: `2px dashed ${C.cardBorder}`, backgroundColor: 'transparent', color: C.muted, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'; e.currentTarget.style.color = C.purple; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.color = C.muted; }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            Add Another Item
          </button>

        </div>
      </div>
    </div>
  );
}
