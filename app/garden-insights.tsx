import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DetailScreen } from "@/components/DetailScreen";
import { buildGardenInsights } from "@/lib/gardenInsights";
import { supabase } from "@/lib/supabase";
import { useEntitlements } from "@/lib/useEntitlements";
import { AppColors } from "@/lib/theme";
import { useAuth } from "@/state/Auth";
import { useGarden } from "@/state/Garden";
import { useThemeColors } from "@/state/useThemeColors";

export default function GardenInsights() {
  const router = useRouter();
  const { user } = useAuth();
  const { notes } = useGarden();
  const { pro } = useEntitlements();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const insights = useMemo(() => buildGardenInsights(notes), [notes]);
  const [aiSynthesis, setAiSynthesis] = useState("");
  const [aiMode, setAiMode] = useState<"ai" | "fallback" | "">("");
  const [aiReason, setAiReason] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const generateSynthesis = async () => {
    if (!user) {
      setAiError("Sign in to generate Garden synthesis.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    setAiSynthesis("");
    setAiMode("");
    setAiReason("");
    try {
      const { data, error } = await supabase.functions.invoke(
        "garden-synthesis",
        { body: { purpose: "insights" } },
      );
      if (error) {
        setAiError(error.message);
        return;
      }
      setAiSynthesis(data?.synthesis || "No synthesis was returned.");
      setAiMode(data?.mode || "fallback");
      setAiReason(data?.reason || "");
    } catch (caught) {
      setAiError(
        caught instanceof Error ? caught.message : "Could not generate synthesis.",
      );
    } finally {
      setAiLoading(false);
    }
  };
  return (
    <DetailScreen title="Garden Insights" subtitle="Synthesis from your notes">
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {!pro && (
          <View style={s.locked}>
            <Ionicons name="sparkles-outline" size={22} color={c.gold} />
            <View style={s.lockCopy}>
              <Text style={s.lockTitle}>Pro synthesis preview</Text>
              <Text style={s.lockText}>
                These insights are generated from your local Garden. AI-guided
                coaching will connect here when Pro billing and AI keys are live.
              </Text>
            </View>
            <Pressable onPress={() => router.push("/subscription")} style={s.planButton}>
              <Text style={s.planText}>Plan</Text>
            </Pressable>
          </View>
        )}
        <View style={s.card}>
          <Text style={s.eyebrow}>SYNTHESIS</Text>
          <Text style={s.summary}>{insights.summary}</Text>
          <Text style={s.prompt}>{insights.prompt}</Text>
          {!!aiError && <Text style={s.error}>{aiError}</Text>}
          {!!aiSynthesis && (
            <View style={s.aiBox}>
              <Text style={s.aiLabel}>
                {aiMode === "ai" ? "AI SYNTHESIS" : "LOCAL SYNTHESIS"}
              </Text>
              {aiMode === "fallback" && (
                <Text style={s.aiNotice}>
                  AI unavailable{aiReason ? ` (${aiReason})` : ""}.
                </Text>
              )}
              <Text style={s.aiText}>{aiSynthesis}</Text>
            </View>
          )}
          <Pressable
            disabled={aiLoading}
            onPress={generateSynthesis}
            style={[s.guideButton, aiLoading && s.disabled]}
          >
            {aiLoading ? (
              <ActivityIndicator color={c.onAccent} />
            ) : (
              <>
                <Ionicons name="sparkles-outline" size={17} color={c.onAccent} />
                <Text style={s.guideText}>Generate Garden Synthesis</Text>
              </>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push("/reflection-guide" as any)}
            style={s.secondaryButton}
          >
            <Ionicons name="sparkles-outline" size={17} color={c.onAccent} />
            <Text style={s.guideText}>Open Reflection Guide</Text>
          </Pressable>
        </View>
        <Section title="Recurring Themes" items={insights.tags} c={c} s={s} />
        <Section title="Thought Group Balance" items={insights.groups} c={c} s={s} />
        <Section title="Most Studied Books" items={insights.books} c={c} s={s} />
        <Notes title="Questions to Revisit" notes={insights.questions} c={c} s={s} />
        <Notes title="Applications to Practice" notes={insights.applications} c={c} s={s} />
        <Notes title="Connections Forming" notes={insights.connections} c={c} s={s} />
      </ScrollView>
    </DetailScreen>
  );
}

function Section({
  title,
  items,
  c,
  s,
}: {
  title: string;
  items: Array<{ name: string; count: number }>;
  c: AppColors;
  s: ReturnType<typeof styles>;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {items.length ? (
        items.map((item) => (
          <View key={item.name} style={s.metricRow}>
            <Text style={s.metricName}>{item.name}</Text>
            <Text style={s.metricCount}>{item.count}</Text>
          </View>
        ))
      ) : (
        <Text style={s.empty}>Not enough reflections yet.</Text>
      )}
    </View>
  );
}

function Notes({
  title,
  notes,
  c,
  s,
}: {
  title: string;
  notes: Array<{ id: string; title: string; reference: string }>;
  c: AppColors;
  s: ReturnType<typeof styles>;
}) {
  const router = useRouter();
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {notes.length ? (
        notes.map((note) => (
          <Pressable
            key={note.id}
            onPress={() => router.push({ pathname: "/note/[id]", params: { id: note.id } })}
            style={s.noteRow}
          >
            <View style={s.noteCopy}>
              <Text style={s.noteTitle}>{note.title}</Text>
              <Text style={s.noteRef}>{note.reference}</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={c.muted} />
          </Pressable>
        ))
      ) : (
        <Text style={s.empty}>No reflections in this group yet.</Text>
      )}
    </View>
  );
}

const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 36 },
    locked: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 14,
      padding: 13,
      marginBottom: 12,
    },
    lockCopy: { flex: 1 },
    lockTitle: { color: c.text, fontWeight: "800" },
    lockText: { color: c.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
    planButton: {
      minHeight: 38,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: c.green,
      justifyContent: "center",
    },
    planText: { color: c.onAccent, fontWeight: "800", fontSize: 11 },
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 16,
      padding: 16,
      marginBottom: 13,
    },
    eyebrow: {
      color: c.gold,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.1,
    },
    summary: { color: c.text, fontSize: 17, fontWeight: "800", lineHeight: 24, marginTop: 8 },
    prompt: { color: c.muted, fontSize: 12, lineHeight: 19, marginTop: 9 },
    guideButton: {
      minHeight: 44,
      borderRadius: 12,
      backgroundColor: c.green,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      marginTop: 14,
    },
    secondaryButton: {
      minHeight: 44,
      borderRadius: 12,
      backgroundColor: c.green,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      marginTop: 10,
      opacity: 0.86,
    },
    disabled: { opacity: 0.55 },
    guideText: { color: c.onAccent, fontWeight: "900", fontSize: 12 },
    error: { color: c.danger, fontSize: 12, marginTop: 10 },
    aiBox: {
      borderTopWidth: 1,
      borderColor: c.line,
      marginTop: 14,
      paddingTop: 12,
    },
    aiLabel: {
      color: c.gold,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1,
      marginBottom: 6,
    },
    aiNotice: { color: c.muted, fontSize: 11, lineHeight: 17, marginBottom: 7 },
    aiText: { color: c.text, fontSize: 12, lineHeight: 19 },
    section: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 14,
      padding: 14,
      marginBottom: 11,
    },
    sectionTitle: { color: c.text, fontWeight: "800", marginBottom: 10 },
    metricRow: {
      minHeight: 34,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderColor: c.line,
    },
    metricName: { color: c.text, fontSize: 12 },
    metricCount: { color: c.green, fontWeight: "800" },
    noteRow: {
      minHeight: 46,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderBottomWidth: 1,
      borderColor: c.line,
    },
    noteCopy: { flex: 1 },
    noteTitle: { color: c.text, fontWeight: "700", fontSize: 12 },
    noteRef: { color: c.muted, fontSize: 10, marginTop: 2 },
    empty: { color: c.muted, fontSize: 12, lineHeight: 18 },
  });
