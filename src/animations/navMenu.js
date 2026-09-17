// Webflow `navbar` module (webflow.js module 1655) without jQuery/tram, for data-animation="default".
// Attaches to existing `.w-nav` markup: runtime aria attributes, `.w-nav-overlay#w-nav-overlay-N`,
// open/close slide (transform `duration`ms `easing`), outside-click / hash-link / Escape close,
// keyboard navigation and collapse-on-resize — same DOM/inline-style results as the original.

const KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ESC: 27, SPACE: 32, ENTER: 13, HOME: 36, END: 35 }

const box = (el) => {
  const cs = getComputedStyle(el)
  const h = el.getBoundingClientRect().height
  const f = (p) => parseFloat(cs[p]) || 0
  return {
    // jQuery .height() (content) and .outerHeight(true) (border-box + margins)
    height: h - f('paddingTop') - f('paddingBottom') - f('borderTopWidth') - f('borderBottomWidth'),
    outer: h + f('marginTop') + f('marginBottom'),
  }
}
const defer = (fn) => () => setTimeout(fn, 0) // underscore _.debounce(fn) with no wait
// tram's Timer: rAF-driven, starts on the next frame and completes on the first frame >= duration.
function frameTimer(duration, done) {
  let start = null
  let id = requestAnimationFrame(function step(now) {
    if (start === null) start = now
    if (now - start >= duration) return done()
    id = requestAnimationFrame(step)
  })
  return () => cancelAnimationFrame(id)
}

