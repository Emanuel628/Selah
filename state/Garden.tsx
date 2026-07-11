import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/state/Auth";

export const THOUGHT_GROUPS = [
  "Observation",
  "Interpretation",
  "Connection",
  "Application",
  "Prayer",
  "Question",
] as const;
export type ThoughtGroup = (typeof THOUGHT_GROUPS)[number];
export type GardenNote = {
  id: string;
  translationId: string;
  bookId: string | null;
  bookName: string;
  chapter: number;
  page: number;
  reference: string;
  title: string;
  body: string;
  tags: string[];
  group: ThoughtGroup;
  createdAt: string;
  updatedAt: string;
};
const seed: GardenNote[] = [
  {
    id: "genesis-1-2",
    translationId: "BSB",
    bookId: "GEN",
    bookName: "Genesis",
    chapter: 1,
    page: 1,
    reference: "Genesis 1 · Page 1",
    title: "Life moving over chaos",
    body: "“Spirit of God” (Ruach) signifies dynamic life moving over chaos.",
    tags: ["Sovereignty"],
    group: "Observation",
    createdAt: "2026-07-11T12:00:00.000Z",
    updatedAt: "2026-07-11T12:00:00.000Z",
  },
  {
    id: "john-1-1",
    translationId: "BSB",
    bookId: "JHN",
    bookName: "John",
    chapter: 1,
    page: 1,
    reference: "John 1 · Page 1",
    title: "A cosmic echo",
    body: "The connection to Genesis is a cosmic echo. Logos points to structural order.",
    tags: ["Covenants"],
    group: "Connection",
    createdAt: "2026-07-10T12:00:00.000Z",
    updatedAt: "2026-07-10T12:00:00.000Z",
  },
];
type NoteInput = Pick<
  GardenNote,
  | "translationId"
  | "bookId"
  | "bookName"
  | "chapter"
  | "page"
  | "reference"
  | "title"
  | "body"
  | "tags"
  | "group"
>;
type GardenValue = {
  notes: GardenNote[];
  ready: boolean;
  getNote: (id: string) => GardenNote | undefined;
  createNote: (input: NoteInput) => string;
  updateNote: (id: string, input: NoteInput) => void;
  deleteNote: (id: string) => void;
};
const Context = createContext<GardenValue | null>(null);
const KEY = "selah.garden.notes.v2";
const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === "x" ? random : (random & 3) | 8).toString(16);
  });
const fromRow = (row: any): GardenNote => ({
  id: row.id,
  translationId: row.translation_id,
  bookId: row.book_id,
  bookName: row.book_name,
  chapter: row.chapter,
  page: row.page,
  reference: row.reference,
  title: row.title,
  body: row.body,
  tags: row.tags || [],
  group: row.thought_group,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const toRow = (note: NoteInput) => ({
  translation_id: note.translationId,
  book_id: note.bookId,
  book_name: note.bookName,
  chapter: note.chapter,
  page: note.page,
  reference: note.reference,
  title: note.title,
  body: note.body,
  tags: note.tags,
  thought_group: note.group,
});
export function GardenProvider({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState(seed);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (authLoading) return;
    setReady(false);
    if (user) {
      supabase
        .from("garden_notes")
        .select("*")
        .order("updated_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setNotes(data.map(fromRow));
          setReady(true);
        });
    } else {
      AsyncStorage.getItem(KEY)
        .then((raw) => {
          if (raw) {
            try {
              const saved = JSON.parse(raw);
              if (Array.isArray(saved)) setNotes(saved);
            } catch {}
          } else setNotes(seed);
        })
        .finally(() => setReady(true));
    }
  }, [user?.id, authLoading]);
  useEffect(() => {
    if (ready && !user) AsyncStorage.setItem(KEY, JSON.stringify(notes));
  }, [notes, ready, user]);
  const getNote = useCallback(
    (id: string) => notes.find((note) => note.id === id),
    [notes],
  );
  const createNote = useCallback(
    (input: NoteInput) => {
      const id = uuid(),
        now = new Date().toISOString();
      const note = { ...input, id, createdAt: now, updatedAt: now };
      setNotes((current) => [note, ...current]);
      if (user)
        supabase
          .from("garden_notes")
          .insert({ id, user_id: user.id, ...toRow(input) })
          .then(
            ({ error }) =>
              error && console.warn("Could not sync reflection", error.message),
          );
      return id;
    },
    [user],
  );
  const updateNote = useCallback(
    (id: string, input: NoteInput) => {
      setNotes((current) =>
        current.map((note) =>
          note.id === id
            ? { ...note, ...input, updatedAt: new Date().toISOString() }
            : note,
        ),
      );
      if (user)
        supabase
          .from("garden_notes")
          .update(toRow(input))
          .eq("id", id)
          .eq("user_id", user.id)
          .then(
            ({ error }) =>
              error && console.warn("Could not sync reflection", error.message),
          );
    },
    [user],
  );
  const deleteNote = useCallback(
    (id: string) => {
      setNotes((current) => current.filter((note) => note.id !== id));
      if (user)
        supabase
          .from("garden_notes")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id)
          .then(
            ({ error }) =>
              error &&
              console.warn("Could not delete reflection", error.message),
          );
    },
    [user],
  );
  const value = useMemo(
    () => ({ notes, ready, getNote, createNote, updateNote, deleteNote }),
    [notes, ready, getNote, createNote, updateNote, deleteNote],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useGarden() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing GardenProvider");
  return value;
}
