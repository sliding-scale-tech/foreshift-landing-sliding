// Build-time static prerender (SSG) of every route, run after `vite build` (npm run build).
//
// Why: the SPA shipped an empty <div id="root">, so nothing painted until ~105 KB (gzip) of JS had
// downloaded and executed. The Webflow export paints straight from HTML. Prerendering restores that:
// each route gets its own dist/<route>.html with the fully rendered markup and main.jsx hydrates it.
//
// Per route HTML:
//  1. Markup from the SAME <App /> tree the client renders (react-dom/static prerender) -> hydration
//     adopts the DOM unchanged.
//  2. Webflow IX2 initial states that the export bakes into its HTML as inline `style` (only the two
//     Home hero targets) are copied verbatim from reference/original/*.html onto the matching
//     data-w-id elements, so the pre-JS paint equals the export's pre-JS paint (no flash of the
//     final state). Everything else is hidden pre-JS by interactions.css (html.w-mod-js no-flash
//     rules, exactly like Webflow's <head> styles). The engine owns all of it after hydration.
//  3. Critical CSS: the rules of the built stylesheet whose selectors match this route's static
//     DOM (state pseudo-classes/elements stripped for matching; @font-face/@keyframes kept) are
//     inlined, verbatim and in their original order. The full stylesheet then loads without blocking
//     render. Because the full sheet contains every inlined rule and comes later in the cascade, the
//     final computed styles are exactly those of the full sheet alone.
//  4. The web fonts the page's text needs are preloaded (exact self-hosted Google binaries), so text
//     paints with its final font on first paint (no swap mid-animation).
//  5. After first contentful paint the full stylesheet is attached; once it has loaded the JS entry
//     is imported (like webflow.js at the end of <body> it never competes with first paint, and no
//     JS-added state class can ever render against the critical subset only).
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'
import { build } from 'vite'
import { PAGES } from './pages.mjs'
import { PAGE_TITLES, WF_PAGE_IDS } from '../src/config/site.js'

const DIST = 'dist'
const SSR_OUT = path.join('node_modules', '.cache', 'prerender')

// Lazy route modules (their chunks are modulepreloaded together with the entry import).
const PAGE_SRC = {
  about: 'src/pages/About.jsx',
  terms: 'src/pages/Terms.jsx',
  privacy: 'src/pages/Privacy.jsx',
  refunds: 'src/pages/Refunds.jsx',
  eligibility: 'src/pages/Eligibility.jsx',
}

// ---------------------------------------------------------------------------------------------
await build({
  logLevel: 'warn',
  build: { ssr: 'scripts/prerender/entry-server.jsx', outDir: SSR_OUT, emptyOutDir: true, minify: false },
})
const { render } = await import(path.resolve(SSR_OUT, 'entry-server.js'))

const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
if (!template.includes('<div id="root"></div>')) throw new Error('dist/index.html is not a fresh vite build')
const manifest = JSON.parse(fs.readFileSync(path.join(DIST, '.vite', 'manifest.json'), 'utf8'))
const entry = Object.values(manifest).find((e) => e.isEntry)
const scriptTag = template.match(/<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"><\/script>/)
const cssTag = template.match(/<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/)
if (!scriptTag || !cssTag || `/${entry.file}` !== scriptTag[1]) throw new Error('unexpected vite html output')
const fullCss = fs.readFileSync(path.join(DIST, cssTag[1]), 'utf8')

const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// data-w-id -> inline style, from the Webflow export page.
function exportInlineStyles(file) {
  const html = fs.readFileSync(path.join('reference', 'original', file), 'utf8')
  const map = new Map()
  for (const [tag] of html.matchAll(/<[a-z][^>]*\sdata-w-id="[^"]+"[^>]*>/g)) {
    const style = tag.match(/\sstyle="([^"]*)"/)
    if (style) map.set(tag.match(/\sdata-w-id="([^"]+)"/)[1], style[1])
  }
  return map
}

function routeChunks(key) {
  const entryFiles = new Set()
  const walkEntry = (e) => {
    if (!e || entryFiles.has(e.file)) return
    entryFiles.add(e.file)
    ;(e.imports || []).forEach((k) => walkEntry(manifest[k]))
  }
  walkEntry(entry)
  const seen = new Set()
  const walk = (k) => {
    const e = manifest[k]
    if (!e || seen.has(e.file)) return
    seen.add(e.file)
    ;(e.imports || []).forEach(walk)
  }
  if (PAGE_SRC[key]) walk(PAGE_SRC[key])
  return [...seen].filter((f) => !entryFiles.has(f)).map((f) => `/${f}`)
}

