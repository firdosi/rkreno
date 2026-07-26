#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib-rkreno.sh"
rk_require_activation
RELEASE_ID="${RELEASE_ID:-}"
TARGET="$(rk_release_dir "$RELEASE_ID")"
[[ -d "$TARGET" ]] || rk_die "Release does not exist"
rk_run "$SCRIPT_DIR/verify-rkreno-release.sh" "$TARGET"
CURRENT="$RKRENO_TARGET_ROOT/current"
PREVIOUS="$RKRENO_TARGET_ROOT/previous"
[[ -L "$CURRENT" ]] && rk_switch_link "$PREVIOUS" "$(readlink -f "$CURRENT")"
rk_switch_link "$CURRENT" "$TARGET"
rk_run systemctl restart rkreno-enquiry.service
rk_run nginx -t
rk_run systemctl reload nginx
rk_run "$SCRIPT_DIR/verify-rkreno-release.sh" "$CURRENT"
