// "plan Smart / Prep Ahead …" scrolling marquee. Motion is driven by the interactions engine (data-w-id).

const TOP_ROW = [
  ['plan', 'Smart'],
  ['Prep', 'Ahead'],
  ['Staff', 'better'],
  ['Waste', 'Less'],
  ['Plan', 'Smart'],
  ['Prep', 'Ahead'],
  ['Prep', 'Ahead'],
]

const BOTTOM_ROW = [
  <>Trusted Deals</>,
  <>
    ONE PLATFORM
    <br />
  </>,
  <>
    <span>Demand</span> Signals
  </>,
  <>
    Event <span>Aware</span>
  </>,
  <>weather ready</>,
  <>
    Smarter <span>Shifts</span>
  </>,
]

export default function Marquee() {
  return (
    <section className="rt-component-section">
      <div className="w-layout-blockcontainer rt-component-container w-container">
        <div data-w-id="8eca6949-e84f-47d0-397c-c96214445d96" className="rt-overflow-hidden-2">
          <div className="rt-marquee-one">
            {TOP_ROW.map(([lead, accent], i) => (
              <div key={i} className="rt-marquee-left-text rt-heading-one rt-color-black rt-no-wrap">
                {lead} <span className="rt-change-font">{accent}</span>
              </div>
            ))}
          </div>
          <div className="rt-marquee-divider rt-margin-top-twenty rt-margin-bottom-twenty rt-bg-color-black"></div>
          <div className="rt-marquee-three">
            {BOTTOM_ROW.map((content, i) => (
              <div key={i} className="rt-heading-one rt-color-black rt-no-wrap rt-change-stroke-copy">
                {content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
