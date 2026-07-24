import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabaseClient";

export type SessionState = {
  /** undefined = still resolving initial session */
  session: Session | null | undefined;
  /** true only for a signed-in, non-anonymous account (sync requirement) */
  hasAccountSession: boolean;
};

export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getSupabase();
    let disposed = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!disposed) setSession(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!disposed) setSession(nextSession);
      },
    );

    return () => {
      disposed = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user;
  const hasAccountSession = Boolean(session && user && !user.is_anonymous);
  return { session, hasAccountSession };
}

export function sessionEmail(state: SessionState): string | null {
  return state.session?.user?.email ?? null;
}
