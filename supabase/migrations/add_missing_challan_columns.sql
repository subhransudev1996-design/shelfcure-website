-- ============================================================
-- Migration: Add missing columns to challans & batches tables
-- Aligns Supabase schema with desktop app + web frontend expectations
-- ============================================================

-- 1. challans: add challan_date
ALTER TABLE public.challans
  ADD COLUMN IF NOT EXISTS challan_date date DEFAULT CURRENT_DATE;

-- 2. challans: add expected_return_date
ALTER TABLE public.challans
  ADD COLUMN IF NOT EXISTS expected_return_date date;

-- 3. challans: add supplier_name (denormalized for fast display)
ALTER TABLE public.challans
  ADD COLUMN IF NOT EXISTS supplier_name text;

-- 4. challans: add total_items
ALTER TABLE public.challans
  ADD COLUMN IF NOT EXISTS total_items integer DEFAULT 0;

-- 5. challans: add linked_purchase_id (for challan → purchase conversion)
ALTER TABLE public.challans
  ADD COLUMN IF NOT EXISTS linked_purchase_id uuid REFERENCES public.purchases(id);

-- 6. batches: add challan_id (provisional stock link)
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS challan_id uuid REFERENCES public.challans(id);

-- 7. Backfill challan_date from created_at for any existing rows
UPDATE public.challans
  SET challan_date = created_at::date
  WHERE challan_date IS NULL;

-- 8. Backfill supplier_name from suppliers table for existing rows
UPDATE public.challans c
  SET supplier_name = s.name
  FROM public.suppliers s
  WHERE c.supplier_id = s.id
    AND c.supplier_name IS NULL;

-- 9. Enable RLS on challans (if not already enabled)
ALTER TABLE public.challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challan_items ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for challans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'challans' AND policyname = 'Allow authenticated CRUD on challans'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on challans"
      ON public.challans FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 11. RLS Policies for challan_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'challan_items' AND policyname = 'Allow authenticated CRUD on challan_items'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on challan_items"
      ON public.challan_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
