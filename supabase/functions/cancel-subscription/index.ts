import { corsHeaders } from "../_shared/cors.ts";
import { requireUser, sendConfirmationEmail } from "../_shared/client.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  try {
    const { supabase, user } = await requireUser(req);
    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_tier: "free",
        subscription_status: "canceled",
        subscription_cancel_at_period_end: true,
        subscription_product_id: null,
        trial_ends_at: null,
      })
      .eq("id", user.id);
    if (error) throw error;
    if (user.email)
      await sendConfirmationEmail(user.email, "Your Selah subscription was cancelled");
    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: corsHeaders },
    );
  }
});
