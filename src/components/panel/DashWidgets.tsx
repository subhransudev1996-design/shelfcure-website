'use client';
import { useEffect, useState } from 'react';

/** Animated SVG ring / gauge — renders a circular progress indicator */
export function HealthRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 300);
    return () => clearTimeout(t);
  }, [score]);

  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = circ * (animated / 100);

  const color = score >= 80 ? '#34d399' : score >= 60 ? '#60a5fa' : score >= 40 ? '#f59e0b' : '#f87171';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Critical';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:'20px 24px' }}>
      <div style={{ position:'relative', width:130, height:130 }}>
        <svg width={130} height={130} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={65} cy={65} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
          <circle
            cx={65} cy={65} r={r} fill="none"
            stroke={color} strokeWidth={10}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition:'stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)', filter:`drop-shadow(0 0 8px ${color}88)` }}
          />
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:26, fontWeight:900, color:color, letterSpacing:'-0.04em', lineHeight:1 }}>{Math.round(animated)}</span>
          <span style={{ fontSize:9, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.12em', marginTop:3 }}>/ 100</span>
        </div>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:13, fontWeight:800, color:color, margin:0 }}>Pharmacy Health</p>
        <p style={{ fontSize:10, color:'#475569', margin:'3px 0 0', fontWeight:600 }}>{label}</p>
      </div>
    </div>
  );
}

/** Horizontal progress bar toward a monthly goal */
export function GoalBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const [width, setWidth] = useState(0);
  const pct = Math.min((current / goal) * 100, 100);
  useEffect(() => { const t = setTimeout(() => setWidth(pct), 500); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <span style={{ fontSize:11, fontWeight:600, color:'#64748b' }}>{label}</span>
        <span style={{ fontSize:11, fontWeight:700, color: pct >= 100 ? color : '#94a3b8' }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height:6, borderRadius:100, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:100, width:`${width}%`, background:`linear-gradient(90deg, ${color}cc, ${color})`, transition:'width 1.2s cubic-bezier(0.4,0,0.2,1)', boxShadow:`0 0 10px ${color}60` }} />
      </div>
    </div>
  );
}

/** Recent activity feed item */
export function FeedItem({ icon: Icon, accent, title, sub, amount, time }: {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  accent: string; title: string; sub: string; amount: string; time: string;
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width:36, height:36, borderRadius:11, flexShrink:0, background:`${accent}15`, border:`1px solid ${accent}25`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon style={{ width:14, height:14, color:accent }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:12, fontWeight:700, color:'#e2e8f0', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</p>
        <p style={{ fontSize:10, color:'#475569', margin:'2px 0 0', fontWeight:500 }}>{sub}</p>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <p style={{ fontSize:12, fontWeight:800, color:accent, margin:0 }}>{amount}</p>
        <p style={{ fontSize:9, color:'#334155', margin:'2px 0 0', fontWeight:600 }}>{time}</p>
      </div>
    </div>
  );
}
