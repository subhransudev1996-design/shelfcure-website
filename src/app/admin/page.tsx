'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Building2, TrendingUp, AlertTriangle } from 'lucide-react';

const BORDER = 'rgba(255,255,255,0.06)';
const CARD_BG = 'rgba(255,255,255,0.02)';

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalStores: 0,
    activeStores: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [storesRes, usersRes] = await Promise.all([
          supabase.from('pharmacies').select('id', { count: 'exact' }),
          supabase.from('users').select('id', { count: 'exact' }),
        ]);

        setStats({
          totalStores: storesRes.count || 0,
          activeStores: storesRes.count || 0, // Mock for now, would depend on a status field
          totalUsers: usersRes.count || 0,
        });
      } catch (err) {
        console.error('Error loading admin stats:', err);
      }
    }
    loadStats();
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Overview</h2>
        <p style={{ color: '#94a3b8', fontSize: 14, margin: '4px 0 0 0' }}>Global platform metrics and status</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        
        {/* Stores Stat */}
        <div style={{
          background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} color="#818cf8" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, margin: '0 0 4px 0' }}>Total Stores</p>
            <h3 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#f8fafc' }}>{stats.totalStores}</h3>
          </div>
        </div>

        {/* Users Stat */}
        <div style={{
          background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#34d399" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, margin: '0 0 4px 0' }}>Total Users</p>
            <h3 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#f8fafc' }}>{stats.totalUsers}</h3>
          </div>
        </div>

        {/* System Health */}
        <div style={{
          background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} color="#38bdf8" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, margin: '0 0 4px 0' }}>System Health</p>
            <h3 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#f8fafc' }}>99.9%</h3>
          </div>
        </div>
      </div>

    </div>
  );
}
