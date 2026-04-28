-- ============================================================
-- Migration: Fix POS page 400 errors — add missing columns
-- Run this in Supabase SQL Editor
-- All ALTER TABLE ADD COLUMN IF NOT EXISTS — safe to re-run
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. MEDICINES — add salt_composition (used in POS search)
-- The POS search selects: salt_composition (for search + brand compare)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.medicines
  ADD COLUMN IF NOT EXISTS salt_composition text;

ALTER TABLE public.medicines
  ADD COLUMN IF NOT EXISTS gst_rate numeric(5,2);

-- ─────────────────────────────────────────────────────────────
-- 2. PHARMACIES — add columns used in POS pharmacy profile query
-- The POS selects: name, state, gstin, upi_id, address, city,
--   pincode, phone, license_number, logo_url
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS license_number text;

ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS upi_id text;

ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Migrate existing drug_license_no data into license_number if applicable
UPDATE public.pharmacies
  SET license_number = drug_license_no
  WHERE license_number IS NULL AND drug_license_no IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 3. BATCHES — add selling_price used by POS when adding to cart
-- This is the MOST CRITICAL column: fetchFefoBatches queries it,
-- and without it the query returns 400 → medicine chips do nothing
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS selling_price numeric(12,2);

-- ─────────────────────────────────────────────────────────────
-- Done. These columns are now nullable and won't break existing rows.
-- ─────────────────────────────────────────────────────────────

