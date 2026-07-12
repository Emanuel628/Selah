import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DetailScreen } from "@/components/DetailScreen";
import { AppColors } from "@/lib/theme";
import { useGarden } from "@/state/Garden";
import { useThemeColors } from "@/state/useThemeColors";

export default function NoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getNote, deleteNote, markRevisited, markResolved, markPracticed } = useGarden();
  const note = getNote(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  if (!note)
    return (
      <DetailScreen title="Reflection">
        <View style={s.missing}>
          <Ionicons name="leaf-outline" size={30} color={c.muted} />
          <Text style={s.missingTitle}>Reflection not found</Text>
          <Pressable
            onPress={() => router.replace("/garden")}
            style={s.returnButton}
          >
            <Text style={s.returnText}>Return to Garden</Text>
          </Pressable>
        </View>
      </DetailScreen>
    );
  const remove = () => {
    deleteNote(note.id);
    router.replace("/garden");
  };
  const revisit = () => markRevisited(note.id);
  const action = (
    <Pressable
      accessibilityLabel="Edit reflection"
      onPress={() =>
        router.push({ pathname: "/note/new", params: { id: note.id } })
      }
      style={s.edit}
    >
      <Ionicons name="create-outline" size={21} color={c.green} />
    </Pressable>
  );
  return (
    <DetailScreen title="Reflection" subtitle={note.reference} action={action}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.body}
      >
        <View style={s.meta}>
          <Text style={s.eyebrow}>{note.reference.toUpperCase()}</Text>
          {!!note.group && <Text style={s.group}>{note.group}</Text>}
        </View>
        <Text style={s.title}>{note.title || note.body}</Text>
        <Text style={s.note}>{note.body}</Text>
        <Text style={s.label}>STATUS</Text>
        <View style={s.statusBox}>
          <Text style={s.statusText}>
            {note.status === "resolved"
              ? "Resolved"
              : note.status === "practiced"
                ? "Practiced"
                : note.group === "Question"
                  ? "Open question"
                  : note.group === "Application"
                    ? "Open application"
                    : "Open"}
          </Text>
          <View style={s.statusActions}>
            <Pressable onPress={revisit} style={s.statusButton}>
              <Text style={s.statusButtonText}>Revisit</Text>
            </Pressable>
            {note.group === "Question" && note.status === "open" && (
              <Pressable onPress={() => markResolved(note.id)} style={s.statusButton}>
                <Text style={s.statusButtonText}>Mark resolved</Text>
              </Pressable>
            )}
            {note.group === "Application" && note.status === "open" && (
              <Pressable onPress={() => markPracticed(note.id)} style={s.statusButton}>
                <Text style={s.statusButtonText}>I practiced this</Text>
              </Pressable>
            )}
          </View>
        </View>
        <Text style={s.label}>SCRIPTURE ANCHOR</Text>
        <View style={s.anchor}>
          <Ionicons name="book-outline" size={19} color={c.gold} />
          <Text style={s.anchorText}>{note.reference}</Text>
        </View>
        <Text style={s.label}>THEMES</Text>
        <View style={s.tags}>
          {note.tags.length ? (
            note.tags.map((tag) => (
              <Text key={tag} style={s.tag}>
                #{tag}
              </Text>
            ))
          ) : (
            <Text style={s.noTags}>No tags yet</Text>
          )}
        </View>
        <Text style={s.label}>CONNECTED REFLECTIONS</Text>
        <View style={s.anchor}>
          <Ionicons name="git-branch-outline" size={19} color={c.green} />
          <Text style={s.anchorText}>
            Connected reflections appear in Garden Browse and Insights when
            there is enough evidence.
          </Text>
        </View>
        {!confirmDelete ? (
          <Pressable
            accessibilityLabel="Delete reflection"
            onPress={() => setConfirmDelete(true)}
            style={s.delete}
          >
            <Ionicons name="trash-outline" size={18} color={c.danger} />
            <Text style={s.deleteText}>Delete reflection</Text>
          </Pressable>
        ) : (
          <View style={s.confirm}>
            <Text style={s.confirmTitle}>Delete this reflection?</Text>
            <Text style={s.confirmCopy}>This cannot be undone.</Text>
            <View style={s.confirmActions}>
              <Pressable
                onPress={() => setConfirmDelete(false)}
                style={s.cancel}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Confirm delete reflection"
                onPress={remove}
                style={s.confirmButton}
              >
                <Text style={s.confirmButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </DetailScreen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 20, paddingBottom: 38 },
    edit: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    meta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    eyebrow: {
      color: c.green,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.3,
    },
    group: {
      color: c.muted,
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    title: { color: c.text, fontSize: 24, fontWeight: "700", marginTop: 10 },
    note: {
      color: c.text,
      fontSize: 17,
      lineHeight: 27,
      marginTop: 18,
      marginBottom: 28,
    },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.3,
      marginBottom: 8,
    },
    anchor: {
      backgroundColor: c.surface,
      borderRadius: 15,
      padding: 17,
      borderLeftWidth: 3,
      borderLeftColor: c.gold,
      marginBottom: 24,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    anchorText: { color: c.text, fontWeight: "600" },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tag: {
      color: c.gold,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 17,
      fontSize: 11,
    },
    noTags: { color: c.muted },
    statusBox: {
      backgroundColor: c.surface,
      borderRadius: 15,
      padding: 14,
      borderWidth: 1,
      borderColor: c.line,
      marginBottom: 24,
    },
    statusText: { color: c.text, fontWeight: "800" },
    statusActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
    statusButton: {
      minHeight: 38,
      borderRadius: 11,
      backgroundColor: c.green,
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    statusButtonText: { color: c.onAccent, fontWeight: "900", fontSize: 11 },
    delete: {
      height: 48,
      marginTop: 36,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.danger,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },
    deleteText: { color: c.danger, fontWeight: "700" },
    confirm: {
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.danger,
      padding: 16,
      marginTop: 28,
    },
    confirmTitle: { color: c.text, fontWeight: "700" },
    confirmCopy: { color: c.muted, fontSize: 11, marginTop: 4 },
    confirmActions: { flexDirection: "row", gap: 8, marginTop: 14 },
    cancel: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelText: { color: c.text, fontWeight: "700" },
    confirmButton: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      backgroundColor: c.danger,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmButtonText: { color: c.onAccent, fontWeight: "800" },
    missing: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 30,
    },
    missingTitle: { color: c.text, fontWeight: "700", marginTop: 10 },
    returnButton: { marginTop: 16, padding: 12 },
    returnText: { color: c.green, fontWeight: "700" },
  });
