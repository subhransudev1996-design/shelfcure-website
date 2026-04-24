-- ============================================================
-- ShelfCure Schema Migration (safe to re-run)
-- Paste into Supabase SQL Editor and click Run
-- ============================================================

-- batches — drop unused columns
ALTER TABLE public.batches DROP COLUMN IF EXISTS initial_quantity;
ALTER TABLE public.batches DROP COLUMN IF EXISTS gst_percentage;
ALTER TABLE public.batches DROP COLUMN IF EXISTS is_blocked;

-- batches — add supplier_id if missing
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id);

-- purchases — add missing columns
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS bill_number text;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';

-- purchase_items — add missing columns
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS pharmacy_id uuid REFERENCES public.pharmacies(id);
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS batch_number text;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS free_quantity integer DEFAULT 0;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS gst_rate numeric(5,2) DEFAULT 0;

-- purchase_items — rename purchase_rate → purchase_price only if still needed
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_items' AND column_name = 'purchase_rate'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchase_items' AND column_name = 'purchase_price'
  ) THEN
    ALTER TABLE public.purchase_items RENAME COLUMN purchase_rate TO purchase_price;
  END IF;
END $$;

-- indexes
CREATE INDEX IF NOT EXISTS batches_pharmacy_id_idx ON public.batches (pharmacy_id);
CREATE INDEX IF NOT EXISTS batches_medicine_id_idx ON public.batches (medicine_id);
CREATE INDEX IF NOT EXISTS batches_expiry_date_idx ON public.batches (expiry_date);
CREATE INDEX IF NOT EXISTS batches_stock_qty_idx ON public.batches (stock_quantity) WHERE stock_quantity > 0;
CREATE INDEX IF NOT EXISTS sales_pharmacy_bill_date_idx ON public.sales (pharmacy_id, bill_date DESC);
CREATE INDEX IF NOT EXISTS purchases_pharmacy_bill_date_idx ON public.purchases (pharmacy_id, bill_date DESC);
CREATE INDEX IF NOT EXISTS medicines_pharmacy_id_idx ON public.medicines (pharmacy_id);

-- verify batches columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'batches'
ORDER BY ordinal_position;
