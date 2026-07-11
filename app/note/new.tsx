import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DetailScreen } from "@/components/DetailScreen";
import { AppColors } from "@/lib/theme";
import { THOUGHT_GROUPS, ThoughtGroup, useGarden } from "@/state/Garden";
import { useAppSettings } from "@/state/AppSettings";
import { useThemeColors } from "@/state/useThemeColors";

const suggestions = [
  "Reflection",
  "Sovereignty",
  "Grace",
  "Covenants",
  "Prayer",
  "Promise",
];
export default function NoteEditor() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { getNote, createNote, updateNote } = useGarden();
  const settings = useAppSettings();
  const existing = params.id ? getNote(params.id) : undefined;
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [title, setTitle] = useState(existing?.title || "");
  const [body, setBody] = useState(existing?.body || "");
  const preciseReference = `${settings.currentBookName} ${settings.currentChapter} · Page ${settings.currentPage}`;
  const [reference, setReference] = useState(
    existing?.reference || preciseReference,
  );
  const [group, setGroup] = useState<ThoughtGroup>(
    existing?.group || "Observation",
  );
  const [tags, setTags] = useState<string[]>(existing?.tags || ["Reflection"]);
  const [tagOpen, setTagOpen] = useState(false);
  const [custom, setCustom] = useState("");
  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setBody(existing.body);
      setReference(existing.reference);
      setGroup(existing.group);
      setTags(existing.tags);
    }
  }, [existing?.id]);
  const toggle = (tag: string) =>
    setTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  const addCustom = () => {
    const clean = custom.trim().replace(/^#/, "");
    if (clean && !tags.some((tag) => tag.toLowerCase() === clean.toLowerCase()))
      setTags((current) => [...current, clean]);
    setCustom("");
  };
  const valid = title.trim() && body.trim();
  const save = () => {
    if (!valid) return;
    const input = {
      title: title.trim(),
      body: body.trim(),
      reference: reference.trim() || preciseReference,
      translationId: existing?.translationId || settings.preferredTranslationId,
      bookId: existing?.bookId ?? settings.currentBookId,
      bookName: existing?.bookName || settings.currentBookName,
      chapter: existing?.chapter || settings.currentChapter,
      page: existing?.page || settings.currentPage,
      group,
      tags,
    };
    if (existing) {
      updateNote(existing.id, input);
      router.replace("/garden");
    } else {
      createNote(input);
      router.replace("/garden");
    }
  };
  return (
    <DetailScreen
      title={existing ? "Edit reflection" : "New reflection"}
      subtitle={reference}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.body}
      >
        <Text style={s.label}>SCRIPTURE ANCHOR</Text>
        <TextInput
          accessibilityLabel="Scripture reference"
          value={reference}
          onChangeText={setReference}
          placeholder="Genesis 1:2"
          placeholderTextColor={c.muted}
          style={s.singleInput}
        />
        <Text style={s.label}>TITLE</Text>
        <TextInput
          accessibilityLabel="Reflection title"
          value={title}
          onChangeText={setTitle}
          placeholder="Name this insight"
          placeholderTextColor={c.muted}
          style={s.singleInput}
        />
        <Text style={s.label}>REFLECTION</Text>
        <TextInput
          multiline
          textAlignVertical="top"
          value={body}
          onChangeText={setBody}
          placeholder="What are you noticing?"
          placeholderTextColor={c.muted}
          style={s.input}
        />
        <Text style={s.label}>THOUGHT GROUP</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.groups}
        >
          {THOUGHT_GROUPS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setGroup(item)}
              style={[s.group, group === item && s.groupActive]}
            >
              <Text style={[s.groupText, group === item && s.groupTextActive]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={s.label}>TAGS</Text>
        <View style={s.tags}>
          {tags.map((tag) => (
            <Pressable
              accessibilityLabel={`Remove ${tag} tag`}
              key={tag}
              onPress={() => toggle(tag)}
              style={s.tag}
            >
              <Text style={s.tagText}>#{tag}</Text>
              <Ionicons name="close" size={14} color={c.gold} />
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => setTagOpen(true)}
            style={s.addTag}
          >
            <Ionicons name="add" size={16} color={c.green} />
            <Text style={s.addTagText}>Add Tag</Text>
          </Pressable>
        </View>
        <Pressable
          disabled={!valid}
          onPress={save}
          style={[s.save, !valid && s.disabled]}
        >
          <Text style={s.saveText}>
            {existing ? "Save changes" : "Save reflection"}
          </Text>
        </Pressable>
      </ScrollView>
      <Modal
        visible={tagOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTagOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.overlay}
        >
          <Pressable style={s.scrim} onPress={() => setTagOpen(false)} />
          <View style={s.sheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={s.sheetHeader}>
                <View>
                  <Text style={s.sheetTitle}>Add tags</Text>
                  <Text style={s.sheetSubtitle}>
                    Connect related reflections across your Garden.
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Close tag picker"
                  onPress={() => setTagOpen(false)}
                  style={s.close}
                >
                  <Ionicons name="close" size={22} color={c.text} />
                </Pressable>
              </View>
              <View style={s.suggestions}>
                {suggestions.map((tag) => (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: tags.includes(tag) }}
                    key={tag}
                    onPress={() => toggle(tag)}
                    style={[
                      s.suggestion,
                      tags.includes(tag) && s.suggestionActive,
                    ]}
                  >
                    <Text
                      style={[
                        s.suggestionText,
                        tags.includes(tag) && s.suggestionTextActive,
                      ]}
                    >
                      #{tag}
                    </Text>
                    {tags.includes(tag) && (
                      <Ionicons name="checkmark" size={15} color={c.onAccent} />
                    )}
                  </Pressable>
                ))}
              </View>
              <Text style={s.label}>CUSTOM TAG</Text>
              <View style={s.customRow}>
                <TextInput
                  value={custom}
                  onChangeText={setCustom}
                  onSubmitEditing={addCustom}
                  placeholder="Type a tag"
                  placeholderTextColor={c.muted}
                  style={s.customInput}
                />
                <Pressable
                  accessibilityLabel="Add custom tag"
                  disabled={!custom.trim()}
                  onPress={addCustom}
                  style={[s.customButton, !custom.trim() && s.disabled]}
                >
                  <Text style={s.customButtonText}>Add</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => setTagOpen(false)} style={s.done}>
                <Text style={s.doneText}>Done</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </DetailScreen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 38 },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.3,
      marginBottom: 7,
    },
    singleInput: {
      height: 50,
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.line,
      paddingHorizontal: 14,
      color: c.text,
      fontSize: 15,
      marginBottom: 18,
    },
    input: {
      minHeight: 170,
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.line,
      padding: 14,
      color: c.text,
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 20,
    },
    groups: { gap: 8, paddingBottom: 20 },
    group: {
      height: 42,
      paddingHorizontal: 13,
      borderRadius: 21,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      justifyContent: "center",
    },
    groupActive: { backgroundColor: c.green },
    groupText: { color: c.text, fontSize: 11 },
    groupTextActive: { color: c.onAccent, fontWeight: "700" },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tag: {
      minHeight: 42,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: c.surface,
      paddingHorizontal: 10,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: c.line,
    },
    tagText: { color: c.gold },
    addTag: {
      minHeight: 42,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 10,
    },
    addTagText: { color: c.green, fontWeight: "700" },
    save: {
      backgroundColor: c.green,
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      marginTop: 28,
    },
    disabled: { opacity: 0.4 },
    saveText: { color: c.onAccent, fontWeight: "800" },
    overlay: { flex: 1, justifyContent: "flex-end" },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,.45)",
    },
    sheet: {
      maxHeight: "78%",
      backgroundColor: c.bg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 28,
      borderWidth: 1,
      borderColor: c.line,
    },
    sheetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
    },
    sheetTitle: { color: c.text, fontSize: 20, fontWeight: "700" },
    sheetSubtitle: { color: c.muted, fontSize: 11, marginTop: 3 },
    close: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    suggestions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 9,
      marginBottom: 22,
    },
    suggestion: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 13,
      borderRadius: 22,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
    },
    suggestionActive: { backgroundColor: c.green },
    suggestionText: { color: c.text },
    suggestionTextActive: { color: c.onAccent, fontWeight: "700" },
    customRow: { flexDirection: "row", gap: 8 },
    customInput: {
      flex: 1,
      height: 48,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      color: c.text,
      paddingHorizontal: 13,
    },
    customButton: {
      minWidth: 68,
      height: 48,
      borderRadius: 11,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    customButtonText: { color: c.onAccent, fontWeight: "800" },
    done: {
      height: 48,
      borderRadius: 12,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 18,
    },
    doneText: { color: c.onAccent, fontWeight: "800" },
  });
