/* ════════════════════════════════════════════════════════════════
   PipingPro Academy — PDF Report Gate v2.0  (TIER-AWARE)
   ────────────────────────────────────────────────────────────────
   Gates the shared report engine (ppaOpenReport) by TIER, not by a
   logged-in boolean. A Student no longer gets PDF reports from a
   Professional calculator.

   CHANGES FROM v1.0
   • Access now keys on window.PPA.hasAccess(THIS_CALC), i.e. the
     member's plan vs the tier THIS calculator requires.
   • Fails CLOSED if the tier library or page id is missing.
   • Removed the ?preview_member=1 and ?admin=... URL bypasses
     (client-side backdoors — must not ship to a paid site).
   • Fixed stale upsell copy ($10 → real pricing) and the dead
     /membership link (→ index.html#pricing).

   REQUIRES
   • /ppa-tier.js loaded BEFORE this file.
   • Each calculator page must expose its id as  window.THIS_CALC
     (e.g.  window.THIS_CALC = 'sp';  near the top of the page).

   INSTALL  (unchanged — last, before </body>)
       <script src="/ppa-tier.js"></script>
       ... report engine ...
       <script src="/ppa-report-gate.js"></script>
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Tier-aware access check for THIS page ────────────────────────
  function allowed() {
    // Admin still works via the localStorage flag (set out-of-band,
    // not via a URL anyone can paste).
    if (localStorage.getItem('ppa_admin') === '1') return true;

    var id  = window.THIS_CALC;
    var PPA = window.PPA;

    // Fail closed: if we can't determine the page's required tier or
    // the resolver isn't loaded, deny rather than leak.
    if (!PPA || typeof PPA.hasAccess !== 'function' || !id) return false;

    return PPA.hasAccess(id);
  }

  // ── Upsell modal (self-injecting) ────────────────────────────────
  function showUpsell() {
    var existing = document.getElementById('ppa-rpt-upsell');
    if (existing) { existing.style.display = 'flex'; return; }

    var m = document.createElement('div');
    m.id = 'ppa-rpt-upsell';
    m.style.cssText =
      'position:fixed;inset:0;background:rgba(26,21,16,.6);z-index:10001;' +
      'display:flex;align-items:center;justify-content:center;padding:1rem';
    m.innerHTML =
      '<div style="background:#faf6ef;border-radius:12px;max-width:340px;width:100%;' +
      'overflow:hidden;box-shadow:0 16px 60px rgba(0,0,0,.3)">' +
        '<div style="background:#1a1510;padding:1.4rem;text-align:center">' +
          '<div style="font-size:1.8rem;margin-bottom:.4rem">📄</div>' +
          '<div style="font-family:\'DM Serif Display\',Georgia,serif;color:#fff;' +
          'font-size:1.1rem;line-height:1.3">Download the PDF report</div>' +
          '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;' +
          'letter-spacing:.1em;text-transform:uppercase;color:#b8860b;margin-top:.3rem">' +
          'Professional feature</div>' +
        '</div>' +
        '<div style="padding:1.2rem 1.4rem 1.3rem;text-align:center">' +
          '<p style="font-size:12.5px;color:#4a3f30;line-height:1.7;margin:0 0 1rem">' +
          'The calculation is free to use. Project-ready PDF reports are included with a ' +
          '<strong style="color:#1a1510">PipingPro Academy Professional plan</strong> — along with ' +
          'every calculator and course.</p>' +
          '<a href="/index.html#pricing" ' +
          'style="display:block;background:#8b3a1a;color:#fff;text-decoration:none;' +
          'font-weight:600;font-size:13px;padding:11px;border-radius:8px;margin-bottom:.5rem">' +
          'See plans &amp; upgrade →</a>' +
          '<button type="button" id="ppa-rpt-upsell-dismiss" ' +
          'style="width:100%;background:none;border:none;font-size:11px;color:#6b5d49;' +
          'cursor:pointer;padding:4px;font-family:\'DM Sans\',sans-serif">Maybe later</button>' +
        '</div>' +
      '</div>';

    m.addEventListener('click', function (e) {
      if (e.target === m) m.style.display = 'none';
    });
    document.body.appendChild(m);
    var btn = document.getElementById('ppa-rpt-upsell-dismiss');
    if (btn) btn.addEventListener('click', function () { m.style.display = 'none'; });
  }

  // ── Wrap the existing report engine entry point ──────────────────
  function installGate() {
    if (typeof window.ppaOpenReport !== 'function') return false;
    if (window.ppaOpenReport.__gated) return true;

    var original = window.ppaOpenReport;
    var wrapped = function () {
      if (!allowed()) { showUpsell(); return; }
      return original.apply(this, arguments);
    };
    wrapped.__gated = true;
    window.ppaOpenReport = wrapped;
    return true;
  }

  // Refresh the cached tier from Memberstack on load, then install.
  function boot() {
    if (window.PPA && typeof window.PPA.resolveTier === 'function') {
      window.PPA.resolveTier().finally(installGate);
    } else {
      installGate(); // fails closed inside allowed() if PPA missing
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
