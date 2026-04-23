-- ShelfCure Supabase Initial Schema

-- 1. Pharmacies (Root entity)
create table if not exists public.pharmacies (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    phone text not null,
    state text,
    city text,
    pincode text,
    address text,
    drug_license_no text,
    gstin text,
    created_at timestamp with time zone default now()
);

-- 2. Users (Extension of auth.users)
create table if not exists public.users (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid references auth.users(id),
    full_name text not null,
    email text not null,
    role text default 'owner',
    is_active boolean default true,
    pharmacy_id uuid references public.pharmacies(id),
    created_at timestamp with time zone default now()
);

-- 3. Suppliers
create table if not exists public.suppliers (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    name text not null,
    contact_person text,
    phone text,
    email text,
    gstin text,
    drug_license text,
    address text,
    created_at timestamp with time zone default now()
);

-- 4. Dosage Forms (Lookup table)
create table if not exists public.dosage_forms (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_at timestamp with time zone default now()
);

-- Pre-fill common dosage forms
insert into public.dosage_forms (name) values 
  ('Tablet'), ('Capsule'), ('Syrup'), ('Injection'), 
  ('Cream'), ('Drops'), ('Inhaler'), ('Ointment'), ('Powder');

-- 5. Medicines (Product catalog)
create table if not exists public.medicines (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    name text not null,
    generic_name text,
    manufacturer text,
    dosage_form text,
    pack_size integer default 1,
    hsn_code text,
    gst_rate integer default 12,
    min_stock_level integer default 10,
    created_at timestamp with time zone default now()
);

-- 6. Batches (Inventory tracking)
create table if not exists public.batches (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    medicine_id uuid references public.medicines(id),
    batch_number text not null,
    expiry_date date not null,
    purchase_price numeric(12,2) not null,
    mrp numeric(12,2) not null,
    stock_quantity integer not null default 0,
    supplier_id uuid references public.suppliers(id),
    created_at timestamp with time zone default now()
);

-- 7. Customers
create table if not exists public.customers (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    name text not null,
    phone text,
    email text,
    address text,
    points integer default 0,
    created_at timestamp with time zone default now()
);

-- 8. Purchases (Inward stock bills)
create table if not exists public.purchases (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    supplier_id uuid references public.suppliers(id),
    invoice_number text,
    bill_date date,
    total_amount numeric(12,2),
    status text default 'Completed',
    created_at timestamp with time zone default now()
);

-- 9. Purchase Items (Line items for purchases)
create table if not exists public.purchase_items (
    id uuid primary key default gen_random_uuid(),
    purchase_id uuid references public.purchases(id),
    medicine_id uuid references public.medicines(id),
    batch_id uuid references public.batches(id),
    quantity integer not null,
    mrp numeric(12,2),
    purchase_price numeric(12,2),
    discount_percent numeric(5,2),
    gst_amount numeric(12,2),
    total_amount numeric(12,2),
    created_at timestamp with time zone default now()
);

-- 10. Sales (Outward patient bills)
create table if not exists public.sales (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    customer_id uuid references public.customers(id),
    doctor_name text,
    patient_name text,
    bill_date timestamp with time zone default now(),
    total_amount numeric(12,2),
    discount_amount numeric(12,2),
    gst_amount numeric(12,2),
    net_amount numeric(12,2),
    payment_mode text,
    status text default 'Completed',
    created_at timestamp with time zone default now()
);

-- 11. Sale Items (Line items for sales)
create table if not exists public.sale_items (
    id uuid primary key default gen_random_uuid(),
    sale_id uuid references public.sales(id),
    medicine_id uuid references public.medicines(id),
    batch_id uuid references public.batches(id),
    quantity integer not null,
    unit_price numeric(12,2),
    mrp numeric(12,2),
    gst_rate numeric(5,2),
    total_amount numeric(12,2),
    created_at timestamp with time zone default now()
);

-- 12. Sale Returns
create table if not exists public.sale_returns (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    sale_id uuid references public.sales(id),
    return_date timestamp with time zone default now(),
    refund_amount numeric(12,2),
    reason text,
    created_at timestamp with time zone default now()
);

-- 12.1 Sale Return Items
create table if not exists public.sale_return_items (
    id uuid primary key default gen_random_uuid(),
    sale_return_id uuid references public.sale_returns(id),
    sale_item_id uuid references public.sale_items(id),
    medicine_id uuid references public.medicines(id),
    quantity integer not null,
    refund_amount numeric(12,2),
    created_at timestamp with time zone default now()
);

-- 13. Purchase Returns
create table if not exists public.purchase_returns (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    supplier_id uuid references public.suppliers(id),
    return_number text,
    bill_number text,
    return_date timestamp with time zone default now(),
    total_amount numeric(12,2),
    item_count integer,
    reason text,
    created_at timestamp with time zone default now()
);

-- 13.1 Purchase Return Items
create table if not exists public.purchase_return_items (
    id uuid primary key default gen_random_uuid(),
    purchase_return_id uuid references public.purchase_returns(id),
    purchase_item_id uuid references public.purchase_items(id),
    medicine_id uuid references public.medicines(id),
    quantity integer not null,
    total_amount numeric(12,2),
    created_at timestamp with time zone default now()
);

-- 14. Expenses
create table if not exists public.expenses (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    expense_date date,
    category text,
    amount numeric(12,2),
    description text,
    payment_mode text,
    created_at timestamp with time zone default now()
);

-- 15. Purchase Orders (Reorders)
create table if not exists public.purchase_orders (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    supplier_id uuid references public.suppliers(id),
    supplier_name text,
    order_date timestamp with time zone default now(),
    status text default 'pending',
    total_items integer default 0,
    linked_purchase_id uuid references public.purchases(id),
    created_at timestamp with time zone default now()
);

-- 15.1 Purchase Order Items
create table if not exists public.purchase_order_items (
    id uuid primary key default gen_random_uuid(),
    purchase_order_id uuid references public.purchase_orders(id),
    medicine_id uuid references public.medicines(id),
    medicine_name text,
    requested_quantity integer not null,
    sale_unit_mode text,
    units_per_pack integer,
    created_at timestamp with time zone default now()
);

-----------------------------------------------------
-- QUICK RLS POLICIES (Development Mode)
-----------------------------------------------------
-- For simplicity immediately after creation, we leave it disabled 
-- so your frontend works out-of-the-box. 

-- If you DO enable it later, you must add policies:
-- alter table public.medicines enable row level security;
-- create policy "Allow authenticated CRUD" on public.medicines for all to authenticated using (true);
