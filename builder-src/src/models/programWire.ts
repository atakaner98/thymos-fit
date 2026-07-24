// Wire-format serializers for progressive_program and program_session sync
// payloads. Mirrors progressive_program.g.dart / program_session.g.dart the
// same way wire.ts mirrors workout_template.g.dart. Locked by the program
// golden contract tests in both repos.

import type { DataSourceWire, InputChannelWire } from "./wire";
import { sanitizePayload } from "./sanitize";

export type ProgramCategoryWire =
  | "bodybuilding"
  | "powerlifting"
  | "calisthenics";
export type ProgramLevelWire = "beginner" | "intermediate" | "advanced";
export type ProgramGoalWire = "hypertrophy" | "strength" | "endurance";

export const PROGRAM_CATEGORIES: readonly ProgramCategoryWire[] = [
  "bodybuilding",
  "powerlifting",
  "calisthenics",
];
export const PROGRAM_LEVELS: readonly ProgramLevelWire[] = [
  "beginner",
  "intermediate",
  "advanced",
];
export const PROGRAM_GOALS: readonly ProgramGoalWire[] = [
  "hypertrophy",
  "strength",
  "endurance",
];

export interface ProgramSessionDraft {
  id: string;
  programId: string;
  /** Must reference a workout template the user owns (mobile convention). */
  templateId: string;
  title: string;
  /** 1-based, like the mobile session editor. */
  weekIndex: number;
  /** 1-based day slot within the week. */
  dayIndex: number;
  programVersion: number;
  createdAt: string;
  updatedAt: string;
  /**
   * Explicit per-session prescriptions are NOT editable on the web (Phase 2
   * scope). Hydrated values are passed through untouched so a web edit never
   * wipes prescriptions authored on the phone.
   */
  prescriptions: Record<string, unknown>[];
  deviceId: string;
}

export interface ProgressiveProgramDraft {
  id: string;
  name: string;
  description?: string | null;
  category: ProgramCategoryWire;
  level: ProgramLevelWire;
  cadence: string;
  goals: ProgramGoalWire[];
  equipmentProfile?: string[];
  durationWeeks: number;
  sessionsPerWeek: number;
  programVersion: number;
  createdAt: string;
  updatedAt: string;
  sessions: ProgramSessionDraft[];
  /** Passthrough fields preserved from hydration (never edited on web). */
  phaseMap?: Record<string, unknown>[] | null;
  sourceRefs?: string[];
  mappingNotes?: string | null;
  localizedNames?: Record<string, string> | null;
  localizedDescriptions?: Record<string, string> | null;
  systemTags?: string[] | null;
  dataSource?: DataSourceWire;
  dataSourceDetail?: string | null;
  confidenceLevel?: number | null;
  inputChannel?: InputChannelWire;
  deviceId: string;
  actorId?: string | null;
  schemaVersion?: number;
}

/** Mirror of _$$ProgramSessionImplToJson (program_session.g.dart). */
export function programSessionToJson(
  session: ProgramSessionDraft,
): Record<string, unknown> {
  return {
    id: session.id,
    programId: session.programId,
    templateId: session.templateId,
    title: session.title,
    localizedNames: null,
    localizedDescriptions: null,
    weekIndex: session.weekIndex,
    dayIndex: session.dayIndex,
    sessionIndex: null,
    estimatedDurationMinutes: null,
    recommendedRestSeconds: null,
    intensityLevel: null,
    programVersion: session.programVersion,
    deprecatedAt: null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    sourceRefs: [],
    mappingNotes: null,
    prescriptions: session.prescriptions,
    hasExplicitPrescription: session.prescriptions.length > 0,
    mesocyclePhase: null,
    systemTags: null,
    userTags: null,
    readinessScore: null,
    fatigueContext: null,
    recommendationPayload: null,
    sensitivityLevel: "low",
    dataSource: "manual",
    dataSourceDetail: "web_builder_v1",
    confidenceLevel: null,
    inputChannel: "web_app",
    deviceId: session.deviceId,
    actorId: null,
    schemaVersion: 1,
  };
}

/**
 * Mirror of _$$ProgressiveProgramImplToJson with the saveProgram convention:
 * the program envelope always carries sessions: [] — sessions travel as
 * separate program_session mutations.
 */
export function progressiveProgramToJson(
  program: ProgressiveProgramDraft,
): Record<string, unknown> {
  return {
    id: program.id,
    name: program.name,
    description: program.description ?? null,
    localizedNames: program.localizedNames ?? null,
    localizedDescriptions: program.localizedDescriptions ?? null,
    category: program.category,
    level: program.level,
    cadence: program.cadence,
    goals: program.goals,
    equipmentProfile: program.equipmentProfile ?? [],
    durationWeeks: program.durationWeeks,
    sessionsPerWeek: program.sessionsPerWeek,
    programVersion: program.programVersion,
    deprecatedAt: null,
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
    sessions: [],
    phaseMap: program.phaseMap ?? null,
    sourceRefs: program.sourceRefs ?? [],
    mappingNotes: program.mappingNotes ?? null,
    systemTags: program.systemTags ?? null,
    userTags: null,
    readinessScore: null,
    fatigueContext: null,
    recommendationPayload: null,
    sensitivityLevel: "low",
    dataSource: program.dataSource ?? "manual",
    dataSourceDetail: program.dataSourceDetail ?? "web_builder_v1",
    confidenceLevel: program.confidenceLevel ?? null,
    inputChannel: program.inputChannel ?? "web_app",
    deviceId: program.deviceId,
    actorId: program.actorId ?? null,
    schemaVersion: program.schemaVersion ?? 1,
  };
}

export function buildProgramWirePayload(
  program: ProgressiveProgramDraft,
): Record<string, unknown> {
  return sanitizePayload(progressiveProgramToJson(program));
}

export function buildProgramSessionWirePayload(
  session: ProgramSessionDraft,
): Record<string, unknown> {
  return sanitizePayload(programSessionToJson(session));
}
