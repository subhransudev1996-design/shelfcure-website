'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import { Upload, Loader2, ChevronLeft, Sparkles, Trash2, AlertTriangle, Truck, Plus, X, CheckCircle2, ScanLine, Edit3, Save, Search } from 'lucide-react';

const C = { card:'#0b0f24', cardBorder:'rgba(255,255,255,0.06)', text:'#f1f5f9', muted:'#475569', indigo:'#6366f1', emerald:'#10b981', amber:'#f59e0b', rose:'#f43f5e', sky:'#0ea5e9', input:'#111827', inputBorder:'rgba(255,255,255,0.08)' };

interface ScannedItem { medicine_name:string; batch_number:string|null; expiry_date:string|null; quantity:number; free_quantity:number|null; purchase_rate:number; mrp:number; gst_percentage:number|null; discount_percentage:number|null; amount:number; hsn_code:string|null; medicine_id?:string|null; linked?:boolean; }
interface ScannedBill { supplier_name:string|null; supplier_gstin:string|null; bill_number:string|null; bill_date:string|null; payment_type:string|null; items:ScannedItem[]; subtotal:number|null; bill_discount:number|null; bill_cgst:number|null; bill_sgst:number|null; total_amount:number|null; gst_amount:number|null; }
type Step = 'capture'|'review'|'saving';

