#!/usr/bin/env bash
# =====================================================================
#  backup.sh  —  equivalente en Linux de un archivo .bat de Windows
#  Saca copia de seguridad de las 3 bases de datos del proyecto:
#    1. XAMPP (MySQL/MariaDB dentro de la VM)  -> Backup/xampp/
#    2. Azure Database for MySQL               -> Backup/azure/
#    3. Supabase (PostgreSQL)                  -> Backup/supabase/
#  Lo ejecuta cron a las 6:00, 11:00, 12:00 y 20:00 (ver crontab.txt).
#  Uso manual:  bash bat/backup.sh
# =====================================================================
set -uo pipefail
export TZ="America/Bogota"          # nombres de archivo con hora de Colombia

DIR_BAT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROYECTO="$(dirname "$DIR_BAT")"
ENV_FILE="$PROYECTO/backend/.env"
DESTINO="$PROYECTO/Backup"
LOG="$DESTINO/backup.log"
DIAS_RETENCION="${DIAS_RETENCION:-7}"   # borra copias con más de 7 días
FECHA="$(date +%Y-%m-%d_%H-%M)"
# mysqldump: el de XAMPP si existe; si no, el del MySQL instalado en la VM (/usr/bin/mysqldump)
MYSQLDUMP="/opt/lampp/bin/mysqldump"
[ -x "$MYSQLDUMP" ] || MYSQLDUMP="$(command -v mysqldump || echo /usr/bin/mysqldump)" 
# Node: el del sistema o, si se instaló con nvm, el de ~/.nvm (cron no carga nvm)
NODE="$(command -v node || true)"
if [ -z "$NODE" ]; then NODE="$(ls -1d "$HOME"/.nvm/versions/node/*/bin/node 2>/dev/null | tail -n1)"; fi
NODE="${NODE:-/usr/bin/node}"

mkdir -p "$DESTINO/xampp" "$DESTINO/azure" "$DESTINO/supabase"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

# Evita que dos ejecuciones se crucen (p. ej. 11:00 y 12:00 si una tarda)
exec 9>"$DESTINO/.backup.lock"
if ! flock -n 9; then log "Ya hay un backup en curso, se omite esta ejecución."; exit 0; fi

if [ ! -f "$ENV_FILE" ]; then log "ERROR: no existe $ENV_FILE"; exit 1; fi

# Lee una variable del .env (soporta comillas y saltos de línea de Windows)
leer_env() {
  grep -E "^$1=" "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '\r' \
    | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/'
}

errores=0
log "===== Inicio de backup $FECHA ====="

# ---------- 1. XAMPP (VM) ----------
ARCHIVO="$DESTINO/xampp/db_local_$FECHA.sql"
PUERTO_LOCAL="$(leer_env DB_LOCAL_PORT)"; PUERTO_LOCAL="${PUERTO_LOCAL:-3306}"
if [ -x "$MYSQLDUMP" ]; then
  if MYSQL_PWD="$(leer_env DB_LOCAL_PASSWORD)" "$MYSQLDUMP" \
       --protocol=TCP -h "$(leer_env DB_LOCAL_HOST)" -P "$PUERTO_LOCAL" \
       -u "$(leer_env DB_LOCAL_USER)" \
       --single-transaction --no-tablespaces --routines --triggers --databases "$(leer_env DB_LOCAL_NAME)" \
       > "$ARCHIVO" 2>>"$LOG"; then
    log "OK xampp -> $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"
  else
    rm -f "$ARCHIVO"; log "ERROR xampp (mysqldump)"; errores=$((errores+1))
  fi
else
  # Si XAMPP no está en /opt/lampp se usa el respaldo con Node
  "$NODE" "$DIR_BAT/backup-nube.js" local "$ARCHIVO" >>"$LOG" 2>&1 || errores=$((errores+1))
fi

# ---------- 2. Azure Database for MySQL ----------
"$NODE" "$DIR_BAT/backup-nube.js" azure "$DESTINO/azure/db_azure_$FECHA.sql" >>"$LOG" 2>&1 \
  || errores=$((errores+1))

# ---------- 3. Supabase ----------
"$NODE" "$DIR_BAT/backup-nube.js" supabase "$DESTINO/supabase/db_supabase_$FECHA.sql" >>"$LOG" 2>&1 \
  || errores=$((errores+1))

# ---------- Limpieza de copias viejas ----------
find "$DESTINO" -name '*.sql' -type f -mtime +"$DIAS_RETENCION" -delete

log "===== Fin de backup $FECHA ($errores errores) ====="
exit "$errores"