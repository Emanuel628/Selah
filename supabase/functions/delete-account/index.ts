import { corsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/client.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  try {
    const { supabase, user } = await requireUser(req);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_tier,subscription_status,trial_ends_at")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    const activePaid =
      profile?.subscription_tier === "pro" &&
      ["active", "trialing"].includes(profile?.subscription_status || "active");
    if (activePaid) {
      return Response.json(
        {
          error: "Cancel your Pro subscription before deleting this account.",
          code: "active_subscription",
        },
        { status: 409, headers: corsHeaders },
      );
    }
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: corsHeaders },
    );
  }
});
