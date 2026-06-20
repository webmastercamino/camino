# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static website for CAMINO Honduras (Central American Ministry Outreach) — a faith-based nonprofit building homes and developing communities in Honduras. Deployed via GitHub Pages.

## Deploy

No build step. Push to `main` and GitHub Pages deploys automatically:

```powershell
git add .
git commit -m "message"
git push origin main
```

## Architecture

Single-repo static site (HTML/CSS/JS). No framework, no bundler, no package manager unless added later. Structure will follow a flat GitHub Pages convention:

- `index.html` — homepage
- `about.html`, `programs.html`, `trips.html`, `give.html` — inner pages
- `assets/css/` — stylesheets
- `assets/js/` — scripts
- `assets/images/` — imagery

## Design direction

Warm amber/earth tones with teal accents. Brand color: `#BA7517` (amber). See the homepage mockup established in the initial design session for layout reference (hero, stats bar, programs, trips calendar, giving CTA, footer).

## Organization context

- **Mission**: Housing-first community development in Honduras
- **Key programs**: Home construction ($5,500/home), community infrastructure, church planting, mission trips (4–25 people, week-long)
- **Primary site**: [caminohonduras.com](https://www.caminohonduras.com/) — this repo is a redesign

## Session Log

<!-- Most recent session at the top. Format:
### [DATE] — [brief title]
- What changed: ...
- Status: ...
- Next steps: ...
-->

### 2026-06-20 — WCAG 2.1 AA accessibility pass + WhatsApp group chat feature
- What changed:
  - **style.css**: Skip-link class (fixed, focus-reveals), global `:focus-visible` styles, nav dropdown `:focus-within` for keyboard access
  - **main.js**: `aria-expanded`/`aria-controls` on mobile nav toggle; ARIA-aware tab switching with `aria-selected` + arrow-key navigation; flip card keyboard handler (Enter/Space); gallery keyboard handler + lightbox focus return + focus trap
  - **All 9 root pages + trip portal + admin**: Skip-to-main link, `id="main"` target, `aria-expanded="false" aria-controls="mobileMenu"` on nav toggle
  - **contact.html**: All 5 form inputs now have `id` attributes; all labels have matching `for` attributes
  - **index.html + stories.html**: Newsletter email input `aria-label` added
  - **trips/jul-2026-culpeper.html**: Full ARIA tablist (role, aria-selected, aria-controls, tabindex roving); tab bar inactive text contrast .72→.90; checklist `<span>`→`<label for="pack-X">` (21 items); flip cards tabindex=0 + keyboard; gallery tabindex=0 + keyboard + lightbox focus return + focus trap; WhatsApp group chat card in Logistics tab (qrcodejs QR code, placeholder detection, staff note fallback)
  - **admin/index.html**: Skip link + `:focus-visible`; trip modal `for`/`id` label associations on all fields; new WhatsApp Group Link field saved to localStorage
- Status: Complete. Committed 1770b25 and pushed to main (live on GitHub Pages).
- Next steps:
  1. Set real WhatsApp group link: change `data-whatsapp` on `#whatsappCard` in `trips/jul-2026-culpeper.html`
  2. Replace placeholder gallery photos in `assets/images/trips/culpeper-jul-2026/`
  3. Add Mailchimp `u=` and `id=` params to newsletter forms (index.html, stories.html)
  4. Replace `YOUR_FORM_ID` in contact.html with actual Formspree form ID

### 2026-06-20 — Full site audit fixes + admin panel POC
- What changed:
  - **Nav (all 8 pages)**: Removed duplicate "↗ Sample Mission" entry from both desktop dropdown and mobile menu — was pointing to the same URL as "Culpeper group trip portal"
  - **contact.html**: Added `action="https://formspree.io/f/YOUR_FORM_ID"` — replace YOUR_FORM_ID after creating form at formspree.io
  - **assets/js/main.js**: Contact form now uses `fetch()` to POST to Formspree and shows real success/error state
  - **about.html**: Added volunteer interest CTA section (teal callout, links to trips + contact)
  - **programs.html**: Added "come see it firsthand" volunteer CTA section
  - **data/trips.json**: Created with all 5 trips (culpeper-jul-2026 + the 4 open enrollment trips)
  - **admin/index.html**: Created full admin panel POC — Social Calendar (monthly view, add/edit/delete posts, day detail, list view), Mission Trips (loads data/trips.json, participant count tracker, edit/add/delete, copy URL), Pages (quick links + per-page notes), Donations (Give Lively stub + UTM link generator). All data stored in localStorage.
  - **index.html**: Added `<!-- Admin: /admin/ -->` developer comment
- Status: Complete. All changes committed and pushed.
- Next steps:
  1. Replace `YOUR_FORM_ID` in contact.html with actual Formspree form ID
  2. Replace placeholder gallery photos in `assets/images/trips/culpeper-jul-2026/`
  3. Wire Give Lively webhook to Cloudflare Worker → admin donations panel
  4. Add Mailchimp `u=` and `id=` params to newsletter forms (index.html, stories.html)

### 2026-06-20 — Add "Before You Go" callout to Logistics tab
- What changed: `trips/jul-2026-culpeper.html` — added `.byg-card` CSS + "Before You Go" callout card near top of Logistics tab with STEP registration (step.state.gov link) and CBP One app (App Store + Google Play links) action items
- Status: Complete. Committed and pushed to main (live on GitHub Pages).
- Next steps: Replace placeholder gallery photos with real trip photos in `assets/images/trips/culpeper-jul-2026/`
