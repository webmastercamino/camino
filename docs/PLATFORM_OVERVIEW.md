# CAMINO Honduras — Platform Overview

*For board members, major donors, and technology partners. Last updated: June 2026.*

---

## Executive Summary

CAMINO Honduras has built an integrated digital platform that combines a public-facing nonprofit website with a private board operations system — replacing tools like Kindful ($150/month), separate board portals, crisis communications software, and grant-tracking spreadsheets with a custom solution built on modern web infrastructure at near-zero cost. The entire platform is live on GitHub Pages today, with a production-grade Cloudflare backend already architected and ready to activate. Estimated annual savings versus equivalent SaaS subscriptions: **$3,700–4,000/year** — redirected to Honduras programs.

---

## What This Solves

| Before | After |
|---|---|
| Scattered donor spreadsheets | Unified Donor CRM with priority tiers and giving history |
| Kindful subscription ($150/month) | Built-in CRM + Stripe donation processing |
| No crisis communications plan | Pre-written playbooks for 6 crisis types with drill mode |
| Board governance in email threads | Meeting log, action item tracker, policy docs checklist |
| Grant tracking in a spreadsheet | Full grant pipeline with deadline calendar and application generator |
| Manual tax receipts | Auto-generated branded receipts via Stripe webhook |
| No compliance tracker | IRS checklist, 990 filings log, state registration status |
| Travel documents in a drawer | Per-person travel clearance dashboard with expiry alerts |

---

## Platform Architecture

The platform has two layers:

**Public site** — donor-facing, volunteer-facing, trip participant portal
- Hosted on GitHub Pages (free, global CDN)
- No build step: deploy = `git push origin main`

**Admin panel** (`/admin/`) — board operations, CRM, compliance, grant management
- Same GitHub Pages host; currently open (URL-only access)
- All data stored in browser localStorage — migrates to Cloudflare D1 in one swap

```
GitHub Pages (static HTML/CSS/JS)
├── Public site (10+ pages)
├── /admin/ (board ops panel)
└── /cloudflare/ (backend stubs — ready to deploy)
    ├── Workers (donate.js, send-receipt.js)
    ├── D1 schema (9 tables)
    └── wrangler.toml (full config)
```

---

## What It Does TODAY (fully built, live on GitHub Pages)

### Public Site

- **Homepage, About, Programs, Mission Trips, Stories, Contact, Give, Impact, Roadmap** — fully built, mobile-first, WCAG 2.1 AA accessible
- **Board of Directors page** (`/about/board.html`) — 6-member grid, staff leadership section, org chart, term/election governance table, Join the Board CTA, 990/GuideStar transparency section
- **Mission trip participant portal** (Culpeper Jul 2026) — 8-tab interface: Overview, Schedule, Packing, Logistics, Mission Spanish, Photos, Swag Store, Share & Fundraise
  - WhatsApp group QR code for real-time trip communication
  - STEP (step.state.gov) and CBP One pre-trip action cards
  - Peer fundraising and social sharing cards
- **Donation form** (`/give.html`) — frequency toggle (one-time/monthly/quarterly), amount presets ($25–$500), Stripe Elements placeholder, thank-you flow
- **ADA/WCAG 2.1 AA compliant** throughout: skip-links, ARIA labels, keyboard navigation, focus management

### Admin Panel (`/admin/`)

**Board Operations**
- **Board Health Dashboard** — 6-tile scorecard: seats filled, docs on file, upcoming meetings, overdue action items, travel clearance, grant status
- **Board Governance** — meeting log with notes, action item tracker with overdue flag, governance documents checklist (12 items: bylaws, conflict-of-interest policy, whistleblower policy, etc.), financial snapshot
- **501(c)(3) Compliance** — 990 & filing history (3 years), state registrations (VA/MD/DC), IRS compliance checklist (11 items), key dates dashboard, grant reporting schedule

**Donor Management**
- **Donor CRM** — contact records, full giving history, priority tiers (Major Donor / Key Donor / Active / VIP / Lapsed), moves management workflow, communication preferences
- **Communication Plan** — tier-based cadence map (how often to contact each donor segment), physical mail vs email vs SMS matrix, donor preference center
- **Partner Churches** — church partner records with giving history and relationship notes

**Grant Management**
- **Grant Tracker** — full pipeline from Researching through Application → Under Review → Awarded → Reporting → Closed; 6 seeded grants; deadline calendar with 60-day alerts
- **Grant Application Generator** — produces cover letter, organizational narrative, program narrative, and budget narrative from the org profile — fills in boilerplate so grant writers start from 80%

**Operations**
- **Social Calendar** — monthly view, 78 pre-seeded posts (scripture, Honduran cultural holidays, giving campaigns, mission updates), add/edit/schedule by platform (Facebook, Instagram, X, WhatsApp)
- **Mission Trips Manager** — trip records, participant count tracker, WhatsApp group link, hidden trip portal URL management
- **Org Profile** — mission statement, programs, impact statistics, dual-jurisdiction awareness (US 501(c)(3) EIN + Honduras ONG registration)

**Family Operations**
- **Travel Documents** — per-person dashboard for Walker (US expat, HN residencia), Seiny (HN citizen, US B1/B2 visa), Alena (dual citizen, child passport EXPIRING SOON), Williams (infant, CRBA pending); US↔HN travel clearance indicators; passport expiry color badges
- **Investment Accounts** — Alena UTMA + 529, Williams UTMA; last-4 account reference only (security note: full account numbers should never be stored here)

