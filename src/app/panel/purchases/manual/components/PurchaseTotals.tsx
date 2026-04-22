import { PurchaseLineItem, calcPurchaseItemGst } from './types';

const C = {
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc', 
  muted: '#94a3b8',
};

interface Props {
  lines: PurchaseLineItem[];
  interState: boolean;
}

export function PurchaseTotals({ lines, interState }: Props) {
  const lineItems = lines.map((l) => calcPurchaseItemGst(
    l.purchase_rate, l.quantity, l.gst_percentage, l.discount_percentage, interState
  ));

  const subtotal = lineItems.reduce((s, r) => s + r.baseAmount, 0);
  const totalDiscount = lineItems.reduce((s, r) => s + r.discountAmount, 0);
  const taxableTotal = lineItems.reduce((s, r) => s + r.taxableAmount, 0);
  
  const cgstTotal = lineItems.reduce((s, r) => s + r.cgstAmount, 0);
  const sgstTotal = lineItems.reduce((s, r) => s + r.sgstAmount, 0);
  const igstTotal = lineItems.reduce((s, r) => s + r.igstAmount, 0);

  const grandTotal = lineItems.reduce((s, r) => s + r.totalAmount, 0);

  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, border: `1px solid ${C.cardBorder}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
       {interState && (
         <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ea580c', backgroundColor: 'rgba(234, 88, 12, 0.1)', border: '1px solid rgba(234, 88, 12, 0.2)', borderRadius: 8, padding: '4px 8px', marginBottom: 8 }}>
           <span>⚡</span> IGST (Inter-State)
         </div>
       )}
       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted }}>
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
       </div>
       {totalDiscount > 0 && (
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#10b981', fontWeight: 600 }}>
            <span>Discount</span>
            <span>-₹{totalDiscount.toFixed(2)}</span>
         </div>
       )}
       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted }}>
          <span>Taxable</span>
          <span>₹{taxableTotal.toFixed(2)}</span>
       </div>

       {interState ? (
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted }}>
            <span>IGST ({lines[0]?.gst_percentage ?? 0}%)</span>
            <span>₹{igstTotal.toFixed(2)}</span>
         </div>
       ) : (
         <>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted }}>
              <span>CGST</span>
              <span>₹{cgstTotal.toFixed(2)}</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted }}>
              <span>SGST</span>
              <span>₹{sgstTotal.toFixed(2)}</span>
           </div>
         </>
       )}
       
       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: C.muted, paddingTop: 4, borderTop: `1px solid ${C.cardBorder}` }}>
          <span>GST Total</span>
          <span>₹{Math.round(cgstTotal + sgstTotal + igstTotal).toFixed(2)}</span>
       </div>
       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, color: C.text, paddingTop: 8, borderTop: `1px solid ${C.cardBorder}` }}>
          <span>Grand Total</span>
          <span>₹{Math.round(grandTotal).toFixed(2)}</span>
       </div>
    </div>
  );
}
