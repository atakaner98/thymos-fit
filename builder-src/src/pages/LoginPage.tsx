import { useState, type FormEvent } from "react";
import { getSupabase } from "../auth/supabaseClient";
import { authCallbackUrl } from "../config";

type SendState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

function friendlyAuthError(raw: string): string {
  const message = raw.toLowerCase();
  if (message.includes("signups not allowed") || message.includes("otp_disabled")) {
    return "No THYMOS account was found for this email. The web builder is available for Pro users — first enable Cloud Sync in the THYMOS app (Settings → Sync) with this email, then try again.";
  }
  if (message.includes("rate limit") || message.includes("after")) {
    return "Too many attempts — please wait a minute before requesting another link.";
  }
  return raw;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SendState>({ kind: "idle" });

  async function sendLink(event: FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setState({ kind: "sending" });
    const { error } = await getSupabase().auth.signInWithOtp({
      email: trimmed,
      options: {
        // The builder never creates accounts. Accounts come from the mobile
        // app's Pro cloud-sync setup — that is the (implicit) Pro gate.
        shouldCreateUser: false,
        emailRedirectTo: authCallbackUrl(),
      },
    });
    if (error) {
      setState({ kind: "error", message: friendlyAuthError(error.message) });
      return;
    }
    setState({ kind: "sent", email: trimmed });
  }

  return (
    <main className="page page--narrow">
      <div className="card">
        <h1>
          THYMOS <span style={{ color: "var(--accent)" }}>Routine Builder</span>
        </h1>
        <p className="muted">
          Build workout templates with a keyboard and mouse, then push them to
          your phone. Sign in with the same email you use for Cloud Sync in the
          THYMOS app (Pro).
        </p>

        {state.kind === "sent" ? (
          <div>
            <div className="ok-banner">
              Magic link sent to <strong>{state.email}</strong>. Open it on
              this computer to continue.
            </div>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setState({ kind: "idle" })}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={(event) => void sendLink(event)}>
            <label className="field-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{ width: "100%" }}
              placeholder="you@example.com"
            />
            {state.kind === "error" && (
              <div className="error-banner">{state.message}</div>
            )}
            <button
              type="submit"
              className="button"
              disabled={state.kind === "sending"}
              style={{ marginTop: 14, width: "100%" }}
            >
              {state.kind === "sending" ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
