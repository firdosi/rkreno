#!/usr/bin/env bash
set -euo pipefail

RKRENO_APPROVED_ROOT="/var/www/rkreno"
DRY_RUN="${DRY_RUN:-true}"

rk_log() { printf '[rkreno] %s\n' "$1"; }
rk_die() { printf '[rkreno] ERROR: %s\n' "$1" >&2; exit 1; }
rk_run() {
  if [[ "$DRY_RUN" == "true" ]]; then
    printf '[rkreno] DRY RUN:'
    printf ' %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}
rk_validate_root() {
  local target="${RKRENO_TARGET_ROOT:-}"
  [[ "$target" == "$RKRENO_APPROVED_ROOT" ]] || rk_die "Target root must be $RKRENO_APPROVED_ROOT"
  [[ -n "$target" && "$target" != "/" && "$target" != "/var/www" && "$target" != "$HOME" ]] \
    || rk_die "Unsafe target root"
  [[ "$target" != *"ConvortAI"* && "$target" != *"convortai"* ]] || rk_die "Unrelated application path rejected"
}
rk_require_activation() {
  [[ "${RKRENO_VPS_DEPLOY_ENABLED:-false}" == "true" ]] || rk_die "Remote deployment is disabled"
  [[ "${DEPLOY_ENVIRONMENT:-}" == "private_preview" || "${DEPLOY_ENVIRONMENT:-}" == "production" ]] \
    || rk_die "Invalid deployment environment"
  [[ -n "${DEPLOY_CONFIRM_COMMIT:-}" ]] || rk_die "DEPLOY_CONFIRM_COMMIT is required"
  rk_validate_root
}
rk_release_dir() {
  local release_id="$1"
  [[ "$release_id" =~ ^rkreno-[a-f0-9]{7,40}$ ]] || rk_die "Invalid release identifier"
  printf '%s/releases/%s' "$RKRENO_TARGET_ROOT" "$release_id"
}
rk_verify_archive() {
  local archive="$1" checksum_file="$2"
  [[ -f "$archive" && -f "$checksum_file" ]] || rk_die "Archive or checksum is missing"
  (cd "$(dirname "$archive")" && sha256sum --check "$(basename "$checksum_file")")
}
rk_switch_link() {
  local link="$1" target="$2" temporary="${link}.next.$$"
  rk_run ln -s "$target" "$temporary"
  rk_run mv -Tf "$temporary" "$link"
}
