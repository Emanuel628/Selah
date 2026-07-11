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
  reminderHour: number;
  setReminderHour: (v: number) => void;
  reminderMinute: string;
  setReminderMinute: (v: string) => void;
  reminderPeriod: "AM" | "PM";
  setReminderPeriod: (v: "AM" | "PM") => void;
  reminderDays: number[];
  setReminderDays: (v: number[]) => void;
  saveReminderSettings: (
    hour: number,
    minute: string,
    period: "AM" | "PM",
    days: number[],
  ) => Promise<void>;
};
const Context = createContext<Settings | null>(null);

export function AppSettingsProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const deviceScheme = useColorScheme();
  const [darkMode, setDarkModeState] = useState(deviceScheme !== "light");
  const [followSystemTheme, setFollowSystemTheme] = useState(true);
  const setDarkMode = useCallback((value: boolean) => {
    setFollowSystemTheme(false);
    setDarkModeState(value);
  }, []);
  useEffect(() => {
    if (followSystemTheme) setDarkModeState(deviceScheme !== "light");
  }, [deviceScheme, followSystemTheme]);
  const [showVerseNumbers, setShowVerseNumbers] = useState(true);
  const [redLettering, setRedLettering] = useState(true);
  const [preferredTranslationId, setPreferredTranslationId] = useState("BSB");
  const [preferredTranslationName, setPreferredTranslationName] = useState(
    "Berean Standard Bible",
  );
  const [preferredTranslationShortName, setPreferredTranslationShortName] =
    useState("BSB");
  const setPreferredTranslation = useCallback(
    (id: string, name: string, shortName: string) => {
      setPreferredTranslationId(id);
      setPreferredTranslationName(name);
      setPreferredTranslationShortName(shortName);
    },
    [],
  );
  const [currentBookId, setCurrentBookId] = useState("GEN");
  const [currentBookName, setCurrentBookName] = useState("Genesis");
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const setCurrentPassage = useCallback(
    (bookId: string, bookName: string, chapter: number) => {
      setCurrentBookId(bookId);
      setCurrentBookName(bookName);
      setCurrentChapter(chapter);
      setCurrentPage(1);
    },
    [],
  );
  const [bookmarkColor, setBookmarkColor] = useState("#D4A72C");
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
  const [readerFontSize, setReaderFontSize] = useState(20);
  useEffect(() => {
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
      } catch {}
    });
  }, []);
  const saveReaderPreferences = useCallback(async () => {
    await AsyncStorage.setItem(
      "selah.reader.preferences.v1",
      JSON.stringify({
        darkMode,
        themeMode: followSystemTheme ? "system" : darkMode ? "dark" : "light",
        showVerseNumbers,
        redLettering,
        readerFontSize,
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
      });
  }, [
    user,
    darkMode,
    showVerseNumbers,
    redLettering,
    readerFontSize,
    bookmarkColor,
    followSystemTheme,
  ]);
  const [reminderHour, setReminderHour] = useState(8);
  const [reminderMinute, setReminderMinute] = useState("00");
  const [reminderPeriod, setReminderPeriod] = useState<"AM" | "PM">("AM");
  const [reminderDays, setReminderDays] = useState([1, 2, 3, 4, 5]);
  useEffect(() => {
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
        setBookmarkColor(preferences.data.bookmark_color);
      }
      if (savedBookmark.data)
        setBookmark({
          bookId: savedBookmark.data.book_id,
          bookName: savedBookmark.data.book_name,
          chapter: savedBookmark.data.chapter,
          page: savedBookmark.data.page,
        });
      if (reminder.data) {
        setReminderHour(reminder.data.hour);
        setReminderMinute(String(reminder.data.minute).padStart(2, "0"));
        setReminderPeriod(reminder.data.period);
        setReminderDays(reminder.data.days);
      }
    });
  }, [user?.id, deviceScheme]);
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
    ) => {
      if (!user) return;
      await supabase.from("reminder_settings").upsert({
        user_id: user.id,
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
      bookmark,
      saveBookmark,
      readerFontSize,
      setReaderFontSize,
      saveReaderPreferences,
      reminderHour,
      setReminderHour,
      reminderMinute,
      setReminderMinute,
      reminderPeriod,
      setReminderPeriod,
      reminderDays,
      setReminderDays,
      saveReminderSettings,
    }),
    [
      darkMode,
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
      bookmark,
      saveBookmark,
      readerFontSize,
      saveReaderPreferences,
      reminderHour,
      reminderMinute,
      reminderPeriod,
      reminderDays,
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
