-- ============================================================================
-- Voice Commerce SaaS - Supabase Schema
-- Run this file once in the Supabase SQL Editor (Dashboard > SQL > New query).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. SHOPS (one row per tenant / shop owner)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shops (
  id               TEXT PRIMARY KEY,          -- e.g. 'shop_101'
  shop_name        TEXT NOT NULL,
  virtual_number   TEXT UNIQUE NOT NULL,      -- e.g. '0301-1111111'
  owner_whatsapp   TEXT NOT NULL,
  owner_email      TEXT NOT NULL,
  default_language TEXT NOT NULL DEFAULT 'ur', -- 'ur' | 'en' | 'punjabi' | 'saraiki'
  monthly_plan     INT  NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  owner_password   TEXT,                      -- plain-text demo login; hash in prod
  open_time        TEXT,                      -- e.g. '11:00'
  close_time       TEXT,                      -- e.g. '23:00'
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. PRODUCTS (menu items belonging to a shop)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id           SERIAL PRIMARY KEY,
  shop_id      TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  price        INT  NOT NULL DEFAULT 0,       -- in Rs
  stock        INT  NOT NULL DEFAULT 0,
  category     TEXT,
  image_url    TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------------
-- 3. CUSTOMERS (callers identified by phone number, per shop)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id                SERIAL PRIMARY KEY,
  shop_id           TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  phone_number      TEXT NOT NULL,
  customer_name     TEXT,
  address           TEXT,
  preferred_language TEXT,                    -- captured from what they spoke
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (shop_id, phone_number)
);

-- ---------------------------------------------------------------------------
-- 4. ORDERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id            SERIAL PRIMARY KEY,
  shop_id       TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_phone TEXT,
  customer_name  TEXT,
  items          JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{product_name, qty, price}]
  total_amount   INT  NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'pending',    -- pending|confirmed|delivered|cancelled
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 5. PAYMENTS (monthly billing ledger, used by the super-admin billing page)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id       SERIAL PRIMARY KEY,
  shop_id  TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  amount   INT  NOT NULL DEFAULT 0,
  month    TEXT NOT NULL,                     -- e.g. '2026-10'
  status   TEXT NOT NULL DEFAULT 'pending',   -- pending|paid
  paid_at  TIMESTAMP WITH TIME ZONE
);

