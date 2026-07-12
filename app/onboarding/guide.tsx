import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DetailScreen } from "@/components/DetailScreen";
import { AppColors } from "@/lib/theme";
import { useThemeColors } from "@/state/useThemeColors";
const steps = [
  [
    "book-outline",
    "Read without distraction",
    "Choose a book and chapter from the top passage control. Move one reading page at a time, adjust text in Settings, bookmark your place, or enter full-screen reading.",
  ],
  [
    "create-outline",
    "Capture what you notice",
    "Tap Reflect from the Reader. Write what stayed with you first; title, thought type, and themes are optional.",
  ],
  [
    "leaf-outline",
    "Grow your Garden",
    "Garden starts simple and reveals themes, filters, insights, and connections as your reflections grow.",
  ],
  [
    "notifications-outline",
    "Build a rhythm",
    "Revisit brings older questions, applications, and themes back so your reflections become memory instead of storage.",
  ],
];
export default function Guide() {
  const router = useRouter();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  return (
    <DetailScreen title="How Selah works" subtitle="A one-time quick guide">
      <ScrollView contentContainerStyle={s.body}>
        {steps.map(([icon, title, copy], index) => (
          <View key={title} style={s.step}>
            <View style={s.number}>
              <Text style={s.numberText}>{index + 1}</Text>
            </View>
            <Ionicons name={icon as any} size={25} color={c.green} />
            <View style={s.stepCopy}>
              <Text style={s.title}>{title}</Text>
              <Text style={s.copy}>{copy}</Text>
            </View>
          </View>
        ))}
        <Pressable
          onPress={() => router.replace("/(tabs)")}
          style={s.button}
        >
          <Text style={s.buttonText}>Begin reading</Text>
        </Pressable>
      </ScrollView>
    </DetailScreen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 20, paddingBottom: 36 },
    step: {
      flexDirection: "row",
      gap: 11,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 15,
      padding: 15,
      marginBottom: 12,
    },
    number: {
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    numberText: { color: c.gold, fontWeight: "800", fontSize: 11 },
    stepCopy: { flex: 1 },
    title: { color: c.text, fontWeight: "700" },
    copy: { color: c.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
    button: {
      height: 52,
      borderRadius: 13,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    buttonText: { color: c.onAccent, fontWeight: "800" },
  });
