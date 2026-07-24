import { Link, useNavigate } from "react-router-dom";
import { useBuilder } from "../state/BuilderContext";

function originLabel(channel: string): string {
  switch (channel) {
    case "web_app":
      return "web";
    case "phone_app":
      return "phone";
    case "watch_app":
      return "watch";
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
          <h1>Your Templates</h1>
          <p className="muted">
            Build here, push to your phone, train anywhere.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => void hydrate()}
            disabled={hydration.kind === "loading"}
          >
            Refresh
          </button>
          <button
            type="button"
            className="button"
            onClick={() => navigate("/edit/new")}
          >
            + New template
          </button>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="push-panel">
          <div>
            <strong>{pending.length}</strong> change(s) waiting to be pushed to
            your phone:
            <ul className="push-panel__list">
              {pending.map((item) => (
                <li key={item.envelope.header.lastMutationId}>
                  {item.label}
                  {item.lastFailure && (
                    <span className="push-panel__failure">
                      {" "}
                      — rejected: {item.lastFailure.errorCode}
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
            {pushState.kind === "pushing" ? "Pushing…" : "Push to phone"}
          </button>
        </div>
      )}

      {pushState.kind === "done" && (
        <div className="ok-banner">
          {pushState.accepted} change(s) pushed. Open THYMOS on your phone and
          run Sync to receive them.
        </div>
      )}
      {pushState.kind === "error" && (
        <div className="error-banner">
          {pushState.message}
          {pushState.retryAfterSeconds !== undefined &&
            ` Try again in ~${pushState.retryAfterSeconds}s.`}
        </div>
      )}

      {hydration.kind === "loading" && (
        <div className="card" role="status">
          <div className="spinner" aria-hidden="true" />
          <p className="muted" style={{ textAlign: "center" }}>
            Loading your templates from sync…
          </p>
        </div>
      )}

      {hydration.kind === "error" && (
        <div className="error-banner">
          Could not load templates: {hydration.message}{" "}
          <button
            type="button"
            className="button button--ghost"
            onClick={() => void hydrate()}
          >
            Retry
          </button>
        </div>
      )}

      {hydration.kind === "ready" && templates.length === 0 && (
        <div className="card">
          <p className="muted">
            No templates yet. Create your first one — it will appear on your
            phone after you push and sync.
          </p>
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
                <span>{template.exerciseCount} exercises</span>
                <span>
                  {new Date(
                    template.lastModifiedAtEpochMs,
                  ).toLocaleDateString()}
                </span>
                <span className="badge badge--origin">
                  {originLabel(template.originInputChannel)}
                </span>
                {template.hasPendingChanges && (
                  <span className="badge badge--pending">not pushed yet</span>
                )}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link
                className="button button--ghost"
                to={`/edit/${template.entityId}`}
              >
                Edit
              </Link>
              <button
                type="button"
                className="button button--danger"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete "${template.name}"? The deletion is applied to your phone on its next sync.`,
                    )
                  ) {
                    deleteTemplate(template.entityId, template.name);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="list-header" style={{ marginTop: 40 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem" }}>Your Programs</h1>
          <p className="muted">
            Multi-week plans built from your templates (week × day schedule).
          </p>
        </div>
        <button
          type="button"
          className="button"
          onClick={() => navigate("/programs/new")}
        >
          + New program
        </button>
      </div>

      {hydration.kind === "ready" && programs.length === 0 && (
        <div className="card">
          <p className="muted">
            No programs yet. A program assigns your templates to a week-by-week
            schedule and guides you through it on your phone.
          </p>
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
                  {program.durationWeeks} weeks · {program.sessionsPerWeek}
                  /week · {program.sessionCount} sessions
                </span>
                <span className="badge badge--origin">
                  {originLabel(program.originInputChannel)}
                </span>
                {program.hasPendingChanges && (
                  <span className="badge badge--pending">not pushed yet</span>
                )}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link
                className="button button--ghost"
                to={`/programs/${program.entityId}`}
              >
                Edit
              </Link>
              <button
                type="button"
                className="button button--danger"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete "${program.name}" and its sessions? The deletion is applied to your phone on its next sync.`,
                    )
                  ) {
                    deleteProgram(program.entityId, program.name);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
