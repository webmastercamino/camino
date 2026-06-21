# CAMINO Honduras — Cloudflare Architecture

This directory contains the backend infrastructure configuration for the CAMINO Honduras site. The current site runs on GitHub Pages (static). This architecture defines the path to a full Cloudflare-native stack.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PUBLIC INTERNET                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │  Cloudflare Pages   │  Static HTML/CSS/JS hosting
              │  caminohonduras.org │  CDN-cached globally, free tier
              └──────────┬──────────┘
                         │  /api/* requests
              ┌──────────▼──────────┐
              │  Cloudflare Workers │  API layer (serverless)
              │  workers.dev edge   │  <1ms cold start, 0ms warm
              └──┬────┬────┬────┬───┘
                 │    │    │    │
        ┌────────▼┐ ┌─▼──┐ ┌▼──┐ ┌▼─────────┐
        │   D1    │ │ KV │ │ R2 │ │  Queues  │
        │ SQLite  │ │    │ │    │ │          │
        └─────────┘ └────┘ └────┘ └──────────┘
                         │
              ┌──────────▼──────────┐
              │  Cloudflare Access  │  Zero-trust auth for /admin/*
              │  Google / GitHub    │  SSO — no password to manage
              └─────────────────────┘
```

---

## Services

### Cloudflare Pages
- Replaces GitHub Pages as the static host
- Global CDN with automatic HTTPS
- Connected to GitHub repo — push to `main` triggers deploy
- Supports preview deployments per branch
- **Free tier**: unlimited requests, 500 builds/month

### Cloudflare Workers (API Layer)
All API routes live at `/api/*` and are handled by Workers:

| Route | Worker | Purpose |
|---|---|---|
| `POST /api/donate` | `donate.js` | Create Stripe PaymentIntent, save donor to D1 |
| `GET /api/donors` | `donors.js` | List/search donors (admin only) |
| `GET /api/donors/:id` | `donors.js` | Donor detail + giving history |
| `POST /api/donors` | `donors.js` | Create/update donor record |
| `GET /api/trips` | `trips.js` | List trips (public: unhidden only) |
| `POST /api/trips` | `trips.js` | Create/update trip (admin only) |
| `POST /api/contacts` | `contacts.js` | Contact form submission → D1 + email |
| `POST /api/webhooks/stripe` | `stripe-webhook.js` | Stripe event → D1 update → Queue receipt |
| `POST /api/webhooks/give-lively` | `give-lively-webhook.js` | Give Lively events (legacy) |

### Cloudflare D1 (Donor Database)
- SQLite-compatible relational database at the edge
- Schema: see `schema.sql`
- Tables: contacts, donations, recurring_giving, trips, trip_participants, churches, communications, board_members, grants
- **Free tier**: 100k rows/day reads, 100k rows/day writes, 5GB storage

### Cloudflare KV (Key-Value Store)
Used for fast reads of frequently-accessed data:

| Namespace | Key pattern | Value | TTL |
|---|---|---|---|
| `CAMINO_SETTINGS` | `site:giving_total` | Cached YTD giving total | 1 hour |
| `CAMINO_SETTINGS` | `site:donor_count` | Cached donor count | 1 hour |
| `CAMINO_SESSIONS` | `session:{token}` | Admin session data | 8 hours |
| `CAMINO_CACHE` | `trip:{slug}` | Serialized trip JSON | 5 min |
| `CAMINO_CACHE` | `impact:stats` | Homepage impact numbers | 1 day |

### Cloudflare R2 (Object Storage)
S3-compatible storage for media and documents:

| Bucket | Contents | Access |
|---|---|---|
| `camino-media` | Trip photos, program images | Public via CDN |
| `camino-docs` | IRS determination letter, 990s, board minutes | Private, signed URLs |
| `camino-receipts` | PDF tax receipts (generated per donation) | Private, signed URLs |

### Cloudflare Access (Admin Authentication)
- Zero-trust auth gate on `/admin/*`
- Allowed identity providers: Google Workspace, GitHub
- Policy: email in allowlist (`@caminohonduras.org` or specific addresses)
- No passwords to manage or rotate
- Audit log of every admin login
- **Replaces**: current "POC · No auth" state of the admin panel

### Cloudflare Queues (Async Processing)
Decouples slow operations from the request/response path:

| Queue | Producer | Consumer | Purpose |
|---|---|---|---|
| `receipt-queue` | `stripe-webhook.js` | `send-receipt.js` | Email tax receipts after confirmed payment |
| `welcome-queue` | `donate.js` (new donors) | `send-welcome.js` | Welcome email to first-time donors |
| `notification-queue` | Any Worker | `notify-admin.js` | Slack/email alerts for large gifts, errors |

---

## Data Flow: Donation

```
Donor fills give.html form
         │
         ▼
POST /api/donate (Worker: donate.js)
  1. Validate amount, donor fields
  2. Upsert contact record in D1
  3. Create Stripe PaymentIntent
  4. Return { clientSecret, donationId } to browser
         │
         ▼
Stripe.js confirms payment in browser
         │
         ▼
Stripe webhook → POST /api/webhooks/stripe (Worker: stripe-webhook.js)
  1. Verify Stripe signature
  2. Update donation status → 'completed' in D1
  3. Enqueue to receipt-queue
         │
         ▼
Queue consumer: send-receipt.js
  1. Fetch donor record from D1
  2. Render branded email template
  3. POST to Resend API
  4. Mark receipt_sent = 1 in D1
```

---

## Deployment

### Prerequisites
- Cloudflare account (free tier works for POC)
- `wrangler` CLI: `npm install -g wrangler`
- Stripe account (test mode keys)
- Resend account (receipt emails)

### Deploy Workers
```bash
cd cloudflare
wrangler deploy --config wrangler.toml
```

### Create D1 database
```bash
wrangler d1 create camino-db
wrangler d1 execute camino-db --file=schema.sql
```

### Migrate from GitHub Pages → Cloudflare Pages
1. Connect repo to Cloudflare Pages in the dashboard
2. Set build command: (none — static site)
3. Set output directory: `/`
4. Update DNS: point caminohonduras.org CNAME → Pages project

---

## Environment Variables (set in wrangler.toml or dashboard)

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `ADMIN_EMAIL` | Admin notification email |
| `ORG_EIN` | CAMINO EIN for tax receipts |
| `CLOUDFLARE_ACCESS_POLICY` | Access policy ID for /admin/* |
