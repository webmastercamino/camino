# Admin Panel Quick Start

*For Walker and Seiny — how to use the CAMINO ops panel today.*

---

## Security Notice First

> **Do not enter real passport numbers, financial account numbers, full donor SSNs, or other sensitive personal data until Cloudflare Access is enabled.** Currently the admin panel is protected only by the URL. Anyone who knows the address can see everything in it.
>
> Enabling Cloudflare Access takes about 15 minutes and is free. See [How to set up Cloudflare Access](#cloudflare-access) at the bottom of this guide.

---

## How to Access the Admin Panel

Open your browser and go to:

```
https://elcamino.github.io/admin/
```

*(Replace `elcamino.github.io` with your actual GitHub Pages domain once confirmed.)*

There is no login screen yet — you land directly in the panel. The sidebar on the left lists all sections.

---

## Social Calendar

**Where**: Sidebar → Social Calendar

**Loading the seed posts (78 pre-written posts)**

1. Click **Social Calendar** in the sidebar
2. Click the **Load Seed Posts** button near the top right
3. Confirm the dialog — this populates the calendar with 78 pre-written posts covering scripture, Honduran cultural holidays, giving campaigns, and mission updates
4. The posts are stored in your browser's localStorage — they persist until you clear your browser data or switch devices

**Adding a new post**

1. Click a date on the monthly calendar view, or click **+ Add Post**
2. Fill in: Platform (Facebook / Instagram / X / WhatsApp), post text, optional image note, scheduled time
3. Click **Save** — the post appears as a dot on the calendar

**Editing or deleting a post**

1. Click the date that has a post
2. In the day detail panel, click the pencil icon to edit or trash icon to delete

---

## Mission Trips

**Where**: Sidebar → Mission Trips

**Adding a new trip**

1. Click **+ Add Trip**
2. Fill in: Trip name, destination, dates, max participants, trip portal URL (e.g., `/trips/jul-2026-culpeper.html`), WhatsApp group invite link
3. Click **Save**

**Updating participant count**

1. Find the trip in the list
2. Click the pencil icon
3. Update the confirmed/applied counts — this is manual for now (auto-sync requires Cloudflare)

**Copying the trip portal URL**

1. Find the trip
2. Click the **Copy URL** button — pastes the portal link to your clipboard to share with participants

---

## Donor Records

**Where**: Sidebar → Donor CRM

**Adding a donor**

1. Click **+ Add Donor**
2. Fill in: Name, email, phone, address, giving tier (Major / Key / Active / VIP / Lapsed), communication preference (email / mail / phone / SMS)
3. Click **Save**

**Finding a donor**

1. Use the search box at the top of the donor table — searches name, email, and church
2. Use the Type and Recurring filters to narrow the list

**Viewing a donor's full record**

1. Click the donor's name in the table
2. The detail panel expands on the right: contact info, giving summary, gift history, trips attended, staff notes
3. Use the action buttons to log a gift, schedule a contact, or add a note

---

## Board Meetings

**Where**: Sidebar → Board Governance → Meetings tab

**Logging a new meeting**

1. Click **Log New Meeting**
2. Fill in: Date, meeting type (Regular / Special / Annual), attendees, key decisions, action items assigned
3. Click **Save** — the meeting appears in the log with attendee count and a summary

**Adding an action item**

1. Click the **Action Items** tab
2. Click **+ Add Item**
3. Fill in: Description, assigned to, due date, priority
4. Click **Save** — overdue items automatically flag in red at the top of the list

---

## Crisis Communications

**Where**: Sidebar → Crisis Comms

**Activating a template**

1. Find the crisis type that matches your situation:
   - **Data Breach** — donor or personal data exposed
   - **Cybersecurity Incident** — system compromise or ransomware
   - **Leadership/Misconduct** — staff or board allegation
   - **Financial Irregularity** — fraud, misuse, or audit finding
   - **In-Field Emergency** — trip participant injury, accident, or security incident
   - **Natural Disaster** — earthquake, hurricane, flooding in Honduras

2. Click the crisis card to expand it
3. Review the **Stakeholder Matrix** — who gets notified, in what order, via what channel
4. Copy the **Holding Statement** — this is the first public statement you issue while gathering facts
5. Work through the **Action Checklist** — tasks with owners and time targets
6. Use the **Draft Communications** tab for donor email, social post, and board notification templates

**Running a drill**

1. Click **Enter Drill Mode** at the top of the Crisis Comms panel
2. Select a scenario — the system walks through the response playbook as a tabletop exercise
3. Click **Exit Drill Mode** when done — no data is saved and nothing is sent

---

## Grant Applications

**Where**: Sidebar → Grant Tracker → then click **Generate Application** on any grant

**Generating a grant application**

1. In the Grant Tracker, find the grant you're applying for (or click **+ Add Grant** to create it)
2. Click **Generate Application**
3. The generator pulls from your Org Profile to pre-fill:
   - Cover letter
   - Organizational narrative (mission, history, programs)
   - Program narrative (the specific program this grant funds)
   - Budget narrative (how the money will be spent)
4. Review and edit each section — the output is a starting draft, not a final submission
5. Copy to your word processor or email client to complete and format

**Keeping the Org Profile current**

The grant generator pulls from **Sidebar → Org Profile**. Keep this up to date with current EIN, annual budget, impact numbers, and Honduras ONG registration details so generated narratives are accurate.

---

## Travel Documents

**Where**: Sidebar → Travel Docs

This panel tracks passports, visas, and travel clearance for Walker, Seiny, Alena, and Williams.

**Checking travel clearance**

Each family member shows a US↔HN clearance indicator:
- ✅ Clear — all documents valid, no action needed
- ⚠️ Pending — one or more documents need action (expiring, pending application, etc.)

**Editing a document record**

1. Click the pencil icon on any document row
2. Update expiry date, document number (last 4 only), or status
3. Click **Save** — changes persist in localStorage

---

<a name="cloudflare-access"></a>
## Setting Up Cloudflare Access

Cloudflare Access puts a login screen in front of the `/admin/` URL. Only email addresses you approve can get in. It's free for up to 50 users.

**Steps:**

1. Create a free account at [cloudflare.com](https://cloudflare.com)
2. Add your GitHub Pages domain to Cloudflare (point DNS there — takes ~10 minutes)
3. In the Cloudflare dashboard, go to **Zero Trust → Access → Applications**
4. Click **Add an Application → Self-hosted**
5. Set the application domain to `yourdomain.com/admin/*`
6. Add a policy: **Allow** where **Email** is in `walker@youremail.com, seiny@youremail.com`
7. Save — the `/admin/` URL now requires email verification to access

Full Cloudflare Access documentation: [developers.cloudflare.com/cloudflare-one/applications/configure-apps](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/)

**Time required:** ~15 minutes  
**Cost:** Free (Cloudflare Zero Trust free tier covers up to 50 users)

---

## Questions?

Contact the platform developer or open an issue in the GitHub repository.
