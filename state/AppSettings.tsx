import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/state/Auth";
import { supabase } from "@/lib/supabase";
import { useColorScheme } from "react-native";

type Settings = {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  showVerseNumbers: boolean;
  setShowVerseNumbers: (v: boolean) => void;
  redLettering: boolean;
  setRedLettering: (v: boolean) => void;
  preferredTranslationId: string;
  preferredTranslationName: string;
  preferredTranslationShortName: string;
  setPreferredTranslation: (
    id: string,
    name: string,
    shortName: string,
  ) => void;
  currentBookId: string;
  currentBookName: string;
  currentChapter: number;
  setCurrentPassage: (
    bookId: string,
    bookName: string,
    chapter: number,
  ) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  bookmarkColor: string;
  setBookmarkColor: (color: string) => void;
  highlightColor: string;
  setHighlightColor: (color: string) => void;
  bookmark: {
    bookId: string;
    bookName: string;
    chapter: number;
    page: number;
  } | null;
  saveBookmark: (bookmark: {
    bookId: string;
    bookName: string;
    chapter: number;
    page: number;
  }) => void;
  readerFontSize: number;
  setReaderFontSize: (size: number) => void;
  saveReaderPreferences: () => Promise<void>;
  readerFullscreen: boolean;
  setReaderFullscreen: (v: boolean) => void;
  reminderHour: number;
  setReminderHour: (v: number) => void;
  reminderMinute: string;
  setReminderMinute: (v: string) => void;
  reminderPeriod: "AM" | "PM";
  setReminderPeriod: (v: "AM" | "PM") => void;
  reminderDays: number[];
  setReminderDays: (v: number[]) => void;
  reminderEnabled: boolean;
  setReminderEnabled: (v: boolean) => void;
  saveReminderSettings: (
    hour: number,
    minute: string,
    period: "AM" | "PM",
    days: number[],
    enabled: boolean,
  ) => Promise<void>;
};
const Context = createContext<Settings | null>(null);

const DEFAULTS = {
  translationId: "BSB",
  translationName: "Berean Standard Bible",
  translationShortName: "BSB",
  bookId: "GEN",
  bookName: "Genesis",
  chapter: 1,
  page: 1,
  bookmarkColor: "#D4A72C",
  highlightColor: "#F7D774",
  readerFontSize: 20,
  reminderHour: 8,
  reminderMinute: "00",
  reminderPeriod: "AM" as const,
  reminderDays: [1, 2, 3, 4, 5],
};

