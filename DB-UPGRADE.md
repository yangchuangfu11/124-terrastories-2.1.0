# Postgres Upgrade Plan

## Goal
Rehearse and execute a controlled upgrade from Postgres 11 (current local baseline) to Postgres 16 using Docker containers. Only after the local rehearsal succeeds will these steps be repeated against managed environments (e.g., Heroku).

## Environments
- **Local rehearsal (current focus):** Docker Compose stack defined in `compose.yaml` (baseline `postgres:11`) plus ad-hoc `postgres:13`/`postgres:16` containers.
- **Staging/Production (deferred):** Managed environments (Heroku) will reuse these scripts once local sign-off is achieved (see “Heroku Execution (Deferred)” below).

## Prerequisites
- Docker ≥ 20.10 with `docker compose` plugin.
- Local filesystem space for backups (≥ size of DB × 2).
- `psql` client (available via `docker compose exec db psql ...`).
- For Heroku execution: pipeline access capable of running `heroku pg:backups`, `heroku pg:copy`, `heroku pg:upgrade`.

## Local Rehearsal Walkthrough

### 1. Baseline Capture
1. Start database: `docker compose up -d db`.
2. Record version & extensions:
   ```bash
   docker compose exec db psql -U postgres -c "SELECT version();"
   docker compose exec db psql -U postgres -d terrastories-dev -c "\\dx"
   ```
3. Collect row counts (store output for later diff). Example baseline file captured locally:
   ```bash
   docker compose exec db psql -U postgres -d terrastories-dev \
     -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;" \
     -F $'\t' --no-align > backups/rowcounts-pg11.tsv
   ```

### 2. Logical Backup
```bash
mkdir -p backups
docker compose exec db pg_dump -Fc -U postgres terrastories-dev \
  > backups/terrastories-dev_$(date +%Y%m%d%H%M)_pg11.dump
```
Verify integrity:
```bash
docker run --rm -v "$(pwd)/backups:/backups" postgres:16 \
  pg_restore --list /backups/terrastories-dev_*.dump | head
```

### 3. Restore Into Postgres 13 (Optional Intermediate)
> Heroku may enforce stepping-stone upgrades (11→13→16). Rehearse intermediate restores locally to surface incompatibilities early.

1. Launch temporary container (bound to `localhost:5443`):
   ```bash
   docker run --name ts-pg13 --rm -e POSTGRES_PASSWORD=postgres -p 5443:5432 -d postgres:13
   ```
2. Restore backup (use host networking for convenience):
   ```bash
   docker run --rm --network host -e PGPASSWORD=postgres \
     -v "$(pwd)/backups:/backups" postgres:13 \
     bash -c "createdb -h localhost -p 5443 -U postgres terrastories-dev || true; \
       pg_restore -c -h localhost -p 5443 -U postgres -d terrastories-dev /backups/terrastories-dev_pg11.dump"
   ```
3. Validate:
   ```bash
   docker run --rm --network host -e PGPASSWORD=postgres postgres:13 \
     psql -h localhost -p 5443 -U postgres -d terrastories-dev -c "SELECT version();"
   docker run --rm --network host -e PGPASSWORD=postgres postgres:13 \
     psql -h localhost -p 5443 -U postgres -d terrastories-dev \
     -F $'\t' --no-align -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;" > backups/rowcounts-pg13.tsv
   ```
4. Diff rowcounts vs baseline (`diff backups/rowcounts-pg11.tsv backups/rowcounts-pg13.tsv`).

### 4. Restore Into Postgres 16 (Target)
Repeat the above using `postgres:16` image, binding to a different port (e.g., `-p 5444:5432`):
```bash
docker run --name ts-pg16 --rm -e POSTGRES_PASSWORD=postgres -p 5444:5432 -d postgres:16
```
Restore with `postgres:16` tools and capture validation output into `backups/rowcounts-pg16.tsv`.

### 5. Application Smoke Tests
With Postgres 16 container running:
1. Point Rails to upgraded DB using host networking. Example for migrations:
   ```bash
   docker run --rm --network host \
     -e DATABASE_URL=postgresql://postgres:postgres@localhost:5444/terrastories-dev \
     -e RAILS_ENV=development \
     -v "$(pwd)/rails:/api" \
     -v "$(pwd)/data/media:/media" \
     -v "$(pwd)/data/import/media:/api/import/media" \
     -w /api terrastories/devcore:latest \
     bundle exec rails db:migrate
   ```
2. Prepare and run tests against the upgraded database:
   ```bash
   docker run --rm --network host \
     -e DATABASE_URL=postgresql://postgres:postgres@localhost:5444/terrastories-test \
     -e RAILS_ENV=test \
     -v "$(pwd)/rails:/api" -v "$(pwd)/data/media:/media" -v "$(pwd)/data/import/media:/api/import/media" \
     -w /api terrastories/devcore:latest bundle exec rails db:test:prepare

   docker run --rm --network host \
     -e DATABASE_URL=postgresql://postgres:postgres@localhost:5444/terrastories-test \
     -e RAILS_ENV=test \
     -v "$(pwd)/rails:/api" -v "$(pwd)/data/media:/media" -v "$(pwd)/data/import/media:/api/import/media" \
     -w /api terrastories/devcore:latest bundle exec rspec --format progress
   ```
   *Current status:* RSpec suite passes (163 examples, 0 failures, 1 pending). Jest suite fails because `babel-plugin-dynamic-import-node` is missing; capture this as a dependency gap to resolve during frontend upgrade PRs.
