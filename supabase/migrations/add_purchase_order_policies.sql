-- Allow authenticated users to read/write purchase_orders and
-- purchase_order_items. RLS was on but no policies existed, which 403'd
-- inserts from the supplier "Reorder" / "Bulk Reorder" flows.
-- Pattern matches batches/purchases/purchase_items in
-- align_schema_with_desktop.sql.

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'purchase_orders'
       AND policyname = 'Allow authenticated CRUD on purchase_orders'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on purchase_orders"
      ON public.purchase_orders
      FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE tablename = 'purchase_order_items'
       AND policyname = 'Allow authenticated CRUD on purchase_order_items'
  ) THEN
    CREATE POLICY "Allow authenticated CRUD on purchase_order_items"
      ON public.purchase_order_items
      FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;
