import { useCallback, useRef, useState, type FormEvent } from "react";
import { getSupabase } from "../auth/supabaseClient";
import { authCallbackUrl } from "../config";
import { t } from "../i18n/locale";
import HowItWorks from "../components/HowItWorks";
import { prefersReducedMotion, useScrollFx } from "../components/motion";

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
  const progressRef = useRef<HTMLDivElement>(null);

  // Reading-progress rail across the top of the page.
  const onFrame = useCallback(() => {
    const bar = progressRef.current;
    if (!bar) return;
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    bar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
  }, []);
  useScrollFx(onFrame);

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
    <main className={prefersReducedMotion() ? "landing" : "landing landing--motion"}>
      <div className="progress" aria-hidden="true">
        <div className="progress__fill" ref={progressRef} />
      </div>

      <header className="hero">
        <div className="hero__grid" aria-hidden="true" />
        <div className="hero__brand">
          <img
            className="hero__mark"
            src={asset("thymos-mark.webp")}
            alt={t("brandMarkAlt")}
            width={104}
            height={104}
          />
          <span className="hero__wordmark">
            THYMOS <span>{t("loginTitle")}</span>
          </span>
        </div>

        {/* Each word rides up out of its own clipped box, one after another. */}
        <h1 className="hero__headline">
          <span className="word">
            <span>{t("heroBuild")}</span>
          </span>{" "}
          <span className="word word--accent">
            <span>{t("heroSync")}</span>
          </span>{" "}
          <span className="word">
            <span>{t("heroTrain")}</span>
          </span>
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

        {/* The only thing under the form: a pure affordance to keep scrolling.
            The words "See how it works" belong to the section itself. */}
        <a className="hero__cue" href="#how" aria-label={t("scrollDown")}>
          <span aria-hidden="true">↓</span>
        </a>
      </header>

      <HowItWorks />
    </main>
  );
}
