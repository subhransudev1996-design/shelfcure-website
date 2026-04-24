const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oizndlroquzbqutdzwfp.supabase.co';
const supabaseKey = 'sb_publishable_UkS0EPjhw7PI85hUGrFDIw_rB_J68qd'; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .rpc('get_foreign_keys', {}); // or just fetch from information_schema via a raw query if we had pg, but we only have supabase-js.

  // Instead, let's just do a select with an invalid column to force an error that lists valid columns.
  const { error: err } = await supabase.from('purchase_returns').select('this_does_not_exist').limit(1);
  console.log('Error:', err);
}

test();
