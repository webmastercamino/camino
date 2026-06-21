/**
 * CAMINO Honduras — Policy Monitor Worker
 * Cloudflare Scheduled Worker
 * Cron: "0 8 * * 1"  →  every Monday at 08:00 UTC
 *
 * Bindings required (wrangler.toml):
 *   KV:  POLICY_STORE
 *   Env: RESEND_API_KEY, BOARD_EMAIL_LIST (comma-separated), FROM_EMAIL, ORG_NAME
 */

const CORS_PROXY = 'https://api.allorigins.win/get?url=';

const FEEDS = [
  {
    id: 'advisory',
    label: 'State Dept Travel Advisory — Honduras',
    url: 'https://travel.state.gov/content/travel/en/rss.html',
    via: 'proxy_rss',
    filter: /honduras/i,
  },
  {
    id: 'embassy',
    label: 'US Embassy Tegucigalpa — Alerts',
    url: 'https://hn.usembassy.gov/feed/',
    via: 'proxy_rss',
    filter: null,
  },
  {
    id: 'reliefweb',
    label: 'ReliefWeb — Honduras Reports',
    url: 'https://api.reliefweb.int/v1/reports?filter[field]=country.iso3&filter[value]=HND&limit=5&sort[]=date:desc',
    via: 'direct_json',
    parseJson: data => (data.data || []).map(r => ({
      title: r.fields.title || '',
      link: r.fields.url || '',
      date: r.fields.date?.created || '',
    })),
  },
  {
    id: 'insightcrime',
    label: 'InSight Crime — Honduras Security',
    url: 'https://insightcrime.org/news/brief/feed/',
    via: 'proxy_rss',
    filter: /honduras/i,
  },
  {
    id: 'who',
    label: 'WHO — Disease Outbreak News',
    url: 'https://www.who.int/rss-feeds/news-english.xml',
    via: 'proxy_rss',
    filter: /honduras|central america|outbreak/i,
  },
  {
    id: 'wola',
    label: 'WOLA — Washington Office on Latin America',
    url: 'https://www.wola.org/feed/',
    via: 'proxy_rss',
    filter: /honduras/i,
  },
];

// ─── Main scheduled handler ────────────────────────────────────────────────

export default {
  async scheduled(event, env, ctx) {
    const results = await Promise.allSettled(FEEDS.map(feed => fetchFeed(feed, env)));

    const fetchedFeeds = results
      .map((r, i) => ({ feed: FEEDS[i], result: r.status === 'fulfilled' ? r.value : null, error: r.reason }))
      .filter(f => f.result);

    // Load previous state from KV
    const prevStateRaw = await env.POLICY_STORE.get('latest_feed_state', { type: 'json' });
    const prevState = prevStateRaw || {};

    // Detect changes
    const changes = detectChanges(fetchedFeeds, prevState);

    // Save new state to KV
    const newState = {};
    fetchedFeeds.forEach(({ feed, result }) => {
      newState[feed.id] = { ts: Date.now(), items: result.slice(0, 5) };
    });
    await env.POLICY_STORE.put('latest_feed_state', JSON.stringify(newState));

    // Advisory level change — send immediate alert
    const advisoryChange = changes.find(c => c.type === 'advisory_level_changed');
    if (advisoryChange) {
      await sendAdvisoryAlert(advisoryChange, env);
    }

    // Weekly digest — always send on Monday
    await sendWeeklyDigest(fetchedFeeds, changes, env);
  },
};

// ─── Feed fetchers ─────────────────────────────────────────────────────────

async function fetchFeed(feed, env) {
  if (feed.via === 'direct_json') {
    const resp = await fetchWithTimeout(feed.url, 8000);
    const json = await resp.json();
    return feed.parseJson ? feed.parseJson(json) : [];
  }

  if (feed.via === 'proxy_rss') {
    const proxyUrl = CORS_PROXY + encodeURIComponent(feed.url);
    const resp = await fetchWithTimeout(proxyUrl, 10000);
    const json = await resp.json();
    const items = parseRSS(json.contents || '');
    return feed.filter ? items.filter(it => feed.filter.test(it.title + ' ' + it.desc)) : items;
  }

  return [];
}

function parseRSS(xml) {
  // Minimal RSS parser for Cloudflare Workers (no DOM)
  const items = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    items.push({
      title: extractTag(block, 'title'),
      link:  extractTag(block, 'link'),
      date:  extractTag(block, 'pubDate'),
      desc:  extractTag(block, 'description').replace(/<[^>]*>/g, '').trim().slice(0, 300),
    });
    if (items.length >= 10) break;
  }
  return items;
}

function extractTag(str, tag) {
  const m = str.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return (m && (m[1] || m[2] || '')).trim();
}

async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
  try {
    const resp = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);
    return resp;
  } catch (e) {
    clearTimeout(tid);
    throw e;
  }
}

// ─── Change detection ──────────────────────────────────────────────────────

