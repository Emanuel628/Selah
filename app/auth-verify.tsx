import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AuthShell, useAuthStyles } from "@/components/AuthShell";
import { AppColors } from "@/lib/theme";
import { useAuth } from "@/state/Auth";
export default function Verify() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { resendVerification } = useAuth();
  const { c, s } = useAuthStyles();
  const styles = useMemo(() => local(c), [c]);
  const [message, setMessage] = useState("");
  const resend = async () => {
    if (!email) return;
    const result = await resendVerification(email);
    setMessage(result.error || "Verification email resent.");
  };
  return (
    <AuthShell
      title="Check your email"
      subtitle="We sent a secure verification link to your inbox. Verify your email, then sign in to continue onboarding."
    >
      <View style={styles.icon}>
        <Ionicons name="mail-open-outline" size={34} color={c.green} />
      </View>
      {!!email && <Text style={styles.email}>{email}</Text>}
      <Pressable onPress={() => router.replace("/login")} style={s.button}>
        <Text style={s.buttonText}>Return to Sign In</Text>
      </Pressable>
      <Text style={s.footer}>
        Didn't receive the email?{" "}
        <Text onPress={resend} style={s.link}>
          Resend link
        </Text>
      </Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
    </AuthShell>
  );
}
const local = (c: AppColors) =>
  StyleSheet.create({
    icon: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: "rgba(92,169,135,.12)",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: 12,
    },
    email: {
      color: c.text,
      textAlign: "center",
      fontSize: 12,
      marginBottom: 12,
    },
    message: {
      color: c.green,
      textAlign: "center",
      fontSize: 11,
      marginTop: 10,
    },
  });
