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
import { isValidPassword, passwordRequirements } from "@/lib/authValidation";
import { AppColors } from "@/lib/theme";
import { useAuth } from "@/state/Auth";
export default function UpdatePassword() {
  const { c, s } = useAuthStyles();
  const local = useMemo(() => styles(c), [c]);
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const result = await updatePassword(password);
    setBusy(false);
    if (result.error) setError(result.error);
    else router.replace("/(tabs)");
  };
  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Use a strong password you have not used before."
    >
      <Text style={s.label}>New Password</Text>
      <TextInput
        accessibilityLabel="New Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        style={s.input}
      />
      {passwordRequirements.map((item) => (
        <Text
          key={item.label}
          style={[local.requirement, item.test(password) && local.met]}
        >
          {item.test(password) ? "✓" : "○"} {item.label}
        </Text>
      ))}
      {!!error && <Text style={local.error}>{error}</Text>}
      <Pressable
        disabled={!isValidPassword(password) || busy}
        onPress={submit}
        style={[
          s.button,
          (!isValidPassword(password) || busy) && local.disabled,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={c.onAccent} />
        ) : (
          <Text style={s.buttonText}>Update Password</Text>
        )}
      </Pressable>
    </AuthShell>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    requirement: { color: c.muted, fontSize: 10, marginBottom: 4 },
    met: { color: c.green },
    error: { color: c.danger, fontSize: 11, marginTop: 8 },
    disabled: { opacity: 0.45 },
  });
