-- ============================================================
-- Migration: Align Supabase schema with Desktop app (001_initial + 005-022)
-- Run this in Supabase SQL Editor
-- All ALTER TABLE ADD COLUMN IF NOT EXISTS — safe to re-run
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. BATCHES — add missing columns from desktop schema
-- Desktop: purchase_item_id, initial_quantity, current_quantity,
--          purchase_rate, selling_price, gst_percentage, is_blocked,
--          supplier_id, challan_id
-- Supabase already has: supplier_id, stock_quantity (=current_quantity),
--          purchase_price (=purchase_rate), mrp
-- ─────────────────────────────────────────────────────────────

-- purchase_item_id — FK linking batch to the purchase_items row it came from
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS purchase_item_id uuid REFERENCES public.purchase_items(id);

-- initial_quantity — quantity when batch was first created
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS initial_quantity integer NOT NULL DEFAULT 0;

-- selling_price — custom selling price (may differ from MRP)
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS selling_price numeric(12,2);

-- gst_percentage — GST rate for this batch
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS gst_percentage numeric(5,2) NOT NULL DEFAULT 0;

-- is_blocked — whether batch is blocked from sale
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

-- challan_id — provisional stock link (also in add_missing_challan_columns.sql)
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS challan_id uuid REFERENCES public.challans(id);

-- updated_at — desktop tracks this
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Backfill initial_quantity from stock_quantity for existing batches
UPDATE public.batches
  SET initial_quantity = stock_quantity
  WHERE initial_quantity = 0 AND stock_quantity > 0;


-- ─────────────────────────────────────────────────────────────
-- 2. PURCHASES — add missing columns from desktop
-- Desktop: subtotal, taxable_amount, gst_amount, cgst/sgst/igst,
--          discount_amount, paid_amount, payment_method, payment_date,
--          is_ai_scanned, notes, deleted_at
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS taxable_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS gst_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS cgst_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS sgst_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS igst_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2);

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS paid_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS payment_method text;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS payment_date date;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS is_ai_scanned boolean NOT NULL DEFAULT false;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();


-- ─────────────────────────────────────────────────────────────
-- 3. PURCHASE ITEMS — add missing columns from desktop
-- Desktop: purchase_rate, gst_percentage, discount_percentage,
--          amount, selling_price, returned_quantity
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.purchase_items
  ADD COLUMN IF NOT EXISTS expiry_date date;

ALTER TABLE public.purchase_items
  ADD COLUMN IF NOT EXISTS purchase_rate numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.purchase_items
  ADD COLUMN IF NOT EXISTS gst_percentage numeric(5,2) NOT NULL DEFAULT 0;

ALTER TABLE public.purchase_items
  ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2);

ALTER TABLE public.purchase_items
  ADD COLUMN IF NOT EXISTS amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.purchase_items
  ADD COLUMN IF NOT EXISTS selling_price numeric(12,2);

-- From migration 006: track returned quantity per purchase item
ALTER TABLE public.purchase_items
  ADD COLUMN IF NOT EXISTS returned_quantity integer NOT NULL DEFAULT 0;


-- ─────────────────────────────────────────────────────────────
-- 4. PURCHASE RETURNS — add missing columns from desktop
-- Desktop: purchase_id, subtotal, gst_amount, deleted_at
-- Supabase has: return_number, total_amount, reason, item_count, bill_number
-- ─────────────────────────────────────────────────────────────

-- purchase_id — FK linking return to the original purchase
ALTER TABLE public.purchase_returns
  ADD COLUMN IF NOT EXISTS purchase_id uuid REFERENCES public.purchases(id);

-- subtotal — amount before GST
ALTER TABLE public.purchase_returns
  ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) NOT NULL DEFAULT 0;

-- gst_amount — GST portion of the return
ALTER TABLE public.purchase_returns
  ADD COLUMN IF NOT EXISTS gst_amount numeric(12,2) NOT NULL DEFAULT 0;

-- deleted_at — soft delete
ALTER TABLE public.purchase_returns
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;


-- ─────────────────────────────────────────────────────────────
-- 5. PURCHASE RETURN ITEMS — add missing columns from desktop
-- Desktop: pharmacy_id, batch_id, amount
-- Supabase has: purchase_return_id, purchase_item_id, medicine_id,
--              quantity, total_amount
-- ─────────────────────────────────────────────────────────────

-- pharmacy_id — for RLS filtering
ALTER TABLE public.purchase_return_items
  ADD COLUMN IF NOT EXISTS pharmacy_id uuid REFERENCES public.pharmacies(id);

-- batch_id — FK linking to the batch affected
ALTER TABLE public.purchase_return_items
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id);

-- amount — desktop uses 'amount', Supabase has 'total_amount'
-- Adding 'amount' as alias column; code can use either
ALTER TABLE public.purchase_return_items
  ADD COLUMN IF NOT EXISTS amount numeric(12,2) NOT NULL DEFAULT 0;


-- ─────────────────────────────────────────────────────────────
-- 6. SALES — add missing columns from desktop
-- Desktop: bill_number, subtotal, taxable_amount, cgst/sgst/igst,
--          customer_type, customer_gstin, customer_state,
--          payment_method, payment_status, paid_amount,
--          is_prescription_sale, notes, deleted_at, is_returned,
--          is_fully_returned
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS bill_number text;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS taxable_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS cgst_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS sgst_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS igst_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS customer_type text NOT NULL DEFAULT 'b2c';

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS customer_gstin text;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS customer_state text;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cash';

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid';

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS paid_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS is_prescription_sale boolean NOT NULL DEFAULT false;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- From migration 005: return tracking on sales
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS is_returned boolean NOT NULL DEFAULT false;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS is_fully_returned boolean NOT NULL DEFAULT false;


