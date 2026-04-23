'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function friendlyError(msg: string): string {
    if (msg.includes('For security purposes') || msg.includes('security purposes')) {
      const match = msg.match(/after (\d+) seconds?/i);
      const secs = match ? match[1] : 'a few';
      return `Too many attempts. Please wait ${secs} seconds before trying again.`;
    }
    if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid email or password'))
      return 'Incorrect email or password. Please try again.';
    if (msg.includes('rate limit') || msg.includes('429'))
      return 'Too many requests. Please wait a minute and try again.';
    return msg;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (authError || !authData.user) {
        setError(friendlyError(authError?.message || 'Login failed'));
        setLoading(false);
        return;
      }

      // Check if super admin
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('auth_user_id', authData.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (superAdmin) {
        window.location.href = '/admin';
      } else {
        // Log them out and show error if they are not a super admin
        await supabase.auth.signOut();
        setError('Access denied. Super Admin privileges required.');
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? friendlyError(err.message) : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#020617', // Dark slate bg
      backgroundImage: 'radial-gradient(ellipse at top, rgba(99,102,241,0.1) 0%, transparent 60%)',
      fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#0f172a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 24,
        padding: '2.5rem 2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #818cf8, transparent)'
        }} />

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 48,
            height: 48,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 16px rgba(99,102,241,0.25)'
          }}>
            <Image src="/pill-logo.svg" alt="ShelfCure Admin" width={28} height={28} style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#f8fafc',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.02em'
          }}>
            ShelfCure <span style={{ color: '#818cf8' }}>Admin</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
            Restricted access portal
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '1.5rem',
          }}>
            <AlertCircle color="#ef4444" size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span style={{ color: '#fca5a5', fontSize: '0.875rem', lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#e2e8f0', marginLeft: '0.25rem' }}>
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@shelfcure.com"
              style={{
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#f8fafc',
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#818cf8'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#e2e8f0', marginLeft: '0.25rem' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#f8fafc',
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#818cf8'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              padding: '0.875rem',
              borderRadius: '12px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer',
              opacity: (loading || !email || !password) ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s, transform 0.1s',
            }}
            onMouseDown={e => { if (!(loading || !email || !password)) e.currentTarget.style.transform = 'scale(0.98)'; }}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Sign In to Admin
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
