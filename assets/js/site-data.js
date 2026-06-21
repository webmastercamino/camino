// ──────────────────────────────────────────────────────────────
// CAMINO site-data.js
// Walker: update these two numbers whenever a home is completed.
// Every CTA and counter on the site reads from here automatically.
// ──────────────────────────────────────────────────────────────
var CAMINO = {
  homesBuilt:    247,   // ← update this when a home is finished
  milestoneHome: 250    // ← the next big milestone (change when milestone passed)
};

// Derived values — no need to touch these
CAMINO.nextHome  = CAMINO.homesBuilt + 1;
CAMINO.remaining = CAMINO.milestoneHome - CAMINO.homesBuilt;

// Auto-populate any element with a data-camino attribute:
//   data-camino="built"     → current homes built (247)
//   data-camino="next"      → next home number (248)
//   data-camino="milestone" → milestone target (250)
//   data-camino="remain"    → homes left to milestone (3)
document.addEventListener('DOMContentLoaded', function () {
  var map = {
    built:     CAMINO.homesBuilt,
    next:      CAMINO.nextHome,
    milestone: CAMINO.milestoneHome,
    remain:    CAMINO.remaining
  };
  Object.keys(map).forEach(function (key) {
    document.querySelectorAll('[data-camino="' + key + '"]').forEach(function (el) {
      el.textContent = map[key];
    });
  });

  // Milestone progress bar
  var fill = document.getElementById('milestoneFill');
  if (fill) {
    var pct = (CAMINO.homesBuilt / CAMINO.milestoneHome * 100).toFixed(1);
    fill.style.width = pct + '%';
    var bar = fill.closest('[role="progressbar"]');
    if (bar) bar.setAttribute('aria-valuenow', CAMINO.homesBuilt);
  }
});
