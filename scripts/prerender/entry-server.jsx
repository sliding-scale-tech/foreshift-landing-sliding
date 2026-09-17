// SSR entry used ONLY at build time by scripts/prerender.mjs (never shipped to the browser).
// Renders the exact same <App /> tree main.jsx renders on the client, for a given URL, so the
// client can hydrateRoot() the static markup without a mismatch.
import { StrictMode } from 'react'
import { prerender } from 'react-dom/static'
import { StaticRouter } from 'react-router-dom'
import App from '../../src/App.jsx'

export async function render(url) {
  const { prelude } = await prerender(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
  const reader = prelude.getReader()
  const chunks = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8')
}
