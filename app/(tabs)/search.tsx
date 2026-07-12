import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { HighlightedText } from "@/components/HighlightedText";
import { Screen } from "@/components/Screen";
import { getChapter } from "@/lib/bibleApi";
import { paginateVerses } from "@/lib/readerPagination";
import {
  buildScriptureIndex,
  searchScriptureIndex,
} from "@/lib/scriptureSearch";
import { AppColors } from "@/lib/theme";
import { useAppSettings } from "@/state/AppSettings";
import { useThemeColors } from "@/state/useThemeColors";

export default function Search() {
  const router = useRouter();
  const settings = useAppSettings();
  const { width, height } = useWindowDimensions();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [query, setQuery] = useState("");
  const [scriptureIndex, setScriptureIndex] = useState<any[]>([]);
  const [indexing, setIndexing] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const clean = query.trim();
    if (clean.length < 3 || scriptureIndex.length) return;
    const controller = new AbortController();
    setIndexing(true);
    setError("");
    buildScriptureIndex(settings.preferredTranslationId, controller.signal)
      .then(setScriptureIndex)
      .catch((reason) => {
        if (reason?.name !== "AbortError")
          setError("Scripture search could not be prepared.");
      })
      .finally(() => setIndexing(false));
    return () => controller.abort();
  }, [query, settings.preferredTranslationId, scriptureIndex.length]);

  const scriptureResults = useMemo(
    () => searchScriptureIndex(scriptureIndex, query, 50),
    [scriptureIndex, query],
  );

  const openSearchResult = async (result: {
    bookId: string;
    bookName: string;
    chapter: number;
    verse: number;
  }) => {
    setOpening(true);
    const data = await getChapter(
      settings.preferredTranslationId,
      result.bookId,
      result.chapter,
    );
    const resultPages = paginateVerses(
      data.verses,
      Math.min(width, height),
      settings.readerFontSize,
    );
    const pageIndex = resultPages.findIndex((page) =>
      page.some((verse) => verse.number === result.verse),
    );
    settings.setCurrentPassage(result.bookId, result.bookName, result.chapter);
    setTimeout(() => settings.setCurrentPage(Math.max(1, pageIndex + 1)), 0);
    setOpening(false);
    router.push("/(tabs)");
  };

  const clean = query.trim();

  return (
    <Screen title="Search">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.body}
      >
        <View style={s.search}>
          <Ionicons name="search" size={20} color={c.muted} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search Bible text"
            placeholderTextColor={c.muted}
            style={s.input}
          />
          {query.length > 0 && (
            <Pressable
              accessibilityLabel="Clear Scripture search"
              onPress={() => setQuery("")}
            >
              <Ionicons name="close-circle" size={20} color={c.muted} />
            </Pressable>
          )}
        </View>

        <Text style={s.help}>
          Search finds words and phrases inside the selected Bible version. Use
          the down arrow on Read when you want to jump by book, chapter, or page.
        </Text>

        {!!error && <Text style={s.error}>{error}</Text>}
        {(indexing || opening) && (
          <View style={s.state}>
            <ActivityIndicator color={c.green} />
            <Text style={s.muted}>
              {opening ? "Opening passage..." : "Preparing Scripture search..."}
            </Text>
          </View>
        )}

        {clean.length < 3 && (
          <View style={s.empty}>
            <Ionicons name="book-outline" size={32} color={c.muted} />
            <Text style={s.emptyTitle}>Search Scripture</Text>
            <Text style={s.muted}>
              Enter at least three letters, such as faith, mercy, or “living
              water.”
            </Text>
          </View>
        )}

        {clean.length >= 3 && !indexing && (
          <>
            <Text style={s.label}>SCRIPTURE RESULTS</Text>
            {scriptureResults.map((result) => (
              <Pressable
                key={`${result.bookId}-${result.chapter}-${result.verse}`}
                onPress={() => openSearchResult(result)}
                style={s.result}
              >
                <Text style={s.resultRef}>
                  {result.bookName} {result.chapter}:{result.verse}
                </Text>
                <HighlightedText
                  text={result.text}
                  query={clean}
                  colors={c}
                  numberOfLines={4}
                  style={s.resultText}
                />
              </Pressable>
            ))}
            {!scriptureResults.length && (
              <Text style={s.muted}>No verse text found. Try another word.</Text>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 28 },
    search: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.line,
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    input: { flex: 1, color: c.text },
    help: { color: c.muted, fontSize: 11, lineHeight: 18, marginBottom: 14 },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.3,
      marginTop: 8,
      marginBottom: 7,
    },
    result: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 12,
      padding: 13,
      marginBottom: 9,
    },
    resultRef: { color: c.green, fontWeight: "800", marginBottom: 5 },
    resultText: { color: c.text, fontSize: 12, lineHeight: 18 },
    state: { padding: 30, alignItems: "center", gap: 10 },
    empty: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 16,
      padding: 22,
      alignItems: "center",
      gap: 10,
    },
    emptyTitle: { color: c.text, fontSize: 17, fontWeight: "800" },
    muted: { color: c.muted, textAlign: "center", lineHeight: 19 },
    error: { color: c.danger, fontSize: 12, marginBottom: 12 },
  });
