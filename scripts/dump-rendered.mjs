// Dumps the ORIGINAL page's DOM *after* webflow.js has run (sliders, nav, IX initial states)
// to reference/rendered/<page>.html — use alongside the raw export when porting markup.
// Usage: node scripts/dump-rendered.mjs [pageKey ...]
import { chromium } from 'playwright'
import fs from 'node:fs'
import { PAGES, ORIGINAL_BASE } from './pages.mjs'

const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PAGES)
const browser = await chromium.launch()
fs.mkdirSync('reference/rendered', { recursive: true })
for (const key of keys) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${ORIGINAL_BASE}/${PAGES[key][0]}`, { waitUntil: 'load', timeout: 60000 }); await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(1500)
  fs.writeFileSync(`reference/rendered/${key}.html`, await page.evaluate(() => document.documentElement.outerHTML))
  console.log('dumped', key)
  await page.close()
}
await browser.close()
