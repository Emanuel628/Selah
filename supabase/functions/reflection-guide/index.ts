import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/client.ts";

type Note = {
  title?: string | null;
  body?: string | null;
  reference?: string | null;
  thought_group?: string | null;
};

function fallbackGuide(passage: string, notes: Note[]) {
  const related = notes
    .filter((note) => `${note.reference || ""}`.includes(passage.split(",")[0]))
    .slice(0, 3);
  const themes = Array.from(
    new Set(notes.map((note) => note.thought_group).filter(Boolean)),
  ).slice(0, 4);
  return [
    `Start by reading ${passage} slowly once for meaning and once for response.`,
    related.length
      ? `You have ${related.length} related Garden note${related.length === 1 ? "" : "s"}. Revisit what you already noticed before adding a new thought.`
      : "You do not have related Garden notes yet. Capture one observation, one question, and one application.",
    themes.length
      ? `Recurring Garden themes to compare: ${themes.join(", ")}.`
      : "Watch for repeated words, commands, promises, and contrasts in the passage.",
    "Reflection prompt: What does this passage reveal about God, and what concrete response does it call for today?",
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

    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) {
      return new Response(
        JSON.stringify({ guide: fallbackGuide(passage, notes || []), mode: "fallback" }),
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
        model: Deno.env.get("OPENAI_MODEL") || "gpt-5.1",
        input: prompt,
      }),
    });
    if (!response.ok) {
      return new Response(
        JSON.stringify({ guide: fallbackGuide(passage, notes || []), mode: "fallback" }),
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
      fallbackGuide(passage, notes || []);
    return new Response(JSON.stringify({ guide, mode: "ai" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({ error: "Reflection guide failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
