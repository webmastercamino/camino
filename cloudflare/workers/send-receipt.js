/**
 * Cloudflare Worker: POST /api/send-receipt
 *
 * Triggered by:
 *  - Stripe webhook (payment_intent.succeeded) via donate.js queue
 *  - Direct admin action (resend receipt button)
 *
 * Flow:
 *  1. Receive { donationId, contactId }
 *  2. Fetch donation record from D1
 *  3. Fetch contact record from D1
 *  4. Build branded HTML tax receipt
 *  5. POST to Resend API
 *  6. Mark receipt_sent = 1 in D1
 *
 * Required secrets (wrangler secret put):
 *   RESEND_API_KEY
 *
 * Required env vars (wrangler.toml [vars]):
 *   FROM_EMAIL     — receipts@caminohonduras.org
 *   ORG_EIN        — XX-XXXXXXX
 *   ORG_NAME       — CAMINO Honduras
 */

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const { donationId, contactId } = body;
    if (!donationId || !contactId) {
      return new Response('donationId and contactId required', { status: 400 });
    }

    try {
      // Fetch records from D1
      const donation = await env.DB.prepare(
        'SELECT * FROM donations WHERE id = ? AND status = ?'
      ).bind(donationId, 'completed').first();

      if (!donation) {
        return new Response(JSON.stringify({ error: 'Donation not found or not yet completed' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const contact = await env.DB.prepare(
        'SELECT * FROM contacts WHERE id = ?'
      ).bind(contactId).first();

      if (!contact) {
        return new Response(JSON.stringify({ error: 'Contact not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Build and send receipt email
      const confirmationNumber = `CAM-${new Date(donation.created_at).getFullYear()}-${donationId.slice(0, 8).toUpperCase()}`;
      const html = buildReceiptHtml({ donation, contact, confirmationNumber, env });

      const emailResult = await sendViaResend(env, {
        to:      contact.email,
        subject: `Your tax receipt from CAMINO Honduras — ${confirmationNumber}`,
        html,
      });

      if (!emailResult.ok) {
        console.error('Resend error:', emailResult.status, await emailResult.text());
        throw new Error('Failed to send email via Resend');
      }

      // Mark receipt as sent in D1
      await env.DB.prepare(
        "UPDATE donations SET receipt_sent = 1, receipt_sent_at = ? WHERE id = ?"
      ).bind(new Date().toISOString(), donationId).run();

      // Log communication
      await env.DB.prepare(`
        INSERT INTO communications (id, contact_id, type, direction, subject, status, created_at)
        VALUES (?, ?, 'email', 'outbound', ?, 'sent', ?)
      `).bind(
        crypto.randomUUID(),
        contactId,
        `Tax receipt ${confirmationNumber}`,
        new Date().toISOString(),
      ).run();

      return new Response(JSON.stringify({ sent: true, confirmationNumber }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (err) {
      console.error('send-receipt error:', err);
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

// ─────────────────────────────────────────────────────
// Resend API
// ─────────────────────────────────────────────────────

async function sendViaResend(env, { to, subject, html }) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    `${env.ORG_NAME} <${env.FROM_EMAIL}>`,
      to:      [to],
      subject,
      html,
      tags: [
        { name: 'type',  value: 'tax-receipt' },
        { name: 'org',   value: 'camino-honduras' },
      ],
    }),
  });
}

// ─────────────────────────────────────────────────────
// Receipt HTML template
// ─────────────────────────────────────────────────────

function buildReceiptHtml({ donation, contact, confirmationNumber, env }) {
  const giftAmount  = formatCurrency(donation.amount);
  const giftDate    = new Date(donation.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const donorName   = `${contact.first_name} ${contact.last_name}`;
  const campaign    = formatCampaign(donation.campaign);
  const fund        = donation.fund === 'restricted' ? 'Restricted — ' + campaign : 'Unrestricted General Fund';
  const ein         = env.ORG_EIN || 'XX-XXXXXXX';
  const orgName     = env.ORG_NAME || 'CAMINO Honduras';
  const siteUrl     = env.SITE_URL || 'https://caminohonduras.org';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Tax Receipt — ${orgName}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,'Times New Roman',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;">
  <tr><td align="center" style="padding:40px 16px">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">

      <!-- Header -->
      <tr>
        <td style="background:#BA7517;padding:32px 40px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="width:40px;height:40px;background:rgba(255,255,255,.2);border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;vertical-align:middle;margin-right:12px">C</div>
                <span style="color:#fff;font-size:22px;font-weight:700;vertical-align:middle">${orgName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding-top:8px">
                <span style="color:rgba(255,255,255,0.75);font-size:13px;font-family:system-ui,sans-serif;letter-spacing:1px;text-transform:uppercase">Official Tax Receipt</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px">
          <p style="font-size:17px;color:#1a1a18;margin:0 0 24px">Dear ${donorName},</p>
          <p style="font-size:15px;color:#3a3a38;line-height:1.7;margin:0 0 24px">
            Thank you for your generous gift to ${orgName}. Your generosity is directly funding
            home construction, community development, and church planting across Honduras.
          </p>

          <!-- Gift details box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#faeeda;border-radius:6px;margin-bottom:28px">
            <tr>
              <td style="padding:24px 28px">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-family:system-ui,sans-serif">
                  <tr>
                    <td style="font-size:11px;color:#633806;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding-bottom:16px" colspan="2">Gift Summary</td>
                  </tr>
                  <tr>
                    <td style="font-size:14px;color:#6b6b68;padding-bottom:10px">Confirmation #</td>
                    <td style="font-size:14px;color:#1a1a18;font-weight:700;text-align:right;padding-bottom:10px;font-family:monospace">${confirmationNumber}</td>
                  </tr>
                  <tr>
                    <td style="font-size:14px;color:#6b6b68;padding-bottom:10px">Gift date</td>
                    <td style="font-size:14px;color:#1a1a18;text-align:right;padding-bottom:10px">${giftDate}</td>
                  </tr>
                  <tr>
                    <td style="font-size:14px;color:#6b6b68;padding-bottom:10px">Designation</td>
                    <td style="font-size:14px;color:#1a1a18;text-align:right;padding-bottom:10px">${fund}</td>
                  </tr>
                  <tr>
                    <td style="border-top:1px solid #e8c888;padding-top:14px">
                      <span style="font-size:16px;font-weight:700;color:#1a1a18">Gift amount</span>
                    </td>
                    <td style="border-top:1px solid #e8c888;padding-top:14px;text-align:right">
                      <span style="font-size:22px;font-weight:700;color:#BA7517">${giftAmount}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- IRS language -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:6px;margin-bottom:28px">
            <tr>
              <td style="padding:20px 24px">
                <p style="font-size:12px;color:#6b6b68;line-height:1.7;font-family:system-ui,sans-serif;margin:0 0 8px">
                  <strong style="color:#1a1a18">For your tax records:</strong> ${orgName} is a
                  tax-exempt organization under Section 501(c)(3) of the Internal Revenue Code.
                  EIN: <strong>${ein}</strong>. No goods or services were provided to the donor
                  in exchange for this contribution.
                </p>
                <p style="font-size:12px;color:#6b6b68;line-height:1.7;font-family:system-ui,sans-serif;margin:0">
                  This letter serves as your official receipt for U.S. federal income tax purposes.
                  Please retain it with your financial records.
                </p>
              </td>
            </tr>
          </table>

          <p style="font-size:15px;color:#3a3a38;line-height:1.7;margin:0 0 8px">
            With gratitude,
          </p>
          <p style="font-size:15px;color:#1a1a18;font-weight:600;margin:0 0 4px">Walker &amp; Seiny Somerville</p>
          <p style="font-size:13px;color:#6b6b68;font-family:system-ui,sans-serif;margin:0">Co-Founders, ${orgName}</p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f5f5f0;padding:20px 40px;border-top:1px solid #e0e0e0">
          <p style="font-size:11px;color:#9b9b98;font-family:system-ui,sans-serif;line-height:1.6;margin:0;text-align:center">
            Questions about your gift? Email <a href="mailto:${env.ADMIN_EMAIL || 'info@caminohonduras.org'}" style="color:#BA7517">${env.ADMIN_EMAIL || 'info@caminohonduras.org'}</a>
            &nbsp;·&nbsp;
            <a href="${siteUrl}" style="color:#BA7517">${siteUrl}</a>
            <br>
            ${orgName} · 501(c)(3) Non-Profit · EIN ${ein}
            <br>
            <a href="${siteUrl}/give.html" style="color:#BA7517">Give again</a>
            &nbsp;·&nbsp;
            <a href="${siteUrl}/trips.html" style="color:#BA7517">Join a mission trip</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────

function formatCurrency(cents) {
  return new Intl.NumberFormat('en-US', {
    style:    'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatCampaign(slug) {
  const map = {
    'general':          'General Fund',
    'home-build':       'Home Construction',
    'community-dev':    'Community Development',
    'mission-trips':    'Mission Trips',
    'sponsor-volunteer':'Sponsor a Volunteer',
  };
  if (map[slug]) return map[slug];
  if (slug && slug.startsWith('trip-')) return 'Mission Trip — ' + slug.replace('trip-', '').replace(/-/g, ' ');
  return slug || 'General Fund';
}
