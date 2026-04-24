-- ShelfCure Supabase Initial Schema

-- 1. Pharmacies (Root entity)
create table if not exists public.pharmacies (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    phone text not null,
    email text,
    status text default 'active',
    state text,
    city text,
    pincode text,
    address text,
    drug_license_no text,
    gstin text,
    created_at timestamp with time zone default now()
);

-- 1.1 Super Admins
create table if not exists public.super_admins (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid references auth.users(id),
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
    city text,
    state text,
    pincode text,
    outstanding_balance numeric(12,2) default 0,
    credit_limit numeric(12,2),
    credit_days integer,
    opening_balance numeric(12,2) default 0,
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

-- 4.1 Categories
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    name text not null,
    description text,
    created_at timestamp with time zone default now()
);

-- 5. Medicines (Product catalog)
create table if not exists public.medicines (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    name text not null,
    generic_name text,
    manufacturer text,
    category_id uuid references public.categories(id),
    dosage_form text,
    strength text,
    pack_size integer default 1,
    pack_unit text default 'Strip',
    sale_unit_mode text default 'both',
    units_per_pack integer default 1,
    hsn_code text,
    gst_rate integer default 12,
    min_stock_level integer default 10,
    reorder_level integer default 20,
    rack_location text,
    barcode text,
    created_at timestamp with time zone default now()
);

-- 6. Batches (Inventory tracking)
create table if not exists public.batches (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    medicine_id uuid references public.medicines(id),
    batch_number text not null,
    expiry_date date not null,
    purchase_price numeric(12,2) not null,       -- renamed from purchase_rate
    mrp numeric(12,2) not null,
    stock_quantity integer not null default 0,   -- renamed from current_quantity
    supplier_id uuid references public.suppliers(id),
    created_at timestamp with time zone default now()
    -- removed: initial_quantity (unused), gst_percentage (stored on purchase_items), is_blocked (not implemented)
);

-- 7. Customers
create table if not exists public.customers (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    name text not null,
    phone text,
    email text,
    address text,
    gstin text,
    state text,
    customer_type text default 'b2c',
    credit_limit numeric(12,2) default 0,
    credit_days integer default 0,
    outstanding_balance numeric(12,2) default 0,
    total_purchases numeric(12,2) default 0,
    last_purchase_date timestamp with time zone,
    points integer default 0,
    created_at timestamp with time zone default now()
);

-- 8. Purchases (Inward stock bills)
create table if not exists public.purchases (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    supplier_id uuid references public.suppliers(id),
    invoice_number text,
    bill_number text,                             -- added: display bill number
    bill_date date,
    total_amount numeric(12,2),
    status text default 'Completed',
    payment_status text default 'unpaid',         -- added: paid/unpaid tracking
    created_at timestamp with time zone default now()
);

-- 9. Purchase Items (Line items for purchases)
create table if not exists public.purchase_items (
    id uuid primary key default gen_random_uuid(),
    purchase_id uuid references public.purchases(id),
    pharmacy_id uuid references public.pharmacies(id),  -- added: for RLS filtering
    medicine_id uuid references public.medicines(id),
    batch_id uuid references public.batches(id),
    batch_number text,                                   -- added: denormalized for display
    quantity integer not null,
    free_quantity integer default 0,                     -- added: bonus/free goods from supplier
    mrp numeric(12,2),
    purchase_price numeric(12,2),                        -- was purchase_rate in old schema
    discount_percent numeric(5,2),
    gst_rate numeric(5,2) default 0,                    -- added: GST % for this line item
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
    category_id uuid references public.expense_categories(id),
    amount numeric(12,2),
    description text,
    payment_mode text,
    payment_method text,
    notes text,
    created_at timestamp with time zone default now()
);

-- 14.1 Expense Categories
create table if not exists public.expense_categories (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    name text not null,
    description text,
    is_system boolean default false,
    is_active boolean default true,
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

-- 16. Challans (Inbound delivery notes from suppliers)
create table if not exists public.challans (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    supplier_id uuid references public.suppliers(id),
    challan_number text,
    status text default 'pending',               -- pending | partially_accepted | accepted | returned
    total_quantity integer default 0,
    notes text,
    created_at timestamp with time zone default now()
);

-- 16.1 Challan Items
create table if not exists public.challan_items (
    id uuid primary key default gen_random_uuid(),
    challan_id uuid references public.challans(id),
    medicine_id uuid references public.medicines(id),
    batch_number text,
    expiry_date date,
    received_quantity integer not null default 0,
    accepted_quantity integer default 0,
    returned_quantity integer default 0,
    purchase_price numeric(12,2),
    purchase_rate numeric(12,2),                 -- legacy alias kept for compatibility
    mrp numeric(12,2),
    gst_percentage numeric(5,2) default 0,
    units_per_pack integer default 1,
    status text default 'pending',               -- pending | accepted | partially_accepted | returned
    created_at timestamp with time zone default now()
);

-- 17. Inventory Transactions (Audit log for all stock movements)
create table if not exists public.inventory_transactions (
    id uuid primary key default gen_random_uuid(),
    pharmacy_id uuid references public.pharmacies(id),
    batch_id uuid references public.batches(id),
    medicine_id uuid references public.medicines(id),
    transaction_type text not null,              -- sale | purchase | adjustment | return | challan
    reference_type text,                         -- sale | purchase | challan | challan_return | manual
    reference_id uuid,
    quantity_change integer not null,            -- negative for outward, positive for inward
    quantity_after integer not null,
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

-- 16. Master Medicines (Global Catalog)
create table if not exists public.master_medicines (
    id bigint primary key generated always as identity,
    name text not null,
    salt_composition text,
    strength text,
    manufacturer text,
    dosage_form text,
    pack_size integer,
    pack_unit text,
    units_per_pack integer,
    hsn_code text,
    default_gst_rate integer,
    barcode text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-----------------------------------------------------
-- INDEXES
-----------------------------------------------------

create index if not exists batches_pharmacy_id_idx on public.batches (pharmacy_id);
create index if not exists batches_medicine_id_idx on public.batches (medicine_id);
create index if not exists batches_expiry_date_idx on public.batches (expiry_date);
create index if not exists batches_stock_qty_idx on public.batches (stock_quantity) where stock_quantity > 0;

create index if not exists sales_pharmacy_bill_date_idx on public.sales (pharmacy_id, bill_date desc);
create index if not exists purchases_pharmacy_bill_date_idx on public.purchases (pharmacy_id, bill_date desc);
create index if not exists medicines_pharmacy_id_idx on public.medicines (pharmacy_id);
