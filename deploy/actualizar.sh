#!/usr/bin/env bash
# Actualiza la app en la VM después de hacer push en GitHub.
# Uso (en la VM): bash deploy/actualizar.sh
set -euo pipefail
PROYECTO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROYECTO"

git pull --ff-only
cd backend
npm ci --omit=dev          # solo dependencias de producción del backend
sudo systemctl restart cafeteria
sleep 2
systemctl --no-pager --lines=5 status cafeteria
curl -s http://localhost:3000/api/health && echo