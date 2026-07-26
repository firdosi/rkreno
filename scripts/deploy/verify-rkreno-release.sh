#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib-rkreno.sh"
TARGET="${1:-}"
[[ -n "$TARGET" && -d "$TARGET" ]] || rk_die "Release directory is missing"
[[ "$TARGET" == "$RKRENO_APPROVED_ROOT/releases/"* || "$TARGET" == "$RKRENO_APPROVED_ROOT/current" ]] \
  || rk_die "Release path is outside RK Reno root"
for required in dist/index.html dist/404.html dist/robots.txt dist/sitemap.xml \
  config/production-route-map.json release.json SHA256SUMS; do
  [[ -f "$TARGET/$required" ]] || rk_die "Missing $required"
done
(cd "$TARGET" && sha256sum --check SHA256SUMS)
rk_log "Release verification passed"
