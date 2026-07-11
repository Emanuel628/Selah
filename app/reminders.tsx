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
const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
export default function Reminders() {
  const settings = useAppSettings();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [enabled, setEnabled] = useState(true),
    [hour, setHour] = useState(settings.reminderHour),
    [minute, setMinute] = useState(settings.reminderMinute),
    [period, setPeriod] = useState<"AM" | "PM">(settings.reminderPeriod),
    [days, setDays] = useState(settings.reminderDays),
    [saved, setSaved] = useState(false);
  const changeTime = (h: number, m: string, p: "AM" | "PM") => {
    setHour(h);
    setMinute(m);
    setPeriod(p);
    setSaved(false);
  };
  const save = async () => {
    settings.setReminderHour(hour);
    settings.setReminderMinute(minute);
    settings.setReminderPeriod(period);
    settings.setReminderDays(days);
    await settings.saveReminderSettings(hour, minute, period, days);
    setSaved(true);
  };
  return (
    <DetailScreen title="Study rhythm">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.body}
      >
        <View style={s.enableRow}>
          <View>
            <Text style={s.enableTitle}>Daily Selah</Text>
            <Text style={s.help}>
              A quiet invitation to return to Scripture.
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: c.muted, true: c.green }}
            thumbColor={c.paper}
          />
        </View>
        <Text style={s.label}>TIME</Text>
        <ReminderTimePicker
          hour={hour}
          minute={minute}
          period={period}
          disabled={!enabled}
          onChange={changeTime}
        />
        <Text style={s.label}>REMIND ME ON</Text>
        <View style={[s.days, !enabled && s.inactive]}>
          {dayLabels.map((day, index) => (
            <Pressable
              key={`${day}${index}`}
              onPress={() => {
                setDays((current) =>
                  current.includes(index)
                    ? current.filter((i) => i !== index)
                    : [...current, index],
                );
                setSaved(false);
              }}
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
        <Pressable onPress={save} style={s.save}>
          <Text style={s.saveText}>
            {saved ? "Saved ✓" : "Save study rhythm"}
          </Text>
        </Pressable>
        <Text style={s.note}>
          {saved
            ? `Reminder saved for ${hour}:${minute} ${period}.`
            : "Changes are kept in this frontend session."}
        </Text>
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
    enableTitle: { color: c.text, fontWeight: "700" },
    help: { color: c.muted, fontSize: 11, marginTop: 4 },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.3,
      marginBottom: 9,
    },
    inactive: { opacity: 0.4 },
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
    saveText: { color: c.onAccent, fontWeight: "800" },
    note: { color: c.muted, fontSize: 11, textAlign: "center", marginTop: 10 },
  });
