// Quick test to verify Supabase auth works with the publishable key
import { createClient } from '@supabase/supabase-js';

const url = 'https://oizndlroquzbqutdzwfp.supabase.co';
const key = 'sb_publishable_UkS0EPjhw7PI85hUGrFDIw_rB_J68qd';

const supabase = createClient(url, key);

console.log('Testing Supabase connection...');
console.log('URL:', url);
console.log('Key type:', key.startsWith('eyJ') ? 'JWT (anon key)' : 'Publishable key');

// Test 1: Check if getSession works at all
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
console.log('\n--- getSession() ---');
console.log('Session:', sessionData?.session ? 'EXISTS' : 'NULL');
console.log('Error:', sessionError?.message ?? 'none');

// Test 2: Try a login with test creds (will fail but shows if API is reachable)
const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  email: 'test@test.com',
  password: 'wrongpassword123',
});
console.log('\n--- signInWithPassword (test@test.com, wrong password) ---');
console.log('Response:', signInData?.session ? 'GOT SESSION' : 'NO SESSION');
console.log('Error:', signInError?.message ?? 'none');
console.log('Error status:', signInError?.status ?? 'n/a');

// Test 3: Check if we can query the database
const { data: tableData, error: tableError } = await supabase.from('pharmacies').select('id').limit(1);
console.log('\n--- Database query (pharmacies) ---');
console.log('Data:', tableData);
console.log('Error:', tableError?.message ?? 'none');

console.log('\nDone.');
