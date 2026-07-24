import { Link, useNavigate } from "react-router-dom";
import { useBuilder } from "../state/BuilderContext";
import { t } from "../i18n/locale";

function originLabel(channel: string): string {
  switch (channel) {
    case "web_app":
      return t("originWeb");
    case "phone_app":
      return t("originPhone");
    case "watch_app":
      return t("originWatch");
    default:
      return channel;
  }
}

export default function TemplateListPage() {
  const {
    hydration,
    pushState,
    templates,
    programs,
    pending,
    hydrate,
    deleteTemplate,
    deleteProgram,
    pushPending,
  } = useBuilder();
  const navigate = useNavigate();

  return (
    <main className="page">
      <div className="list-header">
        <div>
          <h1>{t("yourTemplates")}</h1>
          <p className="muted">{t("listTagline")}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => void hydrate()}
            disabled={hydration.kind === "loading"}
          >
            {t("refresh")}
          </button>
          <button
            type="button"
            className="button"
            onClick={() => navigate("/edit/new")}
          >
            {t("newTemplate")}
          </button>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="push-panel">
          <div>
            {t("pendingHeader", { n: pending.length })}
            <ul className="push-panel__list">
              {pending.map((item) => (
                <li key={item.envelope.header.lastMutationId}>
                  {item.label}
                  {item.lastFailure && (
                    <span className="push-panel__failure">
                      {" "}
                      — {t("rejectedLabel", { code: item.lastFailure.errorCode })}
                      {item.lastFailure.message
                        ? ` (${item.lastFailure.message})`
                        : ""}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            className="button"
            onClick={() => void pushPending()}
            disabled={pushState.kind === "pushing"}
          >
            {pushState.kind === "pushing" ? t("pushing") : t("pushToPhone")}
          </button>
        </div>
      )}

      {pushState.kind === "done" && (
        <div className="ok-banner">
          {t("pushedDone", { n: pushState.accepted })}
        </div>
      )}
      {pushState.kind === "error" && (
        <div className="error-banner">
          {pushState.message}
          {pushState.retryAfterSeconds !== undefined &&
            ` ${t("retryInSec", { s: pushState.retryAfterSeconds })}`}
        </div>
      )}

      {hydration.kind === "loading" && (
        <div className="card" role="status">
          <div className="spinner" aria-hidden="true" />
          <p className="muted" style={{ textAlign: "center" }}>
            {t("loadingTemplates")}
          </p>
        </div>
      )}

      {hydration.kind === "error" && (
        <div className="error-banner">
          {t("loadFailed", { message: hydration.message })}{" "}
          <button
            type="button"
            className="button button--ghost"
            onClick={() => void hydrate()}
          >
            {t("retry")}
          </button>
        </div>
      )}

      {hydration.kind === "ready" && templates.length === 0 && (
        <div className="card">
          <p className="muted">{t("emptyTemplates")}</p>
        </div>
      )}

      <ul className="template-list">
        {templates.map((template) => (
          <li key={template.entityId} className="template-row">
            <div className="template-row__main">
              <Link
                to={`/edit/${template.entityId}`}
                className="template-row__name"
              >
                {template.name}
              </Link>
              <span className="template-row__meta">
                <span>{t("exercisesCount", { n: template.exerciseCount })}</span>
                <span>
                  {new Date(
                    template.lastModifiedAtEpochMs,
                  ).toLocaleDateString()}
                </span>
                <span className="badge badge--origin">
                  {originLabel(template.originInputChannel)}
                </span>
                {template.hasPendingChanges && (
                  <span className="badge badge--pending">
                    {t("notPushedYet")}
                  </span>
                )}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link
                className="button button--ghost"
                to={`/edit/${template.entityId}`}
              >
                {t("edit")}
              </Link>
              <button
                type="button"
                className="button button--danger"
                onClick={() => {
                  if (
                    window.confirm(
                      t("deleteTemplateConfirm", { name: template.name }),
                    )
                  ) {
                    deleteTemplate(template.entityId, template.name);
                  }
                }}
              >
                {t("deleteLabel")}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="list-header" style={{ marginTop: 40 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem" }}>{t("yourPrograms")}</h1>
          <p className="muted">{t("programsTagline")}</p>
        </div>
        <button
          type="button"
          className="button"
          onClick={() => navigate("/programs/new")}
        >
          {t("newProgram")}
        </button>
      </div>

      {hydration.kind === "ready" && programs.length === 0 && (
        <div className="card">
          <p className="muted">{t("emptyPrograms")}</p>
        </div>
      )}

      <ul className="template-list">
        {programs.map((program) => (
          <li key={program.entityId} className="template-row">
            <div className="template-row__main">
              <Link
                to={`/programs/${program.entityId}`}
                className="template-row__name"
              >
                {program.name}
              </Link>
              <span className="template-row__meta">
                <span>
                  {t("programSummary", {
                    w: program.durationWeeks,
                    s: program.sessionsPerWeek,
                    c: program.sessionCount,
                  })}
                </span>
                <span className="badge badge--origin">
                  {originLabel(program.originInputChannel)}
                </span>
                {program.hasPendingChanges && (
                  <span className="badge badge--pending">
                    {t("notPushedYet")}
                  </span>
                )}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link
                className="button button--ghost"
                to={`/programs/${program.entityId}`}
              >
                {t("edit")}
              </Link>
              <button
                type="button"
                className="button button--danger"
                onClick={() => {
                  if (
                    window.confirm(
                      t("deleteProgramConfirm", { name: program.name }),
                    )
                  ) {
                    deleteProgram(program.entityId, program.name);
                  }
                }}
              >
                {t("deleteLabel")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
