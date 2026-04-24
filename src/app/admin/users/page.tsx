'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, Mail, Loader2, Shield } from 'lucide-react';

const BORDER = 'rgba(255,255,255,0.06)';
const CARD_BG = 'rgba(255,255,255,0.02)';

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          role,
          created_at,
          pharmacy_id,
          pharmacies ( name )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Global Users</h2>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '4px 0 0 0' }}>Manage all user accounts across all stores</p>
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
              placeholder="Search users by name or email..."
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
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b', fontSize: 14 }}>
            No users found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredUsers.map(user => (
              <div key={user.id} style={{
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={24} color="#34d399" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>
                      {user.full_name || 'Unnamed User'}
                      <span style={{ 
                        marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 4, 
                        background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 500
                      }}>
                        {user.role}
                      </span>
                    </h4>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#94a3b8' }}>
                      {user.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12}/> {user.email}</span>}
                      {user.pharmacies?.name && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Shield size={12}/> Store: {user.pharmacies.name}</span>}
                    </div>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    Joined: {new Date(user.created_at).toLocaleDateString()}
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
