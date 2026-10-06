// src/app/(admin)/merchants.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/layout";
import { AppBadge, AppEmptyState, AppLoader } from "@/components/ui";
import { Colors } from "@/constants/colors";
import { Radius, Shadow, Spacing } from "@/constants/spacing";
import { FontSize, FontWeight } from "@/constants/typography";
import { adminService } from "@/services/admin";
import type { Merchant } from "@/types";
import { showAlert } from "@/utils/confirm";

export default function AdminMerchantsScreen() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await adminService.listMerchants();
      setMerchants(list);
    } catch (e) {
      console.error("Load merchants:", e);
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

  const toggleActive = async (m: Merchant) => {
    try {
      const updated = await adminService.toggleMerchantActive(
        m.id,
        m.is_active,
      );
      setMerchants((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
    } catch (e: any) {
      showAlert("خطأ", e?.message ?? "تعذّر التحديث");
    }
  };

  if (loading) return <AppLoader message="جاري التحميل..." />;

  return (
    <ScreenContainer scroll={false} padded={false} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المتاجر</Text>
        <Text style={styles.headerCount}>{merchants.length}</Text>
      </View>

      <FlatList
        data={merchants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.storeInfo}>
                <View style={styles.logoWrap}>
                  {item.logo_url ? (
                    <Image
                      source={{ uri: item.logo_url }}
                      style={styles.logo}
                      contentFit="cover"
                    />
                  ) : (
                    <Ionicons
                      name="storefront"
                      size={22}
                      color={Colors.gold.main}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.store_name}
                  </Text>
                  {item.address ? (
                    <Text style={styles.address} numberOfLines={1}>
                      {item.address}
                    </Text>
                  ) : null}
                </View>
              </View>

              <AppBadge
                label={item.is_active ? "نشط" : "موقوف"}
                bg={
                  item.is_active
                    ? Colors.status.successSoft
                    : Colors.status.errorSoft
                }
                color={
                  item.is_active ? Colors.status.success : Colors.status.error
                }
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.switchRow}>
              <Switch
                value={item.is_active}
                onValueChange={() => toggleActive(item)}
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary.main,
                }}
                thumbColor="#fff"
              />
              <Text style={styles.switchLabel}>
                {item.is_active ? "المتجر مفعّل" : "المتجر موقوف"}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <AppEmptyState
            title="لا توجد متاجر"
            icon={
              <Ionicons
                name="storefront-outline"
                size={64}
                color={Colors.text.muted}
              />
            }
          />
        }
      />
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
  cardHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  storeInfo: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary.dark,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: { width: "100%", height: "100%" },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: "right",
  },
  address: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    textAlign: "right",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.md,
  },
  switchRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
  },
});
