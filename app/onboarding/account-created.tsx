import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthShell, useAuthStyles } from "@/components/AuthShell";
import { AppColors } from "@/lib/theme";
export default function AccountCreated() {
  const router = useRouter();
  const { c, s } = useAuthStyles();
  const local = useMemo(() => styles(c), [c]);
  return (
    <AuthShell
      title="Account created successfully"
      subtitle="Welcome to Selah. Your Scripture Garden is ready to personalize."
    >
      <View style={local.icon}>
        <Ionicons name="checkmark" size={38} color={c.onAccent} />
      </View>
      <Text style={local.copy}>
        Next, choose your Bible version, privacy preference, and account plan.
        You can change these later in Settings.
      </Text>
      <Pressable
        onPress={() =>
          router.replace({
            pathname: "/bible-version",
            params: { onboarding: "1" },
          })
        }
        style={s.button}
      >
        <Text style={s.buttonText}>Personalize Selah</Text>
      </Pressable>
    </AuthShell>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    icon: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: 18,
    },
    copy: {
      color: c.muted,
      textAlign: "center",
      lineHeight: 19,
      marginBottom: 16,
    },
  });
