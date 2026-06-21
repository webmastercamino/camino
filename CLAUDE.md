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

### 2026-06-20 — Grant tracker + application/report generator + org profile
- What changed:
  - **admin/index.html**: Full Grant Management panel — KPI dashboard (awarded YTD, pending, reports due, pipeline, success rate), pipeline view with 7-status filter tabs, 6 seeded grants (Horizon Family Foundation $15k awarded, UMGM $8.5k submitted, Community First Bank $5k in-progress, VA Conference UMC researching, Google.org researching, LocalCorp declined), grant cards with all metadata and action buttons, Add/Edit/Delete modal (15+ fields), 90-day deadline calendar with red/yellow/green urgency, Org Profile sub-tab (editable legal identity, mission/vision, impact stats, 4 programs, boilerplate), Document Generator modal (Application: full/cover/narrative/budget or Progress/Final Report), Copy + Download .txt
  - **about/board.html**: Grant Transparency section above CTA — table showing funders, amounts, purposes, status; seeded with 2 real-ish grants + 1 placeholder row; links to 990 and GuideStar
- Status: Complete. Committed a764548 and pushed to main.
- Next steps:
  1. Replace `[Member]` placeholder names in board governance table with real board member names
  2. Fix Formspree `YOUR_FORM_ID` in contact.html (broken contact form — #1 priority)
  3. Add Mailchimp params to newsletter forms (index.html, stories.html)
  4. Replace placeholder board photos/LinkedIn links in about/board.html
  5. Set real WhatsApp group link in trips/jul-2026-culpeper.html
  6. Replace placeholder grant transparency row on board.html with real grant history

### 2026-06-20 — Full platform build: public site, admin ops suite, Cloudflare backend, docs
- What changed:
  - **Full site ADA/WCAG 2.1 AA audit** (style.css, main.js, all pages): skip-link, focus-visible, aria-expanded/controls on nav, ARIA tablist + roving tabindex, flip-card + gallery keyboard support, lightbox focus trap, label/for associations on all forms, newsletter aria-labels
  - **admin/index.html** — complete ops suite built across multiple sessions:
    - Social Calendar: monthly view, add/edit/delete, 78 pre-seeded posts (religious, giving, Honduran cultural, mission), list view
    - Mission Trips Manager: trip records, participant counts, WhatsApp link, hidden URL management
    - Donor CRM: contact records, giving history, priority tiers (Major/Key/Active/VIP/Lapsed), moves management, comms preferences
    - Communication Plan: tier-based cadence map, physical mail vs email vs SMS matrix, donor preference center
    - Grant Tracker: full pipeline (Researching → Awarded → Reporting), 6 seeded grants, deadline calendar
    - Grant Application Generator: cover letter, org narrative, program narrative, budget narrative from org profile
    - Board Governance panel: Health Dashboard (6-tile scorecard), Meetings log + form, Action Items tracker with overdue summary, Governance Docs checklist (12 items), Financial Snapshot
    - 501(c)(3) Compliance panel: 990 & Filings tracker, State Registrations (VA/MD/DC), IRS Checklist (11 items), Key Dates Dashboard
    - Travel Documents: per-person arrays for Walker (US expat), Seiny (HN citizen), Alena (dual citizen, EXPIRING SOON), Williams (infant, CRBA pending) — passports, visas, residencia, US↔HN clearance indicators
    - Children's Investment Accounts: Alena UTMA + 529, Williams UTMA; last-4 reference only
    - Crisis Communications Playbook: 6 crisis types (data breach, cyber, leadership, financial, in-field emergency, natural disaster), drill mode
    - Org Profile: mission, programs, impact stats, dual-jurisdiction US 501(c)(3) + Honduras ONG
  - **about/board.html**: Board of Directors public page (6-member grid, staff section, Join the Board CTA, 990/GuideStar section); CSS org chart; Board Seats & Terms governance table with term/election badges; citizenship-aware staff bios
  - **give.html**: Stripe donation form stub — frequency toggle, amount presets, Stripe Elements placeholder, thank-you card
  - **cloudflare/**: Full D1 schema (9 tables), wrangler.toml, donate.js Worker (Stripe PaymentIntent/SetupIntent), send-receipt.js Worker (branded HTML tax receipt via Resend), cloudflare/README.md architecture doc
  - **trips/jul-2026-culpeper.html**: 8-tab sticky restructure; STEP + CBP One pre-trip cards; WhatsApp group QR code (qrcodejs); full ARIA tablist; gallery keyboard + focus trap
  - **roadmap.html**: Site scorecard, Top 15 priority gaps, 3-phase plan, revenue table, tool stack, print/PDF bar
  - **about/board.html + admin**: private board portal, ROI brief, impact.html with map + annual report
  - **docs/PLATFORM_OVERVIEW.md**: Executive brief on platform capabilities, architecture, cost comparison, integration roadmap — written for board/donors/tech partners
  - **docs/QUICK_START.md**: Admin panel how-to guide for Walker and Seiny
- Status: Complete. All committed and pushed to main.
- Next steps:
  1. Fix Formspree `YOUR_FORM_ID` in contact.html (broken contact form — #1 priority)
  2. Fill in Mailchimp u= and id= in index.html + stories.html newsletter forms
  3. Enable Cloudflare Access on /admin/ before entering real data (15 min, free)
  4. Set real WhatsApp group link in trips/jul-2026-culpeper.html
  5. Replace placeholder board member names/bios/photos in about/board.html

### 2026-06-20 — Citizenship-aware travel docs, investment accounts, board governance + compliance panels
- What changed:
  - **admin/index.html**: Complete overhaul of Travel Documents panel
    - Per-person document arrays replacing flat passport fields: Walker (US expat — US passport + HN residencia), Seiny (HN citizen — HN passport + US B1/B2 visa), Alena (dual citizen — 2 passports, 5-yr US child passport EXPIRING SOON), Williams (infant — CRBA In Progress, US passport Not Yet Applied, HN docs)
    - US↔HN travel clearance indicators per person (✅ Clear / ⚠️ Pending)
    - New Investment Accounts sub-tab: Alena UTMA + 529, Williams UTMA; amber security warning; last-4 ref only
    - New **Board Governance** panel (sidebar: 🏛️ Board Governance): tabs for Health Dashboard (6-tile scorecard), Meetings log + log-new form, Action Items tracker with overdue summary, Governance Docs checklist (12 items), Financial Snapshot with edit form
    - New **501(c)(3) Compliance** panel (sidebar: ⚖️ 501(c)(3) Compliance): tabs for 990 & Filings (last 3 years), State Registrations (VA/MD/DC), IRS Compliance Checklist (11 items), Key Dates Dashboard, Grant Tracking
    - CSS: panel-tab-btn + td/bg/cp-tab-pane visibility, ht-good/ht-bad/ht-warn/ht-val/ht-label tile variants, fin-val
  - **about/board.html**: Walker staff bio updated ("US citizen, based full-time in Honduras"); Seiny bio updated ("Co-founder and Honduran citizen")
- Status: Complete. Committed 2486a83 and pushed to main.
- Next steps:
  1. Fix Formspree `YOUR_FORM_ID` in contact.html (broken contact form — #1 priority)
  2. Fill in Mailchimp u= and id= in index.html + stories.html newsletter forms
  3. Replace placeholder board member names/bios/photos in about/board.html
  4. Set real WhatsApp group link in trips/jul-2026-culpeper.html
  5. Phase 2: prayer.html, transparency.html, partnerships.html, volunteer.html

### 2026-06-20 — Travel docs tracker + board org chart with election tracking
- What changed:
  - **admin/index.html**: New "Travel Docs" panel — 4 Somerville family members with color-coded passport expiry badges (EXPIRING SOON/WATCH/VALID), last-4 reference field, Honduras entry notes, residency status, inline edit form (saves to localStorage), Remind Me flag stub, summary alert bar, amber security warning. Seed data as JS constants; localStorage overrides on edit.
  - **about/board.html**: CSS org chart below board grid (Board → Executive Director → 3 staff, connecting lines, teal/amber colors, stacks on mobile). New "Board Seats & Terms" section — 8-row governance table with term dates and badges (Founder seat / Current / Up for re-election / Open seat needed).
- Status: Complete. Committed f0c53ed and pushed to main.
- Next steps:
  1. Replace `[Member]` placeholder names in board governance table with real board member names
  2. Fix Formspree `YOUR_FORM_ID` in contact.html (broken contact form — #1 priority)
  3. Add Mailchimp params to newsletter forms (index.html, stories.html)
  4. Replace placeholder board photos/LinkedIn links in about/board.html
  5. Set real WhatsApp group link in trips/jul-2026-culpeper.html

### 2026-06-20 — Cloudflare backend architecture + Donor CRM + Stripe donation form
- What changed:
  - **cloudflare/README.md**: Full architecture doc — Cloudflare Pages, Workers, D1, KV, R2, Access, Queues; data flow diagrams, deploy instructions, env var table
  - **cloudflare/schema.sql**: Complete D1 schema — 9 tables (contacts, donations, recurring_giving, trips, trip_participants, churches, communications, board_members, grants, audit_log); indexes; seed INSERT for 4 trips
  - **cloudflare/wrangler.toml**: Full Workers config — D1 binding, 3 KV namespaces, 3 R2 buckets, 3 Queue producers + 2 consumers, routes, env vars
  - **cloudflare/workers/donate.js**: Stripe Worker stub — validates request, upserts D1 contact, creates PaymentIntent (or SetupIntent for recurring), inserts pending donation, returns clientSecret; queue consumer for receipt processing
  - **cloudflare/workers/send-receipt.js**: Resend receipt Worker — fetches D1 donor + donation, renders full branded HTML tax receipt (IRS language, EIN, gift summary), POSTs to Resend API, marks receipt_sent in D1, logs communication
  - **give.html**: New donation form section above existing give-cards — frequency toggle (one-time/monthly/quarterly), amount presets ($25–$500) + custom, designation dropdown, donor info fields, Stripe Elements placeholder, submit simulation with spinner, thank-you card with fake confirmation number
  - **admin/index.html**: Full Donor CRM panel — 5 KPI metrics (total donors, YTD raised, avg gift, recurring, new this month), donor table with search/type/recurring filters, expandable donor detail panel (contact info, giving summary, gift history, trips, notes, action buttons), Partner Churches tab; 10 seeded donors + 5 seeded churches with realistic data; Add Donor + Add Church modals
- Status: Complete. All POC — localStorage for donor data, Cloudflare Workers are stubs showing full production shape.
- Next steps:
  1. Fix Formspree `YOUR_FORM_ID` in contact.html (broken contact form — #1 priority)
  2. Add Mailchimp params to newsletter forms (index.html, stories.html)
  3. Wire real Stripe keys into donate.js Worker and deploy to Cloudflare
  4. Replace `[Member]` placeholders in about/board.html governance table
  5. Set real WhatsApp group link in trips/jul-2026-culpeper.html

<!-- Most recent session at the top. Format:
### [DATE] — [brief title]
- What changed: ...
- Status: ...
- Next steps: ...
-->

### 2026-06-20 — Board of Directors & leadership page
- What changed:
  - **about/board.html**: New public page — hero, 6-member Board of Directors grid (teal avatar placeholders, name/role/bio/LinkedIn), 4-person Staff/Leadership section, Join the Board CTA, 990/GuideStar transparency section; full ADA compliance (skip-link, aria-labels, tabindex on cards, focus-visible)
  - **9 public pages** (index, about, programs, trips, stories, contact, give, impact, roadmap): About nav link converted to `nav-has-drop` dropdown with "Our Board" sub-item; mobile menu gains indented "↳ Our Board" sub-link
- Status: Complete. Committed b451ef0 and pushed to main.
- Next steps:
  1. Replace placeholder board member names/bios/photos with real data
  2. Replace `#` LinkedIn links with real profile URLs
  3. Replace `#` 990/GuideStar links once documents are uploaded
  4. Fix Formspree `YOUR_FORM_ID` in contact.html (broken contact form — #1 priority)
  5. Add Mailchimp params to newsletter forms (index.html, stories.html)

### 2026-06-20 — Roadmap executive brief + nav link on all 19 pages
- What changed:
  - **roadmap.html**: New page — site scorecard (6 categories A–C), Top 15 priority gaps, 3-phase plan (Phase 1 Fix It / Phase 2 Build It / Phase 3 Scale It), revenue table, strategic leverage section, tool stack, print/PDF bar
  - **sitemap.xml**: Added roadmap.html entry; **robots.txt** committed (was untracked)
  - **All 19 public pages**: Added Roadmap link in desktop nav + mobile menu
- Status: Complete. Committed b63af42 and pushed to main.
- Deadline: User wants site fully vetted by Thanksgiving 2026 (Nov 27) to hit holiday giving season.
- Next steps:
  1. Fix Formspree `YOUR_FORM_ID` in contact.html (broken contact form — #1 priority)
  2. Fill in Mailchimp u= and id= in index.html + stories.html newsletter forms
  3. Add Store to main nav on all pages (currently hidden)
  4. Create privacy.html (fix dead `#` footer links)
  5. Phase 2: prayer.html, transparency.html, partnerships.html (corporate/church), volunteer.html

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
