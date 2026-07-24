import { useEffect, useMemo, useRef, useState } from "react";
import {
  allEquipment,
  allMuscles,
  filterExercises,
  type CatalogExercise,
} from "../catalog/catalog";
import { t } from "../i18n/locale";

/**
 * Full-catalog exercise browser in a modal: search + muscle/equipment
 * filters over ALL exercises (scrollable, count shown). Closes via the X
 * button, Escape, or clicking the backdrop. Stays open after adding so
 * several exercises can be added in one pass; every add is confirmed inline.
 *
 * Keyboard: type to search, ArrowUp/Down to move, Enter to add highlighted.
 */
export default function ExercisePicker({
  onPick,
}: {
  onPick: (exercise: CatalogExercise) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(
    () =>
      filterExercises({
        query,
        muscle: muscle || undefined,
        equipment: equipment || undefined,
      }),
    [query, muscle, equipment],
  );

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query, muscle, equipment]);

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  function pick(exercise: CatalogExercise) {
    onPick(exercise);
    setLastAdded(exercise.name);
  }

  if (!open) {
    return (
      <button type="button" className="button" onClick={() => setOpen(true)}>
        {t("addExercise")}
      </button>
    );
  }

  return (
    <>
      <button type="button" className="button" onClick={() => setOpen(true)}>
        {t("addExercise")}
      </button>
      <div
        className="browser-backdrop"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div
          className="browser"
          role="dialog"
          aria-modal="true"
          aria-label="Exercise browser"
        >
          <div className="browser__head">
            <h2>{t("addExercisesTitle")}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {lastAdded && (
                <span className="browser__added" aria-live="polite">
                  {t("addedName", { name: lastAdded })}
                </span>
              )}
              <button
                type="button"
                className="button button--ghost button--icon"
                aria-label={t("closeBrowser")}
                onClick={() => setOpen(false)}
              >
                {t("closeBrowser")}
              </button>
            </div>
          </div>

          <div className="browser__filters">
            <input
              ref={searchRef}
              type="text"
              placeholder={t("searchExercisesPh")}
              aria-label={t("searchExercisesAria")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const chosen = results[highlight] ?? results[0];
                  if (chosen) pick(chosen);
                } else if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setHighlight((current) =>
                    Math.min(current + 1, results.length - 1),
                  );
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setHighlight((current) => Math.max(current - 1, 0));
                }
              }}
            />
            <select
              aria-label="Filter by muscle"
              value={muscle}
              onChange={(event) => setMuscle(event.target.value)}
            >
              <option value="">{t("allMuscles")}</option>
              {allMuscles.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by equipment"
              value={equipment}
              onChange={(event) => setEquipment(event.target.value)}
            >
              <option value="">{t("allEquipment")}</option>
              {allEquipment.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="browser__count">
            {t("exercisesFound", { n: results.length })}
          </div>

          {results.length === 0 ? (
            <div className="browser__empty">{t("emptyBrowser")}</div>
          ) : (
            <ul className="browser__list" ref={listRef}>
              {results.map((exercise, index) => (
                <li key={exercise.id}>
                  <button
                    type="button"
                    data-active={index === highlight}
                    className={
                      index === highlight
                        ? "browser__row browser__row--active"
                        : "browser__row"
                    }
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => pick(exercise)}
                  >
                    <span>
                      <span className="browser__row-name">{exercise.name}</span>
                      <span className="browser__row-meta">
                        {[
                          exercise.primaryMuscles.join(", "),
                          exercise.equipment.join(", "),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <span className="browser__row-add">{t("addRow")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
