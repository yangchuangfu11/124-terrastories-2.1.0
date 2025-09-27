# Heroku Environment Snapshot (2025-09-27)

<!-- Generated with read-only commands; do not run destructive operations. -->

## Apps

- `terrastories-staging-pg16`
  - Stack: `heroku-24`
  - Latest release: `v17` (2025-09-27 11:49:53 -0300)
  - Git SHA/deploy: see Release `v14` (`deploy efda64ed`)
  - Add-ons:
    - `heroku-postgresql:standard-0` (`postgresql-flat-20112`)
- `terrastories-staging-pg17`
  - Stack: `heroku-24`
  - Latest release: `v21` (config synced from pg16 + Rails secrets)
  - Web URL: https://terrastories-staging-pg17-e739fb08cb45.herokuapp.com/
  - Add-ons:
    - `heroku-postgresql:standard-0` (`postgresql-shaped-20909`)

## Databases

- `terrastories-staging-pg16` → `DATABASE_URL`
  - Plan: Standard 0
  - PostgreSQL: 16.9
  - Data size: 13.8 MB / 64 GB
  - Connections: 16 / 200
  - Continuous protection: On
  - Fork/follow: Available
  - Earliest rollback: 2025-09-27 12:33 UTC
- `terrastories-staging-pg17` → `DATABASE_URL`
  - Plan: Standard 0
  - PostgreSQL: 17.5
  - Data size: 7.6 MB / 64 GB
  - Connections: 12 / 200
  - Continuous protection: On
  - Earliest rollback: 2025-09-27 16:00 UTC
  - Add-on: `postgresql-shaped-20909`

## Commands Executed (read-only)

```bash
# List apps
heroku apps

# App details
heroku apps:info --app terrastories-staging-pg16
heroku apps:info --app terrastories-staging-pg17

# Create PG17 staging scaffold
heroku apps:create terrastories-staging-pg17 --region us --stack heroku-24

# Recent releases (shows deploy origin/hash)
heroku releases --num 5 --app terrastories-staging-pg16

# Database info
heroku pg:info --app terrastories-staging-pg16
heroku pg:info --app terrastories-staging-pg17

# Provision PG17 database
heroku addons:create heroku-postgresql:standard-0 --app terrastories-staging-pg17
heroku pg:wait --app terrastories-staging-pg17

# Sync config (example Python helper)
python3 scripts/copy_config.py

# Verify ActiveStorage target bucket
heroku run --app terrastories-staging-pg17 bin/rails runner "puts ActiveStorage::Blob.service.bucket.name"
```

> Note: Ensure you are logged in as the correct Heroku user (`heroku whoami`) before running the commands. Do not capture or store credentials, config vars, or logs containing secrets in this file.
