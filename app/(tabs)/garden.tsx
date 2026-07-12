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
import {
  buildBrowseFacets,
  buildInsightCards,
  bucketFor,
  GardenFacet,
  hybridSearch,
  statusLabel,
} from "@/lib/gardenEngine";
import { AppColors } from "@/lib/theme";
import { THOUGHT_GROUPS, ThoughtGroup, useGarden } from "@/state/Garden";
import { useThemeColors } from "@/state/useThemeColors";

type GardenView = "Reflections" | "Browse" | "Insights";
type Quick = "All" | "Open Questions" | "Applications" | "Prayers" | "Recently Revisited";
type Sort = "Updated" | "Newest" | "Oldest";
type BrowseFocus =
  | { type: "theme" | "book" | "thought"; facet: GardenFacet }
  | null;

const QUICK_FILTERS: Quick[] = [
  "All",
  "Open Questions",
  "Applications",
  "Prayers",
  "Recently Revisited",
];
const SECTIONS = ["Today", "This Week", "Earlier This Month", "Older"] as const;

export default function Garden() {
  const router = useRouter();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const {
    notes,
    markResolved,
    markPracticed,
    archiveInsight,
    dismissedInsightIds,
  } = useGarden();
  const [view, setView] = useState<GardenView>("Reflections");
  const [query, setQuery] = useState("");
  const [quick, setQuick] = useState<Quick>("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [group, setGroup] = useState<"All" | ThoughtGroup>("All");
  const [theme, setTheme] = useState("All");
  const [book, setBook] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState<Sort>("Updated");
  const [browseFocus, setBrowseFocus] = useState<BrowseFocus>(null);

  const facets = useMemo(() => buildBrowseFacets(notes), [notes]);
  const insights = useMemo(
    () => buildInsightCards(notes, dismissedInsightIds),
    [notes, dismissedInsightIds],
  );
  const searched = useMemo(() => hybridSearch(notes, query), [notes, query]);
  const filtered = useMemo(() => {
    return searched
      .filter((note) => {
        const quickMatch =
          quick === "All" ||
          (quick === "Open Questions" && note.group === "Question" && note.status === "open") ||
          (quick === "Applications" && note.group === "Application") ||
          (quick === "Prayers" && note.group === "Prayer") ||
          (quick === "Recently Revisited" && !!note.lastRevisitedAt);
        return (
          quickMatch &&
          (group === "All" || note.group === group) &&
          (theme === "All" || note.tags.includes(theme)) &&
          (book === "All" || note.bookName === book) &&
          (status === "All" || note.status === status)
        );
      })
      .sort((a, b) =>
        sort === "Oldest"
          ? a.createdAt.localeCompare(b.createdAt)
          : sort === "Newest"
            ? b.createdAt.localeCompare(a.createdAt)
            : b.updatedAt.localeCompare(a.updatedAt),
      );
  }, [searched, quick, group, theme, book, status, sort]);
  const sectioned = useMemo(
    () =>
      SECTIONS.map((section) => ({
        section,
        data: filtered.filter((note) => bucketFor(note.updatedAt) === section),
      })).filter((item) => item.data.length),
    [filtered],
  );
  const reset = () => {
    setGroup("All");
    setTheme("All");
    setBook("All");
    setStatus("All");
    setSort("Updated");
    setQuick("All");
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
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Garden</Text>
          <Text style={s.count}>
            {notes.length} {notes.length === 1 ? "reflection" : "reflections"}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="New reflection"
          onPress={() => router.push("/note/new")}
          style={s.reflect}
        >
          <Ionicons name="add" size={18} color={c.onAccent} />
          <Text style={s.reflectText}>Reflect</Text>
        </Pressable>
      </View>

      <View style={s.searchRow}>
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
        {view === "Reflections" && (
          <Pressable
            accessibilityLabel="Advanced filters"
            onPress={() => setFilterOpen(true)}
            style={s.filterButton}
          >
            <Ionicons name="options-outline" size={20} color={c.green} />
          </Pressable>
        )}
      </View>

      <View style={s.segment}>
        {(["Reflections", "Browse", "Insights"] as GardenView[]).map((item) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: view === item }}
            key={item}
            onPress={() => setView(item)}
            style={[s.segmentItem, view === item && s.segmentActive]}
          >
            <Text style={[s.segmentText, view === item && s.segmentTextActive]}>
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      {view === "Reflections" && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.quickFilters}
          >
            {QUICK_FILTERS.map((item) => (
              <Pressable
                key={item}
                onPress={() => setQuick(item)}
                style={[s.quick, quick === item && s.quickActive]}
              >
                <Text style={[s.quickText, quick === item && s.quickTextActive]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <FlatList
            data={sectioned}
            keyExtractor={(item) => item.section}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.list}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="leaf-outline" size={28} color={c.muted} />
                <Text style={s.emptyTitle}>No reflections found</Text>
                <Text style={s.emptyCopy}>Adjust search or filters.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View>
                <Text style={s.sectionLabel}>{item.section.toUpperCase()}</Text>
                {item.data.map((note) => (
                  <Pressable
                    key={note.id}
                    onPress={() =>
                      router.push({ pathname: "/note/[id]", params: { id: note.id } })
                    }
                    style={s.card}
                  >
                    <View style={s.metaRow}>
                      <Text style={s.reference}>{note.reference}</Text>
                      {!!note.group && <Text style={s.groupLabel}>{note.group}</Text>}
                    </View>
                    <Text numberOfLines={2} style={s.title}>
                      {note.title || note.body}
                    </Text>
                    <View style={s.cardBottom}>
                      <View style={s.tagRow}>
                        {note.tags.slice(0, 2).map((tag) => (
                          <Text key={tag} style={s.tag}>
                            #{tag}
                          </Text>
                        ))}
                      </View>
                      {!!statusLabel(note.status, note.group) && (
                        <Text style={s.workflow}>{statusLabel(note.status, note.group)}</Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          />
        </>
      )}

      {view === "Browse" && (
        <ScrollView contentContainerStyle={s.browseBody} showsVerticalScrollIndicator={false}>
          {!browseFocus ? (
            <>
              <Text style={s.browseTitle}>Browse your Garden</Text>
              <FacetBlock
                title="THEMES"
                type="theme"
                facets={facets.themes}
                setBrowseFocus={setBrowseFocus}
                c={c}
                s={s}
              />
              <FacetBlock
                title="BOOKS"
                type="book"
                facets={facets.books}
                setBrowseFocus={setBrowseFocus}
                c={c}
                s={s}
              />
              <FacetBlock
                title="THOUGHT TYPES"
                type="thought"
                facets={facets.groups}
                setBrowseFocus={setBrowseFocus}
                c={c}
                s={s}
              />
              <View style={s.facetBlock}>
                <Text style={s.facetTitle}>CONNECTIONS</Text>
                <Text style={s.connectionCount}>
                  {insights.reduce((sum, card) => sum + Math.max(1, card.evidence.length - 1), 0)} confirmed or suggested relationships
                </Text>
                <Pressable onPress={() => router.push("/knowledge-graph" as any)}>
                  <Text style={s.viewAll}>View connections</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Pressable onPress={() => setBrowseFocus(null)} style={s.backLine}>
                <Ionicons name="chevron-back" size={18} color={c.green} />
                <Text style={s.viewAll}>Browse</Text>
              </Pressable>
              <Text style={s.browseTitle}>
                {browseFocus.type === "theme"
                  ? "Theme"
                  : browseFocus.type === "book"
                    ? "Book"
                    : "Thought Type"}
                : {browseFocus.facet.name}
              </Text>
              <Text style={s.facetSub}>
                {browseFocus.facet.count} {browseFocus.facet.count === 1 ? "reflection" : "reflections"}
              </Text>
              <View style={s.search}>
                <Ionicons name="search" size={18} color={c.muted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={`Search within ${browseFocus.facet.name}`}
                  placeholderTextColor={c.muted}
                  style={s.searchInput}
                />
              </View>
              {hybridSearch(browseFocus.facet.notes, query).map((note) => (
                <Pressable
                  key={note.id}
                  onPress={() =>
                    router.push({ pathname: "/note/[id]", params: { id: note.id } })
                  }
                  style={s.card}
                >
                  <Text style={s.reference}>{note.reference}</Text>
                  <Text style={s.title}>{note.title || note.body}</Text>
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      )}

      {view === "Insights" && (
        <ScrollView contentContainerStyle={s.insightsBody} showsVerticalScrollIndicator={false}>
          <Text style={s.browseTitle}>What Selah is noticing</Text>
          {insights.length ? (
            insights.map((card) => (
              <View key={card.id} style={s.insightCard}>
                <Text style={s.insightLabel}>{card.label.toUpperCase()}</Text>
                <Text style={s.insightHeadline}>{card.headline}</Text>
                <Text style={s.insightExplanation}>{card.explanation}</Text>
                <Text style={s.evidenceLine}>
                  Based on {card.evidence.length} {card.evidence.length === 1 ? "reflection" : "reflections"}
                </Text>
                <View style={s.insightActions}>
                  <Pressable
                    onPress={() => {
                      if (card.actionType === "mark_practiced") markPracticed(card.evidence[0].id);
                      else if (card.actionType === "mark_resolved") markResolved(card.evidence[0].id);
                      else if (card.evidence[0])
                        router.push({
                          pathname: "/note/[id]",
                          params: { id: card.evidence[0].id },
                        });
                    }}
                    style={s.insightPrimary}
                  >
                    <Text style={s.insightPrimaryText}>{card.actionLabel}</Text>
                  </Pressable>
                  {card.actionLabel !== "View evidence" && (
                    <Pressable
                      onPress={() => {
                        setBrowseFocus({
                          type: "theme",
                          facet: {
                            name: "Evidence",
                            count: card.evidence.length,
                            notes: card.evidence,
                          },
                        });
                        setView("Browse");
                      }}
                      style={s.insightSecondary}
                    >
                      <Text style={s.insightSecondaryText}>View evidence</Text>
                    </Pressable>
                  )}
                </View>
                <View style={s.feedback}>
                  <Text style={s.why}>Why you’re seeing this</Text>
                  <Pressable onPress={() => archiveInsight(card.id)}>
                    <Text style={s.dismiss}>Dismiss</Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>No reliable patterns yet</Text>
              <Text style={s.emptyCopy}>
                Selah waits for enough evidence before showing insights. Add themes,
                thought types, and follow-ups to strengthen the signal.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={filterOpen} transparent animationType="slide">
        <View style={s.overlay}>
          <Pressable style={s.scrim} onPress={() => setFilterOpen(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Filter Garden</Text>
              <Pressable onPress={() => setFilterOpen(false)} style={s.close}>
                <Ionicons name="close" size={22} color={c.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <FilterRow label="THOUGHT TYPE" values={["All", ...THOUGHT_GROUPS]} active={group} setActive={setGroup as any} s={s} />
              <FilterRow label="THEME" values={["All", ...facets.themes.map((item) => item.name)]} active={theme} setActive={setTheme} s={s} />
              <FilterRow label="BOOK" values={["All", ...facets.books.map((item) => item.name)]} active={book} setActive={setBook} s={s} />
              <FilterRow label="STATUS" values={["All", "open", "resolved", "practiced", "archived"]} active={status} setActive={setStatus} s={s} />
              <FilterRow label="SORT" values={["Updated", "Newest", "Oldest"]} active={sort} setActive={setSort as any} s={s} />
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

function FacetBlock({
  title,
  type,
  facets,
  setBrowseFocus,
  c,
  s,
}: {
  title: string;
  type: "theme" | "book" | "thought";
  facets: GardenFacet[];
  setBrowseFocus: (value: BrowseFocus) => void;
  c: AppColors;
  s: ReturnType<typeof styles>;
}) {
  return (
    <View style={s.facetBlock}>
      <Text style={s.facetTitle}>{title}</Text>
      {facets.slice(0, 5).map((facet) => (
        <Pressable
          accessibilityLabel={`Open ${facet.name}`}
          key={facet.name}
          onPress={() => setBrowseFocus({ type, facet })}
          style={s.facetRow}
        >
          <Text style={s.facetName}>{facet.name}</Text>
          <Text style={s.facetCount}>{facet.count}</Text>
        </Pressable>
      ))}
      {!facets.length && <Text style={s.muted}>Nothing here yet.</Text>}
      {facets.length > 5 && <Text style={[s.viewAll, { color: c.green }]}>View all {title.toLowerCase()}</Text>}
    </View>
  );
}

function FilterRow({
  label,
  values,
  active,
  setActive,
  s,
}: {
  label: string;
  values: readonly string[];
  active: string;
  setActive: (value: any) => void;
  s: ReturnType<typeof styles>;
}) {
  return (
    <>
      <Text style={s.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontalOptions}>
        {values.map((item) => (
          <Pressable
            key={item}
            onPress={() => setActive(item)}
            style={[s.option, active === item && s.optionActive]}
          >
            <Text style={[s.optionText, active === item && s.optionTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}

const styles = (c: AppColors) =>
  StyleSheet.create({
    emptyFull: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
    emptyTitle: { color: c.text, fontSize: 18, fontWeight: "900", textAlign: "center" },
    emptyCopy: { color: c.muted, textAlign: "center", lineHeight: 20, marginTop: 8 },
    primary: { minHeight: 48, borderRadius: 13, backgroundColor: c.green, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, marginTop: 18 },
    primaryText: { color: c.onAccent, fontWeight: "900" },
    header: { minHeight: 72, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    headerTitle: { color: c.text, fontSize: 22, fontWeight: "900" },
    count: { color: c.muted, fontSize: 12, marginTop: 2 },
    reflect: { minHeight: 40, borderRadius: 12, backgroundColor: c.green, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12 },
    reflectText: { color: c.onAccent, fontWeight: "900", fontSize: 12 },
    searchRow: { flexDirection: "row", gap: 8, paddingHorizontal: 18, paddingBottom: 10 },
    search: { flex: 1, minHeight: 50, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.surface, borderRadius: 13, borderWidth: 1, borderColor: c.line, paddingHorizontal: 12 },
    searchInput: { flex: 1, minHeight: 40, color: c.text, fontSize: 14, paddingVertical: 0 },
    filterButton: { width: 48, minHeight: 50, borderRadius: 13, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" },
    segment: { marginHorizontal: 18, minHeight: 42, borderRadius: 13, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, flexDirection: "row", padding: 3 },
    segmentItem: { flex: 1, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    segmentActive: { backgroundColor: c.green },
    segmentText: { color: c.muted, fontWeight: "800", fontSize: 12 },
    segmentTextActive: { color: c.onAccent },
    quickFilters: { gap: 8, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 6 },
    quick: { minHeight: 36, justifyContent: "center", paddingHorizontal: 12, borderRadius: 18, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
    quickActive: { backgroundColor: c.green, borderColor: c.green },
    quickText: { color: c.text, fontSize: 11, fontWeight: "700" },
    quickTextActive: { color: c.onAccent },
    list: { padding: 18, paddingTop: 6, paddingBottom: 32 },
    sectionLabel: { color: c.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 12, marginBottom: 8 },
    card: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 15, marginBottom: 11 },
    metaRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
    reference: { color: c.green, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
    groupLabel: { color: c.muted, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 },
    title: { color: c.text, fontSize: 15, fontWeight: "900", lineHeight: 21, marginTop: 8 },
    cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 10 },
    tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1 },
    tag: { color: c.gold, fontSize: 10, fontWeight: "800" },
    workflow: { color: c.muted, fontSize: 10, fontWeight: "800" },
    empty: { alignItems: "center", padding: 28, backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.line },
    browseBody: { padding: 18, paddingBottom: 36 },
    browseTitle: { color: c.text, fontSize: 20, fontWeight: "900", marginBottom: 12 },
    facetBlock: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 15, marginBottom: 13 },
    facetTitle: { color: c.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 8 },
    facetRow: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderColor: c.line },
    facetName: { color: c.text, fontWeight: "800" },
    facetCount: { color: c.green, fontWeight: "900" },
    viewAll: { color: c.green, fontWeight: "900", marginTop: 10 },
    muted: { color: c.muted, fontSize: 12 },
    connectionCount: { color: c.text, fontWeight: "800", marginTop: 4 },
    backLine: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    facetSub: { color: c.muted, marginTop: -6, marginBottom: 12 },
    insightsBody: { padding: 18, paddingBottom: 36 },
    insightCard: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 16, marginBottom: 13 },
    insightLabel: { color: c.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
    insightHeadline: { color: c.text, fontSize: 17, fontWeight: "900", lineHeight: 24, marginTop: 8 },
    insightExplanation: { color: c.muted, fontSize: 12, lineHeight: 19, marginTop: 8 },
    evidenceLine: { color: c.green, fontWeight: "800", fontSize: 11, marginTop: 10 },
    insightActions: { flexDirection: "row", gap: 8, marginTop: 13 },
    insightPrimary: { flex: 1, minHeight: 42, borderRadius: 12, backgroundColor: c.green, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
    insightPrimaryText: { color: c.onAccent, fontWeight: "900", fontSize: 11 },
    insightSecondary: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
    insightSecondaryText: { color: c.text, fontWeight: "800", fontSize: 11 },
    feedback: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
    why: { color: c.muted, fontSize: 11, fontWeight: "700" },
    dismiss: { color: c.danger, fontSize: 11, fontWeight: "800" },
    overlay: { flex: 1, justifyContent: "flex-end" },
    scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,.45)" },
    sheet: { maxHeight: "80%", backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28, borderWidth: 1, borderColor: c.line },
    sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    sheetTitle: { color: c.text, fontSize: 20, fontWeight: "900" },
    close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    label: { color: c.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 7 },
    horizontalOptions: { gap: 8, paddingBottom: 16 },
    option: { minHeight: 38, justifyContent: "center", paddingHorizontal: 12, borderRadius: 19, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
    optionActive: { backgroundColor: c.green, borderColor: c.green },
    optionText: { color: c.text, fontSize: 11 },
    optionTextActive: { color: c.onAccent, fontWeight: "900" },
    actions: { flexDirection: "row", gap: 10, marginTop: 6 },
    reset: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" },
    resetText: { color: c.text, fontWeight: "800" },
    apply: { flex: 2, height: 48, borderRadius: 12, backgroundColor: c.green, alignItems: "center", justifyContent: "center" },
    applyText: { color: c.onAccent, fontWeight: "900" },
  });
