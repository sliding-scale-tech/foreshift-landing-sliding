// Animation trace comparison: original Webflow export vs React port.
// Usage: node scripts/anim-trace.mjs <pageKey> [--widths=1440,479] [--verbose]
//   ORIGINAL_BASE (default http://localhost:5500), REACT_BASE (default http://localhost:5173)
//
// For every interaction hook ([data-w-id], [data-wf-target], [animation]) and every IX2 action
// child target, samples getComputedStyle opacity + transform on both sides:
//  1. load phase  — every animation frame for 4s after IX2 starts (html.w-mod-ix) and after IX3
//                   starts (html.w-mod-ix3); resampled at fixed offsets (linear interpolation);
//  2. scroll phase — jump to fixed scrollY positions, sample at +150ms and +1300ms;
//  3. mouse phase  — (>=992px, home) hover the hero image / leave it;
//  4. final inline style strings (what anti-aliasing parity depends on).
// Tolerances: opacity ±0.03, translate ±2px, other matrix terms ±0.02.
import { chromium } from 'playwright'
import { PAGES, ORIGINAL_BASE } from './pages.mjs'

const REACT = process.env.REACT_BASE || 'http://localhost:5173'
const args = process.argv.slice(2)
const key = args.find((a) => !a.startsWith('--')) || 'home'
const widths = (args.find((a) => a.startsWith('--widths=')) || '--widths=1440,479').split('=')[1].split(',').map(Number)
const verbose = args.includes('--verbose')
const [file, route] = PAGES[key]
const TOL = { op: 0.03, tr: 2, m: 0.02 }
const FRAME_SHIFTS = Array.from({ length: 35 }, (_, i) => (i % 2 ? 1 : -1) * Math.ceil(i / 2)) // 0, ±1 … ±17ms
const IX2_TIMES = [0, 100, 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 3500]
const SCROLL_TIMES = [50, 150, 400, 800, 1300]
const IX3_TIMES = [0, 50, 100, 175, 250, 350, 500]
const TARGET_SELECTORS = [
  '.rt-marquee-left-text', '.rt-change-stroke-copy', '.rt-counter-train-2', '.spark-hold-circles', '.spark-hold-circles-2',
  '.spark-big-circle-4', '.rt-marque-text-two-2', '.container_img', '.rt-button-text-4', '.rt-button-arrow-5',
]

const RECORDER = ({ targets, recordMs }) => {
  const hookKey = (el, counts) => {
    let k
    if (el.dataset.wId) k = `w-id:${el.dataset.wId.slice(-4)}`
    else if (el.dataset.wfTarget) k = `wft:${(el.dataset.wfTarget.match(/"([^"]+)"\]/) || [])[1]?.slice(-4)}`
    else if (el.getAttribute('animation')) k = `anim:${el.getAttribute('animation')}`
    else k = targets.find((s) => el.matches(s))
    counts[k] = (counts[k] || 0) + 1
    return `${k}#${counts[k]}`
  }
  const sel = ['[data-w-id]', '[data-wf-target]', '[animation]', ...targets].join(',')
  window.__snap = () => {
    const counts = {}
    const out = {}
    for (const el of document.querySelectorAll(sel)) {
      if (el.closest('.w-nav')) continue
      const cs = getComputedStyle(el)
      out[hookKey(el, counts)] = [parseFloat(cs.opacity), cs.transform, el.getAttribute('style') || '']
    }
    return out
  }
  // scroll to y, then record every animation frame for ms (t relative to the scrollTo call)
  window.__scrollRecord = (y, ms) =>
    new Promise((resolve) => {
      const frames = []
      const t0 = performance.now()
      if (y != null) window.scrollTo(0, y)
      frames.push([0, window.__snap()])
      const step = () => {
        const t = performance.now() - t0
        frames.push([t, window.__snap()])
        if (t < ms) requestAnimationFrame(step)
        else resolve(frames)
      }
      requestAnimationFrame(step)
    })
  window.__recordFrames = (ms) => window.__scrollRecord(null, ms)
  const T = (window.__trace = { t0: {}, frames: { ix2: [], ix3: [] } })
  const rec = (name) => {
    const t0 = (T.t0[name] = performance.now())
    const step = () => {
      const t = performance.now() - t0
      T.frames[name].push([t, window.__snap()])
      if (t < recordMs) requestAnimationFrame(step)
    }
    T.frames[name].push([0, window.__snap()])
    requestAnimationFrame(step)
  }
  // IX2 t0: engine started (html.w-mod-ix) AND the document has left 'loading'. Webflow inits IX2
  // mid-parse but only evaluates scroll events on the first readystatechange ('interactive'), whose
  // timing depends on how long the CDN gsap scripts after webflow.js take to download.
  const check = () => {
    const h = document.documentElement
    if (!h) return
    if (!T.t0.ix2 && h.classList.contains('w-mod-ix') && document.readyState !== 'loading') rec('ix2')
    if (!T.t0.ix3 && h.classList.contains('w-mod-ix3')) rec('ix3')
  }
  new MutationObserver(check).observe(document, { attributes: true, subtree: true, attributeFilter: ['class'], childList: true })
  document.addEventListener('readystatechange', check)
}

