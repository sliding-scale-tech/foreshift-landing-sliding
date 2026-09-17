import { Link } from 'react-router-dom'
import { CONTACT_LINKS, EXTERNAL, LEGAL_LINKS, LOGOS, ROUTES } from '../config/site'
import { NavLink } from './Navbar'

/** ForeShift footer used on home + legal pages. */
export default function Footer({ quickLinks, currentPath }) {
  return (
    <section className="footer">
      <div className="footer-wrapper-2">
        <div className="footer-columns">
          <a href="#" className="w-inline-block">
            <img
              sizes="(max-width: 1343px) 100vw, 1343px"
              srcSet={LOGOS.foreshiftFooter.srcSet}
              alt=""
              loading="lazy"
              src={LOGOS.foreshiftFooter.src}
              className="foot-logo"
            />
          </a>
        </div>
        <div className="foot-column-links">
          <h4 className="foot-header">Quick Links</h4>
          <div className="foot-link-wrapper">
            {quickLinks.map((link) => (
              <NavLink key={link.label} {...link} className="foot-link" />
            ))}
          </div>
        </div>
        <div className="foot-column-links">
          <h4 className="foot-header">Legal</h4>
          <div className="foot-link-wrapper">
            {LEGAL_LINKS.map((link) => (
              <NavLink key={link.to} {...link} current={link.to === currentPath} className="foot-link" />
            ))}
          </div>
        </div>
        <div className="foot-column-links">
          <h4 className="foot-header">Get In Touch</h4>
          <div className="foot-link-wrapper">
            {CONTACT_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="foot-link">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="footer-copyright">
        <div className="copyright">
          <p className="foot-text">Developed by </p>
          <a target="_blank" href={EXTERNAL.developer} className="foot-link">
            <strong>Sliding Scale Technologies</strong>
          </a>
        </div>
      </div>
    </section>
  )
}

/** Legacy Sawda dark footer used on the About Us page. */
export function FooterDark() {
  return (
    <section className="footer-dark">
      <div className="container-2">
        <div className="footer-wrapper">
          <Link to={ROUTES.home} className="footer-brand w-inline-block">
            <img
              src={LOGOS.sawda.src}
              loading="lazy"
              width="130"
              sizes="(max-width: 479px) 100vw, 130px"
              alt=""
              srcSet={LOGOS.sawda.srcSet}
              className="image-2"
            />
          </Link>
          <div className="footer-content">
            <div id="w-node-_18c61c57-19d4-f390-4c6c-3878260a11f8-f72d8721" className="footer-block">
              <div className="title-small">About</div>
              <Link to={ROUTES.terms} className="footer-link">Terms &amp; Conditions</Link>
              <Link to={ROUTES.privacy} className="footer-link">Privacy policy</Link>
            </div>
            <div id="w-node-_5217f310-062c-a123-8d2f-ac4e8960ee52-f72d8721" className="footer-block">
              <div className="title-small">Quick Links</div>
              <Link to={ROUTES.home} className="footer-link">Home</Link>
              <Link to={ROUTES.about} aria-current="page" className="footer-link w--current">About Us</Link>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-divider"></div>
      <div className="footer-copyright-center">Copyright © 2025 Sawda.AI</div>
    </section>
  )
}
