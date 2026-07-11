import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.2";

export function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) throw new Error("Supabase admin env missing");
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireUser(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) throw new Response("Missing authorization", { status: 401 });
  const supabase = adminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user)
    throw new Response("Invalid authorization", { status: 401 });
  return { supabase, user: data.user };
}

export async function sendConfirmationEmail(to: string, subject: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("ACCOUNT_EMAIL_FROM");
  if (!apiKey || !from) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text:
        "This confirms the requested account or subscription change in Selah.",
    }),
  });
  return response.ok;
}
