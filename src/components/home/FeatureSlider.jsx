import useWebflowSlider from './useWebflowSlider'

// Feature highlight cards in a Webflow `w-slider` (2 slides x 2 cards). Behaviour: useWebflowSlider.

const SLIDES = [
  [
    {
      icon: '/images/calendar_11889388.avif',
      cardClass: ' polymer-card',
      headingClass: 'polymergpt-heading',
      heading: 'The whole week, in plain language',
      text: 'Six clear demand bands across four dayparts and seven days, with simple context behind every spike and dip.',
    },
    {
      icon: '/images/rainy-day_17080738.avif',
      headingClass: 'chemical--heading',
      heading: (
        <>
          Events and weather, not averages
          <br />
        </>
      ),
      text: 'Events and weather are factored into forecasts, adjusting demand based on nearby activity, distance, and changing conditions.',
    },
  ],
  [
    {
      icon: '/images/folder_9728917.avif',
      headingClass: 'chemical--heading',
      heading: 'Built for your concept, in your zone',
      text: 'Forecasts tailored to each concept and trade-area zone, reflecting how demand changes by location and business type.',
    },
    {
      icon: '/images/comment_14236337.png',
      headingClass: 'chemical--heading',
      heading: 'It learns from your floor',
      text: 'After each shift, ForeShift compares actual demand with its forecast and instantly fine-tunes future predictions.',
    },
  ],
]

const ARROW_PATHS = {
  left: 'M11.828 12.0001L14.657 14.8281L13.243 16.2431L9 12.0001L13.243 7.75708L14.657 9.17208L11.828 12.0001Z',
  right: 'M12.1718 12.0001L9.34277 9.17208L10.7568 7.75708L14.9998 12.0001L10.7568 16.2431L9.34277 14.8281L12.1718 12.0001Z',
}

function ArrowIcon({ path }) {
  return (
    <div className="f-icon-regular-2 w-embed">
      <svg width="420" height="420" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d={path} fill="currentColor"></path>
      </svg>
    </div>
  )
}

export default function FeatureSlider() {
  const { rootProps, maskProps, liveProps, leftProps, rightProps, dots } = useWebflowSlider(0)
  return (
    <div className="f-section-regular-2">
      <div className="f-testimonial-background-2"></div>
      <div className="f-container-large">
        <div
          data-delay="4000"
          data-animation="slide"
          className="f-testimonial-slider-regular w-slider"
          data-autoplay="false"
          data-easing="ease"
          data-hide-arrows="false"
          data-disable-swipe="false"
          data-autoplay-limit="0"
          data-nav-spacing="3"
          data-duration="500"
          data-infinite="true"
          {...rootProps}
        >
          <div className="f-testimonial-mask w-slider-mask" {...maskProps}>
            {SLIDES.map((cards, i) => (
              <div key={i} className="w-slide">
                <div className="w-layout-grid f-testimonial-slider-grid-large">
                  {cards.map(({ icon, cardClass = '', headingClass, heading, text }) => (
                    <div key={icon} className={`f-testimonial-card-2${cardClass}`}>
                      <img src={icon} loading="lazy" width="60" alt="" className="image-5" />
                      <p className={`f-paragraph-small-4 ${headingClass}`}>{heading}</p>
                      <p className="f-paragraph-small-4">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div {...liveProps}></div>
          </div>
          <div className="f-testimonial-l-arrow-2 w-slider-arrow-left" {...leftProps}>
            <ArrowIcon path={ARROW_PATHS.left} />
          </div>
          <div className="f-testimonial-r-arrow-2 w-slider-arrow-right" {...rightProps}>
            <ArrowIcon path={ARROW_PATHS.right} />
          </div>
          <div className="f-slide-nav-hidden w-slider-nav w-round">
            {dots.map(({ key, ...dot }) => (
              <div key={key} {...dot}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
