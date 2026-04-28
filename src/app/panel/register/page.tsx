'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTypewriter } from '@/components/HeroSection';
import {
  Eye, EyeOff, UserPlus, AlertCircle, Loader2,
  Building, ArrowRight, ArrowLeft, Check, ShieldCheck, Zap, Clock
} from 'lucide-react';

type Step = 'account' | 'pharmacy';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.875rem 1rem',
  background: '#fff', border: '1.5px solid #e2e8f0',
  borderRadius: '0.875rem', color: '#0f172a',
  fontSize: '0.875rem', fontWeight: 500,
  outline: 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: '#475569', marginBottom: '0.5rem',
};

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputStyle, ...(props.style || {}) }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#6366f1';
        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1)';
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#e2e8f0';
        e.currentTarget.style.boxShadow = 'none';
        props.onBlur?.(e);
      }}
    />
  );
}

export default function PanelRegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const displayText = useTypewriter(['The Smart Way.', 'In 2 Minutes.', 'With Confidence.'], 80, 2000, 40);

  const [step, setStep] = useState<Step>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  function friendlyError(msg: string): string {
    if (msg.includes('For security purposes') || msg.includes('security purposes')) {
      const match = msg.match(/after (\d+) seconds?/i);
      const secs = match ? match[1] : 'a few';
      return `Too many attempts. Please wait ${secs} seconds before trying again.`;
    }
    if (msg.toLowerCase().includes('user already registered') || msg.toLowerCase().includes('already been registered'))
      return 'An account with this email already exists. Try signing in instead.';
    if (msg.includes('rate limit') || msg.includes('429'))
      return 'Too many sign-up attempts. Please wait a few minutes and try again.';
    return msg;
  }

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [pharmacyName, setPharmacyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [gstin, setGstin] = useState('');

  const handleAccountNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setStep('pharmacy');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: fullName } },
      });
      if (authError) { setError(friendlyError(authError.message)); return; }
      if (!authData.user) { setError('Failed to create account'); return; }

      // Stash the pharmacy form data so the panel layout can apply it to
      // the pharmacies row that gets auto-created on first authenticated load.
      // Without this, only `name` and `owner_name` get populated and the
      // Settings page shows blank email/phone/address.
      try {
        localStorage.setItem('shelfcure-pending-pharmacy', JSON.stringify({
          email,
          fullName,
          pharmacyName, phone, address, city, state, pincode,
          licenseNumber, gstin,
        }));
      } catch {}

      // Email confirmation required — no active session yet.
      // DB inserts need an authenticated session (RLS), so we skip them
      // and show a "check your email" screen. The inserts will happen
      // after the user confirms and lands back on the panel.
      if (!authData.session) {
        setEmailSent(true);
        return;
      }

      const { data: pharmacy, error: pharmacyError } = await supabase
        .from('pharmacies')
        .insert({
          name: pharmacyName, owner_name: fullName, phone, email,
          address: address || 'N/A', city: city || 'N/A', state: state || 'N/A',
          pincode: pincode || '000000', license_number: licenseNumber || 'PENDING',
          gstin: gstin || '000000000000000', subscription_status: 'trial',
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id')
        .single();

      if (pharmacyError) { setError('Account created but pharmacy setup failed: ' + pharmacyError.message); return; }

      const { error: userError } = await supabase.from('users').insert({
        pharmacy_id: pharmacy.id, auth_user_id: authData.user.id,
        full_name: fullName, email, role: 'store_admin', is_active: true,
      });

      if (userError) { setError('Account setup incomplete: ' + userError.message); return; }

      router.push('/panel');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? friendlyError(err.message) : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Hero Section ── */}
      <section style={{
        background: 'linear-gradient(180deg, #0c0a1f 0%, #110e2e 50%, #1a1640 100%)',
        padding: '7rem 2rem 5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        color: 'white',
      }}>
        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Orbs */}
        <div className="animate-float" style={{
          position: 'absolute', top: '15%', right: '8%',
          width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <div className="animate-float" style={{
          position: 'absolute', bottom: '10%', left: '5%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
          animationDelay: '3s',
        }} />
        <div className="animate-pulse-glow" style={{
          position: 'absolute', top: '35%', left: '20%',
          width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8',
        }} />
        <div className="animate-pulse-glow" style={{
          position: 'absolute', top: '28%', right: '25%',
          width: '4px', height: '4px', borderRadius: '50%', background: '#c4b5fd',
          animationDelay: '1.5s',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
            <Image
              src="/logo.png"
              alt="ShelfCure"
              width={100}
              height={33}
              style={{
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto',
                filter: 'brightness(0) invert(1)',
                opacity: 0.95,
              }}
              priority
            />
          </div>

          {/* Badge */}
          <div className="animate-fade-in-up delay-100" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 1rem',
            background: 'rgba(99,102,241,0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '9999px',
            marginBottom: '1.75rem',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 12px #818cf8', display: 'inline-block' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              30-Day Free Trial • No Credit Card Required
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up delay-200" style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800, color: 'white',
            letterSpacing: '-0.03em',
            fontFamily: 'var(--font-display)',
            lineHeight: 1.12,
            marginBottom: '1rem',
          }}>
            Start Managing Your Pharmacy<br />
            <span style={{
              background: 'linear-gradient(135deg, #818cf8, #c7d2fe, #a78bfa)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient-shift 4s ease-in-out infinite',
            }}>
              {displayText}
              <span style={{
                display: 'inline-block', width: '3px', height: '1em',
                background: '#818cf8', marginLeft: '4px',
                animation: 'blink 1s step-end infinite',
                verticalAlign: 'text-bottom',
              }} />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up delay-300" style={{
            fontSize: '1.125rem', color: 'rgba(148,163,184,0.9)',
            maxWidth: '560px', margin: '0 auto 2.75rem',
            lineHeight: 1.65, fontWeight: 400,
          }}>
            Join 500+ pharmacies already using ShelfCure for billing, inventory, GST compliance, and AI-powered insights.
          </p>

          {/* Trust stats */}
          <div className="animate-fade-in-up delay-400" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '3rem', flexWrap: 'wrap',
          }}>
            {[
              { Icon: Clock, value: '2 min', label: 'Setup Time' },
              { Icon: Zap, value: 'All 7', label: 'Modules Included' },
              { Icon: ShieldCheck, value: 'GST', label: 'Compliant & Secure' },
            ].map(({ Icon, value, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: '2.25rem', height: '2.25rem',
                  borderRadius: '0.625rem',
                  background: 'rgba(129,140,248,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={14} style={{ color: '#818cf8' }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(148,163,184,0.7)', fontWeight: 500, marginTop: '0.15rem' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form Section ── */}
      <section style={{
        background: '#f1f5f9',
        padding: '4rem 1rem 5rem',
      }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>

          {/* ── Email Sent Screen ── */}
          {emailSent && (
            <div className="animate-fade-in-up" style={{
              background: '#fff', borderRadius: '1.75rem', padding: '3rem 2.5rem',
              boxShadow: '0 20px 60px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.04)',
              border: '1px solid rgba(0,0,0,0.05)', textAlign: 'center',
            }}>
              <div style={{
                width: '4.5rem', height: '4.5rem', borderRadius: '1.25rem',
                background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
                Check your inbox
              </h2>
              <p style={{ fontSize: '0.9375rem', color: '#64748b', lineHeight: 1.65, marginBottom: '0.5rem' }}>
                We sent a confirmation link to
              </p>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#6366f1', marginBottom: '1.75rem' }}>{email}</p>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>
                Click the link in the email to verify your account. Once confirmed, sign in below to complete your pharmacy setup.
              </p>
              <Link href="/panel/login" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                width: '100%', padding: '0.9rem',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                border: 'none', borderRadius: '0.875rem',
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
              }}>
                Go to Sign In
              </Link>
            </div>
          )}

          {/* Step indicator */}
          {!emailSent && (<>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            {[
              { id: 'account' as Step, label: 'Account', Icon: UserPlus },
              { id: 'pharmacy' as Step, label: 'Pharmacy', Icon: Building },
            ].map((s, i) => {
              const isActive = step === s.id;
              const isDone = step === 'pharmacy' && s.id === 'account';
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {i > 0 && (
                    <div style={{
                      width: '2rem', height: '2px',
                      background: step === 'pharmacy' ? '#6366f1' : '#e2e8f0',
                      transition: 'background 0.3s ease',
                    }} />
                  )}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1rem', borderRadius: '0.75rem',
                    fontSize: '0.75rem', fontWeight: 700,
                    border: `1px solid ${isDone ? '#a7f3d0' : isActive ? '#c7d2fe' : '#e2e8f0'}`,
                    background: isDone ? '#ecfdf5' : isActive ? '#eef2ff' : '#fff',
                    color: isDone ? '#059669' : isActive ? '#6366f1' : '#94a3b8',
                    boxShadow: (isActive || isDone) ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.3s ease',
                  }}>
                    {isDone ? <Check size={14} /> : <s.Icon size={14} />}
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card */}
          <div style={{
            background: '#fff', borderRadius: '1.75rem', padding: '2.5rem',
            boxShadow: '0 20px 60px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.04)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}>
            <h2 style={{
              fontSize: '1.25rem', fontWeight: 800, color: '#0f172a',
              fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
              marginBottom: '0.25rem',
            }}>
              {step === 'account' ? 'Create your account' : 'Set up your pharmacy'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 400, marginBottom: '1.75rem' }}>
              {step === 'account'
                ? 'Start with your personal details'
                : 'Almost done — just a few pharmacy details'}
            </p>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '0.875rem', padding: '0.875rem 1rem', marginBottom: '1.5rem',
              }}>
                <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                <p style={{ fontSize: '0.875rem', color: '#b91c1c', fontWeight: 500, margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Step 1: Account */}
            {step === 'account' && (
              <form onSubmit={handleAccountNext} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <StyledInput type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus placeholder="Dr. Rajesh Kumar" />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <StyledInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@pharmacy.com" />
                </div>
                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <StyledInput type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" style={{ paddingRight: '3rem' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                      padding: '0.5rem', border: 'none', background: 'transparent',
                      cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center',
                    }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.375rem', fontWeight: 500 }}>Minimum 6 characters</p>
                </div>
                <div style={{ paddingTop: '0.5rem' }}>
                  <button type="submit" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    width: '100%', padding: '0.9rem',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff',
                    fontWeight: 700, fontSize: '0.95rem', border: 'none', borderRadius: '0.875rem',
                    cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
                    transition: 'transform 0.2s ease',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Pharmacy */}
            {step === 'pharmacy' && (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Pharmacy Name *</label>
                    <StyledInput type="text" value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} required autoFocus placeholder="City Pharmacy" />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone *</label>
                    <StyledInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} required placeholder="9876543210" />
                  </div>
                  <div>
                    <label style={labelStyle}>State *</label>
                    <StyledInput type="text" value={state} onChange={(e) => setState(e.target.value)} required placeholder="Maharashtra" />
                  </div>
                  <div>
                    <label style={labelStyle}>City</label>
                    <StyledInput type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" />
                  </div>
                  <div>
                    <label style={labelStyle}>Pincode</label>
                    <StyledInput type="text" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="400001" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Address</label>
                    <StyledInput type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Health Ave, Medical District" />
                  </div>
                  <div>
                    <label style={labelStyle}>Drug License No.</label>
                    <StyledInput type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="DL-123456" />
                  </div>
                  <div>
                    <label style={labelStyle}>GSTIN</label>
                    <StyledInput type="text" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="27AABCU9603R1ZX" maxLength={15} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
                  <button type="button" onClick={() => setStep('account')} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    flex: 1, padding: '0.9rem',
                    background: '#fff', border: '1.5px solid #e2e8f0', color: '#475569',
                    fontWeight: 700, fontSize: '0.875rem', borderRadius: '0.875rem',
                    cursor: 'pointer', transition: 'background 0.2s ease',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button type="submit" disabled={loading} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    flex: 2, padding: '0.9rem',
                    background: loading ? 'rgba(99,102,241,0.7)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                    border: 'none', borderRadius: '0.875rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
                    transition: 'opacity 0.2s ease',
                  }}>
                    {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={16} />}
                    {loading ? 'Creating...' : 'Create Pharmacy'}
                  </button>
                </div>
              </form>
            )}

            <div style={{
              marginTop: '2rem', paddingTop: '1.5rem',
              borderTop: '1px solid #f1f5f9', textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                Already have an account?{' '}
                <Link href="/panel/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
                  Sign in
                </Link>
              </p>
            </div>
          </div>
          </>)}

          <p style={{
            textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8',
            marginTop: '1.75rem', fontWeight: 500,
          }}>
            Powered by ShelfCure • Smart Pharmacy. Simple Care.
          </p>
        </div>
      </section>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </>
  );
}
