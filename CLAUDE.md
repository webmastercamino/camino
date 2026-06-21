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

### 2026-06-20 — Policy & Risk Watch dashboard for board
- What changed:
  - **admin/index.html**: New "Intelligence" sidebar section with "🌍 Policy & Risk Watch" panel
    - Overview card: 5 risk tiles (US Level 2 advisory, NGO status, foreign funding risk, OFAC clear, last review age)
    - Quarterly review prompt (same 85-day cadence as grant review) + review log in localStorage
    - Tab 1 (US Government): 7 monitored sources — State Dept, US Embassy ACS, CDC Travel, USAID, OFAC, IRS Schedule F, Congress; each row has Open ↗, Log Review, editable notes
    - Tab 2 (Honduras & NGO Law): 6 sources — Congreso, La Gaceta, DGME, SRE, ONG registry, ATIC; prominent NGO Law Status card with CAMINO registration fields; Nicaragua Law 1040 precedent warning
    - Tab 3 (Regional Security): 6 civil-society sources; editable 6-department assessment grid (Cortés, Comayagua, Francisco Morazán, Atlántida, Colón, Copán) with risk level + notes saved to localStorage
    - Tab 4 (Funding & Sanctions): OFAC verify log, AML/KYC notes, Honduras foreign funding law status, IRS Schedule F threshold tracker
    - "Add to Board Agenda" button, "Generate Summary" button (print-ready 1-page policy brief)
