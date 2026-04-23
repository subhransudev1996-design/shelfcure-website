'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { Sidebar } from '@/components/panel/Sidebar';
import { TopBar } from '@/components/panel/TopBar';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const DARK_BG = '#020617'; // slate-950

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const isAuthPage = pathname === '/panel/login' || pathname === '/panel/register';

  const setUser = usePanelStore((s) => s.setUser);
  const setPharmacy = usePanelStore((s) => s.setPharmacy);
  const sidebarCollapsed = usePanelStore((s) => s.sidebarCollapsed);

  useEffect(() => {
    // Prevent duplicate initialization (React StrictMode double-invoke)
    if (initialized.current) return;
    initialized.current = true;

    async function initialize() {
      if (isAuthPage) {
        setLoading(false);
        return;
      }

      try {
        // First try getSession() for a quick cached check
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          // No cached session — redirect to login
          router.push('/panel/login');
          return;
        }

        const authUser = session.user;

        // Fetch user record with pharmacy info
        const { data: userRecord } = await supabase
          .from('users')
          .select('id, auth_user_id, full_name, email, role, is_active, pharmacy_id')
          .eq('auth_user_id', authUser.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!userRecord) {
          router.push('/panel/login');
          return;
        }

        // Fetch pharmacy name
        const { data: pharmacy } = await supabase
          .from('pharmacies')
          .select('id, name')
          .eq('id', userRecord.pharmacy_id)
          .maybeSingle();

        setUser({
          id: String(userRecord.id),
          auth_user_id: String(userRecord.auth_user_id),
          full_name: userRecord.full_name,
          email: userRecord.email ?? null,
          role: userRecord.role,
          is_active: userRecord.is_active,
        });

        // Always use the pharmacy_id from the user record as fallback
        const pId = pharmacy?.id ?? userRecord.pharmacy_id;
        const pName = pharmacy?.name ?? 'My Pharmacy';
        setPharmacy(pId ? String(pId) : null, pName);
      } catch (err) {
        console.error('Panel init error:', err);
        // Only redirect on actual auth failures, not transient network errors
        router.push('/panel/login');
      } finally {
        setLoading(false);
      }
    }

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Loading screen ──────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: DARK_BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '48px', height: '48px' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px solid rgba(99,102,241,0.2)',
              animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
            }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 style={{ width: 22, height: 22, color: '#818cf8', animation: 'spin 1s linear infinite' }} />
            </div>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 600 }}>Loading your pharmacy...</p>
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes ping { 75%,100% { transform: scale(2); opacity: 0; } }
        `}</style>
      </div>
    );
  }

  // ── Auth pages (login / register) — no chrome ──────────────
  if (isAuthPage) {
    return (
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            className: '!bg-slate-800 !text-white !border !border-white/10 !rounded-xl !text-sm !font-medium',
            duration: 3000,
          }}
        />
        {children}
      </>
    );
  }

  // ── Main app shell ──────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: DARK_BG,
      color: '#f1f5f9',
      fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
      position: 'relative',
    }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
          },
          duration: 3000,
        }}
      />
      <Sidebar />
      <div
        style={{
          marginLeft: sidebarCollapsed ? '72px' : '260px',
          transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <TopBar />
        <main style={{ padding: '1.5rem', flex: 1, width: '100%', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
