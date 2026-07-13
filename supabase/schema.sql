-- ============================================================
-- Heritage Nusantara – Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. MENUS ────────────────────────────────────────────────
create table if not exists public.menus (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  category      text not null check (category in ('Food', 'Drink', 'Dessert')),
  price         numeric(10, 2) not null check (price >= 0),
  is_available  boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ── 2. TABLES ────────────────────────────────────────────────
create table if not exists public.tables (
  id            uuid primary key default gen_random_uuid(),
  table_number  integer not null unique check (table_number > 0),
  created_at    timestamptz not null default now()
);

-- Seed default tables 1-9
insert into public.tables (table_number) values
  (1),(2),(3),(4),(5),(6),(7),(8),(9)
on conflict (table_number) do nothing;

-- ── 3. ORDERS ────────────────────────────────────────────────
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  table_number    integer not null,
  items           jsonb not null default '[]',
  total_price     numeric(10, 2) not null default 0,
  status          text not null default 'Pending'
                    check (status in ('Pending', 'Cooking', 'Served')),
  payment_status  text not null default 'Unpaid'
                    check (payment_status in ('Unpaid', 'Requested', 'Paid')),
  created_at      timestamptz not null default now()
);

-- Index for fast per-table queries
create index if not exists orders_table_number_idx on public.orders (table_number);
create index if not exists orders_status_idx       on public.orders (status);
create index if not exists orders_created_at_idx   on public.orders (created_at desc);

-- ── 4. ROW LEVEL SECURITY ────────────────────────────────────
-- Enable RLS on all tables
alter table public.menus   enable row level security;
alter table public.tables  enable row level security;
alter table public.orders  enable row level security;

-- Allow anonymous reads on menus and tables (customer catalog)
create policy "Public can read menus"
  on public.menus for select using (true);

create policy "Public can read tables"
  on public.tables for select using (true);

-- Allow anonymous full access to orders
-- (In production, restrict write access to authenticated admin role)
create policy "Public can read orders"
  on public.orders for select using (true);

create policy "Public can insert orders"
  on public.orders for insert with check (true);

create policy "Public can update orders"
  on public.orders for update using (true);

create policy "Public can delete orders"
  on public.orders for delete using (true);

-- Allow authenticated (admin) full access to menus and tables
create policy "Admin full access menus"
  on public.menus for all using (auth.role() = 'authenticated');

create policy "Admin full access tables"
  on public.tables for all using (auth.role() = 'authenticated');

-- ── 5. REALTIME ──────────────────────────────────────────────
-- Enable Realtime on orders table
-- Run this AFTER the table is created:
--   Supabase Dashboard → Database → Replication → orders (toggle on)
-- Or via SQL:
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.menus;

-- ── 6. SAMPLE MENU SEED DATA ─────────────────────────────────
insert into public.menus (name, description, category, price, is_available) values
  ('Nasi Goreng Kampung',  'Traditional fried rice with shrimp paste, egg, and fresh vegetables', 'Food',    45000, true),
  ('Rendang Daging Sapi',  'Slow-cooked beef in rich coconut and spice gravy from West Sumatra',  'Food',    85000, true),
  ('Soto Ayam Lamongan',   'Clear chicken soup with rice noodles, egg, and crispy shallots',      'Food',    55000, true),
  ('Gado-Gado Jakarta',    'Steamed vegetables and tofu with peanut sauce and crackers',           'Food',    50000, true),
  ('Ayam Bakar Taliwang',  'Grilled chicken marinated in Lombok-style spicy sauce',               'Food',    75000, true),
  ('Es Teh Manis',         'Iced sweet tea, a classic Indonesian refreshment',                    'Drink',   15000, true),
  ('Es Jeruk Segar',       'Fresh squeezed orange juice over ice',                               'Drink',   20000, true),
  ('Jus Alpukat',          'Creamy avocado blended with condensed milk and ice',                  'Drink',   25000, true),
  ('Wedang Jahe',          'Warm ginger tea with lemongrass and palm sugar',                      'Drink',   18000, true),
  ('Es Dawet Ayu',         'Pandan jelly in coconut milk with palm sugar syrup',                  'Dessert', 22000, true),
  ('Klepon',               'Glutinous rice balls filled with palm sugar, rolled in coconut',      'Dessert', 18000, true),
  ('Pisang Goreng Keju',   'Deep-fried banana fritters topped with grated cheese',               'Dessert', 25000, true)
on conflict do nothing;
