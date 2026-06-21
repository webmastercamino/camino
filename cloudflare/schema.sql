-- CAMINO Honduras — Cloudflare D1 Schema
-- Deploy: wrangler d1 execute camino-db --file=schema.sql
-- SQLite-compatible; UUIDs stored as TEXT

-- ─────────────────────────────────────────
-- Donors / Contacts
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id           TEXT PRIMARY KEY,          -- uuid
  first_name   TEXT,
  last_name    TEXT,
  email        TEXT UNIQUE,
  phone        TEXT,
  address      TEXT,
  city         TEXT,
  state        TEXT,
  zip          TEXT,
  country      TEXT DEFAULT 'US',
  type         TEXT DEFAULT 'donor',      -- donor | volunteer | church | both
  source       TEXT,                      -- web | import | manual | give-lively
  church_id    TEXT REFERENCES churches(id),
  notes        TEXT,
  created_at   TEXT NOT NULL,             -- ISO 8601
  updated_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contacts_email     ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_last_name ON contacts(last_name);
CREATE INDEX IF NOT EXISTS idx_contacts_type      ON contacts(type);

-- ─────────────────────────────────────────
-- Donations
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donations (
  id                        TEXT PRIMARY KEY,
  contact_id                TEXT REFERENCES contacts(id),
  amount                    INTEGER NOT NULL,   -- in cents (e.g. 5000 = $50.00)
  currency                  TEXT DEFAULT 'USD',
  stripe_payment_intent_id  TEXT UNIQUE,
  campaign                  TEXT,               -- general | trip-culpeper-jul-2026 | home-build | community-dev
  fund                      TEXT DEFAULT 'unrestricted',  -- restricted | unrestricted
  status                    TEXT DEFAULT 'pending',       -- pending | completed | failed | refunded
  receipt_sent              INTEGER DEFAULT 0,  -- 0 | 1
  receipt_sent_at           TEXT,
  notes                     TEXT,
  created_at                TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_donations_contact   ON donations(contact_id);
CREATE INDEX IF NOT EXISTS idx_donations_status    ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_campaign  ON donations(campaign);
CREATE INDEX IF NOT EXISTS idx_donations_created   ON donations(created_at);

-- ─────────────────────────────────────────
-- Recurring Giving (Stripe Subscriptions)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_giving (
  id                     TEXT PRIMARY KEY,
  contact_id             TEXT REFERENCES contacts(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id     TEXT,
  amount                 INTEGER,               -- in cents
  currency               TEXT DEFAULT 'USD',
  frequency              TEXT,                  -- monthly | quarterly | annually
  campaign               TEXT DEFAULT 'general',
  status                 TEXT DEFAULT 'active', -- active | paused | cancelled
  next_charge            TEXT,                  -- ISO 8601
  total_charged          INTEGER DEFAULT 0,     -- lifetime total in cents
  charge_count           INTEGER DEFAULT 0,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recurring_contact ON recurring_giving(contact_id);
CREATE INDEX IF NOT EXISTS idx_recurring_status  ON recurring_giving(status);

-- ─────────────────────────────────────────
-- Mission Trips
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trips (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  dates             TEXT,
  location          TEXT,
  group_name        TEXT,
  coordinator       TEXT,
  coordinator_email TEXT,
  status            TEXT DEFAULT 'Planning',   -- Planning | Confirmed | In Progress | Completed
  participant_count INTEGER DEFAULT 0,
  max_participants  INTEGER DEFAULT 25,
  slug              TEXT UNIQUE,               -- e.g. trips/jul-2026-culpeper.html
  hidden            INTEGER DEFAULT 1,         -- 0 = public, 1 = internal only
  whatsapp_link     TEXT,
  cost_per_person   INTEGER,                   -- in cents
  notes             TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_slug   ON trips(slug);

-- ─────────────────────────────────────────
-- Trip Participants
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_participants (
  id                 TEXT PRIMARY KEY,
  trip_id            TEXT REFERENCES trips(id) ON DELETE CASCADE,
  contact_id         TEXT REFERENCES contacts(id),
  role               TEXT DEFAULT 'participant',  -- participant | leader | staff | interpreter
  paid               INTEGER DEFAULT 0,           -- 0 | 1
  amount_paid        INTEGER DEFAULT 0,           -- in cents
  fundraising_goal   INTEGER DEFAULT 0,           -- in cents
  fundraising_raised INTEGER DEFAULT 0,           -- in cents
  waiver_signed      INTEGER DEFAULT 0,           -- 0 | 1
  waiver_signed_at   TEXT,
  checked_in         INTEGER DEFAULT 0,
  notes              TEXT,
  created_at         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_participants_trip    ON trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_participants_contact ON trip_participants(contact_id);

-- ─────────────────────────────────────────
-- Churches / Partner Organizations
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS churches (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  denomination   TEXT,                            -- Methodist | Baptist | Non-denom | Catholic | Presbyterian | etc
  city           TEXT,
  state          TEXT,
  country        TEXT DEFAULT 'US',
  contact_name   TEXT,
  contact_email  TEXT,
  contact_phone  TEXT,
  relationship   TEXT DEFAULT 'prospect',         -- partner | prospect | alumni | inactive
  last_trip_date TEXT,
  total_donated  INTEGER DEFAULT 0,               -- cumulative in cents
  notes          TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_churches_relationship ON churches(relationship);
CREATE INDEX IF NOT EXISTS idx_churches_state        ON churches(state);

-- ─────────────────────────────────────────
-- Communications Log
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS communications (
  id         TEXT PRIMARY KEY,
  contact_id TEXT REFERENCES contacts(id),
  type       TEXT,         -- email | sms | whatsapp | call | note | letter
  direction  TEXT,         -- inbound | outbound
  subject    TEXT,
  body       TEXT,
  status     TEXT,         -- sent | delivered | opened | failed | logged
  resend_id  TEXT,         -- Resend message ID (for email tracking)
  created_at TEXT NOT NULL,
  created_by TEXT          -- admin user who logged it
);

CREATE INDEX IF NOT EXISTS idx_comms_contact   ON communications(contact_id);
CREATE INDEX IF NOT EXISTS idx_comms_type      ON communications(type);
CREATE INDEX IF NOT EXISTS idx_comms_created   ON communications(created_at);

-- ─────────────────────────────────────────
-- Board Members
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS board_members (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT,
  email       TEXT,
  term_start  TEXT,
  term_end    TEXT,
  status      TEXT DEFAULT 'Current',   -- Current | Up for re-election | Open seat | Emeritus
  founder     INTEGER DEFAULT 0,        -- 0 | 1
  bio         TEXT,
  linkedin    TEXT,
  photo_r2    TEXT,                     -- R2 object key for headshot
  created_at  TEXT NOT NULL
);

-- ─────────────────────────────────────────
-- Grants
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grants (
  id          TEXT PRIMARY KEY,
  funder      TEXT NOT NULL,
  amount      INTEGER,                  -- in cents
  award_date  TEXT,
  report_due  TEXT,
  restricted  INTEGER DEFAULT 0,        -- 0 | 1
  status      TEXT DEFAULT 'Applied',   -- Applied | Awarded | Reporting | Closed | Declined
  campaign    TEXT,
  notes       TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- ─────────────────────────────────────────
-- Audit Log (append-only)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id         TEXT PRIMARY KEY,
  actor      TEXT,       -- admin email
  action     TEXT,       -- created | updated | deleted | exported | viewed
  resource   TEXT,       -- contacts | donations | trips | etc
  resource_id TEXT,
  detail     TEXT,       -- JSON string with before/after
  ip         TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created  ON audit_log(created_at);

-- ─────────────────────────────────────────
-- Seed: Initial trips
-- ─────────────────────────────────────────
INSERT OR IGNORE INTO trips (id, name, dates, location, group_name, coordinator, coordinator_email, status, participant_count, max_participants, slug, hidden, whatsapp_link, created_at, updated_at) VALUES
  ('trip_001', 'Culpeper Community Church — Summer Build', 'July 12–19, 2026', 'San Pedro Sula, Honduras', 'Culpeper Community Church', 'Walker Somerville', 'walker@caminohonduras.org', 'Confirmed', 14, 25, 'trips/jul-2026-culpeper.html', 0, NULL, '2026-01-15T10:00:00Z', '2026-06-01T08:00:00Z'),
  ('trip_002', 'Winter Build — Open Enrollment', 'January 10–17, 2026', 'Rio Lindo, Cortés, Honduras', 'Open Enrollment', 'Walker Somerville', 'walker@caminohonduras.org', 'Completed', 18, 25, 'trips/jan-2026.html', 0, NULL, '2025-09-01T10:00:00Z', '2026-01-20T08:00:00Z'),
  ('trip_003', 'Spring Mission — Open Enrollment', 'March 7–14, 2026', 'Choloma, Cortés, Honduras', 'Open Enrollment', 'Seiny Somerville', 'seiny@caminohonduras.org', 'Confirmed', 9, 20, 'trips/mar-2026.html', 0, NULL, '2025-10-01T10:00:00Z', '2026-02-01T08:00:00Z'),
  ('trip_004', 'Fall Build — Open Enrollment', 'October 3–10, 2026', 'San Pedro Sula, Honduras', 'Open Enrollment', 'Walker Somerville', 'walker@caminohonduras.org', 'Planning', 3, 25, 'trips/oct-2026.html', 0, NULL, '2026-02-01T10:00:00Z', '2026-06-01T08:00:00Z');
