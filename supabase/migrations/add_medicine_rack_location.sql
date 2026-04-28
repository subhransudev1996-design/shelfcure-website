-- Add rack_location to medicines (free-text, e.g. "A-12", "B-04").
-- The Add Medicine + Quick Add flows already insert this column, but without
-- the column existing PostgREST silently dropped the value, so it never
-- persisted. Mirrors the desktop schema.

ALTER TABLE public.medicines
  ADD COLUMN IF NOT EXISTS rack_location text;

CREATE INDEX IF NOT EXISTS idx_medicines_rack_location
  ON public.medicines (pharmacy_id, rack_location)
  WHERE rack_location IS NOT NULL;
