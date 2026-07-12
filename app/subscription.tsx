import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  getActiveSubscriptions as getNativeActiveSubscriptions,
  useIAP,
  type ActiveSubscription,
  type ProductSubscription,
  type Purchase,
} from "expo-iap";
import { DetailScreen } from "@/components/DetailScreen";
import {
  SELAH_PRO_MONTHLY_PRODUCT_ID,
  SELAH_PRO_PRODUCT_IDS,
  SELAH_PRO_YEARLY_PRODUCT_ID,
  SUBSCRIPTION_FALLBACKS,
} from "@/lib/subscriptions";
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from "@/lib/legal";
import { supabase } from "@/lib/supabase";
import { AppColors } from "@/lib/theme";
import { useAuth } from "@/state/Auth";
import { useThemeColors } from "@/state/useThemeColors";

const features = [
  "Full Scripture search",
  "Cross-reference study panel",
  "Saved highlights library",
  "Garden Insights synthesis",
  "AI-guided reflection tied to your notes",
  "Knowledge Graph connections",
];

type PlanId = typeof SELAH_PRO_MONTHLY_PRODUCT_ID | typeof SELAH_PRO_YEARLY_PRODUCT_ID;

function planFallback(productId: string) {
  return (
    SUBSCRIPTION_FALLBACKS[productId] || {
      title: productId,
      price: "Price unavailable",
      cadence: "",
      cta: "Start Selah Pro",
    }
  );
}

async function functionErrorMessage(error: unknown) {
  const context = (error as any)?.context;
  if (context?.json) {
    try {
      const body = await context.json();
      if (body?.error) return body.error;
    } catch {}
  }
  return (error as Error)?.message || "Something went wrong.";
}

