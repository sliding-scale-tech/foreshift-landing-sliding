// Self-host the exact Google Fonts binaries the Webflow export loads.
// Fetches the SAME css v1 URL that WebFont.load() requested in the export (with a Chrome UA, so the
// woff2 + unicode-range variant Chrome receives), downloads the referenced woff2 files byte-for-byte
// into public/fonts/, and writes public/fonts/fonts.css with the URLs rewritten to /fonts/….
// vite.config.js inlines that CSS into <head> (no render-blocking third-party request).
//
// Kept: the faces the pages actually render (audited with Playwright over every page, every width,
// hidden elements and form fields included): Inter, Montserrat and Poppins, normal style, latin subset
// (every glyph used — incl. ’ – — © and U+200D — is inside the latin unicode-range).
// Dropped: ABeeZee / Comfortaa / Open Sans and all italics (never rendered — the export only downloaded
// them because WebFont loader probes every variant), and latin-ext/cyrillic/greek/vietnamese subsets.
// Dropping unused @font-face rules keeps ~20 KB of rules out of every page's inlined <head>.
// Usage: node scripts/fetch-fonts.mjs
import fs from 'node:fs'
import path from 'node:path'

const GOOGLE_URL =
  'https://fonts.googleapis.com/css?family=Montserrat:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic|Open+Sans:300,300italic,400,400italic,600,600italic,700,700italic,800,800italic|ABeeZee:300,400,500,600,700|Comfortaa:300,400,500,600,700|Inter:200,300,400,500,600,700,800|Poppins:300,400,500,600,700'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
const KEEP_FAMILIES = new Set(['Inter', 'Montserrat', 'Poppins'])
const KEEP_STYLES = new Set(['normal'])
const KEEP_SUBSETS = new Set(['latin'])
const OUT = path.join('public', 'fonts')

const css = await (await fetch(GOOGLE_URL, { headers: { 'User-Agent': UA } })).text()
const blocks = [...css.matchAll(/\/\* ([\w-]+) \*\/\s*@font-face \{([^}]*)\}/g)]
if (!blocks.length) throw new Error('Unexpected Google Fonts response')

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
const faces = []
const files = new Map()
for (const [, subset, body] of blocks) {
  const family = body.match(/font-family: '([^']+)'/)[1]
  const fontStyle = body.match(/font-style: (\w+)/)[1]
  if (!KEEP_FAMILIES.has(family) || !KEEP_STYLES.has(fontStyle) || !KEEP_SUBSETS.has(subset)) continue
  const url = body.match(/url\((https:[^)]+)\)/)[1]
  // e.g. https://fonts.gstatic.com/s/inter/v20/UcC7….woff2 -> inter-v20-UcC7….woff2
  const [, fam, ver, name] = url.match(/\/s\/([^/]+)\/([^/]+)\/(.+)$/)
  const local = `${fam}-${ver}-${name}`
  files.set(url, local)
  const style = body.match(/font-style: (\w+)/)[1]
  const weight = body.match(/font-weight: (\d+)/)[1]
  const range = body.match(/unicode-range: ([^;]+)/)[1]
  // No font-display, exactly like the Google css v1 response the export used (UA default = block).
  faces.push(
    `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};src:url(/fonts/${local}) format('woff2');unicode-range:${range.replace(/, /g, ',')}}`,
  )
}
for (const [url, local] of files) {
  const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer())
  fs.writeFileSync(path.join(OUT, local), buf)
}
fs.writeFileSync(path.join(OUT, 'fonts.css'), faces.join('\n') + '\n')
console.log(`${faces.length} @font-face rules, ${files.size} woff2 files -> ${OUT}`)