function setupNav(el, index) {
  const menu = el.querySelector('.w-nav-menu')
  const button = el.querySelector('.w-nav-button')
  if (!menu || !button) return () => {}
  const links = () => Array.from(menu.querySelectorAll('.w-nav-link'))
  const overlayId = `w-nav-overlay-${index}`
  const cfg = {
    duration: el.getAttribute('data-duration') != null ? Number(el.getAttribute('data-duration')) : 400,
    easing: el.getAttribute('data-easing') || 'ease',
    easing2: el.getAttribute('data-easing2') || 'ease',
    animation: el.getAttribute('data-animation') || 'default',
  }
  const state = { open: false, selectedIdx: -1, prev: null, parent: menu.parentElement, cancelTimer: () => {} }

  button.setAttribute('style', '-webkit-user-select: text;')
  if (button.getAttribute('aria-label') == null) button.setAttribute('aria-label', 'menu')
  button.setAttribute('role', 'button')
  button.setAttribute('tabindex', '0')
  button.setAttribute('aria-controls', overlayId)
  button.setAttribute('aria-haspopup', 'menu')
  button.setAttribute('aria-expanded', 'false')

  const overlay = document.createElement('div')
  overlay.className = 'w-nav-overlay'
  overlay.setAttribute('data-wf-ignore', '')
  overlay.id = overlayId
  el.appendChild(overlay)

  const instant = () => cfg.animation === 'none' || cfg.duration <= 0

  function sizeOverlay() {
    let h = box(document.body).height
    if (getComputedStyle(el).position !== 'fixed') h -= box(el).outer
    overlay.style.height = `${h}px`
    return h
  }

  // outside click (debounced like the original): close unless the click landed inside this menu
  let lastTarget = null
  const outsideRun = defer(() => {
    if (state.open && lastTarget && lastTarget.closest('.w-nav-menu') !== menu) close()
  })
  const outside = (e) => {
    lastTarget = e.target
    outsideRun()
  }

  function open(noAnim) {
    if (state.open) return
    state.cancelTimer()
    state.open = true
    menu.setAttribute('data-nav-menu-open', '')
    links().forEach((a) => a.classList.add('w--nav-link-open'))
    button.classList.add('w--open')
    sizeOverlay()
    const a = box(menu).outer
    const c = box(el).height
    document.addEventListener('click', outside)
    const done = () => button.setAttribute('aria-expanded', 'true')
    if (noAnim || instant()) return done()
    state.prev = menu.previousElementSibling
    overlay.style.display = 'block'
    overlay.appendChild(menu)
    menu.style.transition = 'all'
    menu.style.transform = `translateY(${-(c + a)}px)`
    void menu.offsetHeight
    menu.style.transition = `all, transform ${cfg.duration}ms ${cfg.easing}`
    menu.style.transform = 'translateY(0px)'
    state.cancelTimer = frameTimer(cfg.duration, done)
  }

  function finishClose() {
    menu.style.height = ''
    menu.style.transition = 'all'
    menu.style.transform = 'translateY(0px) translateX(0px)'
    menu.removeAttribute('data-nav-menu-open')
    links().forEach((a) => a.classList.remove('w--nav-link-open'))
    if (overlay.children.length) {
      if (state.prev && state.prev.parentNode === state.parent) state.prev.after(menu)
      else state.parent.prepend(menu)
      overlay.setAttribute('style', '')
      overlay.style.display = 'none'
    }
    button.setAttribute('aria-expanded', 'false')
  }

  function close(noAnim) {
    if (!state.open) return
    state.cancelTimer()
    state.open = false
    button.classList.remove('w--open')
    document.removeEventListener('click', outside)
    if (noAnim || instant()) return finishClose()
    const r = box(menu).outer
    const l = box(el).height
    menu.style.transition = `all, transform ${cfg.duration}ms ${cfg.easing2}`
    menu.style.transform = `translateY(${-(l + r)}px)`
    state.cancelTimer = frameTimer(cfg.duration, finishClose)
  }

  const toggle = defer(() => (state.open ? close() : open()))

  function focusSelected() {
    const link = links()[state.selectedIdx]
    if (link) link.focus()
  }

  const onButtonClick = () => toggle()
  const onMenuClick = (e) => {
    const a = e.target.closest('a')
    if (!a || !menu.contains(a)) return
    const href = a.getAttribute('href')
    if (href && href.indexOf('#') === 0 && state.open) close()
  }
  const stop = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const onButtonKey = (e) => {
    switch (e.keyCode) {
      case KEY.SPACE:
      case KEY.ENTER:
        toggle()
        return stop(e)
      case KEY.ESC:
        close()
        return stop(e)
      case KEY.RIGHT:
      case KEY.DOWN:
      case KEY.HOME:
      case KEY.END:
        if (!state.open) return stop(e)
        state.selectedIdx = e.keyCode === KEY.END ? links().length - 1 : 0
        focusSelected()
        return stop(e)
    }
  }
  const onNavKey = (e) => {
    if (!state.open) return
    const ls = links()
    state.selectedIdx = ls.indexOf(document.activeElement)
    switch (e.keyCode) {
      case KEY.HOME:
      case KEY.END:
        state.selectedIdx = e.keyCode === KEY.END ? ls.length - 1 : 0
        focusSelected()
        return stop(e)
      case KEY.ESC:
        close()
        button.focus()
        return stop(e)
      case KEY.LEFT:
      case KEY.UP:
        state.selectedIdx = Math.max(-1, state.selectedIdx - 1)
        focusSelected()
        return stop(e)
      case KEY.RIGHT:
      case KEY.DOWN:
        state.selectedIdx = Math.min(ls.length - 1, state.selectedIdx + 1)
        focusSelected()
        return stop(e)
    }
  }
  const onResize = () => {
    const collapsed = getComputedStyle(button).display !== 'none'
    if (state.open && !collapsed) close(true)
    if (state.open) sizeOverlay()
  }

  button.addEventListener('click', onButtonClick)
  menu.addEventListener('click', onMenuClick)
  button.addEventListener('keydown', onButtonKey)
  el.addEventListener('keydown', onNavKey)
  window.addEventListener('resize', onResize)

  return () => {
    close(true)
    state.cancelTimer()
    button.removeEventListener('click', onButtonClick)
    menu.removeEventListener('click', onMenuClick)
    button.removeEventListener('keydown', onButtonKey)
    el.removeEventListener('keydown', onNavKey)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('click', outside)
    overlay.remove()
  }
}

/** Attach Webflow navbar behaviour to every `.w-nav` in the document. Returns a cleanup. */
export function createNavMenus() {
  const cleanups = Array.from(document.querySelectorAll('.w-nav')).map(setupNav)
  return () => cleanups.forEach((fn) => fn())
}
