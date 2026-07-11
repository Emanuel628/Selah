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
import { Ionicons } from "@expo/vector-icons";
import { AuthShell, useAuthStyles } from "@/components/AuthShell";
import { AppColors } from "@/lib/theme";
import { useAuth } from "@/state/Auth";
import { useBiometric } from "@/state/Biometric";
export default function Login() {
  const { c, s } = useAuthStyles();
  const local = useMemo(() => styles(c), [c]);
  const router = useRouter();
  const { signIn, resendVerification } = useAuth();
  const {
    enabled: biometricEnabled,
    available: biometricAvailable,
    saveCredentials,
    signInWithBiometric,
  } = useBiometric();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const [notice, setNotice] = useState("");
  const submit = async () => {
    if (!email.trim() || !password || submitting) return;
    setSubmitting(true);
    setError("");
    setErrorCode("");
    setNotice("");
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) {
      setErrorCode(result.code || "");
      setError(
        result.code === "email_not_confirmed"
          ? "Your email has not been verified yet."
          : result.code === "invalid_credentials"
            ? "The email or password is incorrect."
            : result.error,
      );
      return;
    }
    await saveCredentials(email, password);
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
        secureTextEntry={!showPassword}
        autoComplete="current-password"
        placeholder="••••••••"
        placeholderTextColor={c.muted}
        style={s.input}
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: showPassword }}
        onPress={() => setShowPassword((value) => !value)}
        style={local.showRow}
      >
        <Ionicons
          name={showPassword ? "checkbox" : "square-outline"}
          size={20}
          color={c.green}
        />
        <Text style={local.showText}>Show password</Text>
      </Pressable>
      {!!error && (
        <Text accessibilityRole="alert" style={local.error}>
          {error}
        </Text>
      )}
      {errorCode === "email_not_confirmed" && (
        <Pressable
          onPress={async () => {
            const result = await resendVerification(email);
            setNotice(
              result.error || "Verification email sent. Check your inbox.",
            );
          }}
          style={local.resend}
        >
          <Text style={local.resendText}>Resend verification email</Text>
        </Pressable>
      )}
      {!!notice && <Text style={local.notice}>{notice}</Text>}
      {biometricEnabled && biometricAvailable && (
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            setError("");
            setNotice("");
            const result = await signInWithBiometric();
            if (!result.ok) setError(result.message);
            else router.replace("/(tabs)");
          }}
          style={local.faceId}
        >
          <Ionicons name="scan-outline" size={18} color={c.green} />
          <Text style={local.faceIdText}>Sign in with Face ID</Text>
        </Pressable>
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
    showRow: {
      minHeight: 40,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: -8,
      marginBottom: 8,
    },
    showText: { color: c.text, fontSize: 12 },
    resend: { minHeight: 40, justifyContent: "center", marginTop: -4 },
    resendText: { color: c.green, fontWeight: "700", fontSize: 12 },
    notice: { color: c.green, fontSize: 11, marginBottom: 8 },
    faceId: {
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      marginBottom: 10,
    },
    faceIdText: { color: c.green, fontWeight: "700", fontSize: 12 },
    disabled: { opacity: 0.45 },
  });
