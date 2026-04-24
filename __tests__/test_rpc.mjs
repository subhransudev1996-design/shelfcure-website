import { createClient } from '@supabase/supabase-js';

const url = 'https://oizndlroquzbqutdzwfp.supabase.co';
const key = 'sb_publishable_UkS0EPjhw7PI85hUGrFDIw_rB_J68qd';

const supabase = createClient(url, key);

async function testRpc() {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });
  console.log(error || data);
}

testRpc();
