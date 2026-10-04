-- ==================================================
-- Talabnah v2 — Fixed (no recursion)
-- ==================================================

-- --------------------------------------------------
-- 1. جداول جديدة
-- --------------------------------------------------

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_addresses_client ON public.addresses(client_id);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_status_history_order ON public.order_status_history(order_id);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- ربط المنتجات بالأقسام
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- ربط المتاجر بالأقسام  
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- --------------------------------------------------
-- 2. دوال مساعدة (تتجنب recursion)
-- --------------------------------------------------

-- جلب دور المستخدم الحالي (بدون استدعاء profiles داخل RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(public.get_my_role() = 'ADMIN', FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_merchant_owner(m_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.merchants
    WHERE id = m_id AND owner_id = auth.uid()
  );
$$;

-- --------------------------------------------------
-- 3. تفعيل RLS
-- --------------------------------------------------

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

-- --------------------------------------------------
-- 4. Policies
-- --------------------------------------------------

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- CATEGORIES (قراءة عامة، كتابة للأدمن)
DROP POLICY IF EXISTS "categories_read_all" ON public.categories;
CREATE POLICY "categories_read_all" ON public.categories
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "categories_admin_write" ON public.categories;
CREATE POLICY "categories_admin_write" ON public.categories
  FOR ALL USING (public.is_admin());

-- MERCHANTS
DROP POLICY IF EXISTS "merchants_read_active" ON public.merchants;
CREATE POLICY "merchants_read_active" ON public.merchants
  FOR SELECT USING (
    is_active = TRUE 
    OR owner_id = auth.uid() 
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "merchants_owner_update" ON public.merchants;
CREATE POLICY "merchants_owner_update" ON public.merchants
  FOR UPDATE USING (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "merchants_owner_insert" ON public.merchants;
CREATE POLICY "merchants_owner_insert" ON public.merchants
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- PRODUCTS
DROP POLICY IF EXISTS "products_read_available" ON public.products;
CREATE POLICY "products_read_available" ON public.products
  FOR SELECT USING (
    is_available = TRUE
    OR public.is_merchant_owner(merchant_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "products_owner_write" ON public.products;
CREATE POLICY "products_owner_write" ON public.products
  FOR ALL USING (
    public.is_merchant_owner(merchant_id)
    OR public.is_admin()
  );

-- ADDRESSES
DROP POLICY IF EXISTS "addresses_owner_all" ON public.addresses;
CREATE POLICY "addresses_owner_all" ON public.addresses
  FOR ALL USING (client_id = auth.uid() OR public.is_admin());

-- ORDERS
DROP POLICY IF EXISTS "orders_read_participants" ON public.orders;
CREATE POLICY "orders_read_participants" ON public.orders
  FOR SELECT USING (
    client_id = auth.uid()
    OR public.is_merchant_owner(merchant_id)
    OR driver_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "orders_client_insert" ON public.orders;
CREATE POLICY "orders_client_insert" ON public.orders
  FOR INSERT WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "orders_participants_update" ON public.orders;
CREATE POLICY "orders_participants_update" ON public.orders
  FOR UPDATE USING (
    client_id = auth.uid()
    OR public.is_merchant_owner(merchant_id)
    OR driver_id = auth.uid()
    OR public.is_admin()
  );

-- ORDER ITEMS
DROP POLICY IF EXISTS "order_items_read_participants" ON public.order_items;
CREATE POLICY "order_items_read_participants" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE client_id = auth.uid()
         OR public.is_merchant_owner(merchant_id)
         OR driver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_items_client_insert" ON public.order_items;
CREATE POLICY "order_items_client_insert" ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE client_id = auth.uid())
  );

-- ORDER STATUS HISTORY
DROP POLICY IF EXISTS "status_history_read" ON public.order_status_history;
CREATE POLICY "status_history_read" ON public.order_status_history
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE client_id = auth.uid()
         OR public.is_merchant_owner(merchant_id)
         OR driver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "status_history_insert" ON public.order_status_history;
CREATE POLICY "status_history_insert" ON public.order_status_history
  FOR INSERT WITH CHECK (changed_by = auth.uid());

-- DRIVERS
DROP POLICY IF EXISTS "drivers_read_own" ON public.drivers;
CREATE POLICY "drivers_read_own" ON public.drivers
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "drivers_self_update" ON public.drivers;
CREATE POLICY "drivers_self_update" ON public.drivers
  FOR UPDATE USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "drivers_self_insert" ON public.drivers;
CREATE POLICY "drivers_self_insert" ON public.drivers
  FOR INSERT WITH CHECK (id = auth.uid());

-- --------------------------------------------------
-- 5. Trigger: تسجيل تغيير الحالة
-- --------------------------------------------------
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.order_status_history(order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_order_status ON public.orders;
CREATE TRIGGER trg_log_order_status
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- --------------------------------------------------
-- 6. تصنيفات أولية
-- --------------------------------------------------
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