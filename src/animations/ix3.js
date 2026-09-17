// Minimal re-implementation of the Webflow IX3 timelines registered for the ported pages
// (reference/ix-data.js → t.register([...interactions], [...timelines])).
// IX3 builds GSAP timelines; the tweens here are all `from` tweens (tt:1) on opacity + y%/scale,
// so instead of shipping gsap + ScrollTrigger we replay the exact tween math GSAP 3.15 produces
// (verified against the live original with gsap.globalTimeline introspection):
//   gsap.timeline({paused}).from(target, {force3D:true, duration, ease, opacity:0, y:"25%"}, position)
// Inline output matches GSAP: `translate:none; rotate:none; scale:none; opacity:<4dp>;
// transform: translate3d(0px, <4dp>%, 0px)`. Scroll interactions use ScrollTrigger
// {start:"clamp(top bottom)", end:"clamp(top 90%)", toggleActions:"play none none none"} → play once
// when scroll passes start. Load interactions play when IX3 initialises (window load).
import { GSAP_EASES } from './easings.js'

const HOME = '6aa91495972a5cddf72d871e'
const inst = (id) => `[data-wf-target*='["${HOME}","${id}"]']`
// ease codes: 5 = power2.out, 6 = power2.inOut. Actions whose targets do not exist in the export
// (a626fb6a…, 7eeae2a1…, 9200e114…, 0b24…1412, and the heading/text/buttons/rate/imgs attributes)
// are kept so behaviour stays identical if they ever appear; they are skipped at runtime when empty.
const fadeUp = (id, position, y) => ({ sel: inst(id), position, duration: 1, ease: 'power2.inOut', from: { opacity: 0, y } })
const fadeScale = (id, position) => ({ sel: inst(id), position, duration: 1, ease: 'power2.inOut', from: { opacity: 0, scale: 1 } })

export const IX3_PAGES = {
  [HOME]: [
    {
      // i-0e8d3c8c wf:load → t-ae8cd105
      trigger: null,
      actions: [{ sel: '[animation="tag-hero"]', position: 0, duration: 0.35, ease: 'power2.out', from: { opacity: 0, y: 50 } }],
    },
    {
      // i-1ad8fbc8 → t-9cd538fb
      trigger: inst('0b24b4be-9dd4-e6bd-e5ea-e3f12d7913ee'),
      actions: [
        fadeUp('a626fb6a-fb9c-1b65-836e-2c984154f6ca', 0, 25),
        fadeUp('0b24b4be-9dd4-e6bd-e5ea-e3f12d7913f1', 0.5, 20),
        fadeUp('0b24b4be-9dd4-e6bd-e5ea-e3f12d7913f5', 1, 17),
        fadeScale('0b24b4be-9dd4-e6bd-e5ea-e3f12d7913f7', 1.5),
        fadeUp('0b24b4be-9dd4-e6bd-e5ea-e3f12d7913fb', 0, 25),
      ],
    },
    {
      // i-64ccdb01 → t-c6c0ca2c
      trigger: inst('0b24b4be-9dd4-e6bd-e5ea-e3f12d791409'),
      actions: [
        fadeUp('7eeae2a1-3bf1-0a4c-5351-39be08d006c6', 0, 25),
        fadeUp('0b24b4be-9dd4-e6bd-e5ea-e3f12d79140b', 0.5, 20),
        fadeUp('0b24b4be-9dd4-e6bd-e5ea-e3f12d791410', 1, 17),
        fadeScale('0b24b4be-9dd4-e6bd-e5ea-e3f12d791412', 1.5),
        fadeUp('0b24b4be-9dd4-e6bd-e5ea-e3f12d791416', 0, 25),
      ],
    },
    {
      // i-e2749994 → t-6113f468
      trigger: inst('0b24b4be-9dd4-e6bd-e5ea-e3f12d7913fc'),
      actions: [
        fadeUp('0b24b4be-9dd4-e6bd-e5ea-e3f12d7913fe', 0, 25),
        // ta: tt:2 fromTo opacity 0→1, y 25%→0% (target absent from the export)
        { sel: inst('9200e114-d3c5-1be7-ace2-84bbd457067a'), position: 0.5, duration: 1, ease: 'power2.inOut', from: { opacity: 0, y: 25 } },
        fadeUp('0b24b4be-9dd4-e6bd-e5ea-e3f12d791400', 1, 20),
        fadeUp('0b24b4be-9dd4-e6bd-e5ea-e3f12d791404', 1.5, 17),
        fadeScale('0b24b4be-9dd4-e6bd-e5ea-e3f12d791406', 2),
      ],
    },
  ],
}

