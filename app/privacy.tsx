import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { DetailScreen } from "@/components/DetailScreen";
import { AppColors } from "@/lib/theme";
import { useThemeColors } from "@/state/useThemeColors";
export default function Privacy() {
  const [lock, setLock] = useState(false);
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  return (
    <DetailScreen title="Privacy & security">
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.intro}>
          Your Garden is personal. These controls describe how Selah will
          protect it once device services are connected.
        </Text>
        <View style={s.group}>
          <View style={s.row}>
            <View style={s.copy}>
              <Text style={s.title}>Biometric lock</Text>
              <Text style={s.sub}>
                Require Face ID, Touch ID, or your device unlock.
              </Text>
            </View>
            <Switch
              value={lock}
              onValueChange={setLock}
              trackColor={{ false: c.muted, true: c.green }}
              thumbColor={c.paper}
            />
          </View>
          <View style={s.row}>
            <View style={s.copy}>
              <Text style={s.title}>Local prototype data</Text>
              <Text style={s.sub}>
                Notes currently reset when the app reloads.
              </Text>
            </View>
            <Text style={s.value}>Temporary</Text>
          </View>
        </View>
      </ScrollView>
    </DetailScreen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18 },
    intro: { color: c.muted, lineHeight: 20, marginBottom: 20 },
    group: {
      backgroundColor: c.surface,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: c.line,
      overflow: "hidden",
    },
    row: {
      minHeight: 72,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderColor: c.line,
    },
    copy: { flex: 1, paddingRight: 10 },
    title: { color: c.text, fontWeight: "600" },
    sub: { color: c.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
    value: { color: c.gold, fontSize: 11, fontWeight: "600" },
  });
