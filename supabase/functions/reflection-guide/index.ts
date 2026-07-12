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
  "for",
  "you",
  "are",
  "but",
  "not",
  "his",
  "her",
  "him",
  "was",
  "had",
  "has",
  "into",
  "over",
  "under",
  "upon",
  "about",
  "again",
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
  "what",
  "which",
  "because",
  "before",
  "after",
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

function sentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function repeatedPhrases(text: string, size = 2, limit = 4) {
  const source = words(text);
  const counts = new Map<string, number>();
  for (let index = 0; index <= source.length - size; index += 1) {
    const phrase = source.slice(index, index + size).join(" ");
    counts.set(phrase, (counts.get(phrase) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([phrase, count]) => `${phrase} (${count})`);
}

function detectMovement(lines: string[]) {
  const joined = lines.join(" ").toLowerCase();
  const signals = [
    ["created", "creation/order"],
    ["said", "speech/command"],
    ["good", "approval/goodness"],
    ["called", "naming/identity"],
    ["blessed", "blessing"],
    ["covenant", "covenant promise"],
    ["believe", "trust"],
    ["repent", "turning"],
    ["love", "love"],
    ["forgive", "forgiveness"],
    ["pray", "prayer"],
    ["fear not", "comfort/courage"],
  ]
    .filter(([signal]) => joined.includes(signal))
    .map(([, label]) => label);
  return [...new Set(signals)].slice(0, 5);
}

function classifyQuestion(question: string) {
  const clean = question.trim().toLowerCase();
  if (!clean) return "";
  if (/\b(should|do i|how do|apply|practice|respond)\b/.test(clean))
    return "application";
  if (/\b(why|mean|meaning|understand|interpret)\b/.test(clean))
    return "interpretation";
  if (/\b(where|when|who|context|history)\b/.test(clean)) return "context";
  if (/\b(pray|feel|worry|fear|hope|trust)\b/.test(clean)) return "prayer";
  return "reflection";
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
  const phrases = repeatedPhrases(verseText);
  const passageSentences = sentences(verseText);
  const movementSignals = detectMovement(verseLines);
  const questionKind = classifyQuestion(question);
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
  const phraseLine = phrases.length
    ? `Repeated phrase patterns: ${phrases.join(", ")}. Repetition usually marks emphasis or structure.`
    : `Structural clues: ${movementSignals.length ? movementSignals.join(", ") : "speaker, action, contrast, command, promise, and response"}.`;
  const questionLine = question?.trim()
    ? `Your question appears to be a ${questionKind || "reflection"} question: ${question.trim()}\nAnswer it in this order: (1) what the passage explicitly says, (2) what the surrounding context allows, (3) what your Garden history is showing you, and (4) one faithful next response.`
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
  const strongestLine = passageSentences.length
    ? `Anchor sentence: "${passageSentences.sort((a, b) => overlapScore(b, verseText) - overlapScore(a, verseText))[0].slice(0, 180)}"`
    : "Anchor sentence: choose the verse or phrase that carries the main thought.";
  return [
    "OBSERVE",
    movement,
    termLine,
    phraseLine,
    strongestLine,
    "",
    "INTERPRET CAREFULLY",
    "Do not jump straight to a personal application. First identify the subject, action, repeated words, and whether the text is describing, commanding, promising, warning, or praising.",
    movementSignals.length
      ? `Likely emphasis markers: ${movementSignals.join(", ")}. Use these as questions, not automatic conclusions.`
      : "No single emphasis marker dominates, so compare the beginning and ending of the passage.",
    "",
    "CONNECT WITH YOUR GARDEN",
    connectionLine,
    groups.length ? `Thought types already present in your Garden: ${groups.join(", ")}.` : "No thought-type pattern yet.",
    "",
    "QUESTION TO WORK",
    questionLine,
    "",
    "RESPOND",
    revisitLine,
    "Write one sentence each: observation, interpretation, connection, response. Save whichever one you most need to remember.",
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
