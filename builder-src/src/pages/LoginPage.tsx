import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getSupabase } from "../auth/supabaseClient";
import { authCallbackUrl } from "../config";
import { t } from "../i18n/locale";
import type { MessageKey } from "../i18n/messages";

type SendState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

/**
 * Three showcase treatments were built so the look can be chosen from the
 * live page rather than from a mockup. Pick with `?showcase=collage` /
 * `?showcase=backdrop`; the switcher UI itself only renders in dev or with
 * `?preview=1`, so production ships a single quiet default.
 */
export type ShowcaseVariant = "carousel" | "collage" | "backdrop";

const SHOWCASE_VARIANTS: readonly ShowcaseVariant[] = [
  "carousel",
  "collage",
  "backdrop",
];

export function resolveShowcaseVariant(search: string): ShowcaseVariant {
  const raw = new URLSearchParams(search).get("showcase")?.toLowerCase();
  return SHOWCASE_VARIANTS.find((variant) => variant === raw) ?? "carousel";
}

/** Public assets live in builder-src/public/, served under the Vite base. */
function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

type Frame = {
  readonly file: string;
  readonly title: MessageKey;
  readonly body: MessageKey;
};

const FRAMES: readonly Frame[] = [
  {
    file: "showcase/templates.webp",
    title: "showTemplatesTitle",
    body: "showTemplatesBody",
  },
  { file: "showcase/sets.webp", title: "showSetsTitle", body: "showSetsBody" },
  {
    file: "showcase/program.webp",
    title: "showProgramTitle",
    body: "showProgramBody",
  },
  {
    file: "showcase/catalog.webp",
    title: "showCatalogTitle",
    body: "showCatalogBody",
  },
];

const ROTATE_MS = 5200;

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** BUILD → PUSH → TRAIN — the one-line story of what this tool is for. */
function StepStrip() {
  const steps: MessageKey[] = ["stepBuild", "stepPush", "stepTrain"];
  return (
    <p className="steps">
      {steps.map((step, index) => (
        <span key={step} className="steps__item">
          {index > 0 && (
            <span className="steps__arrow" aria-hidden="true">
              →
            </span>
          )}
          <span>{t(step)}</span>
        </span>
      ))}
    </p>
  );
}

/** Chrome that reads as "this is the app in a browser", not a raw PNG. */
function BrowserFrame({
  src,
  alt,
  animationKey,
}: {
  src: string;
  alt: string;
  animationKey?: string | number;
}) {
  return (
    <div className="frame">
      <div className="frame__bar" aria-hidden="true">
        <span className="frame__light" />
        <span className="frame__light" />
        <span className="frame__light" />
        <span className="frame__url">thymos.fit/builder</span>
      </div>
      <div className="frame__stage">
        <img key={animationKey} className="frame__img" src={src} alt={alt} />
      </div>
    </div>
  );
}

function CarouselShowcase() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const still = useMemo(prefersReducedMotion, []);

  useEffect(() => {
    if (still || paused) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % FRAMES.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(timer);
  }, [still, paused]);

  const frame = FRAMES[index];
  return (
    <div
      className="showcase showcase--carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <BrowserFrame
        src={asset(frame.file)}
        alt={t(frame.title)}
        animationKey={index}
      />
      <div className="showcase__caption">
        <h2>{t(frame.title)}</h2>
        <p className="muted">{t(frame.body)}</p>
      </div>
      <div className="showcase__dots">
        {FRAMES.map((item, dotIndex) => (
          <button
            key={item.file}
            type="button"
            className={
              dotIndex === index ? "showcase__dot showcase__dot--on" : "showcase__dot"
            }
            aria-label={t("showcaseDotAria", { n: dotIndex + 1 })}
            aria-current={dotIndex === index}
            onClick={() => setIndex(dotIndex)}
          />
        ))}
      </div>
      <StepStrip />
    </div>
  );
}

function CollageShowcase() {
  return (
    <div className="showcase showcase--collage">
      <div className="collage">
        <div className="collage__back">
          <BrowserFrame src={asset("showcase/sets.webp")} alt={t("showSetsTitle")} />
        </div>
        <img
          className="collage__front"
          src={asset("showcase/devices.webp")}
          alt={t("showDevicesTitle")}
        />
      </div>
      <div className="showcase__caption">
        <h2>{t("showDevicesTitle")}</h2>
        <p className="muted">{t("showDevicesBody")}</p>
      </div>
      <StepStrip />
    </div>
  );
}

function BrandLockup() {
  return (
    <div className="brand-lockup">
      <img
        className="brand-lockup__mark"
        src={asset("thymos-mark.webp")}
        alt={t("brandMarkAlt")}
        width={52}
        height={52}
      />
      <span className="brand-lockup__text">
        <span className="brand-lockup__name">THYMOS</span>
        <span className="brand-lockup__sub">{t("loginTitle")}</span>
      </span>
    </div>
  );
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
  const search = window.location.search;
  const variant = resolveShowcaseVariant(search);
  const showSwitcher =
    import.meta.env.DEV || new URLSearchParams(search).get("preview") === "1";

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
    <main className={`login login--${variant}`}>
      {variant === "backdrop" && (
        <div
          className="login__backdrop"
          style={{ backgroundImage: `url(${asset("showcase/backdrop.webp")})` }}
          aria-hidden="true"
        />
      )}

      <section className="login__panel card">
        <BrandLockup />
        <h1 className="login__headline">{t("loginHeadline")}</h1>
        <p className="muted login__intro">{t("loginIntro")}</p>

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

        {variant === "backdrop" && <StepStrip />}
      </section>

      {variant !== "backdrop" && (
        <aside className="login__aside" aria-label={t("showcaseRegionAria")}>
          {variant === "carousel" ? <CarouselShowcase /> : <CollageShowcase />}
        </aside>
      )}

      {showSwitcher && (
        <nav className="variant-switch" aria-label="Showcase variant">
          {SHOWCASE_VARIANTS.map((option) => (
            <a
              key={option}
              href={`?showcase=${option}${showSwitcher ? "&preview=1" : ""}`}
              className={
                option === variant ? "variant-switch__on" : undefined
              }
            >
              {option}
            </a>
          ))}
        </nav>
      )}
    </main>
  );
}
