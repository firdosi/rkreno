#!/usr/bin/env bash
set -euo pipefail

release_id="${1:-}"
archive="${2:-}"
deploy_root="${RKRENO_DEPLOY_ROOT:-/var/www/rkreno}"

if [[ ! "$release_id" =~ ^[a-f0-9]{40}$ ]]; then
  echo "Release id must be a 40-character Git commit SHA." >&2
  exit 2
fi
if [[ ! -f "$archive" ]]; then
  echo "Release archive not found: $archive" >&2
  exit 2
fi

releases_dir="$deploy_root/releases"
release_dir="$releases_dir/$release_id"
mkdir -p "$releases_dir"
if [[ -e "$release_dir" ]]; then
  echo "Release already exists: $release_dir" >&2
  exit 2
fi

mkdir "$release_dir"
cleanup_incomplete_release() {
  rm -rf -- "$release_dir"
}
trap cleanup_incomplete_release ERR

tar -xzf "$archive" -C "$release_dir"
test -f "$release_dir/public/index.html"
test -f "$release_dir/form-api/package-lock.json"

npm --prefix "$release_dir/form-api" ci --omit=dev --ignore-scripts

next_link="$deploy_root/.current-$release_id"
rm -f -- "$next_link"
ln -s "$release_dir" "$next_link"
mv -Tf "$next_link" "$deploy_root/current"
trap - ERR

sudo systemctl restart rkreno-form-api
curl --fail --silent --show-error http://127.0.0.1:8787/health >/dev/null

mapfile -t old_releases < <(find "$releases_dir" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' |
  sort -rn | tail -n +6 | cut -d' ' -f2-)
for old_release in "${old_releases[@]}"; do
  [[ "$old_release" == "$releases_dir/"* ]] || exit 3
  rm -rf -- "$old_release"
done

rm -f -- "$archive"
echo "Activated RK Reno release $release_id"
