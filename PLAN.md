# Terrastories Remediation Plan

## 1. Objective & Scope
- Prevent disruptive Heroku-forced Postgres upgrade by rehearsing and executing our own controlled upgrade to a supported version.
- Modernize backend and frontend dependency stacks (Ruby/Rails, Node/MJS, mapping libraries) while maintaining app stability.
- Resolve current map style regressions and lay groundwork for future verification.
- Deliver guardrails: staging parity, automated tests, health checks, backups, monitoring, and documented rollback paths.

## 2. Current Landscape (Discovery So Far)
- **Application stack**: Rails 7.0.0 app with React front-end via Shakapacker. Tests: RSpec (`rails/spec`) and Jest (`rails/spec/javascript`). Procfile runs `bundle exec rails server`.
- **Runtime drift**: `Gemfile` pins Ruby `3.0.6`, `.ruby-version` contains `2.7.8`, local `ruby -v` reports `3.0.2`. Need to confirm Heroku runtime and align to a supported version (target 3.2.x).
- **Node toolchain**: Node `20.19.0` locally; `package.json` depends on older major packages (Jest 24, ESLint 7, Mapbox GL 2.x, MapLibre 3.6). `npm outdated` shows many missing/outdated deps—indicative of a stale lockfile and missing install.
- **Database (local)**: Docker compose uses `postgres:11`. Actual Heroku Postgres version/plan/extensions unknown—must fetch via CLI.
- **Mapping stack**: Uses `mapbox-gl`, `maplibre-gl`, `protomaps-themes-base`, custom `mapStyleLayers`. Regressions likely tied to library/API drift or style asset mismatches.
- **Gaps**: No `app.json` or Heroku metadata committed. Need definitive info on stack/buildpacks/addons, Postgres extensions (e.g., PostGIS), backup schedules, CI setup, and environment variables for mapping tokens.

- [x] Align local tooling: ensure Docker workflow uses Postgres 11 (baseline) plus containers for 13/16; confirm Ruby, Node, Yarn versions installed locally.
- [x] Baseline data: capture logical dump (`pg_dump -Fc`) from the local Postgres 11 instance and store under `backups/` (git-ignored).
- [x] Catalogue extensions used locally (via `psql \dx`) and confirm they are compatible with Postgres 16 images.
- [ ] Inventory automated tests (RSpec, Jest, lint) and document command invocations for local runs.
- [ ] Gather mapping configuration (tokens, style URLs) from `.env.example` and confirm local substitutes exist.
- [ ] Record any Heroku-specific information that will eventually be required (stack, addons, backups) but defer CLI access until the local rehearsal passes.

## 4. Postgres Upgrade Strategy
- **Target**: Rehearse Postgres 11→13→16 upgrades entirely in Docker first, ensuring migrations/tests succeed against Postgres 16 before engaging any managed services. Once local rehearsals are green, replicate the process in staging/production via the documented Heroku commands.
- **Local prerequisites**:
  - Confirm extensions used by the app and verify availability in `postgres:13` and `postgres:16` images.
  - Ensure backups directory has sufficient disk space (≥ DB size ×2) and remains git-ignored.
  - Document local environment variables required to point Rails/Jest to alternative database URLs (see `DB-UPGRADE.md`).
- **Local rehearsal loop** (see `DB-UPGRADE.md` for commands):
  1. Capture logical backup from the Dockerised Postgres 11 instance (`pg_dump -Fc`).
  2. Restore into temporary Postgres 13 container, validate row counts and run migrations/tests.
  3. Repeat restore/validate against Postgres 16, run full RSpec + Jest suites, plus manual map smoke checks.
  4. Iterate until all tests pass and smoke checklist items are satisfied locally.
- **Heroku/Staging execution (deferred)**: only after the local rehearsal passes, reuse the scripted steps against staging and production (Heroku CLI sequences remain in `DB-UPGRADE.md`, marked as Phase 2).
- **Rollback plan**: `ROLLBACK-PLAN.md` now emphasises local restore steps first (Docker containers, backups directory). Heroku rollback notes are retained for later promotion once staging/prod work resumes.

## 5. Dependency Upgrade Roadmap
1. **Runtime alignment** (PR C1):
   - Decide target Ruby (3.2.x LTS) and Rails (7.1.x or 7.2). Update `.ruby-version`, `Gemfile`, bundler version, verify Heroku buildpack compatibility, update stack (likely `heroku-22`/`heroku-24`).
   - Run application test suite, linting, and fix deprecations.
2. **Backend gems** (PR C2+):
   - Use `bundle outdated` (post bundler install) to prioritize security patches (e.g., `pg`, `puma`, `aws-sdk-s3`, `flipper`).
   - Group updates by concern (authentication, geospatial, asset pipeline) to keep diffs reviewable.
3. **Frontend toolchain** (PR C3+):
   - Upgrade build tooling (Webpack 5→stable, Babel 7.28, Shakapacker 8) ensuring compatibility with Rails asset pipeline.
   - Modernize lint/test stack (ESLint 9, Jest ≥29, React 18 latest) with necessary config updates.
   - Update mapping libraries (MapLibre 5.x, Mapbox GL 3.x or migrate fully to MapLibre) and dependent turf/protomaps packages.
