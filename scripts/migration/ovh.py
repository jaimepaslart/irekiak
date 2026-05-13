#!/usr/bin/env python3
"""OVH API helper for irekiak.eus DNS zone management.

Reads credentials from /Users/paulbihr/Sites/Irekiak/.env.ovh (not committed).

Usage:
  python3 ovh.py list                                  # List all records
  python3 ovh.py add <type> <sub> <target> [ttl]       # Add new record
  python3 ovh.py update <id> <target>                  # Update target of record by ID
  python3 ovh.py delete <id>                           # Delete record by ID
  python3 ovh.py refresh                               # Refresh/apply zone
  python3 ovh.py flip-a <new-ip>                       # Flip A records of @ and www
  python3 ovh.py snapshot <path>                       # Dump zone to JSON file
"""
import hashlib
import json
import os
import sys
import time
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ENV_FILE = Path(__file__).resolve().parents[2] / '.env.ovh'

def load_env() -> dict:
    out = {}
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        out[k.strip()] = v.strip()
    return out

ENV = load_env()
AK = ENV['OVH_APPLICATION_KEY']
AS_ = ENV['OVH_APPLICATION_SECRET']
CK = ENV['OVH_CONSUMER_KEY']
BASE = 'https://eu.api.ovh.com/1.0'
ZONE = 'irekiak.eus'


def call(method: str, path: str, body: dict | None = None):
    url = BASE + path
    body_str = json.dumps(body) if body is not None else ''
    t = str(int(time.time()))
    sig = '$1$' + hashlib.sha1(
        f'{AS_}+{CK}+{method}+{url}+{body_str}+{t}'.encode()
    ).hexdigest()
    headers = {
        'X-Ovh-Application': AK,
        'X-Ovh-Consumer': CK,
        'X-Ovh-Timestamp': t,
        'X-Ovh-Signature': sig,
        'Content-Type': 'application/json',
    }
    req = Request(url, method=method, headers=headers,
                  data=body_str.encode() if body_str else None)
    try:
        with urlopen(req, timeout=15) as r:
            data = r.read().decode()
            return json.loads(data) if data else None
    except HTTPError as e:
        err = e.read().decode()
        raise SystemExit(f'OVH API {method} {path} → {e.code}: {err}')


def cmd_list():
    ids = call('GET', f'/domain/zone/{ZONE}/record')
    print(f"{'ID':<12} {'TYPE':<6} {'SUBDOMAIN':<28} {'TTL':<6} TARGET")
    print('-' * 100)
    for rid in ids:
        r = call('GET', f'/domain/zone/{ZONE}/record/{rid}')
        sub = r.get('subDomain', '') or '@'
        print(f"{r['id']:<12} {r['fieldType']:<6} {sub:<28} {r['ttl']:<6} {r['target'][:90]}")


def cmd_add(field_type: str, sub: str, target: str, ttl: int = 3600):
    body = {'fieldType': field_type, 'subDomain': sub if sub != '@' else '', 'target': target, 'ttl': ttl}
    r = call('POST', f'/domain/zone/{ZONE}/record', body)
    print(f'Added record id={r["id"]} {field_type} {sub} → {target}')


def cmd_update(rid: int, target: str):
    body = {'target': target}
    call('PUT', f'/domain/zone/{ZONE}/record/{rid}', body)
    print(f'Updated record id={rid} target={target}')


def cmd_delete(rid: int):
    call('DELETE', f'/domain/zone/{ZONE}/record/{rid}')
    print(f'Deleted record id={rid}')


def cmd_refresh():
    call('POST', f'/domain/zone/{ZONE}/refresh')
    print(f'Zone {ZONE} refreshed (DNS propagation up to TTL)')


def cmd_flip_a(new_ip: str):
    ids = call('GET', f'/domain/zone/{ZONE}/record?fieldType=A')
    flipped = 0
    for rid in ids:
        r = call('GET', f'/domain/zone/{ZONE}/record/{rid}')
        sub = r.get('subDomain', '') or '@'
        if sub in ('@', '', 'www'):
            print(f'  flip A {sub:<5}: {r["target"]} → {new_ip}')
            call('PUT', f'/domain/zone/{ZONE}/record/{rid}', {'target': new_ip})
            flipped += 1
    print(f'\nFlipped {flipped} A records. Run "refresh" to apply.')


def cmd_snapshot(path: str):
    ids = call('GET', f'/domain/zone/{ZONE}/record')
    out = []
    for rid in ids:
        out.append(call('GET', f'/domain/zone/{ZONE}/record/{rid}'))
        time.sleep(0.1)
    Path(path).write_text(json.dumps(out, indent=2))
    print(f'Snapshot saved → {path} ({len(out)} records)')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    cmd = sys.argv[1]
    args = sys.argv[2:]
    {
        'list': cmd_list,
        'add': lambda: cmd_add(args[0], args[1], args[2], int(args[3]) if len(args) > 3 else 3600),
        'update': lambda: cmd_update(int(args[0]), args[1]),
        'delete': lambda: cmd_delete(int(args[0])),
        'refresh': cmd_refresh,
        'flip-a': lambda: cmd_flip_a(args[0]),
        'snapshot': lambda: cmd_snapshot(args[0]),
    }[cmd]()
