import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTemplateWirePayload } from "../templatePayload";
import { sanitizePayload } from "../sanitize";
import type { WorkoutTemplateDraft } from "../wire";

const goldenPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../goldens/web_template_payload_v1.golden.json",
);

/**
 * Must stay identical to the fixture in ironclad_app
 * test/contract/web_template_payload_golden_test.dart — the two tests lock
 * the cross-language wire contract against the same golden.
 */
const goldenDraft: WorkoutTemplateDraft = {
  id: "6b2f0d5e-8c4a-4c9f-9d3e-1a2b3c4d5e6f",
  name: "Web Golden Chest Day",
  createdAt: "2026-07-24T10:30:00.000Z",
  exercises: [
    {
      exerciseId: "barbell-bench-press",
      prescribedSets: [
        {
          orderIndex: 0,
          setType: "warmup",
          targetRepsMin: 10,
          targetRepsMax: 12,
          targetWeight: 40,
          restSeconds: 60,
          // HIGH sensitivity: must be stripped from the wire payload.
          note: "Slow eccentric",
        },
        {
          orderIndex: 1,
          setType: "working",
          targetRepsMin: 5,
          targetRepsMax: 5,
          targetWeight: 100,
          restSeconds: 180,
          targetRpe: 8,
        },
        {
          orderIndex: 2,
          setType: "dropset",
          targetRepsMin: 8,
          targetRepsMax: 10,
          targetWeight: 80,
          dropPercent: 20,
          dropStages: 2,
        },
      ],
    },
    {
      exerciseId: "pull-ups",
      prescribedSets: [
        {
          orderIndex: 0,
          setType: "superset",
          targetRepsMin: 8,
          targetRepsMax: 12,
          restSeconds: 90,
          supersetGroupId: "sg-1",
        },
        {
          orderIndex: 1,
          setType: "working",
          targetTimeSeconds: 60,
        },
      ],
    },
  ],
  // All of these must be absent from the wire payload (sensitivity strip).
  userTags: ["strip-me"],
  readinessScore: 0.4,
  fatigueContext: { reason: "strip-me" },
  dataSourceDetail: "web_builder_v1",
  deviceId: "web-golden-device",
};

describe("buildTemplateWirePayload", () => {
  it("matches the cross-language golden byte-for-byte (keys + order)", () => {
    const payload = buildTemplateWirePayload(goldenDraft);
    const golden = JSON.parse(readFileSync(goldenPath, "utf8"));
    // Restringify both sides: neutralizes number formatting differences
    // (Dart writes 40.0, JS writes 40) while still enforcing key order.
    expect(JSON.stringify(payload, null, 2)).toBe(
      JSON.stringify(golden, null, 2),
    );
  });

  it("never emits blocked sensitivity keys, including nested note", () => {
    const payload = buildTemplateWirePayload(goldenDraft);
    const flat = JSON.stringify(payload);
    for (const blocked of [
      "note",
      "userTags",
      "readinessScore",
      "fatigueContext",
      "recommendationPayload",
      "sensitivityLevel",
    ]) {
      expect(flat).not.toContain(`"${blocked}"`);
    }
  });
});

describe("sanitizePayload", () => {
  it("strips blocked keys recursively through objects and arrays", () => {
    const result = sanitizePayload({
      keep: 1,
      note: "secret",
      nested: { userTags: ["x"], keep: [{ readinessScore: 1, ok: true }] },
    });
    expect(result).toEqual({
      keep: 1,
      nested: { keep: [{ ok: true }] },
    });
  });

  it("leaves non-blocked values untouched", () => {
    const result = sanitizePayload({ a: null, b: [1, "two", null], c: "x" });
    expect(result).toEqual({ a: null, b: [1, "two", null], c: "x" });
  });
});
