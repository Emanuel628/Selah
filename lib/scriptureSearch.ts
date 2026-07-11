import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getCompleteTranslation,
  ScriptureSearchResult,
  chapterItemsToVerses,
} from "@/lib/bibleApi";

const keyFor = (translationId: string) => `selah.scripture.index.${translationId}`;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export async function buildScriptureIndex(
  translationId: string,
  signal?: AbortSignal,
) {
  const cached = await AsyncStorage.getItem(keyFor(translationId));
  if (cached) return JSON.parse(cached) as ScriptureSearchResult[];

  const complete = await getCompleteTranslation(translationId, signal);
  const index = complete.books.flatMap((book) =>
    book.chapters.flatMap((chapter) =>
      chapterItemsToVerses(chapter.chapter.content).map((verse) => ({
        translationId,
        bookId: book.id,
        bookName: book.name,
        chapter: chapter.chapter.number,
        verse: verse.number,
        text: verse.text,
      })),
    ),
  );
  try {
    await AsyncStorage.setItem(keyFor(translationId), JSON.stringify(index));
  } catch {
    // Full translation indexes can exceed browser storage quotas. Search still works in memory.
  }
  return index;
}

export function searchScriptureIndex(
  index: ScriptureSearchResult[],
  query: string,
  limit = 40,
) {
  const clean = normalize(query);
  if (!clean) return [];
  const terms = clean.split(" ").filter(Boolean);
  return index
    .map((result) => {
      const text = normalize(result.text);
      const reference = normalize(
        `${result.bookName} ${result.chapter} ${result.verse}`,
      );
      const score = terms.reduce((total, term) => {
        if (reference.includes(term)) return total + 8;
        if (text.includes(term)) return total + 3;
        return total - 4;
      }, 0);
      return { result, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.result);
}
