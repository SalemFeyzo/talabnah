// src/context/ViewModeContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ViewMode = "client" | "merchant" | "driver" | "admin";

interface ViewModeContextValue {
  viewMode: ViewMode | null;
  setViewMode: (mode: ViewMode | null) => Promise<void>;
  clearViewMode: () => Promise<void>;
  ready: boolean;
}

const ViewModeContext = createContext<ViewModeContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = "talabnah.viewMode";

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode | null>(null);
  const [ready, setReady] = useState(false);

  // تحميل القيمة المحفوظة عند البدء
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setViewModeState(stored as ViewMode);
      } catch (e) {
        console.error("ViewMode load:", e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setViewMode = useCallback(async (mode: ViewMode | null) => {
    setViewModeState(mode);
    try {
      if (mode) {
        await AsyncStorage.setItem(STORAGE_KEY, mode);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error("ViewMode save:", e);
    }
  }, []);

  const clearViewMode = useCallback(async () => {
    await setViewMode(null);
  }, [setViewMode]);

  return (
    <ViewModeContext.Provider
      value={{ viewMode, setViewMode, clearViewMode, ready }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error("useViewMode must be used within ViewModeProvider");
  return ctx;
}
