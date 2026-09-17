import { EXTERNAL } from '../../config/site'

const HERO_IMAGE = {
  src: '/images/ZenBook-Duo-1411.avif',
  sizes: '(max-width: 3552px) 100vw, 3552px',
  srcSet: [
    '/images/9efff890f8cb60612b997e9b71b86ef6_ZenBook-Duo-1411-p-500.avif 500w',
    '/images/9efff890f8cb60612b997e9b71b86ef6_ZenBook-Duo-1411-p-800.avif 800w',
    '/images/9efff890f8cb60612b997e9b71b86ef6_ZenBook-Duo-1411-p-1080.avif 1080w',
    '/images/9efff890f8cb60612b997e9b71b86ef6_ZenBook-Duo-1411-p-1600.avif 1600w',
    '/images/9efff890f8cb60612b997e9b71b86ef6_ZenBook-Duo-1411-p-2000.avif 2000w',
    '/images/9efff890f8cb60612b997e9b71b86ef6_ZenBook-Duo-1411-p-2600.avif 2600w',
    '/images/9efff890f8cb60612b997e9b71b86ef6_ZenBook-Duo-1411-p-3200.avif 3200w',
    '/images/ZenBook-Duo-1411.avif 3552w',
  ].join(', '),
}

export default function Hero() {
  return (
    <div className="f-section-large">
      <div className="f-container-regular">
        <div className="container-full">
          <div className="hero_layout">
            <div id="w-node-fc305085-c286-b022-5e74-c40c5ba76a4d-f72d871e" className="div-block-46">
              <div data-w-id="fc305085-c286-b022-5e74-c40c5ba76a4e" className="max-width-large">
                <h1 className="f-h1-heading">
                  Know the Rush before it <span className="text-span-3">Hits</span>
                </h1>
                <div className="text-color-secondary">
                  ForeShift forecasts zone demand for independent restaurants, bars, and cafe operators: how much
                  appetite there is for your kind of place, in your part of the city. You staff, prep, and open to the
                  wave instead of guessing at it.
                </div>
              </div>
              <div className="uui-button-row is-reverse-mobile-landscape">
                <div className="uui-button-wrapper max-width-full-mobile-landscape-2">
                  <a href={EXTERNAL.signup} target="_blank" className="f-navigation-button herocta w-inline-block">
                    <div className="text-block">Get Started</div>
                  </a>
                </div>
              </div>
            </div>
            <div
              id="w-node-fc305085-c286-b022-5e74-c40c5ba76a5a-f72d871e"
              data-w-id="fc305085-c286-b022-5e74-c40c5ba76a5a"
              className="container_img is-realtime"
            >
              <div data-w-id="fc305085-c286-b022-5e74-c40c5ba76a5b" className="realtime_img-h">
                <img
                  src={HERO_IMAGE.src}
                  loading="lazy"
                  sizes={HERO_IMAGE.sizes}
                  srcSet={HERO_IMAGE.srcSet}
                  alt=""
                  className="img"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
