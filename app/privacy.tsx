import { useMemo } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DetailScreen } from "@/components/DetailScreen";
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from "@/lib/legal";
import { AppColors } from "@/lib/theme";
import { useThemeColors } from "@/state/useThemeColors";

const sections = [
  [
    "Information Selah collects",
    "Selah collects the account information needed to create and secure your account, including your email address and optional profile name. If you create Garden reflections, highlights, bookmarks, reading preferences, reminder settings, subscription status, and Bible-version preferences, Selah stores that data so it can sync across your devices.",
  ],
  [
    "Scripture and reflection data",
    "Your Garden notes, tags, thought groups, highlights, bookmarks, and reading position are personal study data. Selah uses them to show your saved reflections, generate Garden patterns, restore your reading state, and connect related passages or notes.",
  ],
  [
    "AI features",
    "When you use AI reflection or synthesis features, Selah sends the current passage, your question, and relevant Garden notes to the AI service provider only for the purpose of generating the requested guidance. Do not enter sensitive personal information that you do not want processed for that feature.",
  ],
  [
    "Payments",
    "Subscriptions are processed by Apple through the App Store. Selah receives subscription status, product identifiers, transaction identifiers, and renewal or expiration information needed to unlock or remove Pro access. Selah does not receive your full payment card details.",
  ],
  [
    "Notifications and biometrics",
    "Study reminders are scheduled on your device after you grant notification permission. Face ID or Touch ID login uses the device biometric system and secure local credential storage. Selah does not receive or store your biometric face or fingerprint data.",
  ],
  [
    "How data is protected",
    "Selah uses Supabase authentication, row-level security, and account-scoped database records so signed-in users can access only their own personal data. Local device settings may also be stored with device storage APIs for offline or pre-login use.",
  ],
  [
    "Deleting your account",
    "You can request permanent account deletion from Settings. Deleting your account removes your login and account-scoped Selah data. If you have an active App Store subscription, cancel it in your Apple account before deleting your Selah account.",
  ],
  [
    "Contact",
    `For privacy or support questions, contact ${SUPPORT_EMAIL}.`,
  ],
] as const;

export default function Privacy() {
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  return (
    <DetailScreen title="Privacy Policy">
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Text style={s.updated}>Effective date: July 12, 2026</Text>
        <Text style={s.intro}>
          Selah is a Scripture reading and reflection app. This policy explains
          what data Selah uses, why it is used, and how users can contact us.
        </Text>
        {sections.map(([title, copy]) => (
          <View key={title} style={s.section}>
            <Text style={s.title}>{title}</Text>
            <Text style={s.copy}>{copy}</Text>
          </View>
        ))}
        <Pressable
          accessibilityLabel="Open hosted privacy policy"
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          style={s.linkButton}
        >
          <Ionicons name="open-outline" size={17} color={c.onAccent} />
          <Text style={s.linkText}>Open Hosted Privacy Policy</Text>
        </Pressable>
      </ScrollView>
    </DetailScreen>
  );
}

const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 36 },
    updated: {
      color: c.gold,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1,
      marginBottom: 8,
      textTransform: "uppercase",
    },
    intro: {
      color: c.text,
      fontSize: 14,
      lineHeight: 22,
      fontWeight: "600",
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
    },
    section: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 14,
      padding: 14,
      marginBottom: 11,
    },
    title: { color: c.text, fontWeight: "900", marginBottom: 7 },
    copy: { color: c.muted, fontSize: 12, lineHeight: 19 },
    linkButton: {
      minHeight: 48,
      borderRadius: 13,
      backgroundColor: c.green,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 6,
    },
    linkText: { color: c.onAccent, fontWeight: "900" },
  });
