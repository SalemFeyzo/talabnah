-- ==================================================
-- Talabnah Functions & Triggers
-- ==================================================

-- ==================================================
-- 1. Auto-create profile on user signup
-- ==================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'CLIENT'
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================================================
-- 2. Helper functions (SECURITY DEFINER — تجنّب recursion)
-- ==================================================

-- جلب دور المستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- هل المستخدم الحالي أدمن؟
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(public.get_my_role() = 'ADMIN', FALSE);
$$;

-- هل المستخدم الحالي كابتن؟
CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(public.get_my_role() = 'DRIVER', FALSE);
$$;

-- هل المستخدم الحالي مالك متجر معيّن؟
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

-- ==================================================
-- 3. Search user by phone (للتاجر — يتجاوز RLS)
-- ==================================================

CREATE OR REPLACE FUNCTION public.find_user_by_phone(phone_variants text[])
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  role user_role
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.phone, p.role
  FROM public.profiles p
  WHERE p.phone = ANY(phone_variants)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_user_by_phone(text[]) TO authenticated;

-- اقتراحات عند عدم العثور
CREATE OR REPLACE FUNCTION public.suggest_users_by_phone_suffix(suffix text)
RETURNS TABLE (full_name text, phone text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.full_name, p.phone
  FROM public.profiles p
  WHERE p.phone ILIKE '%' || suffix || '%'
  LIMIT 3;
$$;

GRANT EXECUTE ON FUNCTION public.suggest_users_by_phone_suffix(text) TO authenticated;

-- ==================================================
-- 4. Set user role (مع تحقق من الصلاحيات)
-- ==================================================

CREATE OR REPLACE FUNCTION public.set_user_role(
  target_user_id uuid,
  new_role user_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role user_role;
BEGIN
  SELECT role INTO caller_role
  FROM public.profiles
  WHERE id = auth.uid();

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

-- ==================================================
-- 5. Order status history trigger
-- ==================================================

CREATE OR REPLACE FUNCTION public.log_order_status_change()
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
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();