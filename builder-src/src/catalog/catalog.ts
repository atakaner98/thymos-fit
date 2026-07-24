import catalogJson from "./exercises.catalog.json";

export interface CatalogExercise {
  id: string;
  name: string;
  logType: string;
  level: string | null;
  movementPattern: string | null;
  equipment: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  displayCategories: string[];
  aliases: string[];
}

interface CatalogFile {
  sourceVersion: string | null;
  sourceLastUpdated: string | null;
  exerciseCount: number;
  deprecatedIdMap: Record<string, string>;
  exercises: CatalogExercise[];
}

const catalog = catalogJson as CatalogFile;

const byId = new Map<string, CatalogExercise>(
  catalog.exercises.map((exercise) => [exercise.id, exercise]),
);

export const allExercises: readonly CatalogExercise[] = catalog.exercises;

/** Resolves deprecated ids the same way the mobile ExerciseLibrary does. */
export function findExercise(id: string): CatalogExercise | undefined {
  const canonicalId = catalog.deprecatedIdMap[id] ?? id;
  return byId.get(canonicalId);
}

/**
 * Display name for an exercise reference. Unknown ids (e.g. phone-created
 * custom exercises, which do not sync in this phase) degrade to the raw id —
 * render, never crash.
 */
export function exerciseDisplayName(id: string): string {
  return findExercise(id)?.name ?? id;
}

export function isUnknownExercise(id: string): boolean {
  return findExercise(id) === undefined;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

/** Facet options for the browser filters, derived from the catalog itself. */
export const allMuscles: readonly string[] = sortedUnique(
  catalog.exercises.flatMap((exercise) => exercise.primaryMuscles),
);

export const allEquipment: readonly string[] = sortedUnique(
  catalog.exercises.flatMap((exercise) => exercise.equipment),
);

export interface ExerciseFilter {
  query?: string;
  muscle?: string;
  equipment?: string;
}

/**
 * Returns ALL matching exercises (no arbitrary cap) — the browser list is
 * scrollable and the full catalog must be reachable without typing.
 * Text matches rank name-prefix first, then name/alias/muscle substring.
 */
export function filterExercises(filter: ExerciseFilter): CatalogExercise[] {
  const needle = (filter.query ?? "").trim().toLowerCase();

  const scored: Array<{ exercise: CatalogExercise; score: number }> = [];
  for (const exercise of catalog.exercises) {
    if (
      filter.muscle &&
      !exercise.primaryMuscles.includes(filter.muscle) &&
      !exercise.secondaryMuscles.includes(filter.muscle)
    ) {
      continue;
    }
    if (filter.equipment && !exercise.equipment.includes(filter.equipment)) {
      continue;
    }

    let score = 4;
    if (needle) {
      const name = exercise.name.toLowerCase();
      if (name.startsWith(needle)) {
        score = 0;
      } else if (name.includes(needle)) {
        score = 1;
      } else if (exercise.aliases.some((alias) => alias.includes(needle))) {
        score = 2;
      } else if (
        exercise.primaryMuscles.some((muscle) => muscle.includes(needle)) ||
        exercise.displayCategories.some((category) =>
          category.toLowerCase().includes(needle),
        )
      ) {
        score = 3;
      } else {
        continue;
      }
    }
    scored.push({ exercise, score });
  }
  scored.sort(
    (a, b) =>
      a.score - b.score || a.exercise.name.localeCompare(b.exercise.name),
  );
  return scored.map((entry) => entry.exercise);
}
