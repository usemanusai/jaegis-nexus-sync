import fetch from 'node-fetch'

export async function latestNpmVersion(pkg: string) {
  const r = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`)
  if (!r.ok) return null
  const j = await r.json() as any
  return j.version || null
}

export async function latestPyPiVersion(pkg: string) {
  const r = await fetch(`https://pypi.org/pypi/${encodeURIComponent(pkg)}/json`)
  if (!r.ok) return null
  const j = await r.json() as any
  return j.info?.version || null
}

export async function latestCratesVersion(pkg: string) {
  const r = await fetch(`https://crates.io/api/v1/crates/${encodeURIComponent(pkg)}`)
  if (!r.ok) return null
  const j = await r.json() as any
  return j.crate?.newest_version || null
}

