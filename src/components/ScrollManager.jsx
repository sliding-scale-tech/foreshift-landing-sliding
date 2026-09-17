import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const QUIET_MS = 600 // layout considered stable after this long without a size change
const MAX_MS = 6000
const USER_INPUT = ['wheel', 'touchstart', 'keydown', 'mousedown']

/**
 * Route-level scroll: on a page change, jump to the #hash target (e.g. /#Pricing from a legal
 * page) or to the top. Same-page hash links are animated by src/animations/webflowScroll.js, and
 * back/forward between hashes keeps the browser's own scroll restoration.
 *
 * While the new page is still settling (images decoding, fonts, interactions applying initial
 * states) its height changes, so the hash target is re-aligned until the layout is stable or the
 * user takes over.
 */
export default function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1))
    if (!target) {
      window.scrollTo(0, 0)
      return
    }

    let quiet = 0
    const stop = () => {
      observer.disconnect()
      clearTimeout(quiet)
      clearTimeout(cap)
      USER_INPUT.forEach((e) => window.removeEventListener(e, stop))
    }
    const align = () => {
      target.scrollIntoView()
      clearTimeout(quiet)
      quiet = setTimeout(stop, QUIET_MS)
    }
    // html is height:100% in webflow.css, so watch the app root for content growth.
    const observer = new ResizeObserver(align)
    observer.observe(document.getElementById('root') ?? document.body)
    const cap = setTimeout(stop, MAX_MS)
    USER_INPUT.forEach((e) => window.addEventListener(e, stop, { passive: true }))
    align()
    return stop
    // Only page changes: same-page hash changes are handled by webflowScroll / browser history.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return null
}
