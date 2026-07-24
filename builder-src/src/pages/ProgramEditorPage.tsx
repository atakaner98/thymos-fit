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
import { t } from "../i18n/locale";
import type { MessageKey } from "../i18n/messages";

/** Display labels only — wire values stay canonical enum strings. */
const CATEGORY_LABEL_KEYS: Record<string, MessageKey> = {
  bodybuilding: "catBodybuilding",
  powerlifting: "catPowerlifting",
  calisthenics: "catCalisthenics",
};
const LEVEL_LABEL_KEYS: Record<string, MessageKey> = {
  beginner: "levelBeginner",
  intermediate: "levelIntermediate",
  advanced: "levelAdvanced",
};
const GOAL_LABEL_KEYS: Record<string, MessageKey> = {
  hypertrophy: "goalHypertrophy",
  strength: "goalStrength",
  endurance: "goalEndurance",
};

function optionLabel(
  map: Record<string, MessageKey>,
  value: string,
): string {
  const key = map[value];
  return key ? t(key) : value;
}

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
            {t("programNotFound")}{" "}
            <button
              type="button"
              className="button button--ghost"
              onClick={() => navigate("/")}
            >
              {t("backToList")}
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
      setValidationError(t("validationProgramName"));
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
      setValidationError(t("validationAssignDay"));
      return;
    }
    saveProgram({ ...draft, name, updatedAt: now, sessions });
    navigate("/");
  }

  return (
    <main className="page">
      <div className="list-header">
        <h1>{id === "new" ? t("newProgramTitle") : t("editProgramTitle")}</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => navigate("/")}
          >
            {t("cancel")}
          </button>
          <button type="button" className="button" onClick={save}>
            {t("saveQueues")}
          </button>
        </div>
      </div>

      {validationError && <div className="error-banner">{validationError}</div>}

      <div className="program-meta">
        <div>
          <label className="field-label" htmlFor="program-name">
            {t("programNameLabel")}
          </label>
          <input
            id="program-name"
            type="text"
            value={draft.name}
            placeholder={t("programNamePh")}
            style={{ width: "100%" }}
            onChange={(event) => patchDraft({ name: event.target.value })}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="program-description">
            {t("descriptionLabel")}
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
          <span className="field-label">{t("categoryLabel")}</span>
          <select
            aria-label={t("categoryLabel")}
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
                {optionLabel(CATEGORY_LABEL_KEYS, option)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="field-label">{t("levelLabel")}</span>
          <select
            aria-label={t("levelLabel")}
            value={draft.level}
            onChange={(event) =>
              patchDraft({
                level: event.target.value as ProgressiveProgramDraft["level"],
              })
            }
          >
            {PROGRAM_LEVELS.map((option) => (
              <option key={option} value={option}>
                {optionLabel(LEVEL_LABEL_KEYS, option)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="field-label">{t("goalsLabel")}</span>
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
                  {optionLabel(GOAL_LABEL_KEYS, goal)}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <span className="field-label">{t("weeksLabel")}</span>
          <select
            aria-label={t("weeksLabel")}
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
          <span className="field-label">{t("sessionsPerWeekLabel")}</span>
          <select
            aria-label={t("sessionsPerWeekLabel")}
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
        <h2 style={{ margin: 0 }}>{t("scheduleTitle")}</h2>
        <button
          type="button"
          className="button button--ghost"
          onClick={copyWeekOneToAll}
          disabled={draft.durationWeeks < 2}
        >
          {t("copyWeek1")}
        </button>
      </div>
      {templates.length === 0 && (
        <div className="error-banner">{t("noTemplatesWarn")}</div>
      )}

      {grid.map((weekSlots, week) => (
        <section key={week} className="week-card">
          <span className="mono-label">{t("weekN", { n: week + 1 })}</span>
          <div className="week-card__days">
            {weekSlots.map((slot, day) => (
              <div key={day} className="day-slot">
                <span className="day-slot__label">
                  {t("dayN", { n: day + 1 })}
                </span>
                <select
                  aria-label={`${t("weekN", { n: week + 1 })} ${t("dayN", { n: day + 1 })}`}
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
                  <option value="">{t("restOption")}</option>
                  {templates.map((template) => (
                    <option key={template.entityId} value={template.entityId}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {slot && (
                  <input
                    type="text"
                    aria-label={`${t("weekN", { n: week + 1 })} ${t("dayN", { n: day + 1 })} — ${t("programNameLabel")}`}
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
                  <span className="badge badge--origin" title={t("rxTooltip")}>
                    {t("rxFromApp")}
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
