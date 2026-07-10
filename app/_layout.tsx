import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppSettingsProvider, useAppSettings } from '@/state/AppSettings';

function Navigation() { const { darkMode } = useAppSettings(); return <><StatusBar style={darkMode ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false }} /></>; }
export default function Root() { return <AppSettingsProvider><Navigation /></AppSettingsProvider>; }
