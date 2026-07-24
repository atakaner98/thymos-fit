// Mirror of DefaultSyncSensitivityPolicy._stripSensitive
// (workout_tracker/lib/core/sync/data/default_sync_sensitivity_policy.dart)
// and the server's blocked-key list (supabase/functions/sync-v1-push).
//
// The server REJECTS whole mutations containing any of these keys
// (errorCode: sensitivity_blocked), so stripping before push is mandatory,
// not cosmetic. Unlike the mobile emitter, this operates on plain JSON, so
// nested prescription objects are stripped too.

const BLOCKED_KEYS = new Set([
  "readinessScore",
  "fatigueContext",
  "recoveryContext",
  "readinessSignals",
  "readinessContext",
  "wellnessContext",
  "recommendationPayload",
  "userTags",
  "fatigue_context",
  "recovery_context",
  "readiness_signals",
  "readiness_context",
  "wellness_context",
  "recommendation_payload",
  "user_tags",
  "sensitivityLevel",
  "sensitivity",
  "sensitivity_level",
  // GUARDRAIL 5: exercise notes are HIGH sensitivity, local-only.
  "note",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stripValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripValue(item));
  }
  if (isPlainObject(value)) {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (BLOCKED_KEYS.has(key)) continue;
      output[key] = stripValue(nested);
    }
    return output;
  }
  return value;
}

/** Strip HIGH/CRITICAL keys (recursively) from a wire payload before push. */
export function sanitizePayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  return stripValue(payload) as Record<string, unknown>;
}