export default function ScanBillPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore(s=>s.pharmacyId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [step,setStep] = useState<Step>('capture');
  const [scanning,setScanning] = useState(false);
  const [scanError,setScanError] = useState<string|null>(null);
  const [scanned,setScanned] = useState<ScannedBill|null>(null);
  const [items,setItems] = useState<ScannedItem[]>([]);
  const [supplierQuery,setSupplierQuery] = useState('');
  const [suppliers,setSuppliers] = useState<any[]>([]);
  const [selectedSupplier,setSelectedSupplier] = useState<any>(null);
  const [showSupDrop,setShowSupDrop] = useState(false);
  const [editIdx,setEditIdx] = useState<number|null>(null);
  const [saving,setSaving] = useState(false);

  const handleFile = useCallback(async(file:File)=>{
    if(!pharmacyId) return;
    setScanError(null); setScanning(true);
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin=''; bytes.forEach(b=>bin+=String.fromCharCode(b));
      const base64 = btoa(bin);
      const resp = await fetch('/api/scan-bill',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base64Image:base64,mimeType:file.type})});
      if(!resp.ok){ const e=await resp.json(); throw new Error(e.error||'Scan failed'); }
      const result:ScannedBill = await resp.json();
      setScanned(result);
      if(result.supplier_name) setSupplierQuery(result.supplier_name);
      // Try auto-match supplier
      if(result.supplier_name){
        const {data:sups}=await supabase.from('suppliers').select('*').eq('pharmacy_id',pharmacyId).ilike('name',`%${result.supplier_name}%`).limit(5);
        if(sups&&sups.length>0){setSelectedSupplier(sups[0]);setSupplierQuery(sups[0].name);}
      }
      // Try link medicines
      const enriched:ScannedItem[]=[];
      for(const it of result.items){
        let mid:string|null=null;
        try{
          const {data:meds}=await supabase.from('medicines').select('id,name').eq('pharmacy_id',pharmacyId).ilike('name',`%${it.medicine_name.split(' ')[0]}%`).limit(5);
          const exact=meds?.find(m=>m.name.toLowerCase()===it.medicine_name.toLowerCase());
          if(exact) mid=exact.id;
        }catch{}
        enriched.push({...it,medicine_id:mid,linked:!!mid});
      }
      setItems(enriched);
      setStep('review');
      toast.success(`${enriched.length} items extracted!`);
    }catch(e:any){setScanError(e?.message||'Scan failed');}
    finally{setScanning(false);}
  },[pharmacyId,supabase]);

  const searchSup = async(q:string)=>{
    setSupplierQuery(q);setSelectedSupplier(null);
    if(!pharmacyId||q.length<1){setSuppliers([]);return;}
    const {data}=await supabase.from('suppliers').select('*').eq('pharmacy_id',pharmacyId).ilike('name',`%${q}%`).limit(8);
    setSuppliers(data||[]);setShowSupDrop(true);
  };
  const updateItem=(i:number,p:Partial<ScannedItem>)=>setItems(prev=>prev.map((it,idx)=>idx===i?{...it,...p}:it));
  const removeItem=(i:number)=>setItems(prev=>prev.filter((_,idx)=>idx!==i));

  const subtotal=scanned?.subtotal??items.reduce((s,i)=>s+(i.amount||i.purchase_rate*i.quantity),0);
  const gstTotal=scanned?.gst_amount??items.reduce((s,i)=>s+((i.gst_percentage||0)/100*(i.amount||0)),0);
  const totalAmount=scanned?.total_amount??Math.round(subtotal+gstTotal);

  const savePurchase = async()=>{
    if(!pharmacyId||!selectedSupplier){toast.error('Select a supplier first');return;}
    const unlinked=items.filter(i=>!i.medicine_id);
    if(unlinked.length>0){toast.error(`${unlinked.length} items not linked. Link or remove them.`);return;}
    setSaving(true);setStep('saving');
    try{
      const billNum=scanned?.bill_number||`AI-${Date.now()}`;
      const {data:pur,error:pe}=await supabase.from('purchases').insert({
        pharmacy_id:pharmacyId,supplier_id:selectedSupplier.id,supplier_name:selectedSupplier.name,
        bill_number:billNum,bill_date:scanned?.bill_date||new Date().toISOString().split('T')[0],
        total_amount:totalAmount,payment_status:scanned?.payment_type==='CASH'?'paid':'pending',
      }).select('id').single();
      if(pe)throw pe;
      for(const it of items){
        await supabase.from('purchase_items').insert({
          purchase_id:pur.id,medicine_id:it.medicine_id,batch_number:it.batch_number||`B-${Date.now()}`,
          expiry_date:it.expiry_date||null,quantity:it.quantity,free_quantity:it.free_quantity||0,
          purchase_rate:it.purchase_rate,mrp:it.mrp,gst_rate:it.gst_percentage||0,
          discount_percentage:it.discount_percentage||0,amount:it.amount,
        });
        // Create batch + inventory
        const batchNum=it.batch_number||`B-${Date.now()}`;
        const totalQty=(it.quantity||0)+(it.free_quantity||0);
        const {data:batch}=await supabase.from('batches').insert({
          pharmacy_id:pharmacyId,medicine_id:it.medicine_id,batch_number:batchNum,
          expiry_date:it.expiry_date||null,purchase_rate:it.purchase_rate,mrp:it.mrp,
          current_quantity:totalQty,received_quantity:totalQty,
        }).select('id').single();
        if(batch){
          await supabase.from('inventory_transactions').insert({
            pharmacy_id:pharmacyId,batch_id:batch.id,medicine_id:it.medicine_id,
            transaction_type:'purchase',reference_type:'purchase',reference_id:pur.id,
            quantity_change:totalQty,quantity_after:totalQty,
          });
        }
      }
      toast.success('Purchase saved!');
      router.push('/panel/purchases');
    }catch(e:any){toast.error(e?.message||'Save failed');setStep('review');}
    finally{setSaving(false);}
  };

  // ── STEP 1: CAPTURE ──
  if(step==='capture'){
    return(
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <button onClick={()=>router.push('/panel/purchases')} style={{width:38,height:38,borderRadius:10,border:`1px solid ${C.cardBorder}`,backgroundColor:C.card,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.muted}}><ChevronLeft style={{width:16,height:16}}/></button>
          <div><h1 style={{margin:0,fontSize:22,fontWeight:900,color:C.text,display:'flex',alignItems:'center',gap:10}}><ScanLine style={{width:22,height:22,color:C.sky}}/>Scan Purchase Bill</h1><p style={{margin:'2px 0 0',fontSize:12,color:C.muted}}>AI will read the invoice and pre-fill items</p></div>
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,backgroundColor:C.indigo+'18',color:C.indigo,fontSize:11,fontWeight:800,padding:'6px 14px',borderRadius:99,border:`1px solid ${C.indigo}25`}}><Sparkles style={{width:13,height:13}}/>ShelfCure AI</div>
        </div>
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'60px 0'}}>
          <div style={{width:500,backgroundColor:C.card,borderRadius:20,border:`1px solid ${C.cardBorder}`,padding:40,textAlign:'center',boxShadow:'0 20px 40px rgba(0,0,0,0.5)'}}>
            <div style={{width:80,height:80,borderRadius:24,backgroundColor:C.sky+'15',border:`1px solid ${C.sky}25`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px'}}><ScanLine style={{width:40,height:40,color:C.sky}}/></div>
            <h2 style={{margin:0,fontSize:20,fontWeight:800,color:C.text}}>Upload Invoice Image</h2>
            <p style={{margin:'8px 0 32px',fontSize:14,color:C.muted,lineHeight:1.6}}>Our AI engine extracts items, batches, and GST automatically.</p>
            <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:160,border:`2px dashed ${scanning?C.indigo:C.sky}`,borderRadius:16,backgroundColor:C.sky+'05',cursor:scanning?'wait':'pointer',marginBottom:24,transition:'all 0.2s'}} onMouseEnter={e=>{if(!scanning)e.currentTarget.style.backgroundColor=C.sky+'10'}} onMouseLeave={e=>e.currentTarget.style.backgroundColor=C.sky+'05'}>
              <input ref={fileRef} type="file" style={{display:'none'}} accept="image/*,.pdf" onChange={e=>{if(e.target.files?.[0])handleFile(e.target.files[0])}}/>
              {scanning?(<><Loader2 style={{width:32,height:32,color:C.indigo,marginBottom:12,animation:'spin 1s linear infinite'}}/><p style={{margin:0,fontSize:14,fontWeight:700,color:C.indigo}}>Scanning with ShelfCure AI…</p><p style={{margin:'4px 0 0',fontSize:12,color:C.muted}}>This takes a few seconds</p></>):(<><Upload style={{width:32,height:32,color:C.sky,marginBottom:12}}/><p style={{margin:0,fontSize:14,fontWeight:700,color:C.sky}}>Click to upload invoice</p><p style={{margin:'4px 0 0',fontSize:12,color:C.muted}}>JPG, PNG, PDF up to 10MB</p></>)}
            </label>
            {scanError&&<div style={{display:'flex',alignItems:'center',gap:8,backgroundColor:C.rose+'15',border:`1px solid ${C.rose}30`,borderRadius:12,padding:'10px 14px',color:C.rose,fontSize:12,fontWeight:600,textAlign:'left'}}><AlertTriangle style={{width:14,height:14,flexShrink:0}}/>{scanError}</div>}
            <p style={{margin:'20px 0 0',fontSize:12,color:C.muted}}>Prefer manual? <button onClick={()=>router.push('/panel/purchases/manual')} style={{background:'none',border:'none',color:C.indigo,fontWeight:700,cursor:'pointer',textDecoration:'underline'}}>Manual entry</button></p>
          </div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── STEP 3: SAVING ──
  if(step==='saving'){
    return(<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'120px 0',gap:14}}><Loader2 style={{width:28,height:28,color:C.indigo,animation:'spin 1s linear infinite'}}/><p style={{color:C.text,fontWeight:800,fontSize:16}}>Saving purchase…</p><p style={{color:C.muted,fontSize:12}}>Creating batches and inventory records</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);
  }

  // ── STEP 2: REVIEW ──
  const linkedCount=items.filter(i=>i.linked).length;
  return(
    <div style={{display:'flex',flexDirection:'column',gap:20,paddingBottom:80}}>
      <div style={{display:'flex',alignItems:'center',gap:14}}>
        <button onClick={()=>setStep('capture')} style={{width:38,height:38,borderRadius:10,border:`1px solid ${C.cardBorder}`,backgroundColor:C.card,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.muted}}><ChevronLeft style={{width:16,height:16}}/></button>
        <div><h1 style={{margin:0,fontSize:20,fontWeight:900,color:C.text}}>Review Scanned Bill</h1><p style={{margin:'2px 0 0',fontSize:11,color:C.muted}}>Verify items and link medicines before saving</p></div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6,backgroundColor:C.emerald+'18',color:C.emerald,fontSize:11,fontWeight:800,padding:'6px 14px',borderRadius:99}}><Sparkles style={{width:13,height:13}}/>{items.length} items · {linkedCount} linked</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'340px 1fr',gap:20}}>
        {/* Left sidebar */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {/* Supplier */}
          <div style={{backgroundColor:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:16,padding:20}}>
            <h3 style={{margin:'0 0 10px',fontSize:10,fontWeight:800,color:C.muted,textTransform:'uppercase',letterSpacing:'0.12em',display:'flex',alignItems:'center',gap:6}}><Truck style={{width:13,height:13,color:C.amber}}/>Supplier</h3>
            {selectedSupplier?(
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',backgroundColor:C.emerald+'15',border:`1px solid ${C.emerald}25`,borderRadius:10,padding:'8px 12px'}}>
                <div><p style={{margin:0,fontSize:12,fontWeight:800,color:C.emerald}}>{selectedSupplier.name}</p>{selectedSupplier.gstin&&<p style={{margin:'2px 0 0',fontSize:10,fontFamily:'monospace',color:C.emerald+'99'}}>{selectedSupplier.gstin}</p>}</div>
                <button onClick={()=>{setSelectedSupplier(null);setSupplierQuery('');}} style={{background:'none',border:'none',color:C.muted,cursor:'pointer'}}><X style={{width:14,height:14}}/></button>
              </div>
            ):(
              <div style={{position:'relative'}}>
                <input value={supplierQuery} onChange={e=>searchSup(e.target.value)} onFocus={()=>setShowSupDrop(true)} placeholder="Search supplier…" style={{width:'100%',padding:'10px 12px',borderRadius:10,border:`1px solid ${C.inputBorder}`,backgroundColor:C.input,color:C.text,fontSize:12,fontWeight:600,outline:'none'}}/>
                {showSupDrop&&suppliers.length>0&&(
                  <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:4,backgroundColor:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:10,zIndex:20,maxHeight:200,overflow:'auto'}}>
                    {suppliers.map(s=><button key={s.id} onClick={()=>{setSelectedSupplier(s);setSupplierQuery(s.name);setShowSupDrop(false);}} style={{width:'100%',textAlign:'left',padding:'8px 12px',border:'none',backgroundColor:'transparent',color:C.text,fontSize:12,fontWeight:600,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.04)'} onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>{s.name}{s.gstin&&<span style={{marginLeft:8,fontSize:10,color:C.muted}}>{s.gstin}</span>}</button>)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bill info */}
          <div style={{backgroundColor:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:16,padding:20,display:'flex',flexDirection:'column',gap:10}}>
            <h3 style={{margin:0,fontSize:10,fontWeight:800,color:C.muted,textTransform:'uppercase',letterSpacing:'0.12em'}}>Bill Info</h3>
            {[{l:'Bill #',v:scanned?.bill_number,k:'bill_number'},{l:'Date',v:scanned?.bill_date,k:'bill_date'},{l:'Type',v:scanned?.payment_type,k:'payment_type'}].map(({l,v,k})=>(
              <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12}}>
                <span style={{color:C.muted}}>{l}</span>
                <span style={{fontWeight:700,color:C.text,fontFamily:k==='bill_number'?'monospace':'inherit'}}>{v||'—'}</span>
              </div>
            ))}
          </div>

          {/* Financial summary */}
          <div style={{backgroundColor:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:16,padding:20,display:'flex',flexDirection:'column',gap:8}}>
            <h3 style={{margin:0,fontSize:10,fontWeight:800,color:C.muted,textTransform:'uppercase',letterSpacing:'0.12em'}}>Summary</h3>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:C.muted}}>Subtotal</span><span style={{fontWeight:700,color:C.text}}>{formatCurrency(subtotal)}</span></div>
            {(scanned?.bill_discount||0)>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:C.muted}}>Discount</span><span style={{fontWeight:700,color:C.emerald}}>-{formatCurrency(scanned?.bill_discount||0)}</span></div>}
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:C.muted}}>GST</span><span style={{fontWeight:700,color:C.text}}>{formatCurrency(gstTotal)}</span></div>
            <div style={{display:'flex',justifyContent:'space-between',paddingTop:10,borderTop:`1px solid ${C.cardBorder}`,fontSize:14}}><span style={{fontWeight:800,color:C.text}}>Total</span><span style={{fontWeight:900,color:C.sky,fontSize:20}}>{formatCurrency(totalAmount)}</span></div>
          </div>

          {/* Save */}
          <button onClick={savePurchase} disabled={saving||!selectedSupplier} style={{width:'100%',padding:'14px 0',borderRadius:12,border:'none',background:selectedSupplier?`linear-gradient(135deg,${C.indigo},#4f46e5)`:'rgba(255,255,255,0.04)',color:selectedSupplier?'#fff':C.muted,fontSize:13,fontWeight:900,cursor:selectedSupplier?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:selectedSupplier?`0 4px 14px ${C.indigo}40`:'none'}}>
            {saving?<Loader2 style={{width:14,height:14,animation:'spin 1s linear infinite'}}/>:<Save style={{width:14,height:14}}/>}Confirm &amp; Save Purchase
          </button>
        </div>

        {/* Right — Items */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <h3 style={{margin:0,fontSize:10,fontWeight:800,color:C.muted,textTransform:'uppercase',letterSpacing:'0.12em'}}>Scanned Items ({items.length})</h3>
          {items.map((it,idx)=>(
            <div key={idx} style={{backgroundColor:C.card,border:`1px solid ${it.linked?C.emerald+'30':C.amber+'30'}`,borderRadius:14,overflow:'hidden',transition:'all 0.2s'}}>
              <div style={{display:'flex'}}>
                <div style={{width:4,flexShrink:0,backgroundColor:it.linked?C.emerald:C.amber}}/>
                <div style={{padding:14,flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{flex:1}}>
                      <h4 style={{margin:0,fontWeight:800,color:C.text,fontSize:13}}>{it.medicine_name}</h4>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                        {it.linked?<span style={{fontSize:9,fontWeight:800,color:C.emerald,backgroundColor:C.emerald+'15',padding:'2px 8px',borderRadius:99}}>✓ LINKED</span>:<span style={{fontSize:9,fontWeight:800,color:C.amber,backgroundColor:C.amber+'15',padding:'2px 8px',borderRadius:99}}>⚠ UNLINKED</span>}
                        {it.batch_number&&<span style={{fontSize:10,color:C.muted,fontFamily:'monospace'}}>Batch: {it.batch_number}</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      {!it.linked&&<MedSearchBtn pharmacyId={pharmacyId!} itemName={it.medicine_name} supabase={supabase} onLink={(id)=>updateItem(idx,{medicine_id:id,linked:true})}/>}
                      <button onClick={()=>removeItem(idx)} style={{width:28,height:28,borderRadius:8,border:`1px solid ${C.cardBorder}`,backgroundColor:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.muted}} title="Remove"><Trash2 style={{width:12,height:12}}/></button>
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
                    {[{l:'Qty',v:String(it.quantity)},{l:'Rate',v:`₹${it.purchase_rate}`},{l:'MRP',v:`₹${it.mrp}`},{l:'GST',v:`${it.gst_percentage||0}%`},{l:'Amount',v:formatCurrency(it.amount)}].map(({l,v})=>(
                      <div key={l} style={{backgroundColor:'rgba(255,255,255,0.02)',border:`1px solid ${C.cardBorder}`,borderRadius:8,padding:'6px 8px'}}>
                        <p style={{margin:0,fontSize:8,fontWeight:800,color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em'}}>{l}</p>
                        <p style={{margin:'2px 0 0',fontSize:12,fontWeight:800,color:C.text}}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* Mini medicine search button */
function MedSearchBtn({pharmacyId,itemName,supabase,onLink}:{pharmacyId:string;itemName:string;supabase:any;onLink:(id:string)=>void}){
  const [open,setOpen]=useState(false);
  const [q,setQ]=useState(itemName);
  const [results,setResults]=useState<any[]>([]);
  const search=async(v:string)=>{setQ(v);if(v.length<2){setResults([]);return;}const{data}=await supabase.from('medicines').select('id,name,manufacturer').eq('pharmacy_id',pharmacyId).ilike('name',`%${v}%`).limit(6);setResults(data||[]);};
  if(!open) return <button onClick={()=>{setOpen(true);search(itemName);}} style={{width:28,height:28,borderRadius:8,border:`1px solid #f59e0b30`,backgroundColor:'#f59e0b10',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#f59e0b'}} title="Link medicine"><Search style={{width:12,height:12}}/></button>;
  return(
    <div style={{position:'absolute',right:14,top:10,width:280,backgroundColor:'#0b0f24',border:'1px solid rgba(255,255,255,0.12)',borderRadius:12,padding:10,zIndex:30,boxShadow:'0 8px 24px rgba(0,0,0,0.5)'}}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}><input value={q} onChange={e=>search(e.target.value)} autoFocus placeholder="Search medicine…" style={{flex:1,padding:'6px 8px',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',backgroundColor:'#111827',color:'#f1f5f9',fontSize:11,outline:'none'}}/><button onClick={()=>setOpen(false)} style={{background:'none',border:'none',color:'#475569',cursor:'pointer'}}><X style={{width:12,height:12}}/></button></div>
      {results.length===0?<p style={{margin:0,fontSize:11,color:'#475569',textAlign:'center',padding:8}}>No results</p>:results.map(m=><button key={m.id} onClick={()=>{onLink(m.id);setOpen(false);}} style={{width:'100%',textAlign:'left',padding:'6px 8px',border:'none',backgroundColor:'transparent',color:'#f1f5f9',fontSize:11,fontWeight:600,cursor:'pointer',borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.04)'} onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}><div>{m.name}</div>{m.manufacturer&&<div style={{fontSize:9,color:'#475569'}}>{m.manufacturer}</div>}</button>)}
    </div>
  );
}
