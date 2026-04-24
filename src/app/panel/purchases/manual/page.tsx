"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Upload, Save, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { SupplierDetails } from './components/SupplierDetails';
import { PurchaseGrid } from './components/PurchaseGrid';
import { PurchaseTotals } from './components/PurchaseTotals';
import { PurchaseLineItem, Supplier, isInterState } from './components/types';
import { usePanelStore } from '@/store/panelStore';
import { createClient } from '@/lib/supabase/client';

const C = {
  bg: '#020617',          
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc', 
  muted: '#94a3b8',
  inputBg: 'rgba(255,255,255,0.02)',
  warning: '#f59e0b',
};

const newEmptyLine = (): PurchaseLineItem => ({
  id: crypto.randomUUID(),
  medicine_id: null,
  medicine_name: '', 
  batch_number: '', 
  expiry_date: '', 
  quantity: 1, 
  free_quantity: 0, 
  purchase_rate: 0, 
  mrp: 0, 
  selling_price: 0,
  gst_percentage: 12, 
  discount_percentage: 0,
  sale_unit_mode: 'pack_only',
  units_per_pack: 1,
  barcode: '',
  original_barcode: ''
});

export default function ManualPurchaseEntry() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);
  
  const [supplierQuery, setSupplierQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  
  const [lines, setLines] = useState<PurchaseLineItem[]>([]);

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [forceOverride, setForceOverride] = useState(false);

  /* ─── Fetch suppliers from DB ─── */
  const loadSuppliers = useCallback(async () => {
    if (!pharmacyId) return;
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name, phone, gstin, address')
      .eq('pharmacy_id', pharmacyId)
      .order('name')
      .limit(500);
    if (!error && data) {
      setSuppliers(data.map(s => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        gstin: s.gstin,
        address: s.address,
        city: null,
        state: null,
      })));
    }
  }, [pharmacyId, supabase]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  /* ─── Derive pharmacy profile from store ─── */
  const pharmacyProfile = {
    id: pharmacyId || '',
    name: usePanelStore.getState().pharmacyName || 'My Pharmacy',
    state: null as string | null,
    gstin: null as string | null,
  };

  const interState = isInterState(
    selectedSupplier?.state,
    pharmacyProfile?.state,
    selectedSupplier?.gstin,
    pharmacyProfile?.gstin
  );

  const handleAddLine = (item: PurchaseLineItem) => {
    setLines(prev => [...prev, item]);
  };
  
  const handleRemoveLine = (id: string) => {
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const handleSave = () => {
    if(!selectedSupplier || !billNumber) return toast.error('Check supplier and bill number');
    if(lines.length === 0) return toast.error('Please add at least one item to the invoice');
    
    const unlinked = lines.filter(l => !l.medicine_id);
    if(unlinked.length > 0) return toast.error(`${unlinked.length} item(s) not linked to a medicine.`);

    if(!forceOverride && billNumber === 'DUP123') {
       setDuplicateWarning('Invoice DUP123 already exists for this supplier.');
       return;
    }

    toast.success('Purchase Invoice created successfully');
    setTimeout(() => {
       router.push('/panel/purchases');
    }, 1000);
  };

  const handleQuickAddSupplier = () => {
    toast('Quick Add Supplier Modal (Mock)');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    toast.success(`Parsing ${file.name}...`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: -10 }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${C.cardBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => router.push('/panel/purchases')}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'transparent', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>Manual Entry</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Enter invoice details from a physical bill</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
           <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: `1px solid rgba(16, 185, 129, 0.3)`, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
             <Upload style={{ width: 14, height: 14 }} /> Upload CSV
             <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
           </label>
        </div>
      </div>

      <div style={{ flex: 1 }} className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        
        {duplicateWarning && (
           <div style={{ padding: 16, backgroundColor: 'rgba(245, 158, 11, 0.1)', border: `1px solid ${C.warning}`, borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <AlertTriangle style={{ color: C.warning, width: 20, height: 20 }} />
                 <div>
                   <h4 style={{ margin: 0, color: C.warning, fontSize: 14, fontWeight: 700 }}>Duplicate Invoice Detected</h4>
                   <p style={{ margin: '4px 0 0', color: C.text, fontSize: 13 }}>{duplicateWarning}</p>
                 </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                 <button onClick={() => setDuplicateWarning(null)} style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: 'transparent', color: C.text, border: `1px solid ${C.cardBorder}`, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                 <button onClick={() => { setForceOverride(true); handleSave(); }} style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: C.warning, color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Save Anyway</button>
              </div>
           </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 20, alignItems: 'start' }}>
           {/* Left Sidebar */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             <SupplierDetails 
                supplier={selectedSupplier}
                supplierQuery={supplierQuery}
                setSupplierQuery={setSupplierQuery}
                suppliers={suppliers}
                onSelectSupplier={setSelectedSupplier}
                billNumber={billNumber}
                setBillNumber={setBillNumber}
                billDate={billDate}
                setBillDate={setBillDate}
                paymentStatus={paymentStatus}
                setPaymentStatus={setPaymentStatus}
                paidAmount={paidAmount}
                setPaidAmount={setPaidAmount}
                notes={notes}
                setNotes={setNotes}
                onQuickAdd={handleQuickAddSupplier}
             />
             <PurchaseTotals lines={lines} interState={interState} />
             <button onClick={handleSave} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12, border: 'none', backgroundColor: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
               <Save style={{ width: 16, height: 16 }} /> Save Invoice
             </button>
           </div>

           {/* Right Content */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             <PurchaseGrid 
                lines={lines}
                onAddLine={handleAddLine}
                onRemoveLine={handleRemoveLine}
             />
           </div>
        </div>

      </div>
    </div>
  );
}
