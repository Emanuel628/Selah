import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { DetailScreen } from "@/components/DetailScreen";
import { AppColors } from "@/lib/theme";
import { useAppSettings } from "@/state/AppSettings";
import { ReminderTimePicker } from "@/components/ReminderTimePicker";
import { useThemeColors } from "@/state/useThemeColors";
import {
  cancelStudyReminders,
  scheduleStudyReminders,
} from "@/lib/notifications";
const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
export default function Reminders() {
  const settings = useAppSettings();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [enabled, setEnabled] = useState(settings.reminderEnabled);
  const [hour, setHour] = useState(settings.reminderHour);
  const [minute, setMinute] = useState(settings.reminderMinute);
  const [period, setPeriod] = useState<"AM" | "PM">(settings.reminderPeriod);
  const [days, setDays] = useState(settings.reminderDays);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const toggle = async (value: boolean) => {
    setEnabled(value);
    settings.setReminderEnabled(value);
    setMessage("");
    if (!value) {
      await cancelStudyReminders();
      await settings.saveReminderSettings(hour, minute, period, days, false);
      setMessage(
        "Reminders are off and scheduled notifications were cancelled.",
      );
    }
  };
  const save = async () => {
    if (!enabled || !days.length || saving) return;
    setSaving(true);
    setMessage("");
    try {
      await scheduleStudyReminders(hour, minute, period, days);
      settings.setReminderHour(hour);
      settings.setReminderMinute(minute);
      settings.setReminderPeriod(period);
      settings.setReminderDays(days);
      settings.setReminderEnabled(true);
      await settings.saveReminderSettings(hour, minute, period, days, true);
      setMessage(
        `Saved. Selah will remind you at ${hour}:${minute} ${period}.`,
      );
    } catch (error: any) {
      setMessage(error?.message || "Reminder could not be scheduled.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <DetailScreen title="Study rhythm">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.body}
      >
        <View style={s.enableRow}>
          <View style={s.copy}>
            <Text style={s.enableTitle}>Daily Selah</Text>
            <Text style={s.help}>
              Schedule a real device notification to return to Scripture.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Enable daily reminders"
            value={enabled}
            onValueChange={toggle}
            trackColor={{ false: c.muted, true: c.green }}
            thumbColor={c.paper}
          />
        </View>
        <View
          style={!enabled && s.inactive}
          pointerEvents={enabled ? "auto" : "none"}
        >
          <Text style={s.label}>TIME</Text>
          <ReminderTimePicker
            hour={hour}
            minute={minute}
            period={period}
            disabled={!enabled}
            onChange={(h, m, p) => {
              setHour(h);
              setMinute(m);
              setPeriod(p);
              setMessage("");
            }}
          />
          <Text style={s.label}>REMIND ME ON</Text>
          <View style={s.days}>
            {dayLabels.map((day, index) => (
              <Pressable
                accessibilityLabel={`Reminder ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][index]}`}
                key={`${day}${index}`}
                onPress={() =>
                  setDays((current) =>
                    current.includes(index)
                      ? current.filter((i) => i !== index)
                      : [...current, index],
                  )
                }
                style={[s.day, days.includes(index) && s.dayActive]}
              >
                <Text
                  style={[s.dayText, days.includes(index) && s.dayTextActive]}
                >
                  {day}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Pressable
          accessibilityLabel="Save study rhythm"
          accessibilityRole="button"
          disabled={!enabled || !days.length || saving}
          onPress={save}
          style={[s.save, (!enabled || !days.length || saving) && s.disabled]}
        >
          <Text style={s.saveText}>
            {saving ? "Scheduling…" : "Save study rhythm"}
          </Text>
        </Pressable>
        {!!message && (
          <Text accessibilityRole="alert" style={s.note}>
            {message}
          </Text>
        )}
      </ScrollView>
    </DetailScreen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 30 },
    enableRow: {
      backgroundColor: c.surface,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: c.line,
      padding: 15,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 22,
    },
    copy: { flex: 1, paddingRight: 12 },
    enableTitle: { color: c.text, fontWeight: "700" },
    help: { color: c.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.3,
      marginBottom: 9,
    },
    inactive: { opacity: 0.35 },
    days: { flexDirection: "row", justifyContent: "space-between" },
    day: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    dayActive: { backgroundColor: c.green },
    dayText: { color: c.muted, fontWeight: "700" },
    dayTextActive: { color: c.onAccent },
    save: {
      backgroundColor: c.green,
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      marginTop: 28,
    },
    disabled: { opacity: 0.35 },
    saveText: { color: c.onAccent, fontWeight: "800" },
    note: {
      color: c.muted,
      fontSize: 11,
      lineHeight: 17,
      textAlign: "center",
      marginTop: 10,
    },
  });
