#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib-rkreno.sh"

rk_require_activation
ARCHIVE="${RELEASE_ARCHIVE:-}"
CHECKSUM="${RELEASE_CHECKSUM_FILE:-}"
RELEASE_ID="${RELEASE_ID:-}"
[[ "$DEPLOY_CONFIRM_COMMIT" == "${RELEASE_ID#rkreno-}"* ]] || rk_die "Commit confirmation does not match release"
RELEASE_DIR="$(rk_release_dir "$RELEASE_ID")"
[[ -f "$RKRENO_TARGET_ROOT/shared/env/enquiry.env" ]] || rk_die "External environment file is missing"
rk_verify_archive "$ARCHIVE" "$CHECKSUM"
[[ ! -e "$RELEASE_DIR" ]] || rk_die "Release directory already exists"

rk_run mkdir -p "$RELEASE_DIR"
rk_run tar -xzf "$ARCHIVE" -C "$RELEASE_DIR"
rk_run chmod -R a-w "$RELEASE_DIR"
rk_run "$SCRIPT_DIR/verify-rkreno-release.sh" "$RELEASE_DIR"
rk_run nginx -t
rk_run /usr/bin/node "$RELEASE_DIR/server/enquiry/server.mjs" --health-check

CURRENT="$RKRENO_TARGET_ROOT/current"
PREVIOUS="$RKRENO_TARGET_ROOT/previous"
if [[ -L "$CURRENT" ]]; then
  OLD_TARGET="$(readlink -f "$CURRENT")"
  rk_switch_link "$PREVIOUS" "$OLD_TARGET"
fi
rk_switch_link "$CURRENT" "$RELEASE_DIR"
if [[ "$DRY_RUN" != "true" ]]; then
  if ! systemctl restart rkreno-enquiry.service || ! nginx -t || ! systemctl reload nginx; then
    [[ -L "$PREVIOUS" ]] && rk_switch_link "$CURRENT" "$(readlink -f "$PREVIOUS")"
    systemctl restart rkreno-enquiry.service || true
    rk_die "Activation failed and rollback was attempted"
  fi
fi
rk_run "$SCRIPT_DIR/verify-rkreno-release.sh" "$CURRENT"
rk_log "Deployment workflow complete; dry-run=$DRY_RUN"
