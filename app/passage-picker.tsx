import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DetailScreen } from "@/components/DetailScreen";
import { BibleChapter, getBooks, getChapter } from "@/lib/bibleApi";
import { paginateVerses } from "@/lib/readerPagination";
import { AppColors } from "@/lib/theme";
import { useAppSettings } from "@/state/AppSettings";
import { useThemeColors } from "@/state/useThemeColors";

type Book = {
  id: string;
  name: string;
  commonName: string;
  numberOfChapters: number;
};
export default function PassagePicker() {
  const router = useRouter();
  const settings = useAppSettings();
  const { width, height } = useWindowDimensions();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selected, setSelected] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    getBooks(settings.preferredTranslationId, controller.signal)
      .then(setBooks)
      .catch((reason) => {
        if (reason?.name !== "AbortError")
          setError("Books could not be loaded.");
      });
    return () => controller.abort();
  }, [settings.preferredTranslationId]);
  const chooseChapter = (number: number) => {
    if (!selected) return;
    setSelectedChapter(number);
    setLoadingChapter(true);
    setChapterData(null);
    getChapter(settings.preferredTranslationId, selected.id, number)
      .then(setChapterData)
      .catch(() => setError("That chapter could not be loaded."))
      .finally(() => setLoadingChapter(false));
  };
  const pages = chapterData
    ? paginateVerses(
        chapterData.verses,
        Math.min(width, height),
        settings.readerFontSize,
      )
    : [];
  const choosePage = (page: number) => {
    if (!selected || selectedChapter === null) return;
    settings.setCurrentPassage(selected.id, selected.name, selectedChapter);
    setTimeout(() => settings.setCurrentPage(page), 0);
    router.back();
  };
  const title =
    selectedChapter !== null
      ? `${selected?.name} ${selectedChapter}`
      : selected
        ? selected.name
        : "Find a passage";
  return (
    <DetailScreen title={title} subtitle="Choose a book, chapter, and page">
      {!books.length && !error && (
        <View style={s.state}>
          <ActivityIndicator color={c.green} />
          <Text style={s.muted}>Loading books…</Text>
        </View>
      )}
      {error && !books.length && (
        <View style={s.state}>
          <Text style={s.muted}>{error}</Text>
        </View>
      )}
      {!selected ? (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelected(item)}
              style={s.bookRow}
            >
              <View>
                <Text style={s.bookName}>{item.name}</Text>
                <Text style={s.bookMeta}>
                  {item.numberOfChapters}{" "}
                  {item.numberOfChapters === 1 ? "chapter" : "chapters"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.muted} />
            </Pressable>
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={s.chapterView}>
          <Pressable
            onPress={() => {
              if (selectedChapter !== null) {
                setSelectedChapter(null);
                setChapterData(null);
              } else setSelected(null);
            }}
            style={s.changeBook}
          >
            <Ionicons name="arrow-back" size={17} color={c.green} />
            <Text style={s.changeText}>
              {selectedChapter !== null
                ? "Choose another chapter"
                : "Choose another book"}
            </Text>
          </Pressable>
          {selectedChapter === null ? (
            <>
              <Text style={s.label}>CHAPTER</Text>
              <View style={s.grid}>
                {Array.from(
                  { length: selected.numberOfChapters },
                  (_, index) => index + 1,
                ).map((number) => (
                  <Pressable
                    accessibilityLabel={`${selected.name} chapter ${number}`}
                    key={number}
                    onPress={() => chooseChapter(number)}
                    style={[
                      s.chapterButton,
                      selected.id === settings.currentBookId &&
                        number === settings.currentChapter &&
                        s.active,
                    ]}
                  >
                    <Text
                      style={[
                        s.buttonText,
                        selected.id === settings.currentBookId &&
                          number === settings.currentChapter &&
                          s.activeText,
                      ]}
                    >
                      {number}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <>
              {loadingChapter ? (
                <View style={s.state}>
                  <ActivityIndicator color={c.green} />
                  <Text style={s.muted}>Calculating pages…</Text>
                </View>
              ) : (
                <>
                  <Text style={s.label}>PAGE</Text>
                  <Text style={s.help}>
                    Pages are sized for this device and your current text size.
                  </Text>
                  <View style={s.grid}>
                    {pages.map((page, index) => (
                      <Pressable
                        accessibilityLabel={`${selected.name} chapter ${selectedChapter} page ${index + 1}`}
                        key={index}
                        onPress={() => choosePage(index + 1)}
                        style={[
                          s.pageButton,
                          selected.id === settings.currentBookId &&
                            selectedChapter === settings.currentChapter &&
                            index + 1 === settings.currentPage &&
                            s.active,
                        ]}
                      >
                        <Text
                          style={[
                            s.buttonText,
                            selected.id === settings.currentBookId &&
                              selectedChapter === settings.currentChapter &&
                              index + 1 === settings.currentPage &&
                              s.activeText,
                          ]}
                        >
                          {index + 1}
                        </Text>
                        <Text
                          style={[
                            s.range,
                            selected.id === settings.currentBookId &&
                              selectedChapter === settings.currentChapter &&
                              index + 1 === settings.currentPage &&
                              s.activeText,
                          ]}
                        >
                          vv. {page[0]?.number}–{page[page.length - 1]?.number}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </DetailScreen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    state: { padding: 30, alignItems: "center", gap: 10 },
    muted: { color: c.muted },
    list: { paddingHorizontal: 18, paddingBottom: 30 },
    bookRow: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderColor: c.line,
    },
    bookName: { color: c.text, fontWeight: "600" },
    bookMeta: { color: c.muted, fontSize: 10, marginTop: 3 },
    chapterView: { padding: 18, paddingBottom: 36 },
    changeBook: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginBottom: 14,
    },
    changeText: { color: c.green, fontWeight: "600" },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.3,
      marginBottom: 10,
    },
    help: {
      color: c.muted,
      fontSize: 11,
      lineHeight: 17,
      marginTop: -3,
      marginBottom: 14,
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
    chapterButton: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: "center",
      justifyContent: "center",
    },
    pageButton: {
      width: 72,
      height: 58,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: "center",
      justifyContent: "center",
    },
    active: { backgroundColor: c.green },
    buttonText: { color: c.text, fontWeight: "700" },
    range: { color: c.muted, fontSize: 9, marginTop: 3 },
    activeText: { color: c.onAccent },
  });
