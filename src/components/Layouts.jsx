import { ABOUT_NAV_LINKS, LOGOS, PAGE_TITLES, ROUTES, SECTIONS, WF_PAGE_IDS } from '../config/site'
import usePageMeta from '../hooks/usePageMeta'
import Footer, { FooterDark } from './Footer'
import Navbar from './Navbar'

const homeAnchors = SECTIONS.map((s) => ({ label: s.label, href: `#${s.id}` }))
const crossPageAnchors = SECTIONS.map((s) => ({ label: s.label, to: `${ROUTES.home}#${s.id}` }))

// a11y: page content sits in <main> (landmark-one-main). `main` is display:block (normalize.css) with no
// other rules, and the navbar stays a direct child of #root (webflowScroll header selector).

/** Home page chrome: ForeShift nav + footer with in-page anchors. */
export function HomeLayout({ children }) {
  usePageMeta({ title: PAGE_TITLES.home, wfPage: WF_PAGE_IDS.home })
  return (
    <>
      <Navbar logoCurrent links={homeAnchors} logoLabel="ForeShift home" />
      <main>{children}</main>
      <Footer quickLinks={homeAnchors} currentPath={ROUTES.home} />
    </>
  )
}

/** Legal pages chrome. `page` is a key of ROUTES (terms | privacy | refunds | eligibility). */
export function LegalLayout({ page, children }) {
  usePageMeta({ title: PAGE_TITLES[page], wfPage: WF_PAGE_IDS[page] })
  return (
    <>
      <Navbar logoSizes="124px" links={crossPageAnchors} logoLabel="ForeShift home" />
      <main>{children}</main>
      <Footer quickLinks={crossPageAnchors} currentPath={ROUTES[page]} />
    </>
  )
}

/** About Us page chrome (legacy Sawda nav + dark footer). */
export function AboutLayout({ children }) {
  usePageMeta({ title: PAGE_TITLES.about, wfPage: WF_PAGE_IDS.about })
  const links = ABOUT_NAV_LINKS.map((l) => ({ ...l, current: l.to === ROUTES.about }))
  return (
    <>
      <Navbar logo={LOGOS.sawda} links={links} showLogin logoLabel="Home" />
      <main>{children}</main>
      <FooterDark />
    </>
  )
}
