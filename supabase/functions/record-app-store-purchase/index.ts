import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/client.ts";

const VALID_PRODUCTS = ["selah_pro_monthly", "selah_pro_yearly"];
const PRODUCTION_API = "https://api.storekit.itunes.apple.com";
const SANDBOX_API = "https://api.storekit-sandbox.itunes.apple.com";

function base64Url(input: ArrayBuffer | string) {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeBase64UrlJson<T>(value: string): T {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return JSON.parse(atob(padded));
}

function privateKeyDer(secret: string) {
  const clean = secret
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replaceAll(/\s/g, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1)
    bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

async function appStoreJwt() {
  const issuerId = Deno.env.get("APP_STORE_ISSUER_ID");
  const keyId = Deno.env.get("APP_STORE_KEY_ID");
  const bundleId = Deno.env.get("APP_STORE_BUNDLE_ID");
  const privateKey = Deno.env.get("APP_STORE_PRIVATE_KEY");
  if (!issuerId || !keyId || !bundleId || !privateKey)
    throw new Error("App Store verification secrets are not configured");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 900,
    aud: "appstoreconnect-v1",
    bid: bundleId,
  };
  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(payload),
  )}`;
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyDer(privateKey),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${base64Url(signature)}`;
}

async function getAppleTransaction(transactionId: string, preferSandbox: boolean) {
  const token = await appStoreJwt();
  const bases = preferSandbox
    ? [SANDBOX_API, PRODUCTION_API]
    : [PRODUCTION_API, SANDBOX_API];
  let lastStatus = 0;
  let lastBody = "";
  for (const base of bases) {
    const response = await fetch(
      `${base}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const body = await response.text();
    if (response.ok) {
      const json = JSON.parse(body);
      const signed = json.signedTransactionInfo as string | undefined;
      if (!signed) throw new Error("Apple response did not include transaction info");
      const payload = decodeBase64UrlJson<Record<string, unknown>>(
        signed.split(".")[1],
      );
      return { payload, response: json, environment: base === SANDBOX_API ? "Sandbox" : "Production" };
    }
    lastStatus = response.status;
    lastBody = body;
    if (![404, 400].includes(response.status)) break;
  }
  throw new Error(`Apple verification failed (${lastStatus}): ${lastBody}`);
}

function numberDate(value: unknown) {
  const num = typeof value === "string" ? Number(value) : Number(value || 0);
  return Number.isFinite(num) && num > 0 ? new Date(num).toISOString() : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  try {
    const { supabase, user } = await requireUser(req);
    const { purchase, productId } = await req.json();
    if (!purchase || !productId)
      return new Response(JSON.stringify({ error: "Missing purchase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (!VALID_PRODUCTS.includes(productId))
      return new Response(JSON.stringify({ error: "Unknown product ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const transactionId =
      purchase?.transactionId ||
      purchase?.id ||
      purchase?.purchaseToken ||
      purchase?.purchaseTokenAndroid;
    if (!transactionId)
      return new Response(JSON.stringify({ error: "Missing transaction ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const apple = await getAppleTransaction(
      String(transactionId),
      purchase?.environmentIOS === "Sandbox",
    );
    const bundleId = Deno.env.get("APP_STORE_BUNDLE_ID");
    if (apple.payload.bundleId !== bundleId)
      throw new Error("Apple transaction bundle ID does not match Selah");
    if (apple.payload.productId !== productId)
      throw new Error("Apple transaction product ID does not match selected plan");
    const expiresAt = numberDate(
      apple.payload.expiresDate || purchase?.expirationDateIOS,
    );
    const revoked = Boolean(apple.payload.revocationDate);
    const expired = expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;
    if (revoked || expired)
      throw new Error("Apple subscription is not currently active");

    await supabase.from("app_store_transactions").upsert({
      user_id: user.id,
      product_id: productId,
      transaction_id: String(transactionId),
      raw_purchase: { local: purchase, apple },
      verified: true,
      original_transaction_id:
        apple.payload.originalTransactionId || purchase?.originalTransactionIdentifierIOS || null,
      environment: apple.environment,
      expires_at: expiresAt,
    });

    const profileUpdate: Record<string, unknown> = {
      subscription_tier: "pro",
      subscription_status: "active",
      subscription_provider: "app_store",
      subscription_product_id: productId,
      subscription_cancel_at_period_end: false,
      trial_ends_at: null,
    };
    if (expiresAt) {
      profileUpdate.subscription_expires_at = expiresAt;
    }

    await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({ error: "Purchase could not be recorded" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