const matrix = (tf) => {
  if (!tf || tf === 'none') return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  const v = tf.match(/\(([^)]+)\)/)[1].split(',').map(Number)
  if (tf.startsWith('matrix3d')) return v
  const [a, b, c, d, e, f] = v
  return [a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, e, f, 0, 1]
}
const lerp = (a, b, t) => a + (b - a) * t
function sampleAt(frames, time, k) {
  let i = frames.findIndex(([t]) => t >= time)
  if (i === -1) i = frames.length - 1
  const [t1, s1] = frames[i]
  const prev = frames[i - 1]
  const v1 = s1[k]
  if (!v1) return null
  if (!prev || t1 <= time || !prev[1][k]) return { op: v1[0], m: matrix(v1[1]) }
  const [t0, s0] = prev
  const r = (time - t0) / (t1 - t0)
  const m0 = matrix(s0[k][1])
  const m1 = matrix(v1[1])
  return { op: lerp(s0[k][0], v1[0], r), m: m0.map((x, j) => lerp(x, m1[j], r)) }
}
const toSample = (v) => v && { op: v[0], m: matrix(v[1]) }
function delta(a, b) {
  if (!a || !b) return { op: a || b ? Infinity : 0, tr: 0, m: 0 }
  const tr = Math.max(...[12, 13, 14].map((j) => Math.abs(a.m[j] - b.m[j])))
  const m = Math.max(...a.m.map((x, j) => ([12, 13, 14].includes(j) ? 0 : Math.abs(x - b.m[j]))))
  return { op: Math.abs(a.op - b.op), tr, m }
}

