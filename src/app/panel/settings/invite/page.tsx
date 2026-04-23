'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePanelStore } from '@/store/panelStore';
import Link from 'next/link';
import { ArrowLeft, Loader2, Send, ShieldAlert, User, Mail, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const C = {
  bg: '#020617',
  card: '#0B1121',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc',
  muted: '#94a3b8',
  primary: '#3b82f6',
  inputBg: 'rgba(255,255,255,0.02)',
  inputHover: 'rgba(255,255,255,0.04)',
};

export default function InviteMemberPage() {
  const router = useRouter();
  const pharmacyId = usePanelStore(s => s.pharmacyId);
  const currentUser = usePanelStore(s => s.user);

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'store_manager' | 'cashier'>('cashier');

  // Verify access (only store_admin or super_admin can invite)
  if (currentUser && currentUser.role !== 'store_admin' && currentUser.role !== 'super_admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <ShieldAlert style={{ width: 48, height: 48, color: '#ef4444', marginBottom: 16 }} />
        <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Access Denied</h2>
        <p style={{ color: C.muted, margin: '0 0 24px' }}>You do not have permission to invite team members.</p>
        <button onClick={() => router.push('/panel/settings')} style={{ padding: '8px 16px', background: C.cardBorder, color: C.text, border: 'none', borderRadius: 8, cursor: 'pointer' }}>Go Back</button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacyId) return toast.error('Pharmacy ID not found');
    
    setLoading(true);
    try {
      const res = await fetch('/api/invite-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, role, pharmacyId })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to invite member');
      }
      
      toast.success('Invitation sent successfully!');
      router.push('/panel/settings');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: 20 }}>
      <Link href="/panel/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.muted, textDecoration: 'none', fontSize: 14, marginBottom: 24, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.muted}>
        <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Settings
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Invite Team Member</h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: C.muted }}>Send an invitation to join your pharmacy workspace.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: 14, top: 12, width: 16, height: 16, color: C.muted }} />
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Riya Singh" style={{ width: '100%', padding: '12px 16px 12px 40px', fontSize: 14, color: C.text, backgroundColor: C.inputBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, outline: 'none', transition: 'all 0.2s' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: 14, top: 12, width: 16, height: 16, color: C.muted }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="riya@example.com" style={{ width: '100%', padding: '12px 16px 12px 40px', fontSize: 14, color: C.text, backgroundColor: C.inputBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, outline: 'none', transition: 'all 0.2s' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Role</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div 
                onClick={() => setRole('store_manager')}
                style={{ padding: 16, border: `1px solid ${role === 'store_manager' ? C.primary : C.cardBorder}`, borderRadius: 10, backgroundColor: role === 'store_manager' ? 'rgba(59,130,246,0.1)' : C.inputBg, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Shield style={{ width: 16, height: 16, color: role === 'store_manager' ? C.primary : C.muted }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Manager</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: C.muted }}>Full access excluding billing and settings.</p>
              </div>

              <div 
                onClick={() => setRole('cashier')}
                style={{ padding: 16, border: `1px solid ${role === 'cashier' ? C.primary : C.cardBorder}`, borderRadius: 10, backgroundColor: role === 'cashier' ? 'rgba(59,130,246,0.1)' : C.inputBg, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <User style={{ width: 16, height: 16, color: role === 'cashier' ? C.primary : C.muted }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Cashier</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: C.muted }}>Limited to POS and sales history.</p>
              </div>
            </div>
          </div>

        </div>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${C.cardBorder}`, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, border: 'none', background: C.text, color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', opacity: loading ? 0.7 : 1, transition: 'transform 0.2s' }}>
            {loading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: 16, height: 16 }} />}
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
