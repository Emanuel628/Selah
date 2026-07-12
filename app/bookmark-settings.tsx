import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DetailScreen } from "@/components/DetailScreen";
import { MARK_COLORS } from "@/lib/colorOptions";
import { AppColors } from "@/lib/theme";
import { useAppSettings } from "@/state/AppSettings";
import { useThemeColors } from "@/state/useThemeColors";

export default function BookmarkSettings() {
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const { bookmarkColor, setBookmarkColor } = useAppSettings();
  return (
    <DetailScreen
      title="Bookmark color"
      subtitle="Choose a color that is easy to recognize."
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.body}
      >
        <View style={s.preview}>
          <Ionicons name="bookmark" size={42} color={bookmarkColor} />
          <Text style={s.previewText}>Your reading bookmark</Text>
        </View>
        <Text style={s.label}>COLOR</Text>
        <View style={s.grid}>
          {MARK_COLORS.map(([name, color]) => (
            <Pressable
              accessibilityLabel={`${name} bookmark color`}
              accessibilityRole="radio"
              accessibilityState={{ checked: bookmarkColor === color }}
              key={color}
              onPress={() => setBookmarkColor(color)}
              style={[
                s.option,
                bookmarkColor === color && {
                  borderColor: color,
                  borderWidth: 2,
                },
              ]}
            >
              <View style={[s.swatch, { backgroundColor: color }]}>
                {bookmarkColor === color && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </View>
              <Text style={s.name}>{name}</Text>
              {bookmarkColor === color && (
                <Text style={s.selected}>Selected</Text>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </DetailScreen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 40 },
    preview: {
      height: 108,
      borderRadius: 16,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginBottom: 24,
    },
    previewText: { color: c.text, fontWeight: "600" },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.3,
      marginBottom: 10,
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    option: {
      width: "31%",
      minHeight: 82,
      borderRadius: 13,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },
    swatch: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    name: { color: c.text, fontSize: 11, fontWeight: "600" },
    selected: { color: c.muted, fontSize: 8, marginTop: -5 },
  });
