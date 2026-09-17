import { LegalLayout } from './Layouts'

/**
 * Shared template for all legal pages (terms, privacy, refunds, eligibility).
 * Markup mirrors the Webflow export exactly; pages only supply content.
 *  - page:     ROUTES key ('terms' | 'privacy' | 'refunds' | 'eligibility')
 *  - title:    hero <h2> contents (JSX, incl. the highlighted <span>)
 *  - subtitle: optional hero paragraph contents (JSX)
 *  - children: body content rendered inside .spark-900-width
 */
export default function LegalPage({ page, title, subtitle, children }) {
  return (
    <LegalLayout page={page}>
      <section id="Industries" data-w-id="08841908-0534-32e0-30a5-46184b92203f" className="spark-section-5 spark-overflow-hidden">
        <div className="spark-container-5 spark-centered-content w-container">
          <h2>{title}</h2>
          {subtitle && <p className="spark-hero-sub-paragraph-2">{subtitle}</p>}
        </div>
        <div className="spark-hold-circles">
          <div className="spark-big-circle"></div>
          <div className="spark-big-circle spark-circle-two"></div>
          <div className="spark-big-circle spark-circle-three"></div>
        </div>
        <div className="spark-hold-circles spark-right-side">
          <div className="spark-big-circle spark-circle-static"></div>
          <div className="spark-big-circle spark-circle-right-two"></div>
          <div className="spark-big-circle spark-circle-three-right"></div>
        </div>
      </section>
      <div className="spark-section-6">
        <div className="spark-container-6 w-container">
          <div className="spark-900-width spark-margin-bottom-104px">{children}</div>
        </div>
      </div>
    </LegalLayout>
  )
}
