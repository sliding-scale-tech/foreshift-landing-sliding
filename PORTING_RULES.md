# ForeShift React Port — Team Rules (set by the lead designer; non-negotiable)

Goal: the React app must be **visually and behaviourally identical** to the Webflow export in
`reference/original/` — every page, every breakpoint (1440 / 991 / 767 / 479), every animation — and hit Lighthouse Performance 100.

## Sources of truth
- `reference/original/*.html` — raw Webflow export (markup, classes, data-w-id, data-wf-target).
- `reference/rendered/<page>.html` — the ORIGINAL page DOM *after* webflow.js ran (sliders, nav state). Use to understand runtime DOM.
- `reference/original/js/webflow.js` — contains IX2 + IX3 interaction definitions (tail of the file, from `Webflow.require("ix3")`). Extracted copy: see interactions brief.
- `src/styles/site.css` — exported site CSS, **includes the design tokens in `:root`** (--sawda-blue, --fore-dark, …).

## Styling (STRICT)
1. All styling comes from GLOBAL stylesheets imported by `src/styles/index.css`. Reuse the Webflow class names verbatim (`className`).
2. Do NOT edit `normalize.css`, `webflow.css`, `site.css`.
3. No inline `style={{}}` for design. No CSS modules, no styled-components, no Tailwind, no hardcoded colors/sizes in JSX.
4. If the export has a non-animation inline style or an embedded `<style>` (w-embed), move it into your page's global sheet
   (`src/styles/pages/home.css | about.css | legal.css`) as a class, using `:root` tokens wherever a token matches the value.
5. Webflow's *animation* inline initial states (`style="opacity:0;transform:translate3d(...)"` on `data-w-id` elements) must NOT be
   copied into JSX — the interactions engine (src/animations) owns those.

## Markup (STRICT)
- Port markup 1:1: same element types, same nesting, same classes, same ids (incl. `w-node-…` ids — grid CSS targets them), same text, same `srcset`/`sizes`/`loading`/`width`/`alt`.
- KEEP `data-w-id="…"` and `data-wf-target="…"` attributes exactly (engine hooks). In JSX `data-wf-target` is a plain string of the decoded JSON, e.g. `data-wf-target='[[["6aa9…","0b24…"],[]]]'`.
- Image paths: `images/x.png` → `/images/x.png` (served from `public/`).
- Internal page links → `<Link to={ROUTES.x}>` from `src/config/site.js`. Shared content (logos, nav links, contact, external URLs) lives in `src/config/site.js` — import, never duplicate.
- Chrome (Navbar/Footer) is SHARED: `src/components/Layouts.jsx` (HomeLayout, AboutLayout, LegalLayout), `Navbar.jsx`, `Footer.jsx`, `LegalPage.jsx`.
  Page agents must NOT edit shared components; if a change is needed, report it to the lead.
- Repeated blocks within a page → small components/arrays in `src/components/<page>/` rather than copy-paste, as long as output DOM is identical.
- Forms: keep Webflow form markup/classes; implement submit UX (success/fail message toggling like Webflow's `w-form-done`/`w-form-fail`) without jQuery.

## File ownership (avoid collisions — only touch your files)
| Agent | Owns |
|---|---|
| Home | `src/pages/Home.jsx`, `src/components/home/**`, `src/styles/pages/home.css` |
| About | `src/pages/About.jsx`, `src/components/about/**`, `src/styles/pages/about.css` |
| Terms / Privacy / Refunds / Eligibility | `src/pages/<Name>.jsx` only (legal.css shared: coordinate via lead; prefer no additions) |
| Interactions | `src/animations/**`, `src/styles/interactions.css` |
| Performance (phase 2) | build config, `index.html`, image/font pipeline, `scripts/lighthouse.mjs` |
| Lead | everything shared: config, layouts, Navbar, Footer, App, index.css |

## Servers (already running — do NOT start/stop them, do NOT run `vite build` during phase 1)
- Original export: http://localhost:5500  (e.g. /index.html, /about-us.html)
- React dev server: http://localhost:5173
- Parity check: `REACT_BASE=http://localhost:5173 node scripts/parity.mjs <pageKey> [--widths=1440,991,767,479]`
  → writes `parity/<page>/<width>/{original,react,diff}.png`. Page keys: home about terms privacy refunds eligibility.
  Inspect the PNGs (Read tool) — heights must match and diff must be ~0 (only animation-in-flight noise is tolerable, and must be explained).
- Other agents are editing in parallel; transient HMR errors from files you don't own are not yours to fix — report them.

## Definition of done (report back with evidence)
- Parity at all 4 widths: heights equal, diff pixels listed per width, remaining diffs explained.
- No console errors/warnings from your code in the dev server.
- `npx oxlint src/<your files>` clean.
