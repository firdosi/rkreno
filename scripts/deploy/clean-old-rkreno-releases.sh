#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib-rkreno.sh"
rk_require_activation
KEEP_RELEASES="${KEEP_RELEASES:-5}"
[[ "$KEEP_RELEASES" =~ ^[2-9][0-9]*$ ]] || rk_die "KEEP_RELEASES must be at least 2"
CURRENT_TARGET="$(readlink -f "$RKRENO_TARGET_ROOT/current" 2>/dev/null || true)"
PREVIOUS_TARGET="$(readlink -f "$RKRENO_TARGET_ROOT/previous" 2>/dev/null || true)"
mapfile -t releases < <(find "$RKRENO_TARGET_ROOT/releases" -mindepth 1 -maxdepth 1 -type d -name 'rkreno-*' -printf '%T@ %p\n' | sort -nr | cut -d' ' -f2-)
for ((index=KEEP_RELEASES; index<${#releases[@]}; index++)); do
  candidate="${releases[$index]}"
  [[ "$candidate" == "$CURRENT_TARGET" || "$candidate" == "$PREVIOUS_TARGET" ]] && continue
  rk_run rm -rf -- "$candidate"
done
rk_log "Inactive release cleanup complete; dry-run=$DRY_RUN"
