# Talabnah SQL Deployment

مجموعة ملفات SQL كاملة لنشر تطبيق طلبناه.

## 📋 الترتيب

يجب تشغيل الملفات **بالترتيب** على مشروع Supabase جديد:

| #   | الملف              | الوصف                                        |
| --- | ------------------ | -------------------------------------------- |
| 1   | `01_schema.sql`    | ENUMs + الجداول + الفهارس + Triggers التحديث |
| 2   | `02_functions.sql` | كل الدوال + Triggers                         |
| 3   | `03_rls.sql`       | سياسات RLS                                   |
| 4   | `04_storage.sql`   | Bucket + سياسات التخزين                      |
| 5   | `05_realtime.sql`  | تفعيل Realtime                               |
| 6   | `06_seed.sql`      | البيانات الأولية (الأقسام)                   |

## 🚀 الاستخدام السريع

### الطريقة (أ) — ملف واحد:

1. افتح Supabase → SQL Editor
2. الصق محتوى `DEPLOY_ALL.sql`
3. اضغط **Run**

### الطريقة (ب) — ملفات منفصلة:

طبّق كل ملف بالترتيب `01` → `06`.

## ⚠️ ملاحظات مهمة

### Storage:

- يجب إنشاء bucket `store-assets` **يدوياً** من Supabase Dashboard → Storage
- ثم طبّق `04_storage.sql` للسياسات

### ترقية إلى ADMIN:

بعد التسجيل، شغّل:

```sql
UPDATE public.profiles
SET role = 'ADMIN'
WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL');
```
