// src/utils/storage.ts
import { File } from "expo-file-system";
import { Platform } from "react-native";
import { supabase } from "./supabase";

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function uploadImage(
  localUri: string,
  folderPath: string,
): Promise<string | null> {
  try {
    let ext = localUri.split(".").pop()?.toLowerCase().split("?")[0] || "jpg";
    if (!/^[a-z0-9]+$/.test(ext) || ext.length > 5) ext = "jpg";
    if (ext === "jpeg") ext = "jpg";
    const contentType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;

    const filePath = `${folderPath}_${Date.now()}.${ext}`;

    // ============ الويب ============
    if (Platform.OS === "web") {
      const res = await fetch(localUri);
      const blob = await res.blob();
      const realType = blob.type || contentType;

      const { error } = await supabase.storage
        .from("store-assets")
        .upload(filePath, blob, {
          contentType: realType,
          upsert: true,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from("store-assets")
        .getPublicUrl(filePath);
      return data.publicUrl;
    }

    // ============ الموبايل — API الجديد ============
    const file = new File(localUri);
    const base64 = await file.base64();
    const arrayBuffer = base64ToArrayBuffer(base64);

    const { error } = await supabase.storage
      .from("store-assets")
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("store-assets")
      .getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error("uploadImage error:", err);
    return null;
  }
}
