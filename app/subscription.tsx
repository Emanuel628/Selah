import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DetailScreen } from "@/components/DetailScreen";
import { supabase } from "@/lib/supabase";
import { AppColors } from "@/lib/theme";
import { useAuth } from "@/state/Auth";
import { useThemeColors } from "@/state/useThemeColors";

const features = [
  "Scripture reading and page navigation",
  "Garden reflections, search, filters, and tags",
  "Bookmarks and study reminders",
  "AI-guided reflection tools when released",
];

export default function Subscription() {
  const { user } = useAuth();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [tier, setTier] = useState<"free" | "pro">("free");
  const [end, setEnd] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("subscription_tier,trial_ends_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTier(data.subscription_tier);
          setEnd(data.trial_ends_at);
        }
      });
  }, [user?.id]);
  const days = end
    ? Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86400000))
    : null;
  return (
    <DetailScreen title="Your Selah plan">
      <ScrollView contentContainerStyle={s.body}>
        <View style={s.card}>
          <Text style={s.eyebrow}>CURRENT PLAN</Text>
          <Text style={s.title}>
            {tier === "pro" ? "Selah Pro Trial" : "Selah Free"}
          </Text>
          <Text style={s.status}>
            {tier === "pro" && days !== null
              ? `${days} days remaining in your free trial`
              : "Your core Scripture garden is free."}
          </Text>
          {features.map((feature, index) => (
            <View key={feature} style={s.feature}>
              <Ionicons
                name={
                  index === 3 && tier === "free"
                    ? "lock-closed-outline"
                    : "checkmark-circle"
                }
                size={19}
                color={index === 3 ? c.gold : c.green}
              />
              <Text style={s.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        <View style={s.notice}>
          <Text style={s.noticeTitle}>No billing is active</Text>
          <Text style={s.noticeText}>
            You will not be charged when the trial ends. Stripe and App Store
            subscription billing will be added before paid conversion is
            offered, with pricing and consent shown clearly first.
          </Text>
        </View>
      </ScrollView>
    </DetailScreen>
  );
}

const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 20 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.line,
      padding: 20,
    },
    eyebrow: {
      color: c.gold,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.2,
    },
    title: { color: c.text, fontSize: 25, fontWeight: "800", marginTop: 8 },
    status: { color: c.muted, lineHeight: 19, marginTop: 6, marginBottom: 20 },
    feature: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 13,
    },
    featureText: { color: c.text, fontSize: 12, flex: 1 },
    notice: {
      backgroundColor: c.surfaceRaised,
      borderRadius: 15,
      padding: 17,
      marginTop: 15,
    },
    noticeTitle: { color: c.text, fontWeight: "800" },
    noticeText: { color: c.muted, fontSize: 11, lineHeight: 18, marginTop: 6 },
  });
