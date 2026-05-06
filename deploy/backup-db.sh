#!/usr/bin/env bash
# Daily SQLite backup with 14-day rotation.
# Runs on the VPS (Hostinger) outside the Docker container — operates on the
# host volume /opt/irekiak/data/irekiak.db that's bind-mounted into irekiak-app.
#
# Install: see deploy/README.md (scp + crontab line).
# Manual run: ./backup-db.sh

set -euo pipefail

DB_PATH="/opt/irekiak/data/irekiak.db"
BACKUP_DIR="/opt/irekiak/backups"
LOG_FILE="/var/log/irekiak-backup.log"
RETENTION_DAYS=14

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log() { echo "[$(ts)] $*" | tee -a "$LOG_FILE" >&2; }

if [[ ! -f "$DB_PATH" ]]; then
  log "ERROR: $DB_PATH not found"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

stamp=$(date -u +"%Y-%m-%d")
out="$BACKUP_DIR/irekiak-$stamp.db"

# sqlite3 .backup is safe under WAL — no need to stop the app.
if ! sqlite3 "$DB_PATH" ".backup '$out'"; then
  log "ERROR: sqlite3 .backup failed"
  exit 1
fi

gzip -f "$out"
size=$(stat -c%s "$out.gz" 2>/dev/null || stat -f%z "$out.gz")
log "OK $out.gz (${size} bytes)"

find "$BACKUP_DIR" -name 'irekiak-*.db.gz' -mtime "+$RETENTION_DAYS" -delete -print \
  | while read -r f; do log "pruned $f"; done

# Sanity check: alert if backup is suspiciously small (< 4 KB = empty DB).
if [[ "$size" -lt 4096 ]]; then
  log "WARN: backup smaller than 4KB, verify the DB is not corrupted"
fi
