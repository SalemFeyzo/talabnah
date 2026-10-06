-- ==================================================
-- Talabnah Schema (Fixed Version)
-- ENUMs + Tables + Indexes + updated_at Triggers
-- ==================================================

-- ==================================================
-- 0. Extensions
-- ==================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================================================
-- 1. ENUMs (using catalog check instead of DO block)
-- ==================================================

-- user_role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type 
    JOIN pg_namespace n ON n.oid = pg_type.typnamespace
    WHERE typname = 'user_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.user_role AS ENUM (
      'CLIENT',
      'DRIVER',
      'MERCHANT',
      'MERCHANT_STAFF',
      'SYSTEM_STAFF',
      'ADMIN'
    );
  END IF;
END $$;

-- staff_permission
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type 
    JOIN pg_namespace n ON n.oid = pg_type.typnamespace
    WHERE typname = 'staff_permission' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.staff_permission AS ENUM (
      'READ_ONLY',
      'MANAGE_ORDERS',
      'MANAGE_USERS',
      'FULL_ACCESS'
    );
  END IF;
END $$;

-- order_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type 
    JOIN pg_namespace n ON n.oid = pg_type.typnamespace
    WHERE typname = 'order_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.order_status AS ENUM (
      'PENDING',
      'PREPARING',
      'READY',
      'ON_THE_WAY',
      'DELIVERED',
      'CANCELLED'
    );
  END IF;
END $$;

-- ==================================================
-- 2. Tables (in dependency order)
-- ==================================================

-- 2.1 profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT UNIQUE,
  role public.user_role NOT NULL DEFAULT 'CLIENT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 merchants
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 merchant_staff
CREATE TABLE IF NOT EXISTS public.merchant_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  can_manage_products BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_orders BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 system_staff
CREATE TABLE IF NOT EXISTS public.system_staff (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  department TEXT,
  job_title TEXT NOT NULL,
  permission public.staff_permission NOT NULL DEFAULT 'READ_ONLY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 drivers
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL,
  license_plate TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8 addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'المنزل',
  address_line TEXT NOT NULL,
  details TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9 orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'PENDING',
  total_amount NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.10 order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.11 order_status_history
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================================================
-- 3. Missing columns (for existing tables)
-- ==================================================

-- orders: أعمدة v2
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- products: category_id
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- merchants: category_id
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- ==================================================
-- 4. Indexes
-- ==================================================

CREATE INDEX IF NOT EXISTS idx_addresses_client ON public.addresses(client_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_status_history_order ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_products_merchant ON public.products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_client ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON public.orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON public.orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_merchant_staff_merchant ON public.merchant_staff(merchant_id);

-- ==================================================
-- 5. updated_at Trigger Function
-- ==================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_merchants_updated_at ON public.merchants;
CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();