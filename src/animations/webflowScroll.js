// Webflow `scroll` (module 286) + `links` (module 7624) without jQuery.
//  - scroll: same-page hash links animate window scroll with Webflow's duration curve
//    (472.143·ln(|Δ|+125) − 2000 ms) and easeInOutCubic, push the hash, then focus the target.
//  - links:  scroll-spy that toggles `w--current` on same-page hash links while their section is
//    in the middle band of the viewport.

const HASH = /^#[a-zA-Z0-9][\w:.-]*$/
const SPY_HASH = /^#[a-zA-Z0-9\-_]+$/
const LINK_SELECTOR = 'a[href*="#"]:not(.w-tab-link):not([href="#"])'
// Webflow checks `header, body > .header, body > .w-nav` — our page root is #root instead of body.
const HEADER_SELECTOR = 'header, #root > .header, #root > .w-nav:not([data-no-scroll])'
const CURRENT = 'w--current'

// typeof-window guard: this module is also evaluated at build time by the SSR prerender (scripts/prerender.mjs).
const reducedMotion = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)')
const sameDocument = (a) => a.host + a.pathname === window.location.host + window.location.pathname
const pageTop = (el) => el.getBoundingClientRect().top + window.scrollY

// Webflow's scroll/resize hub: underscore-style throttle, one call per animation frame.
function onScrollThrottled(fn) {
  let queued = false
  const handler = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      fn()
    })
  }
  const events = ['scroll', 'resize', 'orientationchange', 'load']
  events.forEach((e) => window.addEventListener(e, handler))
  return () => events.forEach((e) => window.removeEventListener(e, handler))
}

function targetOffset(target) {
  const header = document.querySelector(HEADER_SELECTOR)
  const headerHeight = header && getComputedStyle(header).position === 'fixed' ? header.offsetHeight : 0
  let top = pageTop(target) - headerHeight
  if (target.getAttribute('data-scroll') === 'mid') {
    const available = window.innerHeight - headerHeight
    const height = target.offsetHeight
    if (height < available) top -= Math.round((available - height) / 2)
  }
  return top
}

function scrollDuration(target, from, to) {
  if (document.body.getAttribute('data-wf-scroll-motion') === 'none' || reducedMotion?.matches) return 0
  let multiplier = 1
  for (const el of [document.body, target]) {
    const t = parseFloat(el.getAttribute('data-scroll-time'))
    if (!isNaN(t) && t >= 0) multiplier = t
  }
  return (472.143 * Math.log(Math.abs(from - to) + 125) - 2000) * multiplier
}

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1)

// Focus the section without an outline or a second scroll (tabindex swap, like Webflow).
function focusTarget(el) {
  const had = el.getAttribute('tabindex')
  if (had) el.setAttribute('data-wf-tabindex-swap', had)
  else el.setAttribute('tabindex', '-1')
  el.classList.add('wf-force-outline-none')
  el.focus({ preventScroll: true })
  const swap = el.getAttribute('data-wf-tabindex-swap')
  if (swap) {
    el.setAttribute('tabindex', swap)
    el.removeAttribute('data-wf-tabindex-swap')
  } else el.removeAttribute('tabindex')
  el.classList.remove('wf-force-outline-none')
}

export function createSmoothScroll() {
  let frame = 0
  let timeout = 0

  const animateTo = (target) => {
    const from = window.scrollY
    const to = targetOffset(target)
    if (from === to) return
    const duration = scrollDuration(target, from, to)
    const start = Date.now()
    cancelAnimationFrame(frame)
    const step = () => {
      const elapsed = Date.now() - start
      window.scroll(0, elapsed > duration ? to : from + (to - from) * easeInOutCubic(elapsed / duration))
      if (elapsed <= duration) frame = requestAnimationFrame(step)
      else focusTarget(target)
    }
    frame = requestAnimationFrame(step)
  }

  const onClick = (e) => {
    if (e.defaultPrevented || !(e.target instanceof Element)) return
    const link = e.target.closest('a')
    if (!link) return
    if (link.getAttribute('href') === '#') return e.preventDefault()
    if (!link.matches(LINK_SELECTOR)) return
    const hash = HASH.test(link.hash) && sameDocument(link) ? link.hash : ''
    const target = hash && document.getElementById(hash.slice(1))
    if (!target) return
    e.preventDefault()
    e.stopPropagation()
    if (window.location.hash !== hash && window.history.state?.hash !== hash) {
      // Keep react-router's history state (key/idx) so back/forward stay consistent.
      window.history.pushState({ ...window.history.state, hash }, '', hash)
    }
    clearTimeout(timeout)
    timeout = setTimeout(() => animateTo(target), 0)
  }

  document.addEventListener('click', onClick)
  return () => {
    document.removeEventListener('click', onClick)
    cancelAnimationFrame(frame)
    clearTimeout(timeout)
  }
}

export function createScrollSpy() {
  const anchor = document.createElement('a')
  const entries = []
  for (const link of document.links) {
    if (link.getAttribute('hreflang')) continue
    const href = link.getAttribute('href')
    anchor.href = href
    if (href.includes(':') || anchor.hash.length <= 1 || !sameDocument(anchor)) continue
    if (!SPY_HASH.test(anchor.hash)) continue
    const section = document.getElementById(anchor.hash.slice(1))
    if (section) entries.push({ link, section, active: false })
  }
  if (!entries.length) return () => {}

  const update = () => {
    const scrollTop = window.scrollY
    const viewport = window.innerHeight
    for (const entry of entries) {
      const { link, section } = entry
      const top = pageTop(section)
      const height = section.offsetHeight
      const half = 0.5 * viewport
      const visible = section.getClientRects().length > 0
      const active = visible && top + height - half >= scrollTop && top + half <= scrollTop + viewport
      if (entry.active === active) continue
      entry.active = active
      link.classList.toggle(CURRENT, active)
    }
  }

  const off = onScrollThrottled(update)
  update()
  return () => {
    off()
    entries.forEach(({ link }) => link.classList.remove(CURRENT))
  }
}
