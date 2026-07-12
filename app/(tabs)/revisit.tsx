import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ConfirmSheet } from "@/components/ConfirmSheet";
import { Screen } from "@/components/Screen";
import { relationshipScore } from "@/lib/gardenEngine";
import { AppColors } from "@/lib/theme";
import { GardenNote, useGarden } from "@/state/Garden";
import { useThemeColors } from "@/state/useThemeColors";

type RevisitItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  body: string;
  action: string;
  note: GardenNote;
};

export default function Revisit() {
  const router = useRouter();
  const { notes, markRevisited, markResolved, markPracticed } = useGarden();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const queue = useMemo(() => buildQueue(notes), [notes]);
  const [pendingStatus, setPendingStatus] = useState<{
    type: "resolved" | "practiced";
    note: GardenNote;
  } | null>(null);

  const openNote = (note: GardenNote) => {
    markRevisited(note.id);
    router.push({ pathname: "/note/[id]", params: { id: note.id } });
  };

  return (
    <Screen title="Revisit">
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <Text style={s.heroTitle}>Worth returning to today</Text>
        <Text style={s.heroCopy}>
          Revisit is a small queue: one older reflection, one unfinished thread,
          and one meaningful connection when Selah has enough evidence.
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
        {queue.map((item) => (
          <Card
            key={item.id}
            item={item}
            onOpen={() => openNote(item.note)}
            onResolved={() => setPendingStatus({ type: "resolved", note: item.note })}
            onPracticed={() => setPendingStatus({ type: "practiced", note: item.note })}
            c={c}
            s={s}
          />
        ))}
      </ScrollView>
      <ConfirmSheet
        visible={!!pendingStatus}
        title={
          pendingStatus?.type === "practiced"
            ? "Mark this application as practiced?"
            : "Mark this question as resolved?"
        }
        body="This changes how Selah treats this reflection in open-thread insights."
        confirmLabel={pendingStatus?.type === "practiced" ? "Mark practiced" : "Mark resolved"}
        colors={c}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() => {
          if (!pendingStatus) return;
          if (pendingStatus.type === "practiced") markPracticed(pendingStatus.note.id);
          else markResolved(pendingStatus.note.id);
          setPendingStatus(null);
        }}
      />
    </Screen>
  );
}

function buildQueue(notes: GardenNote[]): RevisitItem[] {
  const items: RevisitItem[] = [];
  const older = [...notes]
    .filter((note) => !note.lastRevisitedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  if (older)
    items.push({
      id: `older:${older.id}`,
      icon: "time-outline",
      title: "One older reflection",
      subtitle: older.reference,
      body: older.title || older.body,
      action: "Revisit",
      note: older,
    });

  const unfinished =
    notes
      .filter(
        (note) =>
          (note.group === "Question" || note.group === "Application") &&
          note.status === "open",
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0] || null;
  if (unfinished && unfinished.id !== older?.id)
    items.push({
      id: `unfinished:${unfinished.id}`,
      icon:
        unfinished.group === "Question"
          ? "help-circle-outline"
          : "checkmark-done-outline",
      title:
        unfinished.group === "Question"
          ? "An open question"
          : "An application to follow up",
      subtitle: unfinished.reference,
      body: unfinished.body,
      action:
        unfinished.group === "Question" ? "Review question" : "Review application",
      note: unfinished,
    });

  const bestConnection = findBestConnection(notes);
  if (bestConnection && !items.some((item) => item.note.id === bestConnection.a.id)) {
    items.push({
      id: `connection:${bestConnection.a.id}:${bestConnection.b.id}`,
      icon: "git-branch-outline",
      title: "A meaningful connection",
      subtitle: `${bestConnection.a.reference} and ${bestConnection.b.reference}`,
      body: `${bestConnection.a.title || bestConnection.a.body} may connect with ${bestConnection.b.title || bestConnection.b.body}.`,
      action: "Compare",
      note: bestConnection.a,
    });
  }
  return items.slice(0, 3);
}

function findBestConnection(notes: GardenNote[]) {
  let best: { a: GardenNote; b: GardenNote; score: number } | null = null;
  for (const a of notes) {
    for (const b of notes) {
      if (a.id >= b.id) continue;
      const relation = relationshipScore(a, b);
      if (relation.concept < 0.24 || relation.score < 0.26 || !relation.secondary) continue;
      if (!best || relation.score > best.score) best = { a, b, score: relation.score };
    }
  }
  return best;
}

function Card({
  item,
  onOpen,
  onResolved,
  onPracticed,
  c,
  s,
}: {
  item: RevisitItem;
  onOpen: () => void;
  onResolved: () => void;
  onPracticed: () => void;
  c: AppColors;
  s: ReturnType<typeof styles>;
}) {
  return (
    <View style={s.card}>
      <Pressable onPress={onOpen}>
        <View style={s.cardTop}>
          <Ionicons name={item.icon} size={20} color={c.green} />
          <View style={s.cardCopy}>
            <Text style={s.cardTitle}>{item.title}</Text>
            <Text style={s.cardSub}>{item.subtitle}</Text>
          </View>
        </View>
        <Text numberOfLines={3} style={s.cardBody}>
          {item.body}
        </Text>
      </Pressable>
      <View style={s.actions}>
        <Pressable onPress={onOpen} style={s.secondary}>
          <Text style={s.secondaryText}>{item.action}</Text>
        </Pressable>
        {item.note.group === "Question" && item.note.status === "open" && (
          <Pressable onPress={onResolved} style={s.primarySmall}>
            <Text style={s.primarySmallText}>Resolved</Text>
          </Pressable>
        )}
        {item.note.group === "Application" && item.note.status === "open" && (
          <Pressable onPress={onPracticed} style={s.primarySmall}>
            <Text style={s.primarySmallText}>Practiced</Text>
          </Pressable>
        )}
      </View>
    </View>
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
    actions: { flexDirection: "row", gap: 8, marginTop: 14 },
    secondary: {
      flex: 1,
      minHeight: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryText: { color: c.green, fontWeight: "900", fontSize: 12 },
    primarySmall: {
      flex: 1,
      minHeight: 42,
      borderRadius: 12,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    primarySmallText: { color: c.onAccent, fontWeight: "900", fontSize: 12 },
  });
