import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DetailScreen } from "@/components/DetailScreen";
import { AppColors } from "@/lib/theme";
import { BibleTranslation, getTranslations } from "@/lib/bibleApi";
import { useAppSettings } from "@/state/AppSettings";
import { useThemeColors } from "@/state/useThemeColors";
import { useAuth } from "@/state/Auth";
import { supabase } from "@/lib/supabase";

export default function BibleVersion() {
  const router = useRouter();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const settings = useAppSettings();
  const { user } = useAuth();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [translations, setTranslations] = useState<BibleTranslation[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    getTranslations(controller.signal)
      .then(setTranslations)
      .catch((reason) => {
        if (reason?.name !== "AbortError")
          setError("Bible versions could not be loaded.");
      });
    return () => controller.abort();
  }, []);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return translations
      .filter(
        (item) =>
          item.language === "eng" &&
          item.numberOfBooks >= 66 &&
          (!term ||
            `${item.name} ${item.englishName} ${item.shortName}`
              .toLowerCase()
              .includes(term)),
      )
      .sort((a, b) =>
        a.id === "BSB"
          ? -1
          : b.id === "BSB"
            ? 1
            : a.englishName.localeCompare(b.englishName),
      );
  }, [translations, query]);
  const select = async (item: BibleTranslation) => {
    settings.setPreferredTranslation(item.id, item.englishName, item.shortName);
    if (user)
      await supabase
        .from("profiles")
        .update({
          preferred_translation_id: item.id,
          preferred_translation_name: item.englishName,
          preferred_translation_short_name: item.shortName,
        })
        .eq("id", user.id);
    if (onboarding !== "1") router.back();
  };
  const finish = async () => {
    router.replace("/onboarding/guide");
  };
  return (
    <DetailScreen
      title="Bible Version"
      subtitle={
        onboarding === "1"
          ? "Choose the version you want to read"
          : "Choose your default translation"
      }
    >
      {onboarding === "1" && (
        <Text style={s.onboarding}>
          Select a Bible version to begin. You can change it later in Settings.
        </Text>
      )}
      <View style={s.search}>
        <Ionicons name="search" size={19} color={c.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search English versions"
          placeholderTextColor={c.muted}
          style={s.input}
        />
      </View>
      {!translations.length && !error && (
        <View style={s.state}>
          <ActivityIndicator color={c.green} />
          <Text style={s.stateText}>Loading available versions…</Text>
        </View>
      )}
      {error && (
        <View style={s.state}>
          <Text style={s.stateText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        renderItem={({ item }) => {
          const active = item.id === settings.preferredTranslationId;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => select(item)}
              style={s.row}
            >
              <View style={s.copy}>
                <View style={s.nameRow}>
                  <Text style={s.name}>{item.englishName}</Text>
                  {item.id === "BSB" && (
                    <Text style={s.recommended}>RECOMMENDED</Text>
                  )}
                </View>
                <Text style={s.meta}>
                  {item.shortName} · {item.totalNumberOfChapters} chapters
                </Text>
              </View>
              {active ? (
                <Ionicons name="checkmark-circle" size={22} color={c.green} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={c.muted} />
              )}
            </Pressable>
          );
        }}
        ListFooterComponent={
          <Pressable
            onPress={() => Linking.openURL("https://bible.helloao.org/")}
          >
            <Text style={s.provider}>
              Scripture versions provided by Free Use Bible API · View licenses
            </Text>
          </Pressable>
        }
      />
      {onboarding === "1" && (
        <Pressable onPress={finish} style={s.continue}>
          <Text style={s.continueText}>
            Continue with {settings.preferredTranslationShortName}
          </Text>
        </Pressable>
      )}
    </DetailScreen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    onboarding: {
      color: c.muted,
      fontSize: 12,
      lineHeight: 18,
      paddingHorizontal: 18,
      paddingTop: 14,
    },
    search: {
      height: 50,
      margin: 16,
      marginBottom: 8,
      paddingHorizontal: 13,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      backgroundColor: c.surface,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: c.line,
    },
    input: { flex: 1, color: c.text },
    state: { padding: 30, alignItems: "center", gap: 10 },
    stateText: { color: c.muted, fontSize: 12 },
    list: { paddingHorizontal: 16, paddingBottom: 90 },
    row: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderColor: c.line,
    },
    copy: { flex: 1 },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
    name: { color: c.text, fontWeight: "600", flexShrink: 1 },
    recommended: {
      color: c.gold,
      fontSize: 8,
      fontWeight: "800",
      letterSpacing: 0.7,
    },
    meta: { color: c.muted, fontSize: 10, marginTop: 4 },
    provider: {
      color: c.muted,
      fontSize: 9,
      textAlign: "center",
      lineHeight: 14,
      padding: 20,
    },
    continue: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 16,
      backgroundColor: c.green,
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
    },
    continueText: { color: c.onAccent, fontWeight: "800" },
  });
