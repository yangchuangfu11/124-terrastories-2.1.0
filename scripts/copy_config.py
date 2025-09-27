#!/usr/bin/env python3
"""Copy selected Heroku config vars between apps without printing secrets."""

import json
import subprocess
import sys

SOURCE_APP = "terrastories-staging-pg16"
DEST_APP = "terrastories-staging-pg17"
HOST_OVERRIDE = "terrastories-staging-pg17-e739fb08cb45.herokuapp.com"

SKIP_KEYS = {"DATABASE_URL"}


def main():
    try:
        config_json = subprocess.check_output(
            ["heroku", "config", "--app", SOURCE_APP, "--json"], text=True
        )
    except subprocess.CalledProcessError as exc:
        print(f"Failed to fetch config for {SOURCE_APP}: {exc}", file=sys.stderr)
        sys.exit(exc.returncode or 1)

    config = json.loads(config_json)

    for key, value in config.items():
        if key in SKIP_KEYS:
            continue
        if key == "HOST_HOSTNAME":
            value = HOST_OVERRIDE
        try:
            subprocess.run(
                ["heroku", "config:set", f"{key}={value}", "--app", DEST_APP],
                check=True,
            )
        except subprocess.CalledProcessError as exc:
            print(f"Failed to set {key} on {DEST_APP}: {exc}", file=sys.stderr)
            sys.exit(exc.returncode or 1)

    print("Config sync complete.")


if __name__ == "__main__":
    main()
