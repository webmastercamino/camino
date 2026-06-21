// CAMINO Honduras — Shared live data utility module
// Used by: public site (index.html, give.html), trip pages
// Admin panel has its own extended feed infrastructure in admin/index.html

(function (global) {
  'use strict';

  var CORS_PROXY = 'https://api.allorigins.win/get?url=';

  // ── fetchWithCache ───────────────────────────────────────────────────────────
  // Returns { data, ts, cached, stale?, error? }
  // opts.useProxy: route through allorigins — data is a raw string (XML or JSON string)
  async function fetchWithCache(url, cacheKey, maxAgeMinutes, opts) {
    opts = opts || {};
    var storageKey = 'camino_lf_' + cacheKey;
    var raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        var p = JSON.parse(raw);
        if ((Date.now() - p.ts) / 60000 < maxAgeMinutes) {
          return { data: p.data, ts: p.ts, cached: true };
        }
      } catch (e) { /* corrupt cache — fall through */ }
    }
    try {
      var fetchUrl = opts.useProxy ? CORS_PROXY + encodeURIComponent(url) : url;
      var ctrl = new AbortController();
      var tid = setTimeout(function () { ctrl.abort(); }, 8000);
      var resp = await fetch(fetchUrl, { signal: ctrl.signal });
      clearTimeout(tid);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var data;
      if (opts.useProxy) {
        var envelope = await resp.json();
        data = envelope.contents; // raw string — caller must parse (XML or JSON)
      } else {
        data = await resp.json();
      }
      localStorage.setItem(storageKey, JSON.stringify({ data: data, ts: Date.now() }));
      return { data: data, ts: Date.now(), cached: false };
    } catch (e) {
      if (raw) {
        try {
          var p2 = JSON.parse(raw);
          return { data: p2.data, ts: p2.ts, cached: true, stale: true };
        } catch (e2) { /* ignore */ }
      }
      return { data: null, ts: null, error: e.message };
    }
  }

  // ── timeAgoLabel ─────────────────────────────────────────────────────────────
  function timeAgoLabel(ts) {
    if (!ts) return 'unknown';
    var mins = Math.round((Date.now() - ts) / 60000);
    if (mins < 2) return 'just now';
    if (mins < 60) return mins + ' min ago';
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.round(hrs / 24);
    return days + 'd ago';
  }

  // ── renderFeedCard ────────────────────────────────────────────────────────────
  // items: [{title, url|link, date}]
  function renderFeedCard(container, items, emptyMessage, ts) {
    if (!container) return;
    var meta = ts
      ? '<p style="font-size:11px;color:#9b9b98;margin:0 0 8px">Last updated: ' + timeAgoLabel(ts) + '</p>'
      : '';
    if (!items || items.length === 0) {
      container.innerHTML = meta
        + '<p style="color:#9b9b98;font-size:13px">' + (emptyMessage || 'No items available.') + '</p>';
      return;
    }
    container.innerHTML = meta + items.map(function (item) {
      var href = item.url || item.link || '#';
      return '<div style="padding:10px 0;border-bottom:1px solid #e8e8e4">'
        + '<a href="' + href + '" target="_blank" rel="noopener" '
        + 'style="font-size:13px;font-weight:600;color:#0F6E56;text-decoration:none;display:block;margin-bottom:3px">'
        + (item.title || 'Untitled') + ' ↗</a>'
        + '<span style="font-size:11px;color:#9b9b98">' + (item.date || '') + '</span>'
        + '</div>';
    }).join('');
  }

  // ── advisoryBadge ─────────────────────────────────────────────────────────────
  function advisoryBadge(level) {
    var configs = {
      1: { color: '#16a34a', bg: '#f0fdf4', label: 'Level 1 — Exercise Normal Precautions', icon: '🟢' },
      2: { color: '#d97706', bg: '#fffbeb', label: 'Level 2 — Exercise Increased Caution',  icon: '🟡' },
      3: { color: '#ea580c', bg: '#fff7ed', label: 'Level 3 — Reconsider Travel',            icon: '🟠' },
      4: { color: '#dc2626', bg: '#fef2f2', label: 'Level 4 — Do Not Travel',               icon: '🔴' },
    };
    var cfg = configs[level] || configs[2];
    return '<span style="display:inline-flex;align-items:center;gap:6px;background:' + cfg.bg
      + ';color:' + cfg.color + ';border:1px solid ' + cfg.color + '44;border-radius:8px;'
      + 'padding:5px 12px;font-size:13px;font-weight:600">'
      + cfg.icon + ' US Travel Advisory: ' + cfg.label + '</span>';
  }

  // ── parseRSS ──────────────────────────────────────────────────────────────────
  function parseRSS(xmlString) {
    try {
      var doc = new DOMParser().parseFromString(xmlString, 'text/xml');
      return Array.from(doc.querySelectorAll('item')).slice(0, 5).map(function (it) {
        return {
          title: (it.querySelector('title') || {}).textContent || '',
          url:   (it.querySelector('link')  || {}).textContent || '',
          date:  (it.querySelector('pubDate') || {}).textContent || ''
        };
      });
    } catch (e) {
      return [];
    }
  }

  // ── fetchWorldBankHonduras ────────────────────────────────────────────────────
  // Returns { poverty, gdpPerCapita, population, unemployment, lifeExpectancy }
  // Each value is { value, year, ts } or undefined if unavailable
  async function fetchWorldBankHonduras() {
    var WEEK_MINS = 7 * 24 * 60;
    var indicators = [
      { key: 'poverty',        code: 'SI.POV.NAHC'   },
      { key: 'gdpPerCapita',   code: 'NY.GDP.PCAP.CD' },
      { key: 'population',     code: 'SP.POP.TOTL'   },
      { key: 'unemployment',   code: 'SL.UEM.TOTL.ZS' },
      { key: 'lifeExpectancy', code: 'SP.DYN.LE00.IN' },
    ];
    var results = {};
    await Promise.all(indicators.map(async function (ind) {
      var url = 'https://api.worldbank.org/v2/country/HN/indicator/' + ind.code + '?format=json&mrv=1';
      var result = await fetchWithCache(url, 'wb_hn_' + ind.key, WEEK_MINS);
      if (result.data && result.data[1] && result.data[1][0] && result.data[1][0].value != null) {
        results[ind.key] = {
          value: result.data[1][0].value,
          year:  result.data[1][0].date,
          ts:    result.ts
        };
      }
    }));
    return results;
  }

  // ── fetchStateDeptAdvisory ────────────────────────────────────────────────────
  async function fetchStateDeptAdvisory() {
    var url = 'https://travel.state.gov/content/travel/en/rss.html';
    var result = await fetchWithCache(url, 'state_advisory', 24 * 60, { useProxy: true });
    if (!result.data) return null;
    var items = parseRSS(result.data);
    // Prefer Honduras-specific items
    var hn = items.filter(function (i) {
      return (i.title + i.url).toLowerCase().includes('honduras');
    });
    return {
      items: hn.length ? hn : items.slice(0, 3),
      ts: result.ts,
      stale: result.stale || false,
      error: result.error || null
    };
  }

  // ── fetchOpenMeteo ────────────────────────────────────────────────────────────
  // Free weather API — no key needed. ~Comayagua/Cortés region.
  async function fetchOpenMeteo() {
    var url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=15.5&longitude=-88.0'
      + '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum'
      + '&timezone=America%2FTegucigalpa&forecast_days=7';
    return fetchWithCache(url, 'openmeteo_hn', 6 * 60);
  }

  // ── renderWeatherWidget ───────────────────────────────────────────────────────
  function renderWeatherWidget(container, weatherData, ts) {
    if (!container) return;
    if (!weatherData || !weatherData.daily) {
      container.innerHTML = '<p style="font-size:13px;color:#9b9b98">Weather data unavailable. '
        + '<a href="https://forecast.weather.gov" target="_blank" rel="noopener" style="color:#0F6E56">Check forecast.weather.gov ↗</a></p>';
      return;
    }
    var d = weatherData.daily;
    var days  = d.time || [];
    var maxT  = d.temperature_2m_max || [];
    var minT  = d.temperature_2m_min || [];
    var precip = d.precipitation_sum || [];
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    function cToF(c) { return Math.round(c * 9 / 5 + 32); }
    function rainIcon(mm) {
      if (mm == null) return '';
      if (mm === 0)   return '☀️';
      if (mm < 5)     return '🌤 ' + mm.toFixed(1) + 'mm';
      return '🌧 ' + mm.toFixed(1) + 'mm';
    }

    var cards = days.slice(0, 7).map(function (dateStr, i) {
      var date = new Date(dateStr + 'T12:00:00');
      var dayName = dayNames[date.getDay()];
      var hi = maxT[i] != null ? cToF(maxT[i]) + '°F' : '—';
      var lo = minT[i] != null ? cToF(minT[i]) + '°' : '—';
      var isToday = i === 0;
      return '<div style="text-align:center;padding:9px 5px;background:'
        + (isToday ? '#e1f5ee' : '#f8f8f6')
        + ';border-radius:8px;border:1.5px solid '
        + (isToday ? '#0F6E56' : '#e0e0e0') + ';min-width:0">'
        + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#6b6b68;margin-bottom:2px">'
        + (isToday ? 'Today' : dayName) + '</div>'
        + '<div style="font-size:14px;font-weight:700;color:#1a1a18">' + hi + '</div>'
        + '<div style="font-size:11px;color:#9b9b98">' + lo + ' lo</div>'
        + '<div style="font-size:11px;color:#0F6E56;margin-top:3px">' + rainIcon(precip[i]) + '</div>'
        + '</div>';
    }).join('');

    var lastUpdated = ts
      ? '<span>Last updated: ' + timeAgoLabel(ts) + '</span>'
      : '';

    container.innerHTML = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px;overflow-x:auto">'
      + cards + '</div>'
      + '<p style="font-size:11px;color:#9b9b98;margin:4px 0 0;display:flex;gap:16px;flex-wrap:wrap">'
      + '<span>7-day forecast · Comayagua / Cortés region · conditions vary by elevation.</span>'
      + lastUpdated + '</p>';
  }

  // ── initTripPage ──────────────────────────────────────────────────────────────
  async function initTripPage() {
    // Advisory banners
    var bannerEl = document.getElementById('tripAdvisoryBanner');
    if (bannerEl) {
      // Build advisory HTML
      var advisoryResult = await fetchStateDeptAdvisory();
      var level = 2; // Honduras default
      var advisoryUrl = 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/Honduras.html';
      var advisoryTitle = 'Honduras — Exercise Increased Caution';

      if (advisoryResult && advisoryResult.items && advisoryResult.items.length) {
        var item = advisoryResult.items[0];
        var t = (item.title || '').toLowerCase();
        if (/level 1|normal precaution/i.test(t)) level = 1;
        else if (/level 3|reconsider/i.test(t)) level = 3;
        else if (/level 4|do not travel/i.test(t)) level = 4;
        if (item.url) advisoryUrl = item.url;
        if (item.title) advisoryTitle = item.title;
      }

      var staleNote = (advisoryResult && advisoryResult.stale)
        ? ' <span style="font-size:11px;color:#d97706">⚠️ Cached — ' + timeAgoLabel(advisoryResult && advisoryResult.ts) + '</span>'
        : '';

      // PAHO health advisory — try to fetch, fall back to static
      var healthHtml = '<div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;'
        + 'padding:12px 16px;display:flex;align-items:flex-start;gap:10px">'
        + '<span style="font-size:18px">🟢</span>'
        + '<div>'
        + '<div style="font-size:13px;font-weight:600;color:#15803d;margin-bottom:3px">'
        + 'No active PAHO outbreak alerts for Honduras</div>'
        + '<p style="font-size:12px;color:#6b6b68;margin:0">As of June 2026. Consult your doctor 4–6 weeks before travel. '
        + '<a href="https://www.paho.org/en/honduras" target="_blank" rel="noopener" style="color:#0F6E56">PAHO Honduras page ↗</a></p>'
        + '</div></div>';

      // Try PAHO feed via proxy
      try {
        var pahoResult = await fetchWithCache(
          'https://www.paho.org/en/rss.xml',
          'paho_rss', 24 * 60,
          { useProxy: true }
        );
        if (pahoResult.data) {
          var pahoItems = parseRSS(pahoResult.data).filter(function (i) {
            return /honduras|hnd/i.test(i.title + i.url);
          });
          if (pahoItems.length) {
            healthHtml = '<div style="background:#fffbeb;border:1.5px solid #fbbf24;border-radius:10px;'
              + 'padding:12px 16px;display:flex;align-items:flex-start;gap:10px">'
              + '<span style="font-size:18px">⚠️</span>'
              + '<div>'
              + '<div style="font-size:13px;font-weight:600;color:#92400e;margin-bottom:3px">'
              + 'Health notice: ' + pahoItems[0].title + '</div>'
              + '<p style="font-size:12px;color:#6b6b68;margin:0">Consult your doctor before travel. '
              + '<a href="' + (pahoItems[0].url || 'https://www.paho.org/en/honduras')
              + '" target="_blank" rel="noopener" style="color:#0F6E56">View PAHO report ↗</a></p>'
              + '</div></div>';
          }
        }
      } catch (e) { /* silent fallback */ }

      bannerEl.innerHTML = '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">'
        + healthHtml
        + '<div style="background:#fffbeb;border:1.5px solid #fbbf24;border-radius:10px;padding:12px 16px">'
        + '<div style="margin-bottom:6px">' + advisoryBadge(level) + '</div>'
        + '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
        + '<a href="' + advisoryUrl + '" target="_blank" rel="noopener" '
        + 'style="font-size:12px;color:#0F6E56">View full State Dept advisory ↗</a>'
        + staleNote
        + '</div>'
        + '<p style="font-size:12px;color:#6b6b68;margin:6px 0 0">'
        + 'CAMINO monitors all advisories and will communicate any changes that affect your trip.</p>'
        + '</div>'
        + '</div>';
    }

    // Weather widget
    var weatherEl = document.getElementById('tripWeatherWidget');
    if (weatherEl) {
      weatherEl.innerHTML = '<p style="font-size:12px;color:#9b9b98">⟳ Loading 7-day forecast…</p>';
      var weatherResult = await fetchOpenMeteo();
      if (weatherResult.data) {
        renderWeatherWidget(weatherEl, weatherResult.data, weatherResult.ts);
      } else {
        weatherEl.innerHTML = '<p style="font-size:13px;color:#6b6b68">Expect 85–95°F (29–35°C) with high humidity. '
          + 'July is rainy season — afternoon showers are common, mornings usually clear. '
          + 'The work site is fully exposed. Pack a poncho and moisture-wicking fabrics.</p>'
          + '<p style="font-size:11px;color:#9b9b98">Live forecast unavailable. '
          + '<a href="https://forecast.weather.gov" target="_blank" rel="noopener" style="color:#0F6E56">'
          + 'Check weather.gov ↗</a></p>';
      }
    }
  }

  // ── initPublicPage ────────────────────────────────────────────────────────────
  async function initPublicPage() {
    var wb = await fetchWorldBankHonduras();

    // Honduras context bar on index.html
    var statsCtxEl = document.getElementById('hnStatsContext');
    if (statsCtxEl) {
      var pop = (wb.population && wb.population.value)
        ? (wb.population.value / 1e6).toFixed(1) + ' million'
        : '—';
      var pov = (wb.poverty && wb.poverty.value != null)
        ? wb.poverty.value.toFixed(1) + '%'
        : '~62%';
      var gdp = (wb.gdpPerCapita && wb.gdpPerCapita.value)
        ? '$' + Math.round(wb.gdpPerCapita.value).toLocaleString()
        : '—';
      var year = (wb.poverty && wb.poverty.year) || (wb.gdpPerCapita && wb.gdpPerCapita.year) || '';
      statsCtxEl.innerHTML = '<strong>Honduras:</strong> population ' + pop
        + ' | <strong>' + pov + '</strong> live below the national poverty line'
        + ' | GDP per capita ' + gdp
        + ' <span style="font-size:10px;color:#9b9b98"> — Source: World Bank'
        + (year ? ' (' + year + ')' : '') + '</span>';
    }

    // Poverty stat-num on index.html (updates the "18%" static stat)
    var povNumEl = document.getElementById('wbPovertyNum');
    if (povNumEl && wb.poverty && wb.poverty.value != null) {
      povNumEl.textContent = Math.round(wb.poverty.value) + '%';
    }

    // Honduras context card on give.html
    var povSpan = document.querySelector('#hnContextCard .hn-pov-num');
    var yearSpan = document.querySelector('#hnContextCard .hn-pov-year');
    if (povSpan && wb.poverty && wb.poverty.value != null) {
      povSpan.textContent = wb.poverty.value.toFixed(1) + '%';
      if (yearSpan) yearSpan.textContent = 'Source: World Bank ' + (wb.poverty.year || '');
    }
  }

  // ── Auto-detect page and initialize ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    var isTripPage   = !!(document.getElementById('tripAdvisoryBanner') || document.getElementById('tripWeatherWidget'));
    var isPublicPage = !!(document.getElementById('hnStatsContext') || document.getElementById('wbPovertyNum') || document.getElementById('hnContextCard'));

    if (isTripPage)   initTripPage();
    if (isPublicPage) initPublicPage();
  });

  // ── Expose utilities for external use ────────────────────────────────────────
  global.CAMINO = global.CAMINO || {};
  global.CAMINO.lf = {
    fetchWithCache:        fetchWithCache,
    timeAgoLabel:          timeAgoLabel,
    renderFeedCard:        renderFeedCard,
    advisoryBadge:         advisoryBadge,
    parseRSS:              parseRSS,
    fetchWorldBankHonduras: fetchWorldBankHonduras,
    fetchStateDeptAdvisory: fetchStateDeptAdvisory,
    fetchOpenMeteo:        fetchOpenMeteo,
    renderWeatherWidget:   renderWeatherWidget
  };

}(window));
