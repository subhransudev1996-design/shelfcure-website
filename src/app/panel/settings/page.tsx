'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import toast from 'react-hot-toast';
import {
  Save, Loader2, User, Settings as SettingsIcon, Building2,
  Users, Phone, Mail, FileText, MapPin, Building, ShieldCheck, 
  Map, Fingerprint, Lock, Shield, CheckCircle2, AlertCircle, ChevronRight,
  MonitorSmartphone, Laptop, Smartphone, UserPlus
} from 'lucide-react';
import Link from 'next/link';

type SettingsTab = 'profile' | 'users' | 'security' | 'devices';

/* ─── Palette ─── */
const C = {
  bg: '#020617',          // Slate 950
  card: '#0B1121',        // Very dark blue
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#f8fafc', 
  muted: '#94a3b8',
  primary: '#3b82f6',     // Blue 500
  primaryHover: '#2563eb',// Blue 600
  emerald: '#10b981', 
  inputBg: 'rgba(255,255,255,0.02)',
  inputHover: 'rgba(255,255,255,0.04)',
};

export default function SettingsPage() {
  const supabase = createClient();
  const pharmacyId = usePanelStore((s) => s.pharmacyId);
  const setPharmacy = usePanelStore((s) => s.setPharmacy);

  const [tab, setTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeInput, setActiveInput] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const [users, setUsers] = useState<any[]>([]);

  const loadProfile = useCallback(async () => {
    if (!pharmacyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase.from('pharmacies').select('*').eq('id', pharmacyId).single();
      if (data) {
        setName(data.name || ''); setOwnerName(data.owner_name || '');
        setPhone(data.phone || ''); setEmail(data.email || '');
        setAddress(data.address || ''); setCity(data.city || '');
        setState(data.state || ''); setPincode(data.pincode || '');
        setGstin(data.gstin || ''); setLicenseNumber(data.license_number || '');
      }

      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, email, role, is_active, last_login_at')
        .eq('pharmacy_id', pharmacyId)
        .is('deleted_at', null);
      setUsers(usersData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, supabase]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pharmacies')
        .update({
          name: name.trim(), owner_name: ownerName.trim(), phone: phone.trim() || null, email: email.trim() || null,
          address: address.trim() || null, city: city.trim() || null, state: state.trim() || null,
          pincode: pincode.trim() || null, gstin: gstin.trim().toUpperCase() || null, license_number: licenseNumber.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pharmacyId!);

      if (error) throw error;
      setPharmacy(pharmacyId, name);
      toast.success('Workspace updated successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { key: 'profile' as const, label: 'General', icon: SettingsIcon },
    { key: 'users' as const, label: 'Team Members', icon: Users },
    { key: 'security' as const, label: 'Security & Auth', icon: Shield },
    { key: 'devices' as const, label: 'Sessions', icon: MonitorSmartphone },
  ];

  /* ─── Vercel/Linear Style Setting Row ─── */
  const SettingRow = ({ id, title, desc, icon: Icon, children, isLast = false }: any) => {
    const focused = activeInput === id;
    return (
      <div 
        style={{ 
          padding: '24px', 
          borderBottom: isLast ? 'none' : `1px solid ${C.cardBorder}`,
          backgroundColor: focused ? 'rgba(59,130,246,0.02)' : 'transparent',
          transition: 'background 0.3s ease',
          display: 'flex', gap: 40, alignItems: 'flex-start'
        }}
      >
        <div style={{ flex: '0 0 280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon style={{ width: 14, height: 14, color: C.text }} />
            </div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>{title}</h4>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.5, paddingLeft: 38 }}>{desc}</p>
        </div>
        <div style={{ flex: 1, maxWidth: 500 }} onFocus={() => setActiveInput(id)} onBlur={() => setActiveInput(null)}>
          {children}
        </div>
      </div>
    );
  };

  /* ─── Minimal Input Wrapper ─── */
  const MInput = ({ value, onChange, placeholder, type="text", maxLength }: any) => {
    return (
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength}
        style={{
          width: '100%', padding: '12px 16px', fontSize: 14, color: C.text,
          backgroundColor: C.inputBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10,
          outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit'
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.inputHover}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.inputBg}
        onFocus={e => { e.currentTarget.style.backgroundColor = C.inputBg; e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(59,130,246,0.15)`; }}
        onBlur={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}
      />
    );
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Loader2 style={{ width: 28, height: 28, color: C.primary, animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', marginTop: -10 }}>
      {/* ── Page Header ── */}
      <div style={{ paddingBottom: 24, borderBottom: `1px solid ${C.cardBorder}`, marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Workspace Settings</h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: C.muted }}>Manage your pharmacy profile, team members, and billing operations.</p>
      </div>

      <div style={{ display: 'flex', gap: 48, flex: 1, minHeight: 0 }}>
        {/* ── Left Sidebar Nav ── */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: 'none',
                backgroundColor: tab === t.key ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: tab === t.key ? C.text : C.muted,
                fontSize: 14, fontWeight: tab === t.key ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left',
              }}
              onMouseEnter={e => { if (tab !== t.key) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#e2e8f0'; } }}
              onMouseLeave={e => { if (tab !== t.key) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.muted; } }}
            >
              <t.icon style={{ width: 16, height: 16, color: tab === t.key ? C.text : C.muted, opacity: tab === t.key ? 1 : 0.7 }} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Right Content Area ── */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 10, paddingBottom: 100 }}>
          
          {/* GENERAL TAB */}
          {tab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>General Information</h2>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: C.muted }}>Information representing your business on challans and invoices.</p>
              </div>

              <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
                <SettingRow id="name" title="Pharmacy Name *" desc="The official name of your store." icon={Building}>
                  <MInput value={name} onChange={(e:any) => setName(e.target.value)} placeholder="Apex Health Pharmacy" />
                </SettingRow>

                <SettingRow id="owner" title="Owner Name" desc="Name of the proprietor." icon={User}>
                  <MInput value={ownerName} onChange={(e:any) => setOwnerName(e.target.value)} placeholder="Rahul Sharma" />
                </SettingRow>

                <SettingRow id="contact" title="Contact Details" desc="Primary phone number and support email." icon={Phone}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                       <Phone style={{ position: 'absolute', left: 12, top: 12, width: 14, height: 14, color: C.muted }} />
                       <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Phone" style={{ width: '100%', padding: '12px 16px 12px 36px', fontSize: 14, color: C.text, backgroundColor: C.inputBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit' }} onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(59,130,246,0.15)`; }} onBlur={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none'; }} />
                    </div>
                    <div style={{ position: 'relative' }}>
                       <Mail style={{ position: 'absolute', left: 12, top: 12, width: 14, height: 14, color: C.muted }} />
                       <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" style={{ width: '100%', padding: '12px 16px 12px 36px', fontSize: 14, color: C.text, backgroundColor: C.inputBg, border: `1px solid ${C.cardBorder}`, borderRadius: 10, outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit' }} onFocus={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(59,130,246,0.15)`; }} onBlur={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = 'none'; }} />
                    </div>
                  </div>
                </SettingRow>

                <SettingRow id="legal" title="Tax & Legal" desc="GST registration and Official Drug License number." icon={ShieldCheck}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <MInput value={gstin} onChange={(e:any) => setGstin(e.target.value.toUpperCase())} placeholder="GSTIN" maxLength={15} />
                    <MInput value={licenseNumber} onChange={(e:any) => setLicenseNumber(e.target.value.toUpperCase())} placeholder="License No." />
                  </div>
                </SettingRow>

                <SettingRow id="addr" title="Location" desc="Registered address of the pharmacy." icon={MapPin} isLast>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <MInput value={address} onChange={(e:any) => setAddress(e.target.value)} placeholder="Building, Street, Landmark" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <MInput value={city} onChange={(e:any) => setCity(e.target.value)} placeholder="City" />
                      <MInput value={state} onChange={(e:any) => setState(e.target.value)} placeholder="State" />
                      <MInput value={pincode} onChange={(e:any) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="PIN Code" />
                    </div>
                  </div>
                </SettingRow>
              </div>

              {/* Sticky Action Footer */}
              <div style={{ 
                marginTop: 40, padding: 24, backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>Ready to commit changes?</h4>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>Unsaved modifications will be lost.</p>
                </div>
                <button
                  onClick={saveProfile} disabled={saving || !name.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, border: 'none',
                    background: C.text, color: '#000', fontSize: 14, fontWeight: 800,
                    cursor: 'pointer', transition: 'all 0.2s', opacity: (saving || !name.trim()) ? 0.6 : 1
                  }}
                  onMouseEnter={e => { if(!saving && name.trim()){ e.currentTarget.style.transform = 'scale(1.02)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {saving ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 16, height: 16 }} />}
                  {saving ? 'Applying...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}

          {/* TEAM MEMBERS TAB */}
          {tab === 'users' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>Team Members</h2>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: C.muted }}>Manage users who have access to this workspace.</p>
                </div>
                <Link href="/panel/settings/invite" style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8,
                  backgroundColor: C.primary, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  transition: 'background-color 0.2s', border: 'none', cursor: 'pointer'
                }}>
                  <UserPlus style={{ width: 16, height: 16 }} />
                  Invite Member
                </Link>
              </div>

              <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Details</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 10 }}>Role</span>
                </div>
                
                {users.length === 0 ? (
                  <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                     <AlertCircle style={{ width: 32, height: 32, color: C.muted, margin: '0 auto 12px' }} />
                     <p style={{ margin: 0, fontSize: 14, color: C.muted }}>No team members assigned.</p>
                  </div>
                ) : (
                  <div>
                    {users.map((u, idx) => (
                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: idx < users.length -1 ? `1px solid ${C.cardBorder}`: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                           <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, fontSize: 14, fontWeight: 800 }}>
                              {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                           </div>
                           <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                 <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>{u.full_name || 'Unnamed User'}</p>
                                 {u.is_active && (
                                    <span style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: C.emerald, padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>Active</span>
                                 )}
                              </div>
                              <p style={{ margin: '2px 0 0', fontSize: 13, color: C.muted }}>{u.email}</p>
                           </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                           <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textTransform: 'capitalize' }}>{u.role}</span>
                           <ChevronRight style={{ width: 16, height: 16, color: C.muted }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECURITY & AUTH */}
          {tab === 'security' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>Security & Auth</h2>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: C.muted }}>Protect your workspace with additional security layers.</p>
              </div>
              <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, overflow: 'hidden' }}>
                 <SettingRow id="2fa" title="Two-Factor Authentication" desc="Require a code from an authenticator app when logging in." icon={Fingerprint} isLast>
                   <button disabled style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'not-allowed' }}>Enable (Coming Soon)</button>
                 </SettingRow>
              </div>
            </div>
          )}

          {/* SESSIONS */}
          {tab === 'devices' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div style={{ marginBottom: 32 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>Active Sessions</h2>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: C.muted }}>Devices currently logged into this workspace.</p>
              </div>
               <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '32px 40px', textAlign: 'center' }}>
                  <Laptop style={{ width: 40, height: 40, color: C.muted, margin: '0 auto 16px' }} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>This Device</h3>
                  <p style={{ margin: '6px 0 0', fontSize: 14, color: C.muted }}>Current session on local network</p>
                  <p style={{ margin: '16px 0 0', fontSize: 12, color: C.emerald, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <CheckCircle2 style={{ width: 14, height: 14 }} /> Verified secure session
                  </p>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        /* Webkit Overrides for autofill */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
          -webkit-box-shadow: 0 0 0 30px #0f172a inset !important;
          -webkit-text-fill-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}
