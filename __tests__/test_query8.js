require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPurchaseReturns() {
  console.log("Fetching purchase returns...");
  const { data, error } = await supabase
    .from('purchase_returns')
    .select(`
      id, return_number, return_date, total_amount, bill_number, supplier_id,
      suppliers(name),
      purchase_return_items(id)
    `)
    .limit(1);

  if (error) {
    console.error("Error fetching purchase returns:", error);
  } else {
    console.log("Success:", JSON.stringify(data, null, 2));
  }
}

async function testAnnualGstQuery() {
  console.log("Fetching annual GST purchase returns...");
  const { data, error } = await supabase
    .from('purchase_returns')
    .select(`
      id, return_date, total_amount,
      purchase_return_items(quantity, total_amount, purchase_items(gst_amount, total_amount))
    `)
    .limit(1);

  if (error) {
    console.error("Error fetching annual GST purchase returns:", error);
  } else {
    console.log("Success:", JSON.stringify(data, null, 2));
  }
}

async function main() {
  await testPurchaseReturns();
  await testAnnualGstQuery();
}

main();
