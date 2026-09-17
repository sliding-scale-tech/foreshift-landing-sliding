// Mount point for the Webflow IX2/IX3 interaction engines + navbar behaviour.
// OWNED BY: interactions agent.
//
// Webflow boots per full page load: navbar + IX2 start while parsing (before DOMContentLoaded),
// IX3 starts when document.readyState === 'complete'. In the SPA we (re)start them whenever the
// set of interaction hooks in the DOM changes — covers the eager Home route, lazy routes that
// commit later, and HMR — always before paint (layout effect / MutationObserver microtask).
import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ROUTES } from '../config/site'
import { createIX2 } from './ix2'
import { createIX3 } from './ix3'
import { createNavMenus } from './navMenu'

// data-wf-page ids of the exported pages (html[data-wf-page] in reference/original/*.html)
const PAGE_IDS = {
  [ROUTES.home]: '6aa91495972a5cddf72d871e',
  [ROUTES.about]: '6aa91495972a5cddf72d8721',
  [ROUTES.terms]: '6aa91495972a5cddf72d8720',
  [ROUTES.privacy]: '6aa91495972a5cddf72d871f',
  [ROUTES.refunds]: '6aab99f7f63c9f6c284ef5d6',
  [ROUTES.eligibility]: '6aaba05e9be3cbd1149cdb13',
}
const HOOKS = '[data-w-id],[data-wf-target],[animation],.w-nav'

let firstPath = null

export default function Interactions() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    if (firstPath === null) firstPath = pathname
    const spaNavigation = pathname !== firstPath
    const pageId = PAGE_IDS[pathname] ?? null
    const html = document.documentElement
    const root = document.getElementById('root') || document.body
    let hooks = []
    let ix2 = null
    let ix3 = null
    let navCleanup = null
    let waitLoad = null
    let raf = 0

    const teardown = () => {
      cancelAnimationFrame(raf)
      if (waitLoad) document.removeEventListener('readystatechange', waitLoad)
      waitLoad = null
      navCleanup?.()
      ix3?.destroy()
      ix2?.destroy()
      navCleanup = ix2 = ix3 = null
    }

    const setup = () => {
      teardown()
      if (!pageId) return
      html.setAttribute('data-wf-page', pageId)
      navCleanup = createNavMenus()
      ix2 = createIX2(pageId)
      const engine = ix2
      // Webflow evaluates scroll-driven events on the first readystatechange after IX2 init, which
      // lands once rendering has started; SPA navigations also wait for the route's scroll reset.
      raf = requestAnimationFrame(() => {
        raf = spaNavigation ? requestAnimationFrame(() => engine.pageUpdate()) : 0
        if (!spaNavigation) engine.pageUpdate()
      })
      if (spaNavigation || document.readyState === 'complete') ix3 = createIX3(pageId)
      else {
        waitLoad = () => {
          if (document.readyState !== 'complete') return
          document.removeEventListener('readystatechange', waitLoad)
          waitLoad = null
          ix3 = createIX3(pageId)
        }
        document.addEventListener('readystatechange', waitLoad)
      }
    }

    const sync = () => {
      const next = Array.from(document.querySelectorAll(HOOKS))
      if (next.length === hooks.length && next.every((el, i) => el === hooks[i])) return
      hooks = next
      setup()
    }

    sync()
    const mo = new MutationObserver(sync)
    mo.observe(root, { childList: true, subtree: true })
    return () => {
      mo.disconnect()
      teardown()
    }
  }, [pathname])

  return null
}
