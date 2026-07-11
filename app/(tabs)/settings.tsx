import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { AppColors } from "@/lib/theme";
import { useAppSettings } from "@/state/AppSettings";
import { useThemeColors } from "@/state/useThemeColors";
import { useAuth } from "@/state/Auth";

function Setting({
  name,
  icon,
  value,
  onChange,
  detail,
  onPress,
  last,
  c,
  s,
  detailColor,
}: {
  name: string;
  icon: any;
  value?: boolean;
  onChange?: (v: boolean) => void;
  detail?: string;
  onPress?: () => void;
  last?: boolean;
  c: AppColors;
  s: ReturnType<typeof styles>;
  detailColor?: string;
}) {
  const content = (
    <>
      <Ionicons name={icon} size={18} color={detailColor || c.muted} />
      <Text style={s.name}>{name}</Text>
      {onChange ? (
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: c.muted, true: c.green }}
          thumbColor={c.paper}
        />
      ) : (
        <>
          <Text
            numberOfLines={1}
            style={[s.detail, detailColor ? { color: detailColor } : null]}
          >
            {detail}
          </Text>
          {onPress && (
            <Ionicons name="chevron-forward" size={17} color={c.muted} />
          )}
        </>
      )}
    </>
  );
  return onPress ? (
    <Pressable onPress={onPress} style={[s.row, last && s.last]}>
      {content}
    </Pressable>
  ) : (
    <View style={[s.row, last && s.last]}>{content}</View>
  );
}
export default function Settings() {
  const router = useRouter();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const {
    darkMode,
    setDarkMode,
    redLettering,
    setRedLettering,
    showVerseNumbers,
    setShowVerseNumbers,
    preferredTranslationName,
    reminderHour,
    reminderMinute,
    reminderPeriod,
    bookmarkColor,
    readerFontSize,
  } = useAppSettings();
  const [biometric, setBiometric] = useState(false);
  const { signOut } = useAuth();
  const row = (props: any) => <Setting {...props} c={c} s={s} />;
  return (
    <Screen title="Settings">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.body}
      >
        <Text style={s.label}>ACCOUNT</Text>
        <View style={s.group}>
          {row({
            icon: "star-outline",
            name: "Subscription",
            detail: "Free",
            onPress: () => router.push("/subscription"),
            last: true,
          })}
        </View>
        <Text style={s.label}>APPEARANCE</Text>
        <View style={s.group}>
          {row({
            icon: "moon-outline",
            name: "Dark Mode",
            value: darkMode,
            onChange: setDarkMode,
          })}
          {row({
            icon: "text-outline",
            name: "Text Size",
            detail: `${readerFontSize} pt`,
            onPress: () => router.push("/preferences"),
            last: true,
          })}
        </View>
        <Text style={s.label}>READER SETTINGS</Text>
        <View style={s.group}>
          {row({
            icon: "book-outline",
            name: "Bible Version",
            detail: preferredTranslationName,
            onPress: () => router.push("/bible-version"),
          })}
          {row({
            icon: "bookmark",
            name: "Bookmark Color",
            detail: "Change",
            detailColor: bookmarkColor,
            onPress: () => router.push("/bookmark-settings"),
          })}
          {row({
            icon: "chatbox-ellipses-outline",
            name: "Red Lettering",
            value: redLettering,
            onChange: setRedLettering,
          })}
          {row({
            icon: "list-outline",
            name: "Show Verse Numbers",
            value: showVerseNumbers,
            onChange: setShowVerseNumbers,
            last: true,
          })}
        </View>
        <Text style={s.label}>PRIVACY & SECURITY</Text>
        <View style={s.group}>
          {row({
            icon: "finger-print-outline",
            name: "Biometric Lock",
            value: biometric,
            onChange: setBiometric,
          })}
          {row({
            icon: "notifications-outline",
            name: "Daily Reminders",
            detail: `${reminderHour}:${reminderMinute} ${reminderPeriod}`,
            onPress: () => router.push("/reminders"),
            last: true,
          })}
        </View>
        <Pressable
          onPress={async () => {
            await signOut();
            router.replace("/login");
          }}
          style={s.logout}
        >
          <Text style={s.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 30 },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.3,
      marginTop: 4,
      marginBottom: 7,
    },
    group: {
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.line,
      overflow: "hidden",
      marginBottom: 16,
    },
    row: {
      minHeight: 54,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      borderBottomWidth: 1,
      borderColor: c.line,
    },
    last: { borderBottomWidth: 0 },
    name: { color: c.text, fontWeight: "600", flex: 1 },
    detail: { color: c.green, fontSize: 11, maxWidth: 150 },
    logout: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.danger,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 5,
    },
    logoutText: { color: c.danger, fontWeight: "700" },
  });
