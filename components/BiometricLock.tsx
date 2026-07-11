import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { AppColors } from "@/lib/theme";
import { useBiometric } from "@/state/Biometric";
import { useThemeColors } from "@/state/useThemeColors";
export function BiometricLock() {
  const { unlock } = useBiometric();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  return (
    <View style={s.page}>
      <View style={s.brand}>
        <MaterialCommunityIcons name="sprout" size={28} color={c.green} />
        <Text style={s.logo}>Selah</Text>
      </View>
      <Ionicons name="scan-outline" size={58} color={c.green} />
      <Text style={s.title}>Your Garden is locked</Text>
      <Text style={s.copy}>
        Use Face ID or your device passcode to continue.
      </Text>
      <Pressable onPress={unlock} style={s.button}>
        <Text style={s.buttonText}>Unlock Selah</Text>
      </Pressable>
    </View>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: c.bg,
      alignItems: "center",
      justifyContent: "center",
      padding: 28,
    },
    brand: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      marginBottom: 32,
    },
    logo: { color: c.text, fontSize: 24, fontWeight: "800" },
    title: { color: c.text, fontSize: 22, fontWeight: "700", marginTop: 18 },
    copy: { color: c.muted, textAlign: "center", lineHeight: 19, marginTop: 8 },
    button: {
      height: 50,
      minWidth: 210,
      borderRadius: 12,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 24,
    },
    buttonText: { color: c.onAccent, fontWeight: "800" },
  });
