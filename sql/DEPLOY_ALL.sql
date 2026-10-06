-- ==================================================
-- Talabnah — Complete Deployment Script
-- نسخة واحدة تشمل كل الملفات 01 → 06
-- ==================================================
-- 
-- طريقة الاستخدام:
-- 1. افتح Supabase → SQL Editor
-- 2. الصق كل هذا الملف
-- 3. اضغط Run
-- 4. تأكد من إنشاء bucket "store-assets" يدوياً
-- 5. رقّي نفسك إلى ADMIN يدوياً (انظر النهاية)
-- ==================================================

-- ══════════════════════════════════════════════════
-- PART 1: SCHEMA
-- ══════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('CLIENT', 'DRIVER', 'MERCHANT', 'MERCHANT_STAFF', 'SYSTEM_STAFF', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE staff_permission AS ENUM ('READ_ONLY', 'MANAGE_ORDERS', 'MANAGE_USERS', 'FULL_ACCESS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('PENDING', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  role user_role NOT NULL DEFAULT 'CLIENT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.merchant_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  can_manage_products BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_orders BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_staff (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  department TEXT,
  job_title TEXT NOT NULL,
  permission staff_permission NOT NULL DEFAULT 'READ_ONLY',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL,
  license_plate TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'PENDING',
  total_amount NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- ══════════════════════════════════════════════════
-- PART 2: FUNCTIONS
-- ══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_merchants_updated_at ON public.merchants;
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'phone', ''),
      NULLIF(NEW.raw_user_meta_data->>'phone_number', ''),
      NULL
    ),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'CLIENT')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE(public.get_my_role() = 'ADMIN', FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE(public.get_my_role() = 'DRIVER', FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_merchant_owner(m_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.merchants WHERE id = m_id AND owner_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.find_user_by_phone(phone_variants text[])
RETURNS TABLE (id uuid, full_name text, phone text, role user_role)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT p.id, p.full_name, p.phone, p.role
  FROM public.profiles p
  WHERE p.phone = ANY(phone_variants)
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.find_user_by_phone(text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.suggest_users_by_phone_suffix(suffix text)
RETURNS TABLE (full_name text, phone text)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT p.full_name, p.phone FROM public.profiles p
  WHERE p.phone ILIKE '%' || suffix || '%' LIMIT 3;
$$;
GRANT EXECUTE ON FUNCTION public.suggest_users_by_phone_suffix(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id uuid, new_role user_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE caller_role user_role;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role = 'ADMIN' THEN
    UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
  ELSIF caller_role = 'MERCHANT' THEN
    IF new_role IN ('MERCHANT_STAFF', 'CLIENT') THEN
      UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
    ELSE
      RAISE EXCEPTION 'صاحب المتجر يمكنه تعيين موظف متجر أو عميل فقط';
    END IF;
  ELSE
    RAISE EXCEPTION 'ليس لديك صلاحية لتغيير الأدوار';
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, user_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.order_status_history(order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_order_status ON public.orders;
CREATE TRIGGER trg_log_order_status AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- ══════════════════════════════════════════════════
-- PART 3: RLS
-- ══════════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "categories_read_all" ON public.categories;
CREATE POLICY "categories_read_all" ON public.categories FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "categories_admin_write" ON public.categories;
CREATE POLICY "categories_admin_write" ON public.categories FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "merchants_read_active" ON public.merchants;
CREATE POLICY "merchants_read_active" ON public.merchants FOR SELECT
  USING (is_active = TRUE OR owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "merchants_owner_update" ON public.merchants;
CREATE POLICY "merchants_owner_update" ON public.merchants FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "merchants_owner_insert" ON public.merchants;
CREATE POLICY "merchants_owner_insert" ON public.merchants FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "merchant_staff_read" ON public.merchant_staff;
CREATE POLICY "merchant_staff_read" ON public.merchant_staff FOR SELECT
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid())
    OR profile_id = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS "merchant_staff_insert" ON public.merchant_staff;
CREATE POLICY "merchant_staff_insert" ON public.merchant_staff FOR INSERT
  WITH CHECK (
    merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "merchant_staff_update" ON public.merchant_staff;
CREATE POLICY "merchant_staff_update" ON public.merchant_staff FOR UPDATE
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "merchant_staff_delete" ON public.merchant_staff;
CREATE POLICY "merchant_staff_delete" ON public.merchant_staff FOR DELETE
  USING (
    merchant_id IN (SELECT id FROM public.merchants WHERE owner_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "products_read_available" ON public.products;
CREATE POLICY "products_read_available" ON public.products FOR SELECT
  USING (is_available = TRUE OR public.is_merchant_owner(merchant_id) OR public.is_admin());

DROP POLICY IF EXISTS "products_owner_write" ON public.products;
CREATE POLICY "products_owner_write" ON public.products FOR ALL
  USING (public.is_merchant_owner(merchant_id) OR public.is_admin());

DROP POLICY IF EXISTS "addresses_owner_all" ON public.addresses;
CREATE POLICY "addresses_owner_all" ON public.addresses FOR ALL
  USING (client_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "orders_read_participants" ON public.orders;
CREATE POLICY "orders_read_participants" ON public.orders FOR SELECT
  USING (
    client_id = auth.uid()
    OR public.is_merchant_owner(merchant_id)
    OR driver_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "orders_client_insert" ON public.orders;
CREATE POLICY "orders_client_insert" ON public.orders FOR INSERT
  WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "orders_drivers_read_available" ON public.orders;
CREATE POLICY "orders_drivers_read_available" ON public.orders FOR SELECT
  USING (status = 'READY' AND driver_id IS NULL AND public.is_driver());

DROP POLICY IF EXISTS "orders_participants_update" ON public.orders;
CREATE POLICY "orders_participants_update" ON public.orders FOR UPDATE
  USING (
    client_id = auth.uid()
    OR public.is_merchant_owner(merchant_id)
    OR driver_id = auth.uid()
    OR (status = 'READY' AND driver_id IS NULL AND public.is_driver())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "order_items_read_participants" ON public.order_items;
CREATE POLICY "order_items_read_participants" ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE client_id = auth.uid()
         OR public.is_merchant_owner(merchant_id)
         OR driver_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "order_items_client_insert" ON public.order_items;
CREATE POLICY "order_items_client_insert" ON public.order_items FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE client_id = auth.uid()));

DROP POLICY IF EXISTS "status_history_read" ON public.order_status_history;
CREATE POLICY "status_history_read" ON public.order_status_history FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE client_id = auth.uid()
         OR public.is_merchant_owner(merchant_id)
         OR driver_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "status_history_insert" ON public.order_status_history;
CREATE POLICY "status_history_insert" ON public.order_status_history FOR INSERT
  WITH CHECK (changed_by = auth.uid());

DROP POLICY IF EXISTS "drivers_read_own" ON public.drivers;
CREATE POLICY "drivers_read_own" ON public.drivers FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "drivers_self_update" ON public.drivers;
CREATE POLICY "drivers_self_update" ON public.drivers FOR UPDATE
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "drivers_self_insert" ON public.drivers;
CREATE POLICY "drivers_self_insert" ON public.drivers FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "system_staff_admin_only" ON public.system_staff;
CREATE POLICY "system_staff_admin_only" ON public.system_staff FOR ALL
  USING (public.is_admin());

-- ══════════════════════════════════════════════════
-- PART 4: STORAGE
-- ══════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

DROP POLICY IF EXISTS "store_assets_public_read" ON storage.objects;
CREATE POLICY "store_assets_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'store-assets');

DROP POLICY IF EXISTS "store_assets_owner_insert" ON storage.objects;
CREATE POLICY "store_assets_owner_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'store-assets'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

DROP POLICY IF EXISTS "store_assets_owner_update" ON storage.objects;
CREATE POLICY "store_assets_owner_update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'store-assets'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

DROP POLICY IF EXISTS "store_assets_owner_delete" ON storage.objects;
CREATE POLICY "store_assets_owner_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'store-assets'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- ══════════════════════════════════════════════════
-- PART 5: REALTIME
-- ══════════════════════════════════════════════════

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ══════════════════════════════════════════════════
-- PART 6: SEED DATA
-- ══════════════════════════════════════════════════

INSERT INTO public.categories (name, icon, sort_order) VALUES
  ('فواكه', 'apple', 1),
  ('خضروات', 'carrot', 2),
  ('بقوليات', 'beans', 3),
  ('معجنات', 'bread-slice', 4),
  ('ألبان وأجبان', 'cheese', 5),
  ('لحوم', 'food-steak', 6),
  ('مواد غذائية', 'basket', 7),
  ('مشروبات', 'cup', 8),
  ('مطاعم', 'silverware-fork-knife', 9),
  ('منظفات', 'spray-bottle', 10),
  ('العناية الشخصية', 'face-man-shimmer', 11),
  ('أدوات منزلية', 'pot-steam', 12),
  ('قرطاسية', 'notebook', 13),
  ('مخبوزات', 'cupcake', 14)
ON CONFLICT (name) DO NOTHING;

-- ══════════════════════════════════════════════════
-- DONE ✅
-- ══════════════════════════════════════════════════
-- 
-- 📌 الخطوات التالية:
-- 1. سجّل حساباً من التطبيق
-- 2. رقّي نفسك إلى ADMIN:
--    UPDATE public.profiles
--    SET role = 'ADMIN'
--    WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL');
-- 3. تحقق من إنشاء bucket "store-assets" في Dashboard
-- ══════════════════════════════════════════════════