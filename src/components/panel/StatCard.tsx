'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || target === 0) { setValue(target); return; }
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setValue(target * ease);
      if (p < 1) requestAnimationFrame(tick); else setValue(target);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

export function StatCard({
  title, rawValue, formatted, sub, icon: Icon, accent, to, trend, badge,
}: {
  title: string; rawValue: number; formatted: string; sub?: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  accent: string; to?: string;
  trend?: { value: number; label: string };
  badge?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const animated = useCountUp(rawValue);
  const displayValue = rawValue > 0
    ? formatted.replace(/[\d,]+/, Math.floor(animated).toLocaleString('en-IN'))
    : formatted;

  const card = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: `linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%)`,
        borderRadius: 22,
        border: `1px solid ${hovered ? accent + '40' : 'rgba(255,255,255,0.08)'}`,
        padding: '22px 24px 20px',
        cursor: to ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative', overflow: 'hidden',
        transform: hovered && to ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered && to
          ? `0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.08)`
          : 'inset 0 1px 0 rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* top-right glow */}
      <div style={{ position:'absolute', top:-50, right:-50, width:150, height:150, background:`radial-gradient(circle, ${accent}16 0%, transparent 65%)`, transition:'opacity 0.3s', opacity: hovered ? 1 : 0.4, pointerEvents:'none' }} />
      {/* bottom accent line */}
      <div style={{ position:'absolute', bottom:0, left:0, height:2, width: hovered ? '100%' : '0%', background:`linear-gradient(90deg, ${accent}dd, ${accent}00)`, transition:'width 0.45s cubic-bezier(0.4,0,0.2,1)' }} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.13em', color:'#475569', margin:0 }}>{title}</p>
            {badge && <span style={{ fontSize:9, fontWeight:800, padding:'2px 6px', borderRadius:5, background:`${accent}18`, color:accent, textTransform:'uppercase', letterSpacing:'0.08em' }}>{badge}</span>}
          </div>
          <p style={{ fontSize:30, fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.04em', margin:0, lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
            {displayValue}
          </p>
          {trend && (
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:10 }}>
              <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, background: trend.value>=0?'rgba(52,211,153,0.15)':'rgba(248,113,113,0.15)', color: trend.value>=0?'#34d399':'#f87171' }}>
                {trend.value>=0?'↑':'↓'} {Math.abs(trend.value)}%
              </span>
              <span style={{ fontSize:10, color:'#475569', fontWeight:500 }}>{trend.label}</span>
            </div>
          )}
        </div>
        <div style={{
          width:50, height:50, borderRadius:15, flexShrink:0,
          background:`linear-gradient(135deg, ${accent}22, ${accent}08)`,
          border:`1px solid ${accent}28`,
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all 0.3s ease',
          transform: hovered ? 'scale(1.15) rotate(-8deg)' : 'scale(1)',
          boxShadow: hovered ? `0 8px 32px ${accent}30` : 'none',
        }}>
          <Icon style={{ width:21, height:21, color:accent }} />
        </div>
      </div>

      {sub && <p style={{ fontSize:11, color:'#3d4f68', marginTop:'auto', paddingTop:14, fontWeight:500, lineHeight:1.5, borderTop:'1px solid rgba(255,255,255,0.05)' }}>{sub}</p>}
    </div>
  );
  return to ? <Link href={to} style={{ textDecoration:'none', display:'block', height:'100%' }}>{card}</Link> : card;
}
