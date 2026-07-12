import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { DetailScreen } from "@/components/DetailScreen";
import { buildInsightCards } from "@/lib/gardenEngine";
import { AppColors } from "@/lib/theme";
import { useGarden } from "@/state/Garden";
import { useThemeColors } from "@/state/useThemeColors";

export default function GardenInsights() {
  const router = useRouter();
  const { notes, dismissedInsightIds, archiveInsight } = useGarden();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const insights = useMemo(
    () => buildInsightCards(notes, dismissedInsightIds),
    [notes, dismissedInsightIds],
  );
  return (
    <DetailScreen title="What Selah is noticing" subtitle="Evidence-backed patterns">
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {insights.length ? (
          insights.map((card) => (
            <View key={card.id} style={s.card}>
              <Text style={s.label}>{card.label.toUpperCase()}</Text>
              <Text style={s.headline}>{card.headline}</Text>
              <Text style={s.explanation}>{card.explanation}</Text>
              <Text style={s.evidence}>
                Based on {card.evidence.length} {card.evidence.length === 1 ? "reflection" : "reflections"}
              </Text>
              {card.evidence.map((note) => (
                <Pressable
                  key={note.id}
                  onPress={() =>
                    router.push({ pathname: "/note/[id]", params: { id: note.id } })
                  }
                  style={s.note}
                >
                  <Text style={s.noteRef}>{note.reference}</Text>
                  <Text numberOfLines={1} style={s.noteTitle}>
                    {note.title || note.body}
                  </Text>
                </Pressable>
              ))}
              <View style={s.actions}>
                <Text style={s.why}>Why you’re seeing this</Text>
                <Pressable onPress={() => archiveInsight(card.id)}>
                  <Text style={s.dismiss}>Dismiss</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No reliable patterns yet</Text>
            <Text style={s.emptyCopy}>
              Selah waits for enough evidence before showing insight cards.
            </Text>
          </View>
        )}
      </ScrollView>
    </DetailScreen>
  );
}

const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 36 },
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 16,
      padding: 16,
      marginBottom: 13,
    },
    label: { color: c.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
    headline: { color: c.text, fontSize: 17, fontWeight: "900", lineHeight: 24, marginTop: 8 },
    explanation: { color: c.muted, fontSize: 12, lineHeight: 19, marginTop: 8 },
    evidence: { color: c.green, fontWeight: "800", fontSize: 11, marginTop: 10 },
    note: {
      minHeight: 42,
      justifyContent: "center",
      borderTopWidth: 1,
      borderColor: c.line,
      marginTop: 8,
    },
    noteRef: { color: c.green, fontSize: 10, fontWeight: "900" },
    noteTitle: { color: c.text, fontWeight: "700", fontSize: 12, marginTop: 2 },
    actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
    why: { color: c.muted, fontSize: 11, fontWeight: "700" },
    dismiss: { color: c.danger, fontSize: 11, fontWeight: "800" },
    empty: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 16,
      padding: 18,
    },
    emptyTitle: { color: c.text, fontWeight: "900" },
    emptyCopy: { color: c.muted, lineHeight: 19, marginTop: 8 },
  });