const round = (v) => Math.round(v * 10000) / 10000

export function createIX3(pageId) {
  const defs = IX3_PAGES[pageId] || []
  const touched = new Set()
  const timelines = []
  // gsap.ticker with lagSmoothing(500, 33): time only advances 33ms after a >500ms stall.
  let last = performance.now()
  let time = 0
  let raf = 0

  function renderTween(tw, ratio) {
    for (const t of tw.targets) {
      const s = t.el.style
      const e = ratio === 1 ? 1 : GSAP_EASES[tw.ease](ratio)
      s.opacity = ratio === 1 ? String(t.endOpacity) : String(round(tw.from.opacity + (t.endOpacity - tw.from.opacity) * e))
      if (tw.from.y != null) s.transform = `translate3d(0px, ${ratio === 1 ? 0 : round(tw.from.y * (1 - e))}%, 0px)`
      else s.transform = 'translate3d(0px, 0px, 0px)'
    }
  }

  for (const def of defs) {
    const tweens = []
    for (const a of def.actions) {
      const els = Array.from(document.querySelectorAll(a.sel))
      if (!els.length) continue
      const targets = els.map((el) => {
        touched.add(el)
        // GSAP _parseTransform neutralises CSS individual transforms (assignment order → cssText order)
        el.style.translate = 'none'
        el.style.rotate = 'none'
        el.style.scale = 'none'
        return { el, endOpacity: parseFloat(getComputedStyle(el).opacity) }
      })
      const tw = { ...a, targets, rendered: 0 }
      renderTween(tw, 0) // immediateRender
      tweens.push(tw)
    }
    if (!tweens.length) continue
    const tl = { tweens, start: null, done: false, trigger: def.trigger && document.querySelector(def.trigger) }
    if (def.trigger && !tl.trigger) continue
    timelines.push(tl)
    if (!def.trigger) tl.start = time
  }

  let destroyed = false
  const ensureTicking = () => {
    if (raf || destroyed) return
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }
  const play = (tl) => {
    if (tl.start != null) return
    // ScrollTrigger calls timeline.play() from its rAF update: the timeline starts at the GSAP
    // ticker's time for the current frame (the frame timestamp), and renders from the next tick.
    tl.start = time
    if (!raf && !destroyed) {
      last = document.timeline?.currentTime ?? performance.now()
      raf = requestAnimationFrame(tick)
    }
  }

  function checkTriggers() {
    const max = document.documentElement.scrollHeight - window.innerHeight
    for (const tl of timelines) {
      if (!tl.trigger || tl.start != null) continue
      const top = tl.trigger.getBoundingClientRect().top + window.scrollY
      let start = Math.max(0, Math.min(top - window.innerHeight, max))
      if (start >= max && max > 0) start = max - 1
      if (window.scrollY > start) play(tl)
    }
  }

  function tick(now) {
    let elapsed = now - last
    if (elapsed > 500) elapsed = 33
    last = now
    time += elapsed / 1000
    let active = false
    for (const tl of timelines) {
      if (tl.start == null || tl.done) continue
      const t = time - tl.start
      let finished = true
      for (const tw of tl.tweens) {
        const local = t - tw.position
        if (local < 0) {
          finished = false
          continue
        }
        const ratio = Math.min(local / tw.duration, 1)
        if (ratio < 1) finished = false
        if (tw.rendered !== 1) renderTween(tw, ratio)
        tw.rendered = ratio
      }
      tl.done = finished
      if (!finished) active = true
    }
    if (active) raf = requestAnimationFrame(tick)
    else raf = 0
  }

  let scrollQueued = false
  const onScroll = () => {
    if (scrollQueued) return
    scrollQueued = true
    requestAnimationFrame(() => {
      scrollQueued = false
      if (!destroyed) checkTriggers()
    })
  }
  if (timelines.some((tl) => tl.trigger)) {
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
  }
  checkTriggers()
  document.documentElement.classList.add('w-mod-ix3')
  if (timelines.some((tl) => tl.start != null)) ensureTicking()

  return {
    destroy() {
      destroyed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      for (const el of touched) for (const p of ['translate', 'rotate', 'scale', 'opacity', 'transform']) el.style[p] = ''
    },
  }
}
