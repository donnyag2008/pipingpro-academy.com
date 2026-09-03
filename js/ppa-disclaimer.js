/* ════════════════════════════════════════════════════════════════
   PipingPro Academy — Calculator Disclaimer Footer  v1.0
   ────────────────────────────────────────────────────────────────
   Injects a consistent, edition-aware disclaimer at the bottom of a
   calculator page. One shared file → one source of truth for the
   wording across every calculator.

   PER-PAGE SETUP (two lines):
     1) set the standards string BEFORE this script loads, e.g.
            window.PPA_STANDARDS =
              'ASME B16.5-2003, B16.47-1996 and B16.10-2000';
     2) include this file once, near the end of <body>:
            <script src="/js/ppa-disclaimer.js"></script>

   Notes
   • PPA_STANDARDS should name the EXACT editions implemented (with
     years). Naming the edition is the point — it converts an open
     "is this current?" exposure into a bounded "is this faithful to
     that edition?" one. Do not write "latest".
   • If PPA_STANDARDS is unset, a generic line is shown.
   • Optional: window.PPA_DISCLAIMER_EXTRA = 'a sentence…' appends a
     calculator-specific caveat (e.g. an omitted dimension).
   • Renders once; safe to include twice.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__ppaDisclaimerDone) return;
  window.__ppaDisclaimerDone = true;

  function build() {
    if (document.getElementById('ppa-disclaimer')) return;

    var standards = (window.PPA_STANDARDS || '').trim();
    var extra     = (window.PPA_DISCLAIMER_EXTRA || '').trim();
    var year      = new Date().getFullYear();

    var basis = standards
      ? 'Reference data is built on <strong>' + standards + '</strong>.'
      : 'Reference data is built on the specific code and standard editions cited in this tool.';

    // scoped styles (injected once)
    if (!document.getElementById('ppa-disclaimer-style')) {
      var st = document.createElement('style');
      st.id = 'ppa-disclaimer-style';
      st.textContent =
        '.ppa-disc{max-width:880px;margin:2.2rem auto 1.4rem;padding:0 1rem;' +
          'font-family:"DM Sans",system-ui,Arial,sans-serif}' +
        '.ppa-disc__box{border:1px solid #e2d6bd;border-left:3px solid #b8860b;' +
          'background:#faf6ef;border-radius:6px;padding:.85rem 1.05rem;' +
          'font-size:11.5px;line-height:1.6;color:#5a4f3c}' +
        '.ppa-disc__h{display:block;font-size:9.5px;font-weight:700;letter-spacing:.11em;' +
          'text-transform:uppercase;color:#8a6d1f;margin-bottom:.35rem}' +
        '.ppa-disc__box strong{color:#3a3225;font-weight:600}' +
        '.ppa-disc__copy{margin-top:.5rem;font-size:10.5px;color:#8a7d63}';
      document.head.appendChild(st);
    }

    var html =
      '<div class="ppa-disc__box">' +
        '<span class="ppa-disc__h">Engineering Disclaimer</span>' +
        basis + ' It is provided for <strong>preliminary engineering use only</strong> and ' +
        'may not reflect the latest edition of the referenced standard(s). ' +
        'Verify every value against the standard edition governing your project before use. ' +
        'This tool does not replace engineering judgement or independent checking by a ' +
        'competent engineer, and is issued subject to the PipingPro Academy Terms of Use.' +
        (extra ? ' ' + extra : '') +
        '<div class="ppa-disc__copy">© ' + year +
          ' Zephrum Konsultan Limited · PipingPro Academy. No warranty of fitness for any ' +
          'particular purpose.</div>' +
      '</div>';

    var wrap = document.createElement('div');
    wrap.id = 'ppa-disclaimer';
    wrap.className = 'ppa-disc';
    wrap.innerHTML = html;

    // place into an explicit slot if present, else append to <body>
    var slot = document.getElementById('ppa-disclaimer-slot');
    (slot || document.body).appendChild(wrap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
