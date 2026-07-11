import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/state/Auth";

export function useEntitlements() {
  const { user } = useAuth();
  const [pro, setPro] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) {
      setPro(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.resolve(
      supabase
        .from("profiles")
        .select("subscription_tier,subscription_status,trial_ends_at")
        .eq("id", user.id)
        .maybeSingle(),
    )
      .then(({ data }) => {
        const trialActive = data?.trial_ends_at
          ? new Date(data.trial_ends_at).getTime() > Date.now()
          : false;
        setPro(
          data?.subscription_tier === "pro" &&
            (trialActive ||
              ["active", "trialing"].includes(data?.subscription_status || "")),
        );
      })
      .finally(() => setLoading(false));
  }, [user?.id]);
  return { pro, loading };
}
