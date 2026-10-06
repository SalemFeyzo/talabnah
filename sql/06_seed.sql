-- ==================================================
-- Talabnah Seed Data
-- ==================================================

-- الأقسام الأولية
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