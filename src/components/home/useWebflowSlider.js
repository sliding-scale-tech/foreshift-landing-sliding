import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/*
 * React port of Webflow's `slider` module (webflow.js) for `data-animation="slide"` sliders.
 * Semantics copied from the module:
 *  - config from data-* attrs: duration (default 500), easing (tram name -> CSS timing function), infinite,
 *    disable-swipe, hide-arrows, autoplay/delay/autoplay-limit, nav-spacing.
 *  - "pages" (anchors) are built from slide outer widths vs mask width minus an edge (right arrow width + 40).
 *  - slides move with `transform: translateX(px)` + `transition: transform <duration>ms <easing>` (tram).
 *  - infinite wrap-around shifts the incoming/outgoing slides exactly like Webflow (`shifted`).
 *  - a11y attrs: region/carousel, mask id, arrows role/tabindex/aria-controls/label, slide role/aria-label,
 *    aria-hidden + tabindex=-1 on inactive slides, live region text "Slide n of m.".
 *  - swipe: mouse/touch drag beyond min(round(4% viewport), 40px) with no text selection.
 */

const TRAM_EASINGS = {
  ease: 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  linear: 'linear',
  'ease-in-quad': 'cubic-bezier(0.550, 0.085, 0.680, 0.530)',
  'ease-out-quad': 'cubic-bezier(0.250, 0.460, 0.450, 0.940)',
  'ease-in-out-quad': 'cubic-bezier(0.455, 0.030, 0.515, 0.955)',
  'ease-in-cubic': 'cubic-bezier(0.550, 0.055, 0.675, 0.190)',
  'ease-out-cubic': 'cubic-bezier(0.215, 0.610, 0.355, 1)',
  'ease-in-out-cubic': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  'ease-in-quart': 'cubic-bezier(0.895, 0.030, 0.685, 0.220)',
  'ease-out-quart': 'cubic-bezier(0.165, 0.840, 0.440, 1)',
  'ease-in-out-quart': 'cubic-bezier(0.770, 0, 0.175, 1)',
  'ease-in-quint': 'cubic-bezier(0.755, 0.050, 0.855, 0.060)',
  'ease-out-quint': 'cubic-bezier(0.230, 1, 0.320, 1)',
  'ease-in-out-quint': 'cubic-bezier(0.860, 0, 0.070, 1)',
  'ease-in-sine': 'cubic-bezier(0.470, 0, 0.745, 0.715)',
  'ease-out-sine': 'cubic-bezier(0.390, 0.575, 0.565, 1)',
  'ease-in-out-sine': 'cubic-bezier(0.445, 0.050, 0.550, 0.950)',
  'ease-in-expo': 'cubic-bezier(0.950, 0.050, 0.795, 0.035)',
  'ease-out-expo': 'cubic-bezier(0.190, 1, 0.220, 1)',
  'ease-in-out-expo': 'cubic-bezier(1, 0, 0, 1)',
  'ease-in-circ': 'cubic-bezier(0.600, 0.040, 0.980, 0.335)',
  'ease-out-circ': 'cubic-bezier(0.075, 0.820, 0.165, 1)',
  'ease-in-out-circ': 'cubic-bezier(0.785, 0.135, 0.150, 0.860)',
  'ease-in-back': 'cubic-bezier(0.600, -0.280, 0.735, 0.045)',
  'ease-out-back': 'cubic-bezier(0.175, 0.885, 0.320, 1.275)',
  'ease-in-out-back': 'cubic-bezier(0.680, -0.550, 0.265, 1.550)',
}

const FOCUSABLE =
  'a[href], area[href], [role="button"], input, select, textarea, button, iframe, object, embed, *[tabindex], *[contenteditable]'

