import { GardenNote } from "@/state/Garden";

export type GraphCluster = {
  id: string;
  label: string;
  type: "Tag" | "Book" | "Thought Group";
  count: number;
  notes: GardenNote[];
};

export function buildKnowledgeGraph(notes: GardenNote[]) {
  const clusters = new Map<string, GraphCluster>();
  const add = (
    type: GraphCluster["type"],
    label: string,
    note: GardenNote,
  ) => {
    const id = `${type}:${label}`;
    const current =
      clusters.get(id) ||
      ({
        id,
        label,
        type,
        count: 0,
        notes: [],
      } satisfies GraphCluster);
    current.count += 1;
    current.notes.push(note);
    clusters.set(id, current);
  };

  notes.forEach((note) => {
    add("Book", note.bookName, note);
    if (note.group) add("Thought Group", note.group, note);
    note.tags.forEach((tag) => add("Tag", tag, note));
  });

  return Array.from(clusters.values()).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
}
