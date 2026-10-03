import { StyleSheet, Text, View } from "react-native";

export default function MerchantOrdersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>قائمة الطلبات المباشرة الواردة للمتجر</Text>
      <Text style={styles.subtext}>
        سيتم ربطها بنظام التنبيهات المباشرة (Realtime Orders) عند طلب العملاء.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  text: { fontSize: 18, fontWeight: "bold", color: "#0f172a", marginBottom: 8 },
  subtext: { fontSize: 14, color: "#64748b", textAlign: "center" },
});
