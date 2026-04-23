'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { usePanelStore } from '@/store/panelStore';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Building2, Users,
  PanelLeftClose, PanelLeftOpen, Server
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
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Stores', href: '/admin/stores', icon: Building2 },
      { label: 'Global Users', href: '/admin/users', icon: Users },
      { label: 'System Logs', href: '/admin/logs', icon: Server },
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

export function AdminSidebar() {
  const pathname = usePathname();
  const collapsed = usePanelStore((s) => s.sidebarCollapsed);
  const toggleSidebar = usePanelStore((s) => s.toggleSidebar);
  const [toggleHovered, setToggleHovered] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

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
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: collapsed ? 72 : 260,
        backgroundColor: SIDEBAR_BG,
        borderRight: `1px solid ${BORDER}`,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}
    >
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0' : '0 24px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: `1px solid ${BORDER}`,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: maxContent }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            flexShrink: 0
          }}>
            <Image src="/pill-logo.svg" alt="ShelfCure Admin" width={18} height={18} style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          {!collapsed && (
            <span style={{
              fontSize: 18,
              fontWeight: 800,
              background: 'linear-gradient(to right, #ffffff, #a5b4fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap'
            }}>
              ShelfCure <span style={{ color: '#818cf8', fontWeight: 600, WebkitTextFillColor: '#818cf8' }}>Admin</span>
            </span>
          )}
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }} className="hide-scrollbar">
        {navSections.map((section, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!collapsed && (
              <h3 style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#334155',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                paddingLeft: 12,
                marginBottom: 4,
              }}>
                {section.label}
              </h3>
            )}
            {section.items.map((item) => {
              const active = isActive(item.href);
              const isHovered = hoveredItem === item.href;
              const Icon = item.icon;

              return (
                <div key={item.href} style={{ position: 'relative' }}>
                  <Link
                    href={item.href}
                    onMouseEnter={() => setHoveredItem(item.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: collapsed ? '10px' : '10px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 12,
                      background: active ? ACTIVE_BG : isHovered ? 'rgba(255,255,255,0.03)' : 'transparent',
                      color: active ? ACTIVE_TEXT : isHovered ? '#f8fafc' : IDLE_TEXT,
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    {active && (
                      <div style={{
                        position: 'absolute',
                        left: collapsed ? 4 : 0,
                        top: '50%', transform: 'translateY(-50%)',
                        width: 3, height: 16,
                        background: '#818cf8',
                        borderRadius: '0 4px 4px 0',
                      }} />
                    )}

                    <Icon size={20} style={{
                      color: active ? ACTIVE_ICON : isHovered ? '#94a3b8' : '#334155',
                      transition: 'color 0.2s ease',
                      flexShrink: 0
                    }} />

                    {!collapsed && (
                      <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                    )}
                  </Link>

                  {collapsed && (
                    <NavTooltip label={item.label} visible={isHovered} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{
        padding: '16px',
        borderTop: `1px solid ${BORDER}`,
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'space-between',
        alignItems: 'center'
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>SA</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>Super Admin</span>
              <span style={{ fontSize: 11, color: '#475569' }}>Root Access</span>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          onMouseEnter={() => setToggleHovered(true)}
          onMouseLeave={() => setToggleHovered(false)}
          style={{
            background: toggleHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
            border: 'none',
            padding: 8,
            borderRadius: 8,
            cursor: 'pointer',
            color: toggleHovered ? '#f8fafc' : '#475569',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          title={collapsed ? "Expand sidebar ([)" : "Collapse sidebar ([)"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
    </aside>
  );
}

const maxContent = 'max-content';
