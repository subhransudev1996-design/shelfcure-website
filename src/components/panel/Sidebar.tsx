'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { usePanelStore } from '@/store/panelStore';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Receipt,
  RotateCcw, Truck, Users, Building2, Wallet,
  BarChart3, FileText, Settings, Pill,
  Tag, Bell, LifeBuoy, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

const SIDEBAR_BG = '#07091a';
const BORDER = 'rgba(255,255,255,0.06)';
const ACTIVE_BG = 'rgba(99,102,241,0.13)';
const ACTIVE_TEXT = '#a5b4fc';
const ACTIVE_ICON = '#818cf8';
const IDLE_TEXT = '#475569';

const navSections = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/panel', icon: LayoutDashboard },
      { label: 'Notifications', href: '/panel/notifications', icon: Bell },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Point of Sale', href: '/panel/pos', icon: ShoppingCart },
      { label: 'Inventory', href: '/panel/inventory', icon: Package, roles: ['store_admin', 'store_manager'] },
      { label: 'Sales History', href: '/panel/sales', icon: Receipt },
      { label: 'Returns', href: '/panel/returns', icon: RotateCcw },
      { label: 'Purchases', href: '/panel/purchases', icon: Truck, roles: ['store_admin', 'store_manager'] },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'Customers', href: '/panel/customers', icon: Users },
      { label: 'Suppliers', href: '/panel/suppliers', icon: Building2, roles: ['store_admin', 'store_manager'] },
      { label: 'Finance', href: '/panel/finance', icon: Wallet, roles: ['store_admin'] },
      { label: 'Challans', href: '/panel/challans', icon: FileText, roles: ['store_admin', 'store_manager'] },
      { label: 'Promotions', href: '/panel/promotions', icon: Tag, roles: ['store_admin', 'store_manager'] },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Reports', href: '/panel/reports', icon: BarChart3, roles: ['store_admin', 'store_manager'] },
      { label: 'Settings', href: '/panel/settings', icon: Settings, roles: ['store_admin'] },
      { label: 'Support', href: '/panel/support', icon: LifeBuoy },
    ],
  },
];

