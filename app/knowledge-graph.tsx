import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DetailScreen } from "@/components/DetailScreen";
import { buildKnowledgeGraph } from "@/lib/knowledgeGraph";
import { AppColors } from "@/lib/theme";
import { useGarden } from "@/state/Garden";
import { useThemeColors } from "@/state/useThemeColors";

export default function KnowledgeGraph() {
  const router = useRouter();
  const { notes } = useGarden();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const clusters = useMemo(() => buildKnowledgeGraph(notes), [notes]);
  return (
    <DetailScreen title="Knowledge Graph" subtitle="Connections in your Garden">
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.intro}>
          <Ionicons name="git-network-outline" size={24} color={c.green} />
          <View style={s.introCopy}>
            <Text style={s.introTitle}>Reflection connections</Text>
            <Text style={s.introText}>
              Selah groups your notes by book, thought group, and tags so you
              can see which ideas are forming across passages.
            </Text>
          </View>
        </View>
        {clusters.length ? (
          clusters.map((cluster) => (
            <View key={cluster.id} style={s.cluster}>
              <View style={s.clusterHead}>
                <View style={s.node}>
                  <Text style={s.nodeText}>{cluster.count}</Text>
                </View>
                <View style={s.clusterCopy}>
                  <Text style={s.clusterLabel}>{cluster.label}</Text>
                  <Text style={s.clusterType}>{cluster.type}</Text>
                </View>
              </View>
              {cluster.notes.slice(0, 4).map((note) => (
                <Pressable
                  key={note.id}
                  onPress={() =>
                    router.push({
                      pathname: "/note/[id]",
                      params: { id: note.id },
                    })
                  }
                  style={s.note}
                >
                  <View style={s.linkLine} />
                  <View style={s.noteCopy}>
                    <Text style={s.noteTitle}>{note.title}</Text>
                    <Text style={s.noteRef}>{note.reference}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.muted} />
                </Pressable>
              ))}
            </View>
          ))
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No graph yet</Text>
            <Text style={s.emptyText}>
              Create Garden reflections with tags and thought groups to build
              your first connections.
            </Text>
          </View>
        )}
      </ScrollView>
    </DetailScreen>
  );
}

const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 36 },
    intro: {
      flexDirection: "row",
      gap: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
    },
    introCopy: { flex: 1 },
    introTitle: { color: c.text, fontWeight: "800" },
    introText: { color: c.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
    cluster: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
    },
    clusterHead: { flexDirection: "row", alignItems: "center", gap: 10 },
    node: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    nodeText: { color: c.onAccent, fontWeight: "900" },
    clusterCopy: { flex: 1 },
    clusterLabel: { color: c.text, fontWeight: "800", fontSize: 16 },
    clusterType: {
      color: c.gold,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1,
      marginTop: 2,
      textTransform: "uppercase",
    },
    note: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginLeft: 18,
      borderBottomWidth: 1,
      borderColor: c.line,
    },
    linkLine: { width: 2, height: 28, backgroundColor: c.line },
    noteCopy: { flex: 1 },
    noteTitle: { color: c.text, fontWeight: "700", fontSize: 12 },
    noteRef: { color: c.muted, fontSize: 10, marginTop: 2 },
    empty: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 14,
      padding: 18,
    },
    emptyTitle: { color: c.text, fontWeight: "800" },
    emptyText: { color: c.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  });
