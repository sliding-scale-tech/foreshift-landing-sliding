import { MISSION_ITEMS } from './aboutData'

export default function Mission() {
  return (
    <div className="spark-section-7">
      <div className="spark-container-7 w-container">
        <div className="spark-flex-row-4 spark-5-spacing spark-with-vertical-image">
          <img
            src="/images/6181711.jpg"
            loading="lazy"
            width="386"
            sizes="(max-width: 479px) 100vw, 386px"
            alt=""
            srcSet="/images/6181711-p-500.jpg 500w, /images/6181711-p-800.jpg 800w, /images/6181711-p-1080.jpg 1080w, /images/6181711-p-1600.jpg 1600w, /images/6181711.jpg 2000w"
            className="spark-left-side-vertical-image"
          />
          <div className="spark-hero-section-left-side-2">
            <h2>How will we <span className="text-span-22">Achieve it</span></h2>
            <div className="combine-text-size-regular-4 footnote how-caption">Sawda’s mission is to democratize international trade by integrating real-time intelligence, predictive pricing, compliance automation, and deal execution into a single AI-powered platform, reducing friction, eliminating opacity, and empowering businesses of all sizes to compete globally.</div>
            <div className="spark-flex-row-4 spark-wrapped">
              {MISSION_ITEMS.map((item) => (
                <div key={item.label} className="spark-checked-item">
                  <img
                    src={`/images/${item.icon}.png`}
                    loading="lazy"
                    sizes="(max-width: 512px) 100vw, 512px"
                    srcSet={`/images/${item.icon}-p-500.png 500w, /images/${item.icon}.png 512w`}
                    alt=""
                    className="a-icon-regular"
                  />
                  <div className={item.textClass}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
