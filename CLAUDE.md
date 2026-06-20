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
