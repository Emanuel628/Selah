import { darkColors, lightColors } from "@/lib/theme";
import { useAppSettings } from "@/state/AppSettings";

export function useThemeColors() {
  const { darkMode } = useAppSettings();
  return darkMode ? darkColors : lightColors;
}
