#!/usr/bin/env bash
# Instala (o actualiza) la tarea programada de backups en el crontab del usuario actual.
# Uso: bash bat/instalar-cron.sh
set -euo pipefail
DIR_BAT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROYECTO="$(dirname "$DIR_BAT")"

if ! command -v crontab >/dev/null; then
  echo "crontab no está instalado. Ejecuta: sudo dnf install -y cronie && sudo systemctl enable --now crond"
  exit 1
fi

# Quita líneas viejas del backup y agrega las nuevas con la ruta real del proyecto
NUEVO="$(grep -v '^#' "$DIR_BAT/crontab.txt" | sed "s#RUTA_PROYECTO#$PROYECTO#g")"
( crontab -l 2>/dev/null | grep -v 'bat/backup.sh' | grep -v '^CRON_TZ=America/Bogota' || true
  echo "$NUEVO" ) | crontab -

echo "Tarea programada instalada:"
crontab -l