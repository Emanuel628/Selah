import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

type Result = { error: string | null; needsEmailVerification?: boolean };
type AuthValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (name: string, email: string, password: string) => Promise<Result>;
  signOut: () => Promise<Result>;
  sendPasswordReset: (email: string) => Promise<Result>;
  updatePassword: (password: string) => Promise<Result>;
  resendVerification: (email: string) => Promise<Result>;
};
const Context = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch((error) => console.warn("Could not restore auth session", error))
      .finally(() => setLoading(false));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const handle = async (url: string) => {
      const parsed = Linking.parse(url);
      const code =
        typeof parsed.queryParams?.code === "string"
          ? parsed.queryParams.code
          : null;
      if (code) await supabase.auth.exchangeCodeForSession(code);
    };
    Linking.getInitialURL()
      .then((url) => {
        if (url) void handle(url);
      })
      .catch((error) => console.warn("Could not read initial link", error));
    const listener = Linking.addEventListener("url", (event) =>
      handle(event.url),
    );
    return () => listener.remove();
  }, []);
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: error?.message || null };
  }, []);
  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const redirectTo = Linking.createURL("/bible-version", {
        queryParams: { onboarding: "1" },
      });
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: redirectTo,
        },
      });
      if (!error) await AsyncStorage.setItem("selah.pending_onboarding", "1");
      return {
        error: error?.message || null,
        needsEmailVerification: !error && !data.session,
      };
    },
    [],
  );
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error: error?.message || null };
  }, []);
  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Linking.createURL("/update-password"),
    });
    return { error: error?.message || null };
  }, []);
  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message || null };
  }, []);
  const resendVerification = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: {
        emailRedirectTo: Linking.createURL("/bible-version", {
          queryParams: { onboarding: "1" },
        }),
      },
    });
    return { error: error?.message || null };
  }, []);
  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      loading,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      resendVerification,
    }),
    [
      session,
      loading,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      resendVerification,
    ],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing AuthProvider");
  return value;
}
