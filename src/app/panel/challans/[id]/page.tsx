'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { 
  ChevronLeft, FileText, Loader2, CheckCircle2, 
  XCircle, Clock, AlertTriangle, Package, 
  Truck, Calendar, ArrowRight, IndianRupee, ShoppingBag
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import toast from 'react-hot-toast';

/* ─── Palette ─── */
const C = {
  bg: '#020617',          
  card: '#0B1121',        
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc', 
  muted: '#94a3b8',
  primary: '#10b981',     // Emerald 500
  info: '#3b82f6',
  warning: '#f59e0b',
  danger: '#f43f5e',
  indigo: '#6366f1'
};

/* ─── Utility Functions ─── */
function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const ITEM_STATUS_STYLE: Record<string, any> = {
  pending: { bg: 'rgba(245,158,11,0.1)', text: C.warning, border: 'rgba(245,158,11,0.2)' },
  accepted: { bg: 'rgba(16,185,129,0.1)', text: C.primary, border: 'rgba(16,185,129,0.2)' },
  returned: { bg: 'rgba(244,63,94,0.1)', text: C.danger, border: 'rgba(244,63,94,0.2)' },
  partial: { bg: 'rgba(59,130,246,0.1)', text: C.info, border: 'rgba(59,130,246,0.2)' },
  partially_accepted: { bg: 'rgba(59,130,246,0.1)', text: C.info, border: 'rgba(59,130,246,0.2)' },
};

function fmtQty(qty: number, item: { sale_unit_mode: string; units_per_pack: number }): string {
  if (item.sale_unit_mode === "both" && item.units_per_pack > 1) {
    return `${qty} strip${qty !== 1 ? 's' : ''}`;
  }
  return `${qty}`;
}

function fmtUnitQty(qty: number, item: { sale_unit_mode: string; units_per_pack: number }): string {
  if (item.sale_unit_mode === "both" && item.units_per_pack > 1) {
    const strips = qty / item.units_per_pack;
    const isWhole = Number.isInteger(strips);
    return isWhole ? `${strips} strip${strips !== 1 ? 's' : ''}` : `${qty}`;
  }
  return `${qty}`;
}

function isFlexible(item: { sale_unit_mode: string; units_per_pack: number }): boolean {
  return item.sale_unit_mode === "both" && item.units_per_pack > 1;
}

