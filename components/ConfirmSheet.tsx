import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppColors } from "@/lib/theme";

type Props = {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  destructive?: boolean;
  colors: AppColors;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  destructive,
  colors,
  onCancel,
  onConfirm,
}: Props) {
  const s = styles(colors, destructive);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={s.overlay}>
        <Pressable style={s.scrim} onPress={onCancel} />
        <View style={s.sheet}>
          <View style={s.header}>
            <Text style={s.title}>{title}</Text>
            <Pressable accessibilityLabel="Close confirmation" onPress={onCancel} style={s.close}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          {!!body && <Text style={s.body}>{body}</Text>}
          <View style={s.actions}>
            <Pressable onPress={onCancel} style={s.cancel}>
              <Text style={s.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={s.confirm}>
              <Text style={s.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = (c: AppColors, destructive?: boolean) =>
  StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end" },
    scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,.45)" },
    sheet: {
      backgroundColor: c.bg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 28,
      borderWidth: 1,
      borderColor: c.line,
    },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    title: { color: c.text, fontSize: 20, fontWeight: "900", flex: 1 },
    close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    body: { color: c.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
    actions: { flexDirection: "row", gap: 10, marginTop: 18 },
    cancel: {
      flex: 1,
      minHeight: 48,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelText: { color: c.text, fontWeight: "800" },
    confirm: {
      flex: 1,
      minHeight: 48,
      borderRadius: 13,
      backgroundColor: destructive ? c.danger : c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmText: { color: c.onAccent, fontWeight: "900" },
  });
