-- ==================================================
-- Talabnah RLS Policies
-- ==================================================

-- ==================================================
-- 1. Enable RLS
-- ==================================================

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

-- ==================================================
-- 2. PROFILES
-- ==================================================

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ==================================================
-- 3. CATEGORIES
-- ==================================================

DROP POLICY IF EXISTS "categories_read_all" ON public.categories;
CREATE POLICY "categories_read_all" ON public.categories
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "categories_admin_write" ON public.categories;
CREATE POLICY "categories_admin_write" ON public.categories
  FOR ALL USING (public.is_admin());

-- ==================================================
-- 4. MERCHANTS
-- ==================================================

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

-- ==================================================
-- 5. MERCHANT_STAFF
-- ==================================================

DROP POLICY IF EXISTS "merchant_staff_read" ON public.merchant_staff;
CREATE POLICY "merchant_staff_read" ON public.merchant_staff
  FOR SELECT USING (
    merchant_id IN (
      SELECT id FROM public.merchants WHERE owner_id = auth.uid()
    )
    OR profile_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "merchant_staff_insert" ON public.merchant_staff;
CREATE POLICY "merchant_staff_insert" ON public.merchant_staff
  FOR INSERT WITH CHECK (
    merchant_id IN (
      SELECT id FROM public.merchants WHERE owner_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "merchant_staff_update" ON public.merchant_staff;
CREATE POLICY "merchant_staff_update" ON public.merchant_staff
  FOR UPDATE USING (
    merchant_id IN (
      SELECT id FROM public.merchants WHERE owner_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "merchant_staff_delete" ON public.merchant_staff;
CREATE POLICY "merchant_staff_delete" ON public.merchant_staff
  FOR DELETE USING (
    merchant_id IN (
      SELECT id FROM public.merchants WHERE owner_id = auth.uid()
    )
    OR public.is_admin()
  );

-- ==================================================
-- 6. PRODUCTS
-- ==================================================

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

-- ==================================================
-- 7. ADDRESSES
-- ==================================================

DROP POLICY IF EXISTS "addresses_owner_all" ON public.addresses;
CREATE POLICY "addresses_owner_all" ON public.addresses
  FOR ALL USING (client_id = auth.uid() OR public.is_admin());

-- ==================================================
-- 8. ORDERS
-- ==================================================

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

-- الكابتن يرى الطلبات الجاهزة غير المعيّنة
DROP POLICY IF EXISTS "orders_drivers_read_available" ON public.orders;
CREATE POLICY "orders_drivers_read_available" ON public.orders
  FOR SELECT USING (
    status = 'READY'
    AND driver_id IS NULL
    AND public.is_driver()
  );

DROP POLICY IF EXISTS "orders_participants_update" ON public.orders;
CREATE POLICY "orders_participants_update" ON public.orders
  FOR UPDATE USING (
    client_id = auth.uid()
    OR public.is_merchant_owner(merchant_id)
    OR driver_id = auth.uid()
    OR (
      status = 'READY'
      AND driver_id IS NULL
      AND public.is_driver()
    )
    OR public.is_admin()
  );

-- ==================================================
-- 9. ORDER_ITEMS
-- ==================================================

DROP POLICY IF EXISTS "order_items_read_participants" ON public.order_items;
CREATE POLICY "order_items_read_participants" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE client_id = auth.uid()
         OR public.is_merchant_owner(merchant_id)
         OR driver_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "order_items_client_insert" ON public.order_items;
CREATE POLICY "order_items_client_insert" ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE client_id = auth.uid())
  );

-- ==================================================
-- 10. ORDER_STATUS_HISTORY
-- ==================================================

DROP POLICY IF EXISTS "status_history_read" ON public.order_status_history;
CREATE POLICY "status_history_read" ON public.order_status_history
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE client_id = auth.uid()
         OR public.is_merchant_owner(merchant_id)
         OR driver_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "status_history_insert" ON public.order_status_history;
CREATE POLICY "status_history_insert" ON public.order_status_history
  FOR INSERT WITH CHECK (changed_by = auth.uid());

-- ==================================================
-- 11. DRIVERS
-- ==================================================

DROP POLICY IF EXISTS "drivers_read_own" ON public.drivers;
CREATE POLICY "drivers_read_own" ON public.drivers
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "drivers_self_update" ON public.drivers;
CREATE POLICY "drivers_self_update" ON public.drivers
  FOR UPDATE USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "drivers_self_insert" ON public.drivers;
CREATE POLICY "drivers_self_insert" ON public.drivers
  FOR INSERT WITH CHECK (id = auth.uid());

-- ==================================================
-- 12. SYSTEM_STAFF
-- ==================================================

DROP POLICY IF EXISTS "system_staff_admin_only" ON public.system_staff;
CREATE POLICY "system_staff_admin_only" ON public.system_staff
  FOR ALL USING (public.is_admin());