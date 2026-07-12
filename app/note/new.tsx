import { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
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

const suggestions = ["Grace", "Covenant", "Prayer", "Promise", "Creation"];

function excerptTitle(body: string) {
  const first = body.trim().split(/[.!?]\s/)[0] || "Untitled reflection";
  return first.length > 54 ? `${first.slice(0, 51).trim()}...` : first;
}

export default function NoteEditor() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    verseStart?: string;
    verseEnd?: string;
    reference?: string;
  }>();
  const { getNote, createNote, updateNote } = useGarden();
  const settings = useAppSettings();
  const existing = params.id ? getNote(params.id) : undefined;
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const verseStart = Number(params.verseStart || existing?.verseStart || 1);
  const verseEnd = Number(params.verseEnd || existing?.verseEnd || verseStart);
  const preciseReference =
    params.reference ||
    `${settings.currentBookName} ${settings.currentChapter}:${verseStart}${
      verseEnd > verseStart ? `-${verseEnd}` : ""
    }`;
  const [title, setTitle] = useState(existing?.title || "");
  const [body, setBody] = useState(existing?.body || "");
  const [reference] = useState(existing?.reference || preciseReference);
  const [group, setGroup] = useState<ThoughtGroup | null>(
    existing?.group || null,
  );
  const [tags, setTags] = useState<string[]>(existing?.tags || []);
  const [detailsOpen, setDetailsOpen] = useState(!!existing);
  const [tagOpen, setTagOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [guided, setGuided] = useState({
    notice: "",
    meaning: "",
    connection: "",
    question: "",
    response: "",
  });

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setBody(existing.body);
    setGroup(existing.group);
    setTags(existing.tags);
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

  const applyGuided = () => {
    const parts = [
      guided.notice && `What I notice: ${guided.notice}`,
      guided.meaning && `What it may mean: ${guided.meaning}`,
      guided.connection && `Connection: ${guided.connection}`,
      guided.question && `Question: ${guided.question}`,
      guided.response && `Response or prayer: ${guided.response}`,
    ].filter(Boolean);
    setBody((current) => [current.trim(), parts.join("\n\n")]
      .filter(Boolean)
      .join("\n\n"));
    setGuidedOpen(false);
  };

  const valid = body.trim().length > 0;
  const save = () => {
    if (!valid) return;
    const input = {
      title: title.trim() || excerptTitle(body),
      body: body.trim(),
      reference,
      translationId: existing?.translationId || settings.preferredTranslationId,
      bookId: existing?.bookId ?? settings.currentBookId,
      bookName: existing?.bookName || settings.currentBookName,
      chapter: existing?.chapter || settings.currentChapter,
      page: existing?.page || settings.currentPage,
      group,
      tags,
      verseStart: existing?.verseStart ?? verseStart,
      verseEnd: existing?.verseEnd ?? verseEnd,
      status: existing?.status || "open",
      origin: existing?.origin || "user_written",
      lastRevisitedAt: existing?.lastRevisitedAt || null,
    };
    if (existing) updateNote(existing.id, input);
    else createNote(input);
    router.replace("/garden");
  };

  return (
    <DetailScreen
      title={existing ? "Edit reflection" : "New reflection"}
      subtitle={reference}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.keyboard}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.body}
        >
          <Pressable
            accessibilityLabel="Dismiss keyboard"
            onPress={Keyboard.dismiss}
            style={s.anchor}
          >
            <Text style={s.anchorRef}>{reference}</Text>
            <Text style={s.anchorSub}>{settings.preferredTranslationName}</Text>
          </Pressable>
          <View style={s.promptRow}>
            <Text style={s.prompt}>What stayed with you?</Text>
          </View>
          <TextInput
            accessibilityLabel="Reflection text"
            multiline
            autoFocus={!existing}
            textAlignVertical="top"
            scrollEnabled={false}
            blurOnSubmit={false}
            value={body}
            onChangeText={setBody}
            placeholder="Write the thought, question, prayer, or application you want to remember."
            placeholderTextColor={c.muted}
            style={s.input}
          />
        <Pressable onPress={() => setGuidedOpen(true)} style={s.guided}>
          <Ionicons name="help-circle-outline" size={17} color={c.green} />
          <Text style={s.guidedText}>Need help thinking this through?</Text>
        </Pressable>
        <Pressable
          onPress={() => setDetailsOpen((value) => !value)}
          style={s.detailsToggle}
        >
          <Text style={s.detailsText}>Add details — optional</Text>
          <Ionicons
            name={detailsOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color={c.muted}
          />
        </Pressable>
        {detailsOpen && (
          <View style={s.details}>
            <Text style={s.label}>TITLE</Text>
            <TextInput
              accessibilityLabel="Reflection title"
              value={title}
              onChangeText={setTitle}
              placeholder="Optional"
              placeholderTextColor={c.muted}
              style={s.singleInput}
            />
            <Text style={s.label}>THOUGHT TYPE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.groups}
            >
              {THOUGHT_GROUPS.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setGroup(group === item ? null : item)}
                  style={[s.group, group === item && s.groupActive]}
                >
                  <Text
                    style={[s.groupText, group === item && s.groupTextActive]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={s.label}>THEMES</Text>
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
              <Pressable onPress={() => setTagOpen(true)} style={s.addTag}>
                <Ionicons name="add" size={16} color={c.green} />
                <Text style={s.addTagText}>Add Theme</Text>
              </Pressable>
            </View>
          </View>
        )}
        <Pressable
          disabled={!valid}
          onPress={save}
          style={[s.save, !valid && s.disabled]}
        >
          <Text style={s.saveText}>Save to Garden</Text>
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={tagOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.overlay}
        >
          <Pressable style={s.scrim} onPress={() => setTagOpen(false)} />
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Add themes</Text>
            <View style={s.suggestions}>
              {suggestions.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => toggle(tag)}
                  style={[s.suggestion, tags.includes(tag) && s.groupActive]}
                >
                  <Text
                    style={[
                      s.suggestionText,
                      tags.includes(tag) && s.groupTextActive,
                    ]}
                  >
                    #{tag}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={s.customRow}>
              <TextInput
                value={custom}
                onChangeText={setCustom}
                onSubmitEditing={addCustom}
                placeholder="Type a theme"
                placeholderTextColor={c.muted}
                style={s.customInput}
              />
              <Pressable onPress={addCustom} style={s.customButton}>
                <Text style={s.customButtonText}>Add</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setTagOpen(false)} style={s.done}>
              <Text style={s.doneText}>Done</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={guidedOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.overlay}
        >
          <Pressable style={s.scrim} onPress={() => setGuidedOpen(false)} />
          <View style={s.sheetTall}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={s.sheetTitle}>Guided reflection</Text>
              {[
                ["notice", "What do you notice in the passage?"],
                ["meaning", "What do you think it means?"],
                ["connection", "Does this connect to another passage or idea?"],
                ["question", "What question remains?"],
                ["response", "Is there a response, practice, or prayer?"],
              ].map(([key, label]) => (
                <View key={key} style={s.guidedField}>
                  <Text style={s.label}>{label.toUpperCase()}</Text>
                  <TextInput
                    multiline
                    value={(guided as any)[key]}
                    onChangeText={(value) =>
                      setGuided((current) => ({ ...current, [key]: value }))
                    }
                    placeholder="Optional"
                    placeholderTextColor={c.muted}
                    style={s.guidedInput}
                  />
                </View>
              ))}
              <Pressable onPress={applyGuided} style={s.done}>
                <Text style={s.doneText}>Add to reflection</Text>
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
    keyboard: { flex: 1 },
    body: { padding: 18, paddingBottom: 180 },
    anchor: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 16,
      padding: 15,
      marginBottom: 18,
    },
    anchorRef: { color: c.text, fontWeight: "900", fontSize: 16 },
    anchorSub: { color: c.muted, fontSize: 11, marginTop: 4 },
    promptRow: {
      minHeight: 36,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 10,
    },
    prompt: { color: c.text, fontSize: 20, fontWeight: "900", flex: 1 },
    input: {
      minHeight: 146,
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.line,
      padding: 15,
      color: c.text,
      fontSize: 17,
      lineHeight: 25,
    },
    guided: { flexDirection: "row", gap: 7, alignItems: "center", paddingVertical: 14 },
    guidedText: { color: c.green, fontWeight: "800", fontSize: 12 },
    detailsToggle: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: c.line,
      marginBottom: 14,
    },
    detailsText: { color: c.text, fontWeight: "800" },
    details: { marginBottom: 8 },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.2,
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
    groups: { gap: 8, paddingBottom: 18 },
    group: {
      height: 40,
      paddingHorizontal: 13,
      borderRadius: 20,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      justifyContent: "center",
    },
    groupActive: { backgroundColor: c.green, borderColor: c.green },
    groupText: { color: c.text, fontSize: 11 },
    groupTextActive: { color: c.onAccent, fontWeight: "800" },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tag: {
      minHeight: 40,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: c.surface,
      paddingHorizontal: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.line,
    },
    tagText: { color: c.gold },
    addTag: {
      minHeight: 40,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 8,
    },
    addTagText: { color: c.green, fontWeight: "800" },
    save: {
      backgroundColor: c.green,
      borderRadius: 14,
      padding: 15,
      alignItems: "center",
      marginTop: 18,
    },
    disabled: { opacity: 0.4 },
    saveText: { color: c.onAccent, fontWeight: "900" },
    overlay: { flex: 1, justifyContent: "flex-end" },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,.45)",
    },
    sheet: {
      backgroundColor: c.bg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 28,
      borderWidth: 1,
      borderColor: c.line,
    },
    sheetTall: {
      maxHeight: "84%",
      backgroundColor: c.bg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 28,
      borderWidth: 1,
      borderColor: c.line,
    },
    sheetTitle: { color: c.text, fontSize: 20, fontWeight: "900", marginBottom: 16 },
    suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
    suggestion: {
      minHeight: 40,
      justifyContent: "center",
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
    },
    suggestionText: { color: c.text },
    customRow: { flexDirection: "row", gap: 8 },
    customInput: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      color: c.text,
      paddingHorizontal: 13,
    },
    customButton: {
      minWidth: 68,
      height: 48,
      borderRadius: 12,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    customButtonText: { color: c.onAccent, fontWeight: "900" },
    done: {
      height: 48,
      borderRadius: 13,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 18,
    },
    doneText: { color: c.onAccent, fontWeight: "900" },
    guidedField: { marginBottom: 14 },
    guidedInput: {
      minHeight: 76,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      color: c.text,
      padding: 12,
      textAlignVertical: "top",
    },
  });
