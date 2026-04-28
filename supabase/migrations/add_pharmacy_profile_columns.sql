-- Add columns the panel Settings page and registration flow write to.
-- Without these, saving the Settings → General form fails with errors like
-- "Could not find the 'X' column of 'pharmacies' in the schema cache".

ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS email           text,
  ADD COLUMN IF NOT EXISTS status          text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS owner_name      text,
  ADD COLUMN IF NOT EXISTS license_number  text,
  ADD COLUMN IF NOT EXISTS upi_id          text,
  ADD COLUMN IF NOT EXISTS logo_url        text,
  ADD COLUMN IF NOT EXISTS subscription_status   text,
  ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS updated_at      timestamp with time zone DEFAULT now();

-- Backfill license_number from the older drug_license_no column if present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'pharmacies'
      AND column_name  = 'drug_license_no'
  ) THEN
    UPDATE public.pharmacies
       SET license_number = drug_license_no
     WHERE license_number IS NULL
       AND drug_license_no IS NOT NULL;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