// --- critical CSS ------------------------------------------------------------------------------
// Structural pseudo-classes are kept for matching; every other pseudo (state classes such as
// :hover/:focus/:checked, pseudo-elements, vendor placeholders) is stripped, so a rule is kept when
// its element exists in the DOM regardless of state. Functional :not()/:is()/:where()/:has()/
// :nth-*() are kept as-is. Unparseable selectors are kept (safe side).
const KEEP_PSEUDO = new Set(['root', 'first-child', 'last-child', 'only-child', 'first-of-type', 'last-of-type', 'only-of-type', 'empty'])
function matchSelector(sel) {
  const out = sel.replace(/::?([a-zA-Z-]+)(\((?:[^()]|\([^()]*\))*\))?/g, (m, name, args) => {
    if (args) return /^(not|is|where|has|nth-child|nth-last-child|nth-of-type|nth-last-of-type)$/.test(name) ? m : ''
    return KEEP_PSEUDO.has(name) ? m : ''
  })
  return out.replace(/([>+~,(]\s*)$/, '$1*').trim() || '*'
}
const splitSelectors = (s) => {
  const parts = []
  let depth = 0, cur = '', quote = null
  for (const ch of s) {
    if (quote) { if (ch === quote) quote = null; cur += ch; continue }
    if (ch === '"' || ch === "'") quote = ch
    else if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; continue }
    cur += ch
  }
  parts.push(cur)
  return parts.map((p) => p.trim()).filter(Boolean)
}

const cssRoot = postcss.parse(fullCss)
const selectorSet = new Set()
cssRoot.walkRules((rule) => {
  if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return
  for (const s of splitSelectors(rule.selector)) selectorSet.add(matchSelector(s))
})
const allSelectors = [...selectorSet]

// Playwright Chromium is local-only: Vercel has no browser binary, and launch() would fail the
// deploy. SSR markup still runs. Without a browser we keep the full stylesheet as "critical" and
// preload every self-hosted woff2 so first paint still uses the right fonts.
async function launchBrowser() {
  if (process.env.VERCEL) return null
  try {
    const { chromium } = await import('playwright')
    return await chromium.launch()
  } catch (err) {
    console.warn(`prerender: browser unavailable (${err.message}); using full CSS and on-disk fonts`)
    return null
  }
}

const browser = await launchBrowser()
const MIME = { '.woff2': 'font/woff2', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.webp': 'image/webp' }

function fontFilesOnDisk() {
  const files = new Set()
  for (const dir of [path.join('public', 'fonts'), path.join(DIST, 'fonts')]) {
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith('.woff2')) files.add(name)
    }
  }
  return [...files].sort()
}

// Web-font files the browser requests for this page's static DOM (all text, any viewport, final
// stylesheet) at the four Webflow breakpoints + a 412px phone. They are needed for first paint
// (font-display is the UA default = block), so they are preloaded instead of being discovered only
// after style/layout. Same files, same bytes -> no visual change; text paints with its final font.
async function requestedFonts(html) {
  if (!browser) return fontFilesOnDisk()
  const files = new Set()
  for (const width of [412, 479, 767, 991, 1440]) {
    const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width, height: 900 } })
    await page.route('http://prerender.local/**', (route) => {
      const url = new URL(route.request().url())
      if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: html })
      const file = [path.join(DIST, url.pathname), path.join('public', url.pathname)].find((f) => fs.existsSync(f))
      if (!file) return route.fulfill({ status: 404 })
      return route.fulfill({ contentType: MIME[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) })
    })
    page.on('request', (r) => {
      const m = r.url().match(/\/fonts\/([^/?]+\.woff2)$/)
      if (m) files.add(m[1])
    })
    await page.goto('http://prerender.local/', { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.close()
  }
  return [...files].sort()
}
async function matchingSelectors(html) {
  if (!browser) return new Set(allSelectors)
  const page = await browser.newPage({ javaScriptEnabled: false })
  await page.setContent(html.replace(/<link[^>]+>/g, ''), { waitUntil: 'domcontentloaded' })
  const res = await page.evaluate((sels) => sels.map((s) => {
    try { return !!document.querySelector(s) } catch { return true }
  }), allSelectors)
  await page.close()
  return new Set(allSelectors.filter((_, i) => res[i]))
}

