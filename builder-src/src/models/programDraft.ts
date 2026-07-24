// Hydrated wire payloads -> editable program draft (and back). Fields the
// web does not edit are preserved verbatim so a web edit never destroys
// phone-authored data (prescriptions, phaseMap, localized maps, provenance).

import type {
  ProgramCategoryWire,
  ProgramGoalWire,
  ProgramLevelWire,
  ProgramSessionDraft,
  ProgressiveProgramDraft,
} from "./programWire";
import {
  PROGRAM_CATEGORIES,
  PROGRAM_GOALS,
  PROGRAM_LEVELS,
} from "./programWire";
import type { DataSourceWire, InputChannelWire } from "./wire";
import { dartUtcIso } from "./wire";

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function asObjectArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is Record<string, unknown> =>
          typeof entry === "object" && entry !== null && !Array.isArray(entry),
      )
    : [];
}

export function sessionDraftFromPayload(
  payload: Record<string, unknown>,
): ProgramSessionDraft | null {
  const id = asString(payload.id);
  const programId = asString(payload.programId);
  const templateId = asString(payload.templateId);
  if (!id || !programId || !templateId) return null;
  return {
    id,
    programId,
    templateId,
    title: asString(payload.title) ?? "",
    weekIndex: asNumber(payload.weekIndex) ?? 1,
    dayIndex: asNumber(payload.dayIndex) ?? 1,
    programVersion: asNumber(payload.programVersion) ?? 1,
    createdAt: asString(payload.createdAt) ?? dartUtcIso(new Date()),
    updatedAt: asString(payload.updatedAt) ?? dartUtcIso(new Date()),
    prescriptions: asObjectArray(payload.prescriptions),
    deviceId: asString(payload.deviceId) ?? "",
  };
}

export function programDraftFromPayloads(
  programPayload: Record<string, unknown>,
  sessionPayloads: Record<string, unknown>[],
): ProgressiveProgramDraft {
  const categoryRaw = asString(programPayload.category);
  const levelRaw = asString(programPayload.level);
  const goals = asStringArray(programPayload.goals).filter(
    (goal): goal is ProgramGoalWire =>
      (PROGRAM_GOALS as readonly string[]).includes(goal),
  );

  const sessions = sessionPayloads
    .map((payload) => sessionDraftFromPayload(payload))
    .filter((session): session is ProgramSessionDraft => session !== null)
    .sort((a, b) => a.weekIndex - b.weekIndex || a.dayIndex - b.dayIndex);

  return {
    id: asString(programPayload.id) ?? crypto.randomUUID(),
    name: asString(programPayload.name) ?? "",
    description: asString(programPayload.description),
    category: (PROGRAM_CATEGORIES as readonly string[]).includes(
      categoryRaw ?? "",
    )
      ? (categoryRaw as ProgramCategoryWire)
      : "bodybuilding",
    level: (PROGRAM_LEVELS as readonly string[]).includes(levelRaw ?? "")
      ? (levelRaw as ProgramLevelWire)
      : "beginner",
    cadence: asString(programPayload.cadence) ?? "weekly",
    goals: goals.length > 0 ? goals : ["hypertrophy"],
    equipmentProfile: asStringArray(programPayload.equipmentProfile),
    durationWeeks: asNumber(programPayload.durationWeeks) ?? 4,
    sessionsPerWeek: asNumber(programPayload.sessionsPerWeek) ?? 3,
    programVersion: asNumber(programPayload.programVersion) ?? 1,
    createdAt: asString(programPayload.createdAt) ?? dartUtcIso(new Date()),
    updatedAt: asString(programPayload.updatedAt) ?? dartUtcIso(new Date()),
    sessions,
    phaseMap: Array.isArray(programPayload.phaseMap)
      ? asObjectArray(programPayload.phaseMap)
      : null,
    sourceRefs: asStringArray(programPayload.sourceRefs),
    mappingNotes: asString(programPayload.mappingNotes),
    localizedNames:
      (programPayload.localizedNames as Record<string, string> | null) ?? null,
    localizedDescriptions:
      (programPayload.localizedDescriptions as Record<string, string> | null) ??
      null,
    systemTags: (programPayload.systemTags as string[] | null) ?? null,
    dataSource:
      (asString(programPayload.dataSource) as DataSourceWire) ?? "manual",
    dataSourceDetail: asString(programPayload.dataSourceDetail),
    confidenceLevel: asNumber(programPayload.confidenceLevel),
    inputChannel: "web_app" as InputChannelWire,
    deviceId: asString(programPayload.deviceId) ?? "",
    actorId: asString(programPayload.actorId),
    schemaVersion: asNumber(programPayload.schemaVersion) ?? 1,
  };
}

export function newProgramDraft(deviceId: string): ProgressiveProgramDraft {
  const now = dartUtcIso(new Date());
  return {
    id: crypto.randomUUID(),
    name: "",
    description: null,
    category: "bodybuilding",
    level: "beginner",
    cadence: "weekly",
    goals: ["hypertrophy"],
    equipmentProfile: [],
    durationWeeks: 4,
    sessionsPerWeek: 3,
    programVersion: 1,
    createdAt: now,
    updatedAt: now,
    sessions: [],
    dataSource: "manual",
    dataSourceDetail: "web_builder_v1",
    inputChannel: "web_app",
    deviceId,
    schemaVersion: 1,
  };
}
