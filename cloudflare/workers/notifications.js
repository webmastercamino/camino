/**
 * notifications.js — CAMINO Honduras Notification Worker (Phase 2 stub)
 *
 * Handles automated SMS (Twilio) and WhatsApp (WhatsApp Business API) delivery
 * for mission trip participant notifications.
 *
 * Trigger sources:
 *   1. Cron job: checks D1 for participants whose arrival flight time has passed → sends arrival welcome
 *   2. Admin manual trigger: POST /api/notify with { tripId, templateKey, participantIds? }
 *
 * Phase 1 (current): templates are copied manually from the admin panel.
 * Phase 2 (this file): connect Twilio + WhatsApp Business API credentials in wrangler.toml.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/notify') {
      return handleManualNotify(request, env);
    }

    return new Response('CAMINO Notifications Worker — POST /api/notify to send.', { status: 200 });
  },

  // Cron trigger: wrangler.toml should define schedule = "*/15 * * * *" (every 15 min)
  async scheduled(event, env, ctx) {
    await checkArrivalNotifications(env);
  },
};

// ── Manual trigger from admin panel ──────────────────────────────────────────

async function handleManualNotify(request, env) {
  let body;
  try { body = await request.json(); } catch { return jsonErr(400, 'Invalid JSON'); }

  const { tripId, templateKey, participantIds } = body;
  if (!tripId || !templateKey) return jsonErr(400, 'tripId and templateKey required');

  // Fetch participants from D1
  const stmt = participantIds?.length
    ? env.DB.prepare('SELECT * FROM trip_participants WHERE trip_id = ? AND id IN (' + participantIds.map(()=>'?').join(',') + ')')
        .bind(tripId, ...participantIds)
    : env.DB.prepare('SELECT * FROM trip_participants WHERE trip_id = ?').bind(tripId);

  const { results: participants } = await stmt.all();
  if (!participants.length) return jsonErr(404, 'No participants found');

  // Fetch trip record for template variables
  const trip = await env.DB.prepare('SELECT * FROM trips WHERE id = ?').bind(tripId).first();

  const results = await Promise.allSettled(
    participants.map(p => sendNotification(p, templateKey, trip, env))
  );

  const sent    = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
  const failed  = results.length - sent;

  // Log to D1
  await env.DB.prepare(
    `INSERT INTO notification_log (trip_id, template_key, sent_count, failed_count, triggered_by, created_at)
     VALUES (?, ?, ?, ?, 'manual', datetime('now'))`
  ).bind(tripId, templateKey, sent, failed).run();

  return json({ sent, failed, total: participants.length });
}

// ── Cron: send arrival welcome when flight time passes ────────────────────────

async function checkArrivalNotifications(env) {
  const now = new Date();
  // Find participants whose arrival time is within the last 30 minutes and haven't been notified
  const { results: arriving } = await env.DB.prepare(`
    SELECT tp.*, t.whatsapp_link, t.coordinator, t.name as trip_name
    FROM trip_participants tp
    JOIN trips t ON tp.trip_id = t.id
    WHERE tp.arrival_dt <= datetime('now')
      AND tp.arrival_dt >= datetime('now', '-30 minutes')
      AND tp.arrival_notif_sent = 0
  `).all();

  for (const p of arriving) {
    const result = await sendNotification(p, 'arrival_welcome', { whatsappLink: p.whatsapp_link, coordinator: p.coordinator, name: p.trip_name }, env);
    if (result.ok) {
      await env.DB.prepare('UPDATE trip_participants SET arrival_notif_sent = 1 WHERE id = ?').bind(p.id).run();
      await env.DB.prepare(`
        INSERT INTO notification_log (trip_id, template_key, participant_id, sent_count, failed_count, triggered_by, created_at)
        VALUES (?, 'arrival_welcome', ?, 1, 0, 'cron', datetime('now'))
      `).bind(p.trip_id, p.id).run();
    }
  }
}

