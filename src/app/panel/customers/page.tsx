'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils/format';
import { Modal } from '@/components/panel/Modal';
import toast from 'react-hot-toast';
import {
  Users, Search, X, RefreshCw, Plus,
  ChevronRight, Save, Loader2, IndianRupee,
  Phone, Mail, MapPin, UserPlus, CreditCard,
  Building2, ArrowRight
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────── */
interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  outstanding_balance: number;
  total_purchases: number;
  created_at: string;
}

/* ─── Palette ────────────────────────────────────────── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569',
  indigo: '#6366f1', indigoLight: '#818cf8',
  emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e',
  blue: '#3b82f6', purple: '#a855f7', teal: '#14b8a6',
  input: '#111827', inputBorder: 'rgba(255,255,255,0.08)',
};

/* ─── Sub-components ─────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, color, loading }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string; loading?: boolean;
}) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', backgroundColor: `${color}08`, filter: 'blur(20px)' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</p>
        <div style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 13, height: 13, color }} />
        </div>
      </div>
      {loading
        ? <div style={{ height: 28, width: '55%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.04)', animation: 'pulse 1.6s ease-in-out infinite' }} />
        : <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      }
      {sub && <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{sub}</p>}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function CustomersPage() {
  const router = useRouter();
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);

  // Add flow
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');

  /* ─── Load ─── */
  const load = useCallback(async () => {
    if (!pharmacyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, email, address, outstanding_balance, total_purchases, created_at')
        .eq('pharmacy_id', pharmacyId)
        .order('name')
        .limit(5000);

      if (error) throw error;
      setCustomers((data || []).map(c => ({ ...c, outstanding_balance: c.outstanding_balance || 0, total_purchases: c.total_purchases || 0 })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, supabase]);

  useEffect(() => {
    if (pharmacyId) { load(); }
    else { setLoading(false); }
  }, [pharmacyId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Client-side filter ─── */
  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c => 
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  /* ─── Stats ─── */
  const creditTotal = customers.reduce((s, c) => s + (c.outstanding_balance || 0), 0);
  const withCreditCount = customers.filter(c => (c.outstanding_balance || 0) > 0).length;
  
  const thisMonthCount = useMemo(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    return customers.filter(c => new Date(c.created_at) >= startOfMonth).length;
  }, [customers]);

  /* ─── Modals Logic ─── */
  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('customers').insert({
        pharmacy_id: pharmacyId,
        name: newName.trim(),
        phone: newPhone.trim() || null,
        email: newEmail.trim() || null,
        address: newAddress.trim() || null,
        outstanding_balance: 0,
      });
      if (error) throw error;
      toast.success('Customer added successfully!');
      setShowAdd(false);
      setNewName(''); setNewPhone(''); setNewEmail(''); setNewAddress('');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add customer');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Render ─── */
  const inCls = 'w-full px-3 py-2.5 bg-slate-800/40 border border-white/10 rounded-lg text-sm text-white font-medium focus:outline-none focus:border-indigo-500/50 transition-all placeholder-slate-600';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users style={{ width: 18, height: 18, color: C.indigo }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Directory</h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>
              {loading ? 'Crunching numbers…' : `${customers.length} registered patient${customers.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={load} disabled={loading}
            style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}
          >
            <RefreshCw style={{ width: 14, height: 14, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button
            onClick={() => router.push('/panel/customers/new')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${C.indigo},#4f46e5)`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.3)', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.3)'; }}
          >
            <Plus style={{ width: 15, height: 15 }} />
            New Customer
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Total Patients" value={String(customers.length)} sub="Lifelong directory" icon={Users} color={C.indigo} loading={loading} />
        <StatCard label="Due Credit" value={formatCurrency(creditTotal)} sub="Owed to pharmacy" icon={IndianRupee} color={creditTotal > 0 ? C.rose : C.muted} loading={loading} />
        <StatCard label="Credit Accounts" value={String(withCreditCount)} sub="With outstanding balances" icon={CreditCard} color={C.amber} loading={loading} />
        <StatCard label="New This Month" value={`+${thisMonthCount}`} sub="Registrations" icon={UserPlus} color={C.emerald} loading={loading} />
      </div>

      {/* ── Filters row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 42, backgroundColor: searchFocus ? '#111827' : C.input, border: `1.5px solid ${searchFocus ? C.indigo : C.inputBorder}`, borderRadius: 10, transition: 'all 0.15s ease', boxShadow: searchFocus ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none' }}>
          <Search style={{ width: 14, height: 14, color: searchFocus ? C.indigo : C.muted, flexShrink: 0 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
            placeholder="Search by patient name, phone, or email..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: C.text, fontFamily: 'inherit' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 1 }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 style={{ width: 22, height: 22, color: C.indigo, animation: 'spin 1s linear infinite' }} />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, fontWeight: 500 }}>Loading directory…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 32px', gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(99,102,241,0.06)', border: `1px solid rgba(99,102,241,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users style={{ width: 26, height: 26, color: 'rgba(99,102,241,0.4)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#334155' }}>No patients found</p>
            <p style={{ margin: '5px 0 0', fontSize: 12, color: '#1e293b' }}>
              {search ? `No results for "${search}"` : 'Your directory is completely empty'}
            </p>
          </div>
          {search && (
            <button onClick={() => setSearch('')}
              style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {filtered.map(c => {
            const initial = (c.name || '?').charAt(0).toUpperCase();
            const hasCredit = (c.outstanding_balance || 0) > 0;
            return (
              <div
                key={c.id}
                onClick={() => router.push(`/panel/customers/${c.id}`)}
                style={{
                  backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16,
                  padding: '16px', display: 'flex', flexDirection: 'column', gap: 12,
                  cursor: 'pointer', transition: 'all 0.15s ease', position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; e.currentTarget.style.backgroundColor = '#0d1225'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25)', e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.backgroundColor = C.card; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {/* Header: Avatar, Name, Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.indigoLight, fontSize: 14, fontWeight: 900 }}>
                      {initial}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>{c.name}</h3>
                      <p style={{ margin: '1px 0 0', fontSize: 10, color: C.muted, fontWeight: 500 }}>
                        Joined {formatRelativeTime(c.created_at)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight style={{ width: 16, height: 16, color: '#1e293b' }} />
                </div>

                {/* Contact Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 2, marginTop: 4 }}>
                  {c.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
                      <Phone style={{ width: 12, height: 12, opacity: 0.7 }} />
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
                      <Mail style={{ width: 12, height: 12, opacity: 0.7 }} />
                      <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</span>
                    </div>
                  )}
                  {(!c.phone && !c.email) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
                      <span style={{ fontSize: 11, fontStyle: 'italic' }}>No contact info</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.03)', margin: '4px 0' }} />

                {/* Footer: Outstanding balance — prominent panel when due */}
                {hasCredit ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 10,
                    backgroundColor: `${C.rose}12`,
                    border: `1px solid ${C.rose}30`,
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 9, color: C.rose, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85 }}>
                        Outstanding Balance
                      </span>
                      <span style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>Owed to pharmacy</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: C.rose }}>
                      <IndianRupee style={{ width: 13, height: 13 }} />
                      <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-0.02em' }}>
                        {formatCurrency(c.outstanding_balance).replace('₹', '')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase' }}>Account Status</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, backgroundColor: `${C.emerald}10`, border: `1px solid ${C.emerald}15`, color: C.emerald }}>
                      <span style={{ fontSize: 11, fontWeight: 800 }}>Clear</span>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Customer Modal ── */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Directory Entry" maxWidth="sm">
        <div style={{ backgroundColor: '#0d1225', padding: '24px', borderRadius: 16 }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>Patient Name *</label>
              <div style={{ position: 'relative' }}>
                <Users style={{ position: 'absolute', left: 12, top: 10, width: 15, height: 15, color: '#475569' }} />
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. John Doe" autoFocus className={inCls} style={{ paddingLeft: 38 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone style={{ position: 'absolute', left: 12, top: 10, width: 14, height: 14, color: '#475569' }} />
                  <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" className={inCls} style={{ paddingLeft: 36 }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: 12, top: 10, width: 14, height: 14, color: '#475569' }} />
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="mail@example.com" className={inCls} style={{ paddingLeft: 36 }} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>Physical Address</label>
              <div style={{ position: 'relative' }}>
                <MapPin style={{ position: 'absolute', left: 12, top: 10, width: 14, height: 14, color: '#475569' }} />
                <textarea rows={2} value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Street, City, Area..." className={inCls} style={{ paddingLeft: 36, resize: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.cardBorder}` }}>
            <button onClick={() => setShowAdd(false)} style={{ padding: '10px 18px', background: 'none', border: 'none', color: C.muted, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
            <button
              onClick={handleAdd} disabled={saving || !newName.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${C.indigo},#4f46e5)`, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: (saving || !newName.trim()) ? 0.6 : 1 }}
            >
              {saving ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <ArrowRight style={{ width: 14, height: 14 }} />}
              {saving ? 'Saving...' : 'Create Account'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:0.8; } }
      `}</style>
    </div>
  );
}
