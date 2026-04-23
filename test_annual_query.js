const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Assuming we can read the env vars from .env.local
const envFile = fs.readFileSync('c:/Projects/APPLICATIONS/shelfcure/website/.env.local', 'utf-8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function test() {
  const pharmacyId = 'd2e245a1-7787-4340-96f3-85f769748b94'; // Need a real pharmacy ID
  const startYear = 2026;
  const fromDateStr = `${startYear}-04-01T00:00:00.000Z`;
  const toDateStr = `${startYear + 1}-03-31T23:59:59.999Z`;

  console.log('Fetching sales...');
  const { data, error } = await supabase
    .from('sales')
    .select(`
      id, bill_date, customer_id, customers(customer_type),
      sale_items(total_amount, gst_rate, quantity, unit_price, mrp)
    `)
    // .eq('pharmacy_id', pharmacyId)
    .gte('bill_date', fromDateStr)
    .lte('bill_date', toDateStr)
    .neq('status', 'Cancelled')
    .limit(10);

  console.log('Error:', error);
  console.log('Data count:', data ? data.length : 0);
}

test();
