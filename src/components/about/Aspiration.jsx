import ValuesMarquee from './ValuesMarquee'

export default function Aspiration() {
  return (
    <div className="a-section-regular">
      <div className="a-container-regular-2">
        <div className="a-cta-grid-wrapper">
          <div className="w-layout-grid a-cta-grid">
            <div>
              <div className="a-margin-bottom-49">
                <h1 className="a-h5-heading">What we <span className="text-span-23">Aspire to Become</span></h1>
              </div>
              <p className="a-paragraph-regular-2">To become the world’s most trusted AI-driven operating system for global trade, enabling any business, anywhere, to trade seamlessly, intelligently, and confidently across borders.</p>
            </div>
          </div>
          <ValuesMarquee />
        </div>
      </div>
    </div>
  )
}
