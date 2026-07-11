import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DetailScreen } from "@/components/DetailScreen";
import { supabase } from "@/lib/supabase";
import { AppColors } from "@/lib/theme";
import { useAuth } from "@/state/Auth";
import { useThemeColors } from "@/state/useThemeColors";

export default function Plan() {
  const router = useRouter();
  const { user } = useAuth();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [busy, setBusy] = useState(false);
  const choose = async (trial: boolean) => {
    if (busy) return;
    setBusy(true);
    if (user) {
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await supabase
        .from("profiles")
        .update(
          trial
            ? {
                subscription_tier: "pro",
                subscription_status: "trialing",
                subscription_cancel_at_period_end: false,
                trial_started_at: now.toISOString(),
                trial_ends_at: end.toISOString(),
                guide_completed: true,
                onboarding_completed: true,
              }
            : {
                subscription_tier: "free",
                subscription_status: "free",
                subscription_cancel_at_period_end: false,
                trial_started_at: null,
                trial_ends_at: null,
                guide_completed: true,
                onboarding_completed: true,
              },
        )
        .eq("id", user.id);
    }
    await AsyncStorage.removeItem("selah.pending_onboarding");
    router.replace("/(tabs)");
  };
  return (
    <DetailScreen title="Choose your Selah">
      <View style={s.body}>
        <View style={s.trial}>
          <View style={s.badge}>
            <Text style={s.badgeText}>RECOMMENDED · FREE FOR 30 DAYS</Text>
          </View>
          <Text style={s.trialTitle}>Experience Selah Pro</Text>
          {[
            "Garden Insights synthesis from your reflections",
            "Knowledge Graph connections across notes",
            "Priority Scripture search and cross-reference study",
            "AI-guided reflection tools when billing launches",
          ].map((item) => (
            <View key={item} style={s.feature}>
              <Ionicons name="checkmark-circle" size={18} color={c.gold} />
              <Text style={s.featureText}>{item}</Text>
            </View>
          ))}
          <Text style={s.noCharge}>
            No charge today. Stripe billing will only be added before paid
            conversion launches.
          </Text>
          <Pressable
            disabled={busy}
            onPress={() => choose(true)}
            style={s.primary}
          >
            <Text style={s.primaryText}>Start my free 30-day Pro trial</Text>
          </Pressable>
        </View>
        <View style={s.free}>
          <Text style={s.freeTitle}>Selah Free</Text>
          <Text style={s.freeCopy}>
            Read Scripture, save Garden reflections, bookmark, search, and set
            reminders.
          </Text>
          <Pressable
            disabled={busy}
            onPress={() => choose(false)}
            style={s.secondary}
          >
            <Text style={s.secondaryText}>Continue with Free</Text>
          </Pressable>
        </View>
      </View>
    </DetailScreen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18 },
    trial: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: c.gold,
      padding: 18,
    },
    badge: {
      alignSelf: "flex-start",
      backgroundColor: c.gold,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    badgeText: {
      color: c.onAccent,
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 0.6,
    },
    trialTitle: {
      color: c.text,
      fontSize: 23,
      fontWeight: "800",
      marginVertical: 16,
    },
    feature: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      marginBottom: 10,
    },
    featureText: { color: c.text, fontSize: 12, flex: 1 },
    noCharge: { color: c.muted, fontSize: 10, lineHeight: 15, marginTop: 6 },
    primary: {
      height: 52,
      borderRadius: 13,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 18,
    },
    primaryText: { color: c.onAccent, fontWeight: "900" },
    free: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.line,
      padding: 17,
      marginTop: 14,
    },
    freeTitle: { color: c.text, fontSize: 18, fontWeight: "700" },
    freeCopy: { color: c.muted, fontSize: 11, lineHeight: 17, marginTop: 6 },
    secondary: {
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.green,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 13,
    },
    secondaryText: { color: c.green, fontWeight: "800" },
  });
