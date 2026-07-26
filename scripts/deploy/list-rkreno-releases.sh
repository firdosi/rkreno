#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib-rkreno.sh"
rk_validate_root
[[ -d "$RKRENO_TARGET_ROOT/releases" ]] || { rk_log "No releases directory"; exit 0; }
find "$RKRENO_TARGET_ROOT/releases" -mindepth 1 -maxdepth 1 -type d -name 'rkreno-*' -printf '%f\n' | sort
