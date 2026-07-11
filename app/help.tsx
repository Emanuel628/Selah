import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DetailScreen } from "@/components/DetailScreen";
import { AppColors } from "@/lib/theme";
import { useThemeColors } from "@/state/useThemeColors";

const sections = [
  [
    "Read Scripture",
    "Use the Read tab to open your current passage. Tap the passage title to choose an exact book, chapter, and page. Previous page and Next page move through the chapter and continue into the adjacent chapter at an edge.",
  ],
  [
    "Full-screen reading",
    "Tap the expand icon on the Reader to hide navigation and show only Scripture. Double-tap anywhere on the reading screen to exit full screen.",
  ],
  [
    "Bible version and text",
    "Choose your Bible version during setup or in Settings. Text Size, verse numbers, and red lettering are under Reading Preferences. Red lettering appears only when the selected translation supplies words-of-Jesus metadata.",
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
    "Use Garden filters to narrow notes by thought group, tags, Scripture book, or date. Search looks across Scripture and your Garden; select a result to open it.",
  ],
  [
    "Study reminders",
    "Turn reminders on, choose a time and days, and save. Selah asks for notification permission and schedules alerts on this device. Turning reminders off cancels them. If alerts do not arrive, allow Selah notifications in the device Settings app.",
  ],
  [
    "Face ID and biometrics",
    "During setup, you can protect your signed-in session with Face ID or your device biometric. Change this in Settings. Selah never stores biometric data or your password; verification is handled by the device.",
  ],
  [
    "Appearance and account",
    "Selah follows the device appearance by default. Choosing an appearance in Settings saves it to your account. Sign Out ends the session. Forgot Password emails a secure reset link.",
  ],
  [
    "Free and Pro",
    "Selah Free includes reading, Garden reflections, bookmarks, search, and reminders. The optional 30-day Pro trial records your choice now; paid billing will not begin unless a future subscription is clearly offered and accepted.",
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
