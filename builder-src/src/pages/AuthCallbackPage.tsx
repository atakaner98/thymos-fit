import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../auth/useSession";

/**
 * Lands on https://thymos.fit/builder/auth/ after the user clicks the magic
 * link. The Supabase client (detectSessionInUrl) consumes the tokens from the
 * URL fragment; this page just waits for the session to materialize.
 *
 * NOTE: this is deliberately a different path from /auth/callback/ (the
 * mobile deep-link bridge), which must keep working unchanged.
 */
export default function AuthCallbackPage() {
  const { session, hasAccountSession } = useSession();
  const [timedOut, setTimedOut] = useState(false);

  const urlError = new URLSearchParams(
    window.location.hash.replace(/^#/, "?"),
  ).get("error_description");

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  if (hasAccountSession) {
    return <Navigate to="/" replace />;
  }

  if (urlError || (timedOut && !session)) {
    return (
      <main className="page page--narrow">
        <div className="card">
          <h1>Sign-in failed</h1>
          <div className="error-banner">
            {urlError ??
              "The sign-in link did not produce a session. Links are single-use and expire — request a new one."}
          </div>
          <a className="button" href="/builder/">
            Back to sign-in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="page page--narrow">
      <div className="card" role="status" aria-live="polite">
        <h1>Signing you in…</h1>
        <div className="spinner" aria-hidden="true" />
        <p className="muted" style={{ textAlign: "center" }}>
          Completing authentication.
        </p>
      </div>
    </main>
  );
}