export function AppSettingsProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const deviceScheme = useColorScheme();
  const [darkMode, setDarkModeState] = useState(deviceScheme !== "light");
  const [followSystemTheme, setFollowSystemTheme] = useState(true);
  const setDarkMode = useCallback(
    (value: boolean) => {
      setFollowSystemTheme(false);
      setDarkModeState(value);
      AsyncStorage.getItem("selah.reader.preferences.v1").then((raw) => {
        let saved: any = {};
        try {
          saved = raw ? JSON.parse(raw) : {};
        } catch {}
        return AsyncStorage.setItem(
          "selah.reader.preferences.v1",
          JSON.stringify({
            ...saved,
            darkMode: value,
            themeMode: value ? "dark" : "light",
          }),
        );
      });
      if (user)
        supabase
          .from("reader_preferences")
          .upsert({
            user_id: user.id,
            dark_mode: value,
            theme_mode: value ? "dark" : "light",
          })
          .then(() => {});
    },
    [user],
  );
  useEffect(() => {
    if (followSystemTheme) setDarkModeState(deviceScheme !== "light");
  }, [deviceScheme, followSystemTheme]);
  const [showVerseNumbers, setShowVerseNumbers] = useState(true);
  const [redLettering, setRedLettering] = useState(true);
  const [preferredTranslationId, setPreferredTranslationId] = useState(DEFAULTS.translationId);
  const [preferredTranslationName, setPreferredTranslationName] = useState(
    DEFAULTS.translationName,
  );
  const [preferredTranslationShortName, setPreferredTranslationShortName] =
    useState(DEFAULTS.translationShortName);
  const setPreferredTranslation = useCallback(
    (id: string, name: string, shortName: string) => {
      setPreferredTranslationId(id);
      setPreferredTranslationName(name);
      setPreferredTranslationShortName(shortName);
    },
    [],
  );
  const [currentBookId, setCurrentBookId] = useState(DEFAULTS.bookId);
  const [currentBookName, setCurrentBookName] = useState(DEFAULTS.bookName);
  const [currentChapter, setCurrentChapter] = useState(DEFAULTS.chapter);
  const [currentPage, setCurrentPage] = useState(DEFAULTS.page);
  const setCurrentPassage = useCallback(
    (bookId: string, bookName: string, chapter: number) => {
      setCurrentBookId(bookId);
      setCurrentBookName(bookName);
      setCurrentChapter(chapter);
      setCurrentPage(1);
    },
    [],
  );
  const [bookmarkColor, setBookmarkColor] = useState(DEFAULTS.bookmarkColor);
  const [highlightColor, setHighlightColorState] = useState(
    DEFAULTS.highlightColor,
  );
  const setHighlightColor = useCallback(
    (color: string) => {
      setHighlightColorState(color);
      if (user)
        supabase
          .from("reader_preferences")
          .upsert({ user_id: user.id, highlight_color: color })
          .then(() => {});
    },
    [user],
  );
  const [bookmark, setBookmark] = useState<{
    bookId: string;
    bookName: string;
    chapter: number;
    page: number;
  } | null>(null);
  const saveBookmark = useCallback(
    (value: {
      bookId: string;
      bookName: string;
      chapter: number;
      page: number;
    }) => {
      setBookmark(value);
      if (user)
        supabase
          .from("reading_bookmarks")
          .upsert({
            user_id: user.id,
            translation_id: preferredTranslationId,
            book_id: value.bookId,
            book_name: value.bookName,
            chapter: value.chapter,
            page: value.page,
            color: bookmarkColor,
          })
          .then(() => {});
    },
    [user, preferredTranslationId, bookmarkColor],
  );
  const [readerFontSize, setReaderFontSize] = useState(DEFAULTS.readerFontSize);
  const [readerFullscreen, setReaderFullscreen] = useState(false);
  useEffect(() => {
    if (user) return;
    AsyncStorage.getItem("selah.reader.preferences.v1").then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (typeof saved.darkMode === "boolean") {
          setFollowSystemTheme(false);
          setDarkModeState(saved.darkMode);
        }
        if (typeof saved.showVerseNumbers === "boolean")
          setShowVerseNumbers(saved.showVerseNumbers);
        if (typeof saved.redLettering === "boolean")
          setRedLettering(saved.redLettering);
        if (typeof saved.readerFontSize === "number")
          setReaderFontSize(saved.readerFontSize);
        if (typeof saved.highlightColor === "string")
          setHighlightColorState(saved.highlightColor);
      } catch {}
    });
  }, [user?.id]);
  const saveReaderPreferences = useCallback(async () => {
    await AsyncStorage.setItem(
      "selah.reader.preferences.v1",
      JSON.stringify({
        darkMode,
        themeMode: followSystemTheme ? "system" : darkMode ? "dark" : "light",
        showVerseNumbers,
        redLettering,
        readerFontSize,
        highlightColor,
      }),
    );
    if (user)
      await supabase.from("reader_preferences").upsert({
        user_id: user.id,
        dark_mode: darkMode,
        theme_mode: followSystemTheme ? "system" : darkMode ? "dark" : "light",
        show_verse_numbers: showVerseNumbers,
        red_lettering: redLettering,
        reader_font_size: readerFontSize,
        bookmark_color: bookmarkColor,
        highlight_color: highlightColor,
      });
  }, [
    user,
    darkMode,
    showVerseNumbers,
    redLettering,
    readerFontSize,
    bookmarkColor,
    highlightColor,
    followSystemTheme,
  ]);
  const [reminderHour, setReminderHour] = useState(DEFAULTS.reminderHour);
  const [reminderMinute, setReminderMinute] = useState(DEFAULTS.reminderMinute);
  const [reminderPeriod, setReminderPeriod] = useState<"AM" | "PM">(
    DEFAULTS.reminderPeriod,
  );
  const [reminderDays, setReminderDays] = useState(DEFAULTS.reminderDays);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const resetAccountScopedState = useCallback(() => {
    setPreferredTranslationId(DEFAULTS.translationId);
    setPreferredTranslationName(DEFAULTS.translationName);
    setPreferredTranslationShortName(DEFAULTS.translationShortName);
    setCurrentBookId(DEFAULTS.bookId);
    setCurrentBookName(DEFAULTS.bookName);
    setCurrentChapter(DEFAULTS.chapter);
    setCurrentPage(DEFAULTS.page);
    setBookmark(null);
    setBookmarkColor(DEFAULTS.bookmarkColor);
    setHighlightColorState(DEFAULTS.highlightColor);
    setShowVerseNumbers(true);
    setRedLettering(true);
    setReaderFontSize(DEFAULTS.readerFontSize);
    setReaderFullscreen(false);
    setReminderEnabled(true);
    setReminderHour(DEFAULTS.reminderHour);
    setReminderMinute(DEFAULTS.reminderMinute);
    setReminderPeriod(DEFAULTS.reminderPeriod);
    setReminderDays(DEFAULTS.reminderDays);
  }, []);
  useEffect(() => {
    resetAccountScopedState();
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("reader_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("reading_bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("reminder_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]).then(([profile, preferences, savedBookmark, reminder]) => {
      if (profile.data) {
        setPreferredTranslationId(profile.data.preferred_translation_id);
        setPreferredTranslationName(profile.data.preferred_translation_name);
        setPreferredTranslationShortName(
          profile.data.preferred_translation_short_name,
        );
      }
      if (preferences.data) {
        if (preferences.data.theme_mode === "system") {
          setFollowSystemTheme(true);
          setDarkModeState(deviceScheme !== "light");
        } else {
          setFollowSystemTheme(false);
          setDarkModeState(preferences.data.theme_mode === "dark");
        }
        setShowVerseNumbers(preferences.data.show_verse_numbers);
        setRedLettering(preferences.data.red_lettering);
        setReaderFontSize(preferences.data.reader_font_size);
        setBookmarkColor(preferences.data.bookmark_color || DEFAULTS.bookmarkColor);
        setHighlightColorState(
          preferences.data.highlight_color || DEFAULTS.highlightColor,
        );
      }
      if (savedBookmark.data)
        setBookmark({
          bookId: savedBookmark.data.book_id,
          bookName: savedBookmark.data.book_name,
          chapter: savedBookmark.data.chapter,
          page: savedBookmark.data.page,
        });
      if (reminder.data) {
        setReminderEnabled(reminder.data.enabled);
        setReminderHour(reminder.data.hour);
        setReminderMinute(String(reminder.data.minute).padStart(2, "0"));
        setReminderPeriod(reminder.data.period);
        setReminderDays(reminder.data.days);
      }
    });
  }, [user?.id, deviceScheme, resetAccountScopedState]);
  useEffect(() => {
    if (user)
      supabase
        .from("reader_preferences")
        .upsert({ user_id: user.id, bookmark_color: bookmarkColor })
        .then(() => {});
  }, [bookmarkColor, user?.id]);
  const saveReminderSettings = useCallback(
    async (
      hour: number,
      minute: string,
      period: "AM" | "PM",
      days: number[],
      enabled: boolean,
    ) => {
      if (!user) return;
      await supabase.from("reminder_settings").upsert({
        user_id: user.id,
        enabled,
        hour,
        minute: Number(minute),
        period,
        days,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });
    },
    [user],
  );
  const value = useMemo(
    () => ({
      darkMode,
      setDarkMode,
      showVerseNumbers,
      setShowVerseNumbers,
      redLettering,
      setRedLettering,
      preferredTranslationId,
      preferredTranslationName,
      preferredTranslationShortName,
      setPreferredTranslation,
      currentBookId,
      currentBookName,
      currentChapter,
      setCurrentPassage,
      currentPage,
      setCurrentPage,
      bookmarkColor,
      setBookmarkColor,
      highlightColor,
      setHighlightColor,
      bookmark,
      saveBookmark,
      readerFontSize,
      setReaderFontSize,
      saveReaderPreferences,
      readerFullscreen,
      setReaderFullscreen,
      reminderHour,
      setReminderHour,
      reminderMinute,
      setReminderMinute,
      reminderPeriod,
      setReminderPeriod,
      reminderDays,
      setReminderDays,
      reminderEnabled,
      setReminderEnabled,
      saveReminderSettings,
    }),
    [
      darkMode,
      setDarkMode,
      showVerseNumbers,
      redLettering,
      preferredTranslationId,
      preferredTranslationName,
      preferredTranslationShortName,
      setPreferredTranslation,
      currentBookId,
      currentBookName,
      currentChapter,
      setCurrentPassage,
      currentPage,
      bookmarkColor,
      highlightColor,
      setHighlightColor,
      bookmark,
      saveBookmark,
      readerFontSize,
      saveReaderPreferences,
      readerFullscreen,
      reminderHour,
      reminderMinute,
      reminderPeriod,
      reminderDays,
      reminderEnabled,
      saveReminderSettings,
    ],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAppSettings() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing AppSettingsProvider");
  return value;
}
