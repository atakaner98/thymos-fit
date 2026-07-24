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

export function searchExercises(
  query: string,
  limit = 30,
): CatalogExercise[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return catalog.exercises.slice(0, limit);

  const scored: Array<{ exercise: CatalogExercise; score: number }> = [];
  for (const exercise of catalog.exercises) {
    const name = exercise.name.toLowerCase();
    let score = -1;
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
    }
    if (score >= 0) scored.push({ exercise, score });
  }
  scored.sort(
    (a, b) =>
      a.score - b.score || a.exercise.name.localeCompare(b.exercise.name),
  );
  return scored.slice(0, limit).map((entry) => entry.exercise);
}
