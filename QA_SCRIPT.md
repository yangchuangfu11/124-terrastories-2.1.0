# QA Verification Script

Use this script whenever we need to validate an environment after a Postgres or dependency upgrade. Work through the sections sequentially and record outcomes in the delivery notes.

## 1. Prerequisites
- Heroku CLI authenticated (`heroku whoami`).
- Access to the target app (`terrastories-staging`).
- Local repo synced with the branch under test.
- Docker installed for running the devcore image.

## 2. Environment Snapshot
1. Confirm app config:
   ```bash
   heroku apps:info --app terrastories-staging
   heroku config --app terrastories-staging
   ```
2. Capture Postgres details:
   ```bash
   heroku pg:info --app terrastories-staging
   heroku run --app terrastories-staging "psql --version"
   heroku run --app terrastories-staging "psql -d $DATABASE_URL -c 'SELECT version();'"
   heroku run --app terrastories-staging "psql -d $DATABASE_URL -c '\dx'"
   ```
3. Store row counts for comparison (keep artifact in `backups/`):
   ```bash
   heroku run --app terrastories-staging \
     "psql -d $DATABASE_URL -F $'\t' --no-align -c 'SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;'" \
     > backups/rowcounts-staging-$(date +%Y%m%d%H%M).tsv
   ```

## 3. Automated Test Pass
Run all automated test suites against the staging database dump to guarantee parity with local expectations.

Before running containers, export `DATABASE_URL_TEST` and `DATABASE_URL_DEV` to point at your restored Postgres 16 instances (see `DB-UPGRADE.md` for connection string examples).

1. Create a staging snapshot for local restore (optional but recommended):
   ```bash
   heroku pg:backups:capture --app terrastories-staging
   heroku pg:backups:download --app terrastories-staging
   ```
2. Restore snapshot into a local Postgres 16 container using the steps in `DB-UPGRADE.md` (sections 4–5).
3. Execute backend specs (ensure `DATABASE_URL_TEST` exports the Postgres 16 connection string from `DB-UPGRADE.md`):
   ```bash
   docker run --rm --network host \
     -e DATABASE_URL="$DATABASE_URL_TEST" \
     -e RAILS_ENV=test \
     -v "$(pwd)/rails:/api" -v "$(pwd)/data/media:/media" -v "$(pwd)/data/import/media:/api/import/media" \
     -w /api terrastories/devcore:latest bundle exec rails db:test:prepare

   docker run --rm --network host \
     -e DATABASE_URL="$DATABASE_URL_TEST" \
     -e RAILS_ENV=test \
     -v "$(pwd)/rails:/api" -v "$(pwd)/data/media:/media" -v "$(pwd)/data/import/media:/api/import/media" \
     -w /api terrastories/devcore:latest bundle exec rspec --format progress
   ```
4. Execute frontend tests (`DATABASE_URL_DEV` should target the Postgres 16 dev DB):
   ```bash
   docker run --rm --network host \
     -e DATABASE_URL="$DATABASE_URL_DEV" \
     -v "$(pwd)/rails:/api" -v "$(pwd)/data/media:/media" -v "$(pwd)/data/import/media:/api/import/media" \
     -w /api terrastories/devcore:latest yarn test --runInBand
   ```
   Document any expected failures (e.g., pending work on legacy lint debt) and link to the blocking issue.

## 4. Application Smoke Test
Use staging credentials. Follow the steps below and record the result (Pass/Fail + notes).

1. **Login** – Load `/` and confirm assets load with no red console errors; log in as admin and standard user.
2. **Story CRUD** – Create a story with at least one place, media attachment, and verify it appears on the map; edit and archive/delete as permissions allow.
3. **Map Rendering** – Confirm markers and clusters render with both Mapbox and Protomaps themes (switch via Admin → Theme). Verify popups, clustering, and minimap.
4. **Search/Filter** – Exercise filters by topic, speaker, and region. Ensure counts update and results clear correctly.
5. **Media Playback** – Play audio/video attachments in story detail and confirm no buffering errors.
6. **Background Jobs** – Trigger a job (e.g., import, media processing) and confirm completion in logs.
7. **API Endpoints** – Hit `/api/stories` and `/api/places` with an authenticated token; verify schema matches contract.
8. **Accessibility Spot Check** – Run browser dev tools Lighthouse audit (Accessibility) and note regressions >3 points.

## 5. Monitoring & Logs
1. Inspect Heroku logs for the deployment window:
   ```bash
   heroku logs --tail --app terrastories-staging
   ```
2. Check Heroku metrics dashboard for CPU, memory, and response time anomalies (screenshot if spikes present).
3. Review Sentry/New Relic (if configured) for new errors since the upgrade timestamp.

## 6. Data Validation
1. Diff current row counts against the pre-upgrade snapshot:
   ```bash
   diff backups/rowcounts-staging-*.tsv backups/rowcounts-preupgrade.tsv
   ```
2. Run targeted data queries to verify critical tables:
   ```bash
   heroku run --app terrastories-staging \
     "psql -d $DATABASE_URL -c 'SELECT COUNT(*) FROM stories;'"
   heroku run --app terrastories-staging \
     "psql -d $DATABASE_URL -c 'SELECT COUNT(*) FROM places WHERE lat IS NULL OR long IS NULL;'"
   ```
3. Confirm feature flags (Flipper) reflect expected defaults:
   ```bash
   heroku run --app terrastories-staging "bundle exec rails flipper:list"
   ```

## 7. Sign-off
- Summarize results (include links to artifacts, screenshots, row count diffs).
- File issues for any failures discovered during testing.
- Notify stakeholders in project communications channel when all checks are green.
