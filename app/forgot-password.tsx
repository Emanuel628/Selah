import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { AuthShell, useAuthStyles } from "@/components/AuthShell";
import { AppColors } from "@/lib/theme";
import { useAuth } from "@/state/Auth";
export default function Forgot() {
  const { c, s } = useAuthStyles();
  const local = useMemo(() => styles(c), [c]);
  const router = useRouter();
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!email.trim() || busy) return;
    setBusy(true);
    const result = await sendPasswordReset(email);
    setBusy(false);
    if (result.error) setError(result.error);
    else setSent(true);
  };
  return (
    <AuthShell
      title="Recover your peace"
      subtitle="Enter your email to receive password reset instructions."
    >
      <Text style={s.label}>Email Address</Text>
      <TextInput
        accessibilityLabel="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        placeholder="you@example.com"
        placeholderTextColor={c.muted}
        style={s.input}
      />
      {!!error && <Text style={local.error}>{error}</Text>}
      {sent && (
        <Text style={local.success}>
          Reset instructions sent. Check your email.
        </Text>
      )}
      <Pressable
        disabled={!email.trim() || busy}
        onPress={submit}
        style={[s.button, (!email.trim() || busy) && local.disabled]}
      >
        {busy ? (
          <ActivityIndicator color={c.onAccent} />
        ) : (
          <Text style={s.buttonText}>Send Reset Link</Text>
        )}
      </Pressable>
      <Text style={s.footer}>
        <Text onPress={() => router.back()} style={s.link}>
          ← Back to Sign In
        </Text>
      </Text>
    </AuthShell>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    error: { color: c.danger, fontSize: 11, marginBottom: 8 },
    success: { color: c.green, fontSize: 11, lineHeight: 16, marginBottom: 8 },
    disabled: { opacity: 0.45 },
  });
