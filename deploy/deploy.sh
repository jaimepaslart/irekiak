#!/usr/bin/env bash
# Deploy Irekiak sur le VPS Hostinger
# Usage:
#   ./deploy/deploy.sh                # push + pull + build + up + healthcheck
#   ./deploy/deploy.sh --no-push      # skip git push (si déjà fait)
#   ./deploy/deploy.sh --no-build     # skip rebuild Docker (juste git pull + restart)
#   ./deploy/deploy.sh --rollback     # revert au commit précédent sur le VPS
#   ./deploy/deploy.sh --status       # check status sans déployer

set -euo pipefail

# === Config ===
SSH_TARGET="root@76.13.38.1"
REMOTE_DIR="/opt/irekiak"
HEALTH_URL="https://irekiak.art/api/bookings/availability"

# Curl GET (not HEAD) — Nitro returns 404 on HEAD for some API routes
hc() { curl -s -o /dev/null -w '%{http_code}' -m "$1" "$2" 2>/dev/null || echo "000"; }

# === Couleurs ===
BLUE='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
RESET='\033[0m'
log()  { printf "${BLUE}==>${RESET} %s\n" "$*"; }
ok()   { printf "${GREEN}✓${RESET}  %s\n" "$*"; }
warn() { printf "${YELLOW}⚠${RESET}  %s\n" "$*"; }
err()  { printf "${RED}✗${RESET}  %s\n" "$*" >&2; }

# === Flags ===
DO_PUSH=1
DO_BUILD=1
DO_ROLLBACK=0
STATUS_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --no-push)   DO_PUSH=0 ;;
    --no-build)  DO_BUILD=0 ;;
    --rollback)  DO_ROLLBACK=1 ;;
    --status)    STATUS_ONLY=1 ;;
    -h|--help)
      sed -n '1,10p' "$0" | grep -E '^#' | sed 's/^# //'
      exit 0
      ;;
    *) err "Unknown flag: $arg"; exit 1 ;;
  esac
done

# === Status only ===
if [[ $STATUS_ONLY -eq 1 ]]; then
  log "Checking status of $HEALTH_URL"
  code=$(hc 10 "$HEALTH_URL")
  if [[ "$code" == "200" ]]; then ok "live (HTTP $code)"; else err "DOWN (HTTP $code)"; fi
  log "Remote container status"
  ssh "$SSH_TARGET" "docker ps --filter name=irekiak-app --format '  {{.Names}}  {{.Status}}'"
  log "Latest remote commit"
  ssh "$SSH_TARGET" "cd $REMOTE_DIR/app && git log -1 --format='  %h  %s  (%ar by %an)'"
  exit 0
fi

# === Rollback ===
if [[ $DO_ROLLBACK -eq 1 ]]; then
  warn "ROLLBACK mode: revert remote to previous commit"
  ssh "$SSH_TARGET" "cd $REMOTE_DIR/app && git log -2 --format='  %h  %s'"
  read -rp "Confirmer rollback ? (y/N) " confirm
  [[ "$confirm" != "y" && "$confirm" != "Y" ]] && { warn "Annulé."; exit 0; }
  ssh "$SSH_TARGET" "cd $REMOTE_DIR/app && git reset --hard HEAD~1 && cd $REMOTE_DIR && docker compose up -d --build"
  sleep 5
  code=$(hc 15 "$HEALTH_URL")
  if [[ "$code" == "200" ]]; then ok "Rolled back, HTTP $code"; else err "HEALTH FAIL after rollback (HTTP $code)"; fi
  exit 0
fi

# === Pre-flight checks ===
log "Pre-flight checks"
cd "$(dirname "$0")/.."

if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
  warn "Uncommitted changes:"
  git status --short
  read -rp "Déployer quand même ? (y/N) " confirm
  [[ "$confirm" != "y" && "$confirm" != "Y" ]] && { warn "Annulé."; exit 0; }
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "main" ]]; then
  warn "Not on main branch (current: $BRANCH)"
  read -rp "Continuer ? (y/N) " confirm
  [[ "$confirm" != "y" && "$confirm" != "Y" ]] && { warn "Annulé."; exit 0; }
fi

# === Git push ===
if [[ $DO_PUSH -eq 1 ]]; then
  log "git push origin $BRANCH"
  git push origin "$BRANCH"
else
  warn "Skip git push (--no-push)"
fi

# === Capture current commit for rollback ===
PREV_COMMIT=$(ssh "$SSH_TARGET" "cd $REMOTE_DIR/app && git rev-parse --short HEAD")
log "Previous remote commit: $PREV_COMMIT (for auto-rollback if health check fails)"

# === Remote deploy ===
log "Remote: git pull + docker rebuild"
if [[ $DO_BUILD -eq 1 ]]; then
  BUILD_CMD="docker compose build"
else
  BUILD_CMD="echo '(skip build)'"
fi

ssh "$SSH_TARGET" "set -e
cd $REMOTE_DIR/app && git pull --ff-only origin main
cd $REMOTE_DIR && $BUILD_CMD && docker compose up -d
" 2>&1 | sed 's/^/  /'

# === Wait for app ready ===
log "Waiting for app to respond (max 60s)"
for i in $(seq 1 30); do
  code=$(hc 5 "$HEALTH_URL")
  if [[ "$code" == "200" ]]; then ok "Live after ${i}×2s (HTTP $code)"; break; fi
  sleep 2
done

# === Health check + auto-rollback ===
FINAL_CODE=$(hc 10 "$HEALTH_URL")
if [[ "$FINAL_CODE" != "200" ]]; then
  err "Health check FAIL (HTTP $FINAL_CODE) → auto-rollback to $PREV_COMMIT"
  ssh "$SSH_TARGET" "cd $REMOTE_DIR/app && git reset --hard $PREV_COMMIT && cd $REMOTE_DIR && docker compose up -d --build"
  sleep 5
  ROLL_CODE=$(hc 10 "$HEALTH_URL")
  if [[ "$ROLL_CODE" == "200" ]]; then ok "Rolled back, HTTP $ROLL_CODE"
  else err "ROLLBACK FAIL (HTTP $ROLL_CODE) — intervention manuelle requise"
  fi
  exit 1
fi

# === Success ===
NEW_COMMIT=$(git rev-parse --short HEAD)
ok "Deployed $PREV_COMMIT → $NEW_COMMIT"
ok "Live: https://irekiak.art/ (HTTP $FINAL_CODE)"
