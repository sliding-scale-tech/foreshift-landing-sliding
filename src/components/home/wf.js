import { WF_PAGE_IDS } from '../../config/site'

/** Decoded Webflow IX3 `data-wf-target` value for an element on the home page. */
export const wfTarget = (elementId) => JSON.stringify([[[WF_PAGE_IDS.home, elementId], []]])
