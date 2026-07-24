// Converts a hydrated wire payload (possibly phone-created) into an editable
// draft, preserving fields the web UI does not touch (createdAt string,
// localized maps, systemTags, provenance) so a web edit does not wipe them.

import type {
  SetTypeWire,
  TemplateExerciseDraft,
  TemplateSetPrescriptionDraft,
  WorkoutTemplateDraft,
  DataSourceWire,
  InputChannelWire,
} from "./wire";
import { dartUtcIso } from "./wire";

const SET_TYPES: readonly SetTypeWire[] = [
  "warmup",
  "working",
  "backoff",
  "dropset",
  "amrap",
  "failure",
  "superset",
  "rest_pause",
  "myo_rep",
  "emom",
  "cooldown",
];

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parsePrescription(
  raw: Record<string, unknown>,
  fallbackOrder: number,
): TemplateSetPrescriptionDraft {
  const setTypeRaw = asString(raw.setType);
  return {
    orderIndex: asNumber(raw.orderIndex) ?? fallbackOrder,
    setType: SET_TYPES.includes(setTypeRaw as SetTypeWire)
      ? (setTypeRaw as SetTypeWire)
      : "working",
    targetRepsMin: asNumber(raw.targetRepsMin),
    targetRepsMax: asNumber(raw.targetRepsMax),
    targetWeight: asNumber(raw.targetWeight),
    targetTimeSeconds: asNumber(raw.targetTimeSeconds),
    restSeconds: asNumber(raw.restSeconds),
    targetRpe: asNumber(raw.targetRpe),
    targetRir: asNumber(raw.targetRir),
    backoffPercent: asNumber(raw.backoffPercent),
    supersetGroupId: asString(raw.supersetGroupId),
    dropPercent: asNumber(raw.dropPercent),
    dropStages: asNumber(raw.dropStages),
    emomIntervalSeconds: asNumber(raw.emomIntervalSeconds),
    emomDurationSeconds: asNumber(raw.emomDurationSeconds),
    restPauseIntraSetSeconds: asNumber(raw.restPauseIntraSetSeconds),
    restPauseMiniSets: asNumber(raw.restPauseMiniSets),
    tempoEccentricSec: asNumber(raw.tempoEccentricSec),
    tempoPauseBottomSec: asNumber(raw.tempoPauseBottomSec),
    tempoConcentricSec: asNumber(raw.tempoConcentricSec),
    tempoPauseTopSec: asNumber(raw.tempoPauseTopSec),
  };
}

export function draftFromPayload(
  payload: Record<string, unknown>,
): WorkoutTemplateDraft {
  const exercisesRaw = Array.isArray(payload.exercises)
    ? payload.exercises
    : [];
  const exercises: TemplateExerciseDraft[] = exercisesRaw
    .filter((entry): entry is Record<string, unknown> =>
      typeof entry === "object" && entry !== null,
    )
    .map((entry) => ({
      exerciseId: asString(entry.exerciseId) ?? "",
      prescribedSets: Array.isArray(entry.prescribedSets)
        ? entry.prescribedSets
            .filter(
              (set): set is Record<string, unknown> =>
                typeof set === "object" && set !== null,
            )
            .map((set, index) => parsePrescription(set, index))
        : null,
      category: asString(entry.category) ?? "",
    }))
    .filter((exercise) => exercise.exerciseId.length > 0);

  return {
    id: asString(payload.id) ?? crypto.randomUUID(),
    name: asString(payload.name) ?? "",
    createdAt: asString(payload.createdAt) ?? dartUtcIso(new Date()),
    exercises,
    localizedNames:
      (payload.localizedNames as Record<string, string> | null) ?? null,
    localizedDescriptions:
      (payload.localizedDescriptions as Record<string, string> | null) ?? null,
    systemTags: (payload.systemTags as string[] | null) ?? null,
    dataSource: (asString(payload.dataSource) as DataSourceWire) ?? "manual",
    dataSourceDetail: asString(payload.dataSourceDetail),
    confidenceLevel: asNumber(payload.confidenceLevel),
    // Web edit of a phone template keeps ITS channel history in the journal;
    // the new mutation is web-origin.
    inputChannel: "web_app" as InputChannelWire,
    deviceId: asString(payload.deviceId) ?? "",
    actorId: asString(payload.actorId),
    schemaVersion: asNumber(payload.schemaVersion) ?? 1,
  };
}

export function newTemplateDraft(deviceId: string): WorkoutTemplateDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    createdAt: dartUtcIso(new Date()),
    exercises: [],
    dataSource: "manual",
    dataSourceDetail: "web_builder_v1",
    inputChannel: "web_app",
    deviceId,
    schemaVersion: 1,
  };
}
