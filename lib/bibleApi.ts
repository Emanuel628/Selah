const API_ROOT = "https://bible.helloao.org/api";

export type BibleTranslation = {
  id: string;
  name: string;
  englishName: string;
  shortName: string;
  language: string;
  languageName?: string;
  languageEnglishName?: string;
  textDirection: "ltr" | "rtl";
  licenseUrl: string;
  website: string;
  numberOfBooks: number;
  totalNumberOfChapters: number;
  totalNumberOfVerses: number;
};

type FormattedText = { text: string; wordsOfJesus?: boolean; poem?: number };
type VerseContent =
  | string
  | FormattedText
  | { heading: string }
  | { lineBreak: true }
  | { noteId: number };
type ChapterItem =
  | { type: "heading"; content: string[] }
  | { type: "line_break" }
  | { type: "hebrew_subtitle"; content: VerseContent[] }
  | { type: "verse"; number: number; content: VerseContent[] };

export type BibleVerse = {
  number: number;
  text: string;
  hasWordsOfJesus: boolean;
};
export type BibleChapter = {
  translation: BibleTranslation;
  book: {
    id: string;
    name: string;
    commonName: string;
    numberOfChapters: number;
  };
  chapterNumber: number;
  verses: BibleVerse[];
  headings: string[];
  nextChapterApiLink: string | null;
  previousChapterApiLink: string | null;
};

export type BibleBook = BibleChapter["book"];

export type ScriptureSearchResult = {
  translationId: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};

export type CrossReference = {
  sourceVerse: number;
  bookId: string;
  chapter: number;
  verse: number;
  endVerse: number | null;
  score: number;
};

const request = async <T>(path: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(`${API_ROOT}${path}`, { signal });
  if (!response.ok)
    throw new Error(`Bible API request failed (${response.status})`);
  return response.json() as Promise<T>;
};

export async function getTranslations(signal?: AbortSignal) {
  const data = await request<{ translations: BibleTranslation[] }>(
    "/available_translations.json",
    signal,
  );
  return data.translations;
}

export async function getBooks(translationId: string, signal?: AbortSignal) {
  const data = await request<{
    books: Array<{
      id: string;
      name: string;
      commonName: string;
      numberOfChapters: number;
    }>;
  }>(`/${translationId}/books.json`, signal);
  return data.books;
}

export async function getCompleteTranslation(
  translationId: string,
  signal?: AbortSignal,
) {
  const data = await request<{
    translation: BibleTranslation;
    books: Array<{
      id: string;
      name: string;
      commonName: string;
      numberOfChapters: number;
      chapters: Array<{
        chapter: {
          number: number;
          content: ChapterItem[];
        };
      }>;
    }>;
  }>(`/${translationId}/complete.json`, signal);
  return data;
}

const contentText = (content: VerseContent[]) =>
  content
    .map((item) => {
      if (typeof item === "string") return item;
      if ("text" in item) return item.text;
      if ("heading" in item) return item.heading;
      if ("lineBreak" in item) return " ";
      return "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

export async function getChapter(
  translationId: string,
  bookId: string,
  chapterNumber: number,
  signal?: AbortSignal,
): Promise<BibleChapter> {
  const data = await request<{
    translation: BibleTranslation;
    book: BibleChapter["book"];
    nextChapterApiLink: string | null;
    previousChapterApiLink: string | null;
    chapter: { number: number; content: ChapterItem[] };
  }>(`/${translationId}/${bookId}/${chapterNumber}.json`, signal);
  return {
    translation: data.translation,
    book: data.book,
    chapterNumber: data.chapter.number,
    headings: data.chapter.content
      .filter(
        (item): item is Extract<ChapterItem, { type: "heading" }> =>
          item.type === "heading",
      )
      .map((item) => item.content.join(" ")),
    verses: data.chapter.content
      .filter(
        (item): item is Extract<ChapterItem, { type: "verse" }> =>
          item.type === "verse",
      )
      .map((item) => ({
        number: item.number,
        text: contentText(item.content),
        hasWordsOfJesus: item.content.some(
          (part) =>
            typeof part === "object" &&
            "wordsOfJesus" in part &&
            part.wordsOfJesus === true,
        ),
      })),
    nextChapterApiLink: data.nextChapterApiLink,
    previousChapterApiLink: data.previousChapterApiLink,
  };
}

export async function getCrossReferences(
  bookId: string,
  chapterNumber: number,
  signal?: AbortSignal,
): Promise<CrossReference[]> {
  const data = await request<{
    chapter: {
      content: Array<{
        verse: number;
        references: Array<{
          book: string;
          chapter: number;
          verse: number;
          endVerse?: number;
          score: number;
        }>;
      }>;
    };
  }>(`/d/open-cross-ref/${bookId}/${chapterNumber}.json`, signal);
  return data.chapter.content.flatMap((item) =>
    item.references.map((reference) => ({
      sourceVerse: item.verse,
      bookId: reference.book,
      chapter: reference.chapter,
      verse: reference.verse,
      endVerse: reference.endVerse || null,
      score: reference.score,
    })),
  );
}

export function chapterItemsToVerses(content: ChapterItem[]) {
  return content
    .filter(
      (item): item is Extract<ChapterItem, { type: "verse" }> =>
        item.type === "verse",
    )
    .map((item) => ({
      number: item.number,
      text: contentText(item.content),
      hasWordsOfJesus: item.content.some(
        (part) =>
          typeof part === "object" &&
          "wordsOfJesus" in part &&
          part.wordsOfJesus === true,
      ),
    }));
}

export function passageFromApiLink(link: string | null) {
  if (!link) return null;
  const match = link.match(/\/api\/[^/]+\/([^/]+)\/(\d+)\.json$/);
  return match ? { bookId: match[1], chapter: Number(match[2]) } : null;
}
