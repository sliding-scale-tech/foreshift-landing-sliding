// "The Solution: ForeShift" with the animated circle clusters on each side.

const LEFT_CIRCLES = [
  ['6ee607ab-c2d5-24df-96a3-0ee7e5a99d2c', ''],
  ['6ee607ab-c2d5-24df-96a3-0ee7e5a99d2d', ' spark-circle-two'],
  ['6ee607ab-c2d5-24df-96a3-0ee7e5a99d2e', ' spark-circle-three'],
]

const RIGHT_CIRCLES = [
  ['6ee607ab-c2d5-24df-96a3-0ee7e5a99d30', ' spark-circle-static'],
  ['6ee607ab-c2d5-24df-96a3-0ee7e5a99d31', ' spark-circle-right-two'],
  ['6ee607ab-c2d5-24df-96a3-0ee7e5a99d32', ' spark-circle-three-right'],
]

const Circles = ({ items }) =>
  items.map(([wId, modifier]) => <div key={wId} data-w-id={wId} className={`spark-big-circle-4${modifier}`}></div>)

export default function SolutionSection() {
  return (
    <section
      id="Feature-Section"
      data-w-id="6ee607ab-c2d5-24df-96a3-0ee7e5a99d19"
      className="spark-section-9 spark-overflow-hidden-2"
    >
      <div className="spark-container-4 spark-centered-content w-container">
        <h2 className="chatbot-heading">
          The Solution: <span className="text-span-55">ForeShift</span>
        </h2>
        <p className="spark-hero-sub-paragraph-5">
          ForeShift connects demand, weather, events and operational signals so your team can staff smarter, prep
          ahead and waste less.
        </p>
      </div>
      <div className="spark-hold-circles-2">
        <Circles items={LEFT_CIRCLES} />
      </div>
      <div className="spark-hold-circles-2 spark-right-side">
        <Circles items={RIGHT_CIRCLES} />
      </div>
    </section>
  )
}
