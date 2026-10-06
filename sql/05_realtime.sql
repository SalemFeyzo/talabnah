-- ==================================================
-- Talabnah Realtime Publications
-- ==================================================

-- تفعيل Realtime على جدول orders
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- تفعيل Realtime على جدول drivers
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- (اختياري) تفعيل على products للعرض الحي
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;