import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { AppColors } from "@/lib/theme";
import { useThemeColors } from "@/state/useThemeColors";

export function ReminderTimePicker({
  hour,
  minute,
  period,
  disabled,
  onChange,
}: {
  hour: number;
  minute: string;
  period: "AM" | "PM";
  disabled?: boolean;
  onChange: (hour: number, minute: string, period: "AM" | "PM") => void;
}) {
  const [open, setOpen] = useState(false);
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const value = new Date(
    2026,
    0,
    1,
    period === "PM" ? (hour % 12) + 12 : hour % 12,
    Number(minute),
  );
  const handleChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setOpen(false);
    if (!date) return;
    const hours24 = date.getHours();
    onChange(
      hours24 % 12 || 12,
      String(date.getMinutes()).padStart(2, "0"),
      hours24 >= 12 ? "PM" : "AM",
    );
  };
  return (
    <View style={[s.card, disabled && s.disabled]}>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Choose reminder time"
        onPress={() => setOpen(true)}
        style={s.button}
      >
        <Text style={s.time}>
          {hour}:{minute} {period}
        </Text>
        <Text style={s.hint}>Tap to choose a time</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={value}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          themeVariant={c.bg === "#091a1d" ? "dark" : "light"}
          onChange={handleChange}
        />
      )}
      {open && Platform.OS === "ios" && (
        <Pressable onPress={() => setOpen(false)} style={s.done}>
          <Text style={s.doneText}>Done</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.line,
      overflow: "hidden",
      marginBottom: 22,
    },
    disabled: { opacity: 0.4 },
    button: { minHeight: 82, alignItems: "center", justifyContent: "center" },
    time: { color: c.text, fontSize: 30, fontWeight: "700" },
    hint: { color: c.muted, fontSize: 11, marginTop: 4 },
    done: { alignSelf: "flex-end", paddingHorizontal: 18, paddingVertical: 10 },
    doneText: { color: c.green, fontWeight: "700" },
  });
