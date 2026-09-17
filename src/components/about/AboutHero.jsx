import { EXTERNAL } from '../../config/site'

export default function AboutHero() {
  return (
    <section className="spark-section-7 spark-overflow-hidden">
      <div className="spark-container-7 spark-centered-content-2 w-container">
        <h2>About <span className="text-span-24">Sawda</span></h2>
        <p className="spark-hero-sub-paragraph-3">Reimagining global trade with intelligence, transparency, and trust - <span className="text-span-25">Sawda</span> connects the world’s markets through the power of AI.</p>
        <div className="spark-flex-row-4 spark-centered"></div>
        <a href={EXTERNAL.signup} target="_blank" className="f-navigation-button w-inline-block">
          <div className="text-block about-hero-cta">Try Sawda AI</div>
        </a>
      </div>
      <div className="spark-hold-circles-2">
        <div className="spark-big-circle-3"></div>
        <div className="spark-big-circle-3 spark-circle-two"></div>
        <div className="spark-big-circle-3 spark-circle-three"></div>
      </div>
      <div className="spark-hold-circles-2 spark-right-side">
        <div className="spark-big-circle-3 spark-circle-static"></div>
        <div className="spark-big-circle-3 spark-circle-right-two"></div>
        <div className="spark-big-circle-3 spark-circle-three-right"></div>
      </div>
    </section>
  )
}
