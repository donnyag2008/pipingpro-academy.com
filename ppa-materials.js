/* =====================================================================
   ppa-materials.js  —  PipingPro Academy shared material library
   ---------------------------------------------------------------------
   SINGLE SOURCE OF TRUTH for the Material Property Datasheet (md) and the
   Material Comparison calculator. Load this file BEFORE either page's
   inline script; both then read PPA.MATERIALS and PPA.interp, so the two
   pages can never drift.

   BASE UNITS: SI.
     Stress (Sh, Sc, SMYS, SMTS) ... MPa
     Temperature (t, tmin, tmax) .... °C
     Modulus E ...................... MPa
     Thermal expansion α ............ ×10⁻⁶ mm/mm/°C  (mean, ref 21 °C)
   US display is derived deterministically (see PPA.convert).
   sh / e / a are index-aligned to each material's own t[] points.

   status:
     'verified'   — checked against the PipingPro B31.3 dataset
     'indicative' — confirm Sh / α against your code edition before issue

   MIGRATION (md): add  <script src="ppa-materials.js"></script>  before the
   md inline script, then at the top of that script replace the local
   `const DATA = {…}` block and the `function interp(){…}` definition with:
       const DATA   = PPA.MATERIALS;
       const interp = PPA.interp;
   Nothing else in md changes — converters, units toggle, render() all stay.
   ===================================================================== */
(function (g) {
  "use strict";

  /* ---- VERIFIED DATASET (lifted verbatim from md — do not re-key) ---- */
  const MATERIALS = {
    A106B:{ name:"Carbon Steel A106 Gr.B", status:"verified",
      smys:240, smts:415, sc:138, tmin:-29, tmax:427,
      t:[20,100,150,200,250,300,350,400],
      sh:[138,138,131,124,117,110,103,97],
      e :[203000,198000,195000,192000,189000,185000,181000,176000],
      a :[11.5,11.9,12.1,12.4,12.7,13.0,13.2,13.4] },
    "A333-6":{ name:"Low-Temp CS A333 Gr.6", status:"indicative",
      smys:240, smts:415, sc:138, tmin:-46, tmax:343,
      t:[20,100,150,200,250,300,343],
      sh:[138,138,131,124,117,110,104],
      e :[203000,198000,195000,192000,189000,185000,182000],
      a :[11.5,11.9,12.1,12.4,12.7,13.0,13.2] },
    TP304:{ name:"Stainless 304 (A312 TP304)", status:"verified",
      smys:205, smts:515, sc:115, tmin:-198, tmax:425,
      t:[20,100,150,200,250,300,350,400],
      sh:[115,107,102,98,95,92,90,88],
      e :[195000,189000,186000,182000,178000,174000,170000,165000],
      a :[15.9,16.2,16.5,16.8,17.0,17.2,17.5,17.7] },
    TP316L:{ name:"Stainless 316L (A312 TP316L)", status:"verified",
      smys:170, smts:485, sc:115, tmin:-198, tmax:425,
      t:[20,100,150,200,250,300,350,400],
      sh:[115,109,105,102,99,96,94,92],
      e :[195000,189000,186000,182000,178000,174000,170000,165000],
      a :[15.9,16.2,16.5,16.8,17.0,17.2,17.5,17.7] },
    DUP2205:{ name:"Duplex 2205 (A790 S31803)", status:"verified",
      smys:450, smts:620, sc:172, tmin:-29, tmax:316,
      t:[20,100,150,200,250,300],
      sh:[172,168,163,158,152,146],
      e :[200000,195000,192000,188000,184000,180000],
      a :[13.0,13.5,13.7,14.0,14.2,14.5] },
    P11:{ name:"Cr-Mo A335 P11 (1¼Cr-½Mo)", status:"indicative",
      smys:205, smts:415, sc:138, tmin:-29, tmax:595,
      t:[20,100,200,300,400,450,500,550,595],
      sh:[138,138,134,130,124,116,98,72,41],
      e :[205000,200000,193000,185000,176000,171000,166000,160000,155000],
      a :[11.5,11.9,12.4,12.9,13.4,13.6,13.8,14.0,14.2] },
    P22:{ name:"Cr-Mo A335 P22 (2¼Cr-1Mo)", status:"indicative",
      smys:205, smts:415, sc:138, tmin:-29, tmax:650,
      t:[20,100,200,300,400,450,500,550,600,650],
      sh:[138,138,134,131,127,121,108,86,57,33],
      e :[207000,202000,195000,187000,178000,173000,168000,162000,156000,150000],
      a :[10.8,11.2,11.8,12.4,12.9,13.1,13.4,13.6,13.8,14.0] }
  };

  /* ---- SUPPLEMENTARY: density (NOT part of the verified md dataset) ----
     Material density is a physical constant — non-tabular, code-agnostic,
     not drawn from any copyrighted compilation. Standard handbook values,
     g/cm³. Used by material-compare for the weight-on-supports view only;
     md does not read this. Compare degrades gracefully if a key is absent. */
  const RHO = {
    A106B:7.85, "A333-6":7.85, TP304:8.00, TP316L:8.00,
    DUP2205:7.80, P11:7.85, P22:7.85
  };

  /* ---- interpolation (verbatim from md; clamps at table ends) ---- */
  function interp(arr, ts, x) {
    if (x <= ts[0])              return { v: arr[0], clamp: x < ts[0] ? 'low' : null };
    if (x >= ts[ts.length - 1])  return { v: arr[arr.length - 1], clamp: x > ts[ts.length - 1] ? 'high' : null };
    for (let i = 0; i < ts.length - 1; i++) {
      if (x >= ts[i] && x <= ts[i + 1]) {
        const f = (x - ts[i]) / (ts[i + 1] - ts[i]);
        return { v: arr[i] + f * (arr[i + 1] - arr[i]), clamp: null };
      }
    }
    return { v: arr[0], clamp: null };
  }

  /* ---- deterministic converters (same constants as md) ---- */
  const c2f = c => c * 9 / 5 + 32;
  const f2c = f => (f - 32) * 5 / 9;
  const convert = {
    c2f, f2c,
    stress: (mpa, u) => u === 'SI' ? Math.round(mpa)        : +(mpa * 0.145038).toFixed(2),   // MPa | ksi
    modE  : (mpa, u) => u === 'SI' ? Math.round(mpa)        : +(mpa * 0.145038 / 1000).toFixed(1), // MPa | ×10⁶ psi
    alpha : (a,   u) => u === 'SI' ? +(+a).toFixed(2)       : +(a * 5 / 9).toFixed(2),         // ×10⁻⁶/°C | /°F
    temp  : (c,   u) => u === 'SI' ? Math.round(c)          : Math.round(c2f(c))               // °C | °F
  };
  const UNITS = {
    SI: { stress:"MPa", e:"MPa",       a:"×10⁻⁶/°C", t:"°C" },
    US: { stress:"ksi", e:"×10⁶ psi",  a:"×10⁻⁶/°F", t:"°F" }
  };

  g.PPA = g.PPA || {};
  Object.assign(g.PPA, { MATERIALS, RHO, interp, convert, UNITS });
})(window);
