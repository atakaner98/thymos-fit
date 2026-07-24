# THYMOS Web Routine Builder

Vite + React + TypeScript SPA served from `https://thymos.fit/builder/`.
Pro users sign in with the email of their THYMOS cloud-sync account (magic
link) and build workout templates that are pushed to their phone through the
Ironclad Sync API v1 (`sync-v1-push` / `sync-v1-pull` Supabase edge
functions).

Plan of record: `ironclad_app/plans_and_documents/WEB_ROUTINE_BUILDER_PHASE1_PLAN.md`.

## Development

```bash
cd builder-src
cp .env.example .env.local   # fill in the two values
npm install
npm run dev                  # http://localhost:5173/builder/
```

## Tests / checks

```bash
npm run typecheck
npm test        # includes the cross-language golden contract test
```

The golden in `src/models/goldens/` must stay byte-identical with
`ironclad_app/workout_tracker/test/contract/goldens/` — the Dart test
`web_template_payload_golden_test.dart` enforces this when both repos are
checked out side by side.

## Build & deploy

```bash
npm run build   # emits ../builder/ (committed static output) + auth page copy
```

The site deploys as plain static files (no Pages build step). Commit the
`builder/` output alongside the source change.

### One-time backend prerequisites

1. Deploy CORS-enabled sync functions from the app repo:
   `supabase functions deploy sync-v1-push sync-v1-pull`
2. Supabase Auth → URL Configuration → Redirect URLs — ADD (never edit
   existing entries; the mobile deep-link flow depends on them):
   - `https://thymos.fit/builder/auth/`
   - `http://localhost:5173/builder/auth/` (dev)

### Catalog refresh

When the app's exercise catalog changes, re-run in `ironclad_app`:

```bash
node scripts/export_web_exercise_catalog.mjs
```

then rebuild. Source of truth is the app asset; never hand-edit
`src/catalog/exercises.catalog.json`.

## Phase 1 limitations (by design)

- Progressive programs and weekly routines: Phase 2/3.
- Custom exercises do not sync (`sync.wave.prefs=false`); phone templates
  referencing them show an "unknown here" badge but survive round-trips.
- Set notes are local-only (HIGH sensitivity, Guardrail 5) — the web UI does
  not offer a note field and the sanitizer strips notes defensively.
- Pro gating is implicit: accounts only exist via the app's Pro cloud-sync
  setup, and the login never creates users (`shouldCreateUser: false`).
