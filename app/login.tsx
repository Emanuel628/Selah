import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { AuthShell, useAuthStyles } from "@/components/AuthShell";
import { AppColors } from "@/lib/theme";
import { useAuth } from "@/state/Auth";
export default function Login() {
  const { c, s } = useAuthStyles();
  const local = useMemo(() => styles(c), [c]);
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!email.trim() || !password || submitting) return;
    setSubmitting(true);
    setError("");
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const onboarding = await AsyncStorage.getItem("selah.pending_onboarding");
    if (onboarding)
      router.replace({
        pathname: "/bible-version",
        params: { onboarding: "1" },
      });
    else router.replace("/(tabs)");
  };
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Continue your cultivation in the word."
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
      <View>
        <Text style={s.label}>Password</Text>
        <Text
          onPress={() => router.push("/forgot-password")}
          style={[s.link, local.forgot]}
        >
          Forgot?
        </Text>
      </View>
      <TextInput
        accessibilityLabel="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        placeholder="••••••••"
        placeholderTextColor={c.muted}
        style={s.input}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={local.error}>
          {error}
        </Text>
      )}
      <Pressable
        disabled={!email.trim() || !password || submitting}
        onPress={submit}
        style={[
          s.button,
          (!email.trim() || !password || submitting) && local.disabled,
        ]}
      >
        {submitting ? (
          <ActivityIndicator color={c.onAccent} />
        ) : (
          <Text style={s.buttonText}>Sign In</Text>
        )}
      </Pressable>
      <Text style={s.footer}>
        New to Selah?{" "}
        <Text onPress={() => router.push("/register")} style={s.link}>
          Create an account
        </Text>
      </Text>
    </AuthShell>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    forgot: { position: "absolute", right: 0, top: 0, fontSize: 11 },
    error: { color: c.danger, fontSize: 11, lineHeight: 16, marginBottom: 8 },
    disabled: { opacity: 0.45 },
  });
