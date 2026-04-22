'use client';

import { useState } from 'react';
import { Bell, Search, Filter, AlertTriangle, AlertCircle, Info, Package, Pill, Clock, CheckCircle2, MoreHorizontal, Check } from 'lucide-react';
import { SearchInput } from '@/components/panel/SearchInput';

/* ─── Palette ─── */
const C = {
  bg: '#020617',          
  card: '#0B1121',        
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc', 
  muted: '#94a3b8',
  primary: '#3b82f6',     // Blue 500
  warning: '#f59e0b',     // Amber
  critical: '#ef4444',    // Red
  info: '#0ea5e9',        // Light Blue
  success: '#10b981',
};

// Mock Data
type NotificationType = 'expiry' | 'low_stock' | 'system' | 'update' | 'critical';

interface Notice {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const NOTIFICATIONS: Notice[] = [
  { id: '1', type: 'critical', title: 'Action Required: Medicines Expiring Soon', message: 'You have 14 medicines expiring in the next 30 days. Please review and manage out-of-date stock.', time: '10 Mins Ago', read: false },
  { id: '2', type: 'low_stock', title: 'Low Stock Alert: Paracetamol 500mg', message: 'Current stock is below the minimum threshold (5 strips left). Consider raising a purchase order.', time: '2 Hrs Ago', read: false },
  { id: '3', type: 'update', title: 'System Updated to v2.4', message: 'ShelfCure Desktop has been updated successfully. Checkout the new challan generation features.', time: 'Yesterday', read: true },
  { id: '4', type: 'system', title: 'Nightly Backup Completed', message: 'Database backup was successfully encrypted and synced to the secure cloud.', time: '2 Days Ago', read: true },
];

export default function NotificationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [notices, setNotices] = useState<Notice[]>(NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotices = notices.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'unread' && !n.read);
    return matchesSearch && matchesFilter;
  });

  const markAllRead = () => {
    setNotices(notices.map(n => ({ ...n, read: true })));
  };

  const getNoticeConfig = (type: string) => {
    switch (type) {
      case 'critical': return { icon: AlertTriangle, color: C.critical, bg: 'rgba(239,68,68,0.1)' };
      case 'low_stock': return { icon: Package, color: C.warning, bg: 'rgba(245,158,11,0.1)' };
      case 'update': return { icon: Info, color: C.primary, bg: 'rgba(59,130,246,0.1)' };
      default: return { icon: Bell, color: C.muted, bg: 'rgba(255,255,255,0.05)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', marginTop: -10 }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${C.cardBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell style={{ width: 22, height: 22, color: C.text }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: '-0.02em' }}>Inbox & Alerts</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>System-wide notifications, warnings, and updates.</p>
          </div>
        </div>

        <button 
          onClick={markAllRead}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.cardBorder}`,
            backgroundColor: 'rgba(255,255,255,0.02)', color: C.text, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
        >
          <Check style={{ width: 14, height: 14 }} /> Mark all as read
        </button>
      </div>

      <div style={{ display: 'flex', gap: 32, flex: 1, minHeight: 0 }}>
        {/* ── Left Sidebar Nav ── */}
        <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
           <button onClick={() => setFilter('all')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, border: 'none', backgroundColor: filter === 'all' ? 'rgba(255,255,255,0.06)' : 'transparent', color: filter === 'all' ? C.text : C.muted, fontSize: 14, fontWeight: filter === 'all' ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left' }}>
              All Notifications
           </button>
           <button onClick={() => setFilter('unread')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, border: 'none', backgroundColor: filter === 'unread' ? 'rgba(255,255,255,0.06)' : 'transparent', color: filter === 'unread' ? C.text : C.muted, fontSize: 14, fontWeight: filter === 'unread' ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left' }}>
              Unread
              <span style={{ padding: '2px 8px', borderRadius: 10, backgroundColor: C.primary, color: '#fff', fontSize: 11, fontWeight: 800 }}>{notices.filter(n => !n.read).length}</span>
           </button>
        </div>

        {/* ── Right Content Area ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          
           {/* Navigation / Ribbon */}
           <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
             <div style={{ flex: 1, maxWidth: 400 }}>
               <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder={`Search alerts...`} />
             </div>
             <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderRadius: 12, backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, color: C.text, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
               <Filter style={{ width: 14, height: 14 }} /> Filter Category
             </button>
           </div>

           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {filteredNotices.length === 0 ? (
               <div style={{ padding: '80px 40px', textAlign: 'center', backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16 }}>
                 <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                   <CheckCircle2 style={{ width: 24, height: 24, color: C.muted }} />
                 </div>
                 <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>You're all caught up</h3>
                 <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>No new notifications to display.</p>
               </div>
             ) : (
               <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
                 {filteredNotices.map((n, idx) => {
                   const config = getNoticeConfig(n.type);
                   return (
                     <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '24px', borderBottom: idx < filteredNotices.length - 1 ? `1px solid ${C.cardBorder}` : 'none', backgroundColor: n.read ? 'transparent' : 'rgba(59,130,246,0.03)', transition: 'background 0.2s', position: 'relative' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = n.read ? 'transparent' : 'rgba(59,130,246,0.03)'}>
                       
                       {!n.read && (
                         <div style={{ position: 'absolute', left: 0, top: '24px', bottom: '24px', width: 3, backgroundColor: C.primary, borderRadius: '0 4px 4px 0' }} />
                       )}

                       <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                         <config.icon style={{ width: 18, height: 18, color: config.color }} />
                       </div>
                       
                       <div style={{ flex: 1 }}>
                         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                           <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text }}>{n.title}</h4>
                           <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{n.time}</span>
                         </div>
                         <p style={{ margin: 0, fontSize: 14, color: n.read ? C.muted : '#cbd5e1', lineHeight: 1.5, paddingRight: 40 }}>
                           {n.message}
                         </p>
                       </div>
                       
                       <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4, borderRadius: 6 }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                         <MoreHorizontal style={{ width: 18, height: 18 }} />
                       </button>

                     </div>
                   )
                 })}
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
}