const KEY = { ENTER: 'Enter', SPACE: ' ', LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', DOWN: 'ArrowDown', HOME: 'Home', END: 'End' }

/** Webflow arrow keydown: Enter/Space activate. */
function arrowKey(e, action) {
  if (e.key === KEY.ENTER || e.key === KEY.SPACE) {
    action()
    e.preventDefault()
    e.stopPropagation()
  }
}

const isTrue = (v) => v === '1' || v === 'true'

const getSlides = (mask) => Array.from(mask?.children || []).filter((c) => c.classList.contains('w-slide'))

function outerWidth(el) {
  const cs = getComputedStyle(el)
  return el.getBoundingClientRect().width + parseFloat(cs.marginLeft) + parseFloat(cs.marginRight)
}

function contentWidth(el) {
  const cs = getComputedStyle(el)
  const w = el.getBoundingClientRect().width
  return cs.display === 'none'
    ? 0
    : w -
        parseFloat(cs.paddingLeft) -
        parseFloat(cs.paddingRight) -
        parseFloat(cs.borderLeftWidth) -
        parseFloat(cs.borderRightWidth)
}

// Pending tram frame per element (tram skips the deferred style write if the tween was stopped by a later set()).
const pendingFrames = new WeakMap()
// tram keeps an element's pre-existing computed `transition` ("upstream") in front of its own transitions,
// unless it is the default `all 0s ease 0s` / `none 0s ease 0s`. Current Chrome reports the default as "all",
// so tram writes e.g. "all" / "all, transform 500ms" — mirrored here for identical timing.
const upstreams = new WeakMap()
const upstreamOf = (el) => {
  if (!upstreams.has(el)) {
    const t = getComputedStyle(el).transition
    upstreams.set(el, t && !/(all|none) 0s ease 0s/.test(t) ? t : '')
  }
  return upstreams.get(el)
}
const transitionString = (el, own) => [upstreamOf(el), own].filter(Boolean).join(', ')

/** tram `.set({ x })`: stop any running tween, write the value immediately. */
function setX(els, x, extra) {
  for (const el of els) {
    cancelAnimationFrame(pendingFrames.get(el))
    pendingFrames.delete(el)
    el.style.transition = transitionString(el, '')
    el.style.transform = `translateX(${x}px)`
    if (extra) Object.assign(el.style, extra)
    void el.offsetHeight // tram redraw
  }
}

/**
 * tram `.add("transform <d>ms <easing>").start({ x })`: the transition string is written synchronously,
 * the target transform on the next animation frame.
 */
function animateX(els, x, transition) {
  for (const el of els) {
    cancelAnimationFrame(pendingFrames.get(el))
    el.style.transition = transitionString(el, transition)
    pendingFrames.set(
      el,
      requestAnimationFrame(() => {
        pendingFrames.delete(el)
        el.style.transform = `translateX(${x}px)`
      }),
    )
  }
}

/** `sliderIndex`: position of this slider among the page's sliders (Webflow mask id `w-slider-mask-<n>`). */
export default function useWebflowSlider(sliderIndex = 0) {
  const rootRef = useRef(null)
  const maskRef = useRef(null)
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const liveRef = useRef(null)
  const state = useRef({ index: 0, previous: 0, anchors: [], endX: 0, maskWidth: 0, offsetX: 0, shifted: null, pages: 0 })
  const [pages, setPages] = useState(0)
  const [active, setActive] = useState(0)
  const [navSpacing, setNavSpacing] = useState(null)
  const maskId = `w-slider-mask-${sliderIndex}`

  const readConfig = useCallback(() => {
    const el = rootRef.current
    const attr = (n) => el.getAttribute(`data-${n}`)
    const duration = attr('duration')
    const right = rightRef.current ? contentWidth(rightRef.current) : 0
    const config = {
      animation: attr('animation') || 'slide',
      easing: TRAM_EASINGS[attr('easing')] || TRAM_EASINGS.ease,
      duration: duration != null ? parseInt(duration, 10) : 500,
      infinite: isTrue(attr('infinite')),
      disableSwipe: isTrue(attr('disable-swipe')),
      hideArrows: isTrue(attr('hide-arrows')),
      autoplay: isTrue(attr('autoplay')),
      delay: parseInt(attr('delay'), 10) || 2000,
      timerMax: parseInt(attr('autoplay-limit'), 10),
      edge: right ? right + 40 : 100,
    }
    const spacing = attr('nav-spacing')
    setNavSpacing(spacing ? `${parseFloat(spacing)}px` : null)
    state.current.config = config
    return config
  }, [])

  /** Webflow `C(t, n)` — change slide. */
  const change = useCallback((opts) => {
    const s = state.current
    const { config: cfg, anchors } = s
    if (!anchors.length) return
    s.previous = s.index
    let index = opts.index
    const shift = {}
    if (index < 0) {
      index = anchors.length - 1
      if (cfg.infinite) {
        shift.x = -s.endX
        shift.from = 0
        shift.to = anchors[0].width
      }
    } else if (index >= anchors.length) {
      index = 0
      if (cfg.infinite) {
        shift.x = anchors[anchors.length - 1].width
        shift.from = -anchors[anchors.length - 1].x
        shift.to = shift.from - shift.x
      }
    }
    s.index = index
    setActive(index)

    const left = leftRef.current
    const right = rightRef.current
    if (cfg.hideArrows) {
      if (right) right.style.display = index === anchors.length - 1 ? 'none' : ''
      if (left) left.style.display = index === 0 ? 'none' : ''
    }

    const prevOffset = s.offsetX || 0
    const offset = (s.offsetX = -anchors[index].x)
    const all = getSlides(maskRef.current)
    const current = anchors[index].els
    const previous = anchors[s.previous] ? anchors[s.previous].els : []
    const others = all.filter((el) => !current.includes(el))
    const transition = `transform ${Math.round(cfg.duration)}ms${cfg.easing === 'ease' ? '' : ` ${cfg.easing}`}`

    for (const el of current) {
      el.querySelectorAll(FOCUSABLE).forEach((f) => f.removeAttribute('tabindex'))
      el.removeAttribute('aria-hidden')
      el.querySelectorAll('*').forEach((c) => c.removeAttribute('aria-hidden'))
    }
    for (const el of others) {
      el.querySelectorAll(FOCUSABLE).forEach((f) => f.setAttribute('tabindex', '-1'))
      el.setAttribute('aria-hidden', 'true')
      el.querySelectorAll('*').forEach((c) => c.setAttribute('aria-hidden', 'true'))
    }

    const settle = () => setX(others, offset, { opacity: '1', visibility: '' })

    if (opts.immediate) {
      setX(current, offset, { opacity: '1', visibility: '' })
      settle()
      return
    }
    if (s.index === s.previous) return
    if (liveRef.current) liveRef.current.textContent = `Slide ${index + 1} of ${anchors.length}.`

    if (cfg.infinite && shift.x) {
      const incoming = all.filter((el) => !previous.includes(el))
      setX(incoming, shift.x, { visibility: '' })
      setX(previous, shift.from, { visibility: '' })
      animateX(incoming, offset, transition)
      animateX(previous, shift.to, transition)
      s.shifted = previous
    } else {
      if (cfg.infinite && s.shifted) {
        setX(s.shifted, prevOffset, { visibility: '' })
        s.shifted = null
      }
      for (const el of all) el.style.visibility = ''
      animateX(all, offset, transition)
    }
  }, [])

  /** Webflow `x(t)` — build anchors/pages from widths. */
  const layout = useCallback(() => {
    const s = state.current
    const mask = maskRef.current
    if (!mask) return
    readConfig()
    s.maskWidth = contentWidth(mask)
    let page = 1
    let pageStart = 0
    let x = 0
    const limit = Math.max(s.maskWidth - s.config.edge, 0)
    s.anchors = [{ els: [], x: 0, width: 0 }]
    const all = getSlides(maskRef.current)
    all.forEach((el, i) => {
      if (x - pageStart > limit) {
        page++
        pageStart += s.maskWidth
        s.anchors[page - 1] = { els: [], x, width: 0 }
      }
      const w = outerWidth(el)
      x += w
      s.anchors[page - 1].width += w
      s.anchors[page - 1].els.push(el)
      el.setAttribute('aria-label', `${i + 1} of ${all.length}`)
      el.setAttribute('role', 'group')
    })
    s.endX = x
    if (s.pages !== page) {
      s.pages = page
      setPages(page)
    }
    change({ immediate: true, index: Math.min(s.index, page - 1) })
  }, [change, readConfig])

  const prev = useCallback(() => change({ index: state.current.index - 1, vector: -1 }), [change])
  const next = useCallback(() => change({ index: state.current.index + 1, vector: 1 }), [change])
  const onPrevKeyDown = useCallback((e) => arrowKey(e, prev), [prev])
  const onNextKeyDown = useCallback((e) => arrowKey(e, next), [next])

  useLayoutEffect(() => {
    layout()
    let lastWidth = state.current.maskWidth
    const onResize = () => {
      const mask = maskRef.current
      if (!mask || mask.offsetParent === null) return
      const w = contentWidth(mask)
      if (w !== lastWidth) {
        lastWidth = w
        layout()
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [layout])

  // Swipe (Webflow `touch` module: document-level listeners, swipe dispatched to the event target) +
  // autoplay + live-region politeness while hovered/focused.
  useEffect(() => {
    const root = rootRef.current
    const cfg = state.current.config
    let down = false
    let touch = false
    let lastX = 0
    let timer = null
    let timerCount = 1
    const hasFocus = { mouse: false, keyboard: false }

    const stopTimer = () => {
      clearTimeout(timer)
      timer = null
    }
    const startTimer = () => {
      stopTimer()
      if (cfg.timerMax && timerCount++ > cfg.timerMax) return
      timer = setTimeout(() => {
        next()
        startTimer()
      }, cfg.delay)
    }

    const onDown = (e) => {
      if (e.touches && e.touches.length > 1) return
      down = true
      if (e.touches) {
        touch = true
        lastX = e.touches[0].clientX
      } else {
        lastX = e.clientX
      }
    }
    const onMove = (e) => {
      if (!down) return
      if (touch && e.type === 'mousemove') {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      const x = e.touches ? e.touches[0].clientX : e.clientX
      const delta = x - lastX
      lastX = x
      const threshold = Math.min(Math.round(0.04 * window.innerWidth), 40)
      if (Math.abs(delta) > threshold && String(window.getSelection()) === '') {
        down = false
        if (root.contains(e.target) && !cfg.disableSwipe) (delta > 0 ? prev : next)()
      }
    }
    const onUp = (e) => {
      if (!down) return
      down = false
      if (touch && e.type === 'mouseup') {
        e.preventDefault()
        e.stopPropagation()
        touch = false
      }
    }
    const onCancel = () => {
      down = false
    }

    const focusHandler = (on, kind) => (e) => {
      if (on) hasFocus[kind] = true
      else {
        if (root.contains(e.relatedTarget)) return
        hasFocus[kind] = false
        if ((hasFocus.mouse && kind === 'keyboard') || (hasFocus.keyboard && kind === 'mouse')) return
      }
      if (liveRef.current) liveRef.current.setAttribute('aria-live', on ? 'polite' : 'off')
      if (cfg.autoplay) (on ? stopTimer : startTimer)()
    }

    const docListeners = [
      ['touchstart', onDown],
      ['touchmove', onMove],
      ['touchend', onUp],
      ['touchcancel', onCancel],
      ['mousedown', onDown],
      ['mousemove', onMove],
      ['mouseup', onUp],
      ['mouseout', onCancel],
    ]
    const rootListeners = [
      ['mouseenter', focusHandler(true, 'mouse')],
      ['focusin', focusHandler(true, 'keyboard')],
      ['mouseleave', focusHandler(false, 'mouse')],
      ['focusout', focusHandler(false, 'keyboard')],
    ]
    docListeners.forEach(([type, fn]) => document.addEventListener(type, fn, false))
    rootListeners.forEach(([type, fn]) => root.addEventListener(type, fn, false))
    const onFirstPress = () => stopTimer()
    if (cfg.autoplay) {
      root.addEventListener('mousedown', onFirstPress, { once: true })
      root.addEventListener('touchstart', onFirstPress, { once: true })
      startTimer()
    }
    return () => {
      stopTimer()
      docListeners.forEach(([type, fn]) => document.removeEventListener(type, fn, false))
      rootListeners.forEach(([type, fn]) => root.removeEventListener(type, fn, false))
      root.removeEventListener('mousedown', onFirstPress)
      root.removeEventListener('touchstart', onFirstPress)
    }
  }, [next, prev])

  const focusDot = (i) => rootRef.current?.querySelector('.w-slider-nav')?.children[i]?.focus()

  const dotKeyDown = (i) => (e) => {
    switch (e.key) {
      case KEY.ENTER:
      case KEY.SPACE:
        change({ index: i })
        break
      case KEY.LEFT:
      case KEY.UP:
        focusDot(Math.max(i - 1, 0))
        break
      case KEY.RIGHT:
      case KEY.DOWN:
        focusDot(Math.min(i + 1, pages))
        break
      case KEY.HOME:
        focusDot(0)
        break
      case KEY.END:
        focusDot(pages)
        break
      default:
        return
    }
    e.preventDefault()
  }

  const dots = Array.from({ length: pages }, (_, i) => ({
    key: i,
    className: `w-slider-dot${i === active ? ' w-active' : ''}`,
    'data-wf-ignore': '',
    'aria-label': `Show slide ${i + 1} of ${pages}`,
    'aria-pressed': i === active ? 'true' : 'false',
    role: 'button',
    tabIndex: i === active ? 0 : -1,
    // Webflow writes data-nav-spacing as inline margins on each generated dot.
    style: navSpacing ? { marginLeft: navSpacing, marginRight: navSpacing } : undefined,
    onClick: () => change({ index: i }),
    onKeyDown: dotKeyDown(i),
  }))

  return {
    rootProps: { ref: rootRef, role: 'region', 'aria-label': 'carousel' },
    maskProps: { ref: maskRef, id: maskId },
    liveProps: { ref: liveRef, 'aria-live': 'off', 'aria-atomic': 'true', className: 'w-slider-aria-label', 'data-wf-ignore': '' },
    leftProps: {
      ref: leftRef,
      role: 'button',
      tabIndex: 0,
      'aria-controls': maskId,
      'aria-label': 'previous slide',
      onClick: prev,
      onKeyDown: onPrevKeyDown,
    },
    rightProps: {
      ref: rightRef,
      role: 'button',
      tabIndex: 0,
      'aria-controls': maskId,
      'aria-label': 'next slide',
      onClick: next,
      onKeyDown: onNextKeyDown,
    },
    dots,
  }
}
