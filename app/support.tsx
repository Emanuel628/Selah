import { useMemo } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DetailScreen } from "@/components/DetailScreen";
import { SUPPORT_EMAIL } from "@/lib/legal";
import { AppColors } from "@/lib/theme";
import { useThemeColors } from "@/state/useThemeColors";

const supportTopics = [
  "Account sign-in, password reset, or email verification",
  "Subscription purchase, restore, cancellation, or refund status",
  "Bible version, reading page, bookmark, highlight, or Garden sync issues",
  "Privacy, data deletion, or App Review questions",
] as const;

export default function Support() {
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const emailUrl = `mailto:${SUPPORT_EMAIL}?subject=Selah%20Support`;
  return (
    <DetailScreen title="Support">
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <Ionicons name="help-buoy-outline" size={28} color={c.green} />
          <Text style={s.title}>Need help with Selah?</Text>
          <Text style={s.copy}>
            Contact support for account, subscription, privacy, or app-use
            questions. Include your device model, iOS version, and what you were
            trying to do.
          </Text>
        </View>
        <Text style={s.label}>WE CAN HELP WITH</Text>
        {supportTopics.map((topic) => (
          <View key={topic} style={s.topic}>
            <Ionicons name="checkmark-circle-outline" size={18} color={c.green} />
            <Text style={s.topicText}>{topic}</Text>
          </View>
        ))}
        <Pressable
          accessibilityLabel="Email Selah support"
          onPress={() => Linking.openURL(emailUrl)}
          style={s.button}
        >
          <Ionicons name="mail-outline" size={17} color={c.onAccent} />
          <Text style={s.buttonText}>Email Support</Text>
        </Pressable>
      </ScrollView>
    </DetailScreen>
  );
}

const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 36 },
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      gap: 8,
    },
    title: { color: c.text, fontSize: 19, fontWeight: "900" },
    copy: { color: c.muted, fontSize: 12, lineHeight: 19 },
    label: {
      color: c.gold,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1,
      marginBottom: 8,
    },
    topic: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderBottomWidth: 1,
      borderColor: c.line,
    },
    topicText: { color: c.text, fontSize: 12, lineHeight: 18, flex: 1 },
    button: {
      minHeight: 48,
      borderRadius: 13,
      backgroundColor: c.green,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 18,
    },
    buttonText: { color: c.onAccent, fontWeight: "900" },
  });
