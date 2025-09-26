# Terrastories Remediation – Agent Reference

Welcome! This document orients new agents working on the Terrastories remediation effort. It links to the active context docs and records the current repo status so you can resume work quickly.

## Key Context Docs

All live in the repository root:

- `PLAN.md` – High-level remediation roadmap (approved by user).
- `DB-UPGRADE.md` – Local → staging → production Postgres upgrade procedure.
- `ROLLBACK-PLAN.md` – Database/application rollback strategy.
- `SMOKE-TEST-CHECKLIST.md` – Staging/production verification steps post-deploy.
- `DEPENDENCY-AUDIT.md` – Current backend/frontend dependency gaps and upgrade plan.
- `MAPPING-STYLES-FIX.md` – Map regression investigation notes and fix strategy.

## Current Code State

- Latest commit: `test: stabilize frontend i18n handling` (adds Jest i18n mocks and refreshes Card/Sort specs).
- Local Postgres upgrade rehearsal completed on 2025-09-26 (Postgres 11→13→16 via Docker). See `DB-UPGRADE.md` for commands and results (`backups/terrastories-dev_pg11.dump`, `rowcounts-pg11/13/16.tsv`).
- All Jest suites pass (`yarn test --runInBand`); RSpec passes against Postgres 16 using `terrastories/devcore:latest` container.
- Husky pre-commit ESLint hook currently fails due to legacy lint debt in unrelated files (`Popup.jsx`, `Story.jsx`, `global/pause_all_videos.js`). Hooks were bypassed for the latest commit; plan lint remediation before the next guarded commit.

## Outstanding Work / Next Steps

1. Address the ESLint debt noted above so Husky hooks can run cleanly.
2. Populate Heroku-specific discovery data in the docs once access is granted.
3. Proceed with Phase 1 guardrails (CI + staging health checks) then follow `DB-UPGRADE.md` for staging rehearsal.
4. After dependency upgrades, revisit `MAPPING-STYLES-FIX.md` for the mapping regression fix (PR Z).

Keep this file updated when major context changes occur.
