export function generateBlueprint(files: Array<{ path: string, content: string }>) {
  const summary: string[] = []
  summary.push('# Repository Blueprint')
  // High-level structure
  const tree = files.map(f=>f.path).sort()
  summary.push('## Structure')
  summary.push('```')
  for (const p of tree) summary.push(p)
  summary.push('```')

  // Detect package managers / deps
  const pkg = files.find(f=>f.path.endsWith('package.json'))
  if (pkg) {
    try {
      const json = JSON.parse(pkg.content)
      summary.push('## Node Dependencies')
      summary.push('Dependencies: ' + Object.keys(json.dependencies||{}).join(', '))
      summary.push('DevDependencies: ' + Object.keys(json.devDependencies||{}).join(', '))
    } catch {}
  }

  // Detect Python
  if (files.find(f=>f.path.endsWith('requirements.txt'))) {
    summary.push('## Python Requirements')
    summary.push('requirements.txt present')
  }

  // Top docs
  const docs = files.filter(f=>/README\.md$|CHANGELOG\.md$|LICENSE$/.test(f.path))
  if (docs.length){
    summary.push('## Documentation Files')
    for (const d of docs) summary.push('- ' + d.path)
  }

  return summary.join('\n')
}

