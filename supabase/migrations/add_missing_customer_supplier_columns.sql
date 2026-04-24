-- ============================================================
-- Migration: Add missing columns to customers & suppliers
-- to match the desktop app's full feature set.
-- ============================================================

-- ─── CUSTOMERS TABLE ─────────────────────────────────────────
-- Desktop Customer interface fields that are missing:
--   gstin, state, customer_type, credit_limit, credit_days,
--   outstanding_balance, total_purchases, last_purchase_date

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS gstin text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS customer_type text DEFAULT 'b2c',
  ADD COLUMN IF NOT EXISTS credit_limit numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_days integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outstanding_balance numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_purchases numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_purchase_date timestamp with time zone;


-- ─── SUPPLIERS TABLE ─────────────────────────────────────────
-- Desktop Supplier interface fields that are missing:
--   city, state, pincode, outstanding_balance, credit_limit,
--   credit_days, opening_balance

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS outstanding_balance numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_limit numeric(12,2),
  ADD COLUMN IF NOT EXISTS credit_days integer,
  ADD COLUMN IF NOT EXISTS opening_balance numeric(12,2) DEFAULT 0;


-- ─── CUSTOMER LEDGER TABLE ───────────────────────────────────
-- The desktop has a full transaction ledger for credit tracking.
-- This table records every credit/payment event.

CREATE TABLE IF NOT EXISTS public.customer_ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id uuid REFERENCES public.pharmacies(id),
    customer_id uuid REFERENCES public.customers(id),
    transaction_type text NOT NULL,           -- 'sale' | 'payment' | 'credit' | 'return'
    amount numeric(12,2) NOT NULL,
    balance_after numeric(12,2) NOT NULL,
    payment_method text,                      -- 'cash' | 'upi' | 'card' | etc.
    reference_type text,                      -- 'sale' | 'return' | 'manual'
    reference_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- RLS for customer_ledger
ALTER TABLE public.customer_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own pharmacy customer_ledger" ON public.customer_ledger;
CREATE POLICY "Users can manage own pharmacy customer_ledger"
  ON public.customer_ledger
  FOR ALL
  TO authenticated
  USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.users
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.users
      WHERE auth_user_id = auth.uid()
    )
  );


-- ─── SUPPLIER LEDGER TABLE ───────────────────────────────────
-- Tracks supplier outstanding balance changes.

CREATE TABLE IF NOT EXISTS public.supplier_ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id uuid REFERENCES public.pharmacies(id),
    supplier_id uuid REFERENCES public.suppliers(id),
    transaction_type text NOT NULL,           -- 'purchase' | 'payment' | 'return'
    amount numeric(12,2) NOT NULL,
    balance_after numeric(12,2) NOT NULL,
    payment_method text,
    reference_type text,
    reference_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- RLS for supplier_ledger
ALTER TABLE public.supplier_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own pharmacy supplier_ledger" ON public.supplier_ledger;
CREATE POLICY "Users can manage own pharmacy supplier_ledger"
  ON public.supplier_ledger
  FOR ALL
  TO authenticated
  USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.users
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.users
      WHERE auth_user_id = auth.uid()
    )
  );


-- ─── CUSTOMER REGULARS TABLE ─────────────────────────────────
-- Maps regular/routine medicines to a customer (prescriptions).

CREATE TABLE IF NOT EXISTS public.customer_regulars (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id uuid REFERENCES public.pharmacies(id),
    customer_id uuid REFERENCES public.customers(id),
    medicine_id uuid REFERENCES public.medicines(id),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (pharmacy_id, customer_id, medicine_id)
);

-- RLS for customer_regulars
ALTER TABLE public.customer_regulars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own pharmacy customer_regulars" ON public.customer_regulars;
CREATE POLICY "Users can manage own pharmacy customer_regulars"
  ON public.customer_regulars
  FOR ALL
  TO authenticated
  USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.users
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.users
      WHERE auth_user_id = auth.uid()
    )
  );


