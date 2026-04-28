"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePanelStore } from "@/store/panelStore";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, FileText, Loader2, ArrowRight, ShoppingCart, Search } from "lucide-react";
import toast from "react-hot-toast";

const C = {
  bg: '#020617',          
  card: '#0B1121',        
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc', 
  muted: '#94a3b8',
  primary: '#8b5cf6',     
  danger: '#ef4444',
  success: '#10b981',
  inputBg: 'rgba(255,255,255,0.02)',
};

interface PurchaseOrder {
  id: string;
  supplier_name: string;
  order_date: string;
  status: string;
  total_items: number;
}

export default function PurchaseOrders() {
  const router = useRouter();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);
  const supabase = createClient();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (!pharmacyId) {
      t = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(t);
    }

    async function fetchOrders() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("purchase_orders")
          .select(`
            id,
            order_date,
            created_at,
            status,
            suppliers ( name )
          `)
          .eq("pharmacy_id", pharmacyId)
          .in("status", ["pending", "draft", "requested"])
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          // Item counts aren't reliably written to purchase_orders.total_items,
          // so compute them by reading purchase_order_items for these orders.
          const orderIds = data.map((o: any) => o.id);
          const { data: itemRows } = await supabase
            .from('purchase_order_items')
            .select('purchase_order_id, requested_quantity')
            .in('purchase_order_id', orderIds);

          const counts = new Map<string, number>();
          for (const r of itemRows || []) {
            const id = (r as any).purchase_order_id as string;
            counts.set(id, (counts.get(id) || 0) + 1);
          }

          const mapped: PurchaseOrder[] = data.map((o: any) => ({
            id: o.id,
            supplier_name: o.suppliers?.name || "Unknown Supplier",
            order_date: o.order_date || o.created_at,
            status: o.status,
            total_items: counts.get(o.id) || 0,
          }));
          setOrders(mapped);
        } else {
          setOrders([]);
        }
      } catch (err: any) {
        console.error("Failed to load purchase orders", err);
        toast.error("Failed to load pending purchase orders");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [pharmacyId, supabase]);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return o.supplier_name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: -10 }} className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
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
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart style={{ width: 22, height: 22, color: C.primary }} />
              Pending Reorders
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>View and convert requested stock into purchase bills</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search style={{ width: 16, height: 16, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
          <input 
            type="search" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supplier or PO #"
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: 12,
              border: `1px solid ${C.cardBorder}`,
              backgroundColor: C.inputBg,
              color: C.text,
              fontSize: 13,
              outline: 'none',
              transition: 'all 0.2s',
            }} 
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', color: C.muted }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16 }}>
          <ShoppingCart style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.1)', margin: '0 auto 12px' }} />
          <p style={{ margin: 0, color: C.text, fontWeight: 700, fontSize: 16 }}>No pending purchase orders found.</p>
          <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 14 }}>Go to Stock Summary to create bulk reorder requests.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(order => (
            <div key={order.id} style={{ 
              backgroundColor: C.card, 
              border: `1px solid ${C.cardBorder}`, 
              borderRadius: 16, 
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ 
                    backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                    color: '#f59e0b', 
                    padding: '2px 10px', 
                    borderRadius: 9999, 
                    fontSize: 10, 
                    fontWeight: 900, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    border: '1px solid rgba(245, 158, 11, 0.2)' 
                  }}>
                    {order.status}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, fontFamily: 'monospace' }}>
                    PO-{order.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 4px', fontWeight: 900, fontSize: 18, color: C.text, lineHeight: 1.2 }}>
                  {order.supplier_name}
                </h3>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>
                  <p style={{ margin: '4px 0' }}>Items Requested: <b style={{ color: C.text }}>{order.total_items}</b></p>
                  <p style={{ margin: '4px 0' }}>Ordered on: {order.order_date ? new Date(order.order_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                </div>
              </div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.cardBorder}` }}>
                <button
                  onClick={() => router.push(`/panel/purchases/manual?poId=${order.id}`)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    color: C.primary,
                    border: 'none',
                    padding: '10px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.15)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)'}
                >
                  <FileText style={{ width: 16, height: 16 }} />
                  Convert to Bill
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
