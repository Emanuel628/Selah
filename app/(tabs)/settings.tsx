import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { AppColors } from "@/lib/theme";
import { useAppSettings } from "@/state/AppSettings";
import { useThemeColors } from "@/state/useThemeColors";
import { useAuth } from "@/state/Auth";
import { useBiometric } from "@/state/Biometric";
import { supabase } from "@/lib/supabase";
import { SUBSCRIPTION_FALLBACKS } from "@/lib/subscriptions";

function Setting({
  name,
  icon,
  value,
  onChange,
  detail,
  onPress,
  last,
  c,
  s,
  detailColor,
}: {
  name: string;
  icon: any;
  value?: boolean;
  onChange?: (v: boolean) => void;
  detail?: string;
  onPress?: () => void;
  last?: boolean;
  c: AppColors;
  s: ReturnType<typeof styles>;
  detailColor?: string;
}) {
  const content = (
    <>
      <Ionicons name={icon} size={18} color={detailColor || c.muted} />
      <Text style={s.name}>{name}</Text>
      {onChange ? (
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: c.muted, true: c.green }}
          thumbColor={c.paper}
        />
      ) : (
        <>
          <Text
            numberOfLines={1}
            style={[s.detail, detailColor ? { color: detailColor } : null]}
          >
            {detail}
          </Text>
          {onPress && (
            <Ionicons name="chevron-forward" size={17} color={c.muted} />
          )}
        </>
      )}
    </>
  );
  return onPress ? (
    <Pressable onPress={onPress} style={[s.row, last && s.last]}>
      {content}
    </Pressable>
  ) : (
    <View style={[s.row, last && s.last]}>{content}</View>
  );
}
export default function Settings() {
  const router = useRouter();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const {
    darkMode,
    setDarkMode,
    redLettering,
    setRedLettering,
    showVerseNumbers,
    setShowVerseNumbers,
    preferredTranslationName,
    reminderHour,
    reminderMinute,
    reminderPeriod,
    reminderEnabled,
    bookmarkColor,
    highlightColor,
    readerFontSize,
  } = useAppSettings();
  const { enabled: biometric, enable: setBiometric } = useBiometric();
  const [biometricMessage, setBiometricMessage] = useState("");
  const { signOut, user } = useAuth();
  const [subscriptionDetail, setSubscriptionDetail] = useState("Free");
  const [subscriptionTier, setSubscriptionTier] = useState<"free" | "pro">(
    "free",
  );
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("subscription_tier,trial_ends_at,subscription_product_id,subscription_expires_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setSubscriptionTier(data.subscription_tier || "free");
        if (data.subscription_tier !== "pro") return;
        const end = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
        const days = end
          ? Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000))
          : null;
        const expiresAt = data.subscription_expires_at
          ? new Date(data.subscription_expires_at)
          : null;
        setSubscriptionDetail(
          days === null
            ? SUBSCRIPTION_FALLBACKS[data.subscription_product_id || ""]?.title ||
                (expiresAt ? `Pro · ${expiresAt.toLocaleDateString()}` : "Pro")
            : `Pro trial · ${days} days`,
        );
      });
  }, [user?.id]);
  const cancelSubscription = async () => {
    const { error } = await supabase.functions.invoke("cancel-subscription");
    if (error) {
      Alert.alert("Could not cancel", error.message);
      return;
    }
    setSubscriptionTier("free");
    setSubscriptionDetail("Free");
    Alert.alert(
      "Subscription cancelled",
      "Your Pro access has been cancelled. A confirmation email will be sent if email delivery is configured.",
    );
  };
  const deleteAccount = async () => {
    if (deleting) return;
    if (subscriptionTier === "pro") {
      Alert.alert(
        "Cancel Pro before deleting",
        "Cancel your Pro subscription before permanently deleting this account.",
        [
          { text: "Keep Account", style: "cancel" },
          {
            text: "Cancel Subscription",
            style: "destructive",
            onPress: cancelSubscription,
          },
        ],
      );
      return;
    }
    Alert.alert(
      "Delete account permanently?",
      "This removes your login, settings, bookmarks, reminders, highlights, and Garden reflections. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const { error } = await supabase.functions.invoke(
              "delete-account",
            );
            setDeleting(false);
            if (error) {
              Alert.alert("Could not delete account", error.message);
              return;
            }
            await signOut();
            router.replace("/login");
          },
        },
      ],
    );
  };
  const row = (props: any) => <Setting {...props} c={c} s={s} />;
  return (
    <Screen title="Settings">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.body}
      >
        <Text style={s.label}>ACCOUNT</Text>
        <View style={s.group}>
          {row({
            icon: "star-outline",
            name: "Subscription",
            detail: subscriptionDetail,
            onPress: () => router.push("/subscription"),
            last: true,
          })}
        </View>
        <Text style={s.label}>APPEARANCE</Text>
        <View style={s.group}>
          {row({
            icon: "moon-outline",
            name: "Dark Mode",
            value: darkMode,
            onChange: setDarkMode,
          })}
          {row({
            icon: "text-outline",
            name: "Text Size",
            detail: `${readerFontSize} pt`,
            onPress: () => router.push("/preferences"),
            last: true,
          })}
        </View>
        <Text style={s.label}>READER SETTINGS</Text>
        <View style={s.group}>
          {row({
            icon: "book-outline",
            name: "Bible Version",
            detail: preferredTranslationName,
            onPress: () => router.push("/bible-version"),
          })}
          {row({
            icon: "bookmark",
            name: "Bookmark Color",
            detail: "Change",
            detailColor: bookmarkColor,
            onPress: () => router.push("/bookmark-settings"),
          })}
          {row({
            icon: "color-wand-outline",
            name: "Highlight Color",
            detail: "Change",
            detailColor: highlightColor,
            onPress: () => router.push("/highlight-settings" as any),
          })}
          {row({
            icon: "chatbox-ellipses-outline",
            name: "Red Lettering",
            value: redLettering,
            onChange: setRedLettering,
          })}
          {row({
            icon: "list-outline",
            name: "Show Verse Numbers",
            value: showVerseNumbers,
            onChange: setShowVerseNumbers,
            last: true,
          })}
        </View>
        <Text style={s.label}>PRIVACY & SECURITY</Text>
        <View style={s.group}>
          {row({
            icon: "finger-print-outline",
            name: "Face ID Login",
            value: biometric,
            onChange: async (value: boolean) => {
              const result = await setBiometric(value);
              setBiometricMessage(result.message);
            },
          })}
          {row({
            icon: "notifications-outline",
            name: "Daily Reminders",
            detail: reminderEnabled
              ? `${reminderHour}:${reminderMinute} ${reminderPeriod}`
              : "Off",
            onPress: () => router.push("/reminders"),
            last: true,
          })}
        </View>
        {!!biometricMessage && (
          <Text style={s.message}>{biometricMessage}</Text>
        )}
        <Text style={s.label}>SUPPORT</Text>
        <View style={s.group}>
          {row({
            icon: "help-circle-outline",
            name: "Help & How to Use Selah",
            detail: "Guide",
            onPress: () => router.push("/help"),
          })}
          {row({
            icon: "mail-outline",
            name: "Contact Support",
            detail: "Email",
            onPress: () => router.push("/support" as any),
          })}
          {row({
            icon: "shield-checkmark-outline",
            name: "Privacy Policy",
            detail: "Policy",
            onPress: () => router.push("/privacy" as any),
            last: true,
          })}
        </View>
        <Text style={s.label}>DANGER ZONE</Text>
        <View style={s.group}>
          {row({
            icon: "trash-outline",
            name: deleting ? "Deleting Account..." : "Delete Account",
            detail: "Permanent",
            detailColor: c.danger,
            onPress: deleteAccount,
            last: true,
          })}
        </View>
        <Pressable
          onPress={async () => {
            await signOut();
            router.replace("/login");
          }}
          style={s.logout}
        >
          <Text style={s.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 18, paddingBottom: 30 },
    label: {
      color: c.muted,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.3,
      marginTop: 4,
      marginBottom: 7,
    },
    group: {
      backgroundColor: c.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.line,
      overflow: "hidden",
      marginBottom: 16,
    },
    row: {
      minHeight: 54,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      borderBottomWidth: 1,
      borderColor: c.line,
    },
    last: { borderBottomWidth: 0 },
    name: { color: c.text, fontWeight: "600", flex: 1 },
    detail: { color: c.green, fontSize: 11, maxWidth: 150 },
    message: {
      color: c.muted,
      fontSize: 10,
      lineHeight: 15,
      marginTop: -10,
      marginBottom: 14,
      paddingHorizontal: 4,
    },
    logout: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.danger,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 5,
    },
    logoutText: { color: c.danger, fontWeight: "700" },
  });

