import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DetailScreen } from "@/components/DetailScreen";
import { AppColors } from "@/lib/theme";
import { useThemeColors } from "@/state/useThemeColors";
const features = [
  ["checkmark", "Unlimited Garden entries"],
  ["cloud-outline", "Multi-device sync"],
  ["flash-outline", "Original language lexicon"],
  ["star-outline", "Priority search & insights"],
] as const;
export default function Subscription() {
  const [yearly, setYearly] = useState(false);
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  return (
    <DetailScreen title="Selah Pro">
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.headline}>Grow your knowledge.</Text>
        <Text style={s.copy}>
          Unlock the full potential of your Garden with advanced tools designed
          for deep study.
        </Text>
        <View style={s.toggle}>
          <Pressable
            onPress={() => setYearly(false)}
            style={[s.option, !yearly && s.selected]}
          >
            <Text style={[s.optionText, !yearly && s.selectedText]}>
              Monthly
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setYearly(true)}
            style={[s.option, yearly && s.selected]}
          >
            <Text style={[s.optionText, yearly && s.selectedText]}>
              Yearly · Save 20%
            </Text>
          </Pressable>
        </View>
        <View style={s.card}>
          <Text style={s.cardTitle}>Selah Pro Access</Text>
          <Text style={s.price}>
            {yearly ? "$47.90" : "$4.99"}{" "}
            <Text style={s.period}>/{yearly ? "yr" : "mo"}</Text>
          </Text>
          {features.map(([icon, label]) => (
            <View key={label} style={s.feature}>
              <Ionicons name={icon} size={19} color={c.green} />
              <Text style={s.featureText}>{label}</Text>
            </View>
          ))}
          <Pressable style={s.cta}>
            <Text style={s.ctaText}>Subscribe Now</Text>
          </Pressable>
        </View>
        <View style={s.manage}>
          <Text style={s.manageTitle}>Already a member?</Text>
          <Text style={s.manageCopy}>
            Manage your billing, update payment methods, or modify your plan
            below.
          </Text>
          <Pressable style={s.secondary}>
            <Text style={s.secondaryText}>View Billing Dashboard</Text>
          </Pressable>
        </View>
      </ScrollView>
    </DetailScreen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 22 },
    headline: {
      color: c.text,
      fontSize: 25,
      fontWeight: "700",
      textAlign: "center",
    },
    copy: { color: c.muted, textAlign: "center", lineHeight: 19, marginTop: 8 },
    toggle: {
      flexDirection: "row",
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 4,
      marginVertical: 20,
    },
    option: { flex: 1, padding: 10, borderRadius: 9, alignItems: "center" },
    selected: { backgroundColor: c.green },
    optionText: { color: c.muted, fontWeight: "600", fontSize: 12 },
    selectedText: { color: c.onAccent },
    card: {
      backgroundColor: c.surface,
      borderRadius: 17,
      padding: 19,
      borderWidth: 1,
      borderColor: c.line,
    },
    cardTitle: { color: c.text, fontWeight: "700", fontSize: 17 },
    price: {
      color: c.text,
      fontSize: 28,
      fontWeight: "700",
      marginVertical: 15,
    },
    period: { color: c.muted, fontSize: 12 },
    feature: { flexDirection: "row", gap: 10, marginBottom: 12 },
    featureText: { color: c.text },
    cta: {
      backgroundColor: c.gold,
      borderRadius: 11,
      padding: 13,
      alignItems: "center",
      marginTop: 7,
    },
    ctaText: { color: c.onAccent, fontWeight: "800" },
    manage: { alignItems: "center", padding: 20 },
    manageTitle: { color: c.text, fontWeight: "700" },
    manageCopy: {
      color: c.muted,
      textAlign: "center",
      fontSize: 11,
      lineHeight: 17,
      marginVertical: 8,
    },
    secondary: { padding: 10 },
    secondaryText: { color: c.green, fontWeight: "700" },
  });
