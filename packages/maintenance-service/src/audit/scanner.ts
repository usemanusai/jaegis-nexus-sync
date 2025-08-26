import fs from 'fs'
import path from 'path'

export interface FoundManifest { path: string, ecosystem: 'npm'|'pypi'|'cargo', file: string }

export function scanWorkspaces(root: string): FoundManifest[] {
  const results: FoundManifest[] = []
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.git')) continue
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.isFile()) {
        if (e.name === 'package.json') results.push({ path: dir, ecosystem: 'npm', file: full })
        if (e.name === 'requirements.txt' || e.name === 'pyproject.toml') results.push({ path: dir, ecosystem: 'pypi', file: full })
        if (e.name === 'Cargo.toml') results.push({ path: dir, ecosystem: 'cargo', file: full })
      }
    }
  }
  walk(root)
  return results
}

