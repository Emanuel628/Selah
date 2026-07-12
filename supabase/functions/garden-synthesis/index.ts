import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/client.ts";

type Note = {
  title?: string | null;
  body?: string | null;
  reference?: string | null;
  tags?: string[] | null;
  thought_group?: string | null;
  book_name?: string | null;
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

function fallback(notes: Note[], purpose: string) {
  if (!notes.length) {
    return "Your Garden is empty. Add a few reflections with thought groups and tags before asking Selah to synthesize patterns.";
  }
  const groups = new Map<string, number>();
  const tags = new Map<string, number>();
  const books = new Map<string, number>();
  for (const note of notes) {
    if (note.thought_group)
      groups.set(note.thought_group, (groups.get(note.thought_group) || 0) + 1);
    if (note.book_name) books.set(note.book_name, (books.get(note.book_name) || 0) + 1);
    for (const tag of note.tags || []) tags.set(tag, (tags.get(tag) || 0) + 1);
  }
  const top = (map: Map<string, number>) =>
    Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "reflection";
  const focus =
    purpose === "graph"
      ? "Your strongest visible connection"
      : "Your strongest current Garden pattern";
  return [
    `${focus} is ${top(tags)}, with ${top(groups)} as the most common thought group and ${top(books)} as the most revisited book.`,
    "Next step: open one related note, add one concrete application, and tag it consistently so future synthesis gets sharper.",
  ].join("\n\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  try {
    const { supabase, user } = await requireUser(req);
    const { purpose = "insights" } = await req.json().catch(() => ({}));
    const { data: notes } = await supabase
      .from("garden_notes")
      .select("title,body,reference,tags,thought_group,book_name")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    const openAiKey = env("OPENAI_API_KEY", "openai_api_key");
    if (!openAiKey) {
      return new Response(
        JSON.stringify({
          synthesis: fallback(notes || [], purpose),
          mode: "fallback",
          reason: "missing_openai_key",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const prompt = [
      "You are Selah, a concise Scripture reflection synthesis assistant.",
      "Use only the user's Garden notes. Do not invent details.",
      "Write practical, pastoral, non-sermon output.",
      purpose === "graph"
        ? "Explain the strongest connections between themes, tags, books, and thought groups."
        : "Summarize recurring patterns, themes, questions, prayers, and applications.",
      "Return 3 short sections: Pattern, Meaning, Next step.",
      "",
      `Garden notes: ${JSON.stringify(notes || []).slice(0, 10000)}`,
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
        max_output_tokens: 700,
      }),
    });
    if (!response.ok) {
      const failure = await openAiFailure(response);
      console.error(
        "OpenAI garden-synthesis failed",
        response.status,
        failure.reason,
        failure.message,
      );
      return new Response(
        JSON.stringify({
          synthesis: fallback(notes || [], purpose),
          mode: "fallback",
          reason: failure.reason,
          diagnostic: failure.message,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const json = await response.json();
    const synthesis =
      json.output_text ||
      json.output?.flatMap((item: any) => item.content || [])
        ?.map((part: any) => part.text)
        ?.filter(Boolean)
        ?.join("\n") ||
      fallback(notes || [], purpose);
    return new Response(JSON.stringify({ synthesis, mode: "ai" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Garden synthesis failed", error);
    return new Response(JSON.stringify({ error: "Garden synthesis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
