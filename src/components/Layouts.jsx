import { ABOUT_NAV_LINKS, LOGOS, PAGE_TITLES, ROUTES, SECTIONS, WF_PAGE_IDS } from '../config/site'
import usePageMeta from '../hooks/usePageMeta'
import Footer, { FooterDark } from './Footer'
import Navbar from './Navbar'

const homeAnchors = SECTIONS.map((s) => ({ label: s.label, href: `#${s.id}` }))
const crossPageAnchors = SECTIONS.map((s) => ({ label: s.label, href: `${ROUTES.home}#${s.id}` }))

/** Home page chrome: ForeShift nav + footer with in-page anchors. */
export function HomeLayout({ children }) {
  usePageMeta({ title: PAGE_TITLES.home, wfPage: WF_PAGE_IDS.home })
  return (
    <>
      <Navbar logoCurrent links={homeAnchors} />
      {children}
      <Footer quickLinks={homeAnchors} currentPath={ROUTES.home} />
    </>
  )
}

/** Legal pages chrome. `page` is a key of ROUTES (terms | privacy | refunds | eligibility). */
export function LegalLayout({ page, children }) {
  usePageMeta({ title: PAGE_TITLES[page], wfPage: WF_PAGE_IDS[page] })
  return (
    <>
      <Navbar logoSizes="124px" links={crossPageAnchors} />
      {children}
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
      <Navbar logo={LOGOS.sawda} links={links} showLogin />
      {children}
      <FooterDark />
    </>
  )
}
