import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const pharmacyId = 'd8272ea6-6de5-45dc-a6ec-b67ff92ca354'; // Or fetch one
  const { data: users } = await supabase.from('users').select('pharmacy_id').limit(1);
  const pId = users?.[0]?.pharmacy_id;
  console.log('Pharmacy ID:', pId);

  if (!pId) return;

  const now = new Date();
  const expiryCutoff = new Date(now.getTime() + 90 * 86400000).toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];

  const res1 = await supabase.from('batches').select('id', { count: 'exact', head: true }).eq('pharmacy_id', pId).lt('stock_quantity', 10).gt('stock_quantity', 0);
  console.log('Low stock:', res1);

  const res2 = await supabase.from('batches').select('id', { count: 'exact', head: true }).eq('pharmacy_id', pId).lte('expiry_date', expiryCutoff).gte('expiry_date', today);
  console.log('Expiry soon:', res2);

  const res3 = await supabase.from('batches').select('id', { count: 'exact', head: true }).eq('pharmacy_id', pId).lt('expiry_date', today);
  console.log('Expired:', res3);
}

test().catch(console.error);
