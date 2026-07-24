import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBuilder } from "../state/BuilderContext";
import {
  newProgramDraft,
  programDraftFromPayloads,
} from "../models/programDraft";
import {
  PROGRAM_CATEGORIES,
  PROGRAM_GOALS,
  PROGRAM_LEVELS,
  type ProgramGoalWire,
  type ProgramSessionDraft,
  type ProgressiveProgramDraft,
} from "../models/programWire";
import { dartUtcIso } from "../models/wire";
import { getOrCreateDeviceId } from "../state/deviceId";

/** One assignable day cell in the week × day grid. */
interface SlotState {
  /** Existing session id (kept stable so edits don't churn identities). */
  sessionId: string | null;
  templateId: string;
  title: string;
  /** Phone-authored explicit prescriptions, passed through untouched. */
  prescriptions: Record<string, unknown>[];
  createdAt: string | null;
}

type Grid = (SlotState | null)[][];

function emptyGrid(weeks: number, perWeek: number): Grid {
  return Array.from({ length: weeks }, () =>
    Array.from({ length: perWeek }, () => null),
  );
}

function gridFromDraft(draft: ProgressiveProgramDraft): Grid {
  const grid = emptyGrid(draft.durationWeeks, draft.sessionsPerWeek);
  for (const session of draft.sessions) {
    const week = session.weekIndex - 1;
    const day = session.dayIndex - 1;
    if (week < 0 || week >= grid.length) continue;
    if (day < 0 || day >= grid[week].length) continue;
    grid[week][day] = {
      sessionId: session.id,
      templateId: session.templateId,
      title: session.title,
      prescriptions: session.prescriptions,
      createdAt: session.createdAt,
    };
  }
  return grid;
}

function resizeGrid(grid: Grid, weeks: number, perWeek: number): Grid {
  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: perWeek }, (_, day) => grid[week]?.[day] ?? null),
  );
}

