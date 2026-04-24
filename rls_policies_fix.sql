-- Fix RLS Policies for Pharmacies and Users
-- This will allow new users to create their default pharmacy and user records.

-- 1. Pharmacies Policies
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (optional, but prevents conflicts if you ran it before)
DROP POLICY IF EXISTS "Users can insert pharmacies" ON public.pharmacies;
DROP POLICY IF EXISTS "Users can view their own pharmacy" ON public.pharmacies;

CREATE POLICY "Users can insert pharmacies"
ON public.pharmacies
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own pharmacy"
ON public.pharmacies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own pharmacy"
ON public.pharmacies
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT pharmacy_id FROM public.users WHERE auth_user_id = auth.uid()
  )
);


-- 2. Users Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;
DROP POLICY IF EXISTS "Users can view their own record" ON public.users;
DROP POLICY IF EXISTS "Users can update their own record" ON public.users;

CREATE POLICY "Users can insert their own record"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can view their own record"
ON public.users
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own record"
ON public.users
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid());
