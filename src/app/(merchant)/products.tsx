// src/app/(merchant)/products.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout";
import { AppButton, AppEmptyState, AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { merchantService } from "@/services/merchant";
import { productService } from "@/services/product";
import type { Product } from "@/types";
import { showAlert, showConfirm } from "@/utils/confirm";
import { uploadImage } from "@/utils/storage";

type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  image_url: string | null;
  is_available: boolean;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  description: "",
  price: "",
  image_url: null,
  is_available: true,
};

export default function ProductsScreen() {
  const { user } = useAuth();

  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ============ Load ============
  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const m = await merchantService.getMyMerchant(user.id);
      if (!m) {
        setMerchantId(null);
        setProducts([]);
        return;
      }
      setMerchantId(m.id);
      const list = await productService.listAllByMerchant(m.id);
      setProducts(list);
    } catch (e) {
      console.error("Load products:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // ============ Search ============
  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  // ============ Toggle available ============
  const toggleAvailable = async (p: Product) => {
    try {
      const updated = await productService.toggleAvailable(
        p.id,
        p.is_available,
      );
      setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    } catch (e) {
      console.error("Toggle:", e);
      showAlert("خطأ", "تعذّر تحديث حالة المنتج");
    }
  };

  // ============ Delete ============
  const confirmDelete = (p: Product) => {
    showConfirm(
      "حذف المنتج",
      `هل تريد حذف "${p.name}"؟`,
      async () => {
        try {
          await productService.remove(p.id);
          setProducts((prev) => prev.filter((x) => x.id !== p.id));
        } catch (e) {
          console.error("Delete:", e);
          showAlert("خطأ", "تعذّر حذف المنتج");
        }
      },
      "حذف",
    );
  };

  // ============ Image Picker (✅ محدّث) ============
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showAlert("تنبيه", "نحتاج صلاحية الوصول للصور");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // ✅ الصيغة الجديدة
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setPickedImage(res.assets[0].uri);
    }
  };

  // ============ Open Modal ============
  const openCreate = () => {
    setDraft(EMPTY_DRAFT);
    setPickedImage(null);
    setModalVisible(true);
  };

  const openEdit = (p: Product) => {
    setDraft({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      image_url: p.image_url,
      is_available: p.is_available,
    });
    setPickedImage(null);
    setModalVisible(true);
  };

  // ============ Save ============
  const handleSave = async () => {
    if (!merchantId || !user?.id) return;

    const name = draft.name.trim();
    const price = Number(draft.price);

    if (!name) {
      showAlert("تنبيه", "أدخل اسم المنتج");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      showAlert("تنبيه", "أدخل سعراً صحيحاً");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = draft.image_url;
      if (pickedImage) {
        const uploaded = await uploadImage(
          pickedImage,
          `merchants/${user.id}/products`,
        );
        if (uploaded) imageUrl = uploaded;
      }

      if (draft.id) {
        const updated = await productService.update(draft.id, {
          name,
          description: draft.description.trim() || null,
          price,
          image_url: imageUrl,
          is_available: draft.is_available,
        });
        setProducts((prev) =>
          prev.map((x) => (x.id === draft.id ? updated : x)),
        );
      } else {
        const created = await productService.create({
          merchant_id: merchantId,
          name,
          description: draft.description.trim() || null,
          price,
          image_url: imageUrl,
          is_available: draft.is_available,
        });
        setProducts((prev) => [created, ...prev]);
      }

      setModalVisible(false);
      setDraft(EMPTY_DRAFT);
      setPickedImage(null);
    } catch (e: any) {
      console.error("Save product:", e);
      showAlert("خطأ", e?.message ?? "تعذّر حفظ المنتج");
    } finally {
      setSaving(false);
    }
  };

  // ============ Loading ============
  if (loading) return <AppLoader message="جاري التحميل..." />;

  // ============ No merchant ============
  if (!merchantId) {
    return (
      <ScreenContainer edges={["top"]}>
        <AppEmptyState
          title="لا يوجد متجر"
          message="أنشئ متجرك أولاً لإضافة منتجات."
        />
      </ScreenContainer>
    );
  }

  // ============ Main ============
  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المنتجات</Text>
        <Text style={styles.headerCount}>{products.length} منتج</Text>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.text.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث..."
            placeholderTextColor={Colors.text.muted}
            style={styles.searchInput}
            textAlign="right"
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardImageWrap}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.cardImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.cardImage, styles.placeholder]}>
                  <Ionicons
                    name="image-outline"
                    size={24}
                    color={Colors.text.muted}
                  />
                </View>
              )}
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.description ? (
                <Text style={styles.cardDesc} numberOfLines={1}>
                  {item.description}
                </Text>
              ) : null}
              <Text style={styles.cardPrice}>
                {Number(item.price).toFixed(2)} ل.س
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.switchWrap}>
                  <Switch
                    value={item.is_available}
                    onValueChange={() => toggleAvailable(item)}
                    trackColor={{
                      false: Colors.gray[300],
                      true: Colors.primary.main,
                    }}
                    thumbColor="#fff"
                  />
                  <Text style={styles.switchLabel}>
                    {item.is_available ? "متاح" : "غير متاح"}
                  </Text>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    onPress={() => openEdit(item)}
                    style={styles.iconBtn}
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={Colors.primary.main}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => confirmDelete(item)}
                    style={[styles.iconBtn, styles.iconBtnDanger]}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={Colors.status.error}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <AppEmptyState
            title="لا توجد منتجات"
            message="ابدأ بإضافة منتجك الأول."
            icon={
              <Ionicons
                name="cube-outline"
                size={64}
                color={Colors.text.muted}
              />
            }
          />
        }
      />

      <Pressable style={styles.fab} onPress={openCreate}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* ============ Modal ============ */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalCard}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {draft.id ? "تعديل المنتج" : "منتج جديد"}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.text.primary} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Pressable style={styles.imagePicker} onPress={pickImage}>
                {pickedImage || draft.image_url ? (
                  <Image
                    source={{ uri: pickedImage || draft.image_url! }}
                    style={styles.imagePreview}
                    contentFit="cover"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="camera-outline"
                      size={28}
                      color={Colors.text.muted}
                    />
                    <Text style={styles.imagePickerText}>اختر صورة</Text>
                  </>
                )}
              </Pressable>

              <Text style={styles.label}>اسم المنتج *</Text>
              <TextInput
                value={draft.name}
                onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
                placeholder="مثال: طماطم طازجة"
                placeholderTextColor={Colors.text.muted}
                style={styles.input}
                textAlign="right"
              />

              <Text style={styles.label}>الوصف (اختياري)</Text>
              <TextInput
                value={draft.description}
                onChangeText={(v) =>
                  setDraft((d) => ({ ...d, description: v }))
                }
                placeholder="وصف مختصر"
                placeholderTextColor={Colors.text.muted}
                style={[styles.input, styles.textArea]}
                multiline
                textAlign="right"
                textAlignVertical="top"
              />

              <Text style={styles.label}>السعر (ل.س) *</Text>
              <TextInput
                value={draft.price}
                onChangeText={(v) =>
                  setDraft((d) => ({
                    ...d,
                    price: v.replace(/[^0-9.]/g, ""),
                  }))
                }
                placeholder="0.00"
                placeholderTextColor={Colors.text.muted}
                keyboardType="numeric"
                style={styles.input}
                textAlign="right"
              />

              <View style={styles.switchRow}>
                <Switch
                  value={draft.is_available}
                  onValueChange={(v) =>
                    setDraft((d) => ({ ...d, is_available: v }))
                  }
                  trackColor={{
                    false: Colors.gray[300],
                    true: Colors.primary.main,
                  }}
                  thumbColor="#fff"
                />
                <Text style={styles.switchRowLabel}>
                  {draft.is_available ? "متاح للبيع" : "غير متاح"}
                </Text>
              </View>

              <AppButton
                label={
                  saving
                    ? "جاري الحفظ..."
                    : draft.id
                      ? "حفظ التعديلات"
                      : "إضافة المنتج"
                }
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                variant="primary"
                fullWidth
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  headerCount: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
  },
  searchWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text.primary,
  },
  card: {
    flexDirection: "row-reverse",
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  cardImageWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: Colors.gray[100],
  },
  cardImage: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, justifyContent: "space-between" },
  cardName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  cardDesc: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
    marginTop: 2,
  },
  cardPrice: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.gold.dark,
    textAlign: "right",
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  switchWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.xs,
  },
  switchLabel: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDanger: {
    backgroundColor: Colors.status.errorSoft,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    left: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primary.main,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Colors.background.paper,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border.dark,
    backgroundColor: Colors.background.default,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  imagePickerText: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: 4,
  },
  imagePreview: { width: "100%", height: "100%" },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: "right",
  },
  input: {
    backgroundColor: Colors.background.default,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  textArea: { minHeight: 80 },
  switchRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  switchRowLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
});
