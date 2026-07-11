import { PropsWithChildren, useMemo } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppColors } from "@/lib/theme";
import { useThemeColors } from "@/state/useThemeColors";

export function Screen({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const displayTitle =
    (
      {
        Read: "Read",
        Garden: "My Garden",
        Search: "Global Search",
        You: "Settings",
      } as Record<string, string>
    )[title] ?? title;
  return (
    <LinearGradient colors={[c.bg, c.bg2]} style={s.backdrop}>
      <SafeAreaView style={s.phone}>
        <View style={s.header}>
          <View style={s.brand}>
            <MaterialCommunityIcons name="sprout" size={22} color={c.green} />
            <Text style={s.logo}>Selah</Text>
          </View>
          <Text numberOfLines={1} style={s.title}>
            {displayTitle}
          </Text>
          <View style={s.headerSpacer} />
        </View>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    backdrop: { flex: 1 },
    phone: { flex: 1, width: "100%" },
    header: {
      height: 58,
      paddingHorizontal: 18,
      borderBottomWidth: 1,
      borderColor: c.line,
      flexDirection: "row",
      alignItems: "center",
    },
    brand: { flexDirection: "row", gap: 7, alignItems: "center", width: 90 },
    logo: { fontSize: 18, fontWeight: "700", color: c.text },
    title: {
      flex: 1,
      textAlign: "center",
      fontSize: 15,
      fontWeight: "600",
      color: c.text,
    },
    headerSpacer: { width: 90 },
  });
