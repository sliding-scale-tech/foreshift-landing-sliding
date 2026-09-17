import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/index.css'
import App from './App.jsx'

const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
const container = document.getElementById('root')
// Production routes are prerendered at build time (scripts/prerender.mjs, which stamps
// #root[data-route]) -> hydrate that markup. Anything else (dev server, SPA fallback for legacy
// *.html / unknown URLs that redirect) -> plain client render.
if (container.dataset.route === window.location.pathname) hydrateRoot(container, app)
else {
  container.textContent = ''
  createRoot(container).render(app)
}
