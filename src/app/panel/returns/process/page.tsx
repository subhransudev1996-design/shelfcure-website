'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Search, Loader2, ArrowRight, AlertCircle,
  Receipt, User, Calendar, IndianRupee, RotateCcw,
} from 'lucide-react';

/* ─── Palette ─── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569', subtle: '#94a3b8',
  rose: '#f43f5e', orange: '#f97316', emerald: '#10b981', amber: '#f59e0b',
  indigo: '#6366f1', indigoLight: '#818cf8',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

interface SaleHit {
  id: string;
  bill_number: string | null;
  bill_date: string;
  total_amount: number;
  net_amount: number | null;
  patient_name: string | null;
  doctor_name: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  status: string;
  item_count: number;
  already_refunded: number;
}

export default function ProcessReturnPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<SaleHit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) { setError('Enter a bill number or patient name'); return; }
    if (!pharmacyId) return;
    setSearching(true); setError(null); setHits(null);
    try {
      // Match bill_number, patient_name, doctor_name, or joined customer name/phone.
      const { data, error: e } = await supabase
        .from('sales')
        .select('id, bill_number, bill_date, total_amount, net_amount, patient_name, doctor_name, status, customers(name, phone)')
        .eq('pharmacy_id', pharmacyId)
        .or(`bill_number.ilike.%${q}%,patient_name.ilike.%${q}%,doctor_name.ilike.%${q}%`)
        .order('bill_date', { ascending: false })
        .limit(20);
      if (e) throw e;

      const enriched: SaleHit[] = await Promise.all(
        (data || []).map(async (row: any) => {
          const [{ count }, { data: refunds }] = await Promise.all([
            supabase.from('sale_items').select('id', { count: 'exact', head: true }).eq('sale_id', row.id),
            supabase.from('sale_returns').select('refund_amount').eq('sale_id', row.id),
          ]);
          const already = (refunds || []).reduce((s: number, r: any) => s + Number(r.refund_amount ?? 0), 0);
          return {
            id: row.id,
            bill_number: row.bill_number,
            bill_date: row.bill_date,
            total_amount: row.total_amount,
            net_amount: row.net_amount,
            patient_name: row.patient_name,
            doctor_name: row.doctor_name,
            customer_name: row.customers?.name ?? null,
            customer_phone: row.customers?.phone ?? null,
            status: row.status,
            item_count: count ?? 0,
            already_refunded: already,
          };
        })
      );

      if (enriched.length === 0) {
        setError(`No bills matched "${q}"`);
      }
      setHits(enriched);
    } catch (err: any) {
      setError(err?.message || 'Search failed');
      toast.error(err?.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  }, [query, pharmacyId, supabase]);

  const goToReturn = (saleId: string) => {
    // Hand off to the sale detail page; ?action=return auto-opens the
    // return modal that already handles GST proration + stock restoration.
    router.push(`/panel/sales/${saleId}?action=return`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={() => router.push('/panel/returns')}
          style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: C.card, color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, display: 'flex', alignItems: 'center', gap: 10 }}>
            <RotateCcw style={{ width: 22, height: 22, color: C.orange }} />
            Process Return
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>Search the original sale to start a return.</p>
        </div>
      </div>

      {/* Search card */}
      <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 20 }}>
        <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
          Bill Number, Patient, or Doctor
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ width: 14, height: 14, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
              placeholder="e.g. SL-129038 or patient name..."
              style={{ width: '100%', padding: '12px 14px 12px 36px', borderRadius: 12, border: `1px solid ${C.inputBorder}`, backgroundColor: C.input, color: C.text, fontSize: 13, fontWeight: 600, fontFamily: 'monospace', outline: 'none' }}
            />
          </div>
          <button
            onClick={search}
            disabled={searching || !query.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${C.orange}, #ea580c)`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: searching ? 'wait' : 'pointer', opacity: (searching || !query.trim()) ? 0.6 : 1, transition: 'all 0.15s' }}
          >
            {searching ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Search style={{ width: 14, height: 14 }} />}
            Search
          </button>
        </div>
        {error && (
          <p style={{ margin: '10px 0 0', fontSize: 12, color: C.rose, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle style={{ width: 13, height: 13 }} />
            {error}
          </p>
        )}
      </div>

      {/* Results */}
      {hits && hits.length > 0 && (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.cardBorder}`, fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {hits.length} match{hits.length !== 1 ? 'es' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {hits.map((h, i) => {
              const totalPaid = h.net_amount ?? h.total_amount;
              const remaining = Math.max(0, totalPaid - h.already_refunded);
              const fullyRefunded = remaining <= 0.01;
              return (
                <button
                  key={h.id}
                  onClick={() => !fullyRefunded && goToReturn(h.id)}
                  disabled={fullyRefunded}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '160px 1fr 130px 130px 36px',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 18px',
                    borderBottom: i < hits.length - 1 ? `1px solid rgba(255,255,255,0.03)` : 'none',
                    border: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    cursor: fullyRefunded ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.12s',
                    opacity: fullyRefunded ? 0.55 : 1,
                  }}
                  onMouseEnter={(e) => { if (!fullyRefunded) e.currentTarget.style.backgroundColor = 'rgba(249,115,22,0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {/* Bill # */}
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.text, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.bill_number || `#${h.id.slice(0, 8).toUpperCase()}`}
                  </span>

                  {/* Patient + meta */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User style={{ width: 12, height: 12, color: C.muted }} />
                      {h.customer_name || h.patient_name || 'Walk-in Customer'}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: 10, color: C.muted, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar style={{ width: 10, height: 10 }} />{formatDate(h.bill_date)}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Receipt style={{ width: 10, height: 10 }} />{h.item_count} item{h.item_count !== 1 ? 's' : ''}</span>
                      {h.doctor_name && <span>· Dr. {h.doctor_name}</span>}
                    </p>
                  </div>

                  {/* Total */}
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: C.text, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <IndianRupee style={{ width: 11, height: 11 }} />{Number(totalPaid).toFixed(2)}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bill total</p>
                  </div>

                  {/* Refund status */}
                  <div style={{ textAlign: 'right' }}>
                    {fullyRefunded ? (
                      <span style={{ fontSize: 10, fontWeight: 800, color: C.rose, padding: '3px 8px', borderRadius: 99, backgroundColor: 'rgba(244,63,94,0.12)', border: `1px solid rgba(244,63,94,0.25)` }}>
                        FULLY REFUNDED
                      </span>
                    ) : h.already_refunded > 0 ? (
                      <>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.amber }}>{formatCurrency(remaining)}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Refundable</p>
                      </>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 800, color: C.emerald, padding: '3px 8px', borderRadius: 99, backgroundColor: 'rgba(16,185,129,0.12)', border: `1px solid rgba(16,185,129,0.25)` }}>
                        ELIGIBLE
                      </span>
                    )}
                  </div>

                  <ArrowRight style={{ width: 14, height: 14, color: fullyRefunded ? '#1e293b' : C.indigoLight, justifySelf: 'end' }} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hits && hits.length === 0 && !error && (
        <div style={{ padding: 40, backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, textAlign: 'center', color: C.muted, fontSize: 13 }}>
          No matching bills found.
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
