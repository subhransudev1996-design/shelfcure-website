const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  console.log("Fetching sales...");
  const { data: salesData, error: salesErr } = await supabase
    .from('sales')
    .select(`
      id, bill_date, customer_id, customers(name),
      sale_items(total_amount, gst_rate, quantity, unit_price, mrp)
    `)
    .limit(10);
  
  if (salesErr) console.error("Sales Error:", salesErr);
  else console.log("Sales Data length:", salesData?.length);

  console.log("Fetching purchases...");
  const { data: purchasesData, error: purErr } = await supabase
    .from('purchases')
    .select(`
      id, bill_date,
      purchase_items(total_amount, gst_amount, quantity, purchase_price)
    `)
    .limit(10);
  if (purErr) console.error("Purchases Error:", purErr);
  else console.log("Purchases Data length:", purchasesData?.length);

  console.log("Fetching sale returns...");
  const { data: srData, error: srErr } = await supabase
    .from('sale_returns')
    .select(`
      id, return_date, refund_amount,
      sale_return_items(quantity, refund_amount, sale_items(gst_rate))
    `)
    .limit(10);
  if (srErr) console.error("SR Error:", srErr);
  else console.log("SR Data length:", srData?.length);

  console.log("Fetching purchase returns...");
  const { data: prData, error: prErr } = await supabase
    .from('purchase_returns')
    .select(`
      id, return_date, total_amount,
      purchase_return_items(quantity, total_amount, purchase_items(gst_amount, total_amount))
    `)
    .limit(10);
  if (prErr) console.error("PR Error:", prErr);
  else console.log("PR Data length:", prData?.length);
}

test();
