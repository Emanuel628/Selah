import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const IDS_KEY = "selah.reminder.notification_ids";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function cancelStudyReminders() {
  const raw = await AsyncStorage.getItem(IDS_KEY);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );
  await AsyncStorage.removeItem(IDS_KEY);
}

export async function scheduleStudyReminders(
  hour: number,
  minute: string,
  period: "AM" | "PM",
  days: number[],
) {
  if (Platform.OS === "web") {
    await cancelStudyReminders();
    return [];
  }
  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted)
    permissions = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
  if (!permissions.granted)
    throw new Error(
      "Notification permission was not granted. Enable notifications for Selah in device Settings.",
    );
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("study-reminders", {
      name: "Study reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });
  await cancelStudyReminders();
  const hour24 =
    period === "AM" ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12;
  const ids = await Promise.all(
    days.map((weekday) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Time for Selah",
          body: "Take a quiet moment to return to Scripture.",
          sound: "default",
          data: { route: "read" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: weekday + 1,
          hour: hour24,
          minute: Number(minute),
          channelId: Platform.OS === "android" ? "study-reminders" : undefined,
        },
      }),
    ),
  );
  await AsyncStorage.setItem(IDS_KEY, JSON.stringify(ids));
  return ids;
}