async function run(base, url, width, scrollYs, scrollPhaseAt) {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.addInitScript(RECORDER, { targets: TARGET_SELECTORS, recordMs: 4000 })
  await page.goto(url, { waitUntil: 'load', timeout: 60000 })
  await page.waitForFunction(() => window.__trace.t0.ix2 && window.__trace.t0.ix3, null, { timeout: 30000 })
  // Start the scroll phase at the same time-since-IX2-start on both sides (the original's IX3 starts
  // at window load, ~seconds after IX2, so "4s after IX3" alone would desync IX2 loops like marquees).
  await page.waitForFunction(
    (since) => performance.now() - window.__trace.t0.ix3 > 4100 && performance.now() - window.__trace.t0.ix2 > since,
    scrollPhaseAt || 0,
    { timeout: 60000, polling: 'raf' },
  )
  const phaseStart = await page.evaluate(() => performance.now() - window.__trace.t0.ix2)
  const trace = await page.evaluate(() => window.__trace)
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  const ys = scrollYs || Array.from({ length: Math.ceil(height / 700) }, (_, i) => i * 700)
  const scroll = []
  for (const y of ys) {
    scroll.push({ y, frames: await page.evaluate((yy) => window.__scrollRecord(yy, 1300), y) })
  }
  const mouse = []
  if (width >= 992 && key === 'home') {
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(800)
    const box = await page.evaluate(() => {
      const r = document.querySelector('[data-w-id="fc305085-c286-b022-5e74-c40c5ba76a5b"]')?.getBoundingClientRect()
      return r && { x: r.left + r.width * 0.25, y: r.top + r.height * 0.3 }
    })
    if (box) {
      const recordAfter = async (label, action) => {
        const pending = page.evaluate(() => window.__recordFrames(900))
        await action()
        mouse.push({ label, frames: await pending })
      }
      await recordAfter('hover', () => page.mouse.move(box.x, box.y))
      await recordAfter('leave', () => page.mouse.move(5, 890))
    }
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(1500)
  const final = await page.evaluate(() => window.__snap())
  await page.waitForTimeout(120)
  const final2 = await page.evaluate(() => window.__snap())
  for (const k of Object.keys(final)) if (final2[k]?.[2] !== final[k][2]) final[k].moving = true
  await browser.close()
  return { trace, scroll, mouse, final, ys, height, errors, phaseStart }
}

// ---- --nav: Webflow navbar open/close comparison (menu transform per frame + DOM/aria state + screenshots)
async function navRun(url, width, shotDir, label) {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(url, { waitUntil: 'load', timeout: 60000 })
  await page.waitForTimeout(1500)
  const state = () =>
    page.evaluate(() => {
      const nav = document.querySelector('.w-nav')
      const btn = nav.querySelector('.w-nav-button')
      const menu = nav.querySelector('.w-nav-menu')
      const ov = nav.querySelector('.w-nav-overlay')
      const attrs = (el) => [...el.attributes].filter((a) => a.name !== 'class').map((a) => `${a.name}=${a.value}`).join(' ')
      return {
        button: `${btn.className} | ${attrs(btn)}`,
        menuParent: menu.parentElement.className,
        menuStyle: menu.getAttribute('style'),
        menuOpenAttr: menu.hasAttribute('data-nav-menu-open'),
        links: [...menu.querySelectorAll('.w-nav-link')].map((a) => a.className).join(' / '),
        overlay: ov && `${ov.outerHTML.replace(/<nav[\s\S]*<\/nav>/, '<nav…/>')} | display=${getComputedStyle(ov).display}`,
      }
    })
  const frames = (ms) =>
    page.evaluate(
      (ms) =>
        new Promise((res) => {
          const out = []
          const t0 = performance.now()
          const menu = document.querySelector('.w-nav .w-nav-menu')
          const step = () => {
            const t = performance.now() - t0
            out.push([t, new DOMMatrix(getComputedStyle(menu).transform).m42, menu.getBoundingClientRect().top])
            if (t < ms) requestAnimationFrame(step)
            else res(out)
          }
          step()
        }),
      ms,
    )
  const result = { closed: await state() }
  const openRec = frames(600)
  await page.click('.w-nav-button')
  await page.waitForTimeout(150)
  await page.screenshot({ path: `${shotDir}/${label}-opening-150ms.png` })
  result.openFrames = await openRec
  result.open = await state()
  await page.screenshot({ path: `${shotDir}/${label}-open.png` })
  const closeRec = frames(600)
  await page.mouse.click(5, 880)
  await page.waitForTimeout(150)
  await page.screenshot({ path: `${shotDir}/${label}-closing-150ms.png` })
  result.closeFrames = await closeRec
  result.closed2 = await state()
  // hash link inside the open menu closes it (Webflow closes only for #links)
  await page.click('.w-nav-button')
  await page.waitForTimeout(600)
  result.linkHrefs = await page.evaluate(() => [...document.querySelectorAll('.w-nav .w-nav-link')].map((a) => a.getAttribute('href')))
  await browser.close()
  return result
}

if (args.includes('--nav')) {
  const fs = await import('node:fs')
  for (const width of widths) {
    const dir = `parity/nav/${key}/${width}`
    fs.mkdirSync(dir, { recursive: true })
    const o = await navRun(`${ORIGINAL_BASE}/${file}`, width, dir, 'original')
    const r = await navRun(`${REACT}${route}`, width, dir, 'react')
    console.log(`\n=== nav ${key} @ ${width}px (screenshots in ${dir})`)
    for (const phase of ['closed', 'open', 'closed2'])
      for (const f of Object.keys(o[phase])) {
        const same = o[phase][f] === r[phase][f]
        console.log(`  ${phase}.${f}: ${same ? 'identical' : 'DIFF'}${same && verbose ? ' ' + o[phase][f] : ''}`)
        if (!same) console.log(`    orig : ${o[phase][f]}\n    react: ${r[phase][f]}`)
      }
    for (const ph of ['openFrames', 'closeFrames']) {
      // align by first frame where the menu starts moving, compare translateY per frame
      const start = (fr) => fr.findIndex((x, i) => i > 0 && Math.abs(x[1] - fr[i - 1][1]) > 0.01)
      const so = start(o[ph]) - 1
      const sr = start(r[ph]) - 1
      // compare by time since movement start (screenshots can drop a frame on either side), ±1 frame
      const at = (fr, s0, t) => {
        const t0 = fr[s0][0]
        const i = fr.findIndex((x, j) => j >= s0 && x[0] - t0 >= t)
        if (i <= s0) return fr[i < 0 ? fr.length - 1 : s0][1]
        const [ta, va] = fr[i - 1]
        const [tb, vb] = fr[i]
        return va + ((vb - va) * (t + t0 - ta)) / (tb - ta)
      }
      let max = 0
      for (let j = so; j < o[ph].length; j++) {
        const t = o[ph][j][0] - o[ph][so][0]
        max = Math.max(max, Math.min(...FRAME_SHIFTS.map((sh) => Math.abs(o[ph][j][1] - at(r[ph], sr, Math.max(0, t + sh))))))
      }
      const fmtF = (fr, s0) => fr.slice(s0, s0 + 28).map((x) => x[1].toFixed(1)).join(' ')
      console.log(`  ${ph}: max |ΔtranslateY| per aligned frame = ${max.toFixed(2)}px (tol 2px)`)
      console.log(`    orig : ${fmtF(o[ph], so)}\n    react: ${fmtF(r[ph], sr)}`)
    }
  }
  process.exit(0)
}

const fmt = (n) => (n === Infinity ? 'missing' : n.toFixed(3))
let failures = 0
for (const width of widths) {
  const orig = await run(ORIGINAL_BASE, `${ORIGINAL_BASE}/${file}`, width)
  const react = await run(REACT, `${REACT}${route}`, width, orig.ys, orig.phaseStart)
  console.log(`\n=== ${key} @ ${width}px  (scrollHeight original ${orig.height} / react ${react.height})`)
  if (react.errors.length) console.log('  react page errors:', react.errors.slice(0, 5))
  const dump = args.find((a) => a.startsWith('--dump='))?.split('=')[1]
  if (dump) {
    const [dk, phase] = dump.split('@') // e.g. --dump=w-id:6a4e#1@ix2  or  @y2800
    const pick = (side) => (phase.startsWith('y') ? side.scroll.find((s) => `y${s.y}` === phase)?.frames : side.trace.frames[phase]) || []
    for (const [label, side] of [['orig', orig], ['react', react]])
      console.log(`  ${label}: ` + pick(side).filter((f) => f[1][dk]).map(([t, snap]) => `${Math.round(t)}:${snap[dk][0].toFixed(3)}|${snap[dk][1].replace(/matrix(3d)?\(|\)/g, '').split(',').map((x) => +(+x).toFixed(2)).filter((_, j, a) => a.length === 6 ? j >= 4 : j === 13).join('/')}`).join(' '))
  }
  const rows = new Map()
  const layoutOnly = new Set()
  const note = (k, phase, d) => {
    const r = rows.get(k) || { op: 0, tr: 0, m: 0, where: '' }
    const bad = (x) => x.op > TOL.op || x.tr > TOL.tr || x.m > TOL.m
    if (d.op > r.op || d.tr > r.tr || d.m > r.m) {
      if (bad(d) || !r.where) r.where = phase
      r.op = Math.max(r.op, d.op)
      r.tr = Math.max(r.tr, d.tr)
      r.m = Math.max(r.m, d.m)
    }
    rows.set(k, r)
  }
  const keys = new Set([...Object.keys(orig.final), ...Object.keys(react.final)])
  for (const k of keys) {
    const ix3 = k.startsWith('wft') || k.startsWith('anim')
    const name = ix3 ? 'ix3' : 'ix2'
    // rAF phase differs between two independent page loads and IX2 smoothing is per-frame, so the
    // React curve is compared within ±1 frame (17ms) of each original sample time.
    const compare = (label, of, rf, t) => {
      const o = sampleAt(of, t, k)
      const ds = FRAME_SHIFTS.map((sh) => delta(o, sampleAt(rf, Math.max(0, t + sh), k)))
      const score = (d) => Math.max(d.op / TOL.op, d.tr / TOL.tr, d.m / TOL.m)
      const best = ds.reduce((b, d) => (score(d) < score(b) ? d : b))
      if (score(best) > 1) {
        // Same inline style on both sides but different computed px → the element's layout box
        // differed at that instant (e.g. % translate while an image above/inside is still loading).
        const styleAt = (frames, tt) => (frames.find(([ft]) => ft >= tt) || frames[frames.length - 1])?.[1][k]?.[2]
        const os = styleAt(of, t)
        if (os && FRAME_SHIFTS.some((sh) => styleAt(rf, Math.max(0, t + sh)) === os)) {
          layoutOnly.add(`${k} @ ${label}`)
          return
        }
      }
      note(k, label, best)
    }
    for (const t of ix3 ? IX3_TIMES : IX2_TIMES) compare(`${name}+${t}ms`, orig.trace.frames[name], react.trace.frames[name], t)
    orig.scroll.forEach((s, i) => {
      for (const t of SCROLL_TIMES) compare(`y${s.y}+${t}`, s.frames, react.scroll[i].frames, t)
    })
    orig.mouse.forEach((s, i) => {
      for (const t of [50, 250, 800]) compare(`${s.label}+${t}`, s.frames, react.mouse[i].frames, t)
    })
    // looping marquees keep moving; their end-of-run position only reflects harness round-trip timing
    if (!orig.final[k]?.moving) note(k, 'final', delta(toSample(orig.final[k]), toSample(react.final[k])))
  }
  console.log('  element'.padEnd(34) + 'max Δop'.padStart(9) + 'max Δtr(px)'.padStart(13) + 'max Δmatrix'.padStart(13) + '  worst phase   status')
  for (const [k, r] of [...rows].sort()) {
    const ok = r.op <= TOL.op && r.tr <= TOL.tr && r.m <= TOL.m
    if (!ok) failures++
    if (ok && !verbose && r.op === 0 && r.tr === 0 && r.m === 0) continue
    console.log(`  ${k.padEnd(32)}${fmt(r.op).padStart(9)}${fmt(r.tr).padStart(13)}${fmt(r.m).padStart(13)}  ${r.where.padEnd(13)} ${ok ? 'ok' : 'MISMATCH'}`)
  }
  const identical = [...rows.values()].filter((r) => r.op === 0 && r.tr === 0 && r.m === 0).length
  console.log(`  (${identical} of ${rows.size} elements identical in every sample${verbose ? '' : ', not listed'})`)
  const norm = (s) => s.replace(/\s+/g, ' ').trim()
  const moving = [...keys].filter((k) => orig.final[k]?.moving)
  const styleDiffs = [...keys].filter((k) => !orig.final[k]?.moving && norm(orig.final[k]?.[2] ?? '') !== norm(react.final[k]?.[2] ?? ''))
  if (layoutOnly.size) console.log(`  layout-only differences (identical inline style, different element box): ${[...layoutOnly].join('; ')}`)
  console.log(`  final inline style strings (${keys.size - moving.length} static elements; ${moving.length} continuously moving skipped): ${styleDiffs.length ? styleDiffs.length + ' differ' : 'all identical'}`)
  for (const k of styleDiffs.slice(0, 12)) console.log(`    ${k}\n      orig : ${orig.final[k]?.[2]}\n      react: ${react.final[k]?.[2]}`)
}
console.log(failures ? `\n${failures} element(s) outside tolerance` : '\nall samples within tolerance')
