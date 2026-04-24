import { createClient } from '@supabase/supabase-js';

const url = 'https://oizndlroquzbqutdzwfp.supabase.co';
const key = 'sb_publishable_UkS0EPjhw7PI85hUGrFDIw_rB_J68qd';

const supabase = createClient(url, key);

async function checkMedicinesSchema() {
  // We can force a 400 error and check the details
  const { data, error } = await supabase.from('medicines').insert({
    pharmacy_id: '11111111-1111-1111-1111-111111111111',
    name: 'Test Medicine',
    generic_name: null,
    manufacturer: null,
    dosage_form: 'Tablet',
    strength: null,
    category_id: null,
    pack_size: 1,
    pack_unit: 'Strip',
    sale_unit_mode: 'both',
    units_per_pack: 1,
    hsn_code: null,
    gst_rate: 0,
    min_stock_level: 10,
    reorder_level: 20,
    rack_location: null,
    barcode: null,
  }).select();

  console.log("Error object:");
  console.dir(error, { depth: null });
}

checkMedicinesSchema();
