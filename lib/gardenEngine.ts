import { GardenNote, ReflectionStatus, ThoughtGroup } from "@/state/Garden";
import { GARDEN_CONCEPTS } from "@/lib/gardenConcepts";

export type DateBucket = "Today" | "This Week" | "Earlier This Month" | "Older";

export type GardenFacet = {
  name: string;
  count: number;
  notes: GardenNote[];
};

export type InsightType =
  | "recurring_theme"
  | "cross_book_bridge"
  | "question_response"
  | "application_follow_up"
  | "thought_type_pattern"
  | "emerging_thread";

export type InsightCard = {
  id: string;
  type: InsightType;
  label: "Strong pattern" | "Emerging pattern" | "Open thread" | "Reflection rhythm";
  headline: string;
  explanation: string;
  evidence: GardenNote[];
  themeName?: string;
  actionLabel: string;
  actionType:
    | "follow_theme"
    | "view_evidence"
    | "compare_notes"
    | "mark_resolved"
    | "mark_practiced"
    | "add_follow_up";
  confidence: number;
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
  "will",
  "shall",
  "just",
  "like",
  "need",
  "want",
]);

export const DAY = 86400000;

export function meaningfulText(note: GardenNote) {
  return `${note.title} ${note.body} ${note.reference} ${note.bookName} ${note.tags.join(" ")} ${note.group || ""}`;
}

export function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

export function conceptVector(text: string) {
  const words = new Set(tokenize(text));
  const vector = new Set<string>();
  Object.entries(GARDEN_CONCEPTS).forEach(([concept, aliases]) => {
    if (aliases.some((alias) => words.has(alias))) vector.add(concept);
  });
  tokenize(text)
    .filter((word) => word.length > 4)
    .slice(0, 40)
    .forEach((word) => vector.add(word));
  return vector;
}

export function jaccard(a: Iterable<string>, b: Iterable<string>) {
  const left = new Set(a);
  const right = new Set(b);
  const union = new Set([...left, ...right]);
  if (!union.size) return 0;
  let shared = 0;
  left.forEach((item) => {
    if (right.has(item)) shared += 1;
  });
  return shared / union.size;
}

export function conceptOverlapScore(a: GardenNote, b: GardenNote) {
  return jaccard(conceptVector(meaningfulText(a)), conceptVector(meaningfulText(b)));
}

export function themeOverlap(a: GardenNote, b: GardenNote) {
  return jaccard(a.tags.map((tag) => tag.toLowerCase()), b.tags.map((tag) => tag.toLowerCase()));
}

export function scriptureScore(a: GardenNote, b: GardenNote) {
  if (a.bookId && b.bookId && a.bookId === b.bookId && a.chapter === b.chapter) return 0.7;
  if (a.bookId && b.bookId && a.bookId === b.bookId) return 0.3;
  return 0;
}

export function thoughtTypeScore(a: GardenNote, b: GardenNote) {
  const pair = `${a.group || ""}->${b.group || ""}`;
  if (
    [
      "Question->Interpretation",
      "Question->Connection",
      "Question->Application",
      "Application->Connection",
      "Observation->Interpretation",
    ].includes(pair)
  )
    return pair === "Question->Interpretation" || pair === "Application->Connection" ? 1 : 0.85;
  if (a.group && a.group === b.group) return 0.25;
  return 0;
}

export function relationshipScore(a: GardenNote, b: GardenNote) {
  const concept = conceptOverlapScore(a, b);
  const theme = themeOverlap(a, b);
  const scripture = scriptureScore(a, b);
  const thought = thoughtTypeScore(a, b);
  const lexical = jaccard(tokenize(meaningfulText(a)), tokenize(meaningfulText(b)));
  const secondary = theme > 0 || scripture > 0 || thought >= 0.75 || lexical >= 0.08;
  const score = concept * 0.5 + theme * 0.2 + lexical * 0.1 + scripture * 0.1 + thought * 0.1;
  return { score, concept, theme, lexical, scripture, thought, secondary };
}

export function hybridSearch(notes: GardenNote[], query: string) {
  const clean = query.trim().toLowerCase();
  if (!clean) return notes;
  const queryTokens = tokenize(clean);
  const queryConcepts = conceptVector(clean);
  return notes
    .map((note) => {
      const text = meaningfulText(note).toLowerCase();
      const lexical =
        (text.includes(clean) ? 1 : 0) +
        queryTokens.reduce((sum, token) => sum + (text.includes(token) ? 0.2 : 0), 0);
      const concept = jaccard(queryConcepts, conceptVector(meaningfulText(note)));
      const reference = note.reference.toLowerCase().includes(clean) ? 0.5 : 0;
      return { note, score: lexical + concept * 1.4 + reference };
    })
    .filter((item) => item.score > 0.08)
    .sort((a, b) => b.score - a.score || b.note.updatedAt.localeCompare(a.note.updatedAt))
    .map((item) => item.note);
}

