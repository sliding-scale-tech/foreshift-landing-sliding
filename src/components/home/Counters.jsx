// Rolling-digit counters ("Concept Types", "Regional Zones", "Demand Bands").
// Each counter is a list of digit columns; each column is a list of "trains" (vertical digit strips).

const COUNTERS = [
  {
    wId: '9a6e79be-62ad-f9bb-f698-c26aa35a81e7',
    digits: [
      [
        ['0', '3', '6'],
        ['9', '6', '3'],
      ],
    ],
    label: 'Concept Types',
  },
  {
    nodeId: 'w-node-_9a6e79be-62ad-f9bb-f698-c26aa35a8212-f72d871e',
    wId: '9a6e79be-62ad-f9bb-f698-c26aa35a8214',
    digits: [
      [
        ['0', '1', '2', '3', '4', '5'],
        ['1', '1', '2', '3', '4', '5'],
      ],
      [
        ['0', '1', '1', '2', '3', '4', '4', '5', '4', '6'],
        ['3', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      ],
    ],
    label: 'Regional Zones',
    plusIcon: true,
  },
  {
    wId: 'fcc0385d-2369-ae25-426b-8b06f2f4248f',
    digits: [
      [
        ['0', '2', '4'],
        ['6', '4', '2'],
      ],
    ],
    label: 'Demand Bands',
  },
]

export default function Counters() {
  return (
    <section className="rt-component-section-2">
      <div className="w-layout-blockcontainer rt-component-container w-container">
        <div className="rt-home-two-team-counter-wrapper">
          <div className="w-layout-grid rt-counter-grid">
            {COUNTERS.map(({ nodeId, wId, digits, label, plusIcon }) => (
              <div key={label} id={nodeId} className="w-layout-hflex rt-home-hero-counter-columns">
                <div className="rt-counter-items-wrapper">
                  <div data-w-id={wId} className="w-layout-hflex rt-counter-box-2 rt-heading-two-box">
                    {digits.map((trains, c) => (
                      <div key={c} className="rt-counter-2">
                        {trains.map((train, t) => (
                          <div key={t} className="rt-counter-train-2">
                            {train.map((d, k) => (
                              <div key={k}>{d}</div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <p className="rt-counter-items-name rt-margin-top-ten">{label}</p>
                  {plusIcon && (
                    <img width="34" height="34" alt="Plus Icon" src="/images/-1.svg" className="rt-counter-design-image" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
