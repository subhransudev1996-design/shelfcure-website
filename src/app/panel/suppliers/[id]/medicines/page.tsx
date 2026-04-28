'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Loader2, Pill, Search, Package2, AlertTriangle,
  PackageX, CalendarClock, Building2, ShoppingCart, RotateCcw,
  CheckSquare, Square, ListChecks, X, Plus, Minus, CheckCircle2,
  AlertCircle, Share2, Printer, ArrowRight,
} from 'lucide-react';

const NEAR_EXPIRY_DAYS = 90;

const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569', subtle: '#94a3b8',
  indigo: '#6366f1', indigoLight: '#818cf8',
  emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e',
  orange: '#f97316',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

interface Row {
  batch_id: string;
  medicine_id: string;
  medicine_name: string;
  batch_number: string | null;
  current_quantity: number;
  expiry_date: string | null;
  mrp: number | null;
  purchase_price: number | null;
  min_stock_level: number;
  reorder_level: number;
  is_low_stock: boolean;
  days_to_expiry: number;
  purchase_item_id: string | null;
  purchase_id: string | null;
}

type Tab = 'all' | 'lowstock' | 'expiry';

export default function SupplierMedicinesPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = String(params.id);
  const { pharmacyId } = usePanelStore();
  const supabase = useMemo(() => createClient(), []);

  const [supplier, setSupplier] = useState<{
    name: string; phone: string | null; address: string | null;
    city: string | null; state: string | null; gstin: string | null;
  } | null>(null);
  const [pharmacy, setPharmacy] = useState<{
    name: string | null; address: string | null; city: string | null;
    pincode: string | null; phone: string | null; gstin: string | null;
    license_number: string | null;
  } | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');

  /* Multi-select for reorder */
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /* Single reorder modal */
  const [reorderRow, setReorderRow] = useState<Row | null>(null);
  const [reorderQty, setReorderQty] = useState(1);
  const [reordering, setReordering] = useState(false);
  const [reorderDone, setReorderDone] = useState(false);

  /* Bulk reorder modal */
  const [showBulk, setShowBulk] = useState(false);
  const [bulkQty, setBulkQty] = useState<Record<string, number>>({});
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);

  /* Return modal */
  const [returnRow, setReturnRow] = useState<Row | null>(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnReason, setReturnReason] = useState('');
  const [returning, setReturning] = useState(false);

  const load = useCallback(async () => {
    if (!pharmacyId || !supplierId) return;
    setLoading(true);

    const { data: sup } = await supabase
      .from('suppliers')
      .select('name, phone, address, city, state, gstin')
      .eq('id', supplierId)
      .maybeSingle();
    setSupplier(sup as any);

    const { data: ph } = await supabase
      .from('pharmacies')
      .select('name, address, city, pincode, phone, gstin, license_number')
      .eq('id', pharmacyId)
      .maybeSingle();
    setPharmacy(ph as any);

    const { data: pursRaw } = await supabase
      .from('purchases')
      .select('id')
      .eq('pharmacy_id', pharmacyId)
      .eq('supplier_id', supplierId);
    const purchaseIds = (pursRaw || []).map((p: any) => p.id);

    type PIRow = { id: string; medicine_id: string; batch_number: string | null; purchase_id: string };
    let supplierItems: PIRow[] = [];
    if (purchaseIds.length > 0) {
      const { data: piRows } = await supabase
        .from('purchase_items')
        .select('id, medicine_id, batch_number, purchase_id')
        .in('purchase_id', purchaseIds);
      supplierItems = (piRows || []) as PIRow[];
    }

    // Build lookup keyed by (medicine_id, batch_number) → most recent purchase_item.
    const piByMedBatch = new Map<string, PIRow>();
    for (const it of supplierItems) {
      if (!it.batch_number) continue;
      const key = `${it.medicine_id}::${it.batch_number}`;
      const existing = piByMedBatch.get(key);
      if (!existing) piByMedBatch.set(key, it);
    }

    const batchSelect =
      'id, batch_number, stock_quantity, expiry_date, mrp, purchase_price, medicine_id, supplier_id, purchase_item_id, medicines(name, min_stock_level, reorder_level)';

    const merged = new Map<string, any>();
    {
      const { data } = await supabase
        .from('batches')
        .select(batchSelect)
        .eq('pharmacy_id', pharmacyId)
        .eq('supplier_id', supplierId)
        .limit(2000);
      for (const b of (data as any[]) || []) merged.set(b.id, b);
    }
    if (supplierItems.length > 0) {
      const piIds = supplierItems.map((p) => p.id);
      const { data } = await supabase
        .from('batches')
        .select(batchSelect)
        .eq('pharmacy_id', pharmacyId)
        .in('purchase_item_id', piIds)
        .limit(2000);
      for (const b of (data as any[]) || []) merged.set(b.id, b);

      const byMedicine = new Map<string, Set<string>>();
      for (const it of supplierItems) {
        if (!it.batch_number) continue;
        if (!byMedicine.has(it.medicine_id)) byMedicine.set(it.medicine_id, new Set());
        byMedicine.get(it.medicine_id)!.add(it.batch_number);
      }
      const medicineIds = Array.from(byMedicine.keys());
      const allBatchNumbers = Array.from(
        new Set(supplierItems.map((p) => p.batch_number).filter(Boolean) as string[]),
      );
      if (medicineIds.length > 0 && allBatchNumbers.length > 0) {
        const { data: data2 } = await supabase
          .from('batches')
          .select(batchSelect)
          .eq('pharmacy_id', pharmacyId)
          .in('medicine_id', medicineIds)
          .in('batch_number', allBatchNumbers)
          .limit(3000);
        for (const b of (data2 as any[]) || []) {
          const set = byMedicine.get(b.medicine_id);
          if (set && b.batch_number && set.has(b.batch_number)) {
            merged.set(b.id, b);
          }
        }
      }
    }

    const today = Date.now();
    const list: Row[] = Array.from(merged.values()).map((b: any) => {
      const exp = b.expiry_date ? new Date(b.expiry_date).getTime() : null;
      const days = exp ? Math.floor((exp - today) / 86400000) : 9999;
      const min = b.medicines?.min_stock_level ?? 10;
      const reorder = b.medicines?.reorder_level ?? min;
      const qty = Number(b.stock_quantity) || 0;
      const piMatch = b.batch_number ? piByMedBatch.get(`${b.medicine_id}::${b.batch_number}`) : null;
      return {
        batch_id: b.id,
        medicine_id: b.medicine_id,
        medicine_name: b.medicines?.name || 'Unknown',
        batch_number: b.batch_number,
        current_quantity: qty,
        expiry_date: b.expiry_date,
        mrp: b.mrp != null ? Number(b.mrp) : null,
        purchase_price: b.purchase_price != null ? Number(b.purchase_price) : null,
        min_stock_level: min,
        reorder_level: reorder,
        is_low_stock: qty <= reorder,
        days_to_expiry: days,
        purchase_item_id: b.purchase_item_id || piMatch?.id || null,
        purchase_id: piMatch?.purchase_id || null,
      };
    }).sort((a, b) => a.days_to_expiry - b.days_to_expiry);
    setRows(list);
    setLoading(false);
  }, [pharmacyId, supplierId, supabase]);

  useEffect(() => { load(); }, [load]);

  /* Derived rows */
  const lowStockRows = useMemo(
    () => rows.filter((r) => r.is_low_stock && r.current_quantity > 0),
    [rows],
  );
  // Dedup low stock by medicine — keep worst row.
  const lowStockByMedicine = useMemo(() => {
    const map = new Map<string, Row>();
    for (const r of lowStockRows) {
      const ex = map.get(r.medicine_id);
      if (!ex || r.current_quantity < ex.current_quantity) map.set(r.medicine_id, r);
    }
    return Array.from(map.values());
  }, [lowStockRows]);
  const expiryRows = useMemo(
    () => rows.filter((r) => r.days_to_expiry <= NEAR_EXPIRY_DAYS && r.current_quantity > 0),
    [rows],
  );
  const expiredCount = useMemo(() => expiryRows.filter((r) => r.days_to_expiry < 0).length, [expiryRows]);

  const filtered = useMemo(() => {
    let base: Row[] = rows;
    if (tab === 'lowstock') base = lowStockByMedicine;
    else if (tab === 'expiry') base = expiryRows;
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((r) =>
      r.medicine_name.toLowerCase().includes(q) ||
      (r.batch_number || '').toLowerCase().includes(q),
    );
  }, [rows, lowStockByMedicine, expiryRows, tab, search]);

  // Reset selection when leaving the low-stock tab.
  useEffect(() => { if (tab !== 'lowstock') setSelected(new Set()); }, [tab]);

  const toggleSelect = (medicineId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(medicineId)) next.delete(medicineId);
      else next.add(medicineId);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selected.size === lowStockByMedicine.length) setSelected(new Set());
    else setSelected(new Set(lowStockByMedicine.map((r) => r.medicine_id)));
  };

  /* ── Single reorder ── */
  const openReorder = (row: Row) => {
    setReorderRow(row);
    setReorderQty(Math.max(1, row.reorder_level - row.current_quantity));
    setReorderDone(false);
  };
  const closeReorder = () => {
    setReorderRow(null);
    setReorderDone(false);
  };
  const submitReorder = async () => {
    if (!reorderRow || !pharmacyId) return;
    if (reorderQty < 1) { toast.error('Quantity must be at least 1'); return; }
    setReordering(true);
    try {
      const { data: po, error: poErr } = await supabase
        .from('purchase_orders')
        .insert({ pharmacy_id: pharmacyId, supplier_id: supplierId, status: 'pending' })
        .select('id').single();
      if (poErr || !po) throw poErr || new Error('Failed to create order');
      const { error: itErr } = await supabase.from('purchase_order_items').insert({
        purchase_order_id: po.id,
        medicine_id: reorderRow.medicine_id,
        requested_quantity: reorderQty,
      });
      if (itErr) throw itErr;
      toast.success('Reorder created!');
      setReorderDone(true);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create reorder');
    } finally { setReordering(false); }
  };

  /* ── Bulk reorder ── */
  const openBulk = () => {
    const qtys: Record<string, number> = {};
    for (const r of lowStockByMedicine) {
      if (selected.has(r.medicine_id)) {
        qtys[r.medicine_id] = Math.max(1, r.reorder_level - r.current_quantity);
      }
    }
    setBulkQty(qtys);
    setBulkDone(false);
    setShowBulk(true);
  };
  const submitBulk = async () => {
    if (!pharmacyId) return;
    const items = Object.entries(bulkQty)
      .map(([medicine_id, qty]) => ({ medicine_id, requested_quantity: qty }))
      .filter((i) => i.requested_quantity >= 1);
    if (items.length === 0) { toast.error('No items to reorder'); return; }
    setBulkSubmitting(true);
    try {
      const { data: po, error: poErr } = await supabase
        .from('purchase_orders')
        .insert({ pharmacy_id: pharmacyId, supplier_id: supplierId, status: 'pending' })
        .select('id').single();
      if (poErr || !po) throw poErr || new Error('Failed to create order');
      const { error: itErr } = await supabase.from('purchase_order_items').insert(
        items.map((i) => ({
          purchase_order_id: po.id,
          medicine_id: i.medicine_id,
          requested_quantity: i.requested_quantity,
        })),
      );
      if (itErr) throw itErr;
      toast.success(`Bulk reorder created for ${items.length} items`);
      setBulkDone(true);
      setSelected(new Set());
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create bulk reorder');
    } finally { setBulkSubmitting(false); }
  };

  /* ── Return ── */
  const openReturnModal = (row: Row) => {
    setReturnRow(row);
    setReturnQty(1);
    setReturnReason(row.days_to_expiry < 0 ? 'Expired product return' : 'Near expiry return');
  };
  const submitReturn = async () => {
    if (!returnRow || !pharmacyId) return;
    if (returnQty < 1) { toast.error('Quantity must be at least 1'); return; }
    if (returnQty > returnRow.current_quantity) { toast.error(`Max returnable: ${returnRow.current_quantity}`); return; }
    if (!returnRow.purchase_item_id) { toast.error('Cannot trace original purchase for this batch'); return; }
    setReturning(true);
    try {
      const subtotal = returnQty * (returnRow.purchase_price || 0);
      const total_amount = parseFloat(subtotal.toFixed(2));
      const returnNumber = `PR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-4)}`;
      const { data: ret, error: retErr } = await supabase
        .from('purchase_returns')
        .insert({
          pharmacy_id: pharmacyId,
          supplier_id: supplierId,
          return_number: returnNumber,
          return_date: new Date().toISOString(),
          total_amount,
          item_count: 1,
          reason: returnReason || 'Standard Return',
        })
        .select('id').single();
      if (retErr || !ret) throw retErr || new Error('Return failed');

      await supabase.from('purchase_return_items').insert({
        purchase_return_id: ret.id,
        purchase_item_id: returnRow.purchase_item_id,
        medicine_id: returnRow.medicine_id,
        quantity: returnQty,
        total_amount,
      });

      const newQty = Math.max(0, returnRow.current_quantity - returnQty);
      await supabase.from('batches').update({ stock_quantity: newQty }).eq('id', returnRow.batch_id);
      await supabase.from('inventory_transactions').insert({
        pharmacy_id: pharmacyId,
        batch_id: returnRow.batch_id,
        medicine_id: returnRow.medicine_id,
        transaction_type: 'adjustment',
        reference_type: 'purchase_return',
        reference_id: ret.id,
        quantity_change: -returnQty,
        quantity_after: newQty,
      });

      toast.success(`Return processed · ${formatCurrency(total_amount)} credited`);
      setReturnRow(null);
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to process return');
    } finally { setReturning(false); }
  };

  const shareWhatsAppBulk = () => {
    const lines = Object.entries(bulkQty)
      .map(([id, qty], i) => {
        const r = lowStockByMedicine.find((x) => x.medicine_id === id);
        return `${i + 1}. ${r?.medicine_name || ''} - ${qty} Units`;
      });
    const text = `*Purchase Order Request*\nFrom: ${pharmacy?.name || 'Pharmacy'}\nTo: ${supplier?.name || 'Supplier'}\n\n${lines.join('\n')}`;
    const phone = normalizeIndianPhone(supplier?.phone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareWhatsAppSingle = () => {
    if (!reorderRow) return;
    const text = `*Purchase Order Request*\nFrom: ${pharmacy?.name || 'Pharmacy'}\nTo: ${supplier?.name || 'Supplier'}\n\n1. ${reorderRow.medicine_name} - ${reorderQty} Units`;
    const phone = normalizeIndianPhone(supplier?.phone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const printReorder = (rows: { medicine_name: string; current_quantity: number; qty: number }[]) => {
    const pharmacyAddr = pharmacy?.address
      ? `${pharmacy.address}${pharmacy?.city ? `, ${pharmacy.city}` : ''}${pharmacy?.pincode ? ` - ${pharmacy.pincode}` : ''}`
      : '';
    const pharmacyInfo = [
      pharmacy?.phone ? `Ph: ${pharmacy.phone}` : '',
      pharmacy?.gstin ? `GSTIN: ${pharmacy.gstin}` : '',
      pharmacy?.license_number ? `DL No: ${pharmacy.license_number}` : '',
    ].filter(Boolean).join(' &nbsp;&middot;&nbsp; ');
    const supplierAddr = supplier?.address
      ? [supplier.address, supplier.city, supplier.state].filter(Boolean).join(', ')
      : '';
    const trs = rows.map((r, i) =>
      `<tr><td>${i + 1}</td><td class="bold">${escapeHtml(r.medicine_name)}</td><td class="center">${r.current_quantity}</td><td class="big">${r.qty}</td></tr>`,
    ).join('');
    const totalQty = rows.reduce((s, r) => s + r.qty, 0);
    const html = `
      <div class="header">
        <h1>${escapeHtml(pharmacy?.name || 'Pharmacy')}</h1>
        ${pharmacyAddr ? `<p class="sub">${escapeHtml(pharmacyAddr)}</p>` : ''}
        ${pharmacyInfo ? `<p class="sub">${pharmacyInfo}</p>` : ''}
        <p class="badge">Purchase Order Request</p>
      </div>
      <div class="meta">
        <div>
          <p class="label">To (Supplier)</p>
          <p class="name">${escapeHtml(supplier?.name || '')}</p>
          ${supplier?.phone ? `<p>Phone: ${escapeHtml(supplier.phone)}</p>` : ''}
          ${supplierAddr ? `<p>Address: ${escapeHtml(supplierAddr)}</p>` : ''}
          ${supplier?.gstin ? `<p>GSTIN: ${escapeHtml(supplier.gstin)}</p>` : ''}
        </div>
        <div style="text-align:right">
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:40px">Sn</th>
            <th>Medicine Description</th>
            <th class="center" style="width:100px">Current Stock</th>
            <th class="center" style="width:100px">Qty to Order</th>
          </tr>
        </thead>
        <tbody>${trs}</tbody>
        <tfoot>
          <tr><td colspan="3" style="text-align:right;font-weight:900">Total Quantity:</td><td class="big">${totalQty}</td></tr>
        </tfoot>
      </table>
      <div class="signatures">
        <div class="sig-block"><p style="font-weight:700">Authorised Signature</p><p class="name">${escapeHtml(pharmacy?.name || '')}</p></div>
        <div class="sig-block"><p style="font-weight:700">Supplier Acknowledgement</p><p class="name">${escapeHtml(supplier?.name || '')}</p></div>
      </div>
      <div class="footer">
        <p>This is a purchase request only and not a tax invoice.</p>
        <p>Generated by ShelfCure &middot; ${new Date().toLocaleString('en-IN')}</p>
      </div>
    `;
    printHtmlInline(html);
  };

  const printSingle = () => {
    if (!reorderRow) return;
    printReorder([{ medicine_name: reorderRow.medicine_name, current_quantity: reorderRow.current_quantity, qty: reorderQty }]);
  };
  const printBulk = () => {
    const list = Object.entries(bulkQty).map(([mid, qty]) => {
      const r = lowStockByMedicine.find((x) => x.medicine_id === mid);
      return { medicine_name: r?.medicine_name || '', current_quantity: r?.current_quantity ?? 0, qty };
    });
    printReorder(list);
  };

  /* ─── Render ─── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => router.push(`/panel/suppliers/${supplierId}`)}
          style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Pill style={{ width: 22, height: 22, color: C.indigoLight }} />
            Supplier Medicines Database
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 style={{ width: 12, height: 12 }} />
            {supplier?.name || '—'} · {rows.length} batches
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatCard label="Total Batches" value={rows.length} color={C.indigoLight} />
        <StatCard label="Low Stock" value={lowStockByMedicine.length} color={lowStockByMedicine.length > 0 ? C.amber : C.muted} />
        <StatCard label="Near Expiry" value={expiryRows.length} color={expiryRows.length > 0 ? C.rose : C.muted} sub={expiredCount > 0 ? `${expiredCount} expired` : undefined} />
      </div>

      {/* Tabs + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, padding: 4, backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 12 }}>
          <TabBtn active={tab === 'all'} onClick={() => setTab('all')} label={`All (${rows.length})`} />
          <TabBtn active={tab === 'lowstock'} onClick={() => setTab('lowstock')} label={`Low Stock (${lowStockByMedicine.length})`} accent={lowStockByMedicine.length > 0 ? C.amber : undefined} />
          <TabBtn active={tab === 'expiry'} onClick={() => setTab('expiry')} label={`Expiry (${expiryRows.length})`} accent={expiryRows.length > 0 ? C.rose : undefined} />
        </div>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search style={{ width: 14, height: 14, color: C.muted, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicine or batch number…"
            style={{ width: '100%', padding: '10px 12px 10px 32px', backgroundColor: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10, color: C.text, fontSize: 13, outline: 'none' }}
          />
        </div>
      </div>

      {/* Body card */}
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 style={{ width: 20, height: 20, color: C.muted, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : tab === 'lowstock' ? (
          /* ── Low Stock tab ── */
          lowStockByMedicine.length === 0 ? (
            <Empty icon={CheckCircle2} text="All medicines are well-stocked" sub="No medicine from this supplier is below the reorder level." color={C.emerald} />
          ) : (
            <>
              <div style={{ padding: 12, backgroundColor: 'rgba(245,158,11,0.07)', borderBottom: `1px solid rgba(245,158,11,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#fcd34d' }}>
                  <AlertTriangle style={{ width: 14, height: 14 }} />
                  <span><b>{lowStockByMedicine.length}</b> medicine{lowStockByMedicine.length !== 1 ? 's' : ''} running low. Select multiple to reorder at once.</span>
                </div>
                {selected.size > 0 && (
                  <button onClick={() => setSelected(new Set())} style={{ background: 'none', border: 'none', color: C.amber, fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                    Clear selection
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 110px 110px 130px 140px', padding: '12px 16px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.015)', gap: 10 }}>
                <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                  {selected.size === lowStockByMedicine.length && lowStockByMedicine.length > 0
                    ? <CheckSquare style={{ width: 16, height: 16, color: C.indigo }} />
                    : <Square style={{ width: 16, height: 16, color: C.muted }} />}
                </button>
                {['Medicine', 'Stock', 'Reorder', 'Last Rate', 'Action'].map((h, i) => (
                  <p key={i} style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{h}</p>
                ))}
              </div>
              <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
                {filtered.map((m) => {
                  const isSel = selected.has(m.medicine_id);
                  return (
                    <div
                      key={m.medicine_id}
                      style={{
                        display: 'grid', gridTemplateColumns: '40px 2fr 110px 110px 130px 140px', alignItems: 'center', gap: 10,
                        padding: '12px 16px',
                        borderBottom: `1px solid rgba(255,255,255,0.03)`,
                        borderLeft: `2px solid ${isSel ? C.indigo : C.amber}`,
                        backgroundColor: isSel ? 'rgba(99,102,241,0.06)' : 'transparent',
                        transition: 'background 0.12s',
                      }}
                    >
                      <button onClick={() => toggleSelect(m.medicine_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                        {isSel
                          ? <CheckSquare style={{ width: 16, height: 16, color: C.indigo }} />
                          : <Square style={{ width: 16, height: 16, color: C.muted }} />}
                      </button>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.medicine_name}</p>
                        {m.current_quantity === 0 && (
                          <span style={{ fontSize: 9, fontWeight: 800, color: C.rose }}>OUT OF STOCK</span>
                        )}
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 900, color: m.current_quantity === 0 ? C.rose : C.amber }}>{m.current_quantity}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.subtle }}>{m.reorder_level}</span>
                      <span style={{ fontSize: 12, color: C.subtle }}>{m.purchase_price != null ? formatCurrency(m.purchase_price) : '—'}</span>
                      <button
                        onClick={() => openReorder(m)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, backgroundColor: C.indigo, color: '#fff', fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer' }}
                      >
                        <ShoppingCart style={{ width: 11, height: 11 }} /> Reorder
                      </button>
                    </div>
                  );
                })}
              </div>
              {selected.size > 0 && (
                <div style={{ position: 'sticky', bottom: 0, marginTop: 0, padding: 14, background: `linear-gradient(135deg, ${C.indigo}, #4f46e5)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', boxShadow: '0 -10px 30px -10px rgba(99,102,241,0.5)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ListChecks style={{ width: 15, height: 15, color: '#fff' }} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#fff' }}>{selected.size} medicine{selected.size !== 1 ? 's' : ''} selected</p>
                      <p style={{ margin: 0, fontSize: 10, color: '#c7d2fe' }}>Ready to bulk reorder</p>
                    </div>
                  </div>
                  <button
                    onClick={openBulk}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, backgroundColor: '#fff', color: C.indigo, fontSize: 13, fontWeight: 900, border: 'none', cursor: 'pointer' }}
                  >
                    <ShoppingCart style={{ width: 14, height: 14 }} /> Bulk Reorder ({selected.size})
                  </button>
                </div>
              )}
            </>
          )
        ) : tab === 'expiry' ? (
          /* ── Expiry tab ── */
          expiryRows.length === 0 ? (
            <Empty icon={CheckCircle2} text="No expiry concerns from this supplier" sub="No batches expiring within the next 90 days." color={C.emerald} />
          ) : (
            <>
              <div style={{ padding: 12, backgroundColor: 'rgba(244,63,94,0.07)', borderBottom: `1px solid rgba(244,63,94,0.2)`, fontSize: 12, color: '#fda4af', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle style={{ width: 14, height: 14 }} />
                {expiredCount > 0 && <span><b>{expiredCount}</b> already expired. </span>}
                {expiryRows.length - expiredCount > 0 && <span><b>{expiryRows.length - expiredCount}</b> expiring within 90 days.</span>}
                <span>&nbsp;Initiate a return directly from here.</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 130px 140px 90px 110px 130px', padding: '12px 18px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.015)', gap: 10 }}>
                {['Medicine', 'Batch', 'Expiry', 'Stock', 'Est. Return', 'Action'].map((h, i) => (
                  <p key={i} style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{h}</p>
                ))}
              </div>
              <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
                {filtered.map((m) => {
                  const expired = m.days_to_expiry < 0;
                  const returnValue = m.current_quantity * (m.purchase_price || 0);
                  return (
                    <div
                      key={m.batch_id}
                      style={{
                        display: 'grid', gridTemplateColumns: '2fr 130px 140px 90px 110px 130px', alignItems: 'center', gap: 10,
                        padding: '12px 18px',
                        borderBottom: `1px solid rgba(255,255,255,0.03)`,
                        borderLeft: `2px solid ${expired ? C.rose : C.orange}`,
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.medicine_name}</p>
                      <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>{m.batch_number || '—'}</span>
                      <ExpiryCell days={m.days_to_expiry} date={m.expiry_date} expired={expired} expiringSoon={!expired && m.days_to_expiry <= NEAR_EXPIRY_DAYS} />
                      <span style={{ fontSize: 16, fontWeight: 900, color: expired ? C.rose : C.orange }}>{m.current_quantity}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{formatCurrency(returnValue)}</span>
                      {m.purchase_item_id ? (
                        <button
                          onClick={() => openReturnModal(m)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, backgroundColor: expired ? C.rose : C.orange, color: '#fff', fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer' }}
                        >
                          <RotateCcw style={{ width: 11, height: 11 }} />
                          {expired ? 'Return Now' : 'Initiate Return'}
                        </button>
                      ) : (
                        <span style={{ fontSize: 10, color: C.muted, fontStyle: 'italic' }}>No purchase link</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )
        ) : (
          /* ── All tab ── */
          filtered.length === 0 ? (
            <Empty icon={Pill} text="No batches found from this supplier" sub="Purchase bills must have this supplier selected at entry." color={C.muted} />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 130px 110px 130px 110px 110px', padding: '12px 18px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.015)', gap: 10 }}>
                {['Medicine', 'Batch', 'Stock', 'Expiry', 'Purchase', 'MRP'].map((h, i) => (
                  <p key={i} style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{h}</p>
                ))}
              </div>
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {filtered.map((m, i) => {
                  const expired = m.days_to_expiry < 0;
                  const expiringSoon = !expired && m.days_to_expiry <= NEAR_EXPIRY_DAYS;
                  return (
                    <div
                      key={m.batch_id}
                      onClick={() => router.push(`/panel/inventory/${m.medicine_id}`)}
                      style={{
                        display: 'grid', gridTemplateColumns: '2fr 130px 110px 130px 110px 110px', alignItems: 'center', gap: 10,
                        padding: '12px 18px', cursor: 'pointer',
                        borderBottom: i < filtered.length - 1 ? `1px solid rgba(255,255,255,0.03)` : 'none',
                        transition: 'background 0.12s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package2 style={{ width: 13, height: 13, color: C.indigoLight }} />
                        </div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.medicine_name}</p>
                      </div>
                      <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.batch_number || '—'}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: m.current_quantity === 0 ? C.muted : m.is_low_stock ? C.amber : C.emerald }}>
                        {m.current_quantity}{m.is_low_stock && m.current_quantity > 0 && ' ⚠'}
                      </span>
                      <ExpiryCell days={m.days_to_expiry} date={m.expiry_date} expired={expired} expiringSoon={expiringSoon} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{m.purchase_price != null ? formatCurrency(m.purchase_price) : '—'}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{m.mrp != null ? formatCurrency(m.mrp) : '—'}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )
        )}
      </div>

      {/* Single Reorder Modal */}
      {reorderRow && (
        <Modal onClose={closeReorder}>
          <ModalHeader icon={ShoppingCart} title="Add to Reorder" subtitle={supplier?.name || ''} onClose={closeReorder} />
          {reorderDone ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0 14px' }}>
                <div style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(16,185,129,0.15)', border: `1px solid rgba(16,185,129,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 style={{ width: 28, height: 28, color: C.emerald }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: C.text }}>Reorder Created!</p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: C.muted }}>Purchase order for <b>{reorderRow.medicine_name}</b> has been added.</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={printSingle} style={{ padding: '12px 16px', backgroundColor: '#1e293b', border: `1px solid #334155`, borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Printer style={{ width: 14, height: 14 }} /> Print Request
                </button>
                <button onClick={shareWhatsAppSingle} style={{ padding: '12px 16px', backgroundColor: 'rgba(16,185,129,0.12)', border: `1px solid rgba(16,185,129,0.3)`, borderRadius: 10, color: C.emerald, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Share2 style={{ width: 14, height: 14 }} /> Share via WhatsApp
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={closeReorder} style={{ flex: 1, padding: '10px 16px', backgroundColor: 'transparent', border: `1px solid ${C.cardBorder}`, borderRadius: 10, color: C.text, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Close</button>
                  <button onClick={() => router.push('/panel/purchases/orders')} style={{ flex: 1, padding: '10px 16px', backgroundColor: 'rgba(99,102,241,0.12)', border: `1px solid rgba(99,102,241,0.3)`, borderRadius: 10, color: C.indigoLight, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <ArrowRight style={{ width: 13, height: 13 }} /> View Orders
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginTop: 14 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>{reorderRow.medicine_name}</p>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: C.muted }}>
                  Stock: <b style={{ color: reorderRow.current_quantity === 0 ? C.rose : C.amber }}>{reorderRow.current_quantity}</b>
                  &nbsp;·&nbsp; Reorder Level: <b>{reorderRow.reorder_level}</b>
                </p>
              </div>
              <div style={{ marginTop: 14 }}>
                <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Quantity to Order</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Stepper onClick={() => setReorderQty((q) => Math.max(1, q - 1))} icon={Minus} />
                  <input
                    type="number" min={1} value={reorderQty}
                    onChange={(e) => setReorderQty(Math.max(1, Number(e.target.value) || 1))}
                    style={{ flex: 1, padding: '12px 14px', textAlign: 'center', backgroundColor: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10, color: C.text, fontSize: 18, fontWeight: 900, outline: 'none' }}
                  />
                  <Stepper onClick={() => setReorderQty((q) => q + 1)} icon={Plus} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <button onClick={closeReorder} style={{ flex: 1, padding: '10px 16px', backgroundColor: 'transparent', border: `1px solid ${C.cardBorder}`, borderRadius: 10, color: C.text, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                <button onClick={submitReorder} disabled={reordering} style={{ flex: 1, padding: '10px 16px', backgroundColor: C.indigo, border: 'none', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: reordering ? 0.6 : 1 }}>
                  {reordering ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <ShoppingCart style={{ width: 13, height: 13 }} />}
                  Confirm Reorder
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Bulk Reorder Modal */}
      {showBulk && (
        <Modal onClose={() => setShowBulk(false)} max={640}>
          {bulkDone ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '18px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(16,185,129,0.15)', border: `1px solid rgba(16,185,129,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 style={{ width: 30, height: 30, color: C.emerald }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.text }}>Reorder Saved!</p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: C.muted }}>Purchase order added for <b>{Object.keys(bulkQty).length}</b> medicines.</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={printBulk} style={{ padding: '12px 16px', backgroundColor: '#1e293b', border: `1px solid #334155`, borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Printer style={{ width: 14, height: 14 }} /> Print Request
                </button>
                <button onClick={shareWhatsAppBulk} style={{ padding: '12px 16px', backgroundColor: 'rgba(16,185,129,0.12)', border: `1px solid rgba(16,185,129,0.3)`, borderRadius: 10, color: C.emerald, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Share2 style={{ width: 14, height: 14 }} /> Share via WhatsApp
                </button>
                <button onClick={() => router.push('/panel/purchases/orders')} style={{ padding: '12px 16px', backgroundColor: 'rgba(99,102,241,0.12)', border: `1px solid rgba(99,102,241,0.3)`, borderRadius: 10, color: C.indigoLight, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ArrowRight style={{ width: 14, height: 14 }} /> View Orders
                </button>
                <button onClick={() => setShowBulk(false)} style={{ padding: '12px 16px', backgroundColor: 'transparent', border: 'none', color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Done
                </button>
              </div>
            </>
          ) : (
            <>
              <ModalHeader icon={ListChecks} title="Bulk Reorder" subtitle={`${Object.keys(bulkQty).length} medicines · ${supplier?.name || ''}`} onClose={() => setShowBulk(false)} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14, maxHeight: '50vh', overflowY: 'auto', paddingRight: 4 }}>
                {Object.keys(bulkQty).map((mid) => {
                  const r = lowStockByMedicine.find((x) => x.medicine_id === mid);
                  if (!r) return null;
                  const shortage = Math.max(0, r.reorder_level - r.current_quantity);
                  return (
                    <div key={mid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 12, backgroundColor: 'rgba(255,255,255,0.025)', border: `1px solid ${C.cardBorder}`, borderRadius: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.medicine_name}</p>
                        <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 10, color: C.muted }}>
                          <span>Stock: <b style={{ color: r.current_quantity === 0 ? C.rose : C.amber }}>{r.current_quantity}</b></span>
                          <span>Reorder: <b style={{ color: C.subtle }}>{r.reorder_level}</b></span>
                          <span>Shortage: <b style={{ color: C.indigoLight }}>{shortage}</b></span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <Stepper small onClick={() => setBulkQty((p) => ({ ...p, [mid]: Math.max(1, (p[mid] || 1) - 1) }))} icon={Minus} />
                        <input
                          type="number" min={1}
                          value={bulkQty[mid] || 1}
                          onChange={(e) => setBulkQty((p) => ({ ...p, [mid]: Math.max(1, Number(e.target.value) || 1) }))}
                          style={{ width: 56, padding: '6px 8px', textAlign: 'center', backgroundColor: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 8, color: C.text, fontSize: 13, fontWeight: 900, outline: 'none' }}
                        />
                        <Stepper small onClick={() => setBulkQty((p) => ({ ...p, [mid]: (p[mid] || 1) + 1 }))} icon={Plus} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 14, padding: 10, backgroundColor: 'rgba(99,102,241,0.07)', border: `1px solid rgba(99,102,241,0.2)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: C.indigoLight }}>
                <span>Total items: <b>{Object.keys(bulkQty).length}</b></span>
                <span>Total qty: <b>{Object.values(bulkQty).reduce((s, q) => s + q, 0)}</b></span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={() => setShowBulk(false)} style={{ flex: 1, padding: '10px 16px', backgroundColor: 'transparent', border: `1px solid ${C.cardBorder}`, borderRadius: 10, color: C.text, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                <button onClick={submitBulk} disabled={bulkSubmitting} style={{ flex: 1, padding: '10px 16px', backgroundColor: C.indigo, border: 'none', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: bulkSubmitting ? 0.6 : 1 }}>
                  {bulkSubmitting ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <ShoppingCart style={{ width: 13, height: 13 }} />}
                  Create Bulk Reorder
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Return Modal */}
      {returnRow && (
        <Modal onClose={() => setReturnRow(null)}>
          <ModalHeader icon={RotateCcw} title="Initiate Return" subtitle={supplier?.name || ''} onClose={() => setReturnRow(null)} accent={returnRow.days_to_expiry < 0 ? C.rose : C.orange} />
          <div style={{ marginTop: 14, padding: 12, backgroundColor: 'rgba(255,255,255,0.025)', border: `1px solid ${C.cardBorder}`, borderRadius: 10 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>{returnRow.medicine_name}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: C.muted, flexWrap: 'wrap' }}>
              <span>Batch: <b style={{ color: C.subtle, fontFamily: 'monospace' }}>{returnRow.batch_number || '—'}</b></span>
              <span>Expiry: <b style={{ color: returnRow.days_to_expiry < 0 ? C.rose : C.orange }}>{returnRow.expiry_date ? formatDate(returnRow.expiry_date) : '—'}</b></span>
              <span>In stock: <b style={{ color: C.text }}>{returnRow.current_quantity}</b></span>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Quantity to Return (max {returnRow.current_quantity})</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Stepper onClick={() => setReturnQty((q) => Math.max(1, q - 1))} icon={Minus} />
              <input
                type="number" min={1} max={returnRow.current_quantity} value={returnQty}
                onChange={(e) => setReturnQty(Math.max(1, Math.min(returnRow.current_quantity, Number(e.target.value) || 1)))}
                style={{ flex: 1, padding: '12px 14px', textAlign: 'center', backgroundColor: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10, color: C.text, fontSize: 18, fontWeight: 900, outline: 'none' }}
              />
              <Stepper onClick={() => setReturnQty((q) => Math.min(returnRow.current_quantity, q + 1))} icon={Plus} />
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: C.muted }}>
              Estimated credit: <b style={{ color: C.text }}>{formatCurrency(returnQty * (returnRow.purchase_price || 0))}</b>
            </p>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Reason</label>
            <input
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Reason for return…"
              style={{ width: '100%', padding: '10px 14px', backgroundColor: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10, color: C.text, fontSize: 13, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button onClick={() => setReturnRow(null)} style={{ flex: 1, padding: '10px 16px', backgroundColor: 'transparent', border: `1px solid ${C.cardBorder}`, borderRadius: 10, color: C.text, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
            <button onClick={submitReturn} disabled={returning} style={{ flex: 1, padding: '10px 16px', backgroundColor: returnRow.days_to_expiry < 0 ? C.rose : C.orange, border: 'none', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: returning ? 0.6 : 1 }}>
              {returning ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <RotateCcw style={{ width: 13, height: 13 }} />}
              Confirm Return
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({ label, value, color, sub }: { label: string; value: number; color: string; sub?: string }) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 14, padding: 16 }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
      <p style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 900, color }}>{value}</p>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 10, fontWeight: 800, color: C.rose, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sub}</p>}
    </div>
  );
}

function TabBtn({ active, onClick, label, accent }: { active: boolean; onClick: () => void; label: string; accent?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px', borderRadius: 8, border: 'none',
        backgroundColor: active ? C.indigo : 'transparent',
        color: active ? '#fff' : (accent || C.muted),
        fontSize: 12, fontWeight: 800, cursor: 'pointer',
        transition: 'all 0.12s',
      }}
    >
      {label}
    </button>
  );
}

function ExpiryCell({ days, date, expired, expiringSoon }: { days: number; date: string | null; expired: boolean; expiringSoon: boolean }) {
  if (!date) return <span style={{ fontSize: 11, color: C.muted }}>—</span>;
  const Icon = expired ? PackageX : expiringSoon ? AlertTriangle : CalendarClock;
  const color = expired ? C.rose : expiringSoon ? C.amber : C.muted;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color }}>
      <Icon style={{ width: 12, height: 12 }} />
      <span>
        {formatDate(date)}
        {expired && ' · expired'}
        {!expired && expiringSoon && ` · ${days}d`}
      </span>
    </span>
  );
}

function Empty({ icon: Icon, text, sub, color }: { icon: any; text: string; sub: string; color: string }) {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.04)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon style={{ width: 24, height: 24, color }} />
      </div>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>{text}</p>
      <p style={{ margin: '6px 0 0', fontSize: 12, color: C.muted }}>{sub}</p>
    </div>
  );
}

function Modal({ children, onClose, max = 480 }: { children: React.ReactNode; onClose: () => void; max?: number }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: max, backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 20, boxShadow: '0 30px 60px -20px rgba(0,0,0,0.7)', maxHeight: '90vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ icon: Icon, title, subtitle, onClose, accent = C.indigo }: { icon: any; title: string; subtitle: string; onClose: () => void; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${accent}1f`, border: `1px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 17, height: 17, color: accent }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</p>
        </div>
      </div>
      <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted, flexShrink: 0 }}>
        <X style={{ width: 13, height: 13 }} />
      </button>
    </div>
  );
}

function Stepper({ onClick, icon: Icon, small }: { onClick: () => void; icon: any; small?: boolean }) {
  const size = small ? 28 : 38;
  return (
    <button
      onClick={onClick}
      style={{ width: size, height: size, borderRadius: small ? 7 : 10, border: `1px solid ${C.inputBorder}`, backgroundColor: C.input, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
    >
      <Icon style={{ width: small ? 11 : 14, height: small ? 11 : 14 }} />
    </button>
  );
}

function normalizeIndianPhone(raw: string | null | undefined): string {
  let digits = (raw || '').replace(/\D/g, '');
  // If the supplier saved their number with a leading 0 (e.g. "09876543210"),
  // drop it before applying the country code.
  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
  // 10-digit local number → prepend India country code.
  if (digits.length === 10) return `91${digits}`;
  // Already 12 digits starting with 91 → leave as is.
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  // 11 digits with extra leading 1 (rare) or anything else: best-effort,
  // hand it to wa.me as digits-only.
  return digits;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function printHtmlInline(html: string, title = 'Purchase Order Request') {
  const existing = document.getElementById('__print-frame__');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = '__print-frame__';
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${title}</title>
    <style>
      @page { margin: 0; size: A4; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', system-ui, sans-serif; color: #000; background: #fff; padding: 15mm; font-size: 11pt; line-height: 1.5; }
      .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 14px; margin-bottom: 20px; }
      .header h1 { font-size: 18pt; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; margin: 0; }
      .header .sub { font-size: 9pt; margin-top: 4px; color: #333; }
      .header .badge { font-size: 11pt; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; margin-top: 10px; border: 1px solid #000; display: inline-block; padding: 3px 20px; }
      .meta { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 10pt; }
      .meta .label { font-weight: 700; font-size: 8pt; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 6px; }
      .meta .name { font-weight: 900; font-size: 12pt; margin-bottom: 2px; }
      .meta p { margin: 1px 0; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 10pt; }
      thead tr { border-bottom: 2px solid #000; }
      th { padding: 6px 4px; text-align: left; font-weight: 700; }
      th.center { text-align: center; }
      td { padding: 10px 4px; vertical-align: top; }
      td.center { text-align: center; }
      td.bold { font-weight: 700; }
      td.big { font-weight: 900; font-size: 12pt; text-align: center; }
      tbody tr { border-bottom: 1px solid #ccc; }
      tfoot tr { border-top: 2px solid #000; }
      tfoot td { font-weight: 900; padding: 10px 4px; }
      .signatures { display: flex; justify-content: space-between; margin-top: 48px; }
      .sig-block { flex: 1; border-top: 1px solid #000; padding-top: 8px; text-align: center; font-size: 10pt; margin: 0 24px; }
      .sig-block .name { font-size: 8pt; color: #666; margin-top: 4px; }
      .footer { margin-top: 24px; text-align: center; font-size: 8pt; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
      .footer p { margin: 1px 0; }
    </style></head><body>${html}</body></html>`);
  doc.close();

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 2000);
    }, 300);
  };
}
