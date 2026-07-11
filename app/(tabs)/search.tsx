import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { AppColors } from "@/lib/theme";
import { useThemeColors } from "@/state/useThemeColors";
const scopes = ["All", "Scripture", "Garden"];
export default function Search() {
  const router = useRouter();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("All");
  const clean = query.trim();
  const results = useMemo(
    () =>
      clean
        ? [
            {
              type: "Scripture",
              title: "Genesis 1:2",
              copy: "The Spirit of God was hovering over the waters.",
            },
            {
              type: "Garden",
              title: "Life moving over chaos",
              copy: "Ruach signifies dynamic life moving over chaos.",
            },
          ].filter((x) => scope === "All" || x.type === scope)
        : [],
    [clean, scope],
  );
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
            placeholder="Search Scripture and your Garden"
            placeholderTextColor={c.muted}
            style={s.input}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={20} color={c.muted} />
            </Pressable>
          )}
        </View>
        <View style={s.scopes}>
          {scopes.map((item) => (
            <Pressable
              key={item}
              onPress={() => setScope(item)}
              style={[s.scope, scope === item && s.scopeActive]}
            >
              <Text style={[s.scopeText, scope === item && s.scopeTextActive]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
        {!clean ? (
          <>
            <Text style={s.label}>RECENT</Text>
            {["Spirit of God over chaos", "Colossians 1 inheritance"].map(
              (item) => (
                <Pressable
                  key={item}
                  onPress={() => setQuery(item)}
                  style={s.recent}
                >
                  <Ionicons name="time-outline" size={18} color={c.muted} />
                  <Text style={s.recentText}>{item}</Text>
                </Pressable>
              ),
            )}
            <View style={s.tip}>
              <Ionicons name="sparkles-outline" size={20} color={c.gold} />
              <View style={s.tipCopy}>
                <Text style={s.tipTitle}>Search across your study</Text>
                <Text style={s.tipText}>
                  Find passages, reflection titles, note text, and tags from one
                  place.
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={s.label}>{results.length} RESULTS</Text>
            {results.map((result) => (
              <Pressable
                key={result.type}
                onPress={() =>
                  result.type === "Garden" &&
                  router.push({
                    pathname: "/note/[id]",
                    params: { id: "genesis-1-2" },
                  })
                }
                style={s.result}
              >
                <View style={s.resultTop}>
                  <Text style={s.resultType}>{result.type.toUpperCase()}</Text>
                  <Ionicons name="chevron-forward" size={17} color={c.muted} />
                </View>
                <Text style={s.resultTitle}>{result.title}</Text>
                <Text style={s.resultCopy}>{result.copy}</Text>
              </Pressable>
            ))}
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
    },
    input: { flex: 1, color: c.text },
    scopes: { flexDirection: "row", gap: 7, marginVertical: 14 },
    scope: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: c.surface,
    },
    scopeActive: { backgroundColor: c.green },
    scopeText: { color: c.muted, fontSize: 12 },
    scopeTextActive: { color: c.onAccent, fontWeight: "700" },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.3,
      marginTop: 8,
      marginBottom: 7,
    },
    recent: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      borderBottomWidth: 1,
      borderColor: c.line,
    },
    recentText: { color: c.text },
    tip: {
      flexDirection: "row",
      gap: 12,
      backgroundColor: c.surface,
      padding: 15,
      borderRadius: 14,
      marginTop: 22,
    },
    tipCopy: { flex: 1 },
    tipTitle: { color: c.text, fontWeight: "600" },
    tipText: { color: c.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
    result: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 15,
      borderWidth: 1,
      borderColor: c.line,
      marginBottom: 10,
    },
    resultTop: { flexDirection: "row", justifyContent: "space-between" },
    resultType: {
      color: c.green,
      fontSize: 9,
      fontWeight: "700",
      letterSpacing: 1.2,
    },
    resultTitle: {
      color: c.text,
      fontSize: 16,
      fontWeight: "700",
      marginTop: 8,
    },
    resultCopy: { color: c.muted, lineHeight: 18, marginTop: 5 },
  });
