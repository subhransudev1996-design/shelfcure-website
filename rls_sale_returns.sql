-- ============================================================
-- RLS Policies for sale_returns and sale_return_items
-- Paste into Supabase SQL Editor and click Run
-- ============================================================

-- sale_returns
ALTER TABLE public.sale_returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pharmacy members can select sale_returns" ON public.sale_returns;
DROP POLICY IF EXISTS "pharmacy members can insert sale_returns" ON public.sale_returns;
DROP POLICY IF EXISTS "pharmacy members can update sale_returns" ON public.sale_returns;

CREATE POLICY "pharmacy members can select sale_returns"
ON public.sale_returns FOR SELECT TO authenticated
USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "pharmacy members can insert sale_returns"
ON public.sale_returns FOR INSERT TO authenticated
WITH CHECK (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "pharmacy members can update sale_returns"
ON public.sale_returns FOR UPDATE TO authenticated
USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));

-- sale_return_items
ALTER TABLE public.sale_return_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pharmacy members can select sale_return_items" ON public.sale_return_items;
DROP POLICY IF EXISTS "pharmacy members can insert sale_return_items" ON public.sale_return_items;

CREATE POLICY "pharmacy members can select sale_return_items"
ON public.sale_return_items FOR SELECT TO authenticated
USING (
  sale_return_id IN (
    SELECT id FROM public.sale_returns
    WHERE pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "pharmacy members can insert sale_return_items"
ON public.sale_return_items FOR INSERT TO authenticated
WITH CHECK (
  sale_return_id IN (
    SELECT id FROM public.sale_returns
    WHERE pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid())
  )
);
