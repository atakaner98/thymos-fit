import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBuilder } from "../state/BuilderContext";
import {
  draftFromPayload,
  newTemplateDraft,
} from "../models/templateDraft";
import type {
  SetTypeWire,
  TemplateSetPrescriptionDraft,
  WorkoutTemplateDraft,
} from "../models/wire";
import { getOrCreateDeviceId } from "../state/deviceId";
import {
  exerciseDisplayName,
  isUnknownExercise,
} from "../catalog/catalog";
import ExercisePicker from "../components/ExercisePicker";

// Phase 1 set types. EMOM / rest-pause / myo-rep prescriptions are modeled in
// the wire format but deliberately not editable yet (plan: Phase 2).
const EDITABLE_SET_TYPES: readonly SetTypeWire[] = [
  "warmup",
  "working",
  "backoff",
  "dropset",
  "amrap",
  "failure",
  "superset",
  "cooldown",
];

const DEFAULT_SET: TemplateSetPrescriptionDraft = {
  orderIndex: 0,
  setType: "working",
  targetRepsMin: 8,
  targetRepsMax: 12,
  restSeconds: 90,
};

function numberInput(
  value: number | null | undefined,
  onChange: (next: number | null) => void,
  props: { step?: string; width?: number; label: string },
) {
  return (
    <input
      type="number"
      inputMode="decimal"
      aria-label={props.label}
      step={props.step ?? "1"}
      value={value ?? ""}
      style={{ width: props.width ?? 74 }}
      onChange={(event) => {
        const raw = event.target.value;
        if (raw === "") {
          onChange(null);
          return;
        }
        const parsed = Number(raw);
        onChange(Number.isFinite(parsed) ? parsed : null);
      }}
    />
  );
}

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { templates, saveTemplate, hydration } = useBuilder();

  const initialDraft: WorkoutTemplateDraft | null = useMemo(() => {
    if (id === "new") {
      return newTemplateDraft(getOrCreateDeviceId());
    }
    const existing = templates.find((template) => template.entityId === id);
    if (!existing?.payload) return null;
    return draftFromPayload(existing.payload);
    // Intentionally captured once: the editor owns its state after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [draft, setDraft] = useState<WorkoutTemplateDraft | null>(initialDraft);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!draft) {
    return (
      <main className="page">
        {hydration.kind === "loading" ? (
          <div className="card" role="status">
            <div className="spinner" aria-hidden="true" />
          </div>
        ) : (
          <div className="error-banner">
            Template not found. It may not have been pushed/synced yet.{" "}
            <button
              type="button"
              className="button button--ghost"
              onClick={() => navigate("/")}
            >
              Back to list
            </button>
          </div>
        )}
      </main>
    );
  }

  function updateSet(
    exerciseIndex: number,
    setIndex: number,
    patch: Partial<TemplateSetPrescriptionDraft>,
  ) {
    setDraft((current) => {
      if (!current) return current;
      const exercises = current.exercises.map((exercise, i) => {
        if (i !== exerciseIndex) return exercise;
        const sets = [...(exercise.prescribedSets ?? [])];
        sets[setIndex] = { ...sets[setIndex], ...patch };
        return { ...exercise, prescribedSets: sets };
      });
      return { ...current, exercises };
    });
  }

  function mutateSets(
    exerciseIndex: number,
    mutate: (
      sets: TemplateSetPrescriptionDraft[],
    ) => TemplateSetPrescriptionDraft[],
  ) {
    setDraft((current) => {
      if (!current) return current;
      const exercises = current.exercises.map((exercise, i) => {
        if (i !== exerciseIndex) return exercise;
        const nextSets = mutate([...(exercise.prescribedSets ?? [])]).map(
          (set, index) => ({ ...set, orderIndex: index }),
        );
        return { ...exercise, prescribedSets: nextSets };
      });
      return { ...current, exercises };
    });
  }

  function save() {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      setValidationError("Give the template a name before saving.");
      return;
    }
    if (draft.exercises.length === 0) {
      setValidationError("Add at least one exercise before saving.");
      return;
    }
    saveTemplate({ ...draft, name });
    navigate("/");
  }

  return (
    <main className="page">
      <div className="list-header">
        <h1>{id === "new" ? "New Template" : "Edit Template"}</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => navigate("/")}
          >
            Cancel
          </button>
          <button type="button" className="button" onClick={save}>
            Save (queues for push)
          </button>
        </div>
      </div>

      {validationError && (
        <div className="error-banner">{validationError}</div>
      )}

      <label className="field-label" htmlFor="template-name">
        Template name
      </label>
      <input
        id="template-name"
        type="text"
        value={draft.name}
        placeholder="e.g. Push Day A"
        style={{ width: "100%", maxWidth: 520 }}
        onChange={(event) =>
          setDraft((current) =>
            current ? { ...current, name: event.target.value } : current,
          )
        }
      />

      <div style={{ margin: "18px 0" }}>
        <ExercisePicker
          onPick={(exercise) =>
            setDraft((current) =>
              current
                ? {
                    ...current,
                    exercises: [
                      ...current.exercises,
                      {
                        exerciseId: exercise.id,
                        prescribedSets: [
                          { ...DEFAULT_SET, orderIndex: 0 },
                          { ...DEFAULT_SET, orderIndex: 1 },
                          { ...DEFAULT_SET, orderIndex: 2 },
                        ],
                        category: "",
                      },
                    ],
                  }
                : current,
            )
          }
        />
      </div>

      {draft.exercises.map((exercise, exerciseIndex) => (
        <section
          key={`${exercise.exerciseId}-${exerciseIndex}`}
          className="exercise-card"
        >
          <div className="exercise-card__header">
            <h2>
              {exerciseDisplayName(exercise.exerciseId)}
              {isUnknownExercise(exercise.exerciseId) && (
                <span
                  className="badge badge--pending"
                  title="This exercise is not in the built-in catalog (probably a custom exercise created on your phone — custom exercises do not sync yet). It still works on your phone."
                >
                  unknown here
                </span>
              )}
            </h2>
            <button
              type="button"
              className="button button--danger"
              onClick={() =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        exercises: current.exercises.filter(
                          (_, i) => i !== exerciseIndex,
                        ),
                      }
                    : current,
                )
              }
            >
              Remove exercise
            </button>
          </div>

          <div className="set-table-wrap">
            <table className="set-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Reps min</th>
                  <th>Reps max</th>
                  <th>Weight (kg)</th>
                  <th>Time (s)</th>
                  <th>Rest (s)</th>
                  <th>RPE</th>
                  <th>RIR</th>
                  <th>Extras</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(exercise.prescribedSets ?? []).map((set, setIndex) => (
                  <tr key={setIndex}>
                    <td>{setIndex + 1}</td>
                    <td>
                      <select
                        aria-label="Set type"
                        value={
                          EDITABLE_SET_TYPES.includes(set.setType)
                            ? set.setType
                            : "working"
                        }
                        onChange={(event) =>
                          updateSet(exerciseIndex, setIndex, {
                            setType: event.target.value as SetTypeWire,
                          })
                        }
                      >
                        {EDITABLE_SET_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {numberInput(set.targetRepsMin, (next) =>
                        updateSet(exerciseIndex, setIndex, {
                          targetRepsMin: next,
                        }),
                        { label: "Target reps min" },
                      )}
                    </td>
                    <td>
                      {numberInput(set.targetRepsMax, (next) =>
                        updateSet(exerciseIndex, setIndex, {
                          targetRepsMax: next,
                        }),
                        { label: "Target reps max" },
                      )}
                    </td>
                    <td>
                      {numberInput(set.targetWeight, (next) =>
                        updateSet(exerciseIndex, setIndex, {
                          targetWeight: next,
                        }),
                        { label: "Target weight", step: "0.5" },
                      )}
                    </td>
                    <td>
                      {numberInput(set.targetTimeSeconds, (next) =>
                        updateSet(exerciseIndex, setIndex, {
                          targetTimeSeconds: next,
                        }),
                        { label: "Target time seconds" },
                      )}
                    </td>
                    <td>
                      {numberInput(set.restSeconds, (next) =>
                        updateSet(exerciseIndex, setIndex, {
                          restSeconds: next,
                        }),
                        { label: "Rest seconds" },
                      )}
                    </td>
                    <td>
                      {numberInput(set.targetRpe, (next) =>
                        updateSet(exerciseIndex, setIndex, { targetRpe: next }),
                        { label: "Target RPE", step: "0.5", width: 60 },
                      )}
                    </td>
                    <td>
                      {numberInput(set.targetRir, (next) =>
                        updateSet(exerciseIndex, setIndex, { targetRir: next }),
                        { label: "Target RIR", width: 60 },
                      )}
                    </td>
                    <td>
                      {set.setType === "dropset" && (
                        <span className="extras">
                          drop&nbsp;%
                          {numberInput(set.dropPercent, (next) =>
                            updateSet(exerciseIndex, setIndex, {
                              dropPercent: next,
                            }),
                            { label: "Drop percent", width: 60 },
                          )}
                          stages
                          {numberInput(set.dropStages, (next) =>
                            updateSet(exerciseIndex, setIndex, {
                              dropStages: next,
                            }),
                            { label: "Drop stages", width: 54 },
                          )}
                        </span>
                      )}
                      {set.setType === "superset" && (
                        <span className="extras">
                          group
                          <input
                            type="text"
                            aria-label="Superset group"
                            value={set.supersetGroupId ?? ""}
                            placeholder="A"
                            style={{ width: 60 }}
                            onChange={(event) =>
                              updateSet(exerciseIndex, setIndex, {
                                supersetGroupId:
                                  event.target.value.trim() || null,
                              })
                            }
                          />
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="button button--ghost"
                          title="Move set up"
                          disabled={setIndex === 0}
                          onClick={() =>
                            mutateSets(exerciseIndex, (sets) => {
                              [sets[setIndex - 1], sets[setIndex]] = [
                                sets[setIndex],
                                sets[setIndex - 1],
                              ];
                              return sets;
                            })
                          }
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="button button--ghost"
                          title="Move set down"
                          disabled={
                            setIndex ===
                            (exercise.prescribedSets?.length ?? 0) - 1
                          }
                          onClick={() =>
                            mutateSets(exerciseIndex, (sets) => {
                              [sets[setIndex], sets[setIndex + 1]] = [
                                sets[setIndex + 1],
                                sets[setIndex],
                              ];
                              return sets;
                            })
                          }
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="button button--ghost"
                          title="Duplicate set"
                          onClick={() =>
                            mutateSets(exerciseIndex, (sets) => {
                              sets.splice(setIndex + 1, 0, { ...set });
                              return sets;
                            })
                          }
                        >
                          ⧉
                        </button>
                        <button
                          type="button"
                          className="button button--danger"
                          title="Remove set"
                          onClick={() =>
                            mutateSets(exerciseIndex, (sets) => {
                              sets.splice(setIndex, 1);
                              return sets;
                            })
                          }
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            className="button button--ghost"
            onClick={() =>
              mutateSets(exerciseIndex, (sets) => {
                const last = sets[sets.length - 1];
                sets.push(last ? { ...last } : { ...DEFAULT_SET });
                return sets;
              })
            }
          >
            + Add set
          </button>
        </section>
      ))}
    </main>
  );
}
