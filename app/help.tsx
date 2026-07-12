import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DetailScreen } from "@/components/DetailScreen";
import { AppColors } from "@/lib/theme";
import { useThemeColors } from "@/state/useThemeColors";

const sections = [
  [
    "Read Scripture",
    "Use the Read tab to open your current passage. Tap the passage title to choose an exact book, chapter, and page. Swipe left for the next page or swipe right for the previous page. The Previous page and Next page buttons do the same thing.",
  ],
  [
    "Full-screen reading",
    "Tap the expand icon on the Reader to hide navigation and show only Scripture. You can still scroll vertically and swipe left or right to change pages. Double-tap anywhere on the reading screen to exit full screen.",
  ],
  [
    "Bible version and text",
    "Choose your Bible version during setup or in Settings. Text Size, verse numbers, and red lettering are under Reading Preferences. Red lettering appears only when the selected translation supplies words-of-Jesus metadata.",
  ],
  [
    "Highlights",
    "Long-press a verse to begin a highlight. Keep your finger down and drag through the verses you want included, then lift your finger to save it. Long-press an already highlighted verse to remove that saved highlight. Choose your preferred highlight color in Settings, and review saved highlights from Settings > Highlights.",
  ],
  [
    "Bookmarks",
    "Tap the bookmark icon to save the exact Scripture book, chapter, and page. Choose a bookmark color in Settings.",
  ],
  [
    "Your Garden",
    "Tap New note while reading or from Garden. Notes created from the Reader include the exact Scripture chapter and page. Add a title, reflection, thought group, and tags, then save. Open a reflection to edit or delete it.",
  ],
  [
    "Find a reflection",
    "Use Garden filters to narrow notes by thought type, themes, Scripture book, or date. As your Garden grows, open Insights or Connections to browse relationships between themes, books, thought types, and reflections.",
  ],
  [
    "Search and cross-references",
    "Use the Search tab to search verse text across your selected Bible version. Use the down arrow on Read when you want to jump to a book, chapter, or page. In the Reader, related passages appear below the current page when cross-references are available.",
  ],
  [
    "Word Study",
    "Open Word Study from Settings to search a word or phrase across Scripture and your Garden. This is the first Pro study tool and will connect to paid entitlements when billing is live.",
  ],
  [
    "Study reminders",
    "Turn reminders on, choose a time and days, and save. Selah asks for notification permission and schedules alerts on this device. Turning reminders off cancels them. If alerts do not arrive, allow Selah notifications in the device Settings app.",
  ],
  [
    "Face ID and biometrics",
    "During setup or in Settings, you can enable Face ID login. After one normal password sign-in, Selah saves the login securely on this device so Face ID can sign you in next time. Selah does not add a second lock after you are already signed in.",
  ],
  [
    "Appearance and account",
    "Selah follows the device appearance by default. Choosing an appearance in Settings saves it to your account. Sign Out ends the session. Forgot Password emails a secure reset link. Delete Account permanently removes your account after subscription checks pass.",
  ],
  [
    "Free and Pro",
    "Selah Free includes reading, Garden reflections, bookmarks, Scripture search, highlights, and reminders. Pro tools include Garden Insights, Connections, Word Study, cross-reference study, and guided reflection. App Store billing is wired through the subscription page and requires the Selah Pro product to be active in App Store Connect.",
  ],
] as const;

export default function Help() {
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  return (
    <DetailScreen title="Help & How to Use Selah">
      <ScrollView
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.intro}>
          Selah is a Scripture reading and reflection garden: read carefully,
          capture what you notice, and return to those thoughts over time.
        </Text>
        {sections.map(([title, copy], index) => (
          <View key={title} style={s.section}>
            <Text style={s.number}>{index + 1}</Text>
            <View style={s.copy}>
              <Text style={s.title}>{title}</Text>
              <Text style={s.text}>{copy}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </DetailScreen>
  );
}

const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 38 },
    intro: {
      color: c.text,
      fontSize: 15,
      lineHeight: 23,
      fontWeight: "600",
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 16,
      padding: 17,
      marginBottom: 18,
    },
    section: {
      flexDirection: "row",
      gap: 12,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    number: {
      width: 26,
      height: 26,
      borderRadius: 13,
      textAlign: "center",
      lineHeight: 26,
      backgroundColor: c.green,
      color: c.onAccent,
      fontWeight: "800",
      fontSize: 12,
    },
    copy: { flex: 1 },
    title: { color: c.text, fontWeight: "800", fontSize: 15, marginBottom: 5 },
    text: { color: c.muted, fontSize: 12, lineHeight: 19 },
  });
