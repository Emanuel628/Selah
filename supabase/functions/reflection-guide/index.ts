import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/client.ts";

type Note = {
  title?: string | null;
  body?: string | null;
  reference?: string | null;
  thought_group?: string | null;
};

async function openAiFailure(response: Response) {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    const code = json?.error?.code || json?.error?.type || response.status;
    const message = json?.error?.message || text;
    return {
      reason: `openai_${code}`,
      message: String(message).slice(0, 240),
    };
  } catch {
    return {
      reason: `openai_${response.status}`,
      message: text.slice(0, 240),
    };
  }
}

function env(...names: string[]) {
  for (const name of names) {
    const value = Deno.env.get(name);
    const cleaned = value
      ?.trim()
      .replace(/^["']|["']$/g, "")
      .replace(/^Bearer\s+/i, "");
    if (cleaned) return cleaned;
  }
  return "";
}

function fallbackGuide(passage: string, verseText: string, question: string, notes: Note[]) {
  const related = notes
    .filter((note) => `${note.reference || ""}`.includes(passage.split(",")[0]))
    .slice(0, 3);
  const themes = Array.from(
    new Set(notes.map((note) => note.thought_group).filter(Boolean)),
  ).slice(0, 4);
  const verses = verseText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);
  const lower = verseText.toLowerCase();
  const repeated = [
    "created",
    "good",
    "light",
    "darkness",
    "spirit",
    "said",
    "separated",
    "called",
  ].filter((word) => lower.includes(word));
  const observation = verses.length
    ? `Observation: Start with the movement of the passage: ${verses.join(" ")}`
    : `Observation: Read ${passage} slowly and name what the passage directly says.`;
  const questionLine = question?.trim()
    ? `Your question: ${question.trim()}\n\nResponse path: answer it from the words on the page first, then compare it with one related Garden note.`
    : "Question to ask: What does this passage reveal about God before it asks anything of me?";
  return [
    observation,
    repeated.length
      ? `Pattern: Pay attention to repeated or loaded words here: ${repeated.join(", ")}. Repetition is usually where the passage is doing its work.`
      : "Pattern: Look for repeated words, contrasts, commands, promises, and shifts in the scene.",
    questionLine,
    related.length
      ? `Connection: You have ${related.length} related Garden note${related.length === 1 ? "" : "s"}. Revisit one before adding a new thought.`
      : "Connection: You do not have related Garden notes yet. Save one observation so future AI guidance can connect this passage to your prior reflections.",
    themes.length
      ? `Garden themes to compare: ${themes.join(", ")}.`
      : "Application: Write one concrete response for today, not a broad resolution.",
    "Prayer: Turn the clearest observation into one sentence of prayer.",
  ].join("\n\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  try {
    const { supabase, user } = await requireUser(req);
    const { passage, verseText, question } = await req.json();
    if (!passage || !verseText)
      return new Response(JSON.stringify({ error: "Missing passage" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const { data: notes } = await supabase
      .from("garden_notes")
      .select("title,body,reference,thought_group")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(25);

    const openAiKey = env("OPENAI_API_KEY", "openai_api_key");
    if (!openAiKey) {
      return new Response(
        JSON.stringify({
          guide: fallbackGuide(passage, verseText, question || "", notes || []),
          mode: "fallback",
          reason: "missing_openai_key",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const prompt = [
      "You are Selah, a concise Scripture reflection guide.",
      "Do not invent facts. Do not write sermon-length output.",
      "Tie guidance to the exact passage and the user's prior Garden notes.",
      "Return practical reflection help with: Observation, Connection, Question, Application, Prayer.",
      "",
      `Passage: ${passage}`,
      `Passage text: ${verseText}`,
      question ? `User question: ${question}` : "",
      `Recent Garden notes: ${JSON.stringify(notes || []).slice(0, 8000)}`,
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env("OPENAI_MODEL", "openai_model") || "gpt-4.1-mini",
        input: prompt,
        max_output_tokens: 900,
      }),
    });
    if (!response.ok) {
      const failure = await openAiFailure(response);
      console.error(
        "OpenAI reflection-guide failed",
        response.status,
        failure.reason,
        failure.message,
      );
      return new Response(
        JSON.stringify({
          guide: fallbackGuide(passage, verseText, question || "", notes || []),
          mode: "fallback",
          reason: failure.reason,
          diagnostic: failure.message,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const json = await response.json();
    const guide =
      json.output_text ||
      json.output?.flatMap((item: any) => item.content || [])
        ?.map((part: any) => part.text)
        ?.filter(Boolean)
        ?.join("\n") ||
      fallbackGuide(passage, verseText, question || "", notes || []);
    return new Response(JSON.stringify({ guide, mode: "ai" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Reflection guide failed", error);
    return new Response(JSON.stringify({ error: "Reflection guide failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
