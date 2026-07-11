import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState, Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/state/Auth";
type Value = {
  enabled: boolean;
  available: boolean;
  locked: boolean;
  checking: boolean;
  enable: (value: boolean) => Promise<{ ok: boolean; message: string }>;
  unlock: () => Promise<boolean>;
};
const Context = createContext<Value | null>(null);
const KEY = "selah.biometric.enabled";
export function BiometricProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [available, setAvailable] = useState(false);
  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      AsyncStorage.getItem(KEY),
    ])
      .then(([hardware, enrolled, stored]) => {
        const supported = Platform.OS !== "web" && hardware && enrolled;
        setAvailable(supported);
        const active = supported && stored === "1";
        setEnabled(active);
        setLocked(active && !!user);
      })
      .finally(() => setChecking(false));
  }, [user?.id]);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("biometric_enabled")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.biometric_enabled && available) {
          setEnabled(true);
          setLocked(true);
        }
      });
  }, [user?.id, available]);
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active" && enabled && user) setLocked(true);
    });
    return () => sub.remove();
  }, [enabled, user]);
  const unlock = useCallback(async () => {
    if (!enabled) {
      setLocked(false);
      return true;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock Selah",
      cancelLabel: "Use password",
      disableDeviceFallback: false,
    });
    if (result.success) setLocked(false);
    return result.success;
  }, [enabled]);
  const enable = useCallback(
    async (value: boolean) => {
      if (!value) {
        setEnabled(false);
        setLocked(false);
        await AsyncStorage.setItem(KEY, "0");
        if (user)
          await supabase
            .from("profiles")
            .update({
              biometric_enabled: false,
              biometric_onboarding_completed: true,
            })
            .eq("id", user.id);
        return { ok: true, message: "Biometric lock is off." };
      }
      if (!available)
        return {
          ok: false,
          message:
            "Face ID or device biometrics are not available or enrolled.",
        };
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Enable Face ID for Selah",
        disableDeviceFallback: false,
      });
      if (!result.success)
        return {
          ok: false,
          message: "Biometric authentication was cancelled.",
        };
      setEnabled(true);
      await AsyncStorage.setItem(KEY, "1");
      if (user)
        await supabase
          .from("profiles")
          .update({
            biometric_enabled: true,
            biometric_onboarding_completed: true,
          })
          .eq("id", user.id);
      return { ok: true, message: "Face ID is enabled." };
    },
    [available, user],
  );
  const value = useMemo(
    () => ({ enabled, available, locked, checking, enable, unlock }),
    [enabled, available, locked, checking, enable, unlock],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useBiometric() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing BiometricProvider");
  return value;
}
