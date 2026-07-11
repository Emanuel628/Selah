import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthShell, useAuthStyles } from "@/components/AuthShell";
import { isValidPassword, passwordRequirements } from "@/lib/authValidation";
import { AppColors } from "@/lib/theme";
import { useAuth } from "@/state/Auth";

export default function Register() {
  const { c, s } = useAuthStyles();
  const local = useMemo(() => styles(c), [c]);
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const valid =
    name.trim().length > 1 &&
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
    isValidPassword(password);
  const submit = async () => {
    if (!valid || submitting) return;
    if (process.env.EXPO_PUBLIC_E2E_BYPASS_AUTH === "true") {
      router.push({ pathname: "/bible-version", params: { onboarding: "1" } });
      return;
    }
    setSubmitting(true);
    setError("");
    const result = await signUp(name, email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.replace(
      result.needsEmailVerification
        ? { pathname: "/auth-verify", params: { email: email.trim() } }
        : { pathname: "/bible-version", params: { onboarding: "1" } },
    );
  };
  return (
    <AuthShell
      title="Begin your garden"
      subtitle="A distraction-free home for scriptural study."
    >
      <Text style={s.label}>Full Name</Text>
      <TextInput
        accessibilityLabel="Full Name"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        style={s.input}
      />
      <Text style={s.label}>Email Address</Text>
      <TextInput
        accessibilityLabel="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        style={s.input}
      />
      <Text style={s.label}>Create Password</Text>
      <TextInput
        accessibilityLabel="Create Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoComplete="new-password"
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
      <Text style={local.requirementsTitle}>Password must include:</Text>
      <View style={local.requirements}>
        {passwordRequirements.map((item) => {
          const met = item.test(password);
          return (
            <View key={item.label} style={local.requirement}>
              <Ionicons
                name={met ? "checkmark-circle" : "ellipse-outline"}
                size={15}
                color={met ? c.green : c.muted}
              />
              <Text style={[local.requirementText, met && local.met]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={local.error}>
          {error}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={!valid || submitting}
        onPress={submit}
        style={[s.button, (!valid || submitting) && local.disabled]}
      >
        {submitting ? (
          <ActivityIndicator color={c.onAccent} />
        ) : (
          <Text style={s.buttonText}>Create Free Account</Text>
        )}
      </Pressable>
      <Text style={s.footer}>
        Already have an account?{" "}
        <Text onPress={() => router.replace("/login")} style={s.link}>
          Sign in
        </Text>
      </Text>
    </AuthShell>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    requirementsTitle: {
      color: c.text,
      fontSize: 11,
      fontWeight: "700",
      marginBottom: 7,
    },
    requirements: { gap: 5, marginBottom: 12 },
    requirement: { flexDirection: "row", alignItems: "center", gap: 6 },
    requirementText: { color: c.muted, fontSize: 10 },
    met: { color: c.green },
    error: { color: c.danger, fontSize: 11, lineHeight: 16, marginBottom: 8 },
    disabled: { opacity: 0.45 },
    showRow: {
      minHeight: 40,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: -8,
      marginBottom: 8,
    },
    showText: { color: c.text, fontSize: 12 },
  });
