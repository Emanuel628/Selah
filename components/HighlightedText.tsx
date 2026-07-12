import { Text, TextStyle } from "react-native";
import { AppColors } from "@/lib/theme";

type Props = {
  text: string;
  query: string;
  style?: TextStyle;
  highlightStyle?: TextStyle;
  colors: AppColors;
  numberOfLines?: number;
};

function findMatchRanges(text: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length < 2) return [];
  const terms = Array.from(
    new Set([
      normalizedQuery,
      ...normalizedQuery
        .split(/\s+/)
        .map((term) => term.trim())
        .filter((term) => term.length >= 2),
    ]),
  );
  const ranges: { start: number; end: number }[] = [];
  const lower = text.toLowerCase();
  terms.forEach((term) => {
    let start = lower.indexOf(term);
    while (start >= 0) {
      ranges.push({ start, end: start + term.length });
      start = lower.indexOf(term, start + term.length);
    }
  });
  return ranges
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .reduce<{ start: number; end: number }[]>((merged, range) => {
      const previous = merged[merged.length - 1];
      if (!previous || range.start > previous.end) merged.push({ ...range });
      else previous.end = Math.max(previous.end, range.end);
      return merged;
    }, []);
}

export function HighlightedText({
  text,
  query,
  style,
  highlightStyle,
  colors,
  numberOfLines,
}: Props) {
  const ranges = findMatchRanges(text, query);
  if (!ranges.length)
    return (
      <Text numberOfLines={numberOfLines} style={style}>
        {text}
      </Text>
    );

  const pieces: { text: string; highlighted: boolean }[] = [];
  let cursor = 0;
  ranges.forEach((range) => {
    if (range.start > cursor)
      pieces.push({ text: text.slice(cursor, range.start), highlighted: false });
    pieces.push({ text: text.slice(range.start, range.end), highlighted: true });
    cursor = range.end;
  });
  if (cursor < text.length) pieces.push({ text: text.slice(cursor), highlighted: false });

  return (
    <Text numberOfLines={numberOfLines} style={style}>
      {pieces.map((piece, index) => (
        <Text
          key={`${piece.text}-${index}`}
          testID={piece.highlighted ? "highlighted-match" : undefined}
          style={
            piece.highlighted
              ? [
                  {
                    backgroundColor: colors.gold,
                    color: colors.bg,
                    fontWeight: "900",
                  },
                  highlightStyle,
                ]
              : undefined
          }
        >
          {piece.text}
        </Text>
      ))}
    </Text>
  );
}
