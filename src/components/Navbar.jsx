import { Link } from 'react-router-dom'
import { EXTERNAL, LOGOS, ROUTES } from '../config/site'

/**
 * Shared Webflow `w-nav` navbar. Markup mirrors the Webflow export 1:1 so the
 * global stylesheet applies unchanged. Mobile menu behaviour lives in
 * src/animations (owned by the interactions layer), keyed off these classes.
 *
 * links: [{ label, href?, to?, current? }]
 */
export default function Navbar({
  logo = LOGOS.foreshiftDark,
  // Export used '(max-width: 479px) 100vw, 124px' on Home/About (the legal pages already use '124px').
  // The logo renders ~124-133 CSS px wide at every width, so 100vw made phones download the 800w-1343w
  // PNG (up to 169 KB). '124px' picks the same 500w file at DPR 1 (pixel-identical there).
  logoSizes = '124px',
  logoCurrent = false,
  links = [],
  showLogin = false,
  logoLabel,
}) {
  return (
    <div
      data-collapse="medium"
      data-animation="default"
      data-duration="400"
      data-easing="ease"
      data-easing2="ease"
      role="banner"
      className="f-navigation w-nav"
    >
      <div className="f-navigation-container">
        <Link
          to={ROUTES.home}
          aria-current={logoCurrent ? 'page' : undefined}
          aria-label={logoLabel}
          className={`f-navigation-logo-link w-inline-block${logoCurrent ? ' w--current' : ''}`}
        >
          <img
            src={logo.src}
            loading="lazy"
            width="124"
            sizes={logoSizes}
            alt=""
            srcSet={logo.srcSet}
            className="f-logo"
          />
        </Link>
        <nav role="navigation" className="f-navigation-menu w-nav-menu">
          {links.map((link) => (
            <NavLink key={link.label} {...link} className="f-navigation-link w-nav-link" />
          ))}
        </nav>
        <div className="f-navigation-content">
          {showLogin && (
            <a href={EXTERNAL.login} target="_blank" className="f-navigation-link w-nav-link">
              Login
            </a>
          )}
          <div className="f-navigation-menu-button w-nav-button">
            <div className="w-icon-nav-menu"></div>
          </div>
          <a href={EXTERNAL.signup} target="_blank" className="f-navigation-button w-inline-block">
            <div className="text-block">Get Started</div>
          </a>
        </div>
      </div>
    </div>
  )
}

export function NavLink({ label, href, to, current, className, children }) {
  const cls = `${className}${current ? ' w--current' : ''}`
  const aria = current ? 'page' : undefined
  if (to) {
    return (
      <Link to={to} aria-current={aria} className={cls}>
        {children ?? label}
      </Link>
    )
  }
  return (
    <a href={href} aria-current={aria} className={cls}>
      {children ?? label}
    </a>
  )
}
