# Heroku Environment Snapshot (2025-09-27)

<!-- Generated with read-only commands; do not run destructive operations. -->

## Apps

- `terrastories-staging-pg16`
  - Stack: `heroku-24`
  - Latest release: `v17` (2025-09-27 11:49:53 -0300)
  - Git SHA/deploy: see Release `v14` (`deploy efda64ed`)
  - Add-ons:
    - `heroku-postgresql:standard-0` (`postgresql-flat-20112`)

## Databases

- `terrastories-staging-pg16` → `DATABASE_URL`
  - Plan: Standard 0
  - PostgreSQL: 16.9
  - Data size: 13.8 MB / 64 GB
  - Connections: 16 / 200
  - Continuous protection: On
  - Fork/follow: Available
  - Earliest rollback: 2025-09-27 12:33 UTC

## Commands Executed (read-only)

```bash
# List apps
heroku apps

# App details
heroku apps:info --app terrastories-staging-pg16

# Recent releases (shows deploy origin/hash)
heroku releases --num 5 --app terrastories-staging-pg16

# Database info
heroku pg:info --app terrastories-staging-pg16
```

> Note: Ensure you are logged in as the correct Heroku user (`heroku whoami`) before running the commands. Do not capture or store credentials, config vars, or logs containing secrets in this file.
