-- 1. Ensure all columns exist in the medicines table
ALTER TABLE public.medicines
ADD COLUMN IF NOT EXISTS generic_name text,
ADD COLUMN IF NOT EXISTS manufacturer text,
ADD COLUMN IF NOT EXISTS category_id uuid references public.categories(id),
ADD COLUMN IF NOT EXISTS dosage_form text,
ADD COLUMN IF NOT EXISTS strength text,
ADD COLUMN IF NOT EXISTS pack_size integer default 1,
ADD COLUMN IF NOT EXISTS pack_unit text default 'Strip',
ADD COLUMN IF NOT EXISTS sale_unit_mode text default 'both',
ADD COLUMN IF NOT EXISTS units_per_pack integer default 1,
ADD COLUMN IF NOT EXISTS hsn_code text,
ADD COLUMN IF NOT EXISTS gst_rate integer default 12,
ADD COLUMN IF NOT EXISTS min_stock_level integer default 10,
ADD COLUMN IF NOT EXISTS reorder_level integer default 20,
ADD COLUMN IF NOT EXISTS rack_location text,
ADD COLUMN IF NOT EXISTS barcode text;

-- 2. Force schema cache to reload
NOTIFY pgrst, 'reload schema';

-- 3. Set up Row Level Security (RLS) for medicines
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view medicines of their pharmacy" ON public.medicines;
DROP POLICY IF EXISTS "Users can insert medicines for their pharmacy" ON public.medicines;
DROP POLICY IF EXISTS "Users can update medicines of their pharmacy" ON public.medicines;
DROP POLICY IF EXISTS "Users can delete medicines of their pharmacy" ON public.medicines;

-- View policy
CREATE POLICY "Users can view medicines of their pharmacy"
ON public.medicines
FOR SELECT
TO authenticated
USING (
  pharmacy_id IN (
    SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

-- Insert policy
CREATE POLICY "Users can insert medicines for their pharmacy"
ON public.medicines
FOR INSERT
TO authenticated
WITH CHECK (
  pharmacy_id IN (
    SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

-- Update policy
CREATE POLICY "Users can update medicines of their pharmacy"
ON public.medicines
FOR UPDATE
TO authenticated
USING (
  pharmacy_id IN (
    SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

-- Delete policy
CREATE POLICY "Users can delete medicines of their pharmacy"
ON public.medicines
FOR DELETE
TO authenticated
USING (
  pharmacy_id IN (
    SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()
  )
);