4. **Validation**: Each PR runs full CI, updates `DEPENDENCY-AUDIT.md` with package, current vs target versions, key release notes, and manual test notes.

## 6. Mapping Regression Investigation & Fix
- **Reproduce**: Set up staging with problematic map views; capture browser console/network errors and verify style JSON endpoints.
- **Analysis**: Compare style definitions, font/sprite endpoints, token requirements, and library expectations post-upgrade.
- **Solutions**: Align on single map library (MapLibre recommended), update style loader (`mapStyleLayers`), ensure glyph assets accessible, adjust basemap config or token usage.
- **Verification**: Add automated smoke test (headless browser screenshot or DOM assertions) plus unit coverage for `mapStyleLayers`. Document root cause and resolution in `MAPPING-STYLES-FIX.md`.

- **Local environment stability**: ensure Docker Compose + scripts cover dev/test workflows and Postgres upgrade rehearsal. Heroku staging parity preparations are deferred until the local phase is complete.
- **CI enhancements (PR A)**:
  - Add workflow to run RSpec, Jest, lint, and minimal integration smoke tests on every PR.
  - Introduce `/healthz` endpoint or reuse existing status checks for uptime monitoring.
  - Add smoke test scripts to validate login, story view, and map rendering (potentially via Playwright).
- **Backups & Monitoring**:
  - Establish recurring local backups (logical dumps) and periodically test restores (documented in `DB-UPGRADE.md`).
  - When progressing to staging/prod, enable managed backups/alerts as originally planned.
- **Documentation**: Maintain `SMOKE-TEST-CHECKLIST.md`, `ROLLBACK-PLAN.md`, `DB-UPGRADE.md`, and `DEPENDENCY-AUDIT.md` as living docs.

## 8. PR & Documentation Plan
- **PR A**: CI pipelines, staging health checks, smoke test harness.
- **PR B**: Postgres upgrade automation scripts + `DB-UPGRADE.md` instructions.
- **PR C-series**: Dependency upgrades grouped logically (runtime, backend gems, frontend packages, mapping libraries) with corresponding sections in `DEPENDENCY-AUDIT.md`.
- **PR Z**: Mapping regression fix + tests, supported by `MAPPING-STYLES-FIX.md`.
- **Docs**: In addition to above, maintain `SMOKE-TEST-CHECKLIST.md` and `ROLLBACK-PLAN.md` as part of relevant PRs.

## 9. Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Unknown Postgres extensions or large tables extend downtime | Medium | High | Collect extension list early, rehearse upgrades in staging, budget buffer time. |
| Ruby/Rails upgrade exposes latent bugs | High | Medium | Incremental PRs, expanded automated tests, feature flags for risky areas. |
| Mapping libraries introduce breaking changes | High | Medium | Upgrade in isolated branches, add regression tests, provide toggle to fallback style. |
| Stack/buildpack upgrade fails slug compilation | Medium | High | Test on staging, use review apps if available, prepare fallback buildpacks. |
| Secrets/token misconfiguration in staging | Medium | Medium | Document required env vars, request staging-safe tokens, validate early. |

## 10. Timeline (Tentative)
- **Week 1**: Finish local discovery checklist, capture Postgres 11 baseline backup, publish `DB-UPGRADE.md` and initial `DEPENDENCY-AUDIT.md`.
- **Week 1–2**: Implement PR A (CI + local smoke harness), populate `SMOKE-TEST-CHECKLIST.md` with local focus.
- **Week 2–3**: Complete Postgres upgrade rehearsals in Docker (11→13→16) and document outcomes; update `ROLLBACK-PLAN.md` with local restore procedures.
- **Week 3–4**: Execute dependency upgrade PRs sequentially (runtime → backend → frontend/mapping) while continuously validating against Postgres 16 locally.
- **Week 4–5**: Resolve mapping regressions (PR Z) with automated validation and map smoke tests.
- **Post-local sign-off**: Transition plan to staging/prod (rerun rehearsed commands using Heroku CLI, enable managed backups/monitoring, announce maintenance windows).

## 11. Access Requirements
- Heroku pipeline access (production & staging) with permissions to manage addons, run `heroku pg:*`, and modify config vars.
- GitHub repository write access to create branches, configure CI workflows, and open PRs.
- Mapbox/Protomaps/S3 credentials (read-only for staging) to validate map rendering.
- Contact point for scheduling maintenance windows and communicating downtime notices.

## 12. Outstanding Questions
- What are the exact Heroku app names (prod & staging)?
- Are there existing monitoring/logging integrations (e.g., Sentry, Rollbar, New Relic)?
- Any external consumers (APIs, webhooks) that require notification before downtime?
- Do we have dedicated staging map tokens/assets, or should we provision new ones?

## 13. Next Steps
1. Obtain required access to Heroku and related services to finish the discovery checklist.
2. Populate `DB-UPGRADE.md`, `DEPENDENCY-AUDIT.md`, and `ROLLBACK-PLAN.md` scaffolds based on gathered data.
3. Stand up CI guardrails and staging health checks (PR A) before touching production resources.