3. (Optional) Attempt Jest run to surface missing dependencies:
   ```bash
   docker run --rm --network host \
     -e DATABASE_URL=postgresql://postgres:postgres@localhost:5444/terrastories-dev \
     -v "$(pwd)/rails:/api" -v "$(pwd)/data/media:/media" -v "$(pwd)/data/import/media:/api/import/media" \
     -w /api terrastories/devcore:latest yarn test --runInBand
   ```
   Expect failure until the missing plugin is added or the toolchain is upgraded.
4. Manual smoke: once tests pass, `docker compose up web` (pointing to upgraded DB) to validate login/map flows locally.

### 6. Cleanup
- Stop temporary containers: `docker stop ts-pg13 ts-pg16`.
- If `docker stop` reports permission issues, retry with elevated privileges or remove containers after exiting the rehearsal (`docker rm -f ts-pg13 ts-pg16`).
- Archive backups and rowcount files under `backups/` for auditing.

## Heroku Execution (Deferred)
After the local rehearsal is green and dependency work is complete:

1. Gather Heroku environment info (app names, addons, current Postgres plan, backups).
2. Rerun the upgrade sequence on staging using the analogous Heroku CLI commands (capture backup, `pg:copy`, `pg:upgrade`, run tests, smoke checklist).
3. Execute the production upgrade with a scheduled window once staging sign-off is complete.
4. Reference `ROLLBACK-PLAN.md` for managed rollback procedures (snapshots/followers) alongside the local restore playbook.

### Staging PG17 Rehearsal (`terrastories-staging-pg17`)

We provisioned a parallel Heroku app (`terrastories-staging-pg17`) with a fresh Postgres `standard-0` add-on to rehearse the 16 → 17 upgrade path before touching production. Use this sequence to keep the environments in sync:

1. **App scaffolding**
   - Create app on Heroku-24 stack: `heroku apps:create terrastories-staging-pg17 --region us --stack heroku-24`
   - Provision database: `heroku addons:create heroku-postgresql:standard-0 --app terrastories-staging-pg17` (defaults to PG 17; confirm with `heroku pg:info`).
   - Wait for provisioning: `heroku pg:wait --app terrastories-staging-pg17`.

2. **Config & build setup**
   - Copy non-secret config vars from `terrastories-staging-pg16` (use Heroku Config Sync or run `heroku config --app terrastories-staging-pg16 --shell` locally and apply selectively; do **not** commit secrets).
   - Add required buildpacks (Node + Ruby) mirroring the PG16 staging app.
   - Attach to the existing pipeline if desired (`heroku pipelines:connect`).

3. **Data restore**
   - Capture backup from PG16 staging: `heroku pg:backups:capture --app terrastories-staging-pg16`.
   - Restore into PG17 app: `heroku pg:backups:restore <backup_url> DATABASE_URL --app terrastories-staging-pg17 --confirm terrastories-staging-pg17`.
   - Run migrations: `heroku run --app terrastories-staging-pg17 bin/rails db:migrate`.

4. **Validation**
   - Follow `QA_SCRIPT.md` (includes `SMOKE-TEST-CHECKLIST.md`) against `terrastories-staging-pg17`.
   - Record results, row counts, and update `HEROKU_STATE.md` with the app’s release/db versions.

5. **Iterate**
   - Fix any 17-specific regressions uncovered.
   - Once PG17 staging is green, align cutover steps for production (`terrastories`) using the same backup/restore/QA flow.

## Validation Checklist
- [ ] Backups captured and verified (local & Heroku).
- [ ] Extension list identical post-upgrade.
- [ ] Row counts match pre/post upgrade (within acceptable delta for vacuum/autovacuum).
- Local rehearsal result: `rowcounts-pg11.tsv`, `rowcounts-pg13.tsv`, and `rowcounts-pg16.tsv` were identical (empty dataset).
- [ ] Application smoke tests pass (auth, story view, map render).
- **Current local status (2025-09-26):**
  - ✅ Logical backup `backups/terrastories-dev_pg11.dump` captured from Postgres 11.
  - ✅ Restores into Postgres 13 (`ts-pg13-local`, port 6543) and Postgres 16 (`ts-pg16-local`, port 6644) completed using `pg_restore --clean --if-exists`.
  - ✅ Row-count files `rowcounts-pg11.tsv`, `rowcounts-pg13.tsv`, `rowcounts-pg16.tsv` are identical (diff reports no changes).
  - ✅ Rails migrations, `bundle exec rspec`, and `yarn test --runInBand` succeeded against Postgres 16 via Docker (`terrastories/devcore:latest`).
  - ⚠️ Temporary rehearsal containers were torn down afterwards (ensure they are relaunched before repeating the rehearsal).
- [ ] Monitoring baseline (response time, error rate) unchanged or improved.

## Open Items
- Confirm actual production Postgres plan/version and extensions.
- Determine if logical replication or followers are configured (impacts downtime strategy).
- Populate `ROLLBACK-PLAN.md` with environment-specific details once Heroku discovery is complete.
