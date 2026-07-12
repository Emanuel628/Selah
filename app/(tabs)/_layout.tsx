import { ComponentProps, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppColors } from "@/lib/theme";
import { useThemeColors } from "@/state/useThemeColors";
import { useAppSettings } from "@/state/AppSettings";

type IconName = ComponentProps<typeof Ionicons>["name"];
const icons: Record<string, IconName> = {
  index: "book-outline",
  garden: "leaf-outline",
  revisit: "refresh-circle-outline",
  settings: "options-outline",
};
export default function Layout() {
  const c = useThemeColors();
  const { readerFullscreen } = useAppSettings();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => styles(c, insets.bottom), [c, insets.bottom]);
  return (
    <View style={s.viewport}>
      <View style={s.app}>
        <Tabs
          screenOptions={({ route }) => ({
            headerShown: false,
            sceneStyle: { backgroundColor: c.bg },
            tabBarStyle: readerFullscreen ? { display: "none" } : s.tabBar,
            tabBarItemStyle: s.tabItem,
            tabBarLabelStyle: s.tabLabel,
            tabBarActiveTintColor: c.green,
            tabBarInactiveTintColor: c.muted,
            tabBarHideOnKeyboard: true,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={icons[route.name]} color={color} size={size} />
            ),
          })}
        >
          <Tabs.Screen name="index" options={{ title: "Read" }} />
          <Tabs.Screen name="garden" options={{ title: "Garden" }} />
          <Tabs.Screen name="revisit" options={{ title: "Revisit" }} />
          <Tabs.Screen name="search" options={{ href: null }} />
          <Tabs.Screen name="settings" options={{ href: null }} />
        </Tabs>
      </View>
    </View>
  );
}
const styles = (c: AppColors, bottomInset: number) =>
  StyleSheet.create({
    viewport: { flex: 1, alignItems: "center", backgroundColor: c.desktopBg },
    app: {
      flex: 1,
      width: "100%",
      maxWidth: 560,
      backgroundColor: c.bg,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: c.line,
    },
    tabBar: {
      backgroundColor: c.navigation,
      borderTopColor: c.line,
      height: 78 + bottomInset,
      paddingTop: 10,
      paddingBottom: Math.max(14, bottomInset + 6),
      overflow: "visible",
    },
    tabItem: {
      minHeight: 58,
      paddingTop: 2,
      paddingBottom: 4,
      overflow: "visible",
    },
    tabLabel: {
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "600",
      marginBottom: 0,
    },
  });
