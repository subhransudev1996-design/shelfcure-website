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

      // Use our secure RPC to guarantee atomic creation of pharmacy and user record, bypassing client-side RLS issues.
      const { data: setupData, error: setupError } = await supabase.rpc('setup_new_user_pharmacy', {
        p_full_name: authUser.user_metadata?.full_name || authUser.email || 'User',
        p_email: authUser.email || '',
        p_pharmacy_name: (authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'My') + "'s Pharmacy"
      });

      if (setupError || !setupData) {
        console.error('[PanelLayout] Failed to setup user/pharmacy via RPC:', setupError);
        setLoading(false);
        setAuthChecked(true);
        return;
      }

      setUser({
        id: String(setupData.user_id),
        auth_user_id: authUser.id,
        full_name: setupData.full_name,
        email: setupData.email ?? null,
        role: setupData.role as 'store_admin' | 'store_manager' | 'cashier',
        is_active: setupData.is_active,
      });

      setPharmacy(String(setupData.pharmacy_id), setupData.pharmacy_name);
      console.log('[PanelLayout] Auth success (RPC validated DB records).');
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
