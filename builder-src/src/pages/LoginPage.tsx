import { useState, type FormEvent } from "react";
import { getSupabase } from "../auth/supabaseClient";
import { authCallbackUrl } from "../config";
import { t } from "../i18n/locale";
import HowItWorks from "../components/HowItWorks";

type SendState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

function friendlyAuthError(raw: string): string {
  const message = raw.toLowerCase();
  if (
    message.includes("signups not allowed") ||
    message.includes("otp_disabled")
  ) {
    return t("errNoAccount");
  }
  if (message.includes("rate limit") || message.includes("after")) {
    return t("errRateLimit");
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
    <main className="landing">
      <header className="hero">
        <div className="hero__brand">
          <img
            className="hero__mark"
            src={asset("thymos-mark.webp")}
            alt={t("brandMarkAlt")}
            width={56}
            height={56}
          />
          <span className="hero__wordmark">
            THYMOS <span>{t("loginTitle")}</span>
          </span>
        </div>

        <h1 className="hero__headline">
          <span>{t("heroBuild")}</span>{" "}
          <span className="hero__accent">{t("heroSync")}</span>{" "}
          <span>{t("heroTrain")}</span>
        </h1>
        <p className="hero__sub">{t("heroSub")}</p>

        <div className="hero__login card">
          <p className="muted hero__intro">{t("loginIntro")}</p>

          {state.kind === "sent" ? (
            <div>
              <div className="ok-banner">
                {t("magicSentTo", { email: state.email })}
              </div>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setState({ kind: "idle" })}
              >
                {t("useDifferentEmail")}
              </button>
            </div>
          ) : (
            <form onSubmit={(event) => void sendLink(event)}>
              <label className="field-label" htmlFor="login-email">
                {t("emailLabel")}
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={{ width: "100%" }}
                placeholder={t("emailPlaceholder")}
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
                {state.kind === "sending" ? t("sending") : t("sendMagicLink")}
              </button>
            </form>
          )}
        </div>

        <a className="hero__cue" href="#how">
          {t("howCue")}
          <span aria-hidden="true">↓</span>
        </a>
      </header>

      <HowItWorks />
    </main>
  );
}
