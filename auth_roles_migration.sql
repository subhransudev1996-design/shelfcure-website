-- Multi-Role Authentication Migration

-- 1. Create Super Admins table
create table if not exists public.super_admins (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid unique references auth.users(id),
    email text not null unique,
    full_name text not null,
    is_active boolean default true,
    created_at timestamp with time zone default now()
);

-- 2. Update users.role enum values
-- Migrate existing 'owner' → 'store_admin', 'admin' → 'store_admin'
update public.users set role = 'store_admin' where role in ('owner', 'admin');

-- 3. Add necessary columns to users table if they don't exist
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'deleted_at') then
        alter table public.users add column deleted_at timestamp with time zone;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'last_login_at') then
        alter table public.users add column last_login_at timestamp with time zone;
    end if;
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'invited_by') then
        alter table public.users add column invited_by uuid references public.users(id);
    end if;
end $$;

-- 4. Seed super admin (your account)
-- Note: Re-run this safely if it already exists
insert into public.super_admins (auth_user_id, email, full_name)
values (
  'bb085ca3-267e-4dbe-b6e7-cb78a30abe33',  -- your Supabase auth user ID
  'medicinesaas@gmail.com',
  'ShelfCure Admin'
) on conflict (email) do nothing;
