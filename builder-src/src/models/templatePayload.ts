import {
  workoutTemplateToJson,
  type WorkoutTemplateDraft,
} from "./wire";
import { sanitizePayload } from "./sanitize";

/**
 * The exact payload pushed for a workout_template mutation: Dart-shaped
 * toJson, sanitized of HIGH/CRITICAL keys. Locked by the cross-language
 * golden test.
 */
export function buildTemplateWirePayload(
  template: WorkoutTemplateDraft,
): Record<string, unknown> {
  return sanitizePayload(workoutTemplateToJson(template));
}
