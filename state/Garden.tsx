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
export type ReflectionStatus = "open" | "resolved" | "practiced" | "archived";
export type ReflectionOrigin =
  | "user_written"
  | "ai_prompted"
  | "ai_generated"
  | "ai_edited";

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
  group: ThoughtGroup | null;
  verseStart: number | null;
  verseEnd: number | null;
  status: ReflectionStatus;
  origin: ReflectionOrigin;
  lastRevisitedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

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
  | "verseStart"
  | "verseEnd"
  | "status"
  | "origin"
  | "lastRevisitedAt"
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
const KEY = "selah.garden.notes.v3";

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
  title: row.title || "",
  body: row.body,
  tags: row.tags || [],
  group: row.thought_group || null,
  verseStart: row.verse_start ?? null,
  verseEnd: row.verse_end ?? null,
  status: row.status || "open",
  origin: row.origin || "user_written",
  lastRevisitedAt: row.last_revisited_at || null,
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
  title: note.title.trim() || null,
  body: note.body,
  tags: note.tags,
  thought_group: note.group || null,
  verse_start: note.verseStart,
  verse_end: note.verseEnd,
  status: note.status,
  origin: note.origin,
  last_revisited_at: note.lastRevisitedAt,
});

export function GardenProvider({ children }: PropsWithChildren) {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<GardenNote[]>([]);
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
          else setNotes([]);
          setReady(true);
        });
    } else {
      AsyncStorage.getItem(KEY)
        .then((raw) => {
          if (!raw) {
            setNotes([]);
            return;
          }
          try {
            const saved = JSON.parse(raw);
            setNotes(Array.isArray(saved) ? saved : []);
          } catch {
            setNotes([]);
          }
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
      const id = uuid();
      const now = new Date().toISOString();
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
