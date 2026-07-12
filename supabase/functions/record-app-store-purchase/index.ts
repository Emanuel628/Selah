import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/client.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  try {
    const { supabase, user } = await requireUser(req);
    const { purchase, productId, restore } = await req.json();
    if ((!purchase && !restore) || !productId)
      return new Response(JSON.stringify({ error: "Missing purchase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (!["selah_pro_monthly", "selah_pro_yearly"].includes(productId))
      return new Response(JSON.stringify({ error: "Unknown product ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const transactionId =
      purchase?.transactionId ||
      purchase?.id ||
      purchase?.purchaseToken ||
      purchase?.purchaseTokenAndroid;
    if (!restore && !transactionId)
      return new Response(JSON.stringify({ error: "Missing transaction ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    if (transactionId) {
      await supabase.from("app_store_transactions").upsert({
        user_id: user.id,
        product_id: productId,
        transaction_id: String(transactionId),
        raw_purchase: purchase,
        verified: false,
      });
    }

    await supabase
      .from("profiles")
      .update({
        subscription_tier: "pro",
        subscription_status: "active",
        subscription_provider: "app_store",
        subscription_product_id: productId,
        subscription_cancel_at_period_end: false,
        trial_ends_at: null,
      })
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
