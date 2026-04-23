require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnnualQueries() {
  const pharmacyId = '04e0e5eb-1875-4c07-bde1-12fec92243e8'; // let's try to query without it first, or limit 1

  console.log("1. Fetching Sales...");
  const { data: salesData, error: salesErr } = await supabase
    .from('sales')
    .select(`
      id, bill_date, customer_id, customers(customer_type),
      sale_items(total_amount, gst_rate, quantity, unit_price, mrp)
    `)
    .limit(1);

  if (salesErr) console.error("Sales Error:", salesErr);
  else console.log("Sales OK");

  console.log("2. Fetching Purchases...");
  const { data: purchasesData, error: purErr } = await supabase
    .from('purchases')
    .select(`
      id, bill_date,
      purchase_items(total_amount, gst_amount, quantity, purchase_price)
    `)
    .limit(1);

  if (purErr) console.error("Purchases Error:", purErr);
  else console.log("Purchases OK");

  console.log("3. Fetching Sale Returns...");
  const { data: srData, error: srErr } = await supabase
    .from('sale_returns')
    .select(`
      id, return_date, refund_amount,
      sale_return_items(quantity, refund_amount, sale_items(gst_rate))
    `)
    .limit(1);

  if (srErr) console.error("Sale Returns Error:", srErr);
  else console.log("Sale Returns OK");

  console.log("4. Fetching Purchase Returns...");
  const { data: prData, error: prErr } = await supabase
    .from('purchase_returns')
    .select(`
      id, return_date, total_amount,
      purchase_return_items(quantity, total_amount, purchase_items(gst_amount, total_amount))
    `)
    .limit(1);

  if (prErr) console.error("Purchase Returns Error:", prErr);
  else console.log("Purchase Returns OK");
}

testAnnualQueries();
