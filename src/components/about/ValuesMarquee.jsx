import { Fragment } from 'react'
import { MARQUEE_ITEMS, MARQUEE_TRACK_COUNT } from './aboutData'

// Motion is driven by the IX2 engine via data-w-id (src/animations); no inline transforms here.
function MarqueeTrack() {
  return (
    <div className="rt-marque-text-two-2">
      {MARQUEE_ITEMS.map((item) => (
        <Fragment key={item.label}>
          <img width="33" height="33" alt="" src={item.src} sizes={item.sizes} srcSet={item.srcSet} />
          <div className="rt-marque-title-2 rt-bottom-title-block">{item.label}</div>
        </Fragment>
      ))}
    </div>
  )
}

export default function ValuesMarquee() {
  return (
    <section className="rt-component-section-4">
      <div className="w-layout-blockcontainer rt-component-container-2 w-container">
        <section data-w-id="fb8f8b92-d9f4-fcbe-5812-5026f4d961fd" className="rt-home-two-text-marquee-section-2 rt-second">
          <div className="rt-marque-wrap-big-oppsite-2">
            {Array.from({ length: MARQUEE_TRACK_COUNT }, (_, i) => (
              <MarqueeTrack key={i} />
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
