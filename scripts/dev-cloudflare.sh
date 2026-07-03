#!/usr/bin/env bash
set -euo pipefail

read_env_value() {
  local key="$1"
  local line

  if [[ ! -f .env ]]; then
    return 0
  fi

  line="$(grep -E "^${key}=" .env | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    return 0
  fi

  line="${line#*=}"
  line="${line%\"}"
  line="${line#\"}"
  line="${line%\'}"
  line="${line#\'}"
  printf "%s" "$line"
}

PORT="${PORT:-3000}"

SHOW_CLOUDFLARED_LOGS="${SHOW_CLOUDFLARED_LOGS:-$(read_env_value SHOW_CLOUDFLARED_LOGS)}"
CLOUDFLARE_LOGLEVEL="${CLOUDFLARE_LOGLEVEL:-$(read_env_value CLOUDFLARE_LOGLEVEL)}"
CLOUDFLARE_TRANSPORT_LOGLEVEL="${CLOUDFLARE_TRANSPORT_LOGLEVEL:-$(read_env_value CLOUDFLARE_TRANSPORT_LOGLEVEL)}"

SHOW_CLOUDFLARED_LOGS="${SHOW_CLOUDFLARED_LOGS:-false}"
CLOUDFLARE_LOGLEVEL="${CLOUDFLARE_LOGLEVEL:-info}"
CLOUDFLARE_TRANSPORT_LOGLEVEL="${CLOUDFLARE_TRANSPORT_LOGLEVEL:-error}"

# Suppress dotenv tips from runtime output.
export DOTENV_CONFIG_QUIET="${DOTENV_CONFIG_QUIET:-true}"

npm run build

node dist/server.js &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

cmd=(
  cloudflared
  tunnel
  --url "http://localhost:${PORT}"
  --loglevel "${CLOUDFLARE_LOGLEVEL}"
  --transport-loglevel "${CLOUDFLARE_TRANSPORT_LOGLEVEL}"
)

if [[ "${SHOW_CLOUDFLARED_LOGS}" == "true" ]]; then
  echo "Cloudflare logs enabled."
  exec "${cmd[@]}"
fi

echo "Starting Cloudflare tunnel..."
echo ""

"${cmd[@]}" 2>&1 | while IFS= read -r line; do
  if [[ "$line" =~ https://[a-zA-Z0-9.-]+\.trycloudflare\.com ]]; then
    base_url="${BASH_REMATCH[0]}"
    echo "Your ChatGPT MCP URL: ${base_url}/mcp"
    echo "Keep this terminal open while ChatGPT is connected."
    echo ""
    continue
  fi

  if [[ "$line" == *"ERR"* || "$line" == *"Error"* || "$line" == *"failed"* ]]; then
    echo "$line"
  fi
done
