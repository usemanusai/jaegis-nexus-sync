import { build } from 'esbuild'
import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'

mkdirSync('dist', { recursive: true })

// Copy manifest and static html
copyFileSync('manifest.json', 'dist/manifest.json')
mkdirSync('dist/src/popup', { recursive: true })
copyFileSync('src/popup/index.html', 'dist/src/popup/index.html')

await build({
  entryPoints: [
    'src/background.js',
    'src/content/gemini.js',
    'src/content/chatzai.js',
    'src/popup/popup.js'
  ],
  outdir: 'dist',
  bundle: true,
  format: 'esm',
  sourcemap: false,
  minify: true,
})

