// src/app/(admin)/categories.tsx
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout";
import { AppButton, AppEmptyState, AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { adminService } from "@/services/admin";
import type { Category } from "@/types";
import { showAlert, showConfirm } from "@/utils/confirm";

type Draft = {
  id?: string;
  name: string;
  icon: string;
  sort_order: string;
};

const EMPTY_DRAFT: Draft = { name: "", icon: "", sort_order: "0" };

export default function AdminCategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await adminService.listCategories();
      setCategories(list);
    } catch (e) {
      console.error("Load categories:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const openCreate = () => {
    setDraft(EMPTY_DRAFT);
    setModalVisible(true);
  };

  const openEdit = (c: Category) => {
    setDraft({
      id: c.id,
      name: c.name,
      icon: c.icon ?? "",
      sort_order: String(c.sort_order),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const name = draft.name.trim();
    if (!name) {
      showAlert("تنبيه", "أدخل اسم القسم");
      return;
    }

    setSaving(true);
    try {
      const sortOrder = Number(draft.sort_order) || 0;

      if (draft.id) {
        const updated = await adminService.updateCategory(draft.id, {
          name,
          icon: draft.icon.trim() || null,
          sort_order: sortOrder,
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === draft.id ? updated : c)),
        );
      } else {
        const created = await adminService.createCategory({
          name,
          icon: draft.icon.trim() || null,
          sort_order: sortOrder,
        });
        setCategories((prev) => [...prev, created]);
      }

      setModalVisible(false);
      setDraft(EMPTY_DRAFT);
    } catch (e: any) {
      showAlert("خطأ", e?.message ?? "تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (c: Category) => {
    showConfirm(
      "حذف القسم",
      `هل تريد حذف "${c.name}"؟`,
      async () => {
        try {
          await adminService.deleteCategory(c.id);
          setCategories((prev) => prev.filter((x) => x.id !== c.id));
        } catch (e: any) {
          showAlert("خطأ", e?.message ?? "تعذّر الحذف");
        }
      },
      "حذف",
    );
  };

  if (loading) return <AppLoader message="جاري التحميل..." />;

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الأقسام</Text>
        <Text style={styles.headerCount}>{categories.length}</Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <View style={styles.iconWrap}>
                <Ionicons
                  name="grid-outline"
                  size={20}
                  color={Colors.primary.main}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sort}>الترتيب: {item.sort_order}</Text>
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
        )}
        ListEmptyComponent={
          <AppEmptyState
            title="لا توجد أقسام"
            message="أضف قسمك الأول."
            icon={
              <Ionicons
                name="grid-outline"
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
                {draft.id ? "تعديل القسم" : "قسم جديد"}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.text.primary} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.label}>اسم القسم *</Text>
              <TextInput
                value={draft.name}
                onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
                placeholder="مثال: فواكه"
                placeholderTextColor={Colors.text.muted}
                style={styles.input}
                textAlign="right"
              />

              <Text style={styles.label}>الأيقونة (اختياري)</Text>
              <TextInput
                value={draft.icon}
                onChangeText={(v) => setDraft((d) => ({ ...d, icon: v }))}
                placeholder="اسم أيقونة Ionicons"
                placeholderTextColor={Colors.text.muted}
                style={styles.input}
                textAlign="right"
              />

              <Text style={styles.label}>الترتيب</Text>
              <TextInput
                value={draft.sort_order}
                onChangeText={(v) =>
                  setDraft((d) => ({
                    ...d,
                    sort_order: v.replace(/[^0-9]/g, ""),
                  }))
                }
                placeholder="0"
                placeholderTextColor={Colors.text.muted}
                keyboardType="numeric"
                style={styles.input}
                textAlign="right"
              />

              <AppButton
                label={saving ? "جاري الحفظ..." : draft.id ? "حفظ" : "إضافة"}
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
  headerCount: { fontSize: FontSize.sm, color: Colors.text.muted },
  card: {
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadow.sm,
  },
  cardBody: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  sort: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
    marginTop: 2,
  },
  actions: { flexDirection: "row", gap: Spacing.xs },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDanger: { backgroundColor: Colors.status.errorSoft },
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
});
