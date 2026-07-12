import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/client.ts";

type Note = {
  title?: string | null;
  body?: string | null;
  reference?: string | null;
  tags?: string[] | null;
  thought_group?: string | null;
  book_name?: string | null;
  status?: string | null;
  origin?: string | null;
  verse_start?: number | null;
  verse_end?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_revisited_at?: string | null;
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "you",
  "are",
  "that",
  "with",
  "from",
  "this",
  "have",
  "what",
  "when",
  "where",
  "there",
  "they",
  "your",
  "about",
  "into",
  "unto",
  "will",
  "shall",
]);

const sortCounts = (map: Map<string, number>) =>
  [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

function words(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

function countBy(notes: Note[], getValues: (note: Note) => string[]) {
  const counts = new Map<string, number>();
  notes.forEach((note) =>
    getValues(note).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1)),
  );
  return sortCounts(counts);
}

function topTerms(notes: Note[]) {
  const counts = new Map<string, number>();
  notes.forEach((note) =>
    words(`${note.title || ""} ${note.body || ""}`).forEach((word) =>
      counts.set(word, (counts.get(word) || 0) + 1),
    ),
  );
  return sortCounts(counts).slice(0, 8);
}

function overlap(a: Note, b: Note) {
  const source = new Set(words(`${a.title || ""} ${a.body || ""} ${(a.tags || []).join(" ")}`));
  return words(`${b.title || ""} ${b.body || ""} ${(b.tags || []).join(" ")}`)
    .reduce((score, word) => score + (source.has(word) ? 1 : 0), 0);
}

function strongestPair(notes: Note[]) {
  let best: { a: Note; b: Note; score: number } | null = null;
  for (let left = 0; left < notes.length; left += 1) {
    for (let right = left + 1; right < notes.length; right += 1) {
      const sharedTags = (notes[left].tags || []).filter((tag) =>
        (notes[right].tags || []).includes(tag),
      ).length;
      const sameBook = notes[left].book_name && notes[left].book_name === notes[right].book_name ? 2 : 0;
      const sameGroup = notes[left].thought_group && notes[left].thought_group === notes[right].thought_group ? 1 : 0;
      const score = sharedTags * 4 + sameBook + sameGroup + overlap(notes[left], notes[right]);
      if (!best || score > best.score) best = { a: notes[left], b: notes[right], score };
    }
  }
  return best && best.score > 0 ? best : null;
}

function compact(note?: Note) {
  if (!note) return "";
  const title = note.title || note.body || "Saved reflection";
  return `${note.reference || "Saved reflection"} — ${title.slice(0, 115)}`;
}

function synthesize(notes: Note[], purpose: string) {
  if (!notes.length) {
    return [
      "Pattern",
      "Your Garden is empty.",
      "",
      "Meaning",
      "Selah needs your own reflections before it can surface themes, questions, or connections.",
      "",
      "Next step",
      "Read a passage, tap Reflect, and save one thought that you want to remember.",
    ].join("\n");
  }
  const tags = countBy(notes, (note) => note.tags || []);
  const groups = countBy(notes, (note) => (note.thought_group ? [note.thought_group] : []));
  const books = countBy(notes, (note) => (note.book_name ? [note.book_name] : []));
  const questions = notes.filter((note) => note.thought_group === "Question" && (note.status || "open") === "open");
  const applications = notes.filter((note) => note.thought_group === "Application" && (note.status || "open") === "open");
  const connections = notes.filter((note) => note.thought_group === "Connection");
  const prayers = notes.filter((note) => note.thought_group === "Prayer");
  const terms = topTerms(notes);
  const pair = strongestPair(notes);
  const topTag = tags[0]?.[0] || "an emerging theme";
  const topBook = books[0]?.[0] || "your recent reading";
  const topGroup = groups[0]?.[0] || "reflection";
  const diversity =
    tags.length >= 4 && books.length >= 3
      ? "Your Garden is broad: several themes are appearing across multiple books."
      : tags.length >= 3
        ? "Your Garden is theme-led right now: a few repeated ideas are carrying most of the pattern."
        : "Your Garden is still early: the strongest signal is where you keep returning.";
  const tension =
    questions.length && applications.length
      ? "There is a useful tension between questions you are still carrying and applications you have already named."
      : questions.length
        ? "Questions are leading the current season; keep them connected to exact passages so they do not become vague."
        : applications.length
          ? "Applications are leading the current season; revisit them so insight becomes practice."
          : prayers.length
            ? "Prayer is leading the current season; look for what those prayers consistently ask God to form in you."
            : "Add thought types to sharpen the next synthesis.";
  const action =
    questions[0]?.body
      ? `Revisit this open question: "${questions[0].body.slice(0, 140)}"`
      : applications[0]?.body
        ? `Follow up on this application: "${applications[0].body.slice(0, 140)}"`
        : connections[0]?.body
          ? `Open a connection note and add one related passage.`
          : `Add a thought type and theme to your next reflection so Selah can connect it later.`;
  const graphLine =
    purpose === "graph"
      ? `The strongest visible connection is #${topTag}, appearing across ${tags[0]?.[1] || 1} reflection${(tags[0]?.[1] || 1) === 1 ? "" : "s"}.`
      : `Your strongest current pattern is #${topTag}, especially around ${topBook}.`;
  return [
    "Pattern",
    `${graphLine} Your most common thought type is ${topGroup}. ${diversity}`,
    "",
    "Strongest connection",
    pair
      ? `${compact(pair.a)} appears connected to ${compact(pair.b)}. The connection is based on shared tags, book context, thought type, and repeated wording.`
      : "No strong note-to-note pair is available yet. Add themes and thought types to create clearer connections.",
    "",
    "Meaning to test",
    `${tension} Selah is showing where your attention keeps returning, not declaring a final interpretation. Compare the pattern against Scripture and the evidence reflections before acting on it.`,
    "",
    "Next step",
    action,
    "",
    "Reflection practice",
    "Pick one saved note in the strongest connection and add a follow-up: what changed, what remains unresolved, and what response is concrete enough to revisit.",
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  try {
    const { supabase, user } = await requireUser(req);
    const { purpose = "insights" } = await req.json().catch(() => ({}));
    const { data: notes } = await supabase
      .from("garden_notes")
      .select("title,body,reference,tags,thought_group,book_name,status,origin,verse_start,verse_end,created_at,updated_at,last_revisited_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100);

    return new Response(
      JSON.stringify({
        synthesis: synthesize(notes || [], purpose),
        mode: "algorithm",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Garden synthesis failed", error);
    return new Response(JSON.stringify({ error: "Garden synthesis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
