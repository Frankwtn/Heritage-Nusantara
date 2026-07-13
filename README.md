# Heritage Nusantara – Smart Dining System

> **"Timeless Flavors, Modern Convenience."**

A web-based ordering system for a traditional Indonesian restaurant. Customers scan a QR code at their table to browse the menu and place orders, while staff manage everything from an admin panel in real time.

---

## Features

### Customer Side (`/menu?table=X`)
- Browse menu with photos, names, descriptions, and prices
- Search menu by name or description with live result count and clear button
- Filter by category: All / Food / Drink / Dessert
- Add items to cart with per-item quantity control
- Per-item notes (e.g. "no spice", "no onion")
- Cart drawer to review before submitting
- Order Status drawer with real-time updates (Pending → Cooking → Served)
- Single **Request Bill** button for all orders at the table
- Order confirmation screen after successful submission

### Admin Side (`/`)
- **Login** — username/password with SHA-256 hashing, session via `sessionStorage`
- **Order Monitor** — live grid of all active orders, filter by status, update order status, confirm payment & close bill
- **Menu Management** — full CRUD with photo upload to Supabase Storage, availability toggle, search & filter
- **Table & QR Management** — add/remove tables, generate and print QR codes
- **Financial Report** — revenue stats, peak hour, bar chart (hourly/weekly), transaction history from closed bills

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime (Postgres Changes) |
| Routing | React Router DOM v6 |
| Charts | Recharts |
| Icons | Lucide React |
| Fonts | Playfair Display + Inter (via Google Fonts) |

---

## Database Schema

| Table | Description |
|---|---|
| `menus` | Menu items (name, price, photo, category) |
| `tables` | Registered table numbers |
| `orders` | Active orders (not yet closed) |
| `order_history` | Archived orders after bill is closed |
| `admin_settings` | Admin credentials (username, password_hash) |

---

## Getting Started

### Prerequisites
- Node.js v18+
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone https://github.com/your-username/heritage-nusantara.git
cd heritage-nusantara
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173
```

### 3. Set up the database

Run the SQL files in **Supabase Dashboard → SQL Editor** in this order:

**a) Main schema** — run `supabase/schema.sql`

**b) Order history table:**
```sql
create table if not exists public.order_history (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null,
  table_number    integer not null,
  items           jsonb not null default '[]',
  total_price     numeric(10, 2) not null default 0,
  status          text not null default 'Served',
  payment_status  text not null default 'Paid',
  notes           text,
  closed_at       timestamptz not null default now(),
  created_at      timestamptz not null
);
alter table public.order_history enable row level security;
create policy "Public can insert history" on public.order_history for insert with check (true);
create policy "Public can read history"   on public.order_history for select using (true);
GRANT SELECT, INSERT ON public.order_history TO anon;
GRANT SELECT, INSERT ON public.order_history TO authenticated;
```

**c) Admin credentials table:**
```sql
create table if not exists public.admin_settings (
  key   text primary key,
  value text not null
);
-- Default login: admin / admin123
insert into public.admin_settings (key, value) values
  ('username', 'admin'),
  ('password_hash', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
on conflict (key) do nothing;
alter table public.admin_settings enable row level security;
create policy "Admin can read settings"   on public.admin_settings for select using (true);
create policy "Admin can update settings" on public.admin_settings for update using (true);
GRANT SELECT, UPDATE ON public.admin_settings TO anon;
GRANT SELECT, UPDATE ON public.admin_settings TO authenticated;
```

**d) Grant table permissions:**
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menus   TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders  TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tables  TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menus   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tables  TO authenticated;
```

**e) Set up Supabase Storage:**
- Create a public bucket named `menu-images`
- Run storage policies:
```sql
CREATE POLICY "Public can view menu images"   ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');
CREATE POLICY "Public can upload menu images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-images');
CREATE POLICY "Public can update menu images" ON storage.objects FOR UPDATE USING (bucket_id = 'menu-images');
CREATE POLICY "Public can delete menu images" ON storage.objects FOR DELETE USING (bucket_id = 'menu-images');
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) for the admin panel.

Customer menu is accessible at `http://localhost:5173/menu?table=1`

---

## Default Admin Credentials

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |

To reset the password directly in Supabase:
```sql
update public.admin_settings
set value = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
where key = 'password_hash';
```

---

## Main User Flow

```
Admin sets up tables → QR codes printed and placed on tables
        ↓
Customer scans QR → opens /menu?table=X
        ↓
Customer selects items, adds notes, submits order
        ↓
Admin sees new order in Order Monitor (Pending)
        ↓
Admin updates status → Cooking → Served
        ↓
Customer opens Order Status → clicks "Request Bill"
        ↓
Admin confirms payment → Close Bill
        ↓
Order archived to order_history, financial report updated
```

---

## Project Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminLayout.jsx       # Sidebar + header shell
│   │   ├── AdminLogin.jsx        # Login page
│   │   ├── ChangePassword.jsx    # Change password modal
│   │   ├── OrderMonitor.jsx      # Live order management
│   │   ├── MenuManagement.jsx    # Menu CRUD with image upload
│   │   ├── TableManagement.jsx   # Table + QR management
│   │   └── FinancialReport.jsx   # Revenue charts and history
│   └── customer/
│       └── CustomerMenu.jsx      # Customer-facing menu page
├── lib/
│   └── supabase.js               # Supabase client
├── utils/
│   └── format.js                 # Rupiah and date formatters
├── App.jsx                       # Router (admin vs customer)
├── main.jsx
└── index.css                     # Tailwind + custom components
supabase/
└── schema.sql                    # Main database schema
```

---

## Notes & Limitations

- Admin authentication uses client-side SHA-256 hashing, not Supabase Auth. Sufficient for small internal use; for production scale, migrate to Supabase Auth with JWT.
- No push/email notifications — admin must actively monitor the Order Monitor page.
- Each order submission is independent. If a customer wants to add more items, they submit a new order (appears as a separate order for the same table).
- Menu photo limit: 2MB, formats PNG/JPG/WEBP.

---

## Backlog

- [ ] Browser push notifications for new orders
- [ ] Export financial report to PDF/Excel
- [ ] Multi-language toggle (ID/EN)
- [ ] Password change history log
- [ ] Thermal printer receipt support
- [ ] Ingredient/stock management
- [ ] Payment gateway integration (QRIS/virtual account)
