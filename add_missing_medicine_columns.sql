-- Add missing columns to medicines table
ALTER TABLE public.medicines
ADD COLUMN IF NOT EXISTS barcode text,
ADD COLUMN IF NOT EXISTS rack_location text,
ADD COLUMN IF NOT EXISTS hsn_code text,
ADD COLUMN IF NOT EXISTS gst_rate integer default 12,
ADD COLUMN IF NOT EXISTS sale_unit_mode text default 'both',
ADD COLUMN IF NOT EXISTS units_per_pack integer default 1,
ADD COLUMN IF NOT EXISTS min_stock_level integer default 10,
ADD COLUMN IF NOT EXISTS reorder_level integer default 20;
