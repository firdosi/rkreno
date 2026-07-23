#!/usr/bin/env bash
set -euo pipefail

release_id="${1:-}"
deploy_root="${RKRENO_DEPLOY_ROOT:-/var/www/rkreno}"
releases_dir="$deploy_root/releases"

if [[ ! "$release_id" =~ ^[a-f0-9]{40}$ ]]; then
  echo "Usage: rollback-release.sh <40-character-release-sha>" >&2
  echo "Available releases:" >&2
  find "$releases_dir" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort >&2
  exit 2
fi

release_dir="$releases_dir/$release_id"
test -f "$release_dir/public/index.html"
test -f "$release_dir/form-api/app.mjs"

next_link="$deploy_root/.rollback-$release_id"
rm -f -- "$next_link"
ln -s "$release_dir" "$next_link"
mv -Tf "$next_link" "$deploy_root/current"
sudo systemctl restart rkreno-form-api
curl --fail --silent --show-error http://127.0.0.1:8787/health >/dev/null

echo "Rolled RK Reno back to $release_id"
