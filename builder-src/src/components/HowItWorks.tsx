import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { t } from "../i18n/locale";
import type { MessageKey } from "../i18n/messages";

type Shot = {
  readonly id: string;
  readonly title: MessageKey;
  readonly body: MessageKey;
};

/** Narrative order: what you build → how you schedule it → how it reaches the phone. */
export const SHOTS: readonly Shot[] = [
  { id: "workspace", title: "shotWorkspaceTitle", body: "shotWorkspaceBody" },
  { id: "catalog", title: "shotCatalogTitle", body: "shotCatalogBody" },
  { id: "sets", title: "shotSetsTitle", body: "shotSetsBody" },
  { id: "schedule", title: "shotScheduleTitle", body: "shotScheduleBody" },
  { id: "push", title: "shotPushTitle", body: "shotPushBody" },
  { id: "block", title: "shotBlockTitle", body: "shotBlockBody" },
  { id: "devices", title: "shotDevicesTitle", body: "shotDevicesBody" },
];

function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

type View = { scale: number; x: number; y: number };
const RESET: View = { scale: 1, x: 0, y: 0 };

/**
 * Full-screen inspector. Wheel zooms toward the cursor, drag pans, two
 * fingers pinch, arrows move between shots. The wheel listener is attached
 * imperatively because React's synthetic wheel handler is passive and cannot
 * preventDefault — without that the page scrolls behind the overlay.
 */
function Lightbox({
  index,
  onIndex,
  onClose,
}: {
  index: number;
  onIndex: (next: number) => void;
  onClose: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(RESET);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistance = useRef(0);
  const dragged = useRef(false);
  const shot = SHOTS[index];

  // Each shot opens at fit-to-screen.
  useLayoutEffect(() => setView(RESET), [index]);

  const zoomAt = useCallback((factor: number, originX = 0, originY = 0) => {
    setView((current) => {
      const scale = clamp(current.scale * factor, MIN_SCALE, MAX_SCALE);
      if (scale === current.scale) return current;
      if (scale === MIN_SCALE) return RESET;
      const ratio = scale / current.scale;
      return {
        scale,
        x: originX - (originX - current.x) * ratio,
        y: originY - (originY - current.y) * ratio,
      };
    });
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const rect = (stage as HTMLDivElement).getBoundingClientRect();
      zoomAt(
        Math.exp(-event.deltaY * 0.0016),
        event.clientX - rect.left - rect.width / 2,
        event.clientY - rect.top - rect.height / 2,
      );
    }
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight")
        onIndex((index + 1) % SHOTS.length);
      else if (event.key === "ArrowLeft")
        onIndex((index - 1 + SHOTS.length) % SHOTS.length);
      else if (event.key === "+" || event.key === "=") zoomAt(1.4);
      else if (event.key === "-") zoomAt(1 / 1.4);
      else if (event.key === "0") setView(RESET);
    }
    window.addEventListener("keydown", onKey);
    // The page behind must not scroll while the overlay owns the viewport.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [index, onClose, onIndex, zoomAt]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    dragged.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    const points = [...pointers.current.values()];

    if (points.length >= 2) {
      const distance = Math.hypot(
        points[0].x - points[1].x,
        points[0].y - points[1].y,
      );
      if (pinchDistance.current > 0 && distance > 0) {
        zoomAt(distance / pinchDistance.current);
      }
      pinchDistance.current = distance;
      dragged.current = true;
      return;
    }

    if (view.scale <= MIN_SCALE) return;
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) dragged.current = true;
    setView((current) => ({
      ...current,
      x: current.x + dx,
      y: current.y + dy,
    }));
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchDistance.current = 0;
  }

  const zoomed = view.scale > MIN_SCALE;
  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={t(shot.title)}
    >
      <div className="lightbox__bar">
        <p className="lightbox__counter">
          {t("lbCounter", { n: index + 1, total: SHOTS.length })}
        </p>
        <div className="lightbox__tools">
          <button
            type="button"
            className="button button--ghost button--icon"
            aria-label={t("lbZoomOut")}
            onClick={() => zoomAt(1 / 1.4)}
          >
            −
          </button>
          <button
            type="button"
            className="button button--ghost lightbox__scale"
            aria-label={t("lbReset")}
            onClick={() => setView(RESET)}
          >
            {Math.round(view.scale * 100)}%
          </button>
          <button
            type="button"
            className="button button--ghost button--icon"
            aria-label={t("lbZoomIn")}
            onClick={() => zoomAt(1.4)}
          >
            +
          </button>
          <button
            type="button"
            className="button button--ghost button--icon"
            aria-label={t("lbClose")}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className={zoomed ? "lightbox__stage lightbox__stage--zoomed" : "lightbox__stage"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => (zoomed ? setView(RESET) : zoomAt(2.5))}
        onClick={(event) => {
          // Click the empty margin to dismiss, but never right after a drag.
          if (event.target === event.currentTarget && !dragged.current) onClose();
        }}
      >
        <img
          className="lightbox__img"
          src={asset(`showcase/${shot.id}-full.webp`)}
          alt={t(shot.title)}
          draggable={false}
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          }}
        />
      </div>

      <div className="lightbox__foot">
        <button
          type="button"
          className="button button--ghost"
          aria-label={t("lbPrev")}
          onClick={() => onIndex((index - 1 + SHOTS.length) % SHOTS.length)}
        >
          ←
        </button>
        <div className="lightbox__caption">
          <h3>{t(shot.title)}</h3>
          <p className="muted">{t(shot.body)}</p>
          <p className="lightbox__hint">{t("lbHint")}</p>
        </div>
        <button
          type="button"
          className="button button--ghost"
          aria-label={t("lbNext")}
          onClick={() => onIndex((index + 1) % SHOTS.length)}
        >
          →
        </button>
      </div>
    </div>
  );
}

/** Adds `is-in` once an element scrolls into view, so the page arrives in pieces. */
function useReveal(count: number) {
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
      const nodes = refs.current.filter((node): node is HTMLElement => !!node);
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver !== "function") {
      nodes.forEach((node) => node.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [count]);

  return refs;
}

export default function HowItWorks() {
  const [open, setOpen] = useState<number | null>(null);
  // Slot 0 is the heading; the shots follow. Nothing here is visible until it
  // is scrolled to — the heading's three words then stagger in on their own.
  const refs = useReveal(SHOTS.length + 1);

  return (
    <section className="how" id="how">
      <h2
        className="how__title"
        ref={(node) => {
          refs.current[0] = node;
        }}
      >
        <span>{t("howWord1")}</span>
        <span>{t("howWord2")}</span>
        <span>{t("howWord3")}</span>
      </h2>

      <ol className="how__steps">
        {SHOTS.map((shot, index) => (
          <li
            key={shot.id}
            className="how__step"
            ref={(node) => {
              refs.current[index + 1] = node;
            }}
          >
            <p className="how__index">{String(index + 1).padStart(2, "0")}</p>
            <div className="how__text">
              <h3>{t(shot.title)}</h3>
              <p className="muted">{t(shot.body)}</p>
            </div>
            <button
              type="button"
              className="how__shot"
              aria-label={t("shotOpenAria", { title: t(shot.title) })}
              onClick={() => setOpen(index)}
            >
              <img
                src={asset(`showcase/${shot.id}.webp`)}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <span className="how__zoom" aria-hidden="true">
                ⤢
              </span>
            </button>
          </li>
        ))}
      </ol>

      {open !== null && (
        <Lightbox index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}
    </section>
  );
}
