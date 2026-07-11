import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
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
import { THOUGHT_GROUPS, ThoughtGroup, useGarden } from "@/state/Garden";
import { useThemeColors } from "@/state/useThemeColors";

type Sort = "Updated" | "Newest" | "Oldest";
export default function Garden() {
  const router = useRouter();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const { notes } = useGarden();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"All" | ThoughtGroup>("All");
  const [tag, setTag] = useState("All");
  const [sort, setSort] = useState<Sort>("Updated");
  const [filterOpen, setFilterOpen] = useState(false);
  const tags = useMemo(
    () => Array.from(new Set(notes.flatMap((note) => note.tags))).sort(),
    [notes],
  );
  const activeCount =
    (group === "All" ? 0 : 1) +
    (tag === "All" ? 0 : 1) +
    (sort === "Updated" ? 0 : 1);
  const visible = useMemo(() => {
    const clean = query.trim().toLowerCase();
    return notes
      .filter(
        (note) =>
          (group === "All" || note.group === group) &&
          (tag === "All" || note.tags.includes(tag)) &&
          (!clean ||
            `${note.title} ${note.body} ${note.reference} ${note.tags.join(" ")}`
              .toLowerCase()
              .includes(clean)),
      )
      .sort((a, b) =>
        sort === "Oldest"
          ? a.createdAt.localeCompare(b.createdAt)
          : sort === "Newest"
            ? b.createdAt.localeCompare(a.createdAt)
            : b.updatedAt.localeCompare(a.updatedAt),
      );
  }, [notes, query, group, tag, sort]);
  const reset = () => {
    setGroup("All");
    setTag("All");
    setSort("Updated");
  };
  return (
    <Screen title="Garden">
      <View style={s.summary}>
        <View>
          <Text style={s.summaryLabel}>YOUR GARDEN</Text>
          <Text style={s.summaryValue}>
            {notes.length} {notes.length === 1 ? "reflection" : "reflections"}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="New note"
          onPress={() => router.push("/note/new")}
          style={s.newButton}
        >
          <Ionicons name="add" size={20} color={c.onAccent} />
          <Text style={s.newText}>New note</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityLabel="Open Garden Insights"
        onPress={() => router.push("/garden-insights" as any)}
        style={s.insights}
      >
        <Ionicons name="sparkles-outline" size={18} color={c.gold} />
        <View style={s.insightsCopy}>
          <Text style={s.insightsTitle}>Garden Insights</Text>
          <Text style={s.insightsText}>
            See themes, questions, applications, and connections forming.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.muted} />
      </Pressable>
      <Pressable
        accessibilityLabel="Open Knowledge Graph"
        onPress={() => router.push("/knowledge-graph" as any)}
        style={s.insights}
      >
        <Ionicons name="git-network-outline" size={18} color={c.green} />
        <View style={s.insightsCopy}>
          <Text style={s.insightsTitle}>Knowledge Graph</Text>
          <Text style={s.insightsText}>
            Browse connections between books, thought groups, tags, and notes.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.muted} />
      </Pressable>
      <View style={s.tools}>
        <View style={s.search}>
          <Ionicons name="search" size={18} color={c.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search your Garden"
            placeholderTextColor={c.muted}
            style={s.searchInput}
          />
        </View>
        <Pressable
          accessibilityLabel="Advanced filters"
          onPress={() => setFilterOpen(true)}
          style={[s.filterButton, activeCount > 0 && s.filterButtonActive]}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeCount ? c.onAccent : c.green}
          />
          {activeCount > 0 && <Text style={s.filterCount}>{activeCount}</Text>}
        </Pressable>
      </View>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="leaf-outline" size={28} color={c.muted} />
            <Text style={s.emptyTitle}>No reflections found</Text>
            <Text style={s.emptyCopy}>
              Adjust your filters or capture a new thought from Scripture.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/note/[id]", params: { id: item.id } })
            }
            style={({ pressed }) => [s.card, pressed && s.pressed]}
          >
            <View style={s.metaRow}>
              <Text style={s.reference}>{item.reference}</Text>
              <Text style={s.groupLabel}>{item.group}</Text>
            </View>
            <Text style={s.title}>{item.title}</Text>
            <Text numberOfLines={2} style={s.noteBody}>
              {item.body}
            </Text>
            <View style={s.cardBottom}>
              <View style={s.tagRow}>
                {item.tags.slice(0, 3).map((itemTag) => (
                  <Text key={itemTag} style={s.tag}>
                    #{itemTag}
                  </Text>
                ))}
              </View>
              <Ionicons name="chevron-forward" size={17} color={c.muted} />
            </View>
          </Pressable>
        )}
      />
      <Modal
        visible={filterOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterOpen(false)}
      >
        <View style={s.overlay}>
          <Pressable style={s.scrim} onPress={() => setFilterOpen(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <View>
                <Text style={s.sheetTitle}>Filter Garden</Text>
                <Text style={s.sheetSubtitle}>
                  Narrow reflections by how you organized them.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close filters"
                onPress={() => setFilterOpen(false)}
                style={s.close}
              >
                <Ionicons name="close" size={22} color={c.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.label}>THOUGHT GROUP</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.horizontalOptions}
              >
                {(["All", ...THOUGHT_GROUPS] as const).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setGroup(item)}
                    style={[s.option, group === item && s.optionActive]}
                  >
                    <Text
                      style={[
                        s.optionText,
                        group === item && s.optionTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={s.label}>TAG</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.horizontalOptions}
              >
                {["All", ...tags].map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setTag(item)}
                    style={[s.option, tag === item && s.optionActive]}
                  >
                    <Text
                      style={[s.optionText, tag === item && s.optionTextActive]}
                    >
                      {item === "All" ? "All tags" : `#${item}`}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={s.label}>SORT</Text>
              <View style={s.options}>
                {(["Updated", "Newest", "Oldest"] as Sort[]).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setSort(item)}
                    style={[s.option, sort === item && s.optionActive]}
                  >
                    <Text
                      style={[
                        s.optionText,
                        sort === item && s.optionTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={s.sheetActions}>
                <Pressable onPress={reset} style={s.reset}>
                  <Text style={s.resetText}>Reset</Text>
                </Pressable>
                <Pressable onPress={() => setFilterOpen(false)} style={s.apply}>
                  <Text style={s.applyText}>Show {visible.length}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    summary: {
      margin: 18,
      marginBottom: 10,
      padding: 16,
      borderRadius: 16,
      backgroundColor: c.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: c.line,
    },
    summaryLabel: {
      color: c.muted,
      fontSize: 9,
      fontWeight: "700",
      letterSpacing: 1.3,
    },
    summaryValue: {
      color: c.text,
      fontSize: 18,
      fontWeight: "700",
      marginTop: 4,
    },
    newButton: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: c.green,
      paddingHorizontal: 13,
      borderRadius: 11,
    },
    newText: { color: c.onAccent, fontWeight: "800", fontSize: 12 },
    insights: {
      marginHorizontal: 18,
      marginBottom: 10,
      minHeight: 58,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      gap: 10,
    },
    insightsCopy: { flex: 1 },
    insightsTitle: { color: c.text, fontWeight: "800" },
    insightsText: { color: c.muted, fontSize: 10, marginTop: 2 },
    tools: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 18,
      marginBottom: 10,
    },
    search: {
      flex: 1,
      height: 46,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.line,
      paddingHorizontal: 12,
    },
    searchInput: { flex: 1, color: c.text },
    filterButton: {
      width: 46,
      height: 46,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: "center",
      justifyContent: "center",
    },
    filterButtonActive: { backgroundColor: c.green },
    filterCount: {
      position: "absolute",
      top: 4,
      right: 5,
      color: c.onAccent,
      fontSize: 8,
      fontWeight: "800",
    },
    list: { paddingHorizontal: 18, paddingBottom: 30 },
    card: {
      backgroundColor: c.surface,
      padding: 16,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: c.line,
      marginBottom: 11,
    },
    pressed: { opacity: 0.7 },
    metaRow: { flexDirection: "row", justifyContent: "space-between" },
    reference: { color: c.green, fontSize: 11, fontWeight: "700" },
    groupLabel: {
      color: c.muted,
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    title: { color: c.text, fontSize: 17, fontWeight: "700", marginTop: 10 },
    noteBody: { color: c.muted, lineHeight: 19, marginTop: 6 },
    cardBottom: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 13,
    },
    tagRow: { flexDirection: "row", gap: 8, flex: 1 },
    tag: { color: c.gold, fontSize: 10 },
    empty: { alignItems: "center", padding: 35 },
    emptyTitle: { color: c.text, fontWeight: "700", marginTop: 10 },
    emptyCopy: {
      color: c.muted,
      textAlign: "center",
      fontSize: 11,
      lineHeight: 17,
      marginTop: 5,
    },
    overlay: { flex: 1, justifyContent: "flex-end" },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,.45)",
    },
    sheet: {
      width: "100%",
      maxWidth: 520,
      maxHeight: "68%",
      alignSelf: "center",
      backgroundColor: c.bg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 16,
      paddingBottom: 22,
      borderWidth: 1,
      borderColor: c.line,
    },
    sheetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    sheetTitle: { color: c.text, fontSize: 20, fontWeight: "700" },
    sheetSubtitle: { color: c.muted, fontSize: 11, marginTop: 3 },
    close: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.2,
      marginTop: 6,
      marginBottom: 6,
    },
    horizontalOptions: { gap: 8, paddingRight: 12, paddingBottom: 10 },
    options: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 8,
    },
    option: {
      minHeight: 38,
      paddingHorizontal: 13,
      borderRadius: 21,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      justifyContent: "center",
    },
    optionActive: { backgroundColor: c.green },
    optionText: { color: c.text, fontSize: 11 },
    optionTextActive: { color: c.onAccent, fontWeight: "700" },
    sheetActions: { flexDirection: "row", gap: 10, marginTop: 6 },
    reset: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: "center",
      justifyContent: "center",
    },
    resetText: { color: c.text, fontWeight: "700" },
    apply: {
      flex: 2,
      height: 48,
      borderRadius: 12,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    applyText: { color: c.onAccent, fontWeight: "800" },
  });
