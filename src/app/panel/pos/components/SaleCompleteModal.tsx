'use client';

import { useState } from 'react';
import { CheckCircle2, Printer, MessageCircle, ReceiptText, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';

const C = {
  card: '#0d1225',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#6366f1',
  emerald: '#10b981',
};

export interface CompletedSaleData {
  saleId: string;
  billNumber: string;
  billDate: string;
  customerName: string | null;
  customerPhone: string | null;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  gstAmount: number;
  discountAmount: number;
  totalAmount: number;
  items: {
    medicine_name: string;
    batch_number: string;
    quantity: number;
    units_per_pack: number;
    selling_unit: 'pack' | 'unit' | 'both' | string;
    mrp: number;
    gst_percentage: number;
    amount: number;
  }[];
  pharmacy: {
    name: string | null;
    address: string | null;
    city: string | null;
    pincode: string | null;
    phone: string | null;
    gstin: string | null;
    license_number: string | null;
    upi_id: string | null;
    logo_url?: string | null;
  } | null;
}

type PrintFormat = 'a4' | 'thermal_112' | 'thermal_80' | 'thermal_58';

interface Props {
  open: boolean;
  data: CompletedSaleData | null;
  onClose: () => void;
  onNewSale: () => void;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function discPctLabel(discAmt: number, subtotal: number): string | null {
  if (!discAmt || !subtotal || discAmt <= 0 || subtotal <= 0) return null;
  const raw = (discAmt / subtotal) * 100;
  const rounded = Math.round(raw * 100) / 100;
  const expected = Number(((subtotal * rounded) / 100).toFixed(2));
  if (Math.abs(expected - discAmt) <= 0.02) return `${rounded}%`;
  return null;
}

export function SaleCompleteModal({ open, data, onClose, onNewSale }: Props) {
  const router = useRouter();
  const [printFormat, setPrintFormat] = useState<PrintFormat>('a4');

  if (!open || !data) return null;

  const upiLink = data.pharmacy?.upi_id
    ? `upi://pay?pa=${data.pharmacy.upi_id}&pn=${encodeURIComponent(data.pharmacy.name || 'Pharmacy')}&am=${data.totalAmount.toFixed(2)}&cu=INR`
    : '';

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const phone = data.customerPhone?.replace(/\D/g, '') || '';
    const lines = data.items.map((it, i) => `${i + 1}. ${it.medicine_name} × ${it.quantity} = ₹${it.amount.toFixed(2)}`).join('\n');
    const msg = [
      `*${data.pharmacy?.name || 'Bill'}*`,
      `Bill #${data.billNumber} · ${formatDate(data.billDate)}`,
      data.customerName ? `Customer: ${data.customerName}` : '',
      '',
      lines,
      '',
      `Subtotal: ₹${data.subtotal.toFixed(2)}`,
      data.gstAmount > 0 ? `GST: ₹${data.gstAmount.toFixed(2)}` : '',
      data.discountAmount > 0 ? `Discount: -₹${data.discountAmount.toFixed(2)}` : '',
      `*Total: ₹${data.totalAmount.toFixed(2)}*`,
      `Paid via ${data.paymentMethod.toUpperCase()} (${data.paymentStatus})`,
      data.pharmacy?.phone ? `\nContact: ${data.pharmacy.phone}` : '',
    ].filter(Boolean).join('\n');
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const hasGst = data.gstAmount > 0;
  const dpct = discPctLabel(data.discountAmount, data.subtotal);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} className="pos-success-modal">
      {/* Screen UI — hidden in print */}
      <div className="screen-ui" style={{ width: '100%', maxWidth: 380, background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px 18px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <CheckCircle2 style={{ width: 32, height: 32, color: C.emerald }} />
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.text }}>Sale Complete!</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: C.muted }}>
            Bill #{data.billNumber} · <span style={{ color: C.text, fontWeight: 800 }}>₹{data.totalAmount.toFixed(2)}</span>
          </p>
        </div>

        <div style={{ padding: '0 24px 12px' }}>
          <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Print Format</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {([
              { key: 'a4', label: 'A4 Page' },
              { key: 'thermal_112', label: '112 mm' },
              { key: 'thermal_80', label: '80 mm' },
              { key: 'thermal_58', label: '58 mm' },
            ] as const).map(opt => (
              <button
                key={opt.key}
                onClick={() => setPrintFormat(opt.key)}
                style={{
                  padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 800,
                  background: printFormat === opt.key ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                  color: printFormat === opt.key ? '#818cf8' : C.muted,
                  outline: printFormat === opt.key ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 24px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={handlePrint} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, border: 'none', background: C.primary, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
            <Printer style={{ width: 14, height: 14 }} /> Print Bill
          </button>
          <button onClick={handleWhatsApp} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, border: 'none', background: '#25D366', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
            <MessageCircle style={{ width: 14, height: 14 }} /> Share on WhatsApp
          </button>
          <button onClick={() => router.push(`/panel/sales/${data.saleId}`)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 12, border: `1px solid ${C.cardBorder}`, background: 'rgba(255,255,255,0.03)', color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <ReceiptText style={{ width: 13, height: 13 }} /> View Full Invoice
          </button>
          <button onClick={onNewSale} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 12, border: `1px solid rgba(16,185,129,0.25)`, background: 'rgba(16,185,129,0.1)', color: C.emerald, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            <Plus style={{ width: 13, height: 13 }} /> New Sale
          </button>
        </div>
      </div>

      {/* Hidden Print Template */}
      <div className="print-only" style={{ display: 'none' }}>
        <PrintBill format={printFormat} data={data} hasGst={hasGst} dpct={dpct} upiLink={upiLink} />
      </div>

      <style>{`
        @media print {
          body { background: white !important; margin: 0; padding: 0; }
          .pos-success-modal { background: white !important; backdrop-filter: none !important; padding: 0 !important; align-items: flex-start !important; }
          .screen-ui { display: none !important; }
          .print-only { display: block !important; color: black !important; font-family: Arial, sans-serif; }
          .print-only * { color: black !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── Print templates ─────────────────────────────────────── */
function PrintBill({ format, data, hasGst, dpct, upiLink }: {
  format: PrintFormat; data: CompletedSaleData; hasGst: boolean; dpct: string | null; upiLink: string;
}) {
  const { pharmacy: pp } = data;

  if (format === 'a4') {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '12mm' }}>
        <style dangerouslySetInnerHTML={{ __html: `@page { margin: 10mm; size: A4; }` }} />
        <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #000' }}>
          {pp?.logo_url && <img src={pp.logo_url} alt="logo" style={{ maxHeight: 72, maxWidth: 240, marginBottom: 12, objectFit: 'contain' }} />}
          {pp && (<>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{pp.name}</h1>
            {pp.address && <p style={{ margin: '4px 0 0', fontSize: 13 }}>{pp.address}{pp.city ? `, ${pp.city}` : ''}{pp.pincode ? ` - ${pp.pincode}` : ''}</p>}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, marginTop: 4 }}>
              {pp.phone && <span>Ph: {pp.phone}</span>}
              {pp.gstin && <span>GSTIN: {pp.gstin}</span>}
              {pp.license_number && <span>DL: {pp.license_number}</span>}
            </div>
          </>)}
          <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{hasGst ? 'Tax Invoice' : 'Invoice'}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 24, fontSize: 13 }}>
          <div>
            <p style={{ margin: 0 }}><b>Bill No:</b> {data.billNumber}</p>
            <p style={{ margin: '4px 0 0' }}><b>Date:</b> {formatDate(data.billDate)}</p>
            <p style={{ margin: '4px 0 0' }}><b>Payment:</b> {data.paymentMethod.toUpperCase()} ({data.paymentStatus})</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0 }}><b>Customer:</b> {data.customerName || 'Walk-in'}</p>
            {data.customerPhone && data.customerName && <p style={{ margin: '4px 0 0' }}><b>Mobile:</b> {data.customerPhone}</p>}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000', textTransform: 'uppercase', fontWeight: 800 }}>
              <th style={{ padding: '6px 0', textAlign: 'left', width: 32 }}>Sn</th>
              <th style={{ padding: '6px 0', textAlign: 'left' }}>Item</th>
              <th style={{ padding: '6px 0', textAlign: 'left', width: 80 }}>Batch</th>
              <th style={{ padding: '6px 0', textAlign: 'right', width: 64 }}>Qty</th>
              <th style={{ padding: '6px 0', textAlign: 'right', width: 80 }}>Rate</th>
              {hasGst && <th style={{ padding: '6px 0', textAlign: 'right', width: 64 }}>GST</th>}
              <th style={{ padding: '6px 0', textAlign: 'right', width: 96 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it, idx) => {
              const upp = it.units_per_pack ?? 1;
              const isFlex = (it.selling_unit === 'unit' || it.selling_unit === 'both') && upp > 1;
              const strips = isFlex ? Math.floor(it.quantity / upp) : 0;
              const rem = isFlex ? it.quantity % upp : 0;
              const qtyLabel = isFlex ? (rem > 0 ? `${strips} str ${rem} u` : `${strips} str`) : String(it.quantity);
              const rate = (isFlex && strips > 0 && rem === 0) ? it.mrp * upp : it.mrp;
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '6px 0', verticalAlign: 'top' }}>{idx + 1}</td>
                  <td style={{ padding: '6px 0', verticalAlign: 'top', fontWeight: 700 }}>{it.medicine_name}</td>
                  <td style={{ padding: '6px 0', verticalAlign: 'top', fontSize: 11 }}>{it.batch_number || '-'}</td>
                  <td style={{ padding: '6px 0', verticalAlign: 'top', textAlign: 'right' }}>{qtyLabel}</td>
                  <td style={{ padding: '6px 0', verticalAlign: 'top', textAlign: 'right' }}>{rate.toFixed(2)}</td>
                  {hasGst && <td style={{ padding: '6px 0', verticalAlign: 'top', textAlign: 'right' }}>{it.gst_percentage}%</td>}
                  <td style={{ padding: '6px 0', verticalAlign: 'top', textAlign: 'right', fontWeight: 700 }}>{it.amount.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <div style={{ width: 240, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Subtotal:</span><span>{data.subtotal.toFixed(2)}</span></div>
            {hasGst && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>GST Total:</span><span>{data.gstAmount.toFixed(2)}</span></div>}
            {data.discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span>Discount{dpct ? ` (${dpct})` : ''}:</span><span>-{data.discountAmount.toFixed(2)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #000', fontWeight: 900, fontSize: 16 }}><span>Total:</span><span>{data.totalAmount.toFixed(2)}</span></div>
          </div>
        </div>
        {upiLink && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid #ccc' }}>
            <QRCodeCanvas value={upiLink} size={120} level="L" />
            <p style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 800 }}>Scan & Pay ₹{data.totalAmount.toFixed(2)}</p>
          </div>
        )}
        <div style={{ marginTop: 48, textAlign: 'center', fontSize: 11, color: '#666', borderTop: '1px solid #ccc', paddingTop: 12 }}>
          <p style={{ margin: 0 }}>Thank you for your visit!</p>
          <p style={{ margin: '4px 0 0' }}>Goods once sold cannot be taken back or exchanged without a valid original receipt.</p>
        </div>
      </div>
    );
  }

  // Thermal layouts
  const widths = { thermal_112: '100mm', thermal_80: '70mm', thermal_58: '48mm' } as const;
  const pageSize = { thermal_112: '112mm', thermal_80: '80mm', thermal_58: '58mm' } as const;
  const w = widths[format];

  return (
    <div style={{ width: w, margin: '0 auto', fontFamily: 'monospace' }}>
      <style dangerouslySetInnerHTML={{ __html: `@page { margin: 3mm; size: ${pageSize[format]} auto; }` }} />
      <div style={{ textAlign: 'center', marginBottom: 8, borderBottom: '1px dashed #000', paddingBottom: 6 }}>
        {pp?.logo_url && <img src={pp.logo_url} alt="logo" style={{ maxHeight: 40, maxWidth: 130, marginBottom: 4, objectFit: 'contain' }} />}
        {pp && (<>
          <h1 style={{ margin: 0, fontSize: format === 'thermal_58' ? 11 : 14, fontWeight: 900, textTransform: 'uppercase' }}>{pp.name}</h1>
          {pp.address && format !== 'thermal_58' && <p style={{ margin: '2px 0 0', fontSize: 9 }}>{pp.address}{pp.city ? `, ${pp.city}` : ''}</p>}
          {pp.phone && <p style={{ margin: '2px 0 0', fontSize: 9 }}>Ph: {pp.phone}</p>}
          {pp.gstin && format !== 'thermal_58' && <p style={{ margin: '2px 0 0', fontSize: 9 }}>GSTIN: {pp.gstin}</p>}
        </>)}
        <p style={{ margin: '4px 0 0', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>{hasGst ? 'Tax Invoice' : 'Invoice'}</p>
      </div>
      <div style={{ fontSize: format === 'thermal_58' ? 9 : 11, marginBottom: 8, borderBottom: '1px dashed #000', paddingBottom: 6 }}>
        <p style={{ margin: 0 }}>Bill: {data.billNumber}</p>
        <p style={{ margin: '2px 0 0' }}>Date: {formatDate(data.billDate)}</p>
        <p style={{ margin: '2px 0 0' }}>Cust: {data.customerName || 'Walk-in'}{data.customerPhone && data.customerName ? ` / ${data.customerPhone}` : ''}</p>
      </div>
      <div style={{ fontSize: format === 'thermal_58' ? 9 : 11, marginBottom: 8, borderBottom: '1px dashed #000', paddingBottom: 6 }}>
        {data.items.map((it, idx) => {
          const upp = it.units_per_pack ?? 1;
          const isFlex = (it.selling_unit === 'unit' || it.selling_unit === 'both') && upp > 1;
          const strips = isFlex ? Math.floor(it.quantity / upp) : 0;
          const rem = isFlex ? it.quantity % upp : 0;
          const qtyLabel = isFlex ? (rem > 0 ? `${strips}s${rem}u` : `${strips}s`) : String(it.quantity);
          const rate = (isFlex && strips > 0 && rem === 0) ? it.mrp * upp : it.mrp;
          return (
            <div key={idx} style={{ marginBottom: 4 }}>
              <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{(it.medicine_name || '').substring(0, format === 'thermal_58' ? 22 : 32)}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: format === 'thermal_58' ? 9 : 10, marginTop: 2 }}>
                <span>{qtyLabel} × {rate.toFixed(2)}</span>
                <span style={{ fontWeight: 700 }}>{it.amount.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: format === 'thermal_58' ? 9 : 11 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sub:</span><span>{data.subtotal.toFixed(2)}</span></div>
        {hasGst && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST:</span><span>{data.gstAmount.toFixed(2)}</span></div>}
        {data.discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Disc{dpct ? ` (${dpct})` : ''}:</span><span>-{data.discountAmount.toFixed(2)}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #000', paddingTop: 4, marginTop: 4, fontWeight: 900, fontSize: format === 'thermal_58' ? 11 : 13 }}>
          <span>TOTAL:</span><span>{data.totalAmount.toFixed(2)}</span>
        </div>
      </div>
      {upiLink && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', borderTop: '1px dashed #000', paddingTop: 8 }}>
          <QRCodeCanvas value={upiLink} size={format === 'thermal_58' ? 60 : 90} level="L" />
          <p style={{ margin: '4px 0 0', fontSize: 9, fontWeight: 800 }}>Pay ₹{data.totalAmount.toFixed(2)}</p>
        </div>
      )}
      <div style={{ marginTop: 8, textAlign: 'center', fontSize: 9, borderTop: '1px dashed #000', paddingTop: 6 }}>
        <p style={{ margin: 0, fontWeight: 700 }}>{data.paymentMethod.toUpperCase()} ({data.paymentStatus})</p>
        <p style={{ margin: '2px 0 0' }}>- Thank You -</p>
      </div>
    </div>
  );
}
