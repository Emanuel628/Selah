import { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';
import { useAppSettings } from '@/state/AppSettings';

type IconName = ComponentProps<typeof Ionicons>['name'];
const icons: Record<string, IconName> = { index: 'book-outline', garden: 'leaf-outline', search: 'search-outline', settings: 'options-outline' };

export default function Layout() {
  const { darkMode } = useAppSettings();
  const appBackground = darkMode ? colors.bg : colors.lightBg;
  return <View style={[s.viewport, { backgroundColor: darkMode ? colors.desktopBg : colors.lightDesktopBg }]}>
    <View style={[s.app, { backgroundColor: appBackground }]}> 
      <Tabs screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: appBackground },
        tabBarStyle: s.tabBar,
        tabBarItemStyle: s.tabItem,
        tabBarLabelStyle: s.tabLabel,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} color={color} size={size} />,
      })}>
        <Tabs.Screen name="index" options={{ title: 'Read' }} />
        <Tabs.Screen name="garden" options={{ title: 'Garden' }} />
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </View>
  </View>;
}

const s = StyleSheet.create({
  viewport: { flex: 1, alignItems: 'center' },
  app: { flex: 1, width: '100%', maxWidth: 560, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.line },
  tabBar: { backgroundColor: colors.navigation, borderTopColor: colors.line, height: 66, paddingTop: 7, paddingBottom: 7 },
  tabItem: { paddingVertical: 2 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
});