-- ─────────────────────────────────────────────────────────────
-- 7. SALE ITEMS — add missing columns from desktop
-- Desktop: pharmacy_id, discount_percentage, gst_percentage,
--          selling_unit, taxable_amount, cgst/sgst/igst percentages
--          and amounts, returned_quantity
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS pharmacy_id uuid REFERENCES public.pharmacies(id);

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2);

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS gst_percentage numeric(5,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS selling_unit text NOT NULL DEFAULT 'pack';

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS taxable_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS cgst_percentage numeric(5,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS sgst_percentage numeric(5,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS igst_percentage numeric(5,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS cgst_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS sgst_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS igst_amount numeric(12,2) NOT NULL DEFAULT 0;

-- From migration 005: return tracking on sale items
ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS returned_quantity integer NOT NULL DEFAULT 0;


-- ─────────────────────────────────────────────────────────────
-- 8. SALE RETURNS — add missing columns from desktop
-- Desktop: customer_id, return_number, total_amount, deleted_at,
--          subtotal, gst_amount
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.sale_returns
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id);

ALTER TABLE public.sale_returns
  ADD COLUMN IF NOT EXISTS return_number text;

ALTER TABLE public.sale_returns
  ADD COLUMN IF NOT EXISTS total_amount numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sale_returns
  ADD COLUMN IF NOT EXISTS refund_method text;

ALTER TABLE public.sale_returns
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- From migration 007: subtotals on sale returns
ALTER TABLE public.sale_returns
  ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE public.sale_returns
  ADD COLUMN IF NOT EXISTS gst_amount numeric(12,2) NOT NULL DEFAULT 0;


-- ─────────────────────────────────────────────────────────────
-- 9. SALE RETURN ITEMS — add missing columns from desktop
-- Desktop: pharmacy_id, batch_id, amount
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.sale_return_items
  ADD COLUMN IF NOT EXISTS pharmacy_id uuid REFERENCES public.pharmacies(id);

ALTER TABLE public.sale_return_items
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id);

ALTER TABLE public.sale_return_items
  ADD COLUMN IF NOT EXISTS amount numeric(12,2) NOT NULL DEFAULT 0;


-- ─────────────────────────────────────────────────────────────
-- 10. INVENTORY TRANSACTIONS — create if missing, then add columns
-- ─────────────────────────────────────────────────────────────

-- Create the table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id uuid REFERENCES public.pharmacies(id),
    batch_id uuid REFERENCES public.batches(id),
    medicine_id uuid REFERENCES public.medicines(id),
    transaction_type text NOT NULL,
    reference_type text,
    reference_id uuid,
    quantity_change integer NOT NULL,
    quantity_after integer NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- Add notes column in case table existed without it
ALTER TABLE public.inventory_transactions
  ADD COLUMN IF NOT EXISTS notes text;


-- ─────────────────────────────────────────────────────────────
-- 11. RLS POLICIES — ensure all affected tables allow authenticated CRUD
-- ─────────────────────────────────────────────────────────────

-- batches
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'batches' AND policyname = 'Allow authenticated CRUD on batches'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on batches"
      ON public.batches FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchases' AND policyname = 'Allow authenticated CRUD on purchases'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on purchases"
      ON public.purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- purchase_items
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_items' AND policyname = 'Allow authenticated CRUD on purchase_items'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on purchase_items"
      ON public.purchase_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- purchase_returns
ALTER TABLE public.purchase_returns ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_returns' AND policyname = 'Allow authenticated CRUD on purchase_returns'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on purchase_returns"
      ON public.purchase_returns FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- purchase_return_items
ALTER TABLE public.purchase_return_items ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_return_items' AND policyname = 'Allow authenticated CRUD on purchase_return_items'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on purchase_return_items"
      ON public.purchase_return_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Allow authenticated CRUD on sales'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on sales"
      ON public.sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- sale_items
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sale_items' AND policyname = 'Allow authenticated CRUD on sale_items'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on sale_items"
      ON public.sale_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- sale_returns
ALTER TABLE public.sale_returns ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sale_returns' AND policyname = 'Allow authenticated CRUD on sale_returns'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on sale_returns"
      ON public.sale_returns FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- sale_return_items
ALTER TABLE public.sale_return_items ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sale_return_items' AND policyname = 'Allow authenticated CRUD on sale_return_items'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on sale_return_items"
      ON public.sale_return_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- inventory_transactions
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inventory_transactions' AND policyname = 'Allow authenticated CRUD on inventory_transactions'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on inventory_transactions"
      ON public.inventory_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Allow authenticated CRUD on suppliers'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on suppliers"
      ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- medicines
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'medicines' AND policyname = 'Allow authenticated CRUD on medicines'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on medicines"
      ON public.medicines FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- 12. INDEXES — for performance (matches desktop 002_indexes.sql)
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_batches_purchase_item_id ON public.batches (purchase_item_id);
CREATE INDEX IF NOT EXISTS idx_batches_challan_id ON public.batches (challan_id);
CREATE INDEX IF NOT EXISTS idx_purchase_returns_pharmacy ON public.purchase_returns (pharmacy_id, return_date);
CREATE INDEX IF NOT EXISTS idx_purchase_return_items_return ON public.purchase_return_items (purchase_return_id);
CREATE INDEX IF NOT EXISTS idx_purchase_returns_purchase ON public.purchase_returns (purchase_id);