/** Tooltip that appears to the right of an icon when sidebar is collapsed */
function NavTooltip({ label, visible }: { label: string; visible: boolean }) {
  return (
    <span style={{
      position: 'absolute',
      left: 'calc(100% + 14px)',
      top: '50%', transform: 'translateY(-50%)',
      background: '#1e293b',
      border: '1px solid rgba(255,255,255,0.1)',
      color: '#e2e8f0', fontSize: 11, fontWeight: 700,
      padding: '5px 10px', borderRadius: 8,
      whiteSpace: 'nowrap', pointerEvents: 'none',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.15s ease',
      zIndex: 60,
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      {label}
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = usePanelStore((s) => s.sidebarCollapsed);
  const toggleSidebar = usePanelStore((s) => s.toggleSidebar);
  const pharmacyName = usePanelStore((s) => s.pharmacyName);
  const user = usePanelStore((s) => s.user);
  const [toggleHovered, setToggleHovered] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isActive = (href: string) =>
    href === '/panel' ? pathname === '/panel' : pathname.startsWith(href);

  // [ key shortcut to toggle sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '[' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar]);

  return (
    <>
      <aside style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40,
        width: collapsed ? 72 : 260,
        display: 'flex', flexDirection: 'column',
        background: `linear-gradient(180deg, ${SIDEBAR_BG} 0%, #050714 100%)`,
        borderRight: `1px solid ${BORDER}`,
        boxShadow: collapsed ? '4px 0 24px rgba(0,0,0,0.4)' : '4px 0 40px rgba(0,0,0,0.6)',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflowX: 'hidden',
      }}>

        {/* ── Logo ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 16px', height: 64,
          borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          {collapsed ? (
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            }}>
              <Pill style={{ width: 17, height: 17, color: '#fff' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden' }}>
              <div style={{
                background: 'rgba(255,255,255,0.95)', borderRadius: 8,
                padding: '4px 10px', display: 'inline-flex', alignItems: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}>
                <Image src="/logo.png" alt="ShelfCure" width={110} height={34}
                  style={{ width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }} priority />
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: '14px 10px',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent',
        }}>
          {navSections.map((section, si) => {
            const filteredItems = section.items.filter(item => !item.roles || (user?.role && item.roles.includes(user.role)));
            if (filteredItems.length === 0) return null;

            return (
            <div key={section.label} style={{ marginBottom: si < navSections.length - 1 ? 22 : 0 }}>
              {!collapsed && (
                <p style={{
                  margin: '0 0 5px 10px', fontSize: 9, fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '0.13em', color: '#293548',
                }}>
                  {section.label}
                </p>
              )}
              {collapsed && si > 0 && (
                <div style={{ height: 1, background: BORDER, margin: '8px 8px 10px' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <div key={item.href} style={{ position: 'relative' }}
                      onMouseEnter={() => setHoveredItem(item.href)}
                      onMouseLeave={() => setHoveredItem(null)}>
                      <Link
                        href={item.href}
                        style={{
                          position: 'relative', display: 'flex', alignItems: 'center',
                          gap: 10, padding: collapsed ? '10px' : '9px 10px',
                          borderRadius: 11, fontSize: 13,
                          fontWeight: active ? 700 : 500,
                          color: active ? ACTIVE_TEXT : IDLE_TEXT,
                          backgroundColor: active ? ACTIVE_BG : 'transparent',
                          textDecoration: 'none',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.color = '#94a3b8';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = IDLE_TEXT;
                          }
                        }}
                      >
                        {active && (
                          <span style={{
                            position: 'absolute', left: 0,
                            top: '50%', transform: 'translateY(-50%)',
                            width: 3, height: 20, borderRadius: '0 4px 4px 0',
                            backgroundColor: ACTIVE_ICON,
                            boxShadow: `0 0 8px ${ACTIVE_ICON}88`,
                          }} />
                        )}
                        <item.icon style={{
                          width: 16, height: 16, flexShrink: 0,
                          color: active ? ACTIVE_ICON : '#334155',
                          transition: 'color 0.15s',
                        }} />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                      {/* Tooltip shown only when collapsed */}
                      {collapsed && (
                        <NavTooltip label={item.label} visible={hoveredItem === item.href} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })}
        </nav>

        {/* ── Bottom: shortcut hint + collapse button ── */}
        <div style={{ padding: '10px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
          {!collapsed && (
            <p style={{ fontSize: 9, fontWeight: 600, color: '#1e293b', textAlign: 'center', margin: '0 0 8px', letterSpacing: '0.06em' }}>
              Press <kbd style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace', fontSize: 9, color: '#334155' }}>[</kbd> to toggle
            </p>
          )}
          <button
            onClick={toggleSidebar}
            onMouseEnter={() => setToggleHovered(true)}
            onMouseLeave={() => setToggleHovered(false)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 8, padding: collapsed ? '9px' : '9px 12px',
              borderRadius: 11, border: `1px solid ${toggleHovered ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
              background: toggleHovered ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.025)',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            {collapsed ? (
              <PanelLeftOpen style={{ width: 16, height: 16, color: toggleHovered ? '#818cf8' : '#3d4f68', transition: 'color 0.2s' }} />
            ) : (
              <>
                <PanelLeftClose style={{ width: 16, height: 16, color: toggleHovered ? '#818cf8' : '#3d4f68', transition: 'color 0.2s' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: toggleHovered ? '#818cf8' : '#3d4f68', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
                  Minimize sidebar
                </span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Floating edge toggle pill ── */}
      <button
        onClick={toggleSidebar}
        onMouseEnter={() => setToggleHovered(true)}
        onMouseLeave={() => setToggleHovered(false)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'fixed',
          top: '50%',
          left: collapsed ? 58 : 246,
          transform: 'translateY(-50%)',
          zIndex: 50,
          width: 24, height: 40,
          borderRadius: '0 8px 8px 0',
          borderTop: toggleHovered ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
          borderRight: toggleHovered ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
          borderBottom: toggleHovered ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
          borderLeft: 'none',
          background: toggleHovered
            ? 'linear-gradient(180deg, rgba(99,102,241,0.25), rgba(99,102,241,0.12))'
            : 'rgba(7,9,26,0.9)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: toggleHovered ? '4px 0 20px rgba(99,102,241,0.3)' : '4px 0 12px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{
          width: 4, height: 20,
          background: toggleHovered ? '#818cf8' : 'rgba(255,255,255,0.15)',
          borderRadius: 10,
          transition: 'all 0.2s ease',
        }} />
      </button>
    </>
  );
}
