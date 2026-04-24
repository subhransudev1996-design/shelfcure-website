'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthDebugPage() {
  const [results, setResults] = useState<string>('Running diagnostics...');

  useEffect(() => {
    async function diagnose() {
      const lines: string[] = [];
      const supabase = createClient();

      // 1. Check environment variables
      lines.push('=== ENV VARS ===');
      lines.push(`SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'MISSING!'}`);
      lines.push(`SUPABASE_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.substring(0, 20) + '...' : 'MISSING!'}`);
      lines.push('');

      // 2. Check cookies
      lines.push('=== COOKIES ===');
      const cookies = document.cookie.split(';').map(c => c.trim()).filter(Boolean);
      if (cookies.length === 0) {
        lines.push('NO COOKIES FOUND');
      } else {
        cookies.forEach(c => {
          const name = c.split('=')[0];
          const value = c.split('=').slice(1).join('=');
          lines.push(`${name} = ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
        });
      }
      lines.push('');

      // 3. Check getSession
      lines.push('=== getSession() ===');
      try {
        const { data, error } = await supabase.auth.getSession();
        lines.push(`session: ${data.session ? 'EXISTS' : 'NULL'}`);
        if (data.session) {
          lines.push(`user.id: ${data.session.user?.id}`);
          lines.push(`user.email: ${data.session.user?.email}`);
          lines.push(`expires_at: ${data.session.expires_at}`);
          lines.push(`access_token: ${data.session.access_token?.substring(0, 30)}...`);
        }
        if (error) lines.push(`ERROR: ${error.message}`);
      } catch (e) {
        lines.push(`CATCH ERROR: ${e}`);
      }
      lines.push('');

      // 4. Check getUser
      lines.push('=== getUser() ===');
      try {
        const { data, error } = await supabase.auth.getUser();
        lines.push(`user: ${data.user ? 'EXISTS' : 'NULL'}`);
        if (data.user) {
          lines.push(`user.id: ${data.user.id}`);
          lines.push(`user.email: ${data.user.email}`);
        }
        if (error) lines.push(`ERROR: ${error.message}`);
      } catch (e) {
        lines.push(`CATCH ERROR: ${e}`);
      }
      lines.push('');

      // 5. Query users table (same query as layout)
      lines.push('=== USERS TABLE QUERY ===');
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: userRecord, error: userError } = await supabase
            .from('users')
            .select('id, auth_user_id, full_name, email, role, is_active, pharmacy_id')
            .eq('auth_user_id', currentUser.id)
            .eq('is_active', true)
            .maybeSingle();
          
          lines.push(`userRecord: ${userRecord ? 'FOUND' : 'NULL'}`);
          if (userRecord) {
            lines.push(`  id: ${userRecord.id}`);
            lines.push(`  full_name: ${userRecord.full_name}`);
            lines.push(`  email: ${userRecord.email}`);
            lines.push(`  role: ${userRecord.role}`);
            lines.push(`  is_active: ${userRecord.is_active}`);
            lines.push(`  pharmacy_id: ${userRecord.pharmacy_id}`);
          }
          if (userError) lines.push(`ERROR: ${userError.message}`);

          // Also try without is_active filter
          const { data: userRecord2, error: userError2 } = await supabase
            .from('users')
            .select('id, auth_user_id, full_name, email, role, is_active, pharmacy_id')
            .eq('auth_user_id', currentUser.id)
            .maybeSingle();
          
          lines.push('');
          lines.push('=== USERS QUERY (without is_active filter) ===');
          lines.push(`userRecord: ${userRecord2 ? 'FOUND' : 'NULL'}`);
          if (userRecord2) {
            lines.push(`  is_active: ${userRecord2.is_active}`);
          }
          if (userError2) lines.push(`ERROR: ${userError2.message}`);

          // Also try pharmacies table
          if (userRecord?.pharmacy_id) {
            const { data: pharmacy, error: pharmError } = await supabase
              .from('pharmacies')
              .select('id, name')
              .eq('id', userRecord.pharmacy_id)
              .maybeSingle();
            
            lines.push('');
            lines.push('=== PHARMACIES QUERY ===');
            lines.push(`pharmacy: ${pharmacy ? 'FOUND' : 'NULL'}`);
            if (pharmacy) {
              lines.push(`  name: ${pharmacy.name}`);
            }
            if (pharmError) lines.push(`ERROR: ${pharmError.message}`);
          }
        } else {
          lines.push('Skipped — no authenticated user');
        }
      } catch (e) {
        lines.push(`CATCH ERROR: ${e}`);
      }
      lines.push('');

      // 6. Test login
      lines.push('=== signInWithPassword TEST (test@test.com) ===');
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'test@test.com',
          password: 'wrongpassword',
        });
        lines.push(`session: ${data.session ? 'EXISTS' : 'NULL'}`);
        if (error) lines.push(`ERROR (expected): ${error.message}`);
      } catch (e) {
        lines.push(`CATCH ERROR: ${e}`);
      }

      setResults(lines.join('\n'));
    }

    diagnose();
  }, []);

  // Test with real credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginResult, setLoginResult] = useState('');

  const testLogin = async () => {
    const supabase = createClient();
    setLoginResult('Logging in...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      const lines: string[] = [];
      lines.push('=== LOGIN RESULT ===');
      if (error) {
        lines.push(`ERROR: ${error.message}`);
      } else {
        lines.push(`session: ${data.session ? 'EXISTS' : 'NULL'}`);
        if (data.session) {
          lines.push(`user.id: ${data.session.user?.id}`);
          lines.push(`user.email: ${data.session.user?.email}`);
          lines.push(`access_token: ${data.session.access_token?.substring(0, 30)}...`);
        }
      }
      lines.push('');

      // Check cookies after login
      lines.push('=== COOKIES AFTER LOGIN ===');
      const cookies = document.cookie.split(';').map(c => c.trim()).filter(Boolean);
      if (cookies.length === 0) {
        lines.push('NO COOKIES FOUND!');
      } else {
        cookies.forEach(c => {
          const name = c.split('=')[0];
          const value = c.split('=').slice(1).join('=');
          lines.push(`${name} = ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
        });
      }
      lines.push('');

      // Check getSession after login
      lines.push('=== getSession() AFTER LOGIN ===');
      const { data: sessData, error: sessError } = await supabase.auth.getSession();
      lines.push(`session: ${sessData.session ? 'EXISTS' : 'NULL'}`);
      if (sessData.session) {
        lines.push(`user.email: ${sessData.session.user?.email}`);
      }
      if (sessError) lines.push(`ERROR: ${sessError.message}`);
      lines.push('');

      // Check getUser after login
      lines.push('=== getUser() AFTER LOGIN ===');
      const { data: userData, error: userError } = await supabase.auth.getUser();
      lines.push(`user: ${userData.user ? 'EXISTS' : 'NULL'}`);
      if (userData.user) {
        lines.push(`user.email: ${userData.user.email}`);
      }
      if (userError) lines.push(`ERROR: ${userError.message}`);

      setLoginResult(lines.join('\n'));
    } catch (e) {
      setLoginResult(`CATCH ERROR: ${e}`);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#0f172a', color: '#e2e8f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#818cf8', marginBottom: '1rem' }}>Auth Debug Page</h1>
      
      <h2 style={{ color: '#94a3b8' }}>Initial State:</h2>
      <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>
        {results}
      </pre>

      <h2 style={{ color: '#94a3b8' }}>Test Login:</h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '0.5rem', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '4px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '0.5rem', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '4px' }}
        />
        <button
          onClick={testLogin}
          style={{ padding: '0.5rem 1rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Test Login
        </button>
      </div>

      {loginResult && (
        <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
          {loginResult}
        </pre>
      )}
    </div>
  );
}
