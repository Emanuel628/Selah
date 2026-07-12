import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { AppColors } from "@/lib/theme";
import { useGarden } from "@/state/Garden";
import { useThemeColors } from "@/state/useThemeColors";

export default function Revisit() {
  const router = useRouter();
  const { notes } = useGarden();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const openQuestions = notes.filter((note) => note.group === "Question");
  const applications = notes.filter((note) => note.group === "Application");
  const recent = [...notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  const topTheme = useMemo(() => {
    const counts = new Map<string, number>();
    notes.forEach((note) =>
      note.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)),
    );
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || null;
  }, [notes]);

  return (
    <Screen title="Revisit">
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Text style={s.heroTitle}>Three thoughts from your Garden</Text>
        <Text style={s.heroCopy}>
          Selah brings older reflections back so your Garden becomes memory, not storage.
        </Text>
        {!notes.length && (
          <View style={s.empty}>
            <Ionicons name="leaf-outline" size={34} color={c.muted} />
            <Text style={s.emptyTitle}>Nothing to revisit yet</Text>
            <Text style={s.copy}>
              Read a passage and save one reflection. Revisit will begin working
              as your Garden grows.
            </Text>
            <Pressable onPress={() => router.push("/(tabs)")} style={s.primary}>
              <Text style={s.primaryText}>Begin reading</Text>
            </Pressable>
          </View>
        )}
        {!!recent && (
          <Card
            icon="time-outline"
            title="From your Garden"
            subtitle={recent.reference}
            body={recent.title || recent.body}
            action="Revisit"
            onPress={() => router.push({ pathname: "/note/[id]", params: { id: recent.id } })}
            c={c}
            s={s}
          />
        )}
        {!!openQuestions[0] && (
          <Card
            icon="help-circle-outline"
            title="A question you left open"
            subtitle={openQuestions[0].reference}
            body={openQuestions[0].body}
            action="Add what I think now"
            onPress={() =>
              router.push({ pathname: "/note/[id]", params: { id: openQuestions[0].id } })
            }
            c={c}
            s={s}
          />
        )}
        {!!applications[0] && (
          <Card
            icon="checkmark-done-outline"
            title="Something you wanted to practice"
            subtitle={applications[0].reference}
            body={applications[0].body}
            action="Follow up"
            onPress={() =>
              router.push({ pathname: "/note/[id]", params: { id: applications[0].id } })
            }
            c={c}
            s={s}
          />
        )}
        {!!topTheme && (
          <Card
            icon="git-branch-outline"
            title={`${topTheme[0]} keeps returning`}
            subtitle={`${topTheme[1]} reflections`}
            body={`You have reflected on #${topTheme[0]} more than once. Follow the thread from Garden search.`}
            action="Open Garden"
            onPress={() => router.push("/garden")}
            c={c}
            s={s}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

function Card({
  icon,
  title,
  subtitle,
  body,
  action,
  onPress,
  c,
  s,
}: {
  icon: any;
  title: string;
  subtitle: string;
  body: string;
  action: string;
  onPress: () => void;
  c: AppColors;
  s: ReturnType<typeof styles>;
}) {
  return (
    <Pressable onPress={onPress} style={s.card}>
      <View style={s.cardTop}>
        <Ionicons name={icon} size={20} color={c.green} />
        <View style={s.cardCopy}>
          <Text style={s.cardTitle}>{title}</Text>
          <Text style={s.cardSub}>{subtitle}</Text>
        </View>
      </View>
      <Text numberOfLines={3} style={s.cardBody}>
        {body}
      </Text>
      <Text style={s.action}>{action}</Text>
    </Pressable>
  );
}

const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 36 },
    heroTitle: { color: c.text, fontSize: 22, fontWeight: "900" },
    heroCopy: { color: c.muted, fontSize: 12, lineHeight: 19, marginTop: 6, marginBottom: 16 },
    empty: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.line,
      padding: 22,
      alignItems: "center",
      gap: 10,
    },
    emptyTitle: { color: c.text, fontSize: 18, fontWeight: "900" },
    copy: { color: c.muted, textAlign: "center", lineHeight: 20 },
    primary: {
      minHeight: 48,
      borderRadius: 13,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
      marginTop: 6,
    },
    primaryText: { color: c.onAccent, fontWeight: "900" },
    card: {
      backgroundColor: c.surface,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: c.line,
      padding: 16,
      marginBottom: 12,
    },
    cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
    cardCopy: { flex: 1 },
    cardTitle: { color: c.text, fontWeight: "900" },
    cardSub: { color: c.muted, fontSize: 11, marginTop: 2 },
    cardBody: { color: c.text, fontSize: 13, lineHeight: 20, marginTop: 12 },
    action: { color: c.green, fontWeight: "900", marginTop: 14 },
  });
