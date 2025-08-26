export type Eco = 'npm'|'pypi'|'cargo'

export function parseSemver(v: string) { return v.split('-')[0].split('.').map(n=>parseInt(n,10)||0) }
export function sameMajorMinor(a: string, b: string) {
  const A = parseSemver(a), B = parseSemver(b)
  return A[0]===B[0] && A[1]===B[1]
}
export function gt(a: string, b: string) {
  const A = parseSemver(a), B = parseSemver(b)
  for (let i=0;i<3;i++) { if ((A[i]||0)>(B[i]||0)) return true; if ((A[i]||0)<(B[i]||0)) return false }
  return false
}
// Simplified PEP440-ish numeric compare for PyPI, ignoring pre/post tags
export function parsePep(v: string) { return v.replace(/[^0-9.]/g,'').split('.').map(n=>parseInt(n,10)||0) }
export function sameMajorMinorPep(a: string, b: string) {
  const A = parsePep(a), B = parsePep(b)
  return (A[0]||0)===(B[0]||0) && (A[1]||0)===(B[1]||0)
}
export function gtPep(a: string, b: string) {
  const A = parsePep(a), B = parsePep(b)
  for (let i=0;i<Math.max(A.length,B.length);i++) { const ai=A[i]||0, bi=B[i]||0; if (ai>bi) return true; if (ai<bi) return false }
  return false
}

