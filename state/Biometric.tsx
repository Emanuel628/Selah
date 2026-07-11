import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/state/Auth";
type Value = {
  enabled: boolean;
  available: boolean;
  checking: boolean;
  enable: (value: boolean) => Promise<{ ok: boolean; message: string }>;
  saveCredentials: (email: string, password: string) => Promise<void>;
  signInWithBiometric: () => Promise<{ ok: boolean; message: string }>;
};
const Context = createContext<Value | null>(null);
const KEY = "selah.biometric.enabled";
const EMAIL_KEY = "selah.biometric.email";
const PASSWORD_KEY = "selah.biometric.password";

const secureSet = async (key: string, value: string) => {
  if (Platform.OS === "web") await AsyncStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
};
const secureGet = async (key: string) =>
  Platform.OS === "web"
    ? AsyncStorage.getItem(key)
    : SecureStore.getItemAsync(key);
const secureDelete = async (key: string) => {
  if (Platform.OS === "web") await AsyncStorage.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
};

export function BiometricProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [available, setAvailable] = useState(false);
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
        }
      });
  }, [user?.id, available]);
  const saveCredentials = useCallback(
    async (email: string, password: string) => {
      if (!enabled || !email.trim() || !password) return;
      await secureSet(EMAIL_KEY, email.trim());
      await secureSet(PASSWORD_KEY, password);
    },
    [enabled],
  );
  const signInWithBiometric = useCallback(async () => {
    if (!enabled)
      return { ok: false, message: "Face ID login is not enabled." };
    if (!available)
      return {
        ok: false,
        message: "Face ID is not available on this device.",
      };
    const email = await secureGet(EMAIL_KEY);
    if (!email)
      return {
        ok: false,
        message: "Sign in with your password once to set up Face ID login.",
      };
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Sign in to Selah",
      cancelLabel: "Use password",
      disableDeviceFallback: false,
    });
    if (!result.success)
      return { ok: false, message: "Face ID sign-in was cancelled." };
    const password = await secureGet(PASSWORD_KEY);
    if (!password)
      return {
        ok: false,
        message: "Sign in with your password once to set up Face ID login.",
      };
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return {
      ok: !error,
      message: error?.message || "Signed in with Face ID.",
    };
  }, [available, enabled]);
  const enable = useCallback(
    async (value: boolean) => {
      if (!value) {
        setEnabled(false);
        await AsyncStorage.setItem(KEY, "0");
        await secureDelete(EMAIL_KEY);
        await secureDelete(PASSWORD_KEY);
        if (user)
          await supabase
            .from("profiles")
            .update({
              biometric_enabled: false,
              biometric_onboarding_completed: true,
            })
            .eq("id", user.id);
        return { ok: true, message: "Face ID login is off." };
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
      return {
        ok: true,
        message: "Face ID login is enabled. Use your password once to save it securely.",
      };
    },
    [available, user],
  );
  const value = useMemo(
    () => ({
      enabled,
      available,
      checking,
      enable,
      saveCredentials,
      signInWithBiometric,
    }),
    [
      enabled,
      available,
      checking,
      enable,
      saveCredentials,
      signInWithBiometric,
    ],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useBiometric() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing BiometricProvider");
  return value;
}
