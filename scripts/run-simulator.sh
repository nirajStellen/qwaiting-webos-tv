#!/usr/bin/env bash
# Launch Hello World app on LG webOS TV Simulator (virtual device)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEBOS_VERSION="${WEBOS_VERSION:-24}"

# Set SIMULATOR_PATH to your unpacked simulator folder, e.g.:
# export SIMULATOR_PATH="$HOME/webOS_TV_24_Simulator_1.4.1"
if [[ -z "${SIMULATOR_PATH:-}" ]]; then
  for candidate in \
    "$HOME"/webOS_TV_"${WEBOS_VERSION}"_Simulator* \
    "$HOME/Downloads"/webOS_TV_"${WEBOS_VERSION}"_Simulator* \
    /Applications/webOS_TV_"${WEBOS_VERSION}"_Simulator*; do
    if [[ -d "$candidate" ]]; then
      SIMULATOR_PATH="$candidate"
      break
    fi
  done
fi

if [[ -z "${SIMULATOR_PATH:-}" || ! -d "$SIMULATOR_PATH" ]]; then
  echo "webOS TV Simulator not found."
  echo ""
  echo "1. Download Simulator (Apple Silicon / arm64 Mac):"
  echo "   https://webostv.developer.lge.com/develop/tools/simulator-installation"
  echo "   → webOS TV 24 Simulator (mac-arm64) or webOS TV 25/26 Simulator"
  echo ""
  echo "2. Unzip, then set path and run:"
  echo "   export SIMULATOR_PATH=\"\$HOME/webOS_TV_24_Simulator_1.4.1\""
  echo "   npm run simulator"
  exit 1
fi

echo "Using simulator: $SIMULATOR_PATH"
echo "Launching app from: $ROOT"
cd "$ROOT"
npx ares-launch -s "$WEBOS_VERSION" . -sp "$SIMULATOR_PATH"
