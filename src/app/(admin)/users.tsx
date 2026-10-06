// src/app/(admin)/users.tsx
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout";
import { AppBadge, AppEmptyState, AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { adminService } from "@/services/admin";
import type { AdminUser } from "@/types";
import type { UserRole } from "@/types/auth";
import { showAlert } from "@/utils/confirm";

const ROLE_LABELS: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  CLIENT: {
    label: "عميل",
    bg: Colors.status.infoSoft,
    color: Colors.status.info,
  },
  MERCHANT: {
    label: "تاجر",
    bg: Colors.gold.soft,
    color: Colors.gold.dark,
  },
  MERCHANT_STAFF: {
    label: "موظف متجر",
    bg: Colors.status.warningSoft,
    color: Colors.status.warning,
  },
  DRIVER: {
    label: "كابتن",
    bg: Colors.primary.soft,
    color: Colors.primary.main,
  },
  SYSTEM_STAFF: {
    label: "موظف نظام",
    bg: "#E0E7FF",
    color: "#4338CA",
  },
  ADMIN: {
    label: "أدمن",
    bg: Colors.status.errorSoft,
    color: Colors.status.error,
  },
};

const AVAILABLE_ROLES: { key: UserRole; label: string; icon: any }[] = [
  { key: "CLIENT", label: "عميل", icon: "person-outline" },
  { key: "MERCHANT", label: "تاجر", icon: "storefront-outline" },
  { key: "MERCHANT_STAFF", label: "موظف متجر", icon: "people-outline" },
  { key: "DRIVER", label: "كابتن", icon: "bicycle-outline" },
  { key: "SYSTEM_STAFF", label: "موظف نظام", icon: "construct-outline" },
  { key: "ADMIN", label: "أدمن", icon: "shield-checkmark-outline" },
];

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await adminService.listUsers();
      setUsers(list);
    } catch (e) {
      console.error("Load users:", e);
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

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q),
    );
  }, [users, search]);

  const openRoleModal = (user: AdminUser) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const handleChangeRole = async (newRole: UserRole) => {
    if (!selectedUser) return;
    setUpdating(true);
    try {
      await adminService.updateUserRole(selectedUser.id, newRole);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, role: newRole } : u,
        ),
      );
      setModalVisible(false);
      setSelectedUser(null);
      showAlert("✅", "تم تحديث الدور");
    } catch (e: any) {
      showAlert("خطأ", e?.message ?? "تعذّر التحديث");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <AppLoader message="جاري التحميل..." />;

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المستخدمون</Text>
        <Text style={styles.headerCount}>{users.length}</Text>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.text.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث بالاسم أو الهاتف..."
            placeholderTextColor={Colors.text.muted}
            style={styles.searchInput}
            textAlign="right"
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          const roleConf = ROLE_LABELS[item.role] ?? ROLE_LABELS.CLIENT;
          return (
            <Pressable
              onPress={() => openRoleModal(item)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.full_name?.charAt(0).toUpperCase() ?? "؟"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.full_name || "بدون اسم"}
                    </Text>
                    <Text style={styles.phone} numberOfLines={1}>
                      {item.phone}
                    </Text>
                  </View>
                </View>
                <AppBadge
                  label={roleConf.label}
                  bg={roleConf.bg}
                  color={roleConf.color}
                />
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <AppEmptyState
            title="لا يوجد مستخدمون"
            icon={
              <Ionicons
                name="people-outline"
                size={64}
                color={Colors.text.muted}
              />
            }
          />
        }
      />

      {/* Role Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تغيير الدور</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.text.primary} />
              </Pressable>
            </View>

            {selectedUser ? (
              <>
                <View style={styles.userPreview}>
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarTextLarge}>
                      {selectedUser.full_name?.charAt(0).toUpperCase() ?? "؟"}
                    </Text>
                  </View>
                  <Text style={styles.userPreviewName}>
                    {selectedUser.full_name}
                  </Text>
                  <Text style={styles.userPreviewPhone}>
                    {selectedUser.phone}
                  </Text>
                </View>

                <Text style={styles.modalLabel}>اختر الدور الجديد:</Text>

                <ScrollView
                  style={{ maxHeight: 320 }}
                  showsVerticalScrollIndicator={false}
                >
                  {AVAILABLE_ROLES.map((r) => {
                    const isCurrent = selectedUser.role === r.key;
                    return (
                      <Pressable
                        key={r.key}
                        onPress={() => handleChangeRole(r.key)}
                        disabled={isCurrent || updating}
                        style={({ pressed }) => [
                          styles.roleOption,
                          isCurrent && styles.roleOptionCurrent,
                          pressed && !isCurrent && styles.pressed,
                        ]}
                      >
                        <Ionicons
                          name={r.icon}
                          size={20}
                          color={
                            isCurrent ? Colors.gold.dark : Colors.primary.main
                          }
                        />
                        <Text
                          style={[
                            styles.roleOptionText,
                            isCurrent && styles.roleOptionTextCurrent,
                          ]}
                        >
                          {r.label}
                        </Text>
                        {isCurrent ? (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>الحالي</Text>
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}
          </View>
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
  searchWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
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
    backgroundColor: Colors.background.paper,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    ...Shadow.sm,
  },
  pressed: { opacity: 0.9 },
  cardHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  userInfo: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary.main,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  phone: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
    marginTop: 2,
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
    paddingBottom: Spacing.xl,
    maxHeight: "85%",
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
  userPreview: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background.default,
    borderRadius: Radius.lg,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary.soft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  avatarTextLarge: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.primary.main,
  },
  userPreviewName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  userPreviewPhone: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    marginTop: 2,
  },
  modalLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    textAlign: "right",
  },
  roleOption: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.background.default,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  roleOptionCurrent: {
    backgroundColor: Colors.gold.soft,
    borderColor: Colors.gold.main,
  },
  roleOptionText: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  roleOptionTextCurrent: {
    color: Colors.gold.dark,
    fontWeight: FontWeight.bold,
  },
  currentBadge: {
    backgroundColor: Colors.gold.main,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  currentBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
});
