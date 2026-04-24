import { createClient } from '@/lib/supabase/client';

export interface MasterMedicine {
  id: number;
  name: string;
  salt_composition: string | null;
  strength: string | null;
  manufacturer: string | null;
  dosage_form: string | null;
  pack_size: number | null;
  pack_unit: string | null;
  units_per_pack: number | null;
  hsn_code: string | null;
  default_gst_rate: number | null;
  barcode: string | null;
  created_at?: string;
  updated_at?: string;
}

// Instantiate Supabase client inside the API to ensure it works in Client Components
// For Server Components, a separate server-side API or direct queries should be used.
export const masterMedicineApi = {
  /**
   * Search for medicines in the global master database using fuzzy/like matching.
   * Matches against medicine name or salt composition.
   */
  search: async (query: string): Promise<MasterMedicine[]> => {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const supabase = createClient();
    const cleanQuery = query.trim();
    
    const { data, error } = await supabase
      .from('master_medicines')
      .select('*')
      .ilike('name', `%${cleanQuery}%`)
      .limit(30);

    if (error) {
      console.error('Error fetching master medicines:', error);
      throw error;
    }

    return data as MasterMedicine[];
  },

  /**
   * Find brand alternatives by matching exact salt composition.
   */
  getAlternativesBySalt: async (salt: string): Promise<MasterMedicine[]> => {
    if (!salt || salt.trim().length === 0) {
      return [];
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('master_medicines')
      .select('*')
      .ilike('salt_composition', salt.trim())
      .limit(30);

    if (error) {
      console.error('Error fetching brand alternatives:', error);
      throw error;
    }

    return data as MasterMedicine[];
  },

  /**
   * Inserts a completely new medicine into the global master database.
   * Called when a user adds a medicine that doesn't exist in the database at all.
   * This enriches the shared database for all ShelfCure users.
   */
  insertMasterMedicine: async (medicine: {
    name: string;
    salt_composition?: string | null;
    strength?: string | null;
    manufacturer?: string | null;
    dosage_form?: string | null;
    pack_size?: number | null;
    pack_unit?: string | null;
    units_per_pack?: number | null;
    hsn_code?: string | null;
    default_gst_rate?: number | null;
    barcode?: string | null;
  }) => {
    try {
      const supabase = createClient();
      
      // First check if a medicine with the same name already exists (avoid duplicates)
      const { data: existing } = await supabase
        .from('master_medicines')
        .select('id')
        .ilike('name', medicine.name.trim())
        .limit(1);

      if (existing && existing.length > 0) {
        // Already exists — don't insert, skip silently
        return;
      }

      const { error } = await supabase
        .from('master_medicines')
        .insert([{
          name: medicine.name.trim(),
          salt_composition: medicine.salt_composition || null,
          strength: medicine.strength || null,
          manufacturer: medicine.manufacturer || null,
          dosage_form: medicine.dosage_form || null,
          pack_size: medicine.pack_size || null,
          pack_unit: medicine.pack_unit || null,
          units_per_pack: medicine.units_per_pack || null,
          hsn_code: medicine.hsn_code || null,
          default_gst_rate: medicine.default_gst_rate || null,
          barcode: medicine.barcode || null,
        }]);

      if (error) {
        console.warn('Silent master insert failed (might be denied by RLS):', error);
      } else {
        console.log('[MasterDB] New medicine contributed:', medicine.name);
      }
    } catch (e) {
      console.warn('Failed silent master insert:', e);
    }
  },

  /**
   * Updates specific fields of a master medicine.
   * This is used for crowdsourcing missing data (e.g. if salt is null, we can update it).
   * Note: This requires a Supabase RLS policy allowing updates to missing columns.
   */
  updateMasterMedicine: async (id: number, updates: Partial<MasterMedicine>) => {
    const supabase = createClient();
    
    // Only attempt updates to safe fields
    const safeUpdates: Partial<MasterMedicine> = {};
    if (updates.salt_composition) safeUpdates.salt_composition = updates.salt_composition;
    if (updates.strength) safeUpdates.strength = updates.strength;
    if (updates.manufacturer) safeUpdates.manufacturer = updates.manufacturer;
    if (updates.dosage_form) safeUpdates.dosage_form = updates.dosage_form;
    if (updates.hsn_code) safeUpdates.hsn_code = updates.hsn_code;
    if (updates.barcode) safeUpdates.barcode = updates.barcode;
    if (updates.default_gst_rate !== undefined && updates.default_gst_rate !== null) safeUpdates.default_gst_rate = updates.default_gst_rate;
    if (updates.pack_size) safeUpdates.pack_size = updates.pack_size;
    if (updates.pack_unit) safeUpdates.pack_unit = updates.pack_unit;
    if (updates.units_per_pack) safeUpdates.units_per_pack = updates.units_per_pack;

    if (Object.keys(safeUpdates).length === 0) {
      console.log('[MasterDB] No fields to update (all empty or already filled)');
      return;
    }

    console.log('[MasterDB] Sending update for ID:', id, 'Fields:', Object.keys(safeUpdates));

    try {
      const { error, data } = await supabase
        .from('master_medicines')
        .update(safeUpdates)
        .eq('id', id)
        .select();

      if (error) {
        console.error('[MasterDB] Update FAILED:', error.message, error.code, error.details);
      } else {
        console.log('[MasterDB] Update SUCCESS! Updated rows:', data?.length);
      }
    } catch (e) {
      console.error('[MasterDB] Update exception:', e);
    }
  }
};
