# Changelog

جميع التغييرات المهمة في مشروع **طلبنا (Talabnah)** موثقة هنا.
التنسيق مبني على [Keep a Changelog](https://keepachangelog.com/)، والمشروع يتبع [Semantic Versioning](https://semver.org/).

---

## [0.0.1] — 2026-10-04 — MVP الأولي (رحلة 3 أيام)

### 🎯 الهدف

بناء MVP كامل لتطبيق توصيل يعمل end-to-end (عميل → تاجر) خلال 3 أيام × 3 ساعات، بواجهة Responsive (ويب + موبايل) ودعم RTL كامل.

---

### ✨ Added — قاعدة البيانات

- **جداول جديدة** في Supabase:
  - `categories` — تصنيفات المتاجر والمنتجات
  - `addresses` — عناوين العملاء
  - `order_items` — عناصر الطلب (snapshot للمنتجات)
  - `order_status_history` — سجل تغييرات حالة الطلب
- **أعمدة جديدة**:
  - `orders`: `address_id`, `notes`, `delivery_fee`
  - `products`: `category_id`
  - `merchants`: `category_id`
- **دوال SQL آمنة** (بدون recursion):
  - `get_my_role()` — جلب دور المستخدم الحالي
  - `is_admin()` — التحقق من صلاحية الأدمن
  - `is_merchant_owner(m_id)` — التحقق من ملكية متجر
- **RLS Policies كاملة** لكل الجداول (11 جدول)
- **Trigger** `trg_log_order_status` — تسجيل تلقائي لتغييرات الحالة
- **بيانات أولية**: 14 قسم عربي (فواكه، خضروات، بقوليات، معجنات، ألبان، لحوم، مواد غذائية، مشروبات، مطاعم، منظفات، العناية الشخصية، أدوات منزلية، قرطاسية، مخبوزات)
- **Bucket Storage**: `store-assets` + 4 سياسات (read, insert, update, delete)
- **Realtime**: تفعيل على جدول `orders`
- **توليد** `database.types.ts` محدّث من Supabase CLI

### ✨ Added — نظام التصميم

- **`constants/colors.ts`** — نظام ألوان كامل مستخرج من صور الهوية:
  - `primary` (أخضر داكن) — `#1B4332`, `#0D2B1F`, `#2D6A4F`, `#D8F3DC`
  - `gold` (ذهبي) — `#D4A24C`, `#B8862E`, `#E8C77B`, `#FDF6E3`
  - `background`, `text`, `status`, `border`, `gray`
  - `OrderStatusColors` — ألوان لكل حالة طلب
- **`constants/spacing.ts`** — Spacing, Radius, Shadow, Layout
- **`constants/typography.ts`** — FontFamily, FontSize, FontWeight, TextPreset

### ✨ Added — Hooks

- **`hooks/use-responsive.ts`** — كشف نوع الجهاز (mobile/tablet/desktop) + عدد الأعمدة للشبكة

### ✨ Added — Contexts

- **`context/ViewModeContext.tsx`** — نظام تبديل وضع العرض (محفوظ في AsyncStorage)
- **`context/CartContext.tsx`** — سلة تسوق كاملة مع:
  - `addItem`, `removeItem`, `updateQuantity`, `clearCart`
  - منع خلط منتجات من متاجر مختلفة
  - حساب تلقائي للمجاميع

### ✨ Added — Types

- **`types/index.ts`** — Barrel export
- **`types/merchant.ts`** — Merchant, CreateStoreInput, UpdateStoreInput
- **`types/product.ts`** — Product, ProductInsert, ProductUpdate, Category
- **`types/order.ts`** — Order, OrderItem, OrderStatus, CreateOrderInput
- **`types/cart.ts`** — CartItem, Cart, CartTotals
- **`types/address.ts`** — Address, AddressInsert, AddressUpdate

### ✨ Added — Services

- **`services/merchant.ts`**:
  - `getMyMerchant`, `listActive`, `getById`, `listByCategory`
  - `convertClientToMerchant` (يحدّث role + ينشئ/يحدّث المتجر)
  - `promoteToMerchant`, `demoteToClient` (للتبديل)
  - `updateStore`, `toggleActive`
- **`services/product.ts`**:
  - `listCategories`, `getCategoryById`
  - `listAvailable`, `listPopular`, `listByCategory`, `listByMerchant`, `listAllByMerchant`
  - `getById`, `search`
  - `create`, `update`, `toggleAvailable`, `remove`
- **`services/order.ts`**:
  - `create` (طلب + عناصره)
  - `listMine`, `listByMerchant`, `getById`, `getMerchantOrderDetails`
  - `updateStatus`, `getMerchantStats`
  - `subscribeMerchantOrders` (Realtime مع اسم قناة فريد)
- **`services/address.ts`** — CRUD للعناوين + `setDefault`

### ✨ Added — Utils

- **`utils/storage.ts`** — رفع الصور لـ Supabase Storage:
  - **الويب**: Blob مباشرة
  - **الموبايل**: `File` API الجديد → Base64 → ArrayBuffer
- **`utils/confirm.ts`** — `showConfirm` و `showAlert` متوافقان مع:
  - **الويب**: `window.confirm` / `window.alert`
  - **الموبايل**: `Alert.alert` الأصلي

### ✨ Added — مكونات UI

- **`components/ui/AppButton.tsx`** — 5 variants: primary, gold, outline, ghost, danger
- **`components/ui/AppCard.tsx`** — بطاقة مع padding/ظل/حدود اختيارية
- **`components/ui/AppInput.tsx`** — حقل إدخال مع label/error/hint/icons
- **`components/ui/AppBadge.tsx`** — Badge + StatusBadge
- **`components/ui/AppEmptyState.tsx`** — حالة فارغة مع أيقونة + زر
- **`components/ui/AppLoader.tsx`** — مؤشر تحميل
- **`components/ui/index.ts`** — Barrel export

### ✨ Added — مكونات Layout

- **`components/layout/ScreenContainer.tsx`** — حاوية موحّدة (SafeArea + maxWidth + padding)
- **`components/layout/ResponsiveGrid.tsx`** — شبكة متجاوبة (2/3/4 أعمدة تلقائياً)
- **`components/layout/index.ts`** — Barrel export

### ✨ Added — مكونات المجال

- **`components/domain/ProductCard.tsx`** — بطاقة منتج (شبكة)
- **`components/domain/CategoryCard.tsx`** — بطاقة قسم (دائرة)
- **`components/domain/StoreCard.tsx`** — بطاقة متجر (أفقي/عمودي)
- **`components/domain/OrderCard.tsx`** — بطاقة طلب
- **`components/domain/CartItem.tsx`** — عنصر سلة مع +/-/حذف
- **`components/domain/index.ts`** — Barrel export

### ✨ Added — واجهة العميل `(client)`

- **`_layout.tsx`** — 5 تبويبات + 5 شاشات مخفية (`href: null`)
- **`index.tsx`** — الرئيسية: Header + Hero + أقسام + متاجر + منتجات مميزة
- **`categories.tsx`** — شبكة الأقسام
- **`category/[id].tsx`** — تفاصيل قسم + منتجاته
- **`store/[id].tsx`** — تفاصيل متجر + منتجاته
- **`product/[id].tsx`** — تفاصيل منتج + Quantity + إضافة للسلة
- **`cart.tsx`** — السلة الكاملة
- **`checkout.tsx`** — عناوين + دفع + ملاحظات + تأكيد الطلب
- **`orders.tsx`** — طلباتي مع Pull to refresh
- **`order/[id].tsx`** — تفاصيل الطلب + Timeline للحالة
- **`settings.tsx`** — بيانات + تبديل لتاجر + تفضيلات + خروج

### ✨ Added — لوحة التاجر `(merchant)`

- **`_layout.tsx`** — 3 تبويبات + شاشات مخفية
- **`index.tsx`** — Dashboard: إحصائيات + Realtime + أدوات الإدارة
- **`setup-store.tsx`** — إنشاء متجر + رفع شعار
- **`products.tsx`** — CRUD كامل + رفع صور + بحث + Pull to refresh
- **`orders.tsx`** — قائمة طلبات + فلاتر حسب الحالة + Realtime
- **`order/[id].tsx`** — تفاصيل طلب + بيانات العميل + تغيير الحالة (optimistic)
- **`product-form.tsx`** — (stub)

### ✨ Added — شاشات المصادقة `(auth)`

- **`_layout.tsx`** — Redirect حسب role + viewMode مع فحص صلاحيات
- **`login.tsx`** — تصميم جديد بهوية طلبنا (خلفية خضراء + شعار ذهبي)
- **`register.tsx`** — تصميم جديد + Terms

### ✨ Added — شاشة التوجيه الذكية

- **`src/app/index.tsx`** — Router ذكي يوزّع المستخدم حسب:
  1. `viewMode` (إن وُجد ومسموح)
  2. `role` (كـ fallback)
  3. غير مسجّل → login

---

### 🔧 Fixed — إصلاحات جوهرية

- **SQL recursion**: `has_role` كانت تُنشئ حلقة لا نهائية داخل RLS على `profiles` → استُبدلت بـ `is_admin()` + `get_my_role()` مع `SECURITY DEFINER`
- **`talabnah_v2` غير مطبّق**: طُبّق مع استخدام `IF NOT EXISTS` و `DROP POLICY IF EXISTS`
- **`useViewMode must be used within Provider`**: تحديث `_layout.tsx` الجذر ليشمل `ViewModeProvider`
- **ظهور شاشات مخفية كـ Tabs**: إضافة `href: null` لكل شاشة فرعية
- **اختفاء التابس على الويب**: حذف `app/index.tsx` القديم + تبسيط RootLayout
- **إعادة تحميل الصفحة → admin**: إنشاء `app/index.tsx` ذكي يوزّع حسب role
- **Rules of Hooks**: نقل كل `useHooks` فوق الـ `return` الشرطية في `MerchantDashboard`
- **`role` لا يتغير عند التبديل**: إضافة `promoteToMerchant` + `demoteToClient` في `merchant.ts`
- **`Alert.alert` لا يعمل على الويب**: إنشاء `utils/confirm.ts` وتطبيقه على 5 شاشات
- **رفع الصور على الويب**: استخدام Blob مباشرة بدل ArrayBuffer
- **Realtime crash**: أسماء قنوات فريدة + `setTimeout(0)` + `mounted` flag
- **الحالة لا تتغير فوراً**: Optimistic update + تأجيل `showAlert` بـ `setTimeout`
- **`MediaTypeOptions` deprecated** (SDK 57): استخدام `mediaTypes: ["images"]`
- **`blob.arrayBuffer()` غير مدعوم في RN**: استخدام `File` API الجديد
- **`file.base64()` يُعيد Promise**: إضافة `await`
- **`readAsStringAsync` deprecated** (SDK 54+): استُبدل بـ `File` class
- **`Cannot find name 'signOut'`**: إضافة `signOut` من `useAuth()` في `settings.tsx`

---

### 🎨 Changed

- استبدال كامل لـ `NativeWind` بـ `StyleSheet.create` (لضمان ظهور التنسيقات على كل المنصات)
- إعادة تصميم شاشات المصادقة (Login, Register) بهوية طلبنا
- إعادة تصميم `settings.tsx` (بطاقة بروفايل + أقسام منظمة + زر تبديل بارز)
- تحويل `(client)/_layout.tsx` من 3 تبويبات إلى 5 (index, categories, cart, orders, settings)
- تحديث `merchantService` — دمج `updateStore` مع `updated_at` تلقائي (يُدار بواسطة Trigger)

---

### 🗑️ Removed

- حذف `app/index.tsx` القديم (شاشة Loader)
- حذف `import "../global.css"` من `_layout.tsx` (لم يكن NativeWind مُفعّلاً)
- حذف `Alert.alert` من 5 شاشات واستبدالها بـ `utils/confirm.ts`
- حذف `getProducts` القديم من `merchantService` (استُبدل بـ `listAllByMerchant` في `productService`)

---

### 📦 Dependencies Added

- `expo-image-picker` (~57.0.20) — اختيار الصور
- `expo-file-system` — قراءة الملفات على الموبايل

### 📦 Dependencies موجودة مسبقاً (استُخدمت)

- `@supabase/supabase-js`
- `expo-router`
- `lucide-react-native` + `@expo/vector-icons`
- `expo-image`
- `@react-native-async-storage/async-storage`

---

### 🧪 Known Issues

- ⚠️ تحذير `shadow*` deprecated على الويب — يحتاج `boxShadow` (تحذير فقط، لا يضر)
- ⚠️ `Tunnel connection closed` — استخدم LAN بدلاً من tunnel
- ⚠️ الحزم الكبيرة على الموبايل قد تُبطئ الرفع — يُنصح بـ `expo-blob` لاحقاً

---

### 🚧 Not Included (مؤجّل للمرحلة 2)

- ❌ تطبيق الكابتن `(driver)`
- ❌ لوحة الأدمن `(admin)`
- ❌ تتبع GPS حقيقي
- ❌ نظام التقييمات
- ❌ إشعارات Push
- ❌ محادثات
- ❌ كوبونات الخصم
- ❌ تقارير متقدمة

---

## [Unreleased] — المرحلة القادمة

انظر `ROADMAP.md` للتفاصيل الكاملة.