export default function ProgramEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { programs, templates, saveProgram, hydration } = useBuilder();

  const initialDraft: ProgressiveProgramDraft | null = useMemo(() => {
    if (id === "new") {
      return newProgramDraft(getOrCreateDeviceId());
    }
    const existing = programs.find((program) => program.entityId === id);
    if (!existing?.payload) return null;
    return programDraftFromPayloads(existing.payload, existing.sessionPayloads);
    // Captured once: the editor owns its state after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [draft, setDraft] = useState<ProgressiveProgramDraft | null>(
    initialDraft,
  );
  const [grid, setGrid] = useState<Grid>(() =>
    initialDraft ? gridFromDraft(initialDraft) : [],
  );
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
            Program not found. It may not have been pushed/synced yet.{" "}
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

  function patchDraft(patch: Partial<ProgressiveProgramDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function setDimensions(weeks: number, perWeek: number) {
    patchDraft({ durationWeeks: weeks, sessionsPerWeek: perWeek });
    setGrid((current) => resizeGrid(current, weeks, perWeek));
  }

  function patchSlot(week: number, day: number, slot: SlotState | null) {
    setGrid((current) =>
      current.map((weekSlots, w) =>
        w === week
          ? weekSlots.map((existing, d) => (d === day ? slot : existing))
          : weekSlots,
      ),
    );
  }

  function copyWeekOneToAll() {
    setGrid((current) =>
      current.map((weekSlots, w) =>
        w === 0
          ? weekSlots
          : current[0].map((source) =>
              source
                ? {
                    // Copies become new sessions on save; explicit
                    // prescriptions are not duplicated (phone falls back to
                    // the template's sets).
                    sessionId: null,
                    templateId: source.templateId,
                    title: source.title,
                    prescriptions: [],
                    createdAt: null,
                  }
                : null,
            ),
      ),
    );
  }

  function templateName(templateId: string): string {
    const found = templates.find((entry) => entityIdOf(entry) === templateId);
    return found?.name ?? templateId;
  }

  function entityIdOf(entry: { entityId: string }): string {
    return entry.entityId;
  }

  function save() {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      setValidationError("Give the program a name before saving.");
      return;
    }
    const now = dartUtcIso(new Date());
    const sessions: ProgramSessionDraft[] = [];
    grid.forEach((weekSlots, week) => {
      weekSlots.forEach((slot, day) => {
        if (!slot?.templateId) return;
        sessions.push({
          id: slot.sessionId ?? crypto.randomUUID(),
          programId: draft.id,
          templateId: slot.templateId,
          title: slot.title.trim() || templateName(slot.templateId),
          weekIndex: week + 1,
          dayIndex: day + 1,
          programVersion: draft.programVersion,
          createdAt: slot.createdAt ?? now,
          updatedAt: now,
          prescriptions: slot.prescriptions,
          deviceId: draft.deviceId || getOrCreateDeviceId(),
        });
      });
    });
    if (sessions.length === 0) {
      setValidationError(
        "Assign a template to at least one day before saving.",
      );
      return;
    }
    saveProgram({ ...draft, name, updatedAt: now, sessions });
    navigate("/");
  }

  return (
    <main className="page">
      <div className="list-header">
        <h1>{id === "new" ? "New Program" : "Edit Program"}</h1>
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

      {validationError && <div className="error-banner">{validationError}</div>}

      <div className="program-meta">
        <div>
          <label className="field-label" htmlFor="program-name">
            Program name
          </label>
          <input
            id="program-name"
            type="text"
            value={draft.name}
            placeholder="e.g. PPL 8-Week"
            style={{ width: "100%" }}
            onChange={(event) => patchDraft({ name: event.target.value })}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="program-description">
            Description (optional)
          </label>
          <input
            id="program-description"
            type="text"
            value={draft.description ?? ""}
            style={{ width: "100%" }}
            onChange={(event) =>
              patchDraft({ description: event.target.value || null })
            }
          />
        </div>
        <div>
          <span className="field-label">Category</span>
          <select
            aria-label="Category"
            value={draft.category}
            onChange={(event) =>
              patchDraft({
                category: event.target
                  .value as ProgressiveProgramDraft["category"],
              })
            }
          >
            {PROGRAM_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="field-label">Level</span>
          <select
            aria-label="Level"
            value={draft.level}
            onChange={(event) =>
              patchDraft({
                level: event.target.value as ProgressiveProgramDraft["level"],
              })
            }
          >
            {PROGRAM_LEVELS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="field-label">Goals</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PROGRAM_GOALS.map((goal) => {
              const selected = draft.goals.includes(goal);
              return (
                <button
                  key={goal}
                  type="button"
                  className={
                    selected ? "goal-chip goal-chip--on" : "goal-chip"
                  }
                  aria-pressed={selected}
                  onClick={() => {
                    const next = selected
                      ? draft.goals.filter((entry) => entry !== goal)
                      : [...draft.goals, goal];
                    // At least one goal, like the mobile creator.
                    if (next.length > 0) {
                      patchDraft({ goals: next as ProgramGoalWire[] });
                    }
                  }}
                >
                  {goal}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <span className="field-label">Weeks</span>
          <select
            aria-label="Duration weeks"
            value={draft.durationWeeks}
            onChange={(event) =>
              setDimensions(Number(event.target.value), draft.sessionsPerWeek)
            }
          >
            {Array.from({ length: 16 }, (_, index) => index + 1).map(
              (option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ),
            )}
          </select>
        </div>
        <div>
          <span className="field-label">Sessions / week</span>
          <select
            aria-label="Sessions per week"
            value={draft.sessionsPerWeek}
            onChange={(event) =>
              setDimensions(draft.durationWeeks, Number(event.target.value))
            }
          >
            {Array.from({ length: 7 }, (_, index) => index + 1).map(
              (option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      <div className="list-header" style={{ marginTop: 24 }}>
        <h2 style={{ margin: 0 }}>Schedule</h2>
        <button
          type="button"
          className="button button--ghost"
          onClick={copyWeekOneToAll}
          disabled={draft.durationWeeks < 2}
        >
          Copy week 1 to all weeks
        </button>
      </div>
      {templates.length === 0 && (
        <div className="error-banner">
          You have no templates yet — program days are built from your
          templates. Create a template first.
        </div>
      )}

      {grid.map((weekSlots, week) => (
        <section key={week} className="week-card">
          <span className="mono-label">Week {week + 1}</span>
          <div className="week-card__days">
            {weekSlots.map((slot, day) => (
              <div key={day} className="day-slot">
                <span className="day-slot__label">Day {day + 1}</span>
                <select
                  aria-label={`Week ${week + 1} day ${day + 1} template`}
                  value={slot?.templateId ?? ""}
                  onChange={(event) => {
                    const templateId = event.target.value;
                    if (!templateId) {
                      patchSlot(week, day, null);
                      return;
                    }
                    patchSlot(week, day, {
                      sessionId: slot?.sessionId ?? null,
                      templateId,
                      title: slot?.title ?? "",
                      prescriptions: slot?.prescriptions ?? [],
                      createdAt: slot?.createdAt ?? null,
                    });
                  }}
                >
                  <option value="">— rest —</option>
                  {templates.map((template) => (
                    <option key={template.entityId} value={template.entityId}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {slot && (
                  <input
                    type="text"
                    aria-label={`Week ${week + 1} day ${day + 1} title`}
                    placeholder={templateName(slot.templateId)}
                    value={slot.title}
                    onChange={(event) =>
                      patchSlot(week, day, {
                        ...slot,
                        title: event.target.value,
                      })
                    }
                  />
                )}
                {slot && slot.prescriptions.length > 0 && (
                  <span
                    className="badge badge--origin"
                    title="This day has explicit per-session prescriptions (edited in the app). They are preserved by web edits."
                  >
                    rx from app
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
