import { Navigate, Route, Routes } from "react-router-dom";
import { missingConfigKeys } from "./config";
import { useSession, sessionEmail } from "./auth/useSession";
import { getSupabase } from "./auth/supabaseClient";
import LoginPage from "./pages/LoginPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";

function ConfigErrorScreen({ keys }: { keys: string[] }) {
  return (
    <main className="page page--narrow">
      <div className="card">
        <h1>Configuration missing</h1>
        <p className="muted">
          This build is missing required configuration values:{" "}
          {keys.join(", ")}. The builder cannot start without them.
        </p>
      </div>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="page page--narrow">
      <div className="card" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p className="muted" style={{ textAlign: "center" }}>
          Checking your session…
        </p>
      </div>
    </main>
  );
}

function HomePlaceholder({ email }: { email: string | null }) {
  return (
    <main className="page">
      <h1>Your Templates</h1>
      <p className="muted">
        Signed in as {email ?? "unknown"}. Template list arrives in the next
        build step.
      </p>
    </main>
  );
}

export default function App() {
  const missing = missingConfigKeys();
  const state = useSession();

  if (missing.length > 0) {
    return <ConfigErrorScreen keys={missing} />;
  }

  if (state.session === undefined) {
    return <LoadingScreen />;
  }

  const signedIn = state.hasAccountSession;
  const email = sessionEmail(state);

  return (
    <>
      {signedIn && (
        <header className="topbar">
          <div className="topbar__brand">
            THYMOS <span>Builder</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="muted">{email}</span>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => void getSupabase().auth.signOut()}
            >
              Sign out
            </button>
          </div>
        </header>
      )}
      <Routes>
        <Route path="/auth" element={<AuthCallbackPage />} />
        <Route
          path="/"
          element={
            signedIn ? <HomePlaceholder email={email} /> : <LoginPage />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