-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS customer_ledger_customer_idx
  ON public.customer_ledger (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS supplier_ledger_supplier_idx
  ON public.supplier_ledger (supplier_id, created_at DESC);

CREATE INDEX IF NOT EXISTS customer_regulars_customer_idx
  ON public.customer_regulars (customer_id);

CREATE INDEX IF NOT EXISTS customers_outstanding_idx
  ON public.customers (pharmacy_id)
  WHERE outstanding_balance > 0;

CREATE INDEX IF NOT EXISTS suppliers_outstanding_idx
  ON public.suppliers (pharmacy_id)
  WHERE outstanding_balance > 0;


-- ─── EXPENSE CATEGORIES TABLE ────────────────────────────────
-- The desktop app has a dedicated expense_categories table
-- with per-pharmacy categories + system defaults.

CREATE TABLE IF NOT EXISTS public.expense_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id uuid REFERENCES public.pharmacies(id),
    name text NOT NULL,
    description text,
    is_system boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- RLS for expense_categories
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own pharmacy expense_categories" ON public.expense_categories;
CREATE POLICY "Users can manage own pharmacy expense_categories"
  ON public.expense_categories
  FOR ALL
  TO authenticated
  USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.users
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.users
      WHERE auth_user_id = auth.uid()
    )
  );


-- ─── EXPENSES TABLE ──────────────────────────────────────────
-- Add missing columns to match desktop schema:
--   category_id, payment_method, notes

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.expense_categories(id),
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Migrate existing payment_mode data to payment_method if needed
UPDATE public.expenses
  SET payment_method = payment_mode
  WHERE payment_method IS NULL AND payment_mode IS NOT NULL;


-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS expenses_pharmacy_date_idx
  ON public.expenses (pharmacy_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS expense_categories_pharmacy_idx
  ON public.expense_categories (pharmacy_id);


-- ─── RLS FOR EXPENSES TABLE ──────────────────────────────────
-- The expenses table has RLS enabled but may be missing a policy.

DROP POLICY IF EXISTS "Users can manage own pharmacy expenses" ON public.expenses;
CREATE POLICY "Users can manage own pharmacy expenses"
  ON public.expenses
  FOR ALL
  TO authenticated
  USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.users
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.users
      WHERE auth_user_id = auth.uid()
    )
  );

-- ─── CHALLANS & CHALLAN ITEMS TABLES ────────────────────────

CREATE TABLE IF NOT EXISTS public.challans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id uuid REFERENCES public.pharmacies(id),
    supplier_id uuid REFERENCES public.suppliers(id),
    challan_number text,
    status text DEFAULT 'pending',               -- pending | partially_accepted | accepted | returned
    total_quantity integer DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.challans ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.challan_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challan_id uuid REFERENCES public.challans(id) ON DELETE CASCADE,
    medicine_id uuid REFERENCES public.medicines(id),
    batch_number text,
    expiry_date date,
    received_quantity integer NOT NULL DEFAULT 0,
    accepted_quantity integer DEFAULT 0,
    returned_quantity integer DEFAULT 0,
    purchase_price numeric(12,2),
    purchase_rate numeric(12,2),                 -- legacy alias kept for compatibility
    mrp numeric(12,2),
    gst_percentage numeric(5,2) DEFAULT 0,
    units_per_pack integer DEFAULT 1,
    status text DEFAULT 'pending',               -- pending | accepted | partially_accepted | returned
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.challan_items ENABLE ROW LEVEL SECURITY;

-- ─── RLS FOR CHALLANS TABLE ─────────────────────────────────

DROP POLICY IF EXISTS "Users can manage own pharmacy challans" ON public.challans;
CREATE POLICY "Users can manage own pharmacy challans"
  ON public.challans
  FOR ALL
  TO authenticated
  USING (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.users
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    pharmacy_id IN (
      SELECT pharmacy_id FROM public.users
      WHERE auth_user_id = auth.uid()
    )
  );

-- ─── RLS FOR CHALLAN_ITEMS TABLE ────────────────────────────

DROP POLICY IF EXISTS "Users can manage own pharmacy challan_items" ON public.challan_items;
CREATE POLICY "Users can manage own pharmacy challan_items"
  ON public.challan_items
  FOR ALL
  TO authenticated
  USING (
    challan_id IN (
      SELECT id FROM public.challans
      WHERE pharmacy_id IN (
        SELECT pharmacy_id FROM public.users
        WHERE auth_user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    challan_id IN (
      SELECT id FROM public.challans
      WHERE pharmacy_id IN (
        SELECT pharmacy_id FROM public.users
        WHERE auth_user_id = auth.uid()
      )
    )
  );
