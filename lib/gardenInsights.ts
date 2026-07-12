import { GardenNote } from "@/state/Garden";

const topEntries = (entries: string[], limit = 5) => {
  const counts = entries.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
};

export function buildGardenInsights(notes: GardenNote[]) {
  const tags = topEntries(notes.flatMap((note) => note.tags));
  const groups = topEntries(notes.map((note) => note.group).filter(Boolean) as string[]);
  const books = topEntries(notes.map((note) => note.bookName));
  const questions = notes.filter((note) => note.group === "Question");
  const applications = notes.filter((note) => note.group === "Application");
  const connections = notes.filter((note) => note.group === "Connection");
  const recent = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const dominantTag = tags[0]?.name;
  const dominantGroup = groups[0]?.name;
  const prompt = dominantTag
    ? `You are repeatedly noticing ${dominantTag}. Revisit one related passage and add one concrete application.`
    : "Add three reflections with tags to start seeing patterns across your Garden.";
  const summary =
    notes.length === 0
      ? "Your Garden is empty. Capture reflections from the Reader to begin synthesis."
      : `Your Garden currently leans toward ${dominantGroup || "reflection"} work, with ${dominantTag || "no recurring tag yet"} as the strongest visible theme.`;
  return {
    summary,
    prompt,
    tags,
    groups,
    books,
    questions: questions.slice(0, 3),
    applications: applications.slice(0, 3),
    connections: connections.slice(0, 3),
    recent: recent.slice(0, 3),
  };
}
