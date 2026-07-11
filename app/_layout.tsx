import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppSettingsProvider, useAppSettings } from "@/state/AppSettings";
import { GardenProvider } from "@/state/Garden";
import { AuthProvider, useAuth } from "@/state/Auth";
import { useEffect } from "react";
import "@/lib/notifications";
import { BiometricProvider } from "@/state/Biometric";

function Navigation() {
  const { darkMode, readerFullscreen } = useAppSettings();
  const { session, loading, passwordRecovery } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (loading || process.env.EXPO_PUBLIC_E2E_BYPASS_AUTH === "true") return;
    if (passwordRecovery && pathname !== "/update-password") {
      router.replace("/update-password");
      return;
    }
    const publicRoute = [
      "/login",
      "/register",
      "/forgot-password",
      "/auth-verify",
      "/update-password",
    ].some((route) => pathname.startsWith(route));
    if (!session && !publicRoute) router.replace("/login");
  }, [session, loading, pathname, passwordRecovery]);
  return (
    <>
      <StatusBar
        style={darkMode ? "light" : "dark"}
        hidden={readerFullscreen}
      />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
export default function Root() {
  return (
    <AuthProvider>
      <AppSettingsProvider>
        <BiometricProvider>
          <GardenProvider>
            <Navigation />
          </GardenProvider>
        </BiometricProvider>
      </AppSettingsProvider>
    </AuthProvider>
  );
}
