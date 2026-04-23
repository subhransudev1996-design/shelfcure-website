'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const isAuthPage = pathname === '/panel/login' || pathname === '/panel/register';

  const user = usePanelStore((s) => s.user);
  const setUser = usePanelStore((s) => s.setUser);
  const setPharmacy = usePanelStore((s) => s.setPharmacy);
  const sidebarCollapsed = usePanelStore((s) => s.sidebarCollapsed);

  const checkAuth = useCallback(async () => {
    // Auth pages don't need authentication
    if (isAuthPage) {
      setLoading(false);
      setAuthChecked(true);
      return;
    }

    // If we already loaded user data, skip
    if (user) {
      setLoading(false);
      setAuthChecked(true);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // Use getUser() which makes a server call and is more reliable than getSession()
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      console.log('[PanelLayout] getUser result:', {
        hasUser: !!authUser,
        userId: authUser?.id,
        error: authError?.message,
      });

      if (authError || !authUser) {
        console.log('[PanelLayout] No authenticated user, redirecting to login');
        router.replace('/panel/login');
        setLoading(false);
        setAuthChecked(true);
        return;
      }

      // First, check if this is a super admin
      const { data: superAdmin, error: superError } = await supabase
        .from('super_admins')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .eq('is_active', true)
        .maybeSingle();

      if (superAdmin) {
        console.log('[PanelLayout] Super admin detected, redirecting to /admin');
        router.replace('/admin');
        setLoading(false);
        setAuthChecked(true);
        return;
      }

      // Fetch normal user record
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id, auth_user_id, full_name, email, role, is_active, pharmacy_id')
        .eq('auth_user_id', authUser.id)
        .eq('is_active', true)
        .maybeSingle();

      console.log('[PanelLayout] User record:', { found: !!userRecord, error: userError?.message });

      // If no user record in DB, use auth user data directly
      if (!userRecord) {
        console.log('[PanelLayout] No user record in DB, using auth user data directly.');
        setUser({
          id: authUser.id,
          auth_user_id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.email || 'User',
          email: authUser.email ?? null,
          role: 'store_admin', // Default to store_admin instead of admin
          is_active: true,
        });
        setPharmacy(null, 'My Pharmacy');
        console.log('[PanelLayout] Auth success (from auth user, no DB record).');
      } else {
        // Fetch pharmacy
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
          role: userRecord.role as 'store_admin' | 'store_manager' | 'cashier',
          is_active: userRecord.is_active,
        });

        const pId = pharmacy?.id ?? userRecord.pharmacy_id;
        const pName = pharmacy?.name ?? 'My Pharmacy';
        setPharmacy(pId ? String(pId) : null, pName);
        console.log('[PanelLayout] Auth success, user loaded from DB.');
      }
    } catch (err) {
      console.error('[PanelLayout] Error:', err);
      router.replace('/panel/login');
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  }, [isAuthPage, user, router, setUser, setPharmacy]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ── Loading screen ──────────────────────────────────────────
  if (loading && !authChecked) {
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
