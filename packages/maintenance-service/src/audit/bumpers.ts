import fs from 'fs'

export function bumpNpm(file: string, name: string, to: string) {
  const json = JSON.parse(fs.readFileSync(file,'utf8'))
  if (json.dependencies?.[name]) json.dependencies[name] = to
  if (json.devDependencies?.[name]) json.devDependencies[name] = to
  return JSON.stringify(json, null, 2)
}

export function bumpRequirements(file: string, name: string, to: string) {
  const lines = fs.readFileSync(file,'utf8').split(/\r?\n/)
  const out = lines.map(l=> l.replace(new RegExp(`^(${name})==[^\s#]+`), `$1==${to}`))
  return out.join('\n')
}

export function bumpCargo(file: string, name: string, to: string) {
  const text = fs.readFileSync(file,'utf8')
  const out = text.replace(new RegExp(`^(${name})\s*=\s*"[^"]+"`, 'm'), `$1 = "${to}"`)
  return out
}

