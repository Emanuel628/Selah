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
  const topThemes = useMemo(() => {
    const counts = new Map<string, number>();
    notes.forEach((note) =>
      note.tags.forEach((item) => counts.set(item, (counts.get(item) || 0) + 1)),
    );
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [notes]);
  const reset = () => {
    setGroup("All");
    setTag("All");
    setSort("Updated");
  };

  if (!notes.length) {
    return (
      <Screen title="Garden">
        <View style={s.emptyFull}>
          <Ionicons name="leaf-outline" size={36} color={c.green} />
          <Text style={s.emptyTitle}>Your Garden begins with one reflection.</Text>
          <Text style={s.emptyCopy}>
            When something stays with you while reading, tap Reflect and save it here.
          </Text>
          <Pressable onPress={() => router.push("/(tabs)")} style={s.primary}>
            <Text style={s.primaryText}>Continue reading</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

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
          accessibilityLabel="New reflection"
          onPress={() => router.push("/note/new")}
          style={s.newButton}
        >
          <Ionicons name="add" size={20} color={c.onAccent} />
          <Text style={s.newText}>Reflect</Text>
        </Pressable>
      </View>

      {notes.length <= 2 && (
        <View style={s.growth}>
          <Text style={s.growthTitle}>Your Garden is taking root.</Text>
          <Text style={s.growthCopy}>
            Add a few more reflections and Selah will begin showing themes and connections.
          </Text>
        </View>
      )}

      {notes.length >= 3 && (
        <View style={s.themePanel}>
          <View style={s.panelHeader}>
            <View>
              <Text style={s.panelTitle}>Themes beginning to grow</Text>
              <Text style={s.panelCopy}>Patterns from your saved reflections.</Text>
            </View>
            {notes.length >= 6 && (
              <Pressable onPress={() => router.push("/garden-insights" as any)}>
                <Text style={s.panelLink}>Insights</Text>
              </Pressable>
            )}
          </View>
          {topThemes.length ? (
            topThemes.map(([item, count]) => (
              <View key={item} style={s.themeRow}>
                <Text style={s.themeName}>{item}</Text>
                <Text style={s.themeCount}>{count} reflections</Text>
              </View>
            ))
          ) : (
            <Text style={s.muted}>Add themes to reflections to reveal patterns.</Text>
          )}
          {notes.length >= 6 && (
            <Pressable
              onPress={() => router.push("/knowledge-graph" as any)}
              style={s.connections}
            >
              <Ionicons name="git-network-outline" size={17} color={c.green} />
              <Text style={s.connectionsText}>Open Connections</Text>
            </Pressable>
          )}
        </View>
      )}

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
            <Text style={s.emptyCopy}>Adjust your filters or search terms.</Text>
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
              {!!item.group && <Text style={s.groupLabel}>{item.group}</Text>}
            </View>
            <Text style={s.title}>{item.title || item.body}</Text>
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
                <Text style={s.sheetSubtitle}>Narrow reflections when you need to.</Text>
              </View>
              <Pressable onPress={() => setFilterOpen(false)} style={s.close}>
                <Ionicons name="close" size={22} color={c.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.label}>THOUGHT TYPE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontalOptions}>
                {(["All", ...THOUGHT_GROUPS] as const).map((item) => (
                  <Pressable key={item} onPress={() => setGroup(item)} style={[s.option, group === item && s.optionActive]}>
                    <Text style={[s.optionText, group === item && s.optionTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={s.label}>THEME</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontalOptions}>
                {["All", ...tags].map((item) => (
                  <Pressable key={item} onPress={() => setTag(item)} style={[s.option, tag === item && s.optionActive]}>
                    <Text style={[s.optionText, tag === item && s.optionTextActive]}>{item === "All" ? "All themes" : `#${item}`}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={s.label}>SORT</Text>
              <View style={s.options}>
                {(["Updated", "Newest", "Oldest"] as Sort[]).map((item) => (
                  <Pressable key={item} onPress={() => setSort(item)} style={[s.option, sort === item && s.optionActive]}>
                    <Text style={[s.optionText, sort === item && s.optionTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={s.actions}>
                <Pressable onPress={reset} style={s.reset}>
                  <Text style={s.resetText}>Reset</Text>
                </Pressable>
                <Pressable onPress={() => setFilterOpen(false)} style={s.apply}>
                  <Text style={s.applyText}>Apply</Text>
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
    emptyFull: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
    emptyTitle: { color: c.text, fontSize: 19, fontWeight: "900", textAlign: "center", marginTop: 10 },
    emptyCopy: { color: c.muted, textAlign: "center", lineHeight: 20, marginTop: 8 },
    primary: { minHeight: 48, borderRadius: 13, backgroundColor: c.green, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, marginTop: 18 },
    primaryText: { color: c.onAccent, fontWeight: "900" },
    summary: { minHeight: 76, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderColor: c.line },
    summaryLabel: { color: c.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
    summaryValue: { color: c.text, fontSize: 20, fontWeight: "900", marginTop: 3 },
    newButton: { height: 42, borderRadius: 12, backgroundColor: c.green, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12 },
    newText: { color: c.onAccent, fontWeight: "900" },
    growth: { margin: 18, marginBottom: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 15 },
    growthTitle: { color: c.text, fontWeight: "900" },
    growthCopy: { color: c.muted, fontSize: 12, lineHeight: 19, marginTop: 5 },
    themePanel: { margin: 18, marginBottom: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 15 },
    panelHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 10 },
    panelTitle: { color: c.text, fontWeight: "900" },
    panelCopy: { color: c.muted, fontSize: 11, marginTop: 3 },
    panelLink: { color: c.green, fontWeight: "900", fontSize: 12 },
    themeRow: { minHeight: 34, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderColor: c.line },
    themeName: { color: c.text, fontWeight: "800" },
    themeCount: { color: c.muted, fontSize: 11 },
    muted: { color: c.muted, fontSize: 12 },
    connections: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8 },
    connectionsText: { color: c.green, fontWeight: "900" },
    tools: { flexDirection: "row", gap: 8, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10 },
    search: { flex: 1, height: 46, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.surface, borderRadius: 13, borderWidth: 1, borderColor: c.line, paddingHorizontal: 12 },
    searchInput: { flex: 1, color: c.text, fontSize: 13 },
    filterButton: { width: 46, height: 46, borderRadius: 13, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" },
    filterButtonActive: { backgroundColor: c.green, borderColor: c.green },
    filterCount: { position: "absolute", top: 5, right: 7, color: c.onAccent, fontSize: 9, fontWeight: "900" },
    list: { padding: 18, paddingTop: 4, paddingBottom: 32 },
    empty: { alignItems: "center", padding: 28 },
    card: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 15, marginBottom: 11 },
    pressed: { opacity: 0.75 },
    metaRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
    reference: { color: c.green, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
    groupLabel: { color: c.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 },
    title: { color: c.text, fontSize: 16, fontWeight: "900", marginTop: 8 },
    noteBody: { color: c.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
    cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
    tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1 },
    tag: { color: c.gold, fontSize: 10, fontWeight: "800" },
    overlay: { flex: 1, justifyContent: "flex-end" },
    scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,.45)" },
    sheet: { maxHeight: "78%", backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28, borderWidth: 1, borderColor: c.line },
    sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
    sheetTitle: { color: c.text, fontSize: 20, fontWeight: "900" },
    sheetSubtitle: { color: c.muted, fontSize: 11, marginTop: 3 },
    close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    label: { color: c.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 7 },
    horizontalOptions: { gap: 8, paddingBottom: 18 },
    options: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
    option: { minHeight: 40, justifyContent: "center", paddingHorizontal: 12, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
    optionActive: { backgroundColor: c.green, borderColor: c.green },
    optionText: { color: c.text, fontSize: 11 },
    optionTextActive: { color: c.onAccent, fontWeight: "900" },
    actions: { flexDirection: "row", gap: 10, marginTop: 6 },
    reset: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" },
    resetText: { color: c.text, fontWeight: "800" },
    apply: { flex: 2, height: 48, borderRadius: 12, backgroundColor: c.green, alignItems: "center", justifyContent: "center" },
    applyText: { color: c.onAccent, fontWeight: "900" },
  });
