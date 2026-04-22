'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';

interface SaleDetail {
  id: number;
  bill_number: string | null;
  customer_name: string;
  bill_date: string;
  subtotal: number;
  discount_amount: number;
  gst_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
}

interface SaleItem {
  id: number;
  medicine_name: string;
  batch_number: string;
  quantity: number;
  unit_price: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  sale_mode: string;
}

export default function SaleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const saleId = params.id as string;

  const load = useCallback(async () => {
    if (!pharmacyId || !saleId) return;
    setLoading(true);

    try {
      const [saleRes, itemsRes] = await Promise.all([
        supabase
          .from('sales')
          .select('*')
          .eq('id', parseInt(saleId))
          .eq('pharmacy_id', pharmacyId)
          .single(),
        supabase
          .from('sale_items')
          .select(`
            id, quantity, unit_price, gst_rate, gst_amount, total_amount, sale_mode,
            medicines(name),
            batches(batch_number)
          `)
          .eq('sale_id', parseInt(saleId))
          .eq('pharmacy_id', pharmacyId),
      ]);

      if (saleRes.data) setSale(saleRes.data);
      setItems(
        (itemsRes.data || []).map((item: any) => ({
          ...item,
          medicine_name: item.medicines?.name || 'Unknown',
          batch_number: item.batches?.batch_number || '—',
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, saleId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="w-7 h-7 text-indigo-500 animate-spin" /></div>;
  if (!sale) return <div className="text-center py-20 text-slate-500">Sale not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Sale #{sale.bill_number || sale.id}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {formatDate(sale.bill_date)} • {sale.customer_name || 'Walk-in'}
            </p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/10 transition-all"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subtotal</p>
          <p className="text-lg font-black text-white">{formatCurrency(sale.subtotal)}</p>
        </div>
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">GST</p>
          <p className="text-lg font-black text-white">{formatCurrency(sale.gst_amount)}</p>
        </div>
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Discount</p>
          <p className="text-lg font-black text-rose-400">{formatCurrency(sale.discount_amount)}</p>
        </div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Total</p>
          <p className="text-lg font-black text-white">{formatCurrency(sale.total_amount)}</p>
        </div>
      </div>

      {/* Payment Badge */}
      <div className="flex items-center gap-3">
        <span className="px-3 py-1.5 text-xs font-bold uppercase rounded-lg bg-emerald-500/10 text-emerald-400">
          {sale.payment_method}
        </span>
        <span className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg ${
          sale.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
        }`}>
          {sale.payment_status}
        </span>
      </div>

      {/* Items Table */}
      <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-sm font-black text-white">Items ({items.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Medicine</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Batch</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Qty</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Rate</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">GST</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-white/[0.03]">
                  <td className="px-5 py-3 font-bold text-white">{item.medicine_name}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">{item.batch_number}</td>
                  <td className="px-5 py-3 text-right text-white font-medium">{item.quantity}</td>
                  <td className="px-5 py-3 text-right text-slate-400">{formatCurrency(item.unit_price)}</td>
                  <td className="px-5 py-3 text-right text-slate-500">{item.gst_rate}%</td>
                  <td className="px-5 py-3 text-right text-white font-bold">{formatCurrency(item.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