export default function Subscription() {
  const { user } = useAuth();
  const c = useThemeColors();
  const s = useMemo(() => styles(c), [c]);
  const pendingProductId = useRef<string>(SELAH_PRO_MONTHLY_PRODUCT_ID);
  const [tier, setTier] = useState<"free" | "pro">("free");
  const [status, setStatus] = useState("Free");
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<PlanId>(
    SELAH_PRO_YEARLY_PRODUCT_ID,
  );
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const recordPurchase = async (purchase: Purchase, productId: string) => {
    if (!user) return;
    setBusyProductId(productId);
    const { error } = await supabase.functions.invoke(
      "record-app-store-purchase",
      { body: { purchase, productId } },
    );
    setBusyProductId(null);
    if (error) {
      const message = await functionErrorMessage(error);
      Alert.alert("Purchase received but not activated", message);
      setMessage(message);
      return;
    }
    setTier("pro");
    setActiveProductId(productId);
    setStatus(`Pro active · ${planFallback(productId).title}`);
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
      const productId = pendingProductId.current;
      await recordPurchase(purchase, productId);
      await finishTransaction({ purchase, isConsumable: false });
    },
    onPurchaseError: (error) => {
      setBusyProductId(null);
      setMessage(error.message);
    },
    onError: (error) => {
      setBusyProductId(null);
      setMessage(error.message);
    },
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select(
        "subscription_tier,subscription_status,trial_ends_at,subscription_product_id,subscription_expires_at",
      )
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setTier(data.subscription_tier || "free");
        setActiveProductId(data.subscription_product_id || null);
        const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
        const days = trialEnd
          ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
          : null;
        const activePlan = data.subscription_product_id
          ? planFallback(data.subscription_product_id).title
          : "Selah Pro";
        const expiresAt = data.subscription_expires_at
          ? new Date(data.subscription_expires_at)
          : null;
        setStatus(
          data.subscription_tier === "pro"
            ? days
              ? `Pro trial · ${days} days`
              : expiresAt
                ? `${activePlan} · renews ${expiresAt.toLocaleDateString()}`
                : `${data.subscription_status || "active"} · ${activePlan}`
            : "Free",
        );
      });
  }, [user?.id]);

  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus: SELAH_PRO_PRODUCT_IDS, type: "subs" }).catch(() => {});
  }, [connected, fetchProducts]);

  const productsById = useMemo(() => {
    const map: Record<string, ProductSubscription | undefined> = {};
    subscriptions.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [subscriptions]);

  const buy = async (productId: string) => {
    if (!user) {
      Alert.alert("Sign in required", "Create an account or sign in first.");
      return;
    }
    setSelectedProductId(productId as PlanId);
    setMessage("");
    const product = productsById[productId];
    if (!product && Platform.OS !== "web") {
      setMessage(
        `${planFallback(productId).title} is not available yet. Confirm the Product ID in App Store Connect.`,
      );
      return;
    }
    pendingProductId.current = productId;
    setBusyProductId(productId);
    try {
      await requestPurchase({
        type: "subs",
        request: {
          ios: { sku: productId },
          apple: { sku: productId },
          android: { skus: [productId] },
          google: { skus: [productId] },
        },
      });
    } catch (caught) {
      setBusyProductId(null);
      setMessage(
        caught instanceof Error
          ? caught.message
          : "The App Store purchase sheet could not be opened.",
      );
    }
  };

  const restore = async () => {
    if (!user) {
      Alert.alert("Sign in required", "Create an account or sign in first.");
      return;
    }
    setMessage("");
    setBusyProductId("restore");
    await restorePurchases();
    const activeSubscriptions = await getNativeActiveSubscriptions(
      SELAH_PRO_PRODUCT_IDS,
    );
    let restoredProductId: string | null = null;
    let restoredPurchase: ActiveSubscription | null = null;
    for (const productId of SELAH_PRO_PRODUCT_IDS) {
      const active = activeSubscriptions.find(
        (subscription) => subscription.productId === productId,
      );
      if (active || (await hasActiveSubscriptions([productId]))) {
        restoredProductId = productId;
        restoredPurchase = active || null;
        break;
      }
    }
    if (restoredProductId && restoredPurchase) {
      const { error } = await supabase.functions.invoke(
        "record-app-store-purchase",
        { body: { purchase: restoredPurchase, productId: restoredProductId } },
      );
      setBusyProductId(null);
      if (error) {
        setMessage(await functionErrorMessage(error));
        return;
      }
      setTier("pro");
      setActiveProductId(restoredProductId);
      setStatus(`Pro active · ${planFallback(restoredProductId).title}`);
      setMessage("Purchase restored. Pro access is active.");
    } else if (restoredProductId) {
      setBusyProductId(null);
      setMessage(
        "An active subscription was found, but StoreKit did not return a transaction ID. Try Restore Purchases again from TestFlight.",
      );
    } else {
      setBusyProductId(null);
      setMessage("No active Selah Pro subscription was found for this Apple ID.");
    }
  };
  return (
    <DetailScreen title="Your Selah plan">
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
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
          <Text style={s.noticeTitle}>Choose a Selah Pro plan</Text>
          <Text style={s.noticeText}>
            Both plans unlock the same Pro features. Yearly saves compared with
            paying monthly for a full year.
          </Text>
          <PlanOption
            c={c}
            s={s}
            productId={SELAH_PRO_MONTHLY_PRODUCT_ID}
            selected={selectedProductId === SELAH_PRO_MONTHLY_PRODUCT_ID}
            active={activeProductId === SELAH_PRO_MONTHLY_PRODUCT_ID}
            product={productsById[SELAH_PRO_MONTHLY_PRODUCT_ID]}
            busy={busyProductId === SELAH_PRO_MONTHLY_PRODUCT_ID}
            onSelect={() => setSelectedProductId(SELAH_PRO_MONTHLY_PRODUCT_ID)}
            onBuy={() => buy(SELAH_PRO_MONTHLY_PRODUCT_ID)}
          />
          <PlanOption
            c={c}
            s={s}
            productId={SELAH_PRO_YEARLY_PRODUCT_ID}
            selected={selectedProductId === SELAH_PRO_YEARLY_PRODUCT_ID}
            active={activeProductId === SELAH_PRO_YEARLY_PRODUCT_ID}
            product={productsById[SELAH_PRO_YEARLY_PRODUCT_ID]}
            busy={busyProductId === SELAH_PRO_YEARLY_PRODUCT_ID}
            recommended
            onSelect={() => setSelectedProductId(SELAH_PRO_YEARLY_PRODUCT_ID)}
            onBuy={() => buy(SELAH_PRO_YEARLY_PRODUCT_ID)}
          />
          {Platform.OS === "web" && (
            <Text style={s.noticeText}>
              Purchases must be tested on iOS through TestFlight or a development
              build.
            </Text>
          )}
          {!!message && <Text style={s.message}>{message}</Text>}
          <Text style={s.disclosure}>
            Payment will be charged to your Apple ID at confirmation of
            purchase. Subscriptions automatically renew unless cancelled at
            least 24 hours before the end of the current period. Your account
            may be charged for renewal within 24 hours before the period ends.
            Manage or cancel subscriptions in your Apple account settings.
          </Text>
          <View style={s.legalLinks}>
            <Text
              onPress={() => Linking.openURL(TERMS_OF_USE_URL)}
              style={s.legalLink}
            >
              Terms of Use
            </Text>
            <Text style={s.legalDivider}>•</Text>
            <Text
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
              style={s.legalLink}
            >
              Privacy Policy
            </Text>
          </View>
          <Pressable
            disabled={!!busyProductId}
            onPress={restore}
            style={s.restore}
          >
            {busyProductId === "restore" ? (
              <ActivityIndicator color={c.green} />
            ) : (
              <Text style={s.restoreText}>Restore Purchases</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </DetailScreen>
  );
}

function PlanOption({
  c,
  s,
  productId,
  product,
  selected,
  active,
  recommended,
  busy,
  onSelect,
  onBuy,
}: {
  c: AppColors;
  s: ReturnType<typeof styles>;
  productId: string;
  product?: ProductSubscription;
  selected: boolean;
  active: boolean;
  recommended?: boolean;
  busy: boolean;
  onSelect: () => void;
  onBuy: () => void;
}) {
  const fallback = planFallback(productId);
  const price = product?.displayPrice || fallback.price;
  const title = product?.displayName || product?.title || fallback.title;
  const renewal =
    productId === SELAH_PRO_YEARLY_PRODUCT_ID
      ? "Renews yearly at $14.99/year after any free trial unless cancelled."
      : "Renews monthly at $1.99/month after any free trial unless cancelled.";
  return (
    <Pressable
      accessibilityLabel={`${fallback.title} subscription plan`}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onSelect}
      style={[s.plan, selected && s.planSelected]}
    >
      <View style={s.planHeader}>
        <View style={s.planCopy}>
          <View style={s.planTitleRow}>
            <Text style={s.planTitle}>{title}</Text>
            {recommended && (
              <Text style={s.badge}>BEST VALUE</Text>
            )}
            {active && <Text style={s.activeBadge}>ACTIVE</Text>}
          </View>
          <Text style={s.price}>{price}</Text>
          <Text style={s.noticeText}>
            Includes a 30-day free trial for new subscribers. {fallback.cadence}
          </Text>
          <Text style={s.planDisclosure}>{renewal}</Text>
        </View>
        <Ionicons
          name={selected ? "radio-button-on" : "radio-button-off"}
          size={22}
          color={selected ? c.green : c.muted}
        />
      </View>
      <Pressable
        disabled={busy}
        onPress={onBuy}
        style={[s.button, busy && s.disabled]}
      >
        {busy ? (
          <ActivityIndicator color={c.onAccent} />
        ) : (
          <Text style={s.buttonText}>{fallback.cta}</Text>
        )}
      </Pressable>
    </Pressable>
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
      padding: 15,
      marginTop: 15,
    },
    noticeTitle: { color: c.text, fontWeight: "800", fontSize: 16 },
    noticeText: { color: c.muted, fontSize: 11, lineHeight: 18, marginTop: 6 },
    plan: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 15,
      padding: 14,
      marginTop: 12,
      gap: 12,
    },
    planSelected: { borderColor: c.green, borderWidth: 2 },
    planHeader: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    planCopy: { flex: 1 },
    planTitleRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 6,
    },
    planTitle: { color: c.text, fontWeight: "900", fontSize: 14 },
    badge: {
      color: c.onAccent,
      backgroundColor: c.gold,
      overflow: "hidden",
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
      fontSize: 8,
      fontWeight: "900",
    },
    activeBadge: {
      color: c.onAccent,
      backgroundColor: c.green,
      overflow: "hidden",
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 3,
      fontSize: 8,
      fontWeight: "900",
    },
    price: { color: c.text, fontSize: 24, fontWeight: "900", marginTop: 8 },
    message: { color: c.muted, fontSize: 11, lineHeight: 17, marginTop: 10 },
    disclosure: {
      color: c.muted,
      fontSize: 10,
      lineHeight: 16,
      marginTop: 12,
    },
    legalLinks: {
      minHeight: 34,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 4,
    },
    legalLink: { color: c.green, fontSize: 11, fontWeight: "800" },
    legalDivider: { color: c.muted, fontSize: 11 },
    planDisclosure: {
      color: c.muted,
      fontSize: 10,
      lineHeight: 15,
      marginTop: 5,
    },
    button: {
      height: 48,
      borderRadius: 13,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    disabled: { opacity: 0.55 },
    buttonText: { color: c.onAccent, fontWeight: "900" },
    restore: { minHeight: 48, alignItems: "center", justifyContent: "center" },
    restoreText: { color: c.green, fontWeight: "800" },
  });

