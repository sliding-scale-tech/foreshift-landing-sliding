// Lighthouse performance runner.
// Usage:
//   node scripts/lighthouse.mjs [pageKey ...] [--base=http://localhost:4173] [--original]
//                               [--presets=mobile,desktop] [--runs=3] [--label=build]
//   --original  test the Webflow export (ORIGINAL_BASE, *.html files) instead of the React build
// Mobile = Lighthouse default (Moto G Power emulation, simulated slow-4G throttling, 4x CPU).
// Desktop = Lighthouse's desktop-config preset.
// Writes lighthouse/<label>/<page>-<preset>-<run>.json and lighthouse/<label>/summary.json
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import * as chromeLauncher from 'chrome-launcher'
import fs from 'node:fs'
import path from 'node:path'
import { PAGES, ORIGINAL_BASE } from './pages.mjs'

const args = process.argv.slice(2)
const opt = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`))
  return a ? a.slice(name.length + 3) : def
}
const original = args.includes('--original')
const base = opt('base', original ? ORIGINAL_BASE : 'http://localhost:4173')
const runs = Number(opt('runs', 3))
const presets = opt('presets', 'mobile,desktop').split(',')
const label = opt('label', original ? 'original' : 'build')
const keys = args.filter((a) => !a.startsWith('--'))
const pages = keys.length ? keys : Object.keys(PAGES)
const outDir = path.join('lighthouse', label)
fs.mkdirSync(outDir, { recursive: true })

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const mobileConfig = { extends: 'lighthouse:default', settings: { onlyCategories: ['performance'] } }
const deskConfig = { ...desktopConfig, settings: { ...desktopConfig.settings, onlyCategories: ['performance'] } }

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}
const fmt = (ms) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`)

const summary = []
for (const key of pages) {
  const [file, route] = PAGES[key]
  const url = original ? `${base}/${file}` : `${base}${route}`
  for (const preset of presets) {
    const results = []
    for (let i = 1; i <= runs; i++) {
      // Fresh Chrome (and profile) per run so nothing is cached between runs.
      const chrome = await chromeLauncher.launch({
        chromePath: CHROME,
        chromeFlags: ['--headless=new', '--no-first-run', '--disable-extensions'],
      })
      try {
        const res = await lighthouse(
          url,
          { port: chrome.port, output: 'json', logLevel: 'error' },
          preset === 'desktop' ? deskConfig : mobileConfig,
        )
        const lhr = res.lhr
        fs.writeFileSync(path.join(outDir, `${key}-${preset}-${i}.json`), res.report)
        const a = lhr.audits
        const r = {
          score: Math.round((lhr.categories.performance.score ?? 0) * 100),
          lcp: a['largest-contentful-paint'].numericValue,
          fcp: a['first-contentful-paint'].numericValue,
          tbt: a['total-blocking-time'].numericValue,
          cls: a['cumulative-layout-shift'].numericValue,
          si: a['speed-index'].numericValue,
        }
        if (lhr.runtimeError) r.error = lhr.runtimeError.message
        results.push(r)
        console.log(
          `${key.padEnd(12)} ${preset.padEnd(7)} run${i}  perf ${String(r.score).padStart(3)}  ` +
            `LCP ${fmt(r.lcp).padEnd(7)} FCP ${fmt(r.fcp).padEnd(7)} TBT ${fmt(r.tbt).padEnd(6)} ` +
            `CLS ${r.cls.toFixed(3)}  SI ${fmt(r.si)}${r.error ? '  ERROR ' + r.error : ''}`,
        )
      } finally {
        await chrome.kill()
      }
    }
    const m = (k) => median(results.map((r) => r[k]))
    const row = {
      page: key, preset, url,
      median: m('score'), min: Math.min(...results.map((r) => r.score)),
      lcp: m('lcp'), fcp: m('fcp'), tbt: m('tbt'), cls: m('cls'), si: m('si'),
      runs: results,
    }
    summary.push(row)
    console.log(
      `${key.padEnd(12)} ${preset.padEnd(7)} MEDIAN perf ${String(row.median).padStart(3)} (min ${row.min})  ` +
        `LCP ${fmt(row.lcp)} FCP ${fmt(row.fcp)} TBT ${fmt(row.tbt)} CLS ${row.cls.toFixed(3)} SI ${fmt(row.si)}`,
    )
  }
}
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2))
console.log('\nSUMMARY')
for (const r of summary) {
  console.log(`${r.page.padEnd(12)} ${r.preset.padEnd(7)} median ${r.median} min ${r.min}  LCP ${fmt(r.lcp)} FCP ${fmt(r.fcp)} TBT ${fmt(r.tbt)} CLS ${r.cls.toFixed(3)} SI ${fmt(r.si)}`)
}
