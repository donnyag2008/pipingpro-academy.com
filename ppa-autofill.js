// ═══════════════════════════════════════════════════════════════════════
// PipingPro AI Router — URL Parameter Auto-Fill
// ═══════════════════════════════════════════════════════════════════════
// Add this snippet at the bottom of each calculator's <script> section,
// just before </script>. It reads URL params, fills inputs, and auto-runs.
//
// Example URL from AI:
//   /pipe-wall-thickness-calculator.html?nps=8&pres=8.5&temp=250&b313-mat=A106+Gr.B&ca=3&from=ai
//
// The "from=ai" param triggers a "Back to AI" button.
// ═══════════════════════════════════════════════════════════════════════

(function ppaAutoFill() {
  const params = new URLSearchParams(window.location.search);
  if (params.size === 0) return; // no URL params, normal page load

  let filled = 0;

  params.forEach((value, key) => {
    if (key === 'from') return; // skip meta params

    const el = document.getElementById(key);
    if (!el) return;

    if (el.tagName === 'SELECT') {
      // Try exact value match first
      const opt = Array.from(el.options).find(o => o.value === value);
      if (opt) {
        el.value = value;
        filled++;
      } else {
        // Fuzzy match: find option whose text contains the value
        const fuzzy = Array.from(el.options).find(o =>
          o.text.toUpperCase().includes(value.toUpperCase()) ||
          o.value.toUpperCase().includes(value.toUpperCase())
        );
        if (fuzzy) {
          el.value = fuzzy.value;
          filled++;
        }
      }
      // Trigger onchange if it exists
      if (el.onchange) el.onchange();
    } else if (el.tagName === 'INPUT') {
      el.value = value;
      filled++;
      if (el.onchange) el.onchange();
    }
  });

  // Auto-calculate if we filled any fields
  if (filled > 0) {
    // Small delay to let any onchange handlers finish (material lookups etc.)
    setTimeout(() => {
      if (typeof calculate === 'function') calculate();
      else if (typeof runCalc === 'function') runCalc();
      else if (typeof doCalc === 'function') doCalc();

      // Scroll to results
      const results = document.querySelector('.results-box, .result-section, .hero-result, [id*="result"]');
      if (results) results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }

  // Show "Back to AI" button if came from AI
  if (params.get('from') === 'ai') {
    const backBtn = document.createElement('a');
    backBtn.href = '/';
    backBtn.textContent = '← Back to PipingPro AI';
    backBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#b8860b;color:#1a1510;padding:10px 18px;border-radius:4px;text-decoration:none;font-weight:700;font-size:13px;font-family:"DM Sans",sans-serif;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);letter-spacing:0.03em;';
    backBtn.onmouseenter = () => backBtn.style.background = '#d4a017';
    backBtn.onmouseleave = () => backBtn.style.background = '#b8860b';
    document.body.appendChild(backBtn);
  }
})();
