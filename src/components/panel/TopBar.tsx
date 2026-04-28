'use client';

import { useState, useRef, useEffect, useCallback, CSSProperties } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import {
  Bell, LogOut, User, ChevronDown, Search,
  AlertTriangle, Clock, Package, CheckCheck, ArrowRight, X, Menu,
} from 'lucide-react';
import Link from 'next/link';
import { GlobalSearch } from './GlobalSearch';

const BORDER = 'rgba(255,255,255,0.06)';

function getBreadcrumb(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean).slice(1);
  if (!parts.length) return 'Dashboard';
  return parts.map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' › ');
}

interface AppNotice {
  id: string;
  type: 'critical' | 'low_stock' | 'expiry' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  href?: string;
}

const STATIC_NOTICES: AppNotice[] = [
  { id: 'sys-1', type: 'system', title: 'System Updated to v2.4', message: 'New challan generation features are now live.', time: 'Yesterday', read: false, href: '/panel/notifications' },
];

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NoticeIcon({ type }: { type: AppNotice['type'] }) {
  const cfg = {
    critical: { icon: AlertTriangle, color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
    low_stock: { icon: Package, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    expiry: { icon: Clock, color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
    system: { icon: Bell, color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  }[type];
  const Icon = cfg.icon;
  return (
    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon style={{ width: 15, height: 15, color: cfg.color }} />
    </div>
  );
}

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const user = usePanelStore((s) => s.user);
  const pharmacyId = usePanelStore((s) => s.pharmacyId);
  const pharmacyName = usePanelStore((s) => s.pharmacyName);
  const logout = usePanelStore((s) => s.logout);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notices, setNotices] = useState<AppNotice[]>(STATIC_NOTICES);
  const [loadingNotices, setLoadingNotices] = useState(false);

  // Global ⌘K / Ctrl+K to open search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key === 'k' || e.key === 'K';
      if (isK && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const fetchNotices = useCallback(async () => {
    if (!pharmacyId) return;
    setLoadingNotices(true);
    try {
      const now = new Date();
      const expiryCutoff = new Date(now.getTime() + 90 * 86400000).toISOString().split('T')[0];
      const today = now.toISOString().split('T')[0];

      const [lowStockRes, expirySoonRes, expiredRes] = await Promise.all([
        supabase.from('batches').select('id', { count: 'exact' }).eq('pharmacy_id', pharmacyId).lt('stock_quantity', 10).gt('stock_quantity', 0).limit(1),
        supabase.from('batches').select('id', { count: 'exact' }).eq('pharmacy_id', pharmacyId).lte('expiry_date', expiryCutoff).gte('expiry_date', today).limit(1),
        supabase.from('batches').select('id', { count: 'exact' }).eq('pharmacy_id', pharmacyId).lt('expiry_date', today).limit(1),
      ]);

      if (lowStockRes.error) console.error('Low stock error:', lowStockRes.error?.message || JSON.stringify(lowStockRes.error));
      if (expirySoonRes.error) console.error('Expiry soon error:', expirySoonRes.error?.message || JSON.stringify(expirySoonRes.error));
      if (expiredRes.error) console.error('Expired error:', expiredRes.error?.message || JSON.stringify(expiredRes.error));

      const dynamic: AppNotice[] = [];

      if ((expiredRes.count ?? 0) > 0) {
        dynamic.push({
          id: 'expired', type: 'critical',
          title: `${expiredRes.count} Expired Batch${expiredRes.count! > 1 ? 'es' : ''} in Inventory`,
          message: 'Expired stock is active — review and remove immediately.',
          time: timeAgo(now), read: false, href: '/panel/reports/expiry',
        });
      }
      if ((expirySoonRes.count ?? 0) > 0) {
        dynamic.push({
          id: 'expiry-soon', type: 'expiry',
          title: `${expirySoonRes.count} Items Expiring Within 90 Days`,
          message: 'Review these items to avoid losses.',
          time: timeAgo(now), read: false, href: '/panel/reports/expiry',
        });
      }
      if ((lowStockRes.count ?? 0) > 0) {
        dynamic.push({
          id: 'low-stock', type: 'low_stock',
          title: `${lowStockRes.count} Low-Stock Batches`,
          message: 'Batches below minimum threshold — raise a purchase order.',
          time: timeAgo(now), read: false, href: '/panel/inventory',
        });
      }

      setNotices([...dynamic, ...STATIC_NOTICES]);
    } catch (err) {
      console.error('Failed to fetch notices:', err);
    } finally {
      setLoadingNotices(false);
    }
  }, [pharmacyId]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // Load notices when bell opens
  const handleBellClick = () => {
    const next = !bellOpen;
    setBellOpen(next);
    setDropdownOpen(false);
    if (next) fetchNotices();
  };

  const markAllRead = () => setNotices((n) => n.map((x) => ({ ...x, read: true })));
  const markRead = (id: string) => setNotices((n) => n.map((x) => x.id === id ? { ...x, read: true } : x));

  const unreadCount = notices.filter((n) => !n.read).length;
  const breadcrumb = getBreadcrumb(pathname);
  const initials = user?.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U';

  const btnBase: CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
    backgroundColor: 'transparent',
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30, height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      background: 'rgba(7,9,26,0.88)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${BORDER}`,
    }}>

      {/* Left: toggle + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={() => usePanelStore.getState().toggleSidebar()}
          style={{ ...btnBase, color: '#94a3b8', padding: 4, borderRadius: 6 }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          title="Toggle Sidebar"
        >
          <Menu style={{ width: 18, height: 18 }} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em', lineHeight: 1 }}>{breadcrumb}</h1>
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          title="Search (Ctrl+K)"
          style={{ ...btnBase, gap: 8, padding: '7px 12px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: '#475569', fontSize: 11, fontWeight: 600 }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#94a3b8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#475569'; }}
        >
          <Search style={{ width: 13, height: 13 }} />
          <kbd style={{ padding: '2px 5px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 5, fontSize: 9, color: '#334155', fontFamily: 'monospace' }}>⌘K</kbd>
        </button>

        {/* ── Bell + Notification Dropdown ── */}
        <div style={{ position: 'relative' }} ref={bellRef}>
          <button
            onClick={handleBellClick}
            style={{
              ...btnBase, padding: 10, borderRadius: 10, position: 'relative',
              color: bellOpen ? '#a5b4fc' : '#475569',
              backgroundColor: bellOpen ? 'rgba(99,102,241,0.12)' : 'transparent',
              border: `1px solid ${bellOpen ? 'rgba(99,102,241,0.25)' : 'transparent'}`,
            }}
            onMouseEnter={(e) => { if (!bellOpen) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#f1f5f9'; } }}
            onMouseLeave={(e) => { if (!bellOpen) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
          >
            <Bell style={{ width: 16, height: 16, transition: 'color 0.15s' }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                minWidth: 16, height: 16, borderRadius: 8,
                background: 'linear-gradient(135deg, #f87171, #ef4444)',
                color: '#fff', fontSize: 9, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 2px #07091a',
                padding: '0 3px',
                animation: 'bellPop 0.3s ease',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 10px)',
              width: 380, background: '#0b0f24',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 18, overflow: 'hidden', zIndex: 50,
              boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
              animation: 'dropIn 0.2s cubic-bezier(0.4,0,0.2,1)',
            }}>
              {/* Header */}
              <div style={{ padding: '16px 18px 14px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>Notifications</p>
                  {unreadCount > 0 && (
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#475569' }}>{unreadCount} unread alert{unreadCount > 1 ? 's' : ''}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} title="Mark all read" style={{ ...btnBase, padding: '6px 10px', borderRadius: 8, border: `1px solid rgba(255,255,255,0.06)`, background: 'rgba(255,255,255,0.03)', fontSize: 11, fontWeight: 600, color: '#64748b', gap: 5 }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
                      <CheckCheck style={{ width: 12, height: 12 }} /> Mark all read
                    </button>
                  )}
                  <button onClick={() => setBellOpen(false)} style={{ ...btnBase, padding: 6, borderRadius: 8, color: '#475569' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#f1f5f9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569'; }}>
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>

              {/* Notice list */}
              <div style={{ maxHeight: 360, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
                {loadingNotices ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                    <div style={{ width: 20, height: 20, border: '2px solid rgba(129,140,248,0.2)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>Checking for alerts...</p>
                  </div>
                ) : notices.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <CheckCheck style={{ width: 20, height: 20, color: '#34d399' }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>All clear!</p>
                    <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 0' }}>No active alerts right now.</p>
                  </div>
                ) : (
                  notices.map((n, idx) => (
                    <div
                      key={n.id}
                      onClick={() => { markRead(n.id); if (n.href) router.push(n.href); setBellOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '14px 18px',
                        borderBottom: idx < notices.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none',
                        cursor: 'pointer',
                        background: n.read ? 'transparent' : 'rgba(99,102,241,0.04)',
                        position: 'relative', transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(99,102,241,0.04)'; }}
                    >
                      {!n.read && (
                        <div style={{ position: 'absolute', left: 0, top: 16, bottom: 16, width: 3, background: '#818cf8', borderRadius: '0 3px 3px 0' }} />
                      )}
                      <NoticeIcon type={n.type} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
                          <p style={{ fontSize: 12, fontWeight: n.read ? 600 : 800, color: n.read ? '#94a3b8' : '#e2e8f0', margin: 0, lineHeight: 1.3 }}>{n.title}</p>
                          <span style={{ fontSize: 10, color: '#334155', fontWeight: 600, flexShrink: 0 }}>{n.time}</span>
                        </div>
                        <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.5 }}>{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '12px 18px', borderTop: `1px solid rgba(255,255,255,0.05)`, background: 'rgba(255,255,255,0.01)' }}>
                <Link
                  href="/panel/notifications"
                  onClick={() => setBellOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#818cf8', textDecoration: 'none', padding: '8px', borderRadius: 10, transition: 'background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  View all notifications <ArrowRight style={{ width: 13, height: 13 }} />
                </Link>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 24, backgroundColor: BORDER, margin: '0 4px' }} />

        {/* User dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen(!dropdownOpen); setBellOpen(false); }}
            style={{ ...btnBase, gap: 8, padding: '6px 10px 6px 6px', borderRadius: 12, backgroundColor: dropdownOpen ? 'rgba(255,255,255,0.06)' : 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = dropdownOpen ? 'rgba(255,255,255,0.06)' : 'transparent'; }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg, #6366f1, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 900, boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}>{initials}</div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2 }}>{user?.full_name || 'User'}</p>
              <p style={{ margin: '1px 0 0', fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{user?.role || 'admin'}</p>
            </div>
            <ChevronDown style={{ width: 12, height: 12, color: '#475569', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </button>

          {dropdownOpen && (
            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 240, background: '#0b0f24', border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden', zIndex: 50, boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)', animation: 'dropIn 0.2s cubic-bezier(0.4,0,0.2,1)' }}>
              <div style={{ padding: '16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: 'linear-gradient(135deg, #6366f1, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 900 }}>{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{user?.full_name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                </div>
              </div>
              <div style={{ padding: 8 }}>
                {[
                  { icon: User, label: 'Profile & Settings', action: () => { setDropdownOpen(false); router.push('/panel/settings'); }, color: '#94a3b8', hover: 'rgba(255,255,255,0.05)' },
                  { icon: LogOut, label: 'Sign Out', action: async () => { await supabase.auth.signOut(); logout(); router.push('/panel/login'); router.refresh(); }, color: '#f87171', hover: 'rgba(239,68,68,0.1)' },
                ].map(({ icon: Icon, label, action, color, hover }) => (
                  <button key={label} onClick={action} style={{ ...btnBase, justifyContent: 'flex-start', width: '100%', gap: 10, padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500, color }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <Icon style={{ width: 14, height: 14 }} />{label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dropIn { from { opacity:0; transform:translateY(-8px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes bellPop { from { transform:scale(0.5); } to { transform:scale(1); } }
      `}</style>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
