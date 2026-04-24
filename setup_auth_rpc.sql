-- Create a secure RPC function to handle new user registration and pharmacy creation
-- This bypasses RLS issues during the initial setup phase by running as SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.setup_new_user_pharmacy(
  p_full_name text,
  p_email text,
  p_pharmacy_name text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pharmacy_id uuid;
  v_user_id uuid;
  v_existing_user record;
  v_pharmacy_name text;
  v_result json;
BEGIN
  -- Check if user already exists
  SELECT * INTO v_existing_user FROM public.users WHERE auth_user_id = auth.uid();

  IF FOUND THEN
    IF v_existing_user.pharmacy_id IS NULL THEN
      -- User exists but no pharmacy, create pharmacy and update user
      INSERT INTO public.pharmacies (name, phone)
      VALUES (p_pharmacy_name, '0000000000')
      RETURNING id INTO v_pharmacy_id;

      UPDATE public.users 
      SET pharmacy_id = v_pharmacy_id 
      WHERE id = v_existing_user.id;

      v_user_id := v_existing_user.id;
      v_pharmacy_name := p_pharmacy_name;
    ELSE
      -- User already has a pharmacy, just return info
      v_user_id := v_existing_user.id;
      v_pharmacy_id := v_existing_user.pharmacy_id;
      
      SELECT name INTO v_pharmacy_name FROM public.pharmacies WHERE id = v_pharmacy_id;
    END IF;
  ELSE
    -- Completely new user
    INSERT INTO public.pharmacies (name, phone)
    VALUES (p_pharmacy_name, '0000000000')
    RETURNING id INTO v_pharmacy_id;

    INSERT INTO public.users (auth_user_id, full_name, email, role, is_active, pharmacy_id)
    VALUES (auth.uid(), p_full_name, p_email, 'store_admin', true, v_pharmacy_id)
    RETURNING id INTO v_user_id;
    
    v_pharmacy_name := p_pharmacy_name;
  END IF;

  SELECT json_build_object(
    'user_id', v_user_id,
    'pharmacy_id', v_pharmacy_id,
    'pharmacy_name', v_pharmacy_name,
    'role', COALESCE(v_existing_user.role, 'store_admin'),
    'full_name', COALESCE(v_existing_user.full_name, p_full_name),
    'email', COALESCE(v_existing_user.email, p_email),
    'is_active', COALESCE(v_existing_user.is_active, true)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