export function bucketFor(dateText: string, now = new Date()): DateBucket {
  const date = new Date(dateText);
  const diff = now.getTime() - date.getTime();
  if (diff < DAY && date.getDate() === now.getDate()) return "Today";
  if (diff < DAY * 7) return "This Week";
  if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear())
    return "Earlier This Month";
  return "Older";
}

export function countFacets(notes: GardenNote[], getValues: (note: GardenNote) => string[]) {
  const map = new Map<string, GardenNote[]>();
  notes.forEach((note) =>
    getValues(note).forEach((value) => {
      const clean = value.trim();
      if (!clean) return;
      map.set(clean, [...(map.get(clean) || []), note]);
    }),
  );
  return [...map.entries()]
    .map(([name, facetNotes]) => ({ name, count: facetNotes.length, notes: facetNotes }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function buildBrowseFacets(notes: GardenNote[]) {
  return {
    themes: countFacets(notes, (note) => note.tags),
    books: countFacets(notes, (note) => [note.bookName]),
    groups: countFacets(notes, (note) => (note.group ? [note.group] : [])),
    statuses: countFacets(notes, (note) => [note.status]),
  };
}

function separateDates(notes: GardenNote[]) {
  return new Set(notes.map((note) => note.createdAt.slice(0, 10))).size;
}

function distinctBooks(notes: GardenNote[]) {
  return new Set(notes.map((note) => note.bookName)).size;
}

function distinctReferences(notes: GardenNote[]) {
  return new Set(notes.map((note) => note.reference)).size;
}

function evidenceHash(notes: GardenNote[]) {
  return notes
    .map((note) => `${note.id}:${note.updatedAt}`)
    .sort()
    .join("|");
}

export function buildInsightCards(notes: GardenNote[], hiddenIds: string[] = []) {
  const cards: InsightCard[] = [];
  const facets = buildBrowseFacets(notes);
  const now = Date.now();

  facets.themes.forEach((theme) => {
    if (
      theme.count >= 3 &&
      separateDates(theme.notes) >= 2 &&
      distinctReferences(theme.notes) >= 2
    ) {
      cards.push({
        id: `recurring_theme:${theme.name}:${evidenceHash(theme.notes.slice(0, 5))}`,
        type: "recurring_theme",
        label: theme.count >= 5 ? "Strong pattern" : "Emerging pattern",
        headline: `${theme.name} keeps returning in your Garden.`,
        explanation: `This theme appears across ${theme.count} reflections and ${distinctReferences(theme.notes)} Scripture references.`,
        evidence: theme.notes.slice(0, 5),
        themeName: theme.name,
        actionLabel: "Follow the theme",
        actionType: "follow_theme",
        confidence: Math.min(0.92, 0.62 + theme.count * 0.05 + separateDates(theme.notes) * 0.03),
      });
    }
    if (theme.count >= 3 && distinctBooks(theme.notes) >= 2) {
      cards.push({
        id: `cross_book_bridge:${theme.name}:${evidenceHash(theme.notes.slice(0, 5))}`,
        type: "cross_book_bridge",
        label: "Strong pattern",
        headline: `${theme.name} is crossing books.`,
        explanation: `You are exploring this idea across ${distinctBooks(theme.notes)} books, including ${[
          ...new Set(theme.notes.map((note) => note.bookName)),
        ]
          .slice(0, 3)
          .join(", ")}.`,
        evidence: theme.notes.slice(0, 5),
        themeName: theme.name,
        actionLabel: "View evidence",
        actionType: "view_evidence",
        confidence: 0.78,
      });
    }
  });

  const openQuestions = notes.filter((note) => note.group === "Question" && note.status === "open");
  openQuestions.forEach((question) => {
    const candidate = notes
      .filter(
        (note) =>
          note.id !== question.id &&
          new Date(note.createdAt).getTime() > new Date(question.createdAt).getTime() &&
          ["Interpretation", "Connection", "Application"].includes(note.group || ""),
      )
      .map((note) => ({ note, relation: relationshipScore(question, note) }))
      .filter((item) => item.relation.concept >= 0.16 && item.relation.secondary)
      .sort((a, b) => b.relation.score - a.relation.score)[0];
    if (candidate) {
      cards.push({
        id: `question_response:${question.id}:${candidate.note.id}:${question.updatedAt}:${candidate.note.updatedAt}`,
        type: "question_response",
        label: "Open thread",
        headline: "A later reflection may respond to an earlier question.",
        explanation: `This connects ${question.reference} with ${candidate.note.reference}. The wording is cautious because you decide whether the question is resolved.`,
        evidence: [question, candidate.note],
        actionLabel: "View related reflections",
        actionType: "compare_notes",
        confidence: Math.min(0.88, 0.62 + candidate.relation.score),
      });
    }
  });

  notes
    .filter((note) => note.group === "Application" && note.status === "open")
    .forEach((note) => {
      const age = now - new Date(note.createdAt).getTime();
      const lastShown = note.lastRevisitedAt ? now - new Date(note.lastRevisitedAt).getTime() : Infinity;
      if (age >= DAY * 7 && lastShown >= DAY * 14) {
        cards.push({
          id: `application_follow_up:${note.id}:${note.updatedAt}`,
          type: "application_follow_up",
          label: "Open thread",
          headline: "You wanted to practice this.",
          explanation: `This application from ${note.reference} is still open and has been waiting more than seven days.`,
          evidence: [note],
          actionLabel: "I practiced this",
          actionType: "mark_practiced",
          confidence: 0.81,
        });
      }
    });

  const recent = [...notes]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);
  const recentGroups = countFacets(recent, (note) => (note.group ? [note.group] : []));
  const dominant = recentGroups[0];
  if (recent.length >= 10 && dominant && dominant.count / recent.length > 0.5) {
    cards.push({
      id: `thought_type_pattern:${dominant.name}:${evidenceHash(recent)}`,
      type: "thought_type_pattern",
      label: "Reflection rhythm",
      headline: `Your recent reflections have mostly been ${dominant.name}s.`,
      explanation: `${dominant.count} of your last ${recent.length} reflections share this thought type. Consider developing one into a different next step.`,
      evidence: recent.filter((note) => note.group === dominant.name).slice(0, 4),
      actionLabel: "Open a reflection",
      actionType: "add_follow_up",
      confidence: 0.76,
    });
  }

  for (let index = 0; index < notes.length; index += 1) {
    const related = notes
      .filter((note) => note.id !== notes[index].id)
      .map((note) => ({ note, relation: relationshipScore(notes[index], note) }))
      .filter((item) => item.relation.concept >= 0.2 && item.relation.secondary)
      .sort((a, b) => b.relation.score - a.relation.score)
      .slice(0, 2);
    if (related.length >= 2) {
      const evidence = [notes[index], ...related.map((item) => item.note)];
      cards.push({
        id: `emerging_thread:${notes[index].id}:${evidenceHash(evidence)}`,
        type: "emerging_thread",
        label: "Emerging pattern",
        headline: "A new thread may be forming.",
        explanation: `These reflections share related concepts and at least one supporting signal such as a theme, Scripture location, or thought type.`,
        evidence,
        actionLabel: "View evidence",
        actionType: "view_evidence",
        confidence: 0.7,
      });
      break;
    }
  }

  const diversity = new Map<string, number>();
  const usedEvidence = new Map<string, number>();
  return cards
    .filter((card) => !hiddenIds.includes(card.id))
    .sort((a, b) => b.confidence - a.confidence)
    .filter((card) => {
      const typeCount = diversity.get(card.type) || 0;
      if (typeCount >= 2) return false;
      const overused = card.evidence.some((note) => (usedEvidence.get(note.id) || 0) >= 2);
      if (overused) return false;
      diversity.set(card.type, typeCount + 1);
      card.evidence.forEach((note) => usedEvidence.set(note.id, (usedEvidence.get(note.id) || 0) + 1));
      return true;
    })
    .slice(0, 5);
}

export function buildSuggestedConnectionPairs(notes: GardenNote[]) {
  const pairs = new Map<string, { a: GardenNote; b: GardenNote; score: number }>();
  for (const a of notes) {
    for (const b of notes) {
      if (a.id >= b.id) continue;
      const relation = relationshipScore(a, b);
      if (relation.concept < 0.24 || relation.score < 0.26 || !relation.secondary) continue;
      const key = [a.id, b.id].sort().join(":");
      pairs.set(key, { a, b, score: relation.score });
    }
  }
  return [...pairs.values()].sort((a, b) => b.score - a.score).slice(0, 10);
}

export function statusLabel(status: ReflectionStatus, group: ThoughtGroup | null) {
  if (status === "resolved") return "Resolved";
  if (status === "practiced") return "Practiced";
  if (status === "archived") return "Archived";
  if (group === "Question") return "Open";
  if (group === "Application") return "Not practiced";
  return "";
}
