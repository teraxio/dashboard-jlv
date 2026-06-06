#!/bin/bash
# Wrapper ejecutado por launchd (com.jlv.dashboard-daily-summary.plist).
# Lee NOTION_TOKEN del macOS Keychain y ejecuta el script Node de resumen.

set -euo pipefail

LOG="$HOME/Library/Logs/dashboard-daily-summary.log"
mkdir -p "$(dirname "$LOG")"

# Toda la salida va al log
exec >> "$LOG" 2>&1

echo "---- $(date '+%Y-%m-%d %H:%M:%S') ----"

# Cargar token desde macOS Keychain (servicio creado manualmente con `security add-generic-password`)
if ! NOTION_TOKEN=$(security find-generic-password -s "DASHBOARD_JLV_NOTION_TOKEN" -a "$USER" -w 2>/dev/null); then
  echo "ERROR: NOTION_TOKEN no encontrado en Keychain (servicio: DASHBOARD_JLV_NOTION_TOKEN)"
  echo "Registrar con: security add-generic-password -s 'DASHBOARD_JLV_NOTION_TOKEN' -a \"\$USER\" -w"
  exit 1
fi
export NOTION_TOKEN

# Localizar node (launchd tiene PATH mínimo)
NODE_BIN="$(command -v node 2>/dev/null || true)"
if [ -z "${NODE_BIN}" ] || [ ! -x "${NODE_BIN}" ]; then
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node; do
    if [ -x "$candidate" ]; then
      NODE_BIN="$candidate"
      break
    fi
  done
fi

if [ -z "${NODE_BIN}" ] || [ ! -x "${NODE_BIN}" ]; then
  echo "ERROR: node no encontrado en PATH ni en rutas estándar"
  exit 1
fi

echo "Usando node: ${NODE_BIN}"
exec "${NODE_BIN}" "$HOME/Dashboard-JLV/scripts/daily-summary.js"
