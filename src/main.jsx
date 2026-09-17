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
// Production routes are prerendered at build time (scripts/prerender.mjs) -> hydrate that markup.
// The dev server serves an empty #root -> plain client render.
if (container.firstElementChild) hydrateRoot(container, app)
else createRoot(container).render(app)