- Status: Complete. Committed bb107da and pushed to main.
- Next steps:
  1. Fix Formspree `YOUR_FORM_ID` in contact.html (broken contact form — #1 priority)
  2. Add Mailchimp params to newsletter forms (index.html, stories.html)
  3. Replace placeholder board member names/bios/photos in about/board.html
  4. Set real WhatsApp group link in trips/jul-2026-culpeper.html
  5. Verify CAMINO ONG registration renewal status with SRE (Honduras) — due March 2026

### 2026-06-20 — Board minutes tracker + e-acknowledgement + board portal
- What changed:
  - **admin/index.html**: Full minutes management in Board Governance → Meetings tab
    - MEETINGS_SEED replaced with 3 seeded meetings (Annual Jan 15 Approved/6 acked, Regular Mar 18 Approved/5 acked, Regular Jun 10 Draft/0 acked)
    - Minutes Dashboard widget: pending-ack count, last-approved date, meetings-without-minutes count
    - Each meeting row now has minutes status badge, acknowledgement chip count, collapsible "📋 Minutes" section
    - Minutes expand: status dropdown, draft-by/date, distribution date, approval fields, acknowledgement chips with timestamps, editable textarea, Save button
    - "Generate Template" button: pre-fills structured minutes template pulling open action items from the tracker
    - Edit Meeting form extended with draftBy, draftDate, distributedDate, approvalMethod, approvalDate, minutesStatus
  - **board/index.html**: Board portal major enhancements
    - Tab renamed to "Minutes" with pending-ack badge
    - Dynamic minutes list from `camino_meetings` localStorage: each row shows status badge, distribution date, ack count
    - Expand row: full minutes text (read-only), acknowledgement chips, e-acknowledgement form (checkbox + name → saves name+timestamp to localStorage)
    - New "Action Items" tab: All/Open/Overdue/Completed filter, Mark complete per item, reads `camino_actions` localStorage
    - Documents tab: Annual COI e-acknowledgement card — policy text, checkbox confirmation, name field, signed record in localStorage
    - Board member name bar in header: enter once, reused across minutes ack + COI sign
    - Portal also calls renderBoardMinutes() and renderBoardActions() on login
  - **about/board.html**: "Board members: access the board portal →" subtle footer link
- Status: Complete. Committed 3058ecd and pushed to main.
- Next steps:
  1. Fix Formspree `YOUR_FORM_ID` in contact.html (broken contact form — #1 priority)
  2. Add Mailchimp params to newsletter forms (index.html, stories.html)
  3. Replace placeholder board member names/bios/photos in about/board.html
  4. Set real WhatsApp group link in trips/jul-2026-culpeper.html
  5. Wire `?email=` param into Mailchimp/Formspree to pre-fill public preference center

### 2026-06-20 — Grant tracker wide-net expansion + AI-assisted application generator
- What changed:
  - **admin/index.html**: 21 new grant prospects (g_12–g_32) across 6 program areas — Technology & Digital Literacy (Microsoft, HP, Best Buy, Samsung, Comcast), Language & Literacy (Barbara Bush Foundation, Dollar General, NEH, ProLiteracy), Health & Wellness (RWJF, CDC Foundation, Merck), Arts & Culture (NEA, Inter-American Foundation, Mellon), Women & Children (Kellogg, Caterpillar, Gates), Environment & Sustainability (Patagonia, REI, EPA). All notes pre-filled with "AI-Assisted Application — Low Burden (~30 min review)."
  - **admin/index.html**: `NARRATIVE_FRAMES` constant — 9 category-specific frames each with tailored problem statement, approach, theory of change, and framing notes citing World Bank/UNESCO/ITU data
  - **admin/index.html**: Document generator "Program frame" selector — auto-matches grant focus area or manual override; banner: "Apply broadly — marginal cost is ~30 minutes of review time"
  - **admin/index.html**: `buildApplicationDoc()` updated to accept `programFrame` param; narrative section now fully dynamic per category
  - **admin/index.html**: 6 new focus area options added to grant modal select
- Status: Complete. Committed 790355b and pushed to main.
- Next steps:
  1. Fix Formspree `YOUR_FORM_ID` in contact.html (broken contact form — #1 priority)
  2. Inter-American Foundation (g_25) is the highest-priority new prospect — strong Honduras focus, US government funder
  3. W.K. Kellogg Foundation (g_27) — specific Latin America program, worth researching current RFP
  4. Add Mailchimp params to newsletter forms (index.html, stories.html)
  5. Replace placeholder board member names/bios/photos in about/board.html

### 2026-06-20 — Board page grants section + admin quarterly grant review
- What changed:
  - **about/board.html**: New "Grant Funding & Transparency" section inserted between Board Governance table and 990 section — current grants table (Horizon Family Foundation $15K awarded, Cornerstone Foundation $15K active, Greater Richmond $5K closed), teal "Grant Opportunities" callout for foundations (programs list + contact CTA), "View Grant Pipeline →" link to admin with board/staff note. Old minimal Grant Transparency section removed (superseded). `.grant-opp-card` CSS added.
  - **admin/index.html**: Quarterly Grant Review system — amber banner auto-shown when last review >85 days ago or never done; "📋 Quarterly Review" tab in Grants panel with review log; modal with 15-item checklist across 4 sections (Pipeline Health, Active Grants, Relationships, Strategic Review); progress bar; "Mark Review Complete" generates copyable board-minutes summary with checked/unchecked items; review log persists to localStorage.
- Status: Complete. Committed 9c8f177 and pushed to main.
- Next steps:
  1. Fix Formspree `YOUR_FORM_ID` in contact.html (broken contact form — #1 priority)
  2. Add Mailchimp params to newsletter forms (index.html, stories.html)
  3. Replace placeholder board member names/bios/photos in about/board.html
  4. Set real WhatsApp group link in trips/jul-2026-culpeper.html
  5. Wire `?email=` param into Mailchimp/Formspree to pre-fill public preference center

### 2026-06-20 — Donor comms plan, crisis playbooks, gift log, address fields, preference center
- What changed:
  - **admin/index.html**: Communication Plan panel — 4 tabs: This Month (monthly touchpoint dashboard, "Mark contacted" per touchpoint), Cadence Plans (per-tier visual calendar with month dots), Channel Map (11-row × 4-tier physical/email/SMS matrix, Print Mailing Labels for Major donors), Preferences (per-donor channel/frequency/topic grid with Edit modal)
  - **admin/index.html**: Crisis Communications panel — 6 pre-written playbooks (🔴 Data Breach, 🔴 Cyber Incident, 🟠 Leadership Crisis, 🟠 Financial Crisis, 🟡 In-Field Emergency, 🟡 Natural Disaster). Each has 3–4 audience-targeted templates (board, donor-facing, compliance checklist, etc.) with copy/download. Activate button → crisis log entry + red banner. "Run Crisis Drill" mode. Resolve button.
  - **admin/index.html**: Per-donor additions in detail view — mailing address (inline edit form, saves to localStorage), comms preferences summary (links to edit modal), gift log (in-kind, stock, planned, matching — date, description, estimated value, notes), communication history (log entry per touchpoint, "Mark contacted" feeds this log)
  - **admin/index.html**: 3 new modals — Comms Preferences (channels × 5, frequency × 3, topics × 6, opt-out), Gift Log entry, Log Communication (type, date, notes)
  - **admin/index.html**: "Log communication" button in donor detail now opens real modal instead of stub toast
  - **communications/preferences.html**: Public self-service preference center — email lookup, channel toggles, frequency tiers, topic checkboxes, CAN-SPAM unsubscribe, URL param pre-fill (`?email=...`)
- Status: Complete. Committed 0ac272e and pushed to main.
- Next steps:
  1. Fix Formspree `YOUR_FORM_ID` in contact.html (broken contact form — #1 priority)
  2. Add Mailchimp params to newsletter forms (index.html, stories.html)
  3. Replace placeholder board member names/bios/photos in about/board.html
  4. Set real WhatsApp group link in trips/jul-2026-culpeper.html
  5. Wire `?email=` param into Mailchimp/Formspree to pre-fill public preference center

### 2026-06-20 — Grant Management: dual-jurisdiction, Future status, org profile extensions
- What changed:
  - **admin/index.html — Compliance dates**: Added Schedule F (Form 990 foreign activities), FBAR (FinCEN 114), Honduras ONG registration as dated entries in the compliance calendar
  - **admin/index.html — Grant modal**: Added "Vocational Development" to focus area options; added "Future" to status options (enables g_7–g_11 vocational/long-term seed grants)
  - **admin/index.html — DEFAULT_ORG_PROFILE**: Added `usLegalAddress`, `hondurasAddress`, `emergingPrograms` array (vocational training pilot with honest stage framing)
  - **admin/index.html — Org Profile form**: Dual-jurisdiction badge ("US-incorporated nonprofit operating internationally"), US + Honduras address fields, yellow info banner with template language, new "Emerging Opportunities" section (dashed-purple cards, caution note: "Do not list as active programs in grant applications")
  - **admin/index.html — saveOrgProfile / populateOrgProfileForm**: Wired new address fields + emerging-programs renderer
  - **admin/index.html — buildApplicationDoc**: Cover letter and org overview updated with dual-jurisdiction framing; grant funds explicitly noted as "received and stewarded by US 501(c)(3) entity"
- Status: Complete. Committed 1231804 and pushed to main.
- Next steps:
  1. Fix Formspree `YOUR_FORM_ID` in contact.html (broken contact form — #1 priority)
  2. Fill in real US legal address and Honduras operational address in org profile
  3. Replace `[Member]` placeholders in board governance table (about/board.html)
  4. Add Mailchimp params to newsletter forms (index.html, stories.html)
  5. Set real WhatsApp group link in trips/jul-2026-culpeper.html

### 2026-06-20 — Donor CRM priority flagging (complete)
- What changed:
  - **admin/index.html**: Full priority donor flagging system in Donor CRM panel
    - 5 tiers: 🔴 Major (lifetime $10k+ OR single gift $2.5k+), 🟠 Key (lifetime $2.5k–$9.9k OR monthly recurring), 🟡 Active (gave last 12mo, lifetime $500+), ⚪ Lapsed (last gift >18mo), ⭐ VIP (manually flagged)
    - Priority Donors widget at top of CRM with tier counts (clickable → filter), overdue follow-up alert bar
    - "Priority donors only" toggle + tier filter dropdown in search row (including "overdue" pseudo-tier)
    - Priority column in donor table with color-coded badges; VIP star (☆/⭐) toggle per row
    - Follow-up column with per-donor reminder buttons (OVERDUE highlighted in red)
    - Follow-up modal (schedule date + notes, clear button, saves to localStorage)
    - Donor detail: priority badge header, Next Step / follow-up box, Moves Management section for Major/VIP (touchpoint timeline with call/email/meeting/visit, log form)
    - Updated seed data: Kincaid → Major ($5k single gift), Beaumont → Major ($11.5k lifetime), Hartley → VIP (seeded), Whitfield/Chen → Key (monthly recurring), Holloway → Key ($3k lifetime), Reyes/Osei → Active, Templeton/Fontaine → Lapsed
- Status: Complete. All code committed and pushed.
- Next steps:
  1. Fix Formspree `YOUR_FORM_ID` in contact.html (broken contact form — #1 priority)
  2. Add Mailchimp params to newsletter forms (index.html, stories.html)
  3. Replace placeholder board member names/bios/photos with real data in about/board.html
  4. Set real WhatsApp group link in trips/jul-2026-culpeper.html

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
