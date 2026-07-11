import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DetailScreen } from "@/components/DetailScreen";
import { AppColors } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/state/Auth";
import { useBiometric } from "@/state/Biometric";
import { useThemeColors } from "@/state/useThemeColors";
export default function BiometricOnboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const { available, enable } = useBiometric();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [message, setMessage] = useState("");
  const next = () => router.replace("/onboarding/guide");
  const useFace = async () => {
    const result = await enable(true);
    setMessage(result.message);
    if (result.ok) next();
  };
  const skip = async () => {
    if (user)
      await supabase
        .from("profiles")
        .update({
          biometric_onboarding_completed: true,
          biometric_enabled: false,
        })
        .eq("id", user.id);
    next();
  };
  return (
    <DetailScreen title="Face ID Login">
      <View style={s.body}>
        <View style={s.icon}>
          <Ionicons name="scan-outline" size={52} color={c.green} />
        </View>
        <Text style={s.title}>
          {available
            ? "Use Face ID to sign in?"
            : "Device biometrics unavailable"}
        </Text>
        <Text style={s.copy}>
          {available
            ? "After you sign in with your password once, Selah can save those credentials securely on this device and let Face ID sign you in next time."
            : "You can continue now and enable Face ID login later from Settings after Face ID or device biometrics are enrolled."}
        </Text>
        {!!message && <Text style={s.message}>{message}</Text>}
        <Pressable
          disabled={!available}
          onPress={useFace}
          style={[s.primary, !available && s.disabled]}
        >
          <Text style={s.primaryText}>Use Face ID</Text>
        </Pressable>
        <Pressable onPress={skip} style={s.secondary}>
          <Text style={s.secondaryText}>Not now</Text>
        </Pressable>
      </View>
    </DetailScreen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { flex: 1, padding: 24, justifyContent: "center" },
    icon: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
    },
    title: {
      color: c.text,
      fontSize: 23,
      fontWeight: "700",
      textAlign: "center",
      marginTop: 22,
    },
    copy: {
      color: c.muted,
      textAlign: "center",
      lineHeight: 20,
      marginTop: 10,
      marginBottom: 18,
    },
    message: {
      color: c.green,
      textAlign: "center",
      fontSize: 11,
      marginBottom: 10,
    },
    primary: {
      height: 52,
      borderRadius: 13,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    disabled: { opacity: 0.35 },
    primaryText: { color: c.onAccent, fontWeight: "800" },
    secondary: { height: 48, alignItems: "center", justifyContent: "center" },
    secondaryText: { color: c.green, fontWeight: "700" },
  });
