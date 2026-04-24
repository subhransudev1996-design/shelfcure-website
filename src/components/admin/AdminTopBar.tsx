'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { LogOut, User, ChevronDown } from 'lucide-react';

const BORDER = 'rgba(255,255,255,0.06)';

function getBreadcrumb(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean).slice(1);
  if (!parts.length) return 'Dashboard';
  return parts.map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' › ');
}

export function AdminTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const logout = usePanelStore((s) => s.logout);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      logout();
      router.replace('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header style={{
      height: 64,
      background: 'rgba(7,9,26,0.8)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${BORDER}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{
          fontSize: 16,
          fontWeight: 600,
          color: '#f8fafc',
          letterSpacing: '-0.01em'
        }}>
          {getBreadcrumb(pathname)}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'transparent',
              border: `1px solid ${dropdownOpen ? 'rgba(129,140,248,0.3)' : 'transparent'}`,
              padding: '6px 12px 6px 6px',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={14} color="#94a3b8" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#f8fafc' }}>
              Super Admin
            </span>
            <ChevronDown size={14} color="#64748b" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 220,
              background: '#0f172a',
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              padding: 6,
              zIndex: 100,
              animation: 'slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <div style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, marginBottom: 6 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account</p>
                <p style={{ fontSize: 13, color: '#f8fafc', marginTop: 4, fontWeight: 500 }} className="truncate">Root User</p>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8,
                  background: 'transparent', border: 'none',
                  color: '#ef4444', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </header>
  );
}
