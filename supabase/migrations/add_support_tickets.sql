-- Support tickets submitted from /panel/support.
-- One row per ticket. The pharmacy and submitting user are recorded so
-- super-admins can triage. Status defaults to 'open'.

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id  uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  auth_user_id uuid,
  subject      text NOT NULL,
  message      text NOT NULL,
  status       text NOT NULL DEFAULT 'open',
  created_at   timestamp with time zone NOT NULL DEFAULT now(),
  updated_at   timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_pharmacy_idx
  ON public.support_tickets (pharmacy_id, created_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Members of the pharmacy can read and create their own tickets.
DROP POLICY IF EXISTS support_tickets_select ON public.support_tickets;
CREATE POLICY support_tickets_select
  ON public.support_tickets
  FOR SELECT
  USING (
    pharmacy_id IN (
      SELECT u.pharmacy_id FROM public.users u
       WHERE u.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS support_tickets_insert ON public.support_tickets;
CREATE POLICY support_tickets_insert
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (
    pharmacy_id IN (
      SELECT u.pharmacy_id FROM public.users u
       WHERE u.auth_user_id = auth.uid()
    )
  );
