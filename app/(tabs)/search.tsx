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
import { Screen } from "@/components/Screen";
import { BibleChapter, getBooks, getChapter } from "@/lib/bibleApi";
import { paginateVerses } from "@/lib/readerPagination";
import {
  buildScriptureIndex,
  searchScriptureIndex,
} from "@/lib/scriptureSearch";
import { AppColors } from "@/lib/theme";
import { useAppSettings } from "@/state/AppSettings";
import { useThemeColors } from "@/state/useThemeColors";

type Book = {
  id: string;
  name: string;
  commonName: string;
  numberOfChapters: number;
};

export default function Search() {
  const router = useRouter();
  const settings = useAppSettings();
  const { width, height } = useWindowDimensions();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [selected, setSelected] = useState<Book | null>(null);
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [scriptureIndex, setScriptureIndex] = useState<any[]>([]);
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getBooks(settings.preferredTranslationId, controller.signal)
      .then(setBooks)
      .catch((reason) => {
        if (reason?.name !== "AbortError")
          setError("Bible books could not be loaded.");
      });
    return () => controller.abort();
  }, [settings.preferredTranslationId]);

  useEffect(() => {
    const clean = query.trim();
    if (clean.length < 4 || scriptureIndex.length) return;
    const controller = new AbortController();
    setIndexing(true);
    buildScriptureIndex(settings.preferredTranslationId, controller.signal)
      .then(setScriptureIndex)
      .catch((reason) => {
        if (reason?.name !== "AbortError")
          setError("Scripture search could not be prepared.");
      })
      .finally(() => setIndexing(false));
    return () => controller.abort();
  }, [query, settings.preferredTranslationId, scriptureIndex.length]);

  const filteredBooks = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return books;
    return books.filter((book) => {
      const haystack = `${book.name} ${book.commonName} ${book.id}`.toLowerCase();
      return haystack.includes(clean);
    });
  }, [books, query]);

  const scriptureResults = useMemo(
    () => searchScriptureIndex(scriptureIndex, query, 35),
    [scriptureIndex, query],
  );

  const pages = chapter
    ? paginateVerses(chapter.verses, Math.min(width, height), settings.readerFontSize)
    : [];

  const openChapter = (book: Book, chapterNumber: number) => {
    setSelected(book);
    setChapter(null);
    setLoadingChapter(true);
    getChapter(settings.preferredTranslationId, book.id, chapterNumber)
      .then(setChapter)
      .catch(() => setError("That chapter could not be loaded."))
      .finally(() => setLoadingChapter(false));
  };

  const openPage = (page: number) => {
    if (!selected || !chapter) return;
    settings.setCurrentPassage(selected.id, selected.name, chapter.chapterNumber);
    setTimeout(() => settings.setCurrentPage(page), 0);
    router.push("/(tabs)");
  };

  const openSearchResult = async (result: {
    bookId: string;
    bookName: string;
    chapter: number;
    verse: number;
  }) => {
    setLoadingChapter(true);
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
    setLoadingChapter(false);
    router.push("/(tabs)");
  };

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
            onChangeText={(value) => {
              setQuery(value);
              setSelected(null);
              setChapter(null);
            }}
            placeholder="Find a book or passage"
            placeholderTextColor={c.muted}
            style={s.input}
          />
          {query.length > 0 && (
            <Pressable
              accessibilityLabel="Clear passage search"
              onPress={() => {
                setQuery("");
                setSelected(null);
                setChapter(null);
              }}
            >
              <Ionicons name="close-circle" size={20} color={c.muted} />
            </Pressable>
          )}
        </View>

        {!!error && <Text style={s.error}>{error}</Text>}
        {!books.length && !error && (
          <View style={s.state}>
            <ActivityIndicator color={c.green} />
            <Text style={s.muted}>Loading books...</Text>
          </View>
        )}

        {!selected && query.trim().length >= 3 && (
          <>
            <Text style={s.label}>SCRIPTURE RESULTS</Text>
            {indexing && (
              <View style={s.state}>
                <ActivityIndicator color={c.green} />
                <Text style={s.muted}>Preparing Scripture search...</Text>
              </View>
            )}
            {!indexing &&
              scriptureResults.map((result) => (
                <Pressable
                  key={`${result.bookId}-${result.chapter}-${result.verse}`}
                  onPress={() => openSearchResult(result)}
                  style={s.result}
                >
                  <Text style={s.resultRef}>
                    {result.bookName} {result.chapter}:{result.verse}
                  </Text>
                  <Text numberOfLines={3} style={s.resultText}>
                    {result.text}
                  </Text>
                </Pressable>
              ))}
            {!indexing && !scriptureResults.length && (
              <Text style={s.muted}>No verse text found. Try another word.</Text>
            )}
          </>
        )}

        {!selected && (
          <>
            <Text style={s.label}>PASSAGE JUMP</Text>
            {filteredBooks.map((book) => (
              <Pressable
                key={book.id}
                onPress={() => setSelected(book)}
                style={s.bookRow}
              >
                <View>
                  <Text style={s.book}>{book.name}</Text>
                  <Text style={s.meta}>
                    {book.numberOfChapters}{" "}
                    {book.numberOfChapters === 1 ? "chapter" : "chapters"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.muted} />
              </Pressable>
            ))}
          </>
        )}

        {selected && !chapter && (
          <>
            <Pressable
              onPress={() => setSelected(null)}
              style={s.back}
            >
              <Ionicons name="arrow-back" size={17} color={c.green} />
              <Text style={s.backText}>Choose another book</Text>
            </Pressable>
            <Text style={s.label}>{selected.name.toUpperCase()} CHAPTERS</Text>
            <View style={s.grid}>
              {Array.from(
                { length: selected.numberOfChapters },
                (_, index) => index + 1,
              ).map((number) => (
                <Pressable
                  accessibilityLabel={`${selected.name} chapter ${number}`}
                  key={number}
                  onPress={() => openChapter(selected, number)}
                  style={s.chapter}
                >
                  <Text style={s.chapterText}>{number}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {loadingChapter && (
          <View style={s.state}>
            <ActivityIndicator color={c.green} />
            <Text style={s.muted}>Finding pages...</Text>
          </View>
        )}

        {selected && chapter && (
          <>
            <Pressable
              onPress={() => setChapter(null)}
              style={s.back}
            >
              <Ionicons name="arrow-back" size={17} color={c.green} />
              <Text style={s.backText}>Choose another chapter</Text>
            </Pressable>
            <Text style={s.label}>
              {selected.name.toUpperCase()} {chapter.chapterNumber} PAGES
            </Text>
            <View style={s.grid}>
              {pages.map((page, index) => (
                <Pressable
                  accessibilityLabel={`${selected.name} chapter ${chapter.chapterNumber} page ${index + 1}`}
                  key={index}
                  onPress={() => openPage(index + 1)}
                  style={s.page}
                >
                  <Text style={s.chapterText}>{index + 1}</Text>
                  <Text style={s.meta}>
                    vv. {page[0]?.number}-{page[page.length - 1]?.number}
                  </Text>
                </Pressable>
              ))}
            </View>
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
      marginBottom: 14,
    },
    input: { flex: 1, color: c.text },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.3,
      marginTop: 8,
      marginBottom: 7,
    },
    bookRow: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderColor: c.line,
    },
    book: { color: c.text, fontWeight: "700" },
    meta: { color: c.muted, fontSize: 10, marginTop: 3 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
    chapter: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: "center",
      justifyContent: "center",
    },
    page: {
      width: 72,
      height: 58,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: "center",
      justifyContent: "center",
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
    chapterText: { color: c.text, fontWeight: "800" },
    back: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginBottom: 10,
    },
    backText: { color: c.green, fontWeight: "700" },
    state: { padding: 30, alignItems: "center", gap: 10 },
    muted: { color: c.muted },
    error: { color: c.danger, fontSize: 12, marginBottom: 12 },
  });
