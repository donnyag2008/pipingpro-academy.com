/* ════════════════════════════════════════════════════════════════
   PipingPro Academy — PDF Report Gate v1.0
   ────────────────────────────────────────────────────────────────
   Gates the shared report engine (ppaOpenReport) to members only.
   The calculation stays free; the downloadable PDF report is a
   members feature.

   HOW IT WORKS
   • Wraps the existing global ppaOpenReport(). No edits needed
     inside the report engine itself.
   • A non-member who clicks "Download PDF Report" sees an upgrade
     prompt instead of the report form.
   • A member (or admin) passes straight through — unchanged behaviour.

   INSTALL
   Add ONE line before </body>, AFTER the shared report engine block:
       <script src="/ppa-report-gate.js"></script>
   (Put it last so ppaOpenReport already exists when this runs.)

   TESTING
   • Append ?preview_member=1  to the URL → treated as a member.
   • Append ?admin=PPA-ADMIN-2026 to the URL → sets admin + member.
   • With neither, you'll see the non-member upsell.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Member / admin check (mirrors calculators.html) ──────────────
  function isMember() {
    try {
      var p = new URLSearchParams(location.search);
      if (p.get('preview_member') === '1') return true;            // testing bypass
      if (p.get('admin') === 'PPA-ADMIN-2026') {                   // admin link
        localStorage.setItem('ppa_admin', '1');
      }
    } catch (e) { /* URLSearchParams unsupported — fall through */ }
    return localStorage.getItem('ppa_admin') === '1'
        || localStorage.getItem('ppa_member') === '1';
  }

  // ── Upsell modal (self-injecting; no static HTML required) ───────
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
          'Members feature</div>' +
        '</div>' +
        '<div style="padding:1.2rem 1.4rem 1.3rem;text-align:center">' +
          '<p style="font-size:12.5px;color:#4a3f30;line-height:1.7;margin:0 0 1rem">' +
          'The calculation is free to use. Project-ready PDF reports are included with ' +
          '<strong style="color:#1a1510">PipingPro Academy membership</strong> — along with ' +
          'all 17 calculators and every course.</p>' +
          '<a href="https://pipingpro-academy.com/membership" ' +
          'style="display:block;background:#8b3a1a;color:#fff;text-decoration:none;' +
          'font-weight:600;font-size:13px;padding:11px;border-radius:8px;margin-bottom:.5rem">' +
          'Become a Member — $10/month →</a>' +
          '<button type="button" id="ppa-rpt-upsell-dismiss" ' +
          'style="width:100%;background:none;border:none;font-size:11px;color:#6b5d49;' +
          'cursor:pointer;padding:4px;font-family:\'DM Sans\',sans-serif">Maybe later</button>' +
        '</div>' +
      '</div>';

    // dismiss on backdrop click or "Maybe later"
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
    if (window.ppaOpenReport.__gated) return true;               // already wrapped

    var original = window.ppaOpenReport;
    var wrapped = function () {
      if (!isMember()) { showUpsell(); return; }                 // block non-members
      return original.apply(this, arguments);                    // members: unchanged
    };
    wrapped.__gated = true;
    window.ppaOpenReport = wrapped;
    return true;
  }

  // Try immediately; if the engine script hasn't defined the function
  // yet, retry once the DOM is ready.
  if (!installGate()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', installGate);
    } else {
      // engine script loads synchronously after us in rare cases — retry shortly
      setTimeout(installGate, 0);
    }
  }
})();
