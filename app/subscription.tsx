import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useIAP, type Purchase } from "expo-iap";
import { DetailScreen } from "@/components/DetailScreen";
import { supabase } from "@/lib/supabase";
import { AppColors } from "@/lib/theme";
import { useAuth } from "@/state/Auth";
import { useThemeColors } from "@/state/useThemeColors";

const PRODUCT_ID =
  process.env.EXPO_PUBLIC_SELAH_PRO_PRODUCT_ID || "selah_pro_monthly";

const features = [
  "Full Scripture search",
  "Cross-reference study panel",
  "Saved highlights library",
  "Garden Insights synthesis",
  "AI-guided reflection tied to your notes",
  "Knowledge Graph connections",
];

export default function Subscription() {
  const { user } = useAuth();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const [tier, setTier] = useState<"free" | "pro">("free");
  const [status, setStatus] = useState("Free");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const recordPurchase = async (purchase: Purchase) => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.functions.invoke(
      "record-app-store-purchase",
      { body: { purchase, productId: PRODUCT_ID } },
    );
    setBusy(false);
    if (error) {
      Alert.alert("Purchase received", error.message);
      return;
    }
    setTier("pro");
    setStatus("Pro active");
    Alert.alert("Selah Pro active", "Your Pro access is now active.");
  };

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    restorePurchases,
    hasActiveSubscriptions,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      await recordPurchase(purchase);
      await finishTransaction({ purchase, isConsumable: false });
    },
    onPurchaseError: (error) => setMessage(error.message),
    onError: (error) => setMessage(error.message),
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("subscription_tier,subscription_status,trial_ends_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setTier(data.subscription_tier || "free");
        const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
        const days = trialEnd
          ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
          : null;
        setStatus(
          data.subscription_tier === "pro"
            ? days
              ? `Pro trial · ${days} days`
              : data.subscription_status || "Pro active"
            : "Free",
        );
      });
  }, [user?.id]);

  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus: [PRODUCT_ID], type: "subs" }).catch(() => {});
  }, [connected, fetchProducts]);

  const product = subscriptions.find((item) => item.id === PRODUCT_ID);

  const buy = async () => {
    if (!user) {
      Alert.alert("Sign in required", "Create an account or sign in first.");
      return;
    }
    setMessage("");
    if (!product) {
      setMessage(
        "The App Store subscription product is not available yet. Confirm the product ID in App Store Connect.",
      );
      return;
    }
    await requestPurchase({
      type: "subs",
      request: {
        ios: { sku: PRODUCT_ID },
        apple: { sku: PRODUCT_ID },
        android: { skus: [PRODUCT_ID] },
        google: { skus: [PRODUCT_ID] },
      },
    });
  };

  const restore = async () => {
    setMessage("");
    setBusy(true);
    await restorePurchases();
    const active = await hasActiveSubscriptions([PRODUCT_ID]);
    setBusy(false);
    if (active) {
      setTier("pro");
      setStatus("Pro active");
      setMessage("Purchase restored. Pro access is active.");
    } else {
      setMessage("No active Selah Pro subscription was found for this Apple ID.");
    }
  };

  return (
    <DetailScreen title="Your Selah plan">
      <ScrollView contentContainerStyle={s.body}>
        <View style={s.card}>
          <Text style={s.eyebrow}>CURRENT PLAN</Text>
          <Text style={s.title}>{tier === "pro" ? "Selah Pro" : "Selah Free"}</Text>
          <Text style={s.status}>{status}</Text>
          {features.map((feature) => (
            <View key={feature} style={s.feature}>
              <Ionicons
                name={tier === "pro" ? "checkmark-circle" : "lock-closed-outline"}
                size={19}
                color={tier === "pro" ? c.green : c.gold}
              />
              <Text style={s.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={s.notice}>
          <Text style={s.noticeTitle}>App Store subscription</Text>
          <Text style={s.noticeText}>
            Product: {product?.displayName || product?.title || PRODUCT_ID}
          </Text>
          <Text style={s.price}>{product?.displayPrice || "Price unavailable"}</Text>
          {Platform.OS === "web" && (
            <Text style={s.noticeText}>
              Purchases must be tested on iOS through TestFlight or a development
              build.
            </Text>
          )}
          {!!message && <Text style={s.message}>{message}</Text>}
          <Pressable
            disabled={busy}
            onPress={buy}
            style={[s.button, busy && s.disabled]}
          >
            {busy ? (
              <ActivityIndicator color={c.onAccent} />
            ) : (
              <Text style={s.buttonText}>Start Selah Pro</Text>
            )}
          </Pressable>
          <Pressable onPress={restore} style={s.restore}>
            <Text style={s.restoreText}>Restore Purchases</Text>
          </Pressable>
        </View>
      </ScrollView>
    </DetailScreen>
  );
}

const styles = (c: AppColors) =>
  StyleSheet.create({
    body: { padding: 20, paddingBottom: 40 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.line,
      padding: 20,
    },
    eyebrow: {
      color: c.gold,
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.2,
    },
    title: { color: c.text, fontSize: 25, fontWeight: "800", marginTop: 8 },
    status: { color: c.muted, lineHeight: 19, marginTop: 6, marginBottom: 20 },
    feature: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 13,
    },
    featureText: { color: c.text, fontSize: 12, flex: 1 },
    notice: {
      backgroundColor: c.surfaceRaised,
      borderRadius: 15,
      padding: 17,
      marginTop: 15,
    },
    noticeTitle: { color: c.text, fontWeight: "800" },
    noticeText: { color: c.muted, fontSize: 11, lineHeight: 18, marginTop: 6 },
    price: { color: c.text, fontSize: 20, fontWeight: "900", marginTop: 10 },
    message: { color: c.muted, fontSize: 11, lineHeight: 17, marginTop: 10 },
    button: {
      height: 50,
      borderRadius: 14,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 14,
    },
    disabled: { opacity: 0.55 },
    buttonText: { color: c.onAccent, fontWeight: "900" },
    restore: { minHeight: 44, alignItems: "center", justifyContent: "center" },
    restoreText: { color: c.green, fontWeight: "800" },
  });
