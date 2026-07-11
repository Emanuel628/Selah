import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DetailScreen } from "@/components/DetailScreen";
import { AppColors } from "@/lib/theme";
import { useAppSettings } from "@/state/AppSettings";
import { useThemeColors } from "@/state/useThemeColors";

export default function Preferences() {
  const settings = useAppSettings();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const maximum = isTablet ? 34 : 26;
  const savedOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (settings.readerFontSize > maximum) settings.setReaderFontSize(maximum);
  }, [maximum, settings.readerFontSize]);
  const changeSize = (delta: number) =>
    settings.setReaderFontSize(
      Math.max(16, Math.min(maximum, settings.readerFontSize + delta)),
    );
  const save = async () => {
    await settings.saveReaderPreferences();
    savedOpacity.stopAnimation();
    savedOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(900),
      Animated.timing(savedOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const Toggle = ({
    label,
    description,
    value,
    onChange,
  }: {
    label: string;
    description: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <View style={s.row}>
      <View style={s.copy}>
        <Text style={s.title}>{label}</Text>
        <Text style={s.description}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: c.muted, true: c.green }}
        thumbColor={c.paper}
      />
    </View>
  );
  return (
    <DetailScreen title="Reading preferences">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.body}
      >
        <Text style={s.intro}>
          Shape the reading canvas around how you study. Save when the settings
          feel right.
        </Text>
        <Text style={s.label}>APPEARANCE</Text>
        <View style={s.group}>
          <Toggle
            label="Dark mode"
            description="Use Selah’s low-light reading palette"
            value={settings.darkMode}
            onChange={settings.setDarkMode}
          />
        </View>
        <Text style={s.label}>SCRIPTURE</Text>
        <View style={s.group}>
          <Toggle
            label="Verse numbers"
            description="Show verse markers alongside the text"
            value={settings.showVerseNumbers}
            onChange={settings.setShowVerseNumbers}
          />
          <Toggle
            label="Red lettering"
            description="Highlight the words of Jesus where available"
            value={settings.redLettering}
            onChange={settings.setRedLettering}
          />
        </View>
        <Text style={s.label}>TEXT SIZE</Text>
        <View style={s.sizeCard}>
          <Pressable
            accessibilityLabel="Decrease text size"
            disabled={settings.readerFontSize <= 16}
            onPress={() => changeSize(-2)}
            style={[s.sizeButton, settings.readerFontSize <= 16 && s.disabled]}
          >
            <Ionicons name="remove" size={24} color={c.green} />
          </Pressable>
          <View style={s.sizePreview}>
            <Text style={[s.sample, { fontSize: settings.readerFontSize }]}>
              Aa
            </Text>
            <Text style={s.sizeValue}>
              {settings.readerFontSize} pt · {isTablet ? "Tablet" : "Phone"} max{" "}
              {maximum} pt
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Increase text size"
            disabled={settings.readerFontSize >= maximum}
            onPress={() => changeSize(2)}
            style={[
              s.sizeButton,
              settings.readerFontSize >= maximum && s.disabled,
            ]}
          >
            <Ionicons name="add" size={24} color={c.green} />
          </Pressable>
        </View>
        <Pressable
          accessibilityLabel="Save reading preferences"
          onPress={save}
          style={s.save}
        >
          <Text style={s.saveText}>Save preferences</Text>
        </Pressable>
        <Animated.View
          pointerEvents="none"
          style={[s.saved, { opacity: savedOpacity }]}
        >
          <Ionicons name="checkmark-circle" size={17} color={c.green} />
          <Text style={s.savedText}>Saved</Text>
        </Animated.View>
      </ScrollView>
    </DetailScreen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 38 },
    intro: { color: c.muted, lineHeight: 20, marginBottom: 22 },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.3,
      marginBottom: 7,
    },
    group: {
      backgroundColor: c.surface,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: c.line,
      overflow: "hidden",
      marginBottom: 20,
    },
    row: {
      minHeight: 68,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderColor: c.line,
    },
    copy: { flex: 1, paddingRight: 12 },
    title: { color: c.text, fontWeight: "600" },
    description: { color: c.muted, fontSize: 11, marginTop: 4 },
    sizeCard: {
      backgroundColor: c.surface,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: c.line,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sizeButton: {
      width: 52,
      height: 52,
      borderRadius: 14,
      backgroundColor: c.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    disabled: { opacity: 0.35 },
    sizePreview: { flex: 1, alignItems: "center" },
    sample: { color: c.text, fontFamily: "serif", lineHeight: 42 },
    sizeValue: { color: c.muted, fontSize: 10, marginTop: 3 },
    save: {
      height: 50,
      borderRadius: 12,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 22,
    },
    saveText: { color: c.onAccent, fontWeight: "800" },
    saved: {
      height: 34,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },
    savedText: { color: c.green, fontSize: 12, fontWeight: "700" },
  });