function criticalCss(matched) {
  const root = cssRoot.clone()
  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return
    const keep = splitSelectors(rule.selector).some((s) => matched.has(matchSelector(s)))
    if (!keep) rule.remove()
  })
  root.walkAtRules((at) => {
    if (/^(media|supports|container|layer)$/i.test(at.name) && (!at.nodes || at.nodes.length === 0)) at.remove()
  })
  // Remove at-rules emptied by the pass above (nested media).
  root.walkAtRules((at) => {
    if (/^(media|supports|container|layer)$/i.test(at.name) && (!at.nodes || at.nodes.length === 0)) at.remove()
  })
  return root.toString().replace(/<\/style/gi, '<\\/style')
}

// --- loader -------------------------------------------------------------------------------------
// After first contentful paint: attach the full stylesheet, and once it has loaded import the entry
// (with the route chunk modulepreloaded). Browsers without paint timing fall back to window load.
const loader = (cssHref, entryHref, chunks) =>
  `<script type="module">` +
  `new Promise(r=>{if(PerformanceObserver.supportedEntryTypes?.includes("paint")){new PerformanceObserver((l,o)=>{if(l.getEntriesByName("first-contentful-paint").length){o.disconnect();r()}}).observe({type:"paint",buffered:true})}else addEventListener("load",r,{once:true})})` +
  `.then(()=>new Promise(r=>{const l=document.createElement("link");l.rel="stylesheet";l.href=${JSON.stringify(cssHref)};l.onload=l.onerror=r;document.head.append(l)}))` +
  `.then(()=>{for(const h of ${JSON.stringify(chunks)}){const l=document.createElement("link");l.rel="modulepreload";l.crossOrigin="";l.href=h;document.head.append(l)}import(${JSON.stringify(entryHref)})})` +
  `</script>`

// --- render every route -------------------------------------------------------------------------
for (const [key, [file, route]] of Object.entries(PAGES)) {
  // React 19 SSR prepends <link rel="preload" as="image"> for every non-lazy <img> it renders
  // (e.g. Coin-Design.svg, 57 KB, on Home). Neither the export nor the client-rendered app issues
  // those, and they pull below-the-fold images ahead of fonts/first paint -> strip them.
  let body = (await render(route)).replace(/^(?:<link rel="preload" as="image"[^>]*\/>)+/, '')
  const styles = exportInlineStyles(file)
  let injected = 0
  body = body.replace(/<([a-z][a-z0-9]*)((?:\s[^>]*?)?\sdata-w-id="([^"]+)"[^>]*?)(\/?)>/g, (tag, name, attrs, id, selfClose) => {
    if (!styles.has(id) || /\sstyle="/.test(attrs)) return tag
    injected++
    return `<${name}${attrs} style="${escAttr(styles.get(id))}"${selfClose}>`
  })
  if (injected !== styles.size) throw new Error(`${route}: injected ${injected} of ${styles.size} export initial styles`)

  let html = template
    .replace('<div id="root"></div>', () => `<div id="root" data-route="${route}">${body}</div>`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escAttr(PAGE_TITLES[key])}</title>`)
    .replace(/data-wf-page="[^"]*"/, `data-wf-page="${WF_PAGE_IDS[key]}"`)
    .replace(scriptTag[0], '')

  const withFullCss = html.replace(cssTag[0], () => `<style>${fullCss}</style>`)
  const critical = criticalCss(await matchingSelectors(withFullCss))
  const fonts = await requestedFonts(withFullCss)
  const preloads = fonts.map((f) => `<link rel="preload" href="/fonts/${f}" as="font" type="font/woff2" crossorigin>`)
  html = html
    .replace('<meta content="width=device-width, initial-scale=1" name="viewport" />', (m) => `${m}\n    ${preloads.join('\n    ')}`)
    .replace(
      cssTag[0],
      () =>
        `<style>${critical}</style>\n    <noscript><link rel="stylesheet" href="${cssTag[1]}"></noscript>`,
    )
    .replace('</body>', () => `  ${loader(cssTag[1], scriptTag[1], routeChunks(key))}\n  </body>`)

  // /about-us -> dist/about-us.html (vite preview, Vercel cleanUrls and Netlify all resolve it)
  const out = route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, `${route.slice(1)}.html`)
  fs.writeFileSync(out, html)
  console.log(
    `prerendered ${route.padEnd(26)} -> ${out.padEnd(36)} ${(Buffer.byteLength(html) / 1024).toFixed(1)} KiB ` +
      `(critical css ${(critical.length / 1024).toFixed(1)} of ${(fullCss.length / 1024).toFixed(1)} KiB, ${fonts.length} font preloads)`,
  )
}
if (browser) await browser.close()

// Build-only artifacts must not ship.
fs.rmSync(path.join(DIST, '.vite'), { recursive: true, force: true })
fs.rmSync(path.join(DIST, 'fonts', 'fonts.css'), { force: true })
