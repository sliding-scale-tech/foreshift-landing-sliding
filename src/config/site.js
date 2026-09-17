// Single source of truth for shared content (nav, footer, links, assets).
// Pages and shared components read from here — never hardcode these values elsewhere.

export const ROUTES = {
  home: '/',
  about: '/about-us',
  terms: '/terms-and-conditions',
  privacy: '/privacy-policy',
  refunds: '/refunds-cancellation',
  eligibility: '/eligibility-restrictions',
}

export const EXTERNAL = {
  signup: 'https://app.sawda.ai/signup',
  login: 'https://app.sawda.ai/login',
  developer: 'https://www.slidingscale.xyz/',
}

export const LOGOS = {
  foreshiftDark: {
    src: '/images/Foreshift_logo-dark.png',
    srcSet:
      '/images/ef4e0cf6b4e87a2eb6928bb2d0c12529_Foreshift_logo-dark-p-500.png 500w, /images/ef4e0cf6b4e87a2eb6928bb2d0c12529_Foreshift_logo-dark-p-800.png 800w, /images/ef4e0cf6b4e87a2eb6928bb2d0c12529_Foreshift_logo-dark-p-1080.png 1080w, /images/Foreshift_logo-dark.png 1343w',
  },
  foreshiftFooter: {
    src: '/images/Foreshift_logo-dark1_1Foreshift_logo-dark1.avif',
    srcSet:
      '/images/Foreshift_logo-dark1_1-p-500.avif 500w, /images/Foreshift_logo-dark1_1-p-800.avif 800w, /images/Foreshift_logo-dark1_1Foreshift_logo-dark1.avif 1343w',
  },
  sawda: {
    src: '/images/logo-v.1.png',
    srcSet:
      '/images/logo-v.1-p-500.png 500w, /images/logo-v.1-p-800.png 800w, /images/logo-v.1-p-1080.png 1080w, /images/logo-v.1.png 1434w',
  },
}

// Section anchors on the home page.
export const SECTIONS = [
  { label: 'Features', id: 'Feature-Section' },
  { label: 'How it Works', id: 'how-it-works' },
  { label: 'Pricing', id: 'Pricing' },
  { label: 'Early Access', id: 'Form' },
]

export const LEGAL_LINKS = [
  { label: 'Terms & Conditions', to: ROUTES.terms },
  { label: 'Privacy Policy', to: ROUTES.privacy },
  { label: 'Refunds & Cancellations', to: ROUTES.refunds },
  { label: 'Eligibility & Restrictions', to: ROUTES.eligibility },
]

export const CONTACT_LINKS = [
  { label: '(888)2345-6789', href: 'tel:(888)2345-6789' },
  { label: 'support@foreshift.ai', href: 'mailto:info@example.com' },
  { label: 'hello@foreshift.ai', href: 'mailto:info@example.com' },
]

// About-us page uses the legacy Sawda chrome.
export const ABOUT_NAV_LINKS = [
  { label: 'Features', to: ROUTES.home },
  { label: 'Industries', to: ROUTES.home },
  { label: 'Pricing', to: ROUTES.home },
  { label: 'About Us', to: ROUTES.about },
]

export const PAGE_TITLES = {
  home: 'ForeShift V2.0',
  about: 'About Us',
  terms: 'Terms and Conditions',
  privacy: 'Privacy Policy',
  refunds: 'Refunds & cancellation',
  eligibility: 'Eligibility & Restrictions',
}

// Webflow page ids (data-wf-page) — keeps IX interaction scoping identical to the export.
export const WF_PAGE_IDS = {
  home: '6aa91495972a5cddf72d871e',
  about: '6aa91495972a5cddf72d8721',
  terms: '6aa91495972a5cddf72d8720',
  privacy: '6aa91495972a5cddf72d871f',
  refunds: '6aab99f7f63c9f6c284ef5d6',
  eligibility: '6aaba05e9be3cbd1149cdb13',
}
export const WF_SITE_ID = '6aa91495972a5cddf72d8759'
