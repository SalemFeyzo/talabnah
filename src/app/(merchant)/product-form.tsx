// src/app/(merchant)/product-form.tsx
import { ScreenContainer } from "@/components/layout";
import { Colors } from "@/constants/colors";
import { Text } from "react-native";

export default function ProductFormScreen() {
  return (
    <ScreenContainer edges={["top"]}>
      <Text
        style={{
          textAlign: "right",
          color: Colors.text.primary,
          marginTop: 40,
        }}
      >
        product-form — قيد الإنشاء
      </Text>
    </ScreenContainer>
  );
}
