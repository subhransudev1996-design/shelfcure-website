'use client';
import { useState } from 'react';
import Link from 'next/link';

export function MiniCard({
  title, value, icon: Icon, accent, alertBg, alertBorder, to, pulse,
}: {
  title: string; value: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  accent: string; alertBg?: string; alertBorder?: string; to: string; pulse?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={to} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: alertBg ?? (hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)'),
          borderRadius: 16,
          border: `1px solid ${alertBorder ?? (hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)')}`,
          padding: '18px 14px',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          transform: hovered ? 'translateY(-3px) scale(1.02)' : 'translateY(0)',
          boxShadow: hovered ? `0 12px 32px rgba(0,0,0,0.3), 0 0 0 1px ${accent}20` : 'none',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {pulse && (
          <span style={{
            position: 'absolute', top: 10, right: 10,
            width: 7, height: 7, borderRadius: '50%',
            background: accent,
            boxShadow: `0 0 0 3px ${accent}30`,
            animation: 'pulseRing 1.5s ease-out infinite',
          }} />
        )}
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
          border: `1px solid ${accent}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
          transform: hovered ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.25s ease',
        }}>
          <Icon style={{ width: 16, height: 16, color: accent }} />
        </div>
        <p style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', margin: '7px 0 0', lineHeight: 1.4 }}>{title}</p>
        <style>{`@keyframes pulseRing { 0% { box-shadow: 0 0 0 0 ${accent}60; } 70% { box-shadow: 0 0 0 8px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }`}</style>
      </div>
    </Link>
  );
}
