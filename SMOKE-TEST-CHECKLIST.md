# Smoke Test Checklist

Use this checklist after each major change (DB upgrade, dependency bump, mapping fix) beginning with the local Docker environment and later in staging/production. Record results with date, environment, and tester.

## Pre-requisites
- Latest migrations applied.
- Feature flags aligned with target environment (Flipper).
- Test accounts seeded (admin + standard user).
- Map tokens/config vars valid for the environment.

## Local/Staging Checklist
1. **App boot**
   - For local runs: start Rails app against upgraded Postgres container; ensure server boots without errors.
   - For staging (post-local sign-off): deploy branch, ensure dynos/processes start cleanly.
   - `/healthz` endpoint returns 200 (add via PR A if missing).
2. **Authentication**
   - Load login page, verify assets load without console errors.
   - Sign in with test credentials; confirm redirect to dashboard.
3. **Stories CRUD**
   - Create a new story with location and media attachment.
   - Edit existing story; confirm changes persist.
   - Delete story (if permissible) or archive; verify state change.
4. **Places & Map**
   - Load map view; ensure basemap and overlays render, no red console errors.
   - Click a place marker; popup displays correct details.
   - Search/filter places; results update appropriately.
5. **Media playback**
   - Play audio/video attachments; confirm streaming works.
6. **Background tasks**
   - Trigger any background job (if applicable) and confirm processing (logs or dashboards).
7. **API endpoints**
   - Hit key API routes (e.g., `/api/stories`) via curl/Postman; expect 200 + valid JSON.
8. **Logs & Metrics**
   - Review application logs for warnings/errors introduced after change.
   - Check database metrics (connections, slow queries) for anomalies.

## Production Go-Live Checklist (Deferred)
Apply after the local/staging phases are complete:
- Confirm maintenance mode toggled off post-upgrade.
- Compare row counts vs pre-upgrade snapshot (`SELECT relname, n_live_tup ...`).
- Verify monitoring alerts remain green (Heroku metrics, Sentry/New Relic).
- Announce completion to stakeholders with summary + next steps.

## Automation Candidates
- Scripted smoke via Playwright/Cypress for login + map render.
- CLI script capturing row counts and diffing vs baseline.
- Health-check workflow in CI that runs after deployment.

## Recording Results
| Date | Environment | Change | Tester | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Keep this file updated with each execution for auditability.
