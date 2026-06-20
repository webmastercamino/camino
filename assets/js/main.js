// Mobile nav
const toggle  = document.getElementById('navToggle');
const menu    = document.getElementById('mobileMenu');
const overlay = document.getElementById('navOverlay');

function closeMenu() {
  if (!menu) return;
  menu.classList.remove('is-open');
  overlay && overlay.classList.remove('is-open');
  toggle && toggle.classList.remove('is-open');
  document.body.style.overflow = '';
}

if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    overlay && overlay.classList.toggle('is-open', open);
    toggle.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
}
overlay && overlay.addEventListener('click', closeMenu);
menu && menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

// Tab switching (trip tracker pages)
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

// Contact form — simple client-side feedback
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    btn.textContent = 'Message sent — thank you!';
    btn.disabled = true;
    btn.style.background = '#0F6E56';
  });
}
