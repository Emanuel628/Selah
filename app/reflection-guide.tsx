import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DetailScreen } from "@/components/DetailScreen";
import { getChapter } from "@/lib/bibleApi";
import { paginateVerses } from "@/lib/readerPagination";
import { supabase } from "@/lib/supabase";
import { AppColors } from "@/lib/theme";
import { useAppSettings } from "@/state/AppSettings";
import { useAuth } from "@/state/Auth";
import { useThemeColors } from "@/state/useThemeColors";

export default function ReflectionGuide() {
  const { user } = useAuth();
  const settings = useAppSettings();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [passageText, setPassageText] = useState("");
  const [question, setQuestion] = useState("");
  const [guide, setGuide] = useState("");
  const [mode, setMode] = useState<"ai" | "fallback" | "">("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passage = `${settings.currentBookName} ${settings.currentChapter}, page ${settings.currentPage}`;

  useEffect(() => {
    getChapter(
      settings.preferredTranslationId,
      settings.currentBookId,
      settings.currentChapter,
    )
      .then((chapter) => {
        const pages = paginateVerses(chapter.verses, 390, settings.readerFontSize);
        setPassageText(
          (pages[settings.currentPage - 1] || pages[0] || [])
            .map((verse) => `${verse.number}. ${verse.text}`)
            .join("\n"),
        );
      })
      .catch(() => setError("Could not load this passage."));
  }, [
    settings.preferredTranslationId,
    settings.currentBookId,
    settings.currentChapter,
    settings.currentPage,
    settings.readerFontSize,
  ]);

  const generate = async () => {
    if (!user) {
      setError("Sign in to use AI-guided reflection with your Garden notes.");
      return;
    }
    setLoading(true);
    setError("");
    setGuide("");
    setMode("");
    setReason("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "reflection-guide",
        { body: { passage, verseText: passageText, question } },
      );
      if (invokeError) {
        setError(invokeError.message);
        return;
      }
      setGuide(data?.guide || "No guidance was returned.");
      setMode(data?.mode || "fallback");
      setReason(data?.reason || "");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not generate reflection help.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DetailScreen
      title="Reflection Guide"
      subtitle="Guidance tied to your current page and Garden notes."
    >
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <Text style={s.eyebrow}>CURRENT PASSAGE</Text>
          <Text style={s.title}>{passage}</Text>
          <Text numberOfLines={6} style={s.scripture}>
            {passageText || "Loading passage..."}
          </Text>
        </View>

        <Text style={s.label}>OPTIONAL QUESTION</Text>
        <TextInput
          multiline
          value={question}
          onChangeText={setQuestion}
          placeholder="Ask what you are trying to understand or apply from this passage."
          placeholderTextColor={c.muted}
          style={s.input}
        />
        <Text style={s.helper}>
          Reflection Help is meant to read the current passage, consider your
          question, compare your Garden notes, and return an observation,
          connection, question, application, and prayer. If AI is unavailable,
          Selah shows local prompts instead.
        </Text>

        {!!error && <Text style={s.error}>{error}</Text>}
        <Pressable
          disabled={loading || !passageText}
          onPress={generate}
          style={[s.button, (loading || !passageText) && s.disabled]}
        >
          {loading ? (
            <ActivityIndicator color={c.onAccent} />
          ) : (
            <>
              <Ionicons name="sparkles-outline" size={18} color={c.onAccent} />
              <Text style={s.buttonText}>Generate Reflection Help</Text>
            </>
          )}
        </Pressable>

        {!!guide && (
          <View style={s.result}>
            <Text style={s.eyebrow}>
              {mode === "ai" ? "AI-GUIDED REFLECTION" : "GUIDED REFLECTION"}
            </Text>
            {mode === "fallback" && (
              <Text style={s.notice}>{fallbackMessage(reason)}</Text>
            )}
            <Text style={s.guide}>{guide}</Text>
          </View>
        )}
      </ScrollView>
    </DetailScreen>
  );
}

const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 36 },
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
    },
    eyebrow: {
      color: c.gold,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.1,
      marginBottom: 7,
    },
    title: { color: c.text, fontSize: 18, fontWeight: "800", marginBottom: 8 },
    scripture: { color: c.text, fontFamily: "serif", lineHeight: 22 },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.2,
      marginBottom: 7,
    },
    input: {
      minHeight: 96,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      color: c.text,
      padding: 14,
      textAlignVertical: "top",
      marginBottom: 12,
    },
    helper: {
      color: c.muted,
      fontSize: 11,
      lineHeight: 17,
      marginBottom: 12,
    },
    button: {
      minHeight: 50,
      borderRadius: 14,
      backgroundColor: c.green,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    disabled: { opacity: 0.55 },
    buttonText: { color: c.onAccent, fontWeight: "900" },
    error: { color: c.danger, fontSize: 12, marginBottom: 10 },
    result: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 16,
      padding: 16,
      marginTop: 14,
    },
    guide: { color: c.text, lineHeight: 22 },
    notice: {
      color: c.muted,
      fontSize: 11,
      lineHeight: 17,
      marginBottom: 10,
    },
  });

function fallbackMessage(reason: string) {
  if (reason === "openai_401")
    return "AI is wired, but OpenAI rejected the configured API key. The Supabase openai_api_key secret must be a valid OpenAI API key, not a Supabase key. Showing local passage prompts for now.";
  if (reason.includes("invalid_api_key"))
    return "AI is wired, but OpenAI says the configured API key is invalid. The Supabase openai_api_key secret must be a valid OpenAI API key, not a Supabase key. Showing local passage prompts for now.";
  if (reason.includes("insufficient_quota"))
    return "AI is not connected yet because the OpenAI project has insufficient quota or billing access. Showing local passage prompts for now.";
  if (reason === "missing_openai_key")
    return "AI is not connected yet because no OpenAI API key is configured. Showing local passage prompts for now.";
  return reason
    ? `AI generation was unavailable (${reason}). Showing local passage prompts for now.`
    : "AI generation was unavailable. Showing local passage prompts for now.";
}
