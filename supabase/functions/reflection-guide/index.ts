import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/client.ts";

type Note = {
  title?: string | null;
  body?: string | null;
  reference?: string | null;
  thought_group?: string | null;
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "that",
  "with",
  "from",
  "this",
  "then",
  "were",
  "they",
  "unto",
  "shall",
  "have",
  "will",
  "your",
  "their",
  "there",
  "when",
]);

function words(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

function topTerms(text: string, limit = 7) {
  const counts = new Map<string, number>();
  for (const word of words(text)) counts.set(word, (counts.get(word) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

function overlapScore(a: string, b: string) {
  const source = new Set(words(a));
  if (!source.size) return 0;
  return words(b).reduce((score, word) => score + (source.has(word) ? 1 : 0), 0);
}

function relatedNotes(passage: string, verseText: string, notes: Note[]) {
  const passageBase = passage.split(":")[0].split(",")[0].trim();
  return notes
    .map((note) => ({
      note,
      score:
        (note.reference?.includes(passageBase) ? 5 : 0) +
        overlapScore(verseText, `${note.title || ""} ${note.body || ""}`),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.note);
}

function buildGuide(passage: string, verseText: string, question: string, notes: Note[]) {
  const verseLines = verseText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const terms = topTerms(verseText);
  const related = relatedNotes(passage, verseText, notes);
  const questionNotes = notes.filter((note) => note.thought_group === "Question").slice(0, 2);
  const applicationNotes = notes
    .filter((note) => note.thought_group === "Application")
    .slice(0, 2);
  const groups = [...new Set(notes.map((note) => note.thought_group).filter(Boolean))].slice(0, 4);
  const movement =
    verseLines.length > 1
      ? `The passage moves from "${verseLines[0]}" toward "${verseLines.at(-1)}". Watch what changes between those points.`
      : `Read ${passage} slowly and name what the verse directly says before interpreting it.`;
  const termLine = terms.length
    ? `Repeated or loaded words: ${terms.map(([word, count]) => `${word}${count > 1 ? ` (${count})` : ""}`).join(", ")}. These are likely the best starting points for reflection.`
    : "Look for repeated words, contrasts, commands, promises, and changes in speaker or scene.";
  const questionLine = question?.trim()
    ? `Your question: ${question.trim()}\nA good next step is to answer it from the passage first, then compare it with one related Garden reflection.`
    : "Question to ask: What does this passage reveal about God, people, creation, sin, promise, or response?";
  const connectionLine = related.length
    ? `From your Garden: ${related
        .map((note) => `${note.reference || "Saved reflection"}${note.title ? ` — ${note.title}` : ""}`)
        .join("; ")}. Revisit one before saving a new reflection.`
    : "From your Garden: no strong related reflection was found yet. Save one clear observation so future guidance can connect this passage to your history.";
  const revisitLine =
    questionNotes.length || applicationNotes.length
      ? [
          questionNotes.length
            ? `Open question to revisit: ${questionNotes[0].body?.slice(0, 120)}`
            : "",
          applicationNotes.length
            ? `Application to follow up: ${applicationNotes[0].body?.slice(0, 120)}`
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "Response: write one concrete response, practice, or prayer. Keep it small enough to revisit later.";
  return [
    "OBSERVE",
    movement,
    termLine,
    "",
    "CONNECT",
    connectionLine,
    groups.length ? `Thought types already present in your Garden: ${groups.join(", ")}.` : "No thought-type pattern yet.",
    "",
    "QUESTION",
    questionLine,
    "",
    "RESPOND",
    revisitLine,
    "Prayer prompt: turn the clearest observation into one honest sentence of prayer.",
  ].join("\n");
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
      .limit(50);

    return new Response(
      JSON.stringify({
        guide: buildGuide(passage, verseText, question || "", notes || []),
        mode: "algorithm",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Reflection guide failed", error);
    return new Response(JSON.stringify({ error: "Reflection guide failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
