# Rollback Plan

## Scope
Ensures Terrastories can revert database and application changes during or after the Postgres/dependency upgrade initiative. Covers local rehearsals now; will be augmented with Heroku-specific details once access is confirmed.

## Guiding Principles
- Maintain recent, verified backups before any breaking change.
- Prefer fast failover (promoting follower or restoring snapshot) over ad-hoc fixes.
- Keep rollback steps scripted and rehearsed (local → staging → production).
- Communicate status immediately; document any partial rollbacks.

## Database Rollback Strategies

### Local Environment (Primary Focus)
1. **Before upgrade rehearsal:**
   - Capture logical backup: `docker compose exec db pg_dump -Fc -U postgres terrastories-dev > backups/terrastories-dev_pre-change.dump`.
   - Record row counts: `docker compose exec db psql -U postgres -d terrastories-dev -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;" > backups/rowcounts-pre.tsv`.
2. **If failure occurs during rehearsal:**
   - Stop upgraded container (`docker stop ts-pg16` if running).
   - Restart baseline DB (`docker compose up -d db`).
   - Restore dump as needed:
     ```bash
     docker compose exec db dropdb -U postgres terrastories-dev
     docker compose exec db createdb -U postgres terrastories-dev
     cat backups/terrastories-dev_pre-change.dump | docker compose exec -T db pg_restore -U postgres -d terrastories-dev
     ```
   - Rerun validations (row counts, RSpec, Jest, smoke checklist).

### Managed Environments (Deferred)
1. Once local rehearsals are successful, capture Heroku staging/production backups and row counts before attempting live upgrades.
2. Rollback options mirror local logic (restore from backup, promote followers) using Heroku CLI commands documented in `DB-UPGRADE.md`.
3. After rollback, rerun smoke checklist, notify stakeholders, and log incident details.

## Application Rollback Strategies
- Use Git branches and PRs; revert merges via `git revert` before deployment.
- If deploy causes issues:
  1. Trigger Heroku rollback: `heroku releases:rollback vNN --app <app>`.
  2. Re-deploy previous stable slug (`heroku releases:info` to confirm).
- Maintain feature flags (Flipper) for risky features to disable without full rollback.

## Monitoring & Verification Post-Rollback
- Rerun smoke checklist (see `SMOKE-TEST-CHECKLIST.md`).
- Check Heroku metrics (response time, error rate), logs (`heroku logs --tail`).
- Confirm DB replication/follower status back to healthy.

## Communication Plan
- Establish Slack/email channel for upgrade window.
- Announce:
  - Start of upgrade/rollback.
  - Completion and status (success/rollback invoked).
- Document incident summary and lessons learned in project tracker.

## Next Actions
- Fill in Heroku-specific identifiers (app names, DB resource names) once available.
- Automate row-count capture and comparison scripts for reproducibility.
- Ensure backups directory is git-ignored and has sufficient storage.
