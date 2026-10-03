import { useAuth } from "@/context/AuthContext";
import { merchantService } from "@/services/merchant";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ClientProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();

  // حالة Modal التحويل
  const [modalVisible, setModalVisible] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!storeName.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال اسم المتجر");
      return;
    }

    if (!user) return;

    setLoading(true);

    try {
      // 1. إنشاء المتجر وترقية الحساب
      await merchantService.convertClientToMerchant(user.id, {
        store_name: storeName.trim(),
        address: address.trim() || null,
      });

      // 2. تحديث بروفايل الـ Context ليعكس دور MERCHANT فوراً
      if (refreshProfile) {
        await refreshProfile();
      }

      setModalVisible(false);

      Alert.alert("تهانينا! 🎉", "تم تحويل حسابك إلى تاجر وإنشاء متجرك بنجاح", [
        {
          text: "الانتقال للوحة التاجر",
          onPress: () => router.replace("/(merchant)"),
        },
      ]);
    } catch (error: any) {
      console.error("Error converting to merchant:", error);
      Alert.alert("خطأ", error.message || "حدث خطأ أثناء إنشاء المتجر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* باقي تفاصيل بروفايل الكلاينت */}

      {/* بطاقة / زر التحويل لتاجر */}
      <TouchableOpacity
        style={styles.convertCard}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.convertTitle}>🏪 هل ترغب بالبيع معنا؟</Text>
        <Text style={styles.convertSubtitle}>
          اضغط هنا للتحويل إلى حساب تاجر وإنشاء متجرك فوراً
        </Text>
      </TouchableOpacity>

      {/* نافذة إنشاء المتجر (Modal) */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>إنشاء متجرك الجديد</Text>

            <TextInput
              placeholder="اسم المتجر *"
              value={storeName}
              onChangeText={setStoreName}
              style={styles.input}
            />

            <TextInput
              placeholder="عنوان المتجر (اختياري)"
              value={address}
              onChangeText={setAddress}
              style={styles.input}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelText}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleConvert}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>تأكيد التحويل</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  convertCard: {
    backgroundColor: "#eff6ff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginTop: 20,
  },
  convertTitle: { fontSize: 18, fontWeight: "bold", color: "#1e40af" },
  convertSubtitle: { fontSize: 13, color: "#3b82f6", marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  button: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
  cancelButton: { backgroundColor: "#f1f5f9" },
  submitButton: { backgroundColor: "#2563eb" },
  cancelText: { color: "#64748b", fontWeight: "bold" },
  submitText: { color: "#fff", fontWeight: "bold" },
});
