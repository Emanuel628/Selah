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

const sortCounts = (map: Map<string, number>) =>
  [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

function countBy(notes: Note[], getValues: (note: Note) => string[]) {
  const counts = new Map<string, number>();
  notes.forEach((note) =>
    getValues(note).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1)),
  );
  return sortCounts(counts);
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
  const questions = notes.filter((note) => note.thought_group === "Question");
  const applications = notes.filter((note) => note.thought_group === "Application");
  const connections = notes.filter((note) => note.thought_group === "Connection");
  const topTag = tags[0]?.[0] || "an emerging theme";
  const topBook = books[0]?.[0] || "your recent reading";
  const topGroup = groups[0]?.[0] || "reflection";
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
    `${graphLine} Your most common thought type is ${topGroup}.`,
    "",
    "Meaning",
    `Selah is seeing where your attention keeps returning, not declaring a final interpretation. Use this as a prompt to compare your own reflections.`,
    "",
    "Next step",
    action,
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
      .select("title,body,reference,tags,thought_group,book_name")
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
