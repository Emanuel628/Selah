import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DetailScreen } from "@/components/DetailScreen";
import { buildScriptureIndex, searchScriptureIndex } from "@/lib/scriptureSearch";
import { useEntitlements } from "@/lib/useEntitlements";
import { AppColors } from "@/lib/theme";
import { useAppSettings } from "@/state/AppSettings";
import { useGarden } from "@/state/Garden";
import { useThemeColors } from "@/state/useThemeColors";

export default function WordStudy() {
  const router = useRouter();
  const settings = useAppSettings();
  const { notes } = useGarden();
  const { pro } = useEntitlements();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof searchScriptureIndex>>([]);
  const gardenMatches = useMemo(() => {
    const clean = term.trim().toLowerCase();
    if (!clean) return [];
    return notes.filter((note) =>
      `${note.title} ${note.body} ${note.tags.join(" ")}`.toLowerCase().includes(clean),
    );
  }, [notes, term]);
  const run = async () => {
    const clean = term.trim();
    if (clean.length < 3 || loading) return;
    setLoading(true);
    const index = await buildScriptureIndex(settings.preferredTranslationId);
    setResults(searchScriptureIndex(index, clean, 25));
    setLoading(false);
  };
  return (
    <DetailScreen title="Word Study" subtitle="Find a term across Scripture and Garden">
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {!pro && (
          <View style={s.locked}>
            <Ionicons name="lock-closed-outline" size={18} color={c.gold} />
            <Text style={s.lockText}>
              Word Study is a Pro preview. It works now with local Scripture
              search and will become part of paid study tools.
            </Text>
          </View>
        )}
        <View style={s.search}>
          <Ionicons name="text-outline" size={19} color={c.muted} />
          <TextInput
            value={term}
            onChangeText={setTerm}
            placeholder="Search a word or phrase"
            placeholderTextColor={c.muted}
            style={s.input}
            returnKeyType="search"
            onSubmitEditing={run}
          />
          <Pressable
            accessibilityLabel="Run word study search"
            onPress={run}
            style={s.button}
          >
            {loading ? (
              <ActivityIndicator color={c.onAccent} />
            ) : (
              <Text style={s.buttonText}>Search</Text>
            )}
          </Pressable>
        </View>
        <Text style={s.label}>SCRIPTURE</Text>
        {results.length ? (
          results.map((result) => (
            <Pressable
              key={`${result.bookId}-${result.chapter}-${result.verse}`}
              onPress={() => {
                settings.setCurrentPassage(result.bookId, result.bookName, result.chapter);
                router.push("/(tabs)");
              }}
              style={s.result}
            >
              <Text style={s.reference}>
                {result.bookName} {result.chapter}:{result.verse}
              </Text>
              <Text numberOfLines={3} style={s.copy}>{result.text}</Text>
            </Pressable>
          ))
        ) : (
          <Text style={s.empty}>Search at least three characters.</Text>
        )}
        <Text style={s.label}>YOUR GARDEN</Text>
        {gardenMatches.length ? (
          gardenMatches.slice(0, 8).map((note) => (
            <Pressable
              key={note.id}
              onPress={() => router.push({ pathname: "/note/[id]", params: { id: note.id } })}
              style={s.result}
            >
              <Text style={s.reference}>{note.reference}</Text>
              <Text style={s.noteTitle}>{note.title}</Text>
            </Pressable>
          ))
        ) : (
          <Text style={s.empty}>No Garden reflections match yet.</Text>
        )}
      </ScrollView>
    </DetailScreen>
  );
}

const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 36 },
    locked: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 13,
      padding: 12,
      marginBottom: 12,
    },
    lockText: { color: c.muted, fontSize: 11, lineHeight: 16, flex: 1 },
    search: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 14,
      paddingHorizontal: 12,
    },
    input: { flex: 1, color: c.text },
    button: {
      minWidth: 72,
      height: 38,
      borderRadius: 10,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: { color: c.onAccent, fontWeight: "800", fontSize: 12 },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.2,
      marginTop: 18,
      marginBottom: 8,
    },
    result: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 12,
      padding: 13,
      marginBottom: 9,
    },
    reference: { color: c.green, fontWeight: "800", marginBottom: 5 },
    copy: { color: c.text, fontSize: 12, lineHeight: 18 },
    noteTitle: { color: c.text, fontWeight: "700" },
    empty: { color: c.muted, fontSize: 12, lineHeight: 18 },
  });
