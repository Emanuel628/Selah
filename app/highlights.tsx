import { useEffect, useMemo, useState } from "react";
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
import { getChapter } from "@/lib/bibleApi";
import { paginateVerses } from "@/lib/readerPagination";
import { supabase } from "@/lib/supabase";
import { AppColors } from "@/lib/theme";
import { useAppSettings } from "@/state/AppSettings";
import { useAuth } from "@/state/Auth";
import { useThemeColors } from "@/state/useThemeColors";

type HighlightRow = {
  id: string;
  translation_id: string;
  book_id: string;
  book_name: string;
  chapter: number;
  page: number;
  verse_start: number;
  verse_end: number;
  color: string;
  created_at: string;
};

export default function Highlights() {
  const router = useRouter();
  const { user } = useAuth();
  const settings = useAppSettings();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [items, setItems] = useState<HighlightRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.resolve(
      supabase
        .from("scripture_highlights")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    )
      .then(({ data }) => setItems((data || []) as HighlightRow[]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const openHighlight = async (item: HighlightRow) => {
    const data = await getChapter(
      settings.preferredTranslationId,
      item.book_id,
      item.chapter,
    );
    const pages = paginateVerses(data.verses, 390, settings.readerFontSize);
    const pageIndex = pages.findIndex((page) =>
      page.some((verse) => verse.number === item.verse_start),
    );
    settings.setCurrentPassage(item.book_id, item.book_name, item.chapter);
    setTimeout(() => settings.setCurrentPage(Math.max(1, pageIndex + 1)), 0);
    router.push("/(tabs)");
  };

  return (
    <DetailScreen
      title="Highlights"
      subtitle="Review highlighted passages and return to the exact page."
    >
      <ScrollView contentContainerStyle={s.body}>
        {loading && (
          <View style={s.state}>
            <ActivityIndicator color={c.green} />
            <Text style={s.muted}>Loading highlights...</Text>
          </View>
        )}
        {!loading && !items.length && (
          <View style={s.empty}>
            <Ionicons name="color-wand-outline" size={32} color={c.muted} />
            <Text style={s.emptyTitle}>No highlights yet</Text>
            <Text style={s.muted}>
              Long-press Scripture in Read, then drag to save a highlighted
              passage here.
            </Text>
          </View>
        )}
        {items.map((item) => (
          <Pressable
            accessibilityLabel={`Open highlight ${item.book_name} ${item.chapter}:${item.verse_start}`}
            key={item.id}
            onPress={() => openHighlight(item)}
            style={s.row}
          >
            <View style={[s.swatch, { backgroundColor: item.color }]} />
            <View style={s.copy}>
              <Text style={s.ref}>
                {item.book_name} {item.chapter}:{item.verse_start}
                {item.verse_end > item.verse_start ? `-${item.verse_end}` : ""} ·
                page {item.page}
              </Text>
              <Text style={s.meta}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.muted} />
          </Pressable>
        ))}
      </ScrollView>
    </DetailScreen>
  );
}

const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 36 },
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
    row: {
      minHeight: 70,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 14,
      padding: 13,
      marginBottom: 10,
    },
    swatch: { width: 18, height: 42, borderRadius: 9 },
    copy: { flex: 1 },
    ref: { color: c.text, fontWeight: "800" },
    meta: { color: c.muted, fontSize: 10, marginTop: 4 },
  });