// ── Core send function ────────────────────────────────────────────────────────

async function sendNotification(participant, templateKey, trip, env) {
  const text = buildMessage(templateKey, participant, trip);
  const phone = (participant.phone_cc || '+1') + participant.phone?.replace(/\D/g, '');

  // Prefer WhatsApp if participant has opted in; fall back to SMS
  if (participant.whatsapp_opted_in && env.WHATSAPP_PHONE_NUMBER_ID) {
    return sendWhatsApp(phone, text, env);
  }
  return sendSMS(phone, text, env);
}

// ── Twilio SMS ────────────────────────────────────────────────────────────────

async function sendSMS(to, body, env) {
  // Requires env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
  const creds = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: env.TWILIO_FROM_NUMBER, Body: body }),
    }
  );
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, sid: data.sid, error: data.message };
}

// ── WhatsApp Business API (Meta) ──────────────────────────────────────────────

async function sendWhatsApp(to, text, env) {
  // Requires env vars: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN
  // Note: for free-form text outside a 24h window, you must use approved templates.
  // During an active conversation window, free-form text is permitted.
  const res = await fetch(
    `https://graph.facebook.com/v20.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/^\+/, ''),
        type: 'text',
        text: { body: text },
      }),
    }
  );
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, messageId: data.messages?.[0]?.id, error: data.error?.message };
}

// ── Template builder ──────────────────────────────────────────────────────────

const TEMPLATES = {
  pretrip_1wk: (p, t) =>
`Hi ${p.first_name}! 🌟 One week until Honduras! Quick reminders:
✅ Passport valid? Check!
📱 Download WhatsApp if not already
💊 Pack medications in carry-on
🌡️ Check packing list: ${t.slug ? 'https://elcamino.github.io/' + t.slug : '[trip URL]'}
Questions? Reply here or email walker@caminohonduras.com
— CAMINO Team`,

  pretrip_daybefore: (p, t) =>
`Hi ${p.first_name}! Tomorrow's the day! ✈️
🕐 Arrive airport 3hrs early
🧴 Pack DEET in checked bag (not carry-on)
💧 Buy bottled water after customs
📞 Trip leader: ${t.coordinator || 'Walker Somerville'}
🙏 We're praying for your journey!
— Walker & Seiny, CAMINO`,

  arrival_welcome: (p, t) =>
`Welcome to Honduras, ${p.first_name}! 🇭🇳🎉

A few reminders now that you're here:
💧 Drink BOTTLED WATER ONLY — no tap water, ice, or fresh juice
🦟 Apply DEET every 4 hours — dengue mosquitoes are active day AND night
☀️ High heat today — stay hydrated, take breaks in shade
👥 Stay with your group at all times
📱 Join WhatsApp group: ${t.whatsappLink || '[WhatsApp link]'}
🚨 Emergency: [leader phone] | US Embassy: +504 2236-9320

See you soon! 🙏
— CAMINO Team`,

  return_day: (p) =>
`Welcome home, ${p.first_name}! 🏠✈️
You did it — thank you for serving in Honduras.
📋 Watch for: fever, stomach issues, or fatigue in the next 2–4 weeks. If you feel unwell, tell your doctor you traveled to Honduras.
📸 Share your photos! Tag us: @caminohonduras
💌 Your impact report coming soon.
— Walker & Seiny 🙏`,

  posttrip_1wk: (p) =>
`Hi ${p.first_name} — one week home! How are you feeling?
🏥 Reminder: if you have any symptoms (fever, stomach issues, fatigue), see your doctor and mention Honduras travel.
📖 We'd love your story! Reply with one sentence about your experience.
❤️ Thinking of going again? https://elcamino.github.io/trips.html
— CAMINO`,
};

function buildMessage(templateKey, participant, trip) {
  const fn = TEMPLATES[templateKey];
  return fn ? fn(participant, trip || {}) : `[Template "${templateKey}" not found]`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
function jsonErr(status, message) { return json({ error: message }, status); }
