import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

console.log("URL:", url);
console.log("KEY prefix:", key?.substring(0, 10));

const supabase = createClient(url, key);

async function test() {
  console.log("Fetching...");
  const { data, error } = await supabase.from('master_medicines').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
    console.log("Error stringified:", JSON.stringify(error));
  } else {
    console.log("Data:", data);
  }
}
test();
