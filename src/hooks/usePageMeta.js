import { useEffect } from 'react'

/** Sets document title + Webflow page id (data-wf-page) for the active route. */
export default function usePageMeta({ title, wfPage }) {
  useEffect(() => {
    document.title = title
    if (wfPage) document.documentElement.setAttribute('data-wf-page', wfPage)
  }, [title, wfPage])
}
