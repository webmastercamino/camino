// ── Site-wide dark / light mode ──────────────────────────────────
(function () {
  const THEME_KEY = 'camino_theme';
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.textContent = theme === 'dark' ? '☀ Light mode' : '🌙 Dark mode';
      btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    });
  }
  function toggleTheme() {
    applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
  }
  // Apply on load (default light)
  applyTheme(localStorage.getItem(THEME_KEY) || 'light');

  // Inject toggle button into desktop nav and mobile menu once DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.createElement('button');
    btn.className = 'theme-toggle-btn';
    btn.onclick = toggleTheme;
    const navRight = document.querySelector('.nav-right, .site-nav, nav');
    if (navRight) navRight.appendChild(btn);
    // Also add to mobile menu footer if present
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
      const mb = btn.cloneNode(true);
      mb.className = 'theme-toggle-btn';
      mb.style.cssText = 'margin:12px 16px 4px;width:calc(100% - 32px)';
      mb.onclick = toggleTheme;
      mobileMenu.appendChild(mb);
    }
    // Re-apply so button labels update correctly after inject
    applyTheme(localStorage.getItem(THEME_KEY) || 'light');
  });
})();
// ──────────────────────────────────────────────────────────────────

// Mobile nav
const toggle  = document.getElementById('navToggle');
const menu    = document.getElementById('mobileMenu');
const overlay = document.getElementById('navOverlay');

function closeMenu() {
  if (!menu) return;
  menu.classList.remove('is-open');
  overlay && overlay.classList.remove('is-open');
  if (toggle) {
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  document.body.style.overflow = '';
}

if (toggle && menu) {
  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    overlay && overlay.classList.toggle('is-open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  });
}
overlay && overlay.addEventListener('click', closeMenu);
menu && menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

// Tab switching — supports ARIA tablist pattern (role="tab") and plain .tab-btn
const ariaTabBtns = document.querySelectorAll('.tab-btn[role="tab"]');
if (ariaTabBtns.length) {
  function activateTab(btn) {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn[role="tab"]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
      b.setAttribute('tabindex', '-1');
    });
    document.querySelectorAll('.tab-panel[role="tabpanel"]').forEach(p => {
      p.classList.remove('active');
      p.setAttribute('tabindex', '-1');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    btn.setAttribute('tabindex', '0');
    const panel = document.getElementById(target);
    if (panel) {
      panel.classList.add('active');
      panel.setAttribute('tabindex', '0');
    }
  }

  ariaTabBtns.forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn));
    btn.addEventListener('keydown', e => {
      const btns = [...document.querySelectorAll('.tab-btn[role="tab"]')];
      const idx  = btns.indexOf(btn);
      let next   = null;
      if (e.key === 'ArrowRight') next = btns[(idx + 1) % btns.length];
      if (e.key === 'ArrowLeft')  next = btns[(idx - 1 + btns.length) % btns.length];
      if (e.key === 'Home')       next = btns[0];
      if (e.key === 'End')        next = btns[btns.length - 1];
      if (next) { next.focus(); activateTab(next); e.preventDefault(); }
    });
  });
} else {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(target);
      if (panel) panel.classList.add('active');
    });
  });
}

// Countdown (trip pages — set data-departure="YYYY-MM-DD" on .countdown element)
const countdownEl = document.querySelector('.countdown[data-departure]');
if (countdownEl) {
  const departure = new Date(countdownEl.dataset.departure + 'T00:00:00');
  function updateCountdown() {
    const now = new Date();
    const diff = departure - now;
    if (diff <= 0) {
      countdownEl.innerHTML = '<span style="color:var(--amber-mid);font-size:18px;font-weight:700;padding:8px 0">Trip is underway — safe travels! ✈️</span>';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    countdownEl.querySelector('[data-unit=days]').textContent   = String(d).padStart(2,'0');
    countdownEl.querySelector('[data-unit=hours]').textContent  = String(h).padStart(2,'0');
    countdownEl.querySelector('[data-unit=mins]').textContent   = String(m).padStart(2,'0');
    countdownEl.querySelector('[data-unit=secs]').textContent   = String(s).padStart(2,'0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// Packing checklist — persist checked state in localStorage
document.querySelectorAll('.checklist-item input[type=checkbox]').forEach(cb => {
  const key = 'pack_' + (cb.id || cb.closest('label')?.textContent?.trim().slice(0,20));
  if (localStorage.getItem(key) === '1') { cb.checked = true; cb.closest('.checklist-item')?.classList.add('checked'); }
  cb.addEventListener('change', () => {
    localStorage.setItem(key, cb.checked ? '1' : '0');
    cb.closest('.checklist-item')?.classList.toggle('checked', cb.checked);
  });
});

// Custom swag order form
const orderForm = document.getElementById('orderForm');
if (orderForm) {
  orderForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = orderForm.querySelector('button[type=submit]');
    btn.textContent = 'Request received! We\'ll contact you within 48 hours.';
    btn.disabled = true;
    btn.style.background = '#0F6E56';
  });
}

// Contact form — submits to Formspree (action URL set on the form element)
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        btn.textContent = 'Message sent — thank you!';
        btn.style.background = '#0F6E56';
      } else {
        btn.textContent = 'Send failed — email us directly';
        btn.disabled = false;
        btn.style.background = '#DC2626';
      }
    } catch {
      btn.textContent = 'Send failed — email us directly';
      btn.disabled = false;
    }
  });
}
