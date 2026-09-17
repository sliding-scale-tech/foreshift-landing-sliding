// "Your Busiest Night shouldn't be a Surprise." — the three pain points.

const PAIN_POINTS = [
  {
    Heading: 'h2',
    icon: {
      src: '/images/confused_5805939.png',
      sizes: '(max-width: 479px) 100vw, (max-width: 1279px) 49vw, 512px',
      srcSet: '/images/confused_5805939-p-500.png 500w, /images/confused_5805939.png 512w',
    },
    title: 'Overstaffed',
    text: 'You schedule five for a night that never comes. The labor is burned before the first ticket prints.',
  },
  {
    Heading: 'h5',
    icon: { src: '/images/stress_6819627.png' },
    title: 'Understaffed',
    text: "A stadium game, a festival, a sudden warm Friday, nobody saw it, and now it's walkouts, bad reviews, and a blown service.",
  },
  {
    Heading: 'h5',
    icon: { src: '/images/time_16501809.png' },
    title: 'Over-prepped',
    text: "You buy and prep for the night you hoped for. What doesn't sell goes in the bin, and the order sheet repeats it next week.",
  },
]

export default function ProblemSection() {
  return (
    <div className="a-section-regular">
      <div className="a-container-regular-2">
        <div className="a-cta-grid-wrapper">
          <div className="w-layout-grid a-cta-grid">
            <div>
              <div className="a-margin-bottom-49">
                <h1 className="a-h5-heading">
                  Your Busiest Night shouldn’t be a <strong className="bold-text-3">Surprise.</strong>
                  <br />
                  Neither should your <strong className="bold-text-4">Slowest.</strong>
                </h1>
              </div>
              <p className="a-paragraph-regular-2">
                The problem isn’t that restaurants can’t react. It’s that by the time you’re reacting, the expensive
                decisions have already been made.
              </p>
              <div className="a-cta-content">
                {PAIN_POINTS.map(({ Heading, icon, title, text }) => (
                  <div key={title} className="a-cta-link-wrapper">
                    <div className="a-cta-icon-circle">
                      <img
                        src={icon.src}
                        loading="lazy"
                        sizes={icon.sizes}
                        srcSet={icon.srcSet}
                        alt=""
                        className="a-icon-regular-2"
                      />
                    </div>
                    <div>
                      <Heading aria-level={Heading === 'h5' ? 2 : undefined} className="a-subheading-regular-2">{title}</Heading>
                      <div className="text-block-5">{text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
