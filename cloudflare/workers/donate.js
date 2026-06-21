/**
 * Cloudflare Worker: POST /api/donate
 *
 * Flow:
 *  1. Validate request body (amount, donor fields)
 *  2. Upsert contact record in D1
 *  3. Create Stripe PaymentIntent
 *  4. Insert pending donation record in D1
 *  5. Return { clientSecret, donationId } to browser
 *
 * Deploy: wrangler deploy --config ../wrangler.toml
 *
 * Required secrets (wrangler secret put):
 *   STRIPE_SECRET_KEY
 *
 * Required bindings (wrangler.toml):
 *   DB          — Cloudflare D1
 *   RECEIPT_QUEUE — Cloudflare Queue
 *   WELCOME_QUEUE — Cloudflare Queue
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://caminohonduras.org',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return jsonError(405, 'Method not allowed');
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, 'Invalid JSON');
    }

    const validation = validateDonateRequest(body);
    if (validation.error) {
      return jsonError(400, validation.error);
    }

    const { amount, currency, campaign, fund, frequency, donor } = body;
    const amountCents = Math.round(parseFloat(amount) * 100);

    try {
      // 1. Upsert contact record in D1
      const contactId = await upsertContact(env.DB, donor);

      // 2. Create Stripe PaymentIntent (or Subscription for recurring)
      let stripeResult;
      if (frequency && frequency !== 'one-time') {
        stripeResult = await createStripeSubscription(env, {
          amountCents,
          currency,
          frequency,
          donor,
          campaign,
        });
      } else {
        stripeResult = await createStripePaymentIntent(env, {
          amountCents,
          currency,
          donor,
          campaign,
        });
      }

      // 3. Insert pending donation record in D1
      const donationId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO donations (id, contact_id, amount, currency, stripe_payment_intent_id, campaign, fund, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `).bind(
        donationId,
        contactId,
        amountCents,
        currency || 'USD',
        stripeResult.id,
        campaign || 'general',
        fund || 'unrestricted',
        new Date().toISOString(),
      ).run();

      // 4. Return client secret to browser (Stripe.js completes payment)
      return jsonResponse(200, {
        clientSecret: stripeResult.client_secret,
        donationId,
        contactId,
      });

    } catch (err) {
      console.error('donate worker error:', err);
      return jsonError(500, 'Internal server error — please try again or contact us directly.');
    }
  },

  // Queue consumer: triggered when receipt-queue has messages
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      try {
        await processReceiptMessage(env, message.body);
        message.ack();
      } catch (err) {
        console.error('Receipt queue error:', err, message.body);
        message.retry({ delaySeconds: 60 });
      }
    }
  },
};

// ─────────────────────────────────────────────────────
// Stripe API helpers
// ─────────────────────────────────────────────────────

async function createStripePaymentIntent(env, { amountCents, currency, donor, campaign }) {
  const response = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount:   String(amountCents),
      currency: currency || 'usd',
      'automatic_payment_methods[enabled]': 'true',
      'metadata[campaign]':    campaign || 'general',
      'metadata[donor_email]': donor.email,
      'metadata[donor_name]':  `${donor.firstName} ${donor.lastName}`,
      description: `CAMINO Honduras donation — ${campaign || 'General Fund'}`,
      receipt_email: donor.email,
    }).toString(),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Stripe error: ${err.error?.message || response.status}`);
  }

  return response.json();
}

async function createStripeSubscription(env, { amountCents, currency, frequency, donor, campaign }) {
  // Step 1: Create or retrieve Stripe customer
  const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      email: donor.email,
      name:  `${donor.firstName} ${donor.lastName}`,
      'metadata[campaign]': campaign || 'general',
    }).toString(),
  });

  const customer = await customerResponse.json();

  // Step 2: Create a SetupIntent (browser collects card, then we create subscription)
  const setupResponse = await fetch('https://api.stripe.com/v1/setup_intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer: customer.id,
      'automatic_payment_methods[enabled]': 'true',
      'metadata[frequency]': frequency,
      'metadata[amount]':    String(amountCents),
      'metadata[campaign]':  campaign || 'general',
    }).toString(),
  });

  return setupResponse.json();
}

// ─────────────────────────────────────────────────────
// D1 helpers
// ─────────────────────────────────────────────────────

async function upsertContact(db, donor) {
  const now = new Date().toISOString();

  // Check if contact exists by email
  const existing = await db.prepare(
    'SELECT id FROM contacts WHERE email = ?'
  ).bind(donor.email.toLowerCase()).first();

  if (existing) {
    // Update name/phone if provided
    await db.prepare(`
      UPDATE contacts
      SET first_name = COALESCE(?, first_name),
          last_name  = COALESCE(?, last_name),
          phone      = COALESCE(?, phone),
          updated_at = ?
      WHERE id = ?
    `).bind(donor.firstName, donor.lastName, donor.phone || null, now, existing.id).run();
    return existing.id;
  }

  // Insert new contact
  const id = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO contacts (id, first_name, last_name, email, phone, source, type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'web', 'donor', ?, ?)
  `).bind(id, donor.firstName, donor.lastName, donor.email.toLowerCase(), donor.phone || null, now, now).run();
  return id;
}

// ─────────────────────────────────────────────────────
// Queue message processor
// ─────────────────────────────────────────────────────

async function processReceiptMessage(env, body) {
  const { donationId, contactId } = body;

  // Fetch donation + contact
  const donation = await env.DB.prepare(
    'SELECT * FROM donations WHERE id = ?'
  ).bind(donationId).first();

  const contact = await env.DB.prepare(
    'SELECT * FROM contacts WHERE id = ?'
  ).bind(contactId).first();

  if (!donation || !contact) {
    throw new Error(`Missing records: donationId=${donationId} contactId=${contactId}`);
  }

  // Trigger receipt email via Resend (see send-receipt.js)
  const receiptWorkerUrl = `${env.SITE_URL}/api/send-receipt`;
  await fetch(receiptWorkerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ donationId, contactId }),
  });
}

// ─────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────

function validateDonateRequest(body) {
  if (!body.amount || isNaN(parseFloat(body.amount))) {
    return { error: 'Amount is required and must be a number.' };
  }
  const amount = parseFloat(body.amount);
  if (amount < 1) {
    return { error: 'Minimum donation is $1.00.' };
  }
  if (amount > 100000) {
    return { error: 'For gifts over $100,000, please contact us directly.' };
  }
  if (!body.donor?.email || !body.donor.email.includes('@')) {
    return { error: 'A valid email address is required.' };
  }
  if (!body.donor?.firstName || !body.donor?.lastName) {
    return { error: 'First and last name are required.' };
  }
  return {};
}

// ─────────────────────────────────────────────────────
// Response helpers
// ─────────────────────────────────────────────────────

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
