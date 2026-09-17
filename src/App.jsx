import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from './config/site'
import Home from './pages/Home'
import ScrollManager from './components/ScrollManager'
import Interactions from './animations/Interactions'

const About = lazy(() => import('./pages/About'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Refunds = lazy(() => import('./pages/Refunds'))
const Eligibility = lazy(() => import('./pages/Eligibility'))

// Legacy Webflow URLs (e.g. /about-us.html) redirect to clean routes.
const legacy = Object.values(ROUTES).filter((r) => r !== '/')

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path={ROUTES.home} element={<Home />} />
        <Route path={ROUTES.about} element={<About />} />
        <Route path={ROUTES.terms} element={<Terms />} />
        <Route path={ROUTES.privacy} element={<Privacy />} />
        <Route path={ROUTES.refunds} element={<Refunds />} />
        <Route path={ROUTES.eligibility} element={<Eligibility />} />
        <Route path="/index.html" element={<Navigate to={ROUTES.home} replace />} />
        {legacy.map((r) => (
          <Route key={r} path={`${r}.html`} element={<Navigate to={r} replace />} />
        ))}
        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>
      {/* Inside the Suspense boundary, after the routes: on prerendered pages (scripts/prerender.mjs)
          these effects mutate the DOM, so they must run only once the route markup has hydrated. */}
      <ScrollManager />
      <Interactions />
    </Suspense>
  )
}
