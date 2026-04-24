-- Fix RLS Policies for Inventory and Sales tables

-- 1. Batches
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view batches of their pharmacy" ON public.batches;
DROP POLICY IF EXISTS "Users can insert batches for their pharmacy" ON public.batches;
DROP POLICY IF EXISTS "Users can update batches of their pharmacy" ON public.batches;
DROP POLICY IF EXISTS "Users can delete batches of their pharmacy" ON public.batches;

CREATE POLICY "Users can view batches of their pharmacy" ON public.batches FOR SELECT TO authenticated USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can insert batches for their pharmacy" ON public.batches FOR INSERT TO authenticated WITH CHECK (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can update batches of their pharmacy" ON public.batches FOR UPDATE TO authenticated USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can delete batches of their pharmacy" ON public.batches FOR DELETE TO authenticated USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));

-- 2. Suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view suppliers of their pharmacy" ON public.suppliers;
DROP POLICY IF EXISTS "Users can insert suppliers for their pharmacy" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update suppliers of their pharmacy" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete suppliers of their pharmacy" ON public.suppliers;

CREATE POLICY "Users can view suppliers of their pharmacy" ON public.suppliers FOR SELECT TO authenticated USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can insert suppliers for their pharmacy" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can update suppliers of their pharmacy" ON public.suppliers FOR UPDATE TO authenticated USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can delete suppliers of their pharmacy" ON public.suppliers FOR DELETE TO authenticated USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));

-- 3. Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view categories of their pharmacy" ON public.categories;
DROP POLICY IF EXISTS "Users can insert categories for their pharmacy" ON public.categories;
DROP POLICY IF EXISTS "Users can update categories of their pharmacy" ON public.categories;
DROP POLICY IF EXISTS "Users can delete categories of their pharmacy" ON public.categories;

CREATE POLICY "Users can view categories of their pharmacy" ON public.categories FOR SELECT TO authenticated USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can insert categories for their pharmacy" ON public.categories FOR INSERT TO authenticated WITH CHECK (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can update categories of their pharmacy" ON public.categories FOR UPDATE TO authenticated USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can delete categories of their pharmacy" ON public.categories FOR DELETE TO authenticated USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));

-- 4. Dosage Forms (Global lookup)
ALTER TABLE public.dosage_forms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view dosage forms" ON public.dosage_forms;
CREATE POLICY "Anyone can view dosage forms" ON public.dosage_forms FOR SELECT TO authenticated USING (true);

-- 5. Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view customers of their pharmacy" ON public.customers;
DROP POLICY IF EXISTS "Users can insert customers for their pharmacy" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers of their pharmacy" ON public.customers;

CREATE POLICY "Users can view customers of their pharmacy" ON public.customers FOR SELECT TO authenticated USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can insert customers for their pharmacy" ON public.customers FOR INSERT TO authenticated WITH CHECK (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can update customers of their pharmacy" ON public.customers FOR UPDATE TO authenticated USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));

-- 6. Purchases & Purchase Items
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can update purchases" ON public.purchases;
CREATE POLICY "Users can view purchases" ON public.purchases FOR SELECT TO authenticated USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can insert purchases" ON public.purchases FOR INSERT TO authenticated WITH CHECK (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can update purchases" ON public.purchases FOR UPDATE TO authenticated USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));

ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can insert purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can update purchase items" ON public.purchase_items;
-- purchase_items don't have pharmacy_id, so we join with purchases
CREATE POLICY "Users can view purchase items" ON public.purchase_items FOR SELECT TO authenticated USING (
    purchase_id IN (SELECT id FROM public.purchases WHERE pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()))
);
CREATE POLICY "Users can insert purchase items" ON public.purchase_items FOR INSERT TO authenticated WITH CHECK (
    purchase_id IN (SELECT id FROM public.purchases WHERE pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()))
);
CREATE POLICY "Users can update purchase items" ON public.purchase_items FOR UPDATE TO authenticated USING (
    purchase_id IN (SELECT id FROM public.purchases WHERE pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()))
);

-- 7. Sales & Sale Items
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view sales" ON public.sales;
DROP POLICY IF EXISTS "Users can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Users can update sales" ON public.sales;
CREATE POLICY "Users can view sales" ON public.sales FOR SELECT TO authenticated USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can insert sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can update sales" ON public.sales FOR UPDATE TO authenticated USING (pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()));

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can insert sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can update sale items" ON public.sale_items;
CREATE POLICY "Users can view sale items" ON public.sale_items FOR SELECT TO authenticated USING (
    sale_id IN (SELECT id FROM public.sales WHERE pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()))
);
CREATE POLICY "Users can insert sale items" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (
    sale_id IN (SELECT id FROM public.sales WHERE pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()))
);
CREATE POLICY "Users can update sale items" ON public.sale_items FOR UPDATE TO authenticated USING (
    sale_id IN (SELECT id FROM public.sales WHERE pharmacy_id IN (SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()))
);

-- Note: In a production environment, you might want to optimize these subqueries
-- or add pharmacy_id directly to child tables for better performance.
-- 8. GRANT Privileges
-- IMPORTANT: If these tables were created via SQL script, they might be missing basic role privileges.
GRANT ALL ON public.batches TO authenticated;
GRANT ALL ON public.batches TO anon;
GRANT ALL ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO anon;
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.categories TO anon;
GRANT ALL ON public.dosage_forms TO authenticated;
GRANT ALL ON public.dosage_forms TO anon;
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customers TO anon;
GRANT ALL ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO anon;
GRANT ALL ON public.purchase_items TO authenticated;
GRANT ALL ON public.purchase_items TO anon;
GRANT ALL ON public.sales TO authenticated;
GRANT ALL ON public.sales TO anon;
GRANT ALL ON public.sale_items TO authenticated;
GRANT ALL ON public.sale_items TO anon;
