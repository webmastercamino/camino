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