-- ---------------------------------------------------------------------------
-- 6. SETTINGS (key/value store for platform API keys, editable in super-admin)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_shops_virtual_number ON shops (virtual_number);
CREATE INDEX IF NOT EXISTS idx_products_shop_id     ON products (shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_shop_id    ON customers (shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id       ON orders (shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_status   ON orders (shop_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_shop_id     ON payments (shop_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (permissive demo policies).
-- NOTE: these allow full access to anon + service_role so the demo works out
-- of the box. Tighten in production: scope each query by shop_id / auth.uid().
-- ---------------------------------------------------------------------------
ALTER TABLE shops     ENABLE ROW LEVEL SECURITY;
ALTER TABLE products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Drop existing permissive policies so the script is re-runnable, then recreate.
  DROP POLICY IF EXISTS demo_all ON shops;
  DROP POLICY IF EXISTS demo_all ON products;
  DROP POLICY IF EXISTS demo_all ON customers;
  DROP POLICY IF EXISTS demo_all ON orders;
  DROP POLICY IF EXISTS demo_all ON payments;
  DROP POLICY IF EXISTS demo_all ON settings;

  CREATE POLICY demo_all ON shops     FOR ALL TO anon, service_role USING (true) WITH CHECK (true);
  CREATE POLICY demo_all ON products  FOR ALL TO anon, service_role USING (true) WITH CHECK (true);
  CREATE POLICY demo_all ON customers FOR ALL TO anon, service_role USING (true) WITH CHECK (true);
  CREATE POLICY demo_all ON orders    FOR ALL TO anon, service_role USING (true) WITH CHECK (true);
  CREATE POLICY demo_all ON payments  FOR ALL TO anon, service_role USING (true) WITH CHECK (true);
  CREATE POLICY demo_all ON settings  FOR ALL TO anon, service_role USING (true) WITH CHECK (true);
END $$;

-- ---------------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------------

INSERT INTO shops (id, shop_name, virtual_number, owner_whatsapp, owner_email,
                   default_language, monthly_plan, is_active, whatsapp_enabled,
                   owner_password, open_time, close_time)
VALUES
  ('shop_101', 'Lahore Burger House', '0301-1111111', '0300-1111111', 'burger@example.com',
   'ur', 5000, TRUE, TRUE, 'burger123', '11:00', '23:00'),
  ('shop_102', 'Karachi Cloth House', '0301-2222222', '0300-2222222', 'cloth@example.com',
   'en', 3000, TRUE, TRUE, 'cloth123', '10:00', '22:00')
ON CONFLICT (id) DO UPDATE SET
  shop_name = EXCLUDED.shop_name,
  virtual_number = EXCLUDED.virtual_number,
  owner_whatsapp = EXCLUDED.owner_whatsapp,
  owner_email = EXCLUDED.owner_email,
  default_language = EXCLUDED.default_language,
  monthly_plan = EXCLUDED.monthly_plan,
  owner_password = EXCLUDED.owner_password,
  open_time = EXCLUDED.open_time,
  close_time = EXCLUDED.close_time;

-- Burger shop menu (shop_101)
INSERT INTO products (shop_id, product_name, price, stock, category, is_available)
VALUES
  ('shop_101', 'Zinger Burger', 350, 50, 'Burgers', TRUE),
  ('shop_101', 'Beef Burger',   450, 30, 'Burgers', TRUE),
  ('shop_101', 'Fries',         200, 100, 'Sides',  TRUE),
  ('shop_101', 'Cold Drink',    120, 200, 'Drinks', TRUE),
  ('shop_101', 'Shawarma',      280, 40, 'Wraps',  TRUE),
  ('shop_101', 'Loaded Fries',  400, 25, 'Sides',  TRUE)
ON CONFLICT DO NOTHING;

-- Cloth shop menu (shop_102)
INSERT INTO products (shop_id, product_name, price, stock, category, is_available)
VALUES
  ('shop_102', 'Lawn Suit',      2500, 60, 'Women', TRUE),
  ('shop_102', 'Cotton Kurta',   1800, 80, 'Men',   TRUE),
  ('shop_102', 'Jeans',          2200, 50, 'Men',   TRUE),
  ('shop_102', 'T-Shirt',         900, 120, 'Men',  TRUE),
  ('shop_102', 'Dupatta',         600, 150, 'Women', TRUE),
  ('shop_102', 'Shalwar Kameez', 2800, 45, 'Men',   TRUE)
ON CONFLICT DO NOTHING;

-- Customers
INSERT INTO customers (shop_id, phone_number, customer_name, address, preferred_language)
VALUES
  ('shop_101', '0321-5551234', 'Ahmed Raza',  'House 12, DHA Phase 5, Lahore', 'ur'),
  ('shop_102', '0333-7778888', 'Fatima Khan', 'Flat 4, Gulshan-e-Iqbal, Karachi', 'en')
ON CONFLICT (shop_id, phone_number) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  address = EXCLUDED.address,
  preferred_language = EXCLUDED.preferred_language;

-- Orders (one pending, one confirmed, one delivered)
INSERT INTO orders (shop_id, customer_phone, customer_name, items, total_amount, status)
VALUES
  ('shop_101', '0321-5551234', 'Ahmed Raza',
   '[{"product_name":"Zinger Burger","qty":2,"price":350},{"product_name":"Cold Drink","qty":2,"price":120}]',
   940, 'pending'),
  ('shop_101', '0321-5551234', 'Ahmed Raza',
   '[{"product_name":"Shawarma","qty":3,"price":280}]',
   840, 'confirmed'),
  ('shop_102', '0333-7778888', 'Fatima Khan',
   '[{"product_name":"Lawn Suit","qty":1,"price":2500},{"product_name":"Dupatta","qty":2,"price":600}]',
   3700, 'delivered')
ON CONFLICT DO NOTHING;

-- Payment rows (one paid, one pending)
INSERT INTO payments (shop_id, amount, month, status, paid_at)
VALUES
  ('shop_101', 5000, '2026-09', 'paid',    NOW() - INTERVAL '30 days'),
  ('shop_102', 3000, '2026-10', 'pending', NULL)
ON CONFLICT DO NOTHING;

-- Default API-key settings rows (fill values in super-admin API Keys page)
INSERT INTO settings (key, value) VALUES
  ('twilio_account_sid', ''),
  ('twilio_auth_token', ''),
  ('twilio_whatsapp_number', ''),
  ('vapi_api_key', ''),
  ('whatsapp_cloud_api_token', ''),
  ('whatsapp_phone_number_id', ''),
  ('printnode_api_key', '')
ON CONFLICT (key) DO NOTHING;
