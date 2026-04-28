'use client';
import { useEffect, useState, useCallback, useRef } from "react";
import { usePanelStore } from "@/store/panelStore";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, monthRange } from "@/lib/utils/format";
import { TrendingUp, ShoppingCart, Package, AlertTriangle, Clock, Users, DollarSign, BarChart3, Loader2, Zap, ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from "@/components/panel/StatCard";
import { MiniCard } from "@/components/panel/DashMiniCard";

interface DashboardStats {
  today_sales: number; today_transactions: number; today_returns: number; today_profit: number;
  monthly_sales: number; monthly_profit: number; monthly_returns: number;
  total_stock_value: number; total_medicines: number; low_stock_count: number;
  expiry_soon_count: number; outstanding_credit: number; today_purchases: number; expired_count: number;
}
interface ChartDataPoint { date: string; sales: number; purchases: number; }
const defaultStats: DashboardStats = {
  today_sales:0,today_transactions:0,today_returns:0,today_profit:0,
  monthly_sales:0,monthly_profit:0,monthly_returns:0,total_stock_value:0,
  total_medicines:0,low_stock_count:0,expiry_soon_count:0,outstanding_credit:0,today_purchases:0,expired_count:0
};
function getGreeting() { const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; }

function useLiveTime() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit'}));
    update();
    const id = setInterval(update,1000);
    return () => clearInterval(id);
  },[]);
  return time;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:'#0d1127', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:'12px 16px', boxShadow:'0 20px 60px rgba(0,0,0,0.7)' }}>
      <p style={{ fontSize:11, fontWeight:700, color:'#64748b', margin:'0 0 10px' }}>
        {label ? new Date(label).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}) : ''}
      </p>
      {payload.map((e,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginTop:5 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', backgroundColor:e.color, flexShrink:0 }} />
          <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>{e.name}: <span style={{ fontWeight:700, color:'#f1f5f9' }}>{formatCurrency(e.value)}</span></p>
        </div>
      ))}
    </div>
  );
};

const quickActions = [
  { label:'New Sale', href:'/panel/pos', icon:ShoppingCart, accent:'#818cf8' },
  { label:'Add Purchase', href:'/panel/purchases/scan', icon:Package, accent:'#2dd4bf' },
  { label:'View Reports', href:'/panel/reports', icon:BarChart3, accent:'#60a5fa' },
  { label:'Customers', href:'/panel/customers', icon:Users, accent:'#a78bfa' },
];

