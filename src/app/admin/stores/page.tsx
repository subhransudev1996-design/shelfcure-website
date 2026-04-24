'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Building2, Search, MapPin, Phone, Mail, Loader2 } from 'lucide-react';

const BORDER = 'rgba(255,255,255,0.06)';
const CARD_BG = 'rgba(255,255,255,0.02)';

export default function AdminStoresPage() {
  const supabase = createClient();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (err) {
      console.error('Error loading stores:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredStores = stores.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Registered Stores</h2>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '4px 0 0 0' }}>Manage all pharmacies on the platform</p>
        </div>
      </div>

      <div style={{
        background: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {/* Search Bar */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            flex: 1, position: 'relative', display: 'flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '0 12px'
          }}>
            <Search size={18} color="#64748b" />
            <input
              type="text"
              placeholder="Search stores by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: '#f8fafc',
                padding: '10px 12px', fontSize: 14, width: '100%', outline: 'none'
              }}
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0', color: '#64748b' }}>
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : filteredStores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b', fontSize: 14 }}>
            No stores found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredStores.map(store => (
              <div key={store.id} style={{
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={24} color="#818cf8" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>
                      {store.name || 'Unnamed Store'}
                    </h4>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#94a3b8' }}>
                      {store.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12}/> {store.email}</span>}
                      {store.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12}/> {store.phone}</span>}
                      {store.address && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12}/> {store.address}</span>}
                    </div>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    Joined: {new Date(store.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
