import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { AppColors } from "@/lib/theme";
import { useAppSettings } from "@/state/AppSettings";
import { useThemeColors } from "@/state/useThemeColors";
import { BibleChapter, getChapter, passageFromApiLink } from "@/lib/bibleApi";
import { paginateVerses } from "@/lib/readerPagination";

export default function Read() {
  const router = useRouter();
  const settings = useAppSettings();
  const { width, height } = useWindowDimensions();
  const {
    showVerseNumbers,
    redLettering,
    preferredTranslationId,
    currentBookId,
    currentBookName,
    currentChapter,
    currentPage,
    setCurrentPage,
    readerFontSize,
    bookmarkColor,
    bookmark,
    saveBookmark,
    readerFullscreen,
    setReaderFullscreen,
  } = settings;
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [openLastPage, setOpenLastPage] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setChapter(null);
    setError("");
    getChapter(
      preferredTranslationId,
      currentBookId,
      currentChapter,
      controller.signal,
    )
      .then((data) => {
        setChapter(data);
        if (currentBookName !== data.book.name)
          settings.setCurrentPassage(
            currentBookId,
            data.book.name,
            currentChapter,
          );
      })
      .catch((reason) => {
        if (reason?.name !== "AbortError")
          setError(
            "Scripture could not be loaded. Check your connection and try again.",
          );
      });
    return () => controller.abort();
  }, [preferredTranslationId, currentBookId, currentChapter, reload]);
  const pages = useMemo(
    () =>
      chapter
        ? paginateVerses(
            chapter.verses,
            Math.min(width, height),
            readerFontSize,
          )
        : [],
    [chapter, width, height, readerFontSize],
  );
  useEffect(() => {
    if (!pages.length) return;
    if (openLastPage) {
      setCurrentPage(pages.length);
      setOpenLastPage(false);
    } else if (currentPage > pages.length) setCurrentPage(pages.length);
  }, [pages.length, currentPage, openLastPage]);
  const moveChapter = (link: string | null, page: "first" | "last") => {
    const next = passageFromApiLink(link);
    if (next) {
      setOpenLastPage(page === "last");
      settings.setCurrentPassage(next.bookId, next.bookId, next.chapter);
    }
  };
  const previous = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
    else moveChapter(chapter?.previousChapterApiLink || null, "last");
  };
  const next = () => {
    if (currentPage < pages.length) setCurrentPage(currentPage + 1);
    else moveChapter(chapter?.nextChapterApiLink || null, "first");
  };
  const isBookmarked =
    bookmark?.bookId === currentBookId &&
    bookmark.chapter === currentChapter &&
    bookmark.page === currentPage;
  const openBookmark = () => {
    if (!bookmark) return;
    settings.setCurrentPassage(
      bookmark.bookId,
      bookmark.bookName,
      bookmark.chapter,
    );
    setTimeout(() => setCurrentPage(bookmark.page), 0);
  };
  const lastTap = useRef(0);
  const handleFullscreenTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 350) setReaderFullscreen(false);
    lastTap.current = now;
  };
  if (readerFullscreen && chapter)
    return (
      <Pressable
        accessibilityLabel="Full screen Scripture. Double tap to exit."
        onPress={handleFullscreenTap}
        style={s.fullscreen}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.fullscreenBody}
        >
          {(pages[currentPage - 1] || pages[0] || []).map((verse) => (
            <Text
              key={verse.number}
              style={[
                s.verse,
                {
                  fontSize: readerFontSize,
                  lineHeight: Math.round(readerFontSize * 1.65),
                },
                redLettering && verse.hasWordsOfJesus && s.redLetter,
              ]}
            >
              {showVerseNumbers && <Text style={s.num}>{verse.number} </Text>}
              {verse.text}
            </Text>
          ))}
        </ScrollView>
      </Pressable>
    );
  return (
    <Screen title="Read">
      <View style={s.location}>
        <Pressable
          accessibilityLabel="Choose book and chapter"
          onPress={() => router.push("/passage-picker")}
          style={s.locationButton}
        >
          <View>
            <Text style={s.book}>
              {currentBookName} {currentChapter}
            </Text>
            <Text style={s.chapter}>
              Page {currentPage} of {pages.length || "–"}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={c.muted} />
        </Pressable>
        <Pressable
          accessibilityLabel="Enter full screen reading"
          onPress={() => setReaderFullscreen(true)}
          style={s.iconButton}
        >
          <Ionicons name="expand-outline" size={20} color={c.muted} />
        </Pressable>
        <Pressable
          accessibilityLabel={
            isBookmarked ? "Bookmarked" : "Bookmark this page"
          }
          onPress={() =>
            saveBookmark({
              bookId: currentBookId,
              bookName: currentBookName,
              chapter: currentChapter,
              page: currentPage,
            })
          }
          style={s.iconButton}
        >
          <Ionicons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={21}
            color={bookmarkColor}
          />
        </Pressable>
      </View>
      {bookmark && !isBookmarked && (
        <Pressable
          accessibilityLabel="Return to bookmark"
          onPress={openBookmark}
          style={s.bookmarkBanner}
        >
          <Ionicons name="bookmark" size={16} color={bookmarkColor} />
          <Text style={s.bookmarkText}>
            Return to {bookmark.bookName} {bookmark.chapter}, page{" "}
            {bookmark.page}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={c.muted} />
        </Pressable>
      )}
      {!chapter && !error && (
        <View style={s.state}>
          <ActivityIndicator color={c.green} />
          <Text style={s.stateText}>Loading Scripture…</Text>
        </View>
      )}
      {error && (
        <View style={s.state}>
          <Ionicons name="cloud-offline-outline" size={28} color={c.muted} />
          <Text style={s.error}>{error}</Text>
          <Pressable
            onPress={() => setReload((value) => value + 1)}
            style={s.retry}
          >
            <Text style={s.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}
      {chapter && (
        <View style={s.reader}>
          <ScrollView
            key={`${currentBookId}-${currentChapter}-${currentPage}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.body}
          >
            <Text style={s.section}>
              {chapter.headings[0]?.toUpperCase() || "SCRIPTURE"}
            </Text>
            {(pages[currentPage - 1] || pages[0] || []).map((verse) => (
              <Text
                key={verse.number}
                style={[
                  s.verse,
                  {
                    fontSize: readerFontSize,
                    lineHeight: Math.round(readerFontSize * 1.65),
                  },
                  redLettering && verse.hasWordsOfJesus && s.redLetter,
                ]}
              >
                {showVerseNumbers && <Text style={s.num}>{verse.number} </Text>}
                {verse.text}
              </Text>
            ))}
            <Text style={s.source}>
              Scripture: {chapter.translation.englishName}
            </Text>
          </ScrollView>
          <View style={s.pageNav}>
            <Pressable
              accessibilityLabel="Previous page"
              disabled={currentPage === 1 && !chapter.previousChapterApiLink}
              onPress={previous}
              style={s.navButton}
            >
              <Ionicons name="chevron-back" size={18} color={c.green} />
              <Text style={s.navText}>Previous page</Text>
            </Pressable>
            <Text style={s.pageCount}>
              {currentPage} / {pages.length}
            </Text>
            <Pressable
              accessibilityLabel="Next page"
              disabled={
                currentPage === pages.length && !chapter.nextChapterApiLink
              }
              onPress={next}
              style={s.navButton}
            >
              <Text style={s.navText}>Next page</Text>
              <Ionicons name="chevron-forward" size={18} color={c.green} />
            </Pressable>
          </View>
        </View>
      )}
    </Screen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    location: {
      height: 64,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderBottomWidth: 1,
      borderColor: c.line,
    },
    locationButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    book: { color: c.text, fontSize: 16, fontWeight: "700" },
    chapter: { color: c.muted, fontSize: 10, marginTop: 2 },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    fullscreen: { flex: 1, backgroundColor: c.bg },
    fullscreenBody: {
      paddingHorizontal: 24,
      paddingTop: 56,
      paddingBottom: 50,
    },
    bookmarkBanner: {
      minHeight: 44,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderColor: c.line,
    },
    bookmarkText: { color: c.text, fontSize: 11, fontWeight: "600", flex: 1 },
    state: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 30,
      gap: 12,
    },
    stateText: { color: c.muted, fontSize: 12 },
    error: { color: c.muted, textAlign: "center", lineHeight: 19 },
    retry: {
      backgroundColor: c.green,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
    },
    retryText: { color: c.onAccent, fontWeight: "800" },
    reader: { flex: 1 },
    body: { padding: 22, paddingBottom: 20 },
    section: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.5,
      marginBottom: 20,
    },
    verse: { fontFamily: "serif", marginBottom: 17, color: c.text },
    redLetter: { color: c.redLetter },
    num: { color: c.gold, fontSize: 11, fontWeight: "700" },
    source: { color: c.muted, fontSize: 9, textAlign: "center", marginTop: 12 },
    pageNav: {
      minHeight: 60,
      paddingHorizontal: 12,
      borderTopWidth: 1,
      borderColor: c.line,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.navigation,
    },
    navButton: {
      minHeight: 48,
      minWidth: 112,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
    },
    navText: { color: c.green, fontWeight: "700", fontSize: 11 },
    pageCount: { color: c.muted, fontSize: 11, fontWeight: "700" },
  });
