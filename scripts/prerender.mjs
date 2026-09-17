// Build-time static prerender (SSG) of every route, run after `vite build` (see npm run build).
//
// Why: the SPA shipped an empty <div id="root">, so nothing painted until the JS bundle downloaded
// and executed. The Webflow export paints straight from HTML. Prerendering restores that: each route
// gets its own dist/<route>/index.html with the fully rendered markup, and main.jsx hydrates it.
//
// Fidelity rules:
//  - Markup is produced by the SAME <App /> tree the client renders (react-dom/static prerender), so
//    hydration adopts the DOM unchanged.
//  - Webflow's IX2 initial states that the export bakes into the HTML as inline `style` (only the
//    two Home hero targets) are copied verbatim from reference/original/*.html onto the matching
//    data-w-id elements, so the pre-JS paint equals the export's pre-JS paint (no flash of the
//    final state before the interactions engine starts). The engine owns them after that.
//  - Per-route <title>/data-wf-page match the export page.
import fs from 'node:fs'
import path from 'node:path'
import { build } from 'vite'
import { PAGES } from './pages.mjs'
import { PAGE_TITLES, WF_PAGE_IDS } from '../src/config/site.js'

const DIST = 'dist'
const SSR_OUT = path.join('node_modules', '.cache', 'prerender')

// Route key -> above-the-fold assets worth preloading (see scripts/lighthouse.mjs reports).
// fonts: files under /fonts used by first-viewport text; images: LCP image (imagesrcset/sizes).
const PRELOAD = {
  home: {
    fonts: [],
    images: [],
  },
}

await build({
  logLevel: 'warn',
  build: { ssr: 'scripts/prerender/entry-server.jsx', outDir: SSR_OUT, emptyOutDir: true, minify: false },
})
const { render } = await import(path.resolve(SSR_OUT, 'entry-server.js'))

const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
if (!template.includes('<div id="root"></div>')) throw new Error('dist/index.html is not a fresh vite build')
const manifest = JSON.parse(fs.readFileSync(path.join(DIST, '.vite', 'manifest.json'), 'utf8'))

const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// data-w-id -> inline style from the Webflow export page.
function exportInlineStyles(file) {
  const html = fs.readFileSync(path.join('reference', 'original', file), 'utf8')
  const map = new Map()
  for (const [tag] of html.matchAll(/<[a-z][^>]*\sdata-w-id="[^"]+"[^>]*>/g)) {
    const id = tag.match(/\sdata-w-id="([^"]+)"/)[1]
    const style = tag.match(/\sstyle="([^"]*)"/)
    if (style) map.set(id, style[1])
  }
  return map
}

// Lazy route chunk for a page key (manifest entry of src/pages/<Name>.jsx) + its static imports.
const PAGE_SRC = {
  about: 'src/pages/About.jsx',
  terms: 'src/pages/Terms.jsx',
  privacy: 'src/pages/Privacy.jsx',
  refunds: 'src/pages/Refunds.jsx',
  eligibility: 'src/pages/Eligibility.jsx',
}
function chunkPreloads(key) {
  const src = PAGE_SRC[key]
  if (!src || !manifest[src]) return []
  const seen = new Set()
  const walk = (k) => {
    const e = manifest[k]
    if (!e || seen.has(e.file)) return
    seen.add(e.file)
    ;(e.imports || []).forEach(walk)
  }
  walk(src)
  const entryFiles = new Set()
  const entry = Object.values(manifest).find((e) => e.isEntry)
  const walkEntry = (e) => {
    if (!e || entryFiles.has(e.file)) return
    entryFiles.add(e.file)
    ;(e.imports || []).forEach((k) => walkEntry(manifest[k]))
  }
  walkEntry(entry)
  return [...seen].filter((f) => !entryFiles.has(f)).map((f) => `<link rel="modulepreload" crossorigin href="/${f}">`)
}

for (const [key, [file, route]] of Object.entries(PAGES)) {
  let body = await render(route)

  const styles = exportInlineStyles(file)
  body = body.replace(/<([a-z][a-z0-9]*)(\s[^>]*?\sdata-w-id="([^"]+)"[^>]*)>/g, (tag, name, attrs, id) => {
    if (!styles.has(id) || /\sstyle="/.test(attrs)) return tag
    return `<${name}${attrs} style="${escAttr(styles.get(id))}">`
  })

  const head = [...chunkPreloads(key)]
  const pre = PRELOAD[key] || {}
  for (const f of pre.fonts || []) head.push(`<link rel="preload" href="/fonts/${f}" as="font" type="font/woff2" crossorigin>`)
  for (const img of pre.images || [])
    head.push(
      `<link rel="preload" as="image" href="${img.href}"${img.srcset ? ` imagesrcset="${img.srcset}" imagesizes="${img.sizes}"` : ''} fetchpriority="high">`,
    )

  let html = template
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escAttr(PAGE_TITLES[key])}</title>`)
    .replace(/data-wf-page="[^"]*"/, `data-wf-page="${WF_PAGE_IDS[key]}"`)
    .replace('</head>', `${head.join('\n    ')}${head.length ? '\n  ' : ''}</head>`)

  // /about-us -> dist/about-us.html (vite preview, Vercel cleanUrls and Netlify all resolve it)
  const out = route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, `${route.slice(1)}.html`)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, html)
  console.log(`prerendered ${route.padEnd(26)} -> ${out} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KiB)`)
}

// Build-only artifacts must not ship.
fs.rmSync(path.join(DIST, '.vite'), { recursive: true, force: true })
fs.rmSync(path.join(DIST, 'fonts', 'fonts.css'), { force: true })