**Crisis Preparedness**
- **Crisis Communications Playbook** — pre-written templates for: Data Breach, Cybersecurity Incident, Leadership/Misconduct, Financial Irregularity, In-Field Emergency, Natural Disaster; each includes a holding statement, stakeholder matrix, action checklist, and draft communications; drill mode for tabletop exercises

---

## What Requires Cloudflare to Go Live

The backend architecture is fully designed and committed to `/cloudflare/`. Activation is a deployment step, not a design step.

| Feature | Today (POC) | With Cloudflare |
|---|---|---|
| Admin authentication | Open (URL only) | Cloudflare Access — email login, free, 15 min setup |
| Donor database | Browser localStorage | Cloudflare D1 (SQLite, free 5 GB) |
| Donation processing | Stub UI (no real charges) | Stripe + Cloudflare Worker |
| Tax receipts | Manual PDF | Auto via Resend + Worker after Stripe webhook |
| Recurring giving | UI stub | Stripe Billing |
| Document storage | External URL links | Cloudflare R2 ($0.015/GB/month) |
| Email automation | Manual outreach | Resend or Brevo API ($0–5/month) |
| WhatsApp automation | Manual group invites | WhatsApp Business API + Worker |
| SMS emergency alerts | Manual | Twilio + Worker |
| Audit log | None | D1 audit_log table (every write logged) |

**Activation cost: ~$0–20/month** for the Cloudflare free tier + Resend free tier. Stripe charges 2.9% + $0.30 per transaction (industry standard, no monthly fee).

---

## Estimated Cost Comparison

| Tool Replaced | Previous Cost | This Platform |
|---|---|---|
| Kindful (CRM + donations) | $150/month | $0 |
| Website hosting | $20–50/month | $0 (GitHub Pages) |
| Email platform | $30/month | $0–5/month (Brevo free tier) |
| Crisis communications tool | $50/month | Built-in |
| Grant tracking software | $50/month | Built-in |
| Board portal / governance tool | $30/month | Built-in |
| **Total** | **~$330/month** | **~$0–20/month** |

**Estimated annual savings: $3,700–4,000/year** — redirected to Honduras programs.

---

## Integration Opportunities

These are researched, documented, and ready to connect — no redesign required.

| Partner | What It Adds | Cost |
|---|---|---|
| **Google for Nonprofits** | Free Workspace, $10K/month Google Ads grant, Maps/YouTube | Free (apply at google.com/nonprofits) |
| **Give Lively** | Peer-to-peer fundraising, embeddable donation widget | Free for nonprofits |
| **Benevity / Double the Donation** | Corporate matching gift lookup — donors check if employer matches | $0–99/month |
| **DonorSearch** | Wealth screening (real estate, SEC filings) on existing donors | Per-lookup |
| **Candid / GuideStar** | Grant prospecting, peer org benchmarking | Free tier available |
| **Planning Center** | Church management API — sync trip registrations from partner churches | $14/month base |
| **WhatsApp Business API** | Automated trip updates, emergency alerts via WhatsApp | Pay-per-message |
| **Twilio** | SMS emergency alerts for field team and trip participants | Pay-per-message |
| **World Bank Open Data** | Honduras development statistics for grant narratives | Free API |

---

## Recommended Next Steps (Prioritized)

1. **Enable Cloudflare Access on `/admin/`** — 15 minutes, free. Do this before entering any real donor, financial, or travel data into the system. Without it, anyone with the URL can access all admin data.

2. **Set up Cloudflare D1 + deploy Workers** — 2–4 hours. Makes the donor CRM and grant tracker real (data persists server-side, not just in the browser). Requires a free Cloudflare account and the wrangler CLI.

3. **Connect Stripe to give.html** — 1–2 hours. Activates live donation processing. Requires a Stripe account (free to create; 2.9% + $0.30 per transaction, no monthly fee).

4. **Apply for Google for Nonprofits** — 30 minutes. Unlocks free Google Workspace (email, Drive, Meet) and a $10,000/month Google Ads grant for donor acquisition.

5. **Register with Benevity / Double the Donation** — unlocks corporate matching gifts, which can double or triple individual donations at no cost to the donor.

6. **Connect Give Lively to trip fundraising pages** — free peer-to-peer fundraising with embeddable widget; enables trip participants to fundraise on behalf of CAMINO.

7. **Fix Formspree contact form** — replace `YOUR_FORM_ID` in `contact.html` with real Formspree ID. Currently no contact form submissions are received.

8. **Build vocational training track record (2026–2027)** — enabling CAMINO to qualify for workforce development grants, which represent a new $50K–$200K annual funding category.

---

## Technical Notes for Developers

- **Stack**: Static HTML/CSS/JS, no framework, no build step; GitHub Pages (public), Cloudflare Workers + D1 + R2 (planned backend)
- **Deploy**: `git push origin main` — GitHub Pages auto-deploys in ~60 seconds
- **Admin data**: Currently in `localStorage` — migrates to D1 by swapping `localStorage.setItem/getItem` calls with `fetch()` to Workers API endpoints
- **Backend config**: `cloudflare/wrangler.toml` (full Workers config), `cloudflare/schema.sql` (D1 schema, 9 tables), `cloudflare/workers/` (donate.js, send-receipt.js)
- **Accessibility**: WCAG 2.1 AA compliant — skip-links, ARIA labels/roles, roving tabindex, focus traps in modals/lightboxes, keyboard support for all interactive elements
- **No secrets in repo**: All API keys are referenced as environment variables in wrangler.toml; nothing sensitive is committed
