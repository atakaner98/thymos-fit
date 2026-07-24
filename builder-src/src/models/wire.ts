// Wire-format types and serializers for sync payloads.
//
// CONTRACT: the JSON produced here is parsed on the phone by generated
// freezed/json_serializable code (workout_template.g.dart et al). Key order,
// enum string values, and explicit-null emission mirror the Dart generators.
// The cross-language golden test (templatePayload.test.ts here,
// test/contract/web_template_payload_golden_test.dart in ironclad_app) locks
// this contract — do not change one side without the other.

export type SetTypeWire =
  | "warmup"
  | "working"
  | "backoff"
  | "dropset"
  | "amrap"
  | "failure"
  | "superset"
  | "rest_pause"
  | "myo_rep"
  | "emom"
  | "cooldown";

export type DataSourceWire =
  | "manual"
  | "imported"
  | "sensor"
  | "derived"
  | "ai_generated"
  | "legacy"
  | "system";

export type InputChannelWire =
  | "phone_app"
  | "watch_app"
  | "web_app"
  | "csv_import"
  | "api"
  | "partner_mode";

export interface TemplateSetPrescriptionDraft {
  orderIndex: number;
  setType: SetTypeWire;
  targetRepsMin?: number | null;
  targetRepsMax?: number | null;
  targetWeight?: number | null;
  targetTimeSeconds?: number | null;
  restSeconds?: number | null;
  targetRpe?: number | null;
  targetRir?: number | null;
  backoffPercent?: number | null;
  supersetGroupId?: string | null;
  dropPercent?: number | null;
  dropStages?: number | null;
  emomIntervalSeconds?: number | null;
  emomDurationSeconds?: number | null;
  restPauseIntraSetSeconds?: number | null;
  restPauseMiniSets?: number | null;
  tempoEccentricSec?: number | null;
  tempoPauseBottomSec?: number | null;
  tempoConcentricSec?: number | null;
  tempoPauseTopSec?: number | null;
  /** HIGH sensitivity (Guardrail 5): kept locally, never pushed. */
  note?: string | null;
}

export interface TemplateExerciseDraft {
  exerciseId: string;
  prescribedSets?: TemplateSetPrescriptionDraft[] | null;
  /** Legacy passthrough field; empty string for web-created exercises. */
  category?: string;
}

export interface WorkoutTemplateDraft {
  id: string;
  name: string;
  /**
   * Raw ISO-8601 string. For web-created templates use dartUtcIso(new Date());
   * for templates hydrated from sync, keep the original string untouched
   * (phone emits local-time strings without offset — reformatting would move
   * the timestamp).
   */
  createdAt: string;
  exercises: TemplateExerciseDraft[];
  localizedNames?: Record<string, string> | null;
  localizedDescriptions?: Record<string, string> | null;
  systemTags?: string[] | null;
  userTags?: string[] | null;
  readinessScore?: number | null;
  fatigueContext?: Record<string, unknown> | null;
  recommendationPayload?: Record<string, unknown> | null;
  dataSource?: DataSourceWire;
  dataSourceDetail?: string | null;
  confidenceLevel?: number | null;
  inputChannel?: InputChannelWire;
  deviceId: string;
  actorId?: string | null;
  schemaVersion?: number;
}

/**
 * Dart's DateTime.toIso8601String() for a UTC value: millisecond precision,
 * trailing Z — which is exactly JS Date.toISOString().
 */
export function dartUtcIso(date: Date): string {
  return date.toISOString();
}

/**
 * Mirror of _$$TemplateSetPrescriptionImplToJson (template_set_prescription.g.dart):
 * every key present, explicit nulls, generator key order.
 */
export function prescriptionToJson(
  set: TemplateSetPrescriptionDraft,
): Record<string, unknown> {
  return {
    orderIndex: set.orderIndex,
    setType: set.setType,
    targetRepsMin: set.targetRepsMin ?? null,
    targetRepsMax: set.targetRepsMax ?? null,
    targetWeight: set.targetWeight ?? null,
    targetTimeSeconds: set.targetTimeSeconds ?? null,
    restSeconds: set.restSeconds ?? null,
    targetRpe: set.targetRpe ?? null,
    targetRir: set.targetRir ?? null,
    backoffPercent: set.backoffPercent ?? null,
    supersetGroupId: set.supersetGroupId ?? null,
    dropPercent: set.dropPercent ?? null,
    dropStages: set.dropStages ?? null,
    emomIntervalSeconds: set.emomIntervalSeconds ?? null,
    emomDurationSeconds: set.emomDurationSeconds ?? null,
    restPauseIntraSetSeconds: set.restPauseIntraSetSeconds ?? null,
    restPauseMiniSets: set.restPauseMiniSets ?? null,
    tempoEccentricSec: set.tempoEccentricSec ?? null,
    tempoPauseBottomSec: set.tempoPauseBottomSec ?? null,
    tempoConcentricSec: set.tempoConcentricSec ?? null,
    tempoPauseTopSec: set.tempoPauseTopSec ?? null,
    note: set.note ?? null,
  };
}

/** Mirror of _$$TemplateExerciseImplToJson (workout_template.g.dart). */
export function templateExerciseToJson(
  exercise: TemplateExerciseDraft,
): Record<string, unknown> {
  return {
    exerciseId: exercise.exerciseId,
    prescribedSets:
      exercise.prescribedSets?.map((set) => prescriptionToJson(set)) ?? null,
    category: exercise.category ?? "",
  };
}

/**
 * Mirror of _$$WorkoutTemplateImplToJson (workout_template.g.dart) — the
 * UNSANITIZED form. Callers must pass the result through sanitizePayload()
 * before pushing (see sanitize.ts); buildTemplateWirePayload does both.
 */
export function workoutTemplateToJson(
  template: WorkoutTemplateDraft,
): Record<string, unknown> {
  return {
    id: template.id,
    name: template.name,
    createdAt: template.createdAt,
    exercises: template.exercises.map((exercise) =>
      templateExerciseToJson(exercise),
    ),
    localizedNames: template.localizedNames ?? null,
    localizedDescriptions: template.localizedDescriptions ?? null,
    systemTags: template.systemTags ?? null,
    userTags: template.userTags ?? null,
    readinessScore: template.readinessScore ?? null,
    fatigueContext: template.fatigueContext ?? null,
    recommendationPayload: template.recommendationPayload ?? null,
    sensitivityLevel: "low",
    dataSource: template.dataSource ?? "manual",
    dataSourceDetail: template.dataSourceDetail ?? null,
    confidenceLevel: template.confidenceLevel ?? null,
    inputChannel: template.inputChannel ?? "web_app",
    deviceId: template.deviceId,
    actorId: template.actorId ?? null,
    schemaVersion: template.schemaVersion ?? 1,
  };
}
