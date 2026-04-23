const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const { data, error } = await supabase.from('customers').select('*').limit(1);
  if (error) console.log('Error', error);
  else console.log('Data length:', data.length);
  
  // Actually, I cannot query information_schema from the client.
  // I will just fetch 1 row from customers. If it's empty, I can't see columns unless I insert one and fail, or use an API that returns metadata.
  // Wait, I can do a query that fails intentionally to see if it hints columns, but no.
  // Let's check `src/types/supabase.ts` if it exists.
}
test();