export default function DashboardPage() {
  const pharmacyId = usePanelStore(s => s.pharmacyId);
  const user = usePanelStore(s => s.user);
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const liveTime = useLiveTime();
  const greeting = getGreeting();
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const todayLabel = new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});

  const loadDashboard = useCallback(async (pid: string) => {
    setLoading(true); setError(null);
    try {
      // sales.bill_date is `timestamptz`; purchases.bill_date is `date`.
      // We must use ISO timestamp ranges for sales and date strings for purchases.
      const now = new Date();
      const todayFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const tomorrowFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const todayStr = ymd(todayFrom);
      const todayIsoStart = todayFrom.toISOString();
      const tomorrowIsoStart = tomorrowFrom.toISOString();
      const { from: mf, to: mt } = monthRange(0);
      const monthStart = new Date(`${mf}T00:00:00`);
      const monthEndExclusive = new Date(`${mt}T00:00:00`); monthEndExclusive.setDate(monthEndExclusive.getDate()+1);
      const monthIsoStart = monthStart.toISOString();
      const monthIsoEndExclusive = monthEndExclusive.toISOString();

      // 14-day window for chart (start at local midnight 13 days ago, end at start of tomorrow)
      const chartStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 0, 0, 0, 0);
      const chartStartStr = ymd(chartStart);
      const chartIsoStart = chartStart.toISOString();
      const chartIsoEndExclusive = tomorrowIsoStart;

      const [
        salesToday, purchasesToday, medCount, lowStock, expirySoon, expired,
        monthlySales, returnsToday, todaySaleItems, monthSaleItems,
        activeBatches, customerCredit, chartSales, chartPurchases,
      ] = await Promise.all([
        supabase.from('sales').select('id,total_amount').eq('pharmacy_id',pid).gte('bill_date',todayIsoStart).lt('bill_date',tomorrowIsoStart),
        supabase.from('purchases').select('total_amount').eq('pharmacy_id',pid).eq('bill_date',todayStr),
        supabase.from('medicines').select('id',{count:'exact',head:true}).eq('pharmacy_id',pid),
        supabase.from('batches').select('id',{count:'exact',head:true}).eq('pharmacy_id',pid).lt('stock_quantity',10).gt('stock_quantity',0),
        supabase.from('batches').select('id',{count:'exact',head:true}).eq('pharmacy_id',pid).lte('expiry_date',new Date(Date.now()+90*86400000).toISOString().split('T')[0]).gte('expiry_date',todayStr),
        supabase.from('batches').select('id',{count:'exact',head:true}).eq('pharmacy_id',pid).lt('expiry_date',todayStr),
        supabase.from('sales').select('id,total_amount,bill_date').eq('pharmacy_id',pid).gte('bill_date',monthIsoStart).lt('bill_date',monthIsoEndExclusive),
        supabase.from('sale_returns').select('refund_amount').eq('pharmacy_id',pid).gte('return_date',todayIsoStart).lt('return_date',tomorrowIsoStart),
        // Today's COGS via sale_items joined to batches.purchase_price
        supabase.from('sale_items').select('quantity,batches!inner(purchase_price),sales!inner(bill_date,pharmacy_id)').eq('sales.pharmacy_id',pid).gte('sales.bill_date',todayIsoStart).lt('sales.bill_date',tomorrowIsoStart),
        // Month COGS
        supabase.from('sale_items').select('quantity,batches!inner(purchase_price),sales!inner(bill_date,pharmacy_id)').eq('sales.pharmacy_id',pid).gte('sales.bill_date',monthIsoStart).lt('sales.bill_date',monthIsoEndExclusive),
        // Real inventory value
        supabase.from('batches').select('stock_quantity,purchase_price').eq('pharmacy_id',pid).gt('stock_quantity',0),
        // Outstanding credit across all customers
        supabase.from('customers').select('outstanding_balance').eq('pharmacy_id',pid),
        // 14-day sales — bill_date is timestamptz, use ISO range
        supabase.from('sales').select('total_amount,bill_date').eq('pharmacy_id',pid).gte('bill_date',chartIsoStart).lt('bill_date',chartIsoEndExclusive),
        // 14-day purchases — bill_date is date, use date strings
        supabase.from('purchases').select('total_amount,bill_date').eq('pharmacy_id',pid).gte('bill_date',chartStartStr).lte('bill_date',todayStr),
      ]);

      const ts = (salesToday.data??[]).reduce((s,r)=>s+(r.total_amount??0),0);
      const tp = (purchasesToday.data??[]).reduce((s,r)=>s+(r.total_amount??0),0);
      const ms = (monthlySales.data??[]).reduce((s,r)=>s+(r.total_amount??0),0);
      const tr = (returnsToday.data??[]).reduce((s,r)=>s+(r.refund_amount??0),0);

      // COGS = quantity * batch.purchase_price summed across sale_items
      type SaleItemRow = { quantity: number | null; batches: { purchase_price: number | null } | { purchase_price: number | null }[] | null };
      const sumCogs = (rows: SaleItemRow[] | null | undefined) =>
        (rows ?? []).reduce((s, r) => {
          const b = Array.isArray(r.batches) ? r.batches[0] : r.batches;
          const cost = (r.quantity ?? 0) * (b?.purchase_price ?? 0);
          return s + cost;
        }, 0);
      const todayCogs = sumCogs(todaySaleItems.data as SaleItemRow[] | null);
      const monthCogs = sumCogs(monthSaleItems.data as SaleItemRow[] | null);
      const todayProfit = ts - todayCogs;
      const monthProfit = ms - monthCogs;

      const stockValue = (activeBatches.data ?? []).reduce(
        (s, b) => s + (b.stock_quantity ?? 0) * (b.purchase_price ?? 0), 0,
      );
      const outstanding = (customerCredit.data ?? []).reduce(
        (s, c) => s + (c.outstanding_balance ?? 0), 0,
      );

      setStats({
        today_sales: ts, today_purchases: tp,
        today_transactions: salesToday.data?.length ?? 0,
        today_profit: todayProfit, today_returns: tr,
        monthly_sales: ms, monthly_profit: monthProfit, monthly_returns: 0,
        total_stock_value: stockValue, outstanding_credit: outstanding,
        total_medicines: medCount.count ?? 0,
        low_stock_count: lowStock.count ?? 0,
        expiry_soon_count: expirySoon.count ?? 0,
        expired_count: expired.count ?? 0,
      });

      // Build 14-day series. Sales bucket by local-date of the timestamp;
      // purchases are already date-only strings.
      const salesByDay = new Map<string, number>();
      for (const r of (chartSales.data ?? [])) {
        const k = ymd(new Date(r.bill_date as string));
        salesByDay.set(k, (salesByDay.get(k) ?? 0) + (r.total_amount ?? 0));
      }
      const purchasesByDay = new Map<string, number>();
      for (const r of (chartPurchases.data ?? [])) {
        const k = String(r.bill_date).slice(0,10);
        purchasesByDay.set(k, (purchasesByDay.get(k) ?? 0) + (r.total_amount ?? 0));
      }
      const pts: ChartDataPoint[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0);
        const k = ymd(d);
        pts.push({ date: d.toISOString(), sales: salesByDay.get(k) ?? 0, purchases: purchasesByDay.get(k) ?? 0 });
      }
      setChartData(pts);
    } catch(err) {
      setError((err as {message?:string})?.message||'Failed to load data');
    } finally { setLoading(false); }
  },[supabase]);

  useEffect(() => {
    if(pharmacyId) loadDashboard(pharmacyId);
    else { const t=setTimeout(()=>setLoading(false),5000); return ()=>clearTimeout(t); }
  },[pharmacyId,loadDashboard]);

  if(loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 120px)' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        <div style={{ position:'relative', width:56, height:56 }}>
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid rgba(129,140,248,0.15)', animation:'ping 1.5s ease-out infinite' }} />
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Loader2 style={{ width:26, height:26, color:'#818cf8', animation:'spin 1s linear infinite' }} />
          </div>
        </div>
        <p style={{ fontSize:13, color:'#475569', fontWeight:600, margin:0 }}>Loading dashboard...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes ping{75%,100%{transform:scale(2);opacity:0}}`}</style>
      </div>
    </div>
  );

  if(error) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'calc(100vh - 120px)', gap:16 }}>
      <div style={{ width:56, height:56, borderRadius:16, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <AlertTriangle style={{ width:24, height:24, color:'#f59e0b' }} />
      </div>
      <p style={{ fontSize:15, fontWeight:700, color:'#f1f5f9', margin:0 }}>Failed to load dashboard</p>
      <p style={{ fontSize:12, color:'#475569', maxWidth:400, textAlign:'center', lineHeight:1.6 }}>{error}</p>
      <button onClick={()=>pharmacyId&&loadDashboard(pharmacyId)} style={{ padding:'10px 24px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', fontWeight:700, fontSize:13, border:'none', borderRadius:12, cursor:'pointer' }}>Retry</button>
    </div>
  );

  const topCards = [
    { title:"Today's Sales", rawValue:stats.today_sales, formatted:formatCurrency(stats.today_sales), sub:`${stats.today_transactions} transactions · ${formatCurrency(stats.today_returns)} returned`, icon:ShoppingCart, accent:'#818cf8', to:'/panel/sales', trend:{value:12, label:'vs yesterday'} },
    { title:"Today's Profit", rawValue:stats.today_profit, formatted:formatCurrency(stats.today_profit), sub:'Revenue minus cost of goods sold', icon:TrendingUp, accent:'#34d399', to:'/panel/reports/profit', trend:{value:8, label:'gross margin'} },
    { title:'Monthly Revenue', rawValue:stats.monthly_sales, formatted:formatCurrency(stats.monthly_sales), sub:`Profit: ${formatCurrency(stats.monthly_profit)}`, icon:BarChart3, accent:'#60a5fa', to:'/panel/reports' },
    { title:'Inventory Value', rawValue:stats.total_stock_value, formatted:formatCurrency(stats.total_stock_value), sub:`${stats.total_medicines} medicines in catalogue`, icon:Package, accent:'#a78bfa', to:'/panel/inventory' },
  ];
  const miniCards = [
    { title:'Low Stock', value:String(stats.low_stock_count), icon:AlertTriangle, accent:stats.low_stock_count>0?'#f59e0b':'#475569', alertBg:stats.low_stock_count>0?'rgba(245,158,11,0.07)':undefined, alertBorder:stats.low_stock_count>0?'rgba(245,158,11,0.22)':undefined, to:'/panel/inventory', pulse:stats.low_stock_count>0 },
    { title:'Expiring Soon', value:String(stats.expiry_soon_count), icon:Clock, accent:stats.expiry_soon_count>0?'#f87171':'#475569', alertBg:stats.expiry_soon_count>0?'rgba(239,68,68,0.07)':undefined, alertBorder:stats.expiry_soon_count>0?'rgba(239,68,68,0.22)':undefined, to:'/panel/reports/expiry', pulse:stats.expiry_soon_count>0 },
    { title:"Today's Purchases", value:formatCurrency(stats.today_purchases), icon:DollarSign, accent:'#2dd4bf', to:'/panel/purchases', pulse:false },
    { title:"Today's Returns", value:formatCurrency(stats.today_returns), icon:RotateCcw, accent:stats.today_returns>0?'#f97316':'#475569', alertBg:stats.today_returns>0?'rgba(249,115,22,0.07)':undefined, alertBorder:stats.today_returns>0?'rgba(249,115,22,0.22)':undefined, to:'/panel/returns', pulse:false },
  ];

  return (
    <>
      <div style={{ paddingBottom:48, width: '100%', display:'flex', flexDirection:'column', gap:24 }}>

        {/* Header */}
        <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#34d399', boxShadow:'0 0 0 3px rgba(52,211,153,0.2)', animation:'livePulse 2s ease-in-out infinite' }} />
              <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'#334155', margin:0 }}>{todayLabel}</p>
              <span style={{ fontSize:11, color:'#334155', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{liveTime}</span>
            </div>
            <h1 style={{ fontSize:26, fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.03em', margin:0, lineHeight:1.2 }}>
              {greeting}, <span style={{ background:'linear-gradient(135deg,#818cf8,#60a5fa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{firstName}</span> 👋
            </h1>
            <p style={{ fontSize:12, color:'#475569', fontWeight:500, margin:'6px 0 0' }}>Here&apos;s your pharmacy overview for today.</p>
          </div>
          <div style={{ display:'flex', gap:10, flexShrink:0, flexWrap:'wrap' }}>
            {quickActions.map(a => (
              <Link key={a.href} href={a.href} style={{
                display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px',
                background:a.href==='/panel/pos'?'linear-gradient(135deg,#6366f1,#4f46e5)':'rgba(255,255,255,0.04)',
                border:a.href==='/panel/pos'?'none':'1px solid rgba(255,255,255,0.08)',
                color:a.href==='/panel/pos'?'#fff':'#64748b', fontWeight:700, fontSize:12, borderRadius:12, textDecoration:'none',
                boxShadow:a.href==='/panel/pos'?'0 4px 20px rgba(99,102,241,0.35)':'none', transition:'all 0.2s ease',
              }}>
                <a.icon style={{ width:14, height:14 }} />
                {a.label}
              </Link>
            ))}
          </div>
        </div>

        {/* KPI Summary Banner */}
        <div style={{ background:'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(96,165,250,0.05) 50%, rgba(167,139,250,0.08) 100%)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:18, padding:'16px 24px', display:'flex', flexWrap:'wrap', gap:24, alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Zap style={{ width:18, height:18, color:'#818cf8' }} />
            <span style={{ fontSize:12, fontWeight:700, color:'#818cf8', textTransform:'uppercase', letterSpacing:'0.08em' }}>Today&apos;s Snapshot</span>
          </div>
          {[
            { label:'Revenue', val:formatCurrency(stats.today_sales), color:'#818cf8' },
            { label:'Profit', val:formatCurrency(stats.today_profit), color:'#34d399' },
            { label:'Transactions', val:String(stats.today_transactions), color:'#60a5fa' },
            { label:'Purchases', val:formatCurrency(stats.today_purchases), color:'#2dd4bf' },
          ].map((item,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:1, height:24, background:'rgba(255,255,255,0.06)' }} />
              <div>
                <p style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#475569', margin:0 }}>{item.label}</p>
                <p style={{ fontSize:15, fontWeight:800, color:item.color, margin:'2px 0 0', letterSpacing:'-0.02em' }}>{item.val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stat Cards */}
        <div className="dash-stat-grid">
          {topCards.map(c => <StatCard key={c.title} {...c} />)}
        </div>

        {/* Chart + Side */}
        <div className="dash-main-grid">
          <div style={{ background:'linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))', border:'1px solid rgba(255,255,255,0.07)', borderRadius:22, padding:'24px 24px 16px', display:'flex', flexDirection:'column', minHeight:380 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
              <div>
                <h2 style={{ fontSize:14, fontWeight:800, color:'#f1f5f9', margin:0 }}>Sales vs Purchases</h2>
                <p style={{ fontSize:11, color:'#475569', margin:'4px 0 0', fontWeight:500 }}>Last 14 days performance</p>
              </div>
              <div style={{ padding:'5px 12px', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:8, fontSize:10, fontWeight:700, color:'#818cf8', textTransform:'uppercase', letterSpacing:'0.08em' }}>Bi-weekly</div>
            </div>
            <div style={{ flex:1, minHeight:280, width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={chartData} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                  <defs>
                    <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gPurchases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill:'#475569', fontSize:11 }} dy={10} tickFormatter={v => { const d=new Date(v); return `${d.getDate()} ${d.toLocaleString('default',{month:'short'})}`; }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill:'#475569', fontSize:11 }} tickFormatter={v => `₹${v>=1000?(v/1000).toFixed(1)+'k':v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="sales" name="Sales" stroke="#818cf8" strokeWidth={2.5} fillOpacity={1} fill="url(#gSales)" activeDot={{ r:5, strokeWidth:0, fill:'#818cf8' }} />
                  <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#2dd4bf" strokeWidth={2.5} fillOpacity={1} fill="url(#gPurchases)" activeDot={{ r:5, strokeWidth:0, fill:'#2dd4bf' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side column */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {miniCards.map(c => <MiniCard key={c.title} {...c} />)}
            </div>

            {stats.expired_count > 0 ? (
              <div style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:18, padding:'18px 20px', flex:1, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:-30, right:-30, width:110, height:110, background:'radial-gradient(circle,rgba(239,68,68,0.18) 0%,transparent 70%)', pointerEvents:'none' }} />
                <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                  <div style={{ width:38, height:38, borderRadius:11, flexShrink:0, background:'rgba(239,68,68,0.14)', border:'1px solid rgba(239,68,68,0.28)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <AlertTriangle style={{ width:16, height:16, color:'#f87171' }} />
                  </div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:800, color:'#fca5a5', margin:0 }}>Critical: Expired Stock</p>
                    <p style={{ fontSize:11, color:'#64748b', margin:'5px 0 14px', lineHeight:1.6 }}>{stats.expired_count} expired batch{stats.expired_count>1?'es':''} in inventory.</p>
                    <Link href="/panel/reports/expiry" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(239,68,68,0.18)', border:'1px solid rgba(239,68,68,0.3)', color:'#fca5a5', fontWeight:700, fontSize:11, borderRadius:9, textDecoration:'none' }}>
                      Review Now <ArrowRight style={{ width:12, height:12 }} />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background:'rgba(52,211,153,0.05)', border:'1px solid rgba(52,211,153,0.15)', borderRadius:18, padding:'16px 20px', display:'flex', alignItems:'center', gap:14, flex:1 }}>
                <div style={{ width:38, height:38, borderRadius:11, flexShrink:0, background:'rgba(52,211,153,0.12)', border:'1px solid rgba(52,211,153,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <TrendingUp style={{ width:16, height:16, color:'#34d399' }} />
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'#6ee7b7', margin:0 }}>All Clear ✓</p>
                  <p style={{ fontSize:11, color:'#475569', margin:'3px 0 0', fontWeight:500 }}>No expired stock in active inventory.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dash-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
        .dash-main-grid { display:grid; grid-template-columns:1fr 300px; gap:18px; align-items:start; }
        @media(max-width:1200px){ .dash-stat-grid{ grid-template-columns:repeat(2,1fr); } }
        @media(max-width:900px){ .dash-main-grid{ grid-template-columns:1fr; } }
        @media(max-width:640px){ .dash-stat-grid{ grid-template-columns:1fr; } }
        @keyframes livePulse{ 0%,100%{ opacity:1; } 50%{ opacity:0.4; } }
      `}</style>
    </>
  );
}
