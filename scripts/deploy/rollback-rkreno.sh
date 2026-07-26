#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib-rkreno.sh"
rk_require_activation
TARGET_ID="${ROLLBACK_RELEASE_ID:-}"
[[ "$DEPLOY_CONFIRM_COMMIT" == "${TARGET_ID#rkreno-}"* ]] || rk_die "Rollback confirmation mismatch"
TARGET="$(rk_release_dir "$TARGET_ID")"
[[ -d "$TARGET" ]] || rk_die "Rollback release is missing"
rk_run "$SCRIPT_DIR/verify-rkreno-release.sh" "$TARGET"
CURRENT="$RKRENO_TARGET_ROOT/current"
PREVIOUS="$RKRENO_TARGET_ROOT/previous"
OLD_TARGET=""
[[ -L "$CURRENT" ]] && OLD_TARGET="$(readlink -f "$CURRENT")"
rk_switch_link "$CURRENT" "$TARGET"
[[ -n "$OLD_TARGET" ]] && rk_switch_link "$PREVIOUS" "$OLD_TARGET"
rk_run systemctl restart rkreno-enquiry.service
rk_run nginx -t
rk_run systemctl reload nginx
rk_run "$SCRIPT_DIR/verify-rkreno-release.sh" "$CURRENT"
rk_log "Rollback complete; failed releases were not deleted"
