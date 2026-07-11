import { BibleVerse } from "@/lib/bibleApi";

export function versesPerPage(shortestSide: number, fontSize: number) {
  const tablet = shortestSide >= 600;
  const base = tablet ? 18 : 10;
  return Math.max(4, Math.floor(base * (20 / fontSize)));
}

export function paginateVerses(
  verses: BibleVerse[],
  shortestSide: number,
  fontSize: number,
) {
  const size = versesPerPage(shortestSide, fontSize);
  const pages: BibleVerse[][] = [];
  for (let index = 0; index < verses.length; index += size)
    pages.push(verses.slice(index, index + size));
  return pages.length ? pages : [[]];
}
