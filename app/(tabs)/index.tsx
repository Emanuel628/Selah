import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Platform,
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
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/state/Auth";

type Highlight = {
  id?: string;
  verse_start: number;
  verse_end: number;
  color: string;
};

export default function Read() {
  const router = useRouter();
  const settings = useAppSettings();
  const { user } = useAuth();
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
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [activeHighlight, setActiveHighlight] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastTap = useRef(0);
  const verseLayouts = useRef<Record<number, { y: number; height: number }>>(
    {},
  );
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
  useEffect(() => {
    if (!user) {
      setHighlights([]);
      return;
    }
    supabase
      .from("scripture_highlights")
      .select("id,verse_start,verse_end,color,page")
      .eq("user_id", user.id)
      .eq("translation_id", preferredTranslationId)
      .eq("book_id", currentBookId)
      .eq("chapter", currentChapter)
      .then(({ data }) => {
        setHighlights((data || []).filter((item) => item.page === currentPage));
      });
  }, [user?.id, preferredTranslationId, currentBookId, currentChapter, currentPage]);
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
  const startHighlight = (verse: number) => {
    setActiveHighlight({ start: verse, end: verse });
  };
  const moveHighlight = (event: GestureResponderEvent) => {
    if (!activeHighlight) return;
    const y = event.nativeEvent.locationY;
    const match = Object.entries(verseLayouts.current).find(([, layout]) => {
      return y >= layout.y && y <= layout.y + layout.height;
    });
    if (match) {
      const verse = Number(match[0]);
      setActiveHighlight((current) =>
        current ? { ...current, end: verse } : current,
      );
    }
  };
  const finishHighlight = async () => {
    if (!activeHighlight || !user) {
      setActiveHighlight(null);
      return;
    }
    const verse_start = Math.min(activeHighlight.start, activeHighlight.end);
    const verse_end = Math.max(activeHighlight.start, activeHighlight.end);
    const payload = {
      user_id: user.id,
      translation_id: preferredTranslationId,
      book_id: currentBookId,
      book_name: currentBookName,
      chapter: currentChapter,
      page: currentPage,
      verse_start,
      verse_end,
      color: "#F7D774",
    };
    setHighlights((items) => [...items, payload]);
    setActiveHighlight(null);
    await supabase.from("scripture_highlights").insert(payload);
  };
  const onTouchStart = (event: GestureResponderEvent) => {
    touchStartX.current = event.nativeEvent.pageX;
    touchStartY.current = event.nativeEvent.pageY;
  };
  const handleFullscreenTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 350) setReaderFullscreen(false);
    lastTap.current = now;
  };
  const onTouchEnd = (event: GestureResponderEvent) => {
    if (activeHighlight) {
      void finishHighlight();
      return;
    }
    const dx = event.nativeEvent.pageX - touchStartX.current;
    const dy = event.nativeEvent.pageY - touchStartY.current;
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.4) {
      if (readerFullscreen) handleFullscreenTap();
      return;
    }
    if (dx < 0) next();
    else previous();
  };
  const isHighlighted = (verse: number) =>
    highlights.some(
      (item) => verse >= item.verse_start && verse <= item.verse_end,
    ) ||
    (activeHighlight &&
      verse >= Math.min(activeHighlight.start, activeHighlight.end) &&
      verse <= Math.max(activeHighlight.start, activeHighlight.end));
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
  if (readerFullscreen && chapter)
    return (
      <View
        accessibilityLabel="Full screen Scripture. Double tap to exit."
        style={s.fullscreen}
        {...(Platform.OS === "web"
          ? ({ onDoubleClick: () => setReaderFullscreen(false) } as object)
          : {})}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.fullscreenBody}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchMove={moveHighlight}
          {...(Platform.OS === "web"
            ? ({ onDoubleClick: () => setReaderFullscreen(false) } as object)
            : {})}
        >
          {(pages[currentPage - 1] || pages[0] || []).map((verse) => (
            <Pressable
              key={verse.number}
              onPress={handleFullscreenTap}
              onLongPress={() => startHighlight(verse.number)}
              onLayout={(event) => {
                verseLayouts.current[verse.number] = event.nativeEvent.layout;
              }}
              style={isHighlighted(verse.number) ? s.highlighted : null}
            >
              <Text
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
            </Pressable>
          ))}
        </ScrollView>
      </View>
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
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onTouchMove={moveHighlight}
          >
            <Text style={s.section}>
              {chapter.headings[0]?.toUpperCase() || "SCRIPTURE"}
            </Text>
            {(pages[currentPage - 1] || pages[0] || []).map((verse) => (
              <Pressable
                key={verse.number}
                onLongPress={() => startHighlight(verse.number)}
                onLayout={(event) => {
                  verseLayouts.current[verse.number] = event.nativeEvent.layout;
                }}
                style={isHighlighted(verse.number) ? s.highlighted : null}
              >
                <Text
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
              </Pressable>
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
    highlighted: {
      backgroundColor: "rgba(247, 215, 116, 0.38)",
      borderRadius: 6,
      paddingHorizontal: 4,
    },
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
