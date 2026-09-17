// Content arrays for repeated blocks on the About Us page (mirrors reference/original/about-us.html).

const MARQUEE_ICON_SIZES =
  '(max-width: 991px) 33px, (max-width: 1279px) 3vw, (max-width: 1439px) 33px, (max-width: 1919px) 2vw, 33px'

export const MARQUEE_ITEMS = [
  {
    label: 'Trust',
    src: '/images/trust_15555937.png',
    sizes: MARQUEE_ICON_SIZES,
    srcSet: '/images/trust_15555937-p-500.png 500w, /images/trust_15555937.png 512w',
  },
  { label: 'AI', src: '/images/AI_1AI.png' },
  {
    label: 'Global Accessibility',
    src: '/images/access_3696364.png',
    sizes: MARQUEE_ICON_SIZES,
    srcSet: '/images/access_3696364-p-500.png 500w, /images/access_3696364.png 512w',
  },
  {
    label: 'Market Leadership',
    src: '/images/leadership_11126276.png',
    sizes: MARQUEE_ICON_SIZES,
    srcSet: '/images/leadership_11126276-p-500.png 500w, /images/leadership_11126276.png 512w',
  },
  {
    label: 'Trade Infrastructure',
    src: '/images/business_11549789.png',
    sizes: MARQUEE_ICON_SIZES,
    srcSet: '/images/business_11549789-p-500.png 500w, /images/business_11549789.png 512w',
  },
]

// The export repeats the marquee track three times for a seamless loop.
export const MARQUEE_TRACK_COUNT = 3

export const MISSION_ITEMS = [
  { label: 'Real-time Intelligence', icon: 'brain_6095346', textClass: 'text-block-13' },
  { label: 'Deal Executions', icon: 'mediation_16137517', textClass: 'text-block-15' },
  { label: 'Predicting Pricings', icon: 'forecasting_18699344', textClass: 'text-block-14' },
  { label: 'Eliminating Opacity', icon: 'contrast_1178042', textClass: 'text-block-21' },
  { label: 'Compliance Automation', icon: 'testing_17681480', textClass: 'text-block-23' },
  { label: 'Empowering All Businesses', icon: 'trade-union_17322147', textClass: 'text-block-22' },
]
