import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildProgramWirePayload,
  buildProgramSessionWirePayload,
  type ProgramSessionDraft,
  type ProgressiveProgramDraft,
} from "../programWire";
import { programDraftFromPayloads } from "../programDraft";

const goldensDir = resolve(dirname(fileURLToPath(import.meta.url)), "../goldens");

function loadGolden(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(goldensDir, name), "utf8"));
}

const programGolden = loadGolden("web_program_payload_v1.golden.json");
const sessionGolden = loadGolden("web_program_session_payload_v1.golden.json");

/** Matches the Dart fixture in web_program_payload_golden_test.dart. */
function goldenSessionDraft(): ProgramSessionDraft {
  return {
    id: "b2c3d4e5-0000-4000-8000-000000000002",
    programId: "a7c3e9f1-0000-4000-8000-00000000000a",
    templateId: "6b2f0d5e-8c4a-4c9f-9d3e-1a2b3c4d5e6f",
    title: "Push A",
    weekIndex: 1,
    dayIndex: 1,
    programVersion: 1,
    createdAt: "2026-07-25T09:00:00.000Z",
    updatedAt: "2026-07-25T09:00:00.000Z",
    // Passthrough: exactly what hydration would deliver (phone-authored
    // explicit prescription).
    prescriptions: (sessionGolden.prescriptions as Record<string, unknown>[]),
    deviceId: "web-golden-device",
  };
}

function goldenProgramDraft(): ProgressiveProgramDraft {
  return {
    id: "a7c3e9f1-0000-4000-8000-00000000000a",
    name: "Web Golden PPL",
    description: "Push pull legs from web",
    category: "bodybuilding",
    level: "intermediate",
    cadence: "weekly",
    goals: ["hypertrophy", "strength"],
    equipmentProfile: [],
    durationWeeks: 4,
    sessionsPerWeek: 3,
    programVersion: 1,
    createdAt: "2026-07-25T09:00:00.000Z",
    updatedAt: "2026-07-25T09:00:00.000Z",
    sessions: [goldenSessionDraft()],
    dataSource: "manual",
    dataSourceDetail: "web_builder_v1",
    inputChannel: "web_app",
    deviceId: "web-golden-device",
    schemaVersion: 1,
  };
}

describe("program wire payloads", () => {
  it("program payload matches the cross-language golden (sessions stripped)", () => {
    const payload = buildProgramWirePayload(goldenProgramDraft());
    expect(JSON.stringify(payload, null, 2)).toBe(
      JSON.stringify(programGolden, null, 2),
    );
  });

  it("session payload matches the golden, prescriptions passed through", () => {
    const payload = buildProgramSessionWirePayload(goldenSessionDraft());
    expect(JSON.stringify(payload, null, 2)).toBe(
      JSON.stringify(sessionGolden, null, 2),
    );
  });

  it("round-trips: hydrated payloads -> draft -> identical wire payloads", () => {
    const draft = programDraftFromPayloads(programGolden, [sessionGolden]);
    expect(draft.sessions).toHaveLength(1);
    expect(JSON.stringify(buildProgramWirePayload(draft), null, 2)).toBe(
      JSON.stringify(programGolden, null, 2),
    );
    expect(
      JSON.stringify(buildProgramSessionWirePayload(draft.sessions[0]), null, 2),
    ).toBe(JSON.stringify(sessionGolden, null, 2));
  });

  it("never emits blocked sensitivity keys", () => {
    const flat =
      JSON.stringify(buildProgramWirePayload(goldenProgramDraft())) +
      JSON.stringify(buildProgramSessionWirePayload(goldenSessionDraft()));
    for (const blocked of [
      '"userTags"',
      '"readinessScore"',
      '"fatigueContext"',
      '"recommendationPayload"',
      '"sensitivityLevel"',
    ]) {
      expect(flat).not.toContain(blocked);
    }
    // 'notes' (program prescriptions) is NOT the blocked 'note' key and must
    // survive the round-trip.
    expect(flat).toContain('"notes":"Focus on form"');
  });
});
