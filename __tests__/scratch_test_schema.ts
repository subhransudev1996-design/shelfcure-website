
import { createClient } from './src/lib/supabase/client';

async function test() {
  const supabase = createClient();
  const { data, error } = await supabase.from('expense_categories').select('*').limit(1);
  if (error) {
    console.error('Error fetching expense_categories:', error.message);
  } else {
    console.log('expense_categories table exists:', data);
  }

  const { data: expData, error: expError } = await supabase.from('expenses').select('*').limit(1);
  if (expError) {
    console.error('Error fetching expenses:', expError.message);
  } else {
    console.log('expenses table columns:', Object.keys(expData[0] || {}));
  }
}

test();
