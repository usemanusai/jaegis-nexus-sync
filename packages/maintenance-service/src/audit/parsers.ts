import fs from 'fs'

export function parseNpm(file: string): Record<string,string> {
  const json = JSON.parse(fs.readFileSync(file,'utf8'))
  return { ...(json.dependencies||{}), ...(json.devDependencies||{}) }
}

export function parseRequirements(file: string): Record<string,string> {
  const out: Record<string,string> = {}
  const lines = fs.readFileSync(file,'utf8').split(/\r?\n/)
  for (const l of lines) {
    const m = l.match(/^([A-Za-z0-9_\-\.]+)==([A-Za-z0-9_\-\.]+)/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

export function parsePyProject(file: string): Record<string,string> {
  const text = fs.readFileSync(file,'utf8')
  const out: Record<string,string> = {}
  const depSec = text.match(/\[tool.poetry.dependencies\]([\s\S]*?)\n\[/)
  if (depSec) depSec[1].split(/\r?\n/).forEach(line=>{
    const m = line.match(/^([A-Za-z0-9_\-\.]+)\s*=\s*"?([^"]+)"?/)
    if (m) out[m[1]] = m[2].replace(/\^|~|>=|<=|==/g,'').trim()
  })
  return out
}

export function parseCargo(file: string): Record<string,string> {
  const text = fs.readFileSync(file,'utf8')
  const out: Record<string,string> = {}
  const depSec = text.match(/\[dependencies\]([\s\S]*?)(\n\[|$)/)
  if (depSec) depSec[1].split(/\r?\n/).forEach(line=>{
    const m = line.match(/^([A-Za-z0-9_\-\_]+)\s*=\s*"?([^"]+)"?/)
    if (m) out[m[1]] = m[2].replace(/\^|~|>=|<=|==/g,'').trim()
  })
  return out
}

