import { ovhRequest } from './dns-client.mjs'

const ZONE = 'irekiak.eus'

// Exact snapshot of the Guremedia zone captured before the OVH transfer.
// Running this script rebuilds the zone identically: delete everything,
// recreate every record below, refresh.
const TARGET_RECORDS = [
  { fieldType: 'A', subDomain: '', target: '91.200.116.48' },
  { fieldType: 'A', subDomain: 'www', target: '91.200.116.48' },
  { fieldType: 'A', subDomain: 'mail', target: '91.200.116.48' },
  { fieldType: 'A', subDomain: 'mail2', target: '91.200.116.56' },
  { fieldType: 'MX', subDomain: '', target: '10 mail.irekiak.eus.' },
  { fieldType: 'MX', subDomain: '', target: '20 mail2.irekiak.eus.' },
  { fieldType: 'TXT', subDomain: '', target: '"v=spf1 +a +mx +a:server08.guremedia.net -all"' },
  {
    fieldType: 'TXT',
    subDomain: 'default._domainkey',
    target: '"v=DKIM1; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAof7te8nUBdVRWqzVRin+D1lvryJvUn5OjxQQ4kdTMm8P+UA7AjwZNJXPXSlYO583R1838fcSMkSV3hdj3RhK1L/WuiGGl4geB66JGa/lv2WeNEinpVBj/jUDmlpfNHQcwsU8kqNDyqLt8Ar4XIF+AZgJZ09KAMtkN4RQYp1rguzVtSG77ZMvpp9IzQr4e3fbxd7BfKQsCcN9MOYrR7fcO5zsLELT17a3NBeB9jX7d2uk6wbke0yFgFBQdjHfE363bLWn+JpD2LmEkCozwVU2HMpQwy/0xrFiMz6JDnaJ7/KCHi6mpQ8rJVeNLSbtSQbMZXkqAh2uM140oMmmPbsTkwIDAQAB;"',
  },
  { fieldType: 'TXT', subDomain: '_dmarc', target: '"v=DMARC1; p=none; adkim=s; aspf=s"' },
]

async function listRecords() {
  const ids = await ovhRequest('GET', `/domain/zone/${ZONE}/record`)
  const details = await Promise.all(ids.map(id => ovhRequest('GET', `/domain/zone/${ZONE}/record/${id}`)))
  return details
}

function isProtected(rec) {
  // OVH keeps the NS records pointing at its own name servers — deleting them
  // would break the zone delegation.
  return rec.fieldType === 'NS' && rec.subDomain === ''
}

async function purgeNonNs() {
  const records = await listRecords()
  for (const rec of records) {
    if (isProtected(rec)) {
      console.log(`  keep  [${rec.fieldType}] ${rec.subDomain || '@'} → ${rec.target}`)
      continue
    }
    console.log(`  rm    [${rec.fieldType}] ${rec.subDomain || '@'} → ${rec.target.slice(0, 60)}`)
    await ovhRequest('DELETE', `/domain/zone/${ZONE}/record/${rec.id}`)
  }
}

async function createTarget() {
  for (const r of TARGET_RECORDS) {
    console.log(`  add   [${r.fieldType}] ${r.subDomain || '@'} → ${r.target.slice(0, 60)}`)
    await ovhRequest('POST', `/domain/zone/${ZONE}/record`, r)
  }
}

async function refresh() {
  await ovhRequest('POST', `/domain/zone/${ZONE}/refresh`)
}

async function printZone() {
  const records = await listRecords()
  console.log(`\nFinal zone (${records.length} records):`)
  for (const r of records.sort((a, b) => `${a.subDomain}${a.fieldType}`.localeCompare(`${b.subDomain}${b.fieldType}`))) {
    console.log(`  [${r.fieldType}] ${r.subDomain || '@'} → ${r.target.slice(0, 80)}`)
  }
}

console.log(`→ Zone ${ZONE}: purge OVH defaults`)
await purgeNonNs()
console.log(`\n→ Recreate Guremedia-equivalent records`)
await createTarget()
console.log(`\n→ Refresh zone`)
await refresh()
await printZone()
console.log('\nDone. Propagation usually completes within a few minutes on OVH.')
