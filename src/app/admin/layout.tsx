'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { usePanelStore } from '@/store/panelStore';

const DARK_BG = '#020617';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const isAuthPage = pathname === '/admin/login';

  const sidebarCollapsed = usePanelStore((s) => s.sidebarCollapsed);

  const checkAuth = useCallback(async () => {
    if (isAuthPage) {
      setLoading(false);
      setAuthChecked(true);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        router.replace('/admin/login');
        setLoading(false);
        setAuthChecked(true);
        return;
      }

      // Check if super admin
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('id, email, full_name')
        .eq('auth_user_id', authUser.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!superAdmin) {
        // Not a super admin, redirect to normal panel
        router.replace('/panel');
        return;
      }
      
    } catch (err) {
      console.error('[AdminLayout] Error:', err);
      router.replace('/admin/login');
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  }, [isAuthPage, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
          <Loader2 style={{ width: 24, height: 24, color: '#818cf8', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 600 }}>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

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
        }}
      />
      <AdminSidebar />
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
        <AdminTopBar />
        <main style={{ padding: '1.5rem', flex: 1, width: '100%', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
