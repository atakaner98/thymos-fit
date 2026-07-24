import { useMemo, useRef, useState } from "react";
import { searchExercises, type CatalogExercise } from "../catalog/catalog";

/**
 * Keyboard-first exercise search: type to filter, Enter adds the top match,
 * arrow keys move the highlight, Escape clears.
 */
export default function ExercisePicker({
  onPick,
}: {
  onPick: (exercise: CatalogExercise) => void;
}) {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchExercises(query, 12), [query]);

  function pick(exercise: CatalogExercise) {
    onPick(exercise);
    setQuery("");
    setHighlight(0);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className="picker">
      <input
        ref={inputRef}
        type="text"
        placeholder="Add exercise — type to search, Enter to add"
        value={query}
        aria-label="Search exercises"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setHighlight(0);
          setOpen(true);
        }}
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
          } else if (event.key === "Escape") {
            setQuery("");
            setOpen(false);
          }
        }}
        style={{ width: "100%" }}
      />
      {open && results.length > 0 && (
        <ul className="picker__list" role="listbox">
          {results.map((exercise, index) => (
            <li key={exercise.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlight}
                className={
                  index === highlight
                    ? "picker__item picker__item--active"
                    : "picker__item"
                }
                onMouseEnter={() => setHighlight(index)}
                onClick={() => pick(exercise)}
              >
                <span>{exercise.name}</span>
                <span className="picker__meta">
                  {[exercise.primaryMuscles.join(", "), exercise.equipment.join(", ")]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
