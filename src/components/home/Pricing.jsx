// "Three Tiers. One Ecosystem" pricing cards.

const TIERS = [
  {
    wId: 'c88b778b-a0ab-076e-fd97-79d1e2df5524',
    name: 'Event Intelligence',
    taglineClass: 'rt-body-font-color-2',
    tagline: 'Know your city',
    price: '$99',
    features: [
      'Weather forecast for the week',
      'Sports - all Detroit teams',
      'Concerts, tradeshows, festivals, 5Ks',
      'Demand signal per event for your zone',
      'Start in seconds - zone and type only',
    ],
    cta: {
      href: '#',
      wId: '9279b6f8-6db7-cbf3-af4e-7dcc68cae825',
      modifier: ' starter-cta',
      textModifier: ' starter-text',
      label: 'Get Started',
    },
  },
  {
    wId: 'c88b778b-a0ab-076e-fd97-79d1e2df554e',
    name: 'Dynamic Scheduling',
    taglineClass: 'rt-text-light-white',
    tagline: 'Know your scehdule',
    price: '$199',
    features: [
      'Everything in Tier 1',
      'Shift-level staffing recommendations',
      'Estimated covers per daypart',
      'Server and kitchen crew counts',
      'Revenue estimate per shift',
    ],
    cta: { href: '#', wId: '7f23ff01-b047-7a8b-db7e-7322a3441654', modifier: '', textModifier: '', label: 'Upgrade' },
  },
  {
    wId: '144ecefe-6bb5-fc0f-5d50-ea14bc366009',
    name: 'Sales Forecasting',
    taglineClass: 'rt-text-light-white',
    tagline: 'Know your numbers',
    price: '$299',
    features: [
      'Everything in Tier 2',
      'Thirty-day forward revenue projection',
      'POS or CSV historical data upload',
      'Variance tracking: predicted vs actual',
      'Market intelligence for expansion',
    ],
    cta: {
      href: '#Form',
      wId: '3f35f151-42fd-190b-6a06-aba16a98b2a2',
      modifier: ' sales-cta',
      textModifier: ' sales-text',
      label: 'Upgrade',
    },
  },
]

function PricingCard({ tier }) {
  const { wId, name, taglineClass, tagline, price, features, cta } = tier
  return (
    <div data-w-id={wId} className="rt-home-one-pricing-item">
      <div className="rt-insurence-heading">{name}</div>
      <p className={`rt-margin-bottom-twentyfive ${taglineClass}`}>{tagline}</p>
      <h3 aria-level="2" className="rt-pricing-text rt-color-dark">
        <span className="text-span-30">{price}</span> <span className="rt-per-month-text">/month</span>
      </h3>
      <div className="rt-home-one-pricing-line"></div>
      {features.map((feature) => (
        <div key={feature} className="rt-home-one-pricing-price-item">
          <img width="19" height="19" alt="Check" src="/images/Vector-853.svg" loading="lazy" />
          <div className="rt-body-font-two">{feature}</div>
        </div>
      ))}
      <div className="rt-home-one-pricing-plan-button rt-padding-bottom-twenty">
        <a
          href={cta.href}
          role="button"
          data-w-id={cta.wId}
          className={`rt-primary-button-2 rt-pricing-one-btn${cta.modifier} w-inline-block`}
        >
          <div className={`rt-button-text-4 rt-black-btn-text${cta.textModifier}`}>{cta.label}</div>
          <div className="rt-bg-round-black rt-pricing-one-btn"></div>
        </a>
      </div>
    </div>
  )
}

export default function Pricing() {
  return (
    <section id="Pricing" className="rt-component-section-8">
      <div className="w-layout-blockcontainer rt-component-container-5 w-container">
        <div className="rt-main-container-2 rt-position-relative">
          <div className="rt-pricing-two-banner-heading rt-overflow-hidden-4">
            <h1 className="rt-margin-bottom-twenty-3 rt-text-black-2">
              Three Tiers. One <span className="text-span-34">Ecosystem</span>
            </h1>
          </div>
          <div className="rt-pricing-two-banner-paragraph rt-overflow-hidden-4">
            <p data-w-id="c88b778b-a0ab-076e-fd97-79d1e2df5514" className="rt-text-align-center rt-body-font-color-3">
              Every tier includes the one below it. All prices are in US Dollars (USD), billed monthly, cancel any time.
              Applicable taxes are shown at checkout.
            </p>
          </div>
          <div className="rt-pricing-two-banner-design">
            <img width="102" height="102" alt="Coin" src="/images/Coin-Design.svg" loading="lazy" className="rt-auto-fit-13 rt-move-side" />
          </div>
          <div className="rt-pricing-two-banner-design-two">
            <img width="65" height="65" alt="Hand" src="/images/Hand.svg" loading="lazy" className="rt-auto-fit-13 rt-move-up-down" />
          </div>
        </div>
        <section className="rt-pricing-two-price">
          <div className="rt-main-container-2">
            {/* Export has inline style="display:grid" here; moved to home.css. */}
            <div className="rt-home-one-pricing-option rt-monthly-2">
              {TIERS.map((tier) => (
                <PricingCard key={tier.name} tier={tier} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}