export default function ChallanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);
  const challanId = params.id as string;
  
  const [challan, setChallan] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [acceptQtys, setAcceptQtys] = useState<Record<number, number>>({});
  
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paidAmount, setPaidAmount] = useState(0);

  const load = async () => {
    if (!pharmacyId || !challanId) return;
    setLoading(true);
    try {
      const { data: ch, error: chErr } = await supabase
        .from('challans')
        .select(`*, suppliers(name)`)
        .eq('id', challanId)
        .eq('pharmacy_id', pharmacyId)
        .single();
        
      if (chErr) throw chErr;
      
      const { data: itm, error: itmErr } = await supabase
        .from('challan_items')
        .select(`*, medicines(name, sale_unit_mode, units_per_pack)`)
        .eq('challan_id', challanId)
        .order('id');
        
      if (itmErr) throw itmErr;
      
      const { data: batches, error: batchErr } = await supabase
        .from('batches')
        .select('id, medicine_id, batch_number, stock_quantity')
        .eq('pharmacy_id', pharmacyId)
        .eq('challan_id', challanId);
        
      if (batchErr) throw batchErr;
      
      const enrichedItems = (itm || []).map(i => {
        const batch = (batches || []).find(b => b.medicine_id === i.medicine_id && b.batch_number === i.batch_number);
        const current_stock = batch?.stock_quantity || 0;
        const batch_id = batch?.id || 0;
        const sale_unit_mode = i.medicines?.sale_unit_mode || 'pack';
        const units_per_pack = i.medicines?.units_per_pack || 1;
        
        const flex = sale_unit_mode === "both" && units_per_pack > 1;
        const received_units = flex ? i.received_quantity * units_per_pack : i.received_quantity;
        const returned_units = flex ? i.returned_quantity * units_per_pack : i.returned_quantity;
        const sold_quantity = Math.max(0, received_units - current_stock - returned_units);
        const returnable_quantity = Math.min(current_stock, received_units);
        
        return {
          ...i,
          batch_id,
          sale_unit_mode,
          units_per_pack,
          current_stock,
          sold_quantity,
          returnable_quantity
        };
      });
      
      setChallan({
        ...ch,
        supplier_name: ch.suppliers?.name || 'Unknown'
      });
      setItems(enrichedItems);
      
      const init: Record<number, number> = {};
      enrichedItems.forEach(i => { init[i.id] = i.received_quantity; });
      setAcceptQtys(init);
      
    } catch (err: any) {
      toast.error("Failed to load challan details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId, challanId]);

  const isPending = challan?.status === "pending";
  const daysLeft = daysUntil(challan?.expected_return_date ?? null);

  const estimatedTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const inputQty = acceptQtys[item.id] ?? 0;
      const qty = isFlexible(item) ? inputQty * item.units_per_pack : inputQty;
      const base = item.purchase_rate * qty;
      const gst = base * item.gst_percentage / 100;
      return sum + base + gst;
    }, 0);
  }, [items, acceptQtys]);

  const handleAcceptAll = () => {
    const init: Record<number, number> = {};
    items.forEach(i => { init[i.id] = i.received_quantity; });
    setAcceptQtys(init);
    setShowAcceptModal(true);
  };

  const handleReturnAll = async () => {
    if (!pharmacyId || !challanId) return;

    const totalSold = items.reduce((sum, i) => sum + (i.sold_quantity || 0), 0);
    const msg = totalSold > 0
      ? `⚠️ ${totalSold} units have already been sold and will be AUTO-ACCEPTED.\nOnly unsold stock will be returned to the supplier.\n\nContinue?`
      : "Return ALL items? Unsold stock will be removed from inventory.";
    if (!confirm(msg)) return;

    setProcessing(true);
    try {
      let hasAnyAccepted = false;
      let totalReturnedQty = 0;
      let totalAutoAccepted = 0;

      for (const item of items) {
        const received_units = isFlexible(item) ? item.received_quantity * item.units_per_pack : item.received_quantity;
        
        // Auto accept whatever was sold
        const accepted = Math.min(item.sold_quantity, received_units);
        const returned = Math.max(0, received_units - accepted);

        totalAutoAccepted += accepted;
        totalReturnedQty += returned;

        const itemStatus = accepted === 0 ? "returned" : (accepted === received_units ? "accepted" : "partially_accepted");
        
        if (accepted > 0) hasAnyAccepted = true;

        await supabase
          .from('challan_items')
          .update({
            accepted_quantity: accepted,
            returned_quantity: returned,
            status: itemStatus
          })
          .eq('id', item.id);

        if (returned > 0 && item.batch_id) {
          const newCurrentStock = Math.max(0, item.current_stock - returned);
          await supabase
            .from('batches')
            .update({
              stock_quantity: newCurrentStock,
            })
            .eq('id', item.batch_id);

          await supabase
            .from('inventory_transactions')
            .insert({
              pharmacy_id: pharmacyId,
              batch_id: item.batch_id,
              medicine_id: item.medicine_id,
              transaction_type: 'adjustment',
              reference_type: 'challan_return',
              reference_id: challanId,
              quantity_change: -returned,
              quantity_after: newCurrentStock
            });
        }
      }

      const overallStatus = hasAnyAccepted ? "partially_accepted" : "returned";
      await supabase
        .from('challans')
        .update({ status: overallStatus })
        .eq('id', challanId);

      if (totalAutoAccepted > 0) {
        toast.success(`Returned ${totalReturnedQty} units.\n⚠️ ${totalAutoAccepted} units were auto-accepted (already sold).`);
      } else {
        toast.success(`Returned ${totalReturnedQty} units successfully.`);
      }

      await load();
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to return challan.");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmAccept = async () => {
    if (!pharmacyId || !challanId) return;
    setProcessing(true);
    try {
      let purchaseSubtotal = 0;
      let purchaseGst = 0;
      let hasAnyAccepted = false;
      let allReturned = true;
      const acceptedItemData = [];

      for (const item of items) {
        const inputQty = acceptQtys[item.id] ?? 0;
        const accepted = isFlexible(item) ? inputQty * item.units_per_pack : inputQty;
        const received_units = isFlexible(item) ? item.received_quantity * item.units_per_pack : item.received_quantity;
        
        const finalAccepted = Math.max(0, Math.min(accepted, received_units));
        const returned = received_units - finalAccepted;
        const itemStatus = finalAccepted === 0 ? "returned" : (finalAccepted === received_units ? "accepted" : "partially_accepted");

        await supabase
          .from('challan_items')
          .update({
            accepted_quantity: finalAccepted,
            returned_quantity: returned,
            status: itemStatus
          })
          .eq('id', item.id);

        if (returned > 0 && item.batch_id) {
          const newCurrentStock = Math.max(0, item.current_stock - returned);
          await supabase
            .from('batches')
            .update({
              stock_quantity: newCurrentStock,
            })
            .eq('id', item.batch_id);

          await supabase
            .from('inventory_transactions')
            .insert({
              pharmacy_id: pharmacyId,
              batch_id: item.batch_id,
              medicine_id: item.medicine_id,
              transaction_type: 'adjustment',
              reference_type: 'challan_return',
              reference_id: challanId,
              quantity_change: -returned,
              quantity_after: newCurrentStock
            });
        }

        if (finalAccepted > 0) {
          hasAnyAccepted = true;
          allReturned = false;
          
          const baseAmount = item.purchase_rate * finalAccepted;
          const gstAmount = baseAmount * item.gst_percentage / 100;
          purchaseSubtotal += baseAmount + gstAmount;
          purchaseGst += gstAmount;

          acceptedItemData.push({
            medicine_id: item.medicine_id,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date,
            quantity: finalAccepted,
            free_quantity: 0,
            purchase_rate: item.purchase_rate,
            mrp: item.mrp,
            gst_percentage: item.gst_percentage,
            discount_percentage: 0
          });
        }
      }

      if (hasAnyAccepted) {
        const { data: purchaseData, error: pErr } = await supabase
          .from('purchases')
          .insert({
            pharmacy_id: pharmacyId,
            supplier_id: challan.supplier_id,
            supplier_name: challan.supplier_name,
            bill_number: `CH-${challan.challan_number || challan.id}`,
            bill_date: new Date().toISOString().split('T')[0],
            total_amount: purchaseSubtotal,
            payment_status: paymentStatus,
            notes: `Converted from Challan #${challan.challan_number || challan.id}`
          })
          .select()
          .single();

        if (pErr) throw pErr;

        const pItems = acceptedItemData.map(i => ({
          purchase_id: purchaseData.id,
          pharmacy_id: pharmacyId,
          medicine_id: i.medicine_id,
          batch_number: i.batch_number,
          expiry_date: i.expiry_date,
          quantity: i.quantity,
          free_quantity: i.free_quantity,
          purchase_rate: i.purchase_rate,
          mrp: i.mrp,
          gst_rate: i.gst_percentage,
          total_amount: i.purchase_rate * i.quantity,
        }));

        await supabase.from('purchase_items').insert(pItems);

        await supabase
          .from('challans')
          .update({ 
            status: allReturned ? 'returned' : (items.some(i => (acceptQtys[i.id] ?? 0) < i.received_quantity) ? 'partially_accepted' : 'accepted'),
            linked_purchase_id: purchaseData.id
          })
          .eq('id', challanId);

        toast.success("Challan accepted successfully");
        router.push(`/panel/purchases/${purchaseData.id}`);
      } else {
        await supabase
          .from('challans')
          .update({ status: 'returned' })
          .eq('id', challanId);
          
        toast.success("Challan completely returned");
        await load();
      }
      
      setShowAcceptModal(false);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to accept challan.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, color: C.muted }}>
        <Loader2 style={{ width: 24, height: 24, color: C.primary }} className="animate-spin mb-2" />
        <span style={{ fontSize: 13 }}>Loading challan…</span>
      </div>
    );
  }

  if (!challan) {
    return (
      <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', color: C.muted }}>
        <FileText style={{ width: 40, height: 40, marginBottom: 12, opacity: 0.5 }} />
        <p style={{ fontSize: 14, fontWeight: 600 }}>Challan not found</p>
      </div>
    );
  }

  const overallStatusStyle = ITEM_STATUS_STYLE[challan.status] || ITEM_STATUS_STYLE.pending;

  return (
    <div style={{ paddingBottom: 32 }} className="animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => router.push("/panel/challans")}
          style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'transparent', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>
            Challan #{challan.challan_number || challan.id}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>
            {challan.supplier_name} · {formatDate(challan.challan_date)}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, backgroundColor: overallStatusStyle.bg, border: `1px solid ${overallStatusStyle.border}`, color: overallStatusStyle.text }}>
          {challan.status === "pending" && <Clock style={{ width: 14, height: 14 }} />}
          {challan.status === "accepted" && <CheckCircle2 style={{ width: 14, height: 14 }} />}
          {challan.status === "returned" && <XCircle style={{ width: 14, height: 14 }} />}
          {challan.status === "partially_accepted" && <AlertTriangle style={{ width: 14, height: 14 }} />}
          <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'capitalize' }}>
            {challan.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* ── Info cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 16 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: C.muted, fontWeight: 600 }}>Supplier</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Truck style={{ width: 14, height: 14, color: C.warning }} />
            {challan.supplier_name}
          </p>
        </div>
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 16 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: C.muted, fontWeight: 600 }}>Items / Qty</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package style={{ width: 14, height: 14, color: C.indigo }} />
            {challan.total_items} items · {challan.total_quantity} qty
          </p>
        </div>
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 16 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: C.muted, fontWeight: 600 }}>Challan Date</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar style={{ width: 14, height: 14, color: C.info }} />
            {formatDate(challan.challan_date)}
          </p>
        </div>
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 16 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: C.muted, fontWeight: 600 }}>Return Deadline</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: daysLeft !== null && daysLeft <= 3 ? C.danger : C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            {challan.expected_return_date ? (
              <>
                <Calendar style={{ width: 14, height: 14 }} />
                {formatDate(challan.expected_return_date)}
                {daysLeft !== null && <span style={{ fontSize: 10, opacity: 0.8 }}>({daysLeft}d)</span>}
              </>
            ) : (
              <span style={{ color: C.muted }}>No deadline</span>
            )}
          </p>
        </div>
      </div>

      {/* ── Linked purchase ── */}
      {challan.linked_purchase_id && (
        <button
          onClick={() => router.push(`/panel/purchases/${challan.linked_purchase_id}`)}
          style={{ width: '100%', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(99,102,241,0.1)', border: `1px solid rgba(99,102,241,0.2)`, borderRadius: 16, padding: '16px 20px', cursor: 'pointer' }}
        >
          <span style={{ fontSize: 14, fontWeight: 800, color: C.indigo }}>
            ✅ Converted to Purchase Bill
          </span>
          <span style={{ fontSize: 12, color: C.indigo, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
            View Purchase <ArrowRight style={{ width: 14, height: 14 }} />
          </span>
        </button>
      )}

      {/* ── Provisional stock notice ── */}
      {isPending && (
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, backgroundColor: 'rgba(59,130,246,0.1)', border: `1px solid rgba(59,130,246,0.2)`, borderRadius: 16, padding: '16px 20px' }}>
          <ShoppingBag style={{ width: 20, height: 20, color: C.info, flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.info }}>Provisional Stock Active</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>These items are already available for sale in POS. Accept to finalize the purchase, or return unsold stock.</p>
          </div>
        </div>
      )}

      {/* ── Stock Activity Summary ── */}
      {(() => {
        const totalReceivedStrips = items.reduce((s, i) => s + i.received_quantity, 0);
        const totalSoldUnits = items.reduce((s, i) => s + i.sold_quantity, 0);
        const totalInStock = items.reduce((s, i) => s + i.current_stock, 0);
        const totalReturnable = items.reduce((s, i) => s + i.returnable_quantity, 0);

        const allFlexible = items.length > 0 && items.every(i => isFlexible(i));
        const fmtReceived = allFlexible ? `${totalReceivedStrips} strip${totalReceivedStrips !== 1 ? 's' : ''}` : `${totalReceivedStrips}`;

        const fmtSold = allFlexible && items.length === 1 ? fmtUnitQty(totalSoldUnits, items[0]) : `${totalSoldUnits}`;
        const fmtInStock = allFlexible && items.length === 1 ? fmtUnitQty(totalInStock, items[0]) : `${totalInStock}`;
        const fmtReturnable = allFlexible && items.length === 1 ? fmtUnitQty(totalReturnable, items[0]) : `${totalReturnable}`;

        const saleValueAtMrp = items.reduce((s, i) => s + (i.sold_quantity * i.mrp), 0);
        const purchaseCostSold = items.reduce((s, i) => {
          const base = i.sold_quantity * i.purchase_rate;
          return s + base + (base * i.gst_percentage / 100);
        }, 0);

        const totalReceivedUnits = items.reduce((s, i) => s + (isFlexible(i) ? i.received_quantity * i.units_per_pack : i.received_quantity), 0);
        const soldPercent = totalReceivedUnits > 0 ? Math.round((totalSoldUnits / totalReceivedUnits) * 100) : 0;

        const isReturned = challan?.status === 'returned';
        const isAccepted = challan?.status === 'accepted';

        const totalReturnedUnits = items.reduce((s, i) => {
          const rq = i.returned_quantity;
          return s + (isFlexible(i) ? rq * i.units_per_pack : rq);
        }, 0);

        const dispositionLabel = isReturned ? "Returned" : isAccepted ? "Accepted" : "Sold (POS)";
        const dispositionFormatted = isReturned
          ? (allFlexible && items.length === 1 ? fmtUnitQty(totalReturnedUnits, items[0]) : `${totalReturnedUnits}`)
          : fmtSold;
        const dispositionColor = isReturned ? (totalReturnedUnits > 0 ? C.danger : C.muted) : (totalSoldUnits > 0 ? C.warning : C.muted);
        const dispositionIcon = isReturned ? <Truck style={{ width: 14, height: 14 }} /> : <ShoppingBag style={{ width: 14, height: 14 }} />;

        const fmtReturned = allFlexible && items.length === 1 ? fmtUnitQty(totalReturnedUnits, items[0]) : `${totalReturnedUnits}`;

        const statsArray = [
          { label: "Total Received", value: fmtReceived, icon: <Package style={{ width: 14, height: 14 }} />, color: C.text },
          { label: dispositionLabel, value: dispositionFormatted, icon: dispositionIcon, color: dispositionColor },
        ];

        if (!isReturned && totalReturnedUnits > 0) {
          statsArray.push({ label: "Returned", value: fmtReturned, icon: <Truck style={{ width: 14, height: 14 }} />, color: C.danger });
        }

        if (!isReturned) {
          statsArray.push(
            { label: "In Stock", value: fmtInStock, icon: <Package style={{ width: 14, height: 14 }} />, color: totalInStock > 0 ? C.primary : C.muted },
            { label: "Returnable", value: fmtReturnable, icon: <Truck style={{ width: 14, height: 14 }} />, color: totalReturnable > 0 ? C.info : C.muted },
          );
        }

        if (totalSoldUnits > 0 && !isReturned) {
          statsArray.push(
            { label: "Sale Value (MRP)", value: formatCurrency(saleValueAtMrp), icon: <IndianRupee style={{ width: 14, height: 14 }} />, color: saleValueAtMrp > 0 ? C.primary : C.muted },
          );
        }

        const badgeText = isReturned ? "100% returned" : `${soldPercent}% sold`;
        const showBadge = isReturned || totalSoldUnits > 0;

        return (
          <div style={{ marginBottom: 24, backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShoppingBag style={{ width: 16, height: 16, color: C.indigo }} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>Stock Activity Summary</h3>
              {showBadge && (
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, backgroundColor: isReturned ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', color: isReturned ? C.danger : C.primary, border: `1px solid ${isReturned ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                  {badgeText}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${statsArray.length}, minmax(0, 1fr))` }}>
              {statsArray.map((stat, idx) => (
                <div key={stat.label} style={{ padding: 16, borderRight: idx < statsArray.length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}>
                  <p style={{ margin: '0 0 6px', fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{stat.label}</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: stat.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {stat.icon}
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {totalSoldUnits > 0 && !isReturned && (
              <div style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                <div style={{ padding: '12px 20px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <p style={{ margin: 0, fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Per-Item Activity</p>
                </div>
                <div>
                  {items.map((item, idx) => {
                    const receivedUnits = isFlexible(item) ? item.received_quantity * item.units_per_pack : item.received_quantity;
                    const itemSoldPct = receivedUnits > 0 ? Math.round((item.sold_quantity / receivedUnits) * 100) : 0;
                    return (
                      <div key={item.id} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, borderTop: idx > 0 ? `1px solid ${C.cardBorder}` : 'none' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.medicines?.name || `Medicine #${item.medicine_id}`}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>{item.batch_number}</p>
                        </div>
                        <div style={{ width: 112, flexShrink: 0 }}>
                          <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${itemSoldPct}%`, backgroundColor: C.warning, borderRadius: 3 }} />
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: 10, color: C.muted, textAlign: 'center' }}>{itemSoldPct}% sold</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, textAlign: 'right', flexShrink: 0 }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 9, color: C.muted, textTransform: 'uppercase' }}>Sold</p>
                            <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 800, color: C.warning }}>{fmtUnitQty(item.sold_quantity, item)}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 9, color: C.muted, textTransform: 'uppercase' }}>In Stock</p>
                            <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 800, color: C.primary }}>{fmtUnitQty(item.current_stock, item)}</p>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 9, color: C.muted, textTransform: 'uppercase' }}>Sale Value</p>
                            <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 800, color: C.text }}>{formatCurrency(item.sold_quantity * item.mrp)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {totalSoldUnits > 0 && !isReturned && (
              <div style={{ borderTop: `1px solid rgba(16,185,129,0.2)`, padding: '12px 20px', backgroundColor: 'rgba(16,185,129,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.primary }}>Estimated Profit from Sold Items</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.primary }}>{formatCurrency(saleValueAtMrp - purchaseCostSold)}</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Items table ── */}
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.cardBorder}` }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>Challan Items</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${C.cardBorder}` }}>
                <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Medicine</th>
                <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Batch</th>
                <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Received</th>
                {isPending && <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Sold</th>}
                {isPending && <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>In Stock</th>}
                <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Rate</th>
                <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>MRP</th>
                <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>GST%</th>
                {isPending && <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Accept Qty</th>}
                <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const flex = isFlexible(item);
                const maxQty = item.received_quantity;
                const iStatus = ITEM_STATUS_STYLE[item.status] || ITEM_STATUS_STYLE.pending;
                
                return (
                  <tr key={item.id} style={{ borderBottom: idx < items.length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.medicines?.name || `Medicine #${item.medicine_id}`}</span>
                      {flex && (
                        <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, backgroundColor: 'rgba(99,102,241,0.1)', color: C.indigo, border: `1px solid rgba(99,102,241,0.2)` }}>
                          STRIP
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{item.batch_number}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: C.text, textAlign: 'right' }}>{fmtQty(item.received_quantity, item)}</td>
                    {isPending && (
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {item.sold_quantity > 0
                          ? <span style={{ fontSize: 12, fontWeight: 800, color: C.warning }}>{fmtUnitQty(item.sold_quantity, item)}</span>
                          : <span style={{ fontSize: 12, color: C.muted }}>0</span>
                        }
                      </td>
                    )}
                    {isPending && (
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>{fmtUnitQty(item.current_stock, item)}</span>
                      </td>
                    )}
                    <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted, textAlign: 'right' }}>{formatCurrency(item.purchase_rate)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted, textAlign: 'right' }}>{formatCurrency(item.mrp)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted, textAlign: 'right' }}>{item.gst_percentage}%</td>
                    {isPending && (
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <input
                            type="number"
                            min={0}
                            max={maxQty}
                            value={acceptQtys[item.id] ?? 0}
                            onChange={(e) => setAcceptQtys(prev => ({
                              ...prev,
                              [item.id]: Math.min(parseFloat(e.target.value) || 0, maxQty)
                            }))}
                            style={{ width: 60, padding: '4px 8px', borderRadius: 8, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.02)', color: C.text, fontSize: 12, textAlign: 'center', outline: 'none' }}
                            onFocus={e => e.currentTarget.style.borderColor = C.indigo}
                            onBlur={e => e.currentTarget.style.borderColor = C.cardBorder}
                          />
                          {flex && (
                            <span style={{ fontSize: 9, color: C.indigo, fontWeight: 600, marginTop: 4 }}>strips</span>
                          )}
                        </div>
                      </td>
                    )}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800, textTransform: 'capitalize', backgroundColor: iStatus.bg, color: iStatus.text, border: `1px solid ${iStatus.border}` }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {challan.notes && (
        <div style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 16 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: C.muted }}>Notes</p>
          <p style={{ margin: 0, fontSize: 13, color: C.text }}>{challan.notes}</p>
        </div>
      )}

      {/* ── Action bar ── */}
      {isPending && (
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={handleReturnAll}
            disabled={processing}
            style={{ padding: '10px 20px', borderRadius: 12, border: `1px solid rgba(244,63,94,0.3)`, backgroundColor: 'rgba(244,63,94,0.1)', color: C.danger, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.5 : 1 }}
          >
            <XCircle style={{ width: 16, height: 16 }} />
            Return All
          </button>
          <button
            onClick={handleAcceptAll}
            disabled={processing}
            style={{ padding: '10px 24px', borderRadius: 12, border: 'none', backgroundColor: C.primary, color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.5 : 1, boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
          >
            <CheckCircle2 style={{ width: 16, height: 16 }} />
            Accept & Convert to Purchase
          </button>
        </div>
      )}

      {/* ── Accept confirmation modal ── */}
      {showAcceptModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} className="animate-in fade-in">
          <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 24, width: '100%', maxWidth: 450, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} className="animate-in zoom-in-95 duration-200">
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.cardBorder}` }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 style={{ width: 20, height: 20, color: C.primary }} />
                Confirm Acceptance
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>
                A purchase bill will be created. Returned items will be removed from stock.
              </p>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary */}
              <div style={{ backgroundColor: 'rgba(16,185,129,0.05)', border: `1px solid rgba(16,185,129,0.2)`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.primary }}>
                  <span>Items accepting</span>
                  <span style={{ fontWeight: 800 }}>
                    {items.filter(i => (acceptQtys[i.id] ?? 0) > 0).length} of {items.length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.primary }}>
                  <span>Items returning</span>
                  <span style={{ fontWeight: 800 }}>
                    {items.filter(i => (acceptQtys[i.id] ?? 0) === 0).length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: C.primary, paddingTop: 8, borderTop: `1px solid rgba(16,185,129,0.2)` }}>
                  <span>Estimated Total</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IndianRupee style={{ width: 14, height: 14 }} />
                    {estimatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Payment */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}>Payment Status</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {["paid", "pending", "partial"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setPaymentStatus(s)}
                      style={{
                        padding: '8px 0', borderRadius: 12, fontSize: 12, fontWeight: 800, textTransform: 'capitalize', cursor: 'pointer', transition: 'all 0.2s',
                        backgroundColor: paymentStatus === s ? C.indigo : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${paymentStatus === s ? C.indigo : C.cardBorder}`,
                        color: paymentStatus === s ? '#fff' : C.muted
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {paymentStatus === "partial" && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ display: 'block', fontSize: 11, color: C.muted, marginBottom: 4 }}>Amount Paid (₹)</label>
                    <input
                      type="number"
                      value={paidAmount || ""}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.02)', color: C.text, fontSize: 14, outline: 'none' }}
                      onFocus={e => e.currentTarget.style.borderColor = C.indigo}
                      onBlur={e => e.currentTarget.style.borderColor = C.cardBorder}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderTop: `1px solid ${C.cardBorder}` }}>
              <button
                onClick={() => setShowAcceptModal(false)}
                style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'transparent', color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAccept}
                disabled={processing}
                style={{ padding: '8px 20px', borderRadius: 10, border: 'none', backgroundColor: C.primary, color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.5 : 1 }}
              >
                {processing && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
                Confirm & Create Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
