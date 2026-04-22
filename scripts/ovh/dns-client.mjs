import crypto from 'node:crypto'

const ENDPOINT = 'https://eu.api.ovh.com/1.0'

const APP_KEY = process.env.OVH_APPLICATION_KEY
const APP_SECRET = process.env.OVH_APPLICATION_SECRET
const CONSUMER_KEY = process.env.OVH_CONSUMER_KEY

if (!APP_KEY || !APP_SECRET || !CONSUMER_KEY) {
  console.error('Missing OVH_APPLICATION_KEY / OVH_APPLICATION_SECRET / OVH_CONSUMER_KEY')
  console.error('Tip: `set -a; source .env.ovh; set +a` before running.')
  process.exit(1)
}

async function getTimestamp() {
  const res = await fetch(`${ENDPOINT}/auth/time`)
  return (await res.text()).trim()
}

export async function ovhRequest(method, path, body) {
  const url = `${ENDPOINT}${path}`
  const ts = await getTimestamp()
  const payload = body ? JSON.stringify(body) : ''
  const sig = `$1$${crypto.createHash('sha1').update([APP_SECRET, CONSUMER_KEY, method, url, payload, ts].join('+')).digest('hex')}`
  const res = await fetch(url, {
    method,
    headers: {
      'X-Ovh-Application': APP_KEY,
      'X-Ovh-Consumer': CONSUMER_KEY,
      'X-Ovh-Signature': sig,
      'X-Ovh-Timestamp': ts,
      'Content-Type': 'application/json',
    },
    body: payload || undefined,
  })
  const text = await res.text()
  let parsed
  try { parsed = text ? JSON.parse(text) : null } catch { parsed = text }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text}`)
  return parsed
}