function detectChanges(fetchedFeeds, prevState) {
  const changes = [];
  const weekAgo = Date.now() - 7 * 86400000;

  for (const { feed, result } of fetchedFeeds) {
    const prev = prevState[feed.id];
    const prevTitles = new Set((prev?.items || []).map(it => it.title));

    const newItems = result.filter(it => !prevTitles.has(it.title));
    const freshItems = result.filter(it => it.date && new Date(it.date) > weekAgo);

    if (feed.id === 'advisory' && result[0]) {
      const lvlMatch = result[0].title.match(/Level\s+(\d)/i);
      if (lvlMatch) {
        const newLevel = parseInt(lvlMatch[1]);
        const prevLevel = prev?.advisoryLevel;
        if (prevLevel && newLevel !== prevLevel) {
          changes.push({ type: 'advisory_level_changed', from: prevLevel, to: newLevel, item: result[0] });
        }
        // Store advisory level
        prevState[feed.id] = { ...(prevState[feed.id] || {}), advisoryLevel: newLevel };
      }
    }

    if (newItems.length) {
      changes.push({ type: 'new_items', feedId: feed.id, feedLabel: feed.label, items: newItems.slice(0, 3) });
    }

    if (freshItems.length) {
      changes.push({ type: 'fresh_items', feedId: feed.id, feedLabel: feed.label, items: freshItems.slice(0, 3) });
    }
  }

  return changes;
}

// ─── Email helpers ─────────────────────────────────────────────────────────

async function sendAdvisoryAlert(change, env) {
  const subject = `🚨 URGENT: Honduras Travel Advisory Level Changed — Level ${change.from} → Level ${change.to}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#dc2626;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
        <h2 style="margin:0">⚠️ Advisory Level Change — Action Required</h2>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;padding:24px;border-radius:0 0 8px 8px">
        <p><strong>Level ${change.from} → Level ${change.to}</strong></p>
        <p>The US State Department has changed the Honduras Travel Advisory level.</p>
        <h3>Affected Item:</h3>
        <p><strong>${change.item.title}</strong><br>
        <a href="${change.item.link}">${change.item.link}</a></p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
        <p><strong>Immediate action items:</strong></p>
        <ul>
          <li>Review the updated advisory at travel.state.gov</li>
          <li>Assess impact on upcoming trips and volunteer communications</li>
          <li>Notify active trip participants</li>
          <li>Consult with Walker (in-country) on current conditions</li>
          <li>Update the CAMINO admin Policy & Risk Watch dashboard</li>
        </ul>
        <p style="font-size:12px;color:#6b7280">Sent by CAMINO Policy Monitor Worker · ${new Date().toUTCString()}</p>
      </div>
    </div>`;

  await sendEmail(subject, html, env);
}

async function sendWeeklyDigest(fetchedFeeds, changes, env) {
  const subject = `📋 CAMINO Weekly Policy & Risk Digest — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  const newItemChanges = changes.filter(c => c.type === 'new_items');
  const advisoryChange = changes.find(c => c.type === 'advisory_level_changed');

  let html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#0F6E56;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
        <h2 style="margin:0">📋 CAMINO Weekly Policy & Risk Digest</h2>
        <p style="margin:4px 0 0;opacity:.85;font-size:14px">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;padding:24px;border-radius:0 0 8px 8px">`;

  if (advisoryChange) {
    html += `<div style="background:#fee2e2;border-left:4px solid #dc2626;padding:12px 16px;border-radius:0 4px 4px 0;margin-bottom:20px">
      <strong>🚨 Advisory Level Changed: Level ${advisoryChange.from} → Level ${advisoryChange.to}</strong>
    </div>`;
  }

  if (newItemChanges.length === 0) {
    html += `<p style="color:#6b7280">No new items detected across monitored feeds this week.</p>`;
  } else {
    for (const change of newItemChanges) {
      html += `<h3 style="font-size:14px;font-weight:700;margin:16px 0 8px;color:#374151">${change.feedLabel}</h3>`;
      for (const item of change.items) {
        html += `<div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #f3f4f6">
          <a href="${item.link || '#'}" style="font-weight:600;color:#0F6E56;text-decoration:none">${item.title}</a>
          ${item.date ? `<div style="font-size:12px;color:#9ca3af;margin-top:2px">${new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>` : ''}
        </div>`;
      }
    }
  }

  html += `
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
        <p style="font-size:13px;color:#6b7280">
          <strong>${fetchedFeeds.length}</strong> feeds monitored ·
          <a href="https://elcamino.github.io/admin/" style="color:#0F6E56">Open Admin Panel</a>
        </p>
        <p style="font-size:11px;color:#9ca3af;margin-top:8px">CAMINO Honduras Policy Monitor · Scheduled weekly on Mondays · Unsubscribe by removing your email from the BOARD_EMAIL_LIST env var.</p>
      </div>
    </div>`;

  await sendEmail(subject, html, env);
}

async function sendEmail(subject, html, env) {
  const recipients = (env.BOARD_EMAIL_LIST || '').split(',').map(e => e.trim()).filter(Boolean);
  if (!recipients.length) {
    console.log('No BOARD_EMAIL_LIST configured — skipping email send.');
    return;
  }

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL || 'policy-monitor@caminohonduras.org',
      to: recipients,
      subject,
      html,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error('Resend API error:', err);
  }
}
