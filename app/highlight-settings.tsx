import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DetailScreen } from "@/components/DetailScreen";
import { MARK_COLORS } from "@/lib/colorOptions";
import { AppColors } from "@/lib/theme";
import { useAppSettings } from "@/state/AppSettings";
import { useThemeColors } from "@/state/useThemeColors";

export default function HighlightSettings() {
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const { highlightColor, setHighlightColor } = useAppSettings();
  return (
    <DetailScreen
      title="Highlight color"
      subtitle="This color is used when you long-press and drag across Scripture."
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.body}
      >
        <View style={s.preview}>
          <Text style={[s.previewText, { backgroundColor: `${highlightColor}61` }]}>
            Blessed is the one whose delight is in the law of the Lord.
          </Text>
        </View>
        <Text style={s.label}>COLOR</Text>
        <View style={s.grid}>
          {MARK_COLORS.map(([name, color]) => (
            <Pressable
              accessibilityLabel={`${name} highlight color`}
              accessibilityRole="radio"
              accessibilityState={{ checked: highlightColor === color }}
              key={color}
              onPress={() => setHighlightColor(color)}
              style={[
                s.option,
                highlightColor === color && {
                  borderColor: color,
                  borderWidth: 2,
                },
              ]}
            >
              <View style={[s.swatch, { backgroundColor: color }]}>
                {highlightColor === color && (
                  <Ionicons name="checkmark" size={20} color="#1F2E2A" />
                )}
              </View>
              <Text style={s.name}>{name}</Text>
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
      borderRadius: 16,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      padding: 18,
      marginBottom: 24,
    },
    previewText: {
      color: c.text,
      fontFamily: "serif",
      fontSize: 18,
      lineHeight: 29,
      borderRadius: 7,
      padding: 6,
    },
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
  });
