const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oizndlroquzbqutdzwfp.supabase.co';
const supabaseKey = 'sb_publishable_UkS0EPjhw7PI85hUGrFDIw_rB_J68qd'; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('purchase_returns')
    .select(`
      id, return_number, return_date, total_amount, supplier_id, purchase_id,
      suppliers(name)
    `)
    .limit(1);

  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}

test();
