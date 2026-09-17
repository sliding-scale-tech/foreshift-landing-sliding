import { wfTarget } from './wf'

// "Four Steps, then you're Ahead of it." — alternating image/text feature cards.
// Optional `*Target` fields are IX3 element ids (rendered as data-wf-target). `btn`: undefined = no
// btn-container, {} = plain btn-container, { target } = animated btn-container.

const IMAGE_SIZES = '(max-width: 767px) 100vw, (max-width: 991px) 95vw, 940px'

const STEPS = [
  {
    tag: 'Step 1',
    title: (
      <>
        Set your <span>Location</span> &amp; <span>Concept</span> <span className="text-span-59">Type</span>
      </>
    ),
    titleTarget: '0b24b4be-9dd4-e6bd-e5ea-e3f12d7913f1',
    text: 'Enter your venue and concept so ForeShift can place you in the right demand zone.',
    textTarget: '0b24b4be-9dd4-e6bd-e5ea-e3f12d7913f5',
    btn: { target: '0b24b4be-9dd4-e6bd-e5ea-e3f12d7913f7' },
    image: {
      src: '/images/Mac-Studio11.avif',
      target: '0b24b4be-9dd4-e6bd-e5ea-e3f12d7913fb',
      srcSet:
        '/images/74d086280710cefb35a361b6beedf9a1_Mac-Studio11-p-500.png 500w, /images/74d086280710cefb35a361b6beedf9a1_Mac-Studio11-p-800.png 800w, /images/Mac-Studio11.avif 3905w',
    },
  },
  {
    wrapperTarget: '0b24b4be-9dd4-e6bd-e5ea-e3f12d7913fc',
    imageFirst: true,
    cardClass: ' card2',
    tag: 'Step 2',
    title: (
      <>
        Get Your Demand <span className="text-span-60">Baseline</span>
      </>
    ),
    titleTarget: '0b24b4be-9dd4-e6bd-e5ea-e3f12d791400',
    text: 'See a demand score for each day and daypart based on your local market and concept.',
    textTarget: '0b24b4be-9dd4-e6bd-e5ea-e3f12d791404',
    btn: { target: '0b24b4be-9dd4-e6bd-e5ea-e3f12d791406' },
    image: {
      src: '/images/Frame-4.avif',
      target: '0b24b4be-9dd4-e6bd-e5ea-e3f12d7913fe',
      srcSet: [
        '/images/ce1c5755a6ac8492515efce14ecfbbab_Frame-4-p-500.avif 500w',
        '/images/ce1c5755a6ac8492515efce14ecfbbab_Frame-4-p-800.avif 800w',
        '/images/ce1c5755a6ac8492515efce14ecfbbab_Frame-4-p-1080.avif 1080w',
        '/images/ce1c5755a6ac8492515efce14ecfbbab_Frame-4-p-1600.avif 1600w',
        '/images/ce1c5755a6ac8492515efce14ecfbbab_Frame-4-p-2000.avif 2000w',
        '/images/ce1c5755a6ac8492515efce14ecfbbab_Frame-4-p-2600.avif 2600w',
        '/images/Frame-4.avif 3096w',
      ].join(', '),
    },
  },
  {
    wrapperTarget: '0b24b4be-9dd4-e6bd-e5ea-e3f12d791409',
    cardClass: ' card3',
    tag: 'Step 3',
    title: (
      <>
        Adjust with Live <span className="text-span-61">Signals</span>
      </>
    ),
    titleTarget: '0b24b4be-9dd4-e6bd-e5ea-e3f12d79140b',
    text: 'Nearby events and weather refine the forecast based on their real impact on your location.',
    textTarget: '0b24b4be-9dd4-e6bd-e5ea-e3f12d791410',
    image: {
      src: '/images/Frame-722.avif',
      target: '0b24b4be-9dd4-e6bd-e5ea-e3f12d791416',
      srcSet: [
        '/images/Frame-722-p-500.avif 500w',
        '/images/Frame-722-p-800.avif 800w',
        '/images/Frame-722-p-1080.avif 1080w',
        '/images/Frame-722-p-1600.avif 1600w',
        '/images/Frame-722-p-2000.avif 2000w',
        '/images/Frame-722-p-2600.avif 2600w',
        '/images/Frame-722-p-3200.avif 3200w',
        '/images/Frame-722.avif 4000w',
      ].join(', '),
    },
  },
  {
    imageFirst: true,
    cardClass: ' card2',
    tag: 'Step 4',
    title: (
      <>
        Log Actual <span className="text-span-62">Demand</span>
      </>
    ),
    text: 'Record how busy you were so ForeShift can compare results and improve future forecasts.',
    btn: {},
    image: {
      src: '/images/Mac-Studio1111.avif',
      srcSet:
        '/images/63a4e3877a3a7f7173917a29003af32c_Mac-Studio1111-p-500.png 500w, /images/63a4e3877a3a7f7173917a29003af32c_Mac-Studio1111-p-800.png 800w, /images/Mac-Studio1111.avif 3817w',
    },
  },
]

const target = (id) => (id ? wfTarget(id) : undefined)

function StepCard({ step }) {
  const { wrapperTarget, imageFirst, cardClass = '', tag, title, titleTarget, text, textTarget, btn, image } = step
  const content = (
    <div key="content" className={`w-layout-blockcontainer featured-card-left-container${cardClass} w-container`}>
      <div animation="tag-hero" className="tag-item">
        <div className="text-block-26">{tag}</div>
      </div>
      <h3 data-wf-target={target(titleTarget)} className="featured-card-title">
        {title}
      </h3>
      <p data-wf-target={target(textTarget)} className="featured-card-text">
        {text}
      </p>
      {btn && <section data-wf-target={target(btn.target)} className="btn-container"></section>}
    </div>
  )
  const media = (
    <div key="media" className="w-layout-blockcontainer featured-card-right-container w-container">
      <img
        src={image.src}
        loading="lazy"
        data-wf-target={target(image.target)}
        sizes={IMAGE_SIZES}
        alt=""
        srcSet={image.srcSet}
        className="featured-card-image"
      />
    </div>
  )
  return (
    <div data-wf-target={target(wrapperTarget)} className="featured-card-wrapper">
      {imageFirst ? [media, content] : [content, media]}
    </div>
  )
}

export default function HowItWorks() {
  return (
    <section id="Features-Section" className="featured-wrapper">
      <section
        id="how-it-works"
        data-wf-target={wfTarget('0b24b4be-9dd4-e6bd-e5ea-e3f12d7913ee')}
        className="featured-card-container"
      >
        <div className="f-margin-bottom-131">
          <div className="f-title-wrapper-center-4">
            <div className="f-margin-bottom-130">
              <h3 className="f-h3-heading-5">
                <span className="text-span-56">Four</span> Steps, then you&#x27;re Ahead of it.
              </h3>
            </div>
            <p className="f-paragraph-large-5">
              Set your location and concept, get a demand baseline, let live signals refine it, and log actual results
              to improve future forecasts, in seconds.
            </p>
          </div>
        </div>
        {STEPS.map((step) => (
          <StepCard key={step.tag} step={step} />
        ))}
      </section>
    </section>
  )
}
