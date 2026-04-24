-- DANGER: This script will delete ALL users, pharmacies, and associated data!
-- Only run this in development/testing to start with a clean slate.

-- 1. Delete all related data that depends on pharmacies (if any exists)
TRUNCATE TABLE public.purchase_order_items CASCADE;
TRUNCATE TABLE public.purchase_orders CASCADE;
TRUNCATE TABLE public.expenses CASCADE;
TRUNCATE TABLE public.purchase_return_items CASCADE;
TRUNCATE TABLE public.purchase_returns CASCADE;
TRUNCATE TABLE public.sale_return_items CASCADE;
TRUNCATE TABLE public.sale_returns CASCADE;
TRUNCATE TABLE public.sale_items CASCADE;
TRUNCATE TABLE public.sales CASCADE;
TRUNCATE TABLE public.purchase_items CASCADE;
TRUNCATE TABLE public.purchases CASCADE;
TRUNCATE TABLE public.customers CASCADE;
TRUNCATE TABLE public.batches CASCADE;
TRUNCATE TABLE public.medicines CASCADE;
TRUNCATE TABLE public.categories CASCADE;
TRUNCATE TABLE public.suppliers CASCADE;

-- 2. Delete public users and super admins
DELETE FROM public.super_admins;
DELETE FROM public.users;

-- 3. Delete all pharmacies
DELETE FROM public.pharmacies;

-- 4. Delete all auth users (this will remove them from Supabase Authentication)
DELETE FROM auth.users;
