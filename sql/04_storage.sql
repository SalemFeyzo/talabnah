-- ==================================================
-- Talabnah Storage Policies
-- ⚠️ يجب إنشاء bucket "store-assets" يدوياً من Dashboard
-- أو استخدم INSERT أدناه (يتطلب صلاحيات عالية)
-- ==================================================

-- إنشاء Bucket (اختياري — إذا لم يُنشأ يدوياً)
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- ==================================================
-- Policies على storage.objects
-- ==================================================

-- قراءة عامة
DROP POLICY IF EXISTS "store_assets_public_read" ON storage.objects;
CREATE POLICY "store_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-assets');

-- التاجر يرفع في مجلده فقط: merchants/{user_id}/...
DROP POLICY IF EXISTS "store_assets_owner_insert" ON storage.objects;
CREATE POLICY "store_assets_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'store-assets'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

DROP POLICY IF EXISTS "store_assets_owner_update" ON storage.objects;
CREATE POLICY "store_assets_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'store-assets'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

DROP POLICY IF EXISTS "store_assets_owner_delete" ON storage.objects;
CREATE POLICY "store_assets_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'store-assets'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );