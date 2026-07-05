/* =====================================================================
   ppa-materials.js  —  PipingPro Academy shared material library
   ---------------------------------------------------------------------
   SINGLE SOURCE OF TRUTH for the Material Property Datasheet (md) and the
   Material Comparison calculator. Load this file BEFORE either page's
   inline script; both then read PPA.MATERIALS and PPA.interp, so the two
   pages can never drift.

   BASE UNITS: SI.
     Stress (Sh, Sc, SMYS, SMTS) ... MPa
     Temperature (t, tmin, tmax) .... °C  (tmin may be a string "A"/"B"/"C"/"D"
                                           for curve designation per Figure 323.2.2A)
     Modulus E ...................... MPa
     Thermal expansion α ............ ×10⁻⁶ mm/mm/°C  (mean, ref 21 °C)
   US display is derived deterministically (see PPA.convert).
   sh / e / a are index-aligned to each material's own t[] points.

   status:
     'verified'   — checked against the PipingPro B31.3 dataset
     'indicative' — confirm Sh / α against your code edition before issue

   CONTENTS:
     MATERIALS ............. Material mechanical & thermal property data
     RHO ................... Density (g/cm³)
     COST .................. Relative cost multiplier (vs A106B = 1.0)
     WELD .................. Welding characteristics & practice notes
     ASTM_SPECS ............ ASTM/API/CSA specification full names (178 specs)
     TABLE_A1_NOTES ........ ASME B31.3 Table A-1 Notes 1–79 (75 active, 8 deleted)
     TABLE_A1_GENERAL_NOTES  General Notes (a)–(f)
     P_NUMBERS ............. P-Number base metal groupings (ASME Sec IX QW-422)
     A_NUMBERS ............. A-Number weld metal classification (QW-442)
     CURVES_323 ............ Figure 323.2.2A digitised curves A–D + notes
     curveMDMT(curve, mm) .. Helper: MDMT lookup from curve & thickness
     PARA_323 .............. Para. 323 material requirements (323.1–323.2.4)
     interp / convert / UNITS  Interpolation and unit conversion utilities

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
      pNo:1, smys:240, smts:415, sc:138, tmin:-29, tmax:427,
      t:[20,100,150,200,250,300,350,400],
      sh:[138,138,131,124,117,110,103,97],
      e :[203000,198000,195000,192000,189000,185000,181000,176000],
      a :[11.5,11.9,12.1,12.4,12.7,13.0,13.2,13.4] },
    "A333-6":{ name:"Low-Temp CS A333 Gr.6", status:"indicative",
      pNo:1, smys:240, smts:415, sc:138, tmin:-46, tmax:343,
      t:[20,100,150,200,250,300,343],
      sh:[138,138,131,124,117,110,104],
      e :[203000,198000,195000,192000,189000,185000,182000],
      a :[11.5,11.9,12.1,12.4,12.7,13.0,13.2] },
    TP304:{ name:"Stainless 304 (A312 TP304)", status:"verified",
      pNo:8, smys:205, smts:515, sc:115, tmin:-198, tmax:425,
      t:[20,100,150,200,250,300,350,400],
      sh:[115,107,102,98,95,92,90,88],
      e :[195000,189000,186000,182000,178000,174000,170000,165000],
      a :[15.9,16.2,16.5,16.8,17.0,17.2,17.5,17.7] },
    TP316L:{ name:"Stainless 316L (A312 TP316L)", status:"verified",
      pNo:8, smys:170, smts:485, sc:115, tmin:-198, tmax:425,
      t:[20,100,150,200,250,300,350,400],
      sh:[115,109,105,102,99,96,94,92],
      e :[195000,189000,186000,182000,178000,174000,170000,165000],
      a :[15.9,16.2,16.5,16.8,17.0,17.2,17.5,17.7] },
    DUP2205:{ name:"Duplex 2205 (A790 S31803)", status:"verified",
      pNo:"10H", smys:450, smts:620, sc:172, tmin:-29, tmax:316,
      t:[20,100,150,200,250,300],
      sh:[172,168,163,158,152,146],
      e :[200000,195000,192000,188000,184000,180000],
      a :[13.0,13.5,13.7,14.0,14.2,14.5] },
    P11:{ name:"Cr-Mo A335 P11 (1¼Cr-½Mo)", status:"indicative",
      pNo:4, smys:205, smts:415, sc:138, tmin:-29, tmax:595,
      t:[20,100,200,300,400,450,500,550,595],
      sh:[138,138,134,130,124,116,98,72,41],
      e :[205000,200000,193000,185000,176000,171000,166000,160000,155000],
      a :[11.5,11.9,12.4,12.9,13.4,13.6,13.8,14.0,14.2] },
    P22:{ name:"Cr-Mo A335 P22 (2¼Cr-1Mo)", status:"indicative",
      pNo:"5A", smys:205, smts:415, sc:138, tmin:-29, tmax:650,
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

  /* ---- SUPPLEMENTARY: relative cost multiplier (NOT real pricing) ----
     Directional only. Mill/market pricing (especially Ni/Mo-bearing alloys)
     moves with commodity cycles and varies by region, order volume and mill,
     so an absolute figure would go stale and could mislead a decision. This
     is a rough relative multiplier vs A106B = 1.0 baseline, for a same-size
     pipe/fitting, material cost only (no fabrication/welding cost included —
     see WELD for that dimension separately). Always confirm against current
     mill quotes before using in an estimate. */
  const COST = {
    A106B:1.0, "A333-6":1.3, TP304:3.0, TP316L:3.5, DUP2205:5.5, P11:1.8, P22:2.2
  };

  /* ---- SUPPLEMENTARY: welding characteristics (NOT a code requirement
     lookup — indicative practice notes only; always confirm against the
     project WPS/PQR and the governing code edition before use). ----
     level: Low | Moderate | Moderate-High | High — relative shop/field
            difficulty and procedure-control burden, not a numeric ratio.
     preheat: typical minimum preheat guidance (text, since it's often a
              thickness-dependent range rather than a single number).
     pwht: typical PWHT expectation for this grade.
     process: commonly used process combination.
     notes: the one pitfall worth knowing before you spec a dissimilar or
            unfamiliar-grade weld. */
  const WELD = {
    A106B:{ level:"Low",
      preheat:"Not normally required below ~25 mm; check WPS for thicker sections",
      pwht:"Required above code thickness/temperature threshold (B31.3 Table 331.1.1)",
      process:"GTAW root + SMAW fill (ER70S-2 / E7018)",
      notes:"Standard carbon-steel practice; the most forgiving grade in this list." },
    "A333-6":{ level:"Moderate",
      preheat:"Light preheat typical, thickness dependent",
      pwht:"Usually required — needed to restore/verify low-temperature CVN toughness",
      process:"GTAW root + SMAW fill, low-hydrogen consumables",
      notes:"Heat input must stay controlled or the low-temperature impact toughness the grade is chosen for gets eroded." },
    TP304:{ level:"Moderate",
      preheat:"None required",
      pwht:"Not normally required — avoid unless a specific case requires it",
      process:"GTAW root + GTAW/SMAW fill, matching filler",
      notes:"Control interpass temperature; avoid prolonged dwell in the ~425–870°C sensitization range (carbide precipitation, reduced corrosion resistance)." },
    TP316L:{ level:"Moderate",
      preheat:"None required",
      pwht:"Not normally required",
      process:"GTAW root + GTAW/SMAW fill, low-carbon matching filler",
      notes:"Lower carbon than 304 reduces sensitization risk, but interpass temperature control is still good practice." },
    DUP2205:{ level:"High",
      preheat:"None to slight; keep interpass temperature capped (~100°C typical limit)",
      pwht:"Not normally required if the procedure is properly controlled",
      process:"GTAW with matched high-nickel filler (e.g. ER2209)",
      notes:"Narrow heat-input window — overheating shifts the ferrite/austenite balance and risks sigma-phase formation, degrading both toughness and the corrosion resistance the grade was selected for. Needs a qualified WPS and experienced welders." },
    P11:{ level:"Moderate-High",
      preheat:"150–200°C minimum, maintained between passes",
      pwht:"Required per code",
      process:"GTAW root + SMAW fill, low-hydrogen consumables",
      notes:"Hydrogen cracking risk if preheat lapses between passes." },
    P22:{ level:"High",
      preheat:"200–260°C minimum, maintained between passes",
      pwht:"Required (mandatory)",
      process:"GTAW root + SMAW fill, low-hydrogen consumables",
      notes:"Higher hardenability than P11 increases hydrogen-cracking risk; needs strict interpass control and PWHT — budget more inspection time." }
  };
  const WELD_LEVEL_RANK = { "Low":1, "Moderate":2, "Moderate-High":3, "High":4 };

  /* ==================================================================
     ASTM / API / CSA SPECIFICATION FULL NAMES
     ------------------------------------------------------------------
     Per ASME B31.3 – 2020 Edition, Appendix A referenced specs.
     Covers product forms commonly used in Oil & Gas piping: seamless &
     welded pipe, fittings, flanges/forgings, plate, bar, bolting,
     castings, and line pipe. Expand as materials are added.
     ================================================================== */
  const ASTM_SPECS = {
    /* --- Carbon & Alloy Steel — Pipe --- */
    A53:   "Pipe, Steel, Black and Hot-Dipped, Zinc-Coated, Welded and Seamless",
    A106:  "Seamless Carbon Steel Pipe for High-Temperature Service",
    A134:  "Pipe, Steel, Electric-Fusion (Arc)-Welded (Sizes NPS 16 and Over)",
    A135:  "Electric-Resistance-Welded Steel Pipe",
    A139:  "Electric-Fusion (Arc)-Welded Steel Pipe (NPS 4 and Over)",
    A333:  "Seamless and Welded Steel Pipe for Low-Temperature Service and Other Applications with Required Notch Toughness",
    A335:  "Seamless Ferritic Alloy-Steel Pipe for High-Temperature Service",
    A369:  "Carbon and Ferritic Alloy Steel Forged and Bored Pipe for High-Temperature Service",
    A381:  "Metal-Arc-Welded Carbon or High-Strength Low-Alloy Steel Pipe for Use With High-Pressure Transmission Systems",
    A524:  "Seamless Carbon Steel Pipe for Atmospheric and Lower Temperatures",
    A587:  "Electric-Resistance-Welded Low-Carbon Steel Pipe for the Chemical Industry",
    A671:  "Electric-Fusion-Welded Steel Pipe for Atmospheric and Lower Temperatures",
    A672:  "Electric-Fusion-Welded Steel Pipe for High-Pressure Service at Moderate Temperatures",
    A691:  "Carbon and Alloy Steel Pipe, Electric-Fusion-Welded for High-Pressure Service at High Temperatures",

    /* --- Carbon & Alloy Steel — Fittings --- */
    A234:  "Piping Fittings of Wrought Carbon Steel and Alloy Steel for Moderate and High Temperature Service",
    A420:  "Piping Fittings of Wrought Carbon Steel and Alloy Steel for Low-Temperature Service",
    A860:  "Wrought High-Strength Ferritic Steel Butt-Welding Fittings",

    /* --- Carbon & Alloy Steel — Forgings (flanges, valves) --- */
    A105:  "Carbon Steel Forgings for Piping Applications",
    A181:  "Carbon Steel Forgings, for General-Purpose Piping",
    A182:  "Forged or Rolled Alloy and Stainless Steel Pipe Flanges, Forged Fittings, and Valves and Parts for High-Temperature Service",
    A350:  "Carbon and Low-Alloy Steel Forgings, Requiring Notch Toughness Testing for Piping Components",
    A694:  "Carbon and Alloy Steel Forgings for Pipe Flanges, Fittings, Valves, and Parts for High-Pressure Transmission Service",
    A707:  "Forged Carbon and Alloy Steel Flanges for Low-Temperature Service",

    /* --- Carbon & Alloy Steel — Plate --- */
    A36:   "Carbon Structural Steel",
    A283:  "Low and Intermediate Tensile Strength Carbon Steel Plates",
    A285:  "Pressure Vessel Plates, Carbon Steel, Low- and Intermediate-Tensile Strength",
    A299:  "Pressure Vessel Plates, Carbon Steel, Manganese-Silicon",
    A387:  "Pressure Vessel Plates, Alloy Steel, Chromium-Molybdenum",
    A515:  "Pressure Vessel Plates, Carbon Steel, for Intermediate- and Higher-Temperature Service",
    A516:  "Pressure Vessel Plates, Carbon Steel, for Moderate and Lower-Temperature Service",
    A537:  "Pressure Vessel Plates, Heat-Treated, Carbon-Manganese-Silicon Steel",

    /* --- Carbon & Alloy Steel — Tubes --- */
    A179:  "Seamless Cold-Drawn Low-Carbon Steel Heat-Exchanger and Condenser Tubes",
    A213:  "Seamless Ferritic and Austenitic Alloy-Steel Boiler, Superheater, and Heat-Exchanger Tubes",
    A334:  "Seamless and Welded Carbon and Alloy-Steel Tubes for Low-Temperature Service",

    /* --- Bolting --- */
    A193:  "Alloy-Steel and Stainless Steel Bolting for High Temperature or High Pressure Service and Other Special Purpose Applications",
    A194:  "Carbon Steel, Alloy Steel, and Stainless Steel Nuts for Bolts for High Pressure or High Temperature Service, or Both",
    A307:  "Carbon Steel Bolts and Studs, 60 000 PSI Tensile Strength",
    A320:  "Alloy-Steel and Stainless Steel Bolting for Low-Temperature Service",
    A354:  "Quenched and Tempered Alloy Steel Bolts, Studs, and Other Externally Threaded Fasteners",
    A563:  "Carbon and Alloy Steel Nuts",

    /* --- Castings --- */
    A216:  "Steel Castings, Carbon, Suitable for Fusion Welding, for High-Temperature Service",
    A217:  "Steel Castings, Martensitic Stainless and Alloy, for Pressure-Containing Parts, Suitable for High-Temperature Service",
    A351:  "Castings, Austenitic, for Pressure-Containing Parts",
    A352:  "Steel Castings, Ferritic and Martensitic, for Pressure-Containing Parts, Suitable for Low-Temperature Service",

    /* --- Stainless Steel — Pipe --- */
    A312:  "Seamless, Welded, and Heavily Cold Worked Austenitic Stainless Steel Pipes",
    A358:  "Electric-Fusion-Welded Austenitic Chromium-Nickel Stainless Steel Pipe for High-Temperature Service and General Applications",
    A376:  "Seamless Austenitic Steel Pipe for High-Temperature Service",
    A409:  "Welded Large Diameter Austenitic Steel Pipe for Corrosive or High-Temperature Service",
    A790:  "Seamless and Welded Ferritic/Austenitic Stainless Steel Pipe",
    A813:  "Single- or Double-Welded Austenitic Stainless Steel Pipe",
    A928:  "Ferritic/Austenitic (Duplex) Stainless Steel Pipe Electric Fusion Welded with Addition of Filler Metal",

    /* --- Stainless Steel — Fittings --- */
    A403:  "Wrought Austenitic Stainless Steel Piping Fittings",
    A815:  "Wrought Ferritic, Ferritic/Austenitic, and Martensitic Stainless Steel Piping Fittings",

    /* --- Stainless Steel — Plate, Bar, Tube --- */
    A240:  "Chromium and Chromium-Nickel Stainless Steel Plate, Sheet, and Strip for Pressure Vessels and for General Applications",
    A268:  "Seamless and Welded Ferritic and Martensitic Stainless Steel Tubing for General Service",
    A269:  "Seamless and Welded Austenitic Stainless Steel Tubing for General Service",
    A276:  "Stainless Steel Bars and Shapes",
    A479:  "Stainless Steel Bars and Shapes for Use in Boilers and Other Pressure Vessels",
    A789:  "Seamless and Welded Ferritic/Austenitic Stainless Steel Tubing for General Service",

    /* --- Stainless Steel — Castings --- */
    A995:  "Castings, Austenitic-Ferritic (Duplex) Stainless Steel, for Pressure-Containing Parts",

    /* --- Nickel Alloy — Pipe & Tube --- */
    B161:  "Nickel Seamless Pipe and Tube",
    B165:  "Nickel-Copper Alloy (UNS N04400) Seamless Pipe and Tube",
    B167:  "Nickel-Chromium-Iron Alloys and Nickel-Chromium-Cobalt-Molybdenum Alloy Seamless Pipe and Tube",
    B407:  "Nickel-Iron-Chromium Alloy Seamless Pipe and Tube",
    B423:  "Nickel-Iron-Chromium-Molybdenum-Copper Alloy (UNS N08825, N08221, N06845) Seamless Pipe and Tube",
    B444:  "Nickel-Chromium-Molybdenum-Columbium Alloys (UNS N06625, N06852) and Nickel-Chromium-Molybdenum-Silicon Alloy (UNS N06219) Pipe and Tube",
    B668:  "UNS N08028 Seamless Pipe and Tube",
    B690:  "Iron-Nickel-Chromium-Molybdenum Alloy (UNS N08367) Seamless Pipe and Tube",
    B725:  "Welded Nickel (UNS N02200/N02201) and Nickel Copper Alloy (UNS N04400) Pipe",
    B474:  "Electric Fusion Welded Nickel and Nickel Alloy Pipe",
    B514:  "Welded Nickel-Iron-Chromium Alloy Pipe",
    B705:  "Nickel-Alloy (UNS N06625, N06219 and N08825) Welded Pipe",

    /* --- Nickel Alloy — Plate, Bar, Fittings, Forgings --- */
    B127:  "Nickel-Copper Alloy (UNS N04400) Plate, Sheet, and Strip",
    B160:  "Nickel Rod and Bar",
    B162:  "Nickel Plate, Sheet and Strip",
    B164:  "Nickel-Copper Alloy Rod, Bar, and Wire",
    B168:  "Nickel-Chromium-Iron Alloys and Nickel-Chromium-Cobalt-Molybdenum Alloy Plate, Sheet and Strip",
    B366:  "Factory-Made Wrought Nickel and Nickel Alloy Fittings",
    B409:  "Nickel-Iron-Chromium Alloy Plate, Sheet, and Strip",
    B424:  "Ni-Fe-Cr-Mo-Cu Alloy (UNS N08825, N08221, N06845) Plate, Sheet, and Strip",
    B443:  "Nickel-Chromium-Molybdenum-Columbium Alloy (UNS N06625) and Nickel-Chromium-Molybdenum-Silicon Alloy (UNS N06219) Plate, Sheet, and Strip",
    B462:  "Forged or Rolled Nickel Alloy Pipe Flanges, Forged Fittings, and Valves and Parts for Corrosive High-Temperature Service",
    B564:  "Nickel Alloy Forgings",
    B574:  "Low-Carbon Nickel-Chromium-Molybdenum and Related Alloy Rod",
    B575:  "Low-Carbon Nickel-Chromium-Molybdenum and Related Alloy Plate, Sheet and Strip",

    /* --- Copper Alloy (limited O&G use, included for completeness) --- */
    B42:   "Seamless Copper Pipe, Standard Sizes",
    B75:   "Seamless Copper Tube",
    B466:  "Seamless Copper-Nickel Pipe and Tube",
    B467:  "Welded Copper-Nickel Pipe",
    B43:   "Seamless Red Brass Pipe, Standard Sizes",
    B68:   "Seamless Copper Tube, Bright Annealed",
    B88:   "Seamless Copper Water Tube",
    B96:   "Copper-Silicon Alloy Plate, Sheet, Strip, and Rolled Bar for General Purposes and Pressure Vessels",
    B98:   "Copper-Silicon Alloy Rod, Bar and Shapes",
    B148:  "Aluminum-Bronze Sand Castings",
    B150:  "Aluminum Bronze Rod, Bar and Shapes",
    B152:  "Copper Sheet, Strip, Plate and Rolled Bar",
    B169:  "Aluminum Bronze Sheet, Strip, and Rolled Bar",
    B171:  "Copper-Alloy Plate and Sheet for Pressure Vessels, Condensers, and Heat Exchangers",
    B187:  "Copper, Bus Bar, Rod, and Shapes and General Purpose Rod, Bar, and Shapes",
    B280:  "Seamless Copper Tube for Air Conditioning and Refrigeration Field Service",
    B283:  "Copper and Copper-Alloy Die Forgings (Hot-Pressed)",
    B371:  "Copper-Zinc-Silicon Alloy Rod",

    /* --- Titanium --- */
    B265:  "Titanium and Titanium Alloy Strip, Sheet, and Plate",
    B348:  "Titanium and Titanium Alloy Bars and Billets",
    B363:  "Seamless and Welded Unalloyed Titanium and Titanium Alloy Welding Fittings",
    B367:  "Titanium and Titanium Alloy Castings",
    B381:  "Titanium and Titanium Alloy Forgings",
    B861:  "Titanium and Titanium Alloy Seamless Pipe",
    B862:  "Titanium and Titanium Alloy Welded Pipe",

    /* --- Zirconium --- */
    B493:  "Zirconium and Zirconium Alloy Forgings",
    B523:  "Seamless and Welded Zirconium and Zirconium Alloy Tubes",
    B550:  "Zirconium and Zirconium Alloy Bar and Wire",
    B551:  "Zirconium and Zirconium Alloy Strip, Sheet, and Plate",

    /* --- Aluminium --- */
    B26:   "Aluminum-Alloy Sand Castings",
    B209:  "Aluminum and Aluminum-Alloy Sheet and Plate",
    B210:  "Aluminum and Aluminum-Alloy Drawn Seamless Tubes",
    B211:  "Aluminum and Aluminum-Alloy Rolled or Cold Finished Bar, Rod, and Wire",
    B221:  "Aluminum and Aluminum-Alloy Extruded Bars, Rods, Wire, Profiles, and Tubes",
    B241:  "Aluminum and Aluminum-Alloy Seamless Pipe and Seamless Extruded Tube",
    B247:  "Aluminum and Aluminum-Alloy Die Forgings, Hand Forgings, and Rolled Ring Forgings",
    B345:  "Aluminum and Aluminum-Alloy Seamless Pipe and Seamless Extruded Tube for Gas and Oil Transmission and Distribution Piping Systems",
    B361:  "Factory-Made Wrought Aluminum and Aluminum-Alloy Welding Fittings",
    B491:  "Aluminum and Aluminum-Alloy Extruded Round Tubes for General-Purpose Applications",

    /* --- Additional Nickel Alloy specs --- */
    B163:  "Seamless Nickel and Nickel Alloy Condenser and Heat Exchanger Tubes",
    B166:  "Nickel-Chromium-Iron Alloys, Ni-Cr-Co-Mo Alloy, Ni-Fe-Cr-W Alloy, and Ni-Cr-Mo-Cu Alloy Rod, Bar, and Wire",
    B333:  "Nickel-Molybdenum Alloy Plate, Sheet, and Strip",
    B335:  "Nickel-Molybdenum Alloy Rod",
    B408:  "Nickel-Iron-Chromium Alloy Rod and Bar",
    B425:  "Ni-Fe-Cr-Mo-Cu Alloy (UNS N08825, N08221, N06845) Rod and Bar",
    B435:  "UNS N06002, N06230, N12160, R30556 Plate, Sheet, and Strip",
    B446:  "Ni-Cr-Mo-Cb Alloy (UNS N06625), Ni-Cr-Mo-Si Alloy (UNS N06219), Ni-Cr-Mo-W Alloy (UNS N06650) Rod and Bar",
    B463:  "UNS N08020 Alloy Plate, Sheet, and Strip",
    B464:  "Welded UNS N08020 Alloy Pipe",
    B515:  "Welded UNS N08120, N08800, N08810, N08811 Alloy Tubes",
    B517:  "Welded Ni-Cr-Fe Alloy (UNS N06600, N06603, N06025, N06045) Pipe",
    B572:  "UNS N06002, N06230, N12160, R30556 Rod",
    B675:  "UNS N08367 Welded Pipe",
    B688:  "Chromium-Nickel-Molybdenum-Iron (UNS N08367) Plate, Sheet, and Strip",
    B704:  "Welded UNS N06625, N06219 and N08825 Alloy Tubes",
    B709:  "Iron-Nickel-Chromium-Molybdenum Alloy (UNS N08028) Plate, Sheet, and Strip",
    B729:  "Seamless UNS N08020, N08026, N08024 Nickel-Alloy Pipe and Tube",
    B804:  "UNS N08367 and N08926 Welded Pipe",

    /* --- Additional Carbon & Alloy Steel --- */
    A47:   "Ferritic Malleable Iron Castings",
    A48:   "Gray Iron Castings",
    A126:  "Gray Iron Castings for Valves, Flanges, and Pipe Fittings",
    A197:  "Cupola Malleable Iron",
    A204:  "Pressure Vessel Plates, Alloy Steel, Molybdenum",
    A270:  "Seamless and Welded Austenitic and Ferritic/Austenitic Stainless Steel Sanitary Tubing",
    A278:  "Gray Iron Castings for Pressure-Containing Parts for Temperatures Up to 650°F (350°C)",
    A302:  "Pressure Vessel Plates, Alloy Steel, Manganese-Molybdenum and Manganese-Molybdenum-Nickel",
    A334:  "Seamless and Welded Carbon and Alloy-Steel Tubes for Low-Temperature Service",
    A395:  "Ferritic Ductile Iron Pressure-Retaining Castings for Use at Elevated Temperatures",
    A426:  "Centrifugally Cast Ferritic Alloy Steel Pipe for High-Temperature Service",
    A437:  "Stainless and Alloy-Steel Turbine-Type Bolting Material Specially Heat Treated for High-Temperature Service",
    A451:  "Centrifugally Cast Austenitic Steel Pipe for High-Temperature Service",
    A453:  "High-Temperature Bolting, with Expansion Coefficients Comparable to Austenitic Stainless Steels",
    A487:  "Steel Castings Suitable for Pressure Service",
    A494:  "Castings, Nickel and Nickel Alloy",
    A524:  "Seamless Carbon Steel Pipe for Atmospheric and Lower Temperatures",
    A536:  "Ductile Iron Castings",
    A571:  "Austenitic Ductile Iron Castings for Pressure-Containing Parts Suitable for Low-Temperature Service",
    A645:  "Pressure Vessel Plates, 5% and 5½% Nickel Alloy Steels, Specially Heat Treated",
    A675:  "Steel Bars, Carbon, Hot-Wrought, Special Quality, Mechanical Properties",
    A696:  "Steel Bars, Carbon, Hot-Wrought or Cold-Finished, Special Quality, for Pressure Piping Components",
    A814:  "Cold-Worked Welded Austenitic Stainless Steel Pipe",
    A992:  "Structural Steel Shapes",
    A1010: "Higher-Strength Martensitic Stainless Steel Plate, Sheet, and Strip",
    A1011: "Steel, Sheet and Strip, Hot-Rolled, Carbon, Structural, High-Strength Low-Alloy",
    A1053: "Welded Ferritic-Martensitic Stainless Steel Pipe",

    /* --- Miscellaneous --- */
    B21:   "Naval Brass Rod, Bar, and Shapes",
    B61:   "Steam or Valve Bronze Castings",
    B62:   "Composition Bronze or Ounce Metal Castings",
    E112:  "Standard Test Methods for Determining Average Grain Size",
    F3125: "High Strength Structural Bolts, Steel and Alloy Steel, Heat Treated, 120 ksi and 150 ksi Minimum Tensile Strength",

    /* --- Low-Temperature Nickel Steels (for LNG / cryogenic) --- */
    A203:  "Pressure Vessel Plates, Alloy Steel, Nickel",
    A353:  "Pressure Vessel Plates, Alloy Steel, Double-Normalized and Tempered 9% Nickel",
    A553:  "Pressure Vessel Plates, Alloy Steel, Quenched and Tempered 7, 8, and 9 % Nickel",

    /* --- API Line Pipe --- */
    "API5L":"Line Pipe",

    /* --- CSA --- */
    "CSAZ245.1":"Steel Pipe"
  };

  /* ==================================================================
     ASME B31.3 TABLE A-1 NOTES  —  Curated for O&G piping materials
     ------------------------------------------------------------------
     Per ASME B31.3 – 2020 Edition. Only notes that have a practical
     impact on material selection, stress lookup, minimum temperature
     determination, or fabrication requirements for the grades typically
     used in Oil & Gas piping are included.

     Notes marked (*) restate Code text requirements.
     Deleted notes (16, 17, 18, 23, 38) are excluded.

     IMPORTANT: These are paraphrased engineering summaries for API
     tooltip / guidance use — NOT verbatim Code text. Always refer to
     the governing Code edition for contractual compliance.
     ================================================================== */
  const TABLE_A1_NOTES = {

    /* --- Column-heading notes (1–7): apply broadly --- */
    1:  { ref:"para. 302.3.1(a)",
          text:"Stress values in Table A-1 are basic allowable stresses in tension. For pressure design, multiply by the appropriate quality factor E (Ec from Table A-1A for castings, or Ej from Table A-1B for longitudinal weld joints). Shear and bearing stresses per para. 302.3.1(b); compression per para. 302.3.1(c)." },

    2:  { ref:"paras. 302.3.3, 302.3.4",
          text:"Casting quality factors (Ec) are per Table A-1A; longitudinal weld joint factors (Ej) are per Table A-1B. Both can be enhanced by supplementary examination per paras. 302.3.3(c) and 302.3.4(b)." },

    3:  { ref:"Material specification",
          text:"Stress values for austenitic stainless steels may not be applicable if the material has been given a final heat treatment other than that required by the material specification or by Notes (30)/(31)." },

    "4a":{ ref:"paras. 302.3.2(d)(3), 302.3.2(e)",
           text:"In Table A-1: italic stress values exceed ⅔ of expected yield strength at temperature; boldface values equal 90% of expected yield strength at temperature. Relevant for creep-range and time-dependent allowable stress considerations." },

    5:  { ref:"ASME BPVC Section IX, QW-200.3",
          text:"P-Numbers group materials for welding procedure qualification. Indicated by number or number+letter (e.g. 8, 5B, 11A)." },

    6:  { ref:"para. 323.2.2(e), Figure 323.2.2A",
          text:"The minimum temperature shown is the design minimum temperature for which the material is normally suitable without impact testing beyond that required by the material specification. Use of material colder than −29°C (−20°F) is governed by para. 323.2.2. For carbon steels with a LETTER designation (A, B, C, or D) in the Min. Temp. column, the actual minimum temperature depends on nominal wall thickness — see Figure 323.2.2A curves." },

    7:  { ref:"Material specification",
          text:"Letter 'a' = alloy not recommended for welding (must be individually qualified if welded). Letter 'b' = copper base alloy that must be individually qualified." },

    /* --- Material-specific notes (8+): curated for O&G relevance --- */
    8:  { ref:"paras. 305.2.1, 305.2.2, 323.4.2, 309.2",
          text:"Restrictions on use: (a) temperature limits −29°C to 186°C (−20°F to 366°F); (b) pipe shall be safeguarded outside those limits. Sub-notes (c)–(g) reference specific Code paragraphs for additional restrictions." },

    9:  { ref:"para. 326.2.1, para. 303",
          text:"For pressure-temperature ratings of components per standards in Table 326.1, see para. 326.2.1. Stress values may be used to calculate ratings for unlisted components or special ratings for listed components per para. 303." },

    12: { ref:"para. 323.3, Table 323.2.2",
          text:"Certain forms of this material must be impact tested to qualify for service below −29°C (−20°F), per Table 323.2.2. Alternatively, if impact testing is included in the material specification as invoked supplementary requirements, the material may be used down to the tested temperature." },

    13: { ref:"Material specification",
          text:"Properties vary with thickness or size. Stress values are based on minimum properties for the thickness listed." },

    14: { ref:"Material specification",
          text:"For use at stated stress values, minimum tensile and yield properties must be verified by tensile test. If not required by the material spec, specify in the purchase order." },

    15: { ref:"Engineering practice",
          text:"Stress values are based on strength only. For bolted joints requiring long-term leak-free service without retightening, lower stress values may be necessary based on flange/bolt flexibility and relaxation properties." },

    19: { ref:"Table 341.3.2, Table 302.3.4",
          text:"Specification includes random radiographic inspection for mill QC. If the 0.90 joint factor is to be used, welds shall meet Table 341.3.2 for longitudinal butt welds with spot radiography per Table 302.3.4. Requires special agreement between purchaser and manufacturer." },

    20: { ref:"Material specification",
          text:"For pipe sizes ≥DN 200 (NPS 8) with wall thicknesses ≥Sch 140, the specified minimum tensile strength is 483 MPa (70 ksi)." },

    25: { ref:"para. F323.4(c)",
          text:"This steel may develop embrittlement after service at approximately 316°C (600°F) and higher. Relevant for long-term elevated-temperature Cr-Mo service." },

    26: { ref:"para. F323.4(c)(2)",
          text:"Unstabilized austenitic stainless steel increasingly tends to precipitate intergranular carbides as carbon content increases above 0.03%. Affects corrosion resistance in sensitizing service." },

    27: { ref:"Material specification",
          text:"For temperatures above 427°C (800°F), stress values apply only when carbon content is 0.04% or higher." },

    28: { ref:"Material specification",
          text:"For temperatures above 538°C (1,000°F), stress values apply only when carbon content is 0.04% or higher." },

    29: { ref:"ASTM E112",
          text:"Stress values above 538°C (1,000°F) apply only when austenitic micrograin size per ASTM E112 is No. 6 or less (coarser grain). Otherwise use the lower stress values listed for the same material." },

    30: { ref:"Heat treatment requirement",
          text:"For temperatures above 538°C (1,000°F), stress values may be used only if material has been heat treated at minimum 1,093°C (2,000°F) and quenched in water or rapidly cooled." },

    31: { ref:"Heat treatment requirement",
          text:"For temperatures above 538°C (1,000°F), stress values may be used only if material has been heat treated at minimum 1,038°C (1,900°F) and quenched in water or rapidly cooled." },

    32: { ref:"Material specification",
          text:"Stress values are for the lowest strength base material permitted by the fitting specification. If a higher strength base material is used, the higher stress values for that material may be used in design." },

    35: { ref:"para. F323.4(c)(4)",
          text:"Steel intended for high-temperature use; may have low ductility and/or low impact properties at room temperature after service above the indicated temperature. Relevant for Cr-Mo grades in elevated-temperature shutdown/startup scenarios." },

    36: { ref:"para. 323.3",
          text:"Specification permits material to be furnished without solution heat treatment. When not solution heat treated, minimum temperature shall be −29°C (−20°F) unless impact tested per para. 323.3." },

    37: { ref:"A312, A240, A182",
          text:"Impact requirements for seamless fittings are governed by those listed for the particular base material specification. When A276 materials are used, the notes, minimum temperatures, and allowable stresses for comparable grades of A240 apply." },

    39: { ref:"Impact test requirement",
          text:"Material used below −29°C (−20°F) shall be impact tested if carbon content is above 0.10%." },

    40: { ref:"para. 302.3.3(c), Table 302.3.3C",
          text:"Casting quality factor can be enhanced by supplementary examination per Table 302.3.3C. The higher factor may be substituted in pressure design equations." },

    41: { ref:"Material specification",
          text:"Design stresses for the cold drawn temper are based on hot rolled properties until required data on cold drawn are submitted." },

    42: { ref:"Product specification (A193/A194)",
          text:"This is a product specification; no design stresses are necessary. Metal temperature limits vary by grade: Gr.1 −29 to 482°C; Gr.2/2H/2HM −48 to 593°C; Gr.3 −29 to 593°C; Gr.6 −29 to 427°C; Gr.7 −48 to 593°C; Gr.7L −101 to 593°C; Gr.7M −48 to 593°C; Gr.7ML −73 to 593°C; Gr.8FA [see Note (39)] −29 to 427°C; Gr.8MA/8TA −198 to 816°C; Gr.8/8A/8CA −254 to 816°C." },

    "42b":{ ref:"Product specification",
            text:"This is a product specification; no design stresses are necessary. For usage limitations, see paras. 309.2.1 and 309.2.2." },

    43: { ref:"para. 323.4.2(c)",
          text:"Stress values are not applicable when either welding or thermal cutting is employed." },

    45: { ref:"Material specification",
          text:"Stress values shown are applicable for die forgings only." },

    46: { ref:"A312 para. 6.1.4",
          text:"Lines of allowable stresses in Table A-1 for all A312 materials include heavily cold worked (HCW) material as defined in A312 para. 6.1.4." },

    47: { ref:"Material specification",
          text:"If no welding is employed in fabrication, stress values may be increased to 230 MPa (33.3 ksi)." },

    48: { ref:"Material specification",
          text:"The stress value for this gray iron material at its upper temperature limit of 232°C (450°F) is the same as that shown in the 204°C (400°F) column." },

    49: { ref:"Material specification",
          text:"If the chemical composition of this grade renders it hardenable, qualification under P-No. 6 is required." },

    50: { ref:"Material specification",
          text:"This material is grouped in P-No. 7 because its hardenability is low." },

    51: { ref:"ASME BPVC Section IX QW/QB-422",
          text:"This material may require special consideration for welding qualification. A qualified WPS is required for each strength level of material." },

    52: { ref:"Engineering practice",
          text:"Copper-silicon alloys are not always suitable when exposed to certain media and high temperature, particularly above 100°C (212°F). The user should verify the alloy is satisfactory for the intended service." },

    53: { ref:"Heat treatment requirement",
          text:"Stress relief heat treatment is required for service above 232°C (450°F)." },

    54: { ref:"Material specification",
          text:"Maximum operating temperature is arbitrarily set at 260°C (500°F) because hard temper adversely affects design stress in the creep rupture temperature ranges." },

    55: { ref:"Material specification (API 5L)",
          text:"Pipe produced to this specification is not intended for high temperature service. Stress values apply to either non-expanded or cold expanded material in the as-rolled, normalized, or normalized and tempered condition." },

    56: { ref:"Engineering practice",
          text:"Because of thermal instability, this material is not recommended for service above 427°C (800°F)." },

    57: { ref:"para. F323.4(b)(2)",
          text:"Conversion of carbides to graphite may occur after prolonged exposure to temperatures over 427°C (800°F). See para. F323.4(b)(2)." },

    58: { ref:"para. F323.4(b)(3)",
          text:"Conversion of carbides to graphite may occur after prolonged exposure to temperatures over 468°C (875°F). See para. F323.4(b)(3)." },

    59: { ref:"para. F323.4(b)(4)",
          text:"For temperatures above 482°C (900°F), consider the advantages of killed steel. See para. F323.4(b)(4)." },

    60: { ref:"Material specification (A193 bolting)",
          text:"For all design temperatures, maximum hardness shall be Rockwell C35 immediately under thread roots. Hardness taken on a flat area at least 3 mm (⅛ in.) across, prepared by removing threads. Determination made at same frequency as tensile tests." },

    61: { ref:"Heat treatment",
          text:"Annealed at approximately 982°C (1,800°F)." },

    62: { ref:"Heat treatment",
          text:"Annealed at approximately 1,121°C (2,050°F)." },

    63: { ref:"Material specification (aluminium)",
          text:"For stress relieved tempers (T351, T3510, T3511, T451, T4510, T4511, T651, T6510, T6511), stress values for material in the listed temper shall be used." },

    64: { ref:"ASME BPVC Section IX QW-462.1",
          text:"The minimum tensile strength of the reduced section tensile specimen per QW-462.1 shall not be less than 758 MPa (110.0 ksi)." },

    65: { ref:"Material specification (A203 Ni steel plates)",
          text:"The minimum temperature shown is for the heaviest wall meeting spec mechanical properties. For lighter walls: A203 A/B max 51 mm → −68°C, over 51–76 mm → −59°C; A203 D/E max 51 mm → −101°C, over 51–76 mm → −87°C." },

    66: { ref:"Material specification",
          text:"Stress values shown are 90% of those for the corresponding core material." },

    67: { ref:"para. 331, A671/A672/A691",
          text:"For use under this Code, heat treatment requirements for pipe manufactured to A671, A672, and A691 shall be as required by para. 331 for the particular material being used." },

    68: { ref:"Material specification",
          text:"Tension test specimen from plate 12.7 mm (½ in.) and thicker is machined from the core and does not include cladding alloy; therefore, stress values listed are for materials less than 12.7 mm." },

    69: { ref:"Pressure limitation",
          text:"This material may be used only in non-pressure applications." },

    70: { ref:"Engineering practice (Alloy 625)",
          text:"Alloy 625 (UNS N06625) in the annealed condition is subject to severe loss of impact strength at room temperature after exposure in the range 538°C to 760°C (1,000°F to 1,400°F)." },

    71: { ref:"Material specification (API 5L / HSLA)",
          text:"These materials are normally microalloyed with Cb, V, and/or Ti. Supplemental specifications commonly establish more restrictive chemistry, plate rolling specifications, and requirements for weldability (C-equivalent) and toughness." },

    72: { ref:"Welding requirement",
          text:"For service temperature above 454°C (850°F), weld metal shall have a carbon content greater than 0.05%." },

    73: { ref:"Table 331.1.1 (zirconium)",
          text:"Heat treatment is required after welding for all products of zirconium Grade R60705. See Table 331.1.1." },

    74: { ref:"B366 Table 2",
          text:"Mechanical properties of fittings made from forging stock shall meet minimum tensile requirements of one of the bar, forging, or rod specifications listed in Table 2 of B366 for which tensile testing is required." },

    75: { ref:"Material specification (Cr-Mo)",
          text:"Stress values shown are for materials in the normalized and tempered condition, or when heat treatment is unknown. If material is annealed, use reduced values above 510°C (950°F): 538°C → 55.1 MPa; 566°C → 39.3 MPa; 593°C → 26.2 MPa; 621°C → 16.5 MPa; 649°C → 9.6 MPa." },

    77: { ref:"CSA Z245.1 equivalence",
          text:"Pipe grades produced per CSA Z245.1 are considered equivalent to API 5L and treated as listed materials. Equivalents: B↔241, X42↔290, X46↔317, X52↔359, X56↔386, X60↔414, X65↔448, X70↔483, X80↔550." },

    78: { ref:"Table 302.3.5",
          text:"Not permitted for the P4 and P5 materials in Table 302.3.5 for Elevated Temperature Fluid Service." },

    79: { ref:"para. 323.3",
          text:"For use under this Code, impact testing shall be performed per para. 323.3 at the design minimum temperature but not warmer than −29°C (−20°F)." },

    /* --- Additional notes from earlier range not previously included --- */
    "9a":{ ref:"Table 326.1, B564",
           text:"Component standards in Table 326.1 impose the following restrictions on this material when used as a forging: composition, properties, heat treatment, and grain size shall conform to this specification; manufacturing procedures, tolerances, tests, certification, and markings shall be per ASTM B564." },

    10: { ref:"para. 302.3.3",
          text:"This casting quality factor is applicable only when proper supplementary examination has been performed." },

    11: { ref:"Heat treatment",
          text:"For use under this Code, radiography shall be performed after heat treatment." },

    21: { ref:"Material specification",
          text:"For material thickness greater than 127 mm (5 in.), the specified minimum tensile strength is 483 MPa (70 ksi)." },

    "21a":{ ref:"Material specification",
            text:"For material thickness greater than 127 mm (5 in.), the specified minimum tensile strength is 448 MPa (65 ksi)." },

    22: { ref:"Material specification",
          text:"Minimum tensile strength for weld qualification and stress values shown shall be multiplied by 0.90 for pipe with OD less than 51 mm (2 in.) and D/t less than 15. May be waived if the welding procedure consistently produces welds meeting the listed minimum tensile strength of 165 MPa (24 ksi)." },

    24: { ref:"Material specification",
          text:"Yield strength is not stated in the material specification. The value shown is based on yield strengths of materials with similar characteristics." },

    33: { ref:"Welding practice",
          text:"For welded construction with work hardened grades, use stress values for annealed material; for welded construction with precipitation hardened grades, use special stress values for welded construction given in the Tables." },

    34: { ref:"Welding/brazing/soldering",
          text:"If material is welded, brazed, or soldered, the allowable stress values for the annealed condition shall be used." }
  };

  /* --- General Notes for Tables A-1, A-1A, A-1B, A-2, A-2M --- */
  const TABLE_A1_GENERAL_NOTES = {
    a: "The allowable stress values, P-Number assignments, weld joint and casting quality factors, and minimum temperatures in Tables A-1, A-1A, A-1B, A-2, and A-2M, together with the referenced Notes in the stress tables, are requirements of this Code.",
    b: "Notes (1) through (7) are referenced in column headings and body headings for material type and product form; Notes (8) and following are referenced in the Notes column for specific materials. Notes marked with an asterisk (*) restate requirements found in the text of the Code.",
    c: "The stress values given in ksi (Tables A-1/A-2) and in MPa (Tables A-1M/A-2M) may be used. The ksi and MPa values are not exact equivalents; for any given material, use only one system consistently.",
    d: "Copper and copper alloy temper symbols: H = drawn; H01 = quarter hard; H02 = half hard; H06 = extra hard; H55 = light drawn; H58 = drawn general purpose; H80 = hard drawn; HR50 = drawn stress relieved; M20 = hot rolled; O25 = hot rolled annealed; O50 = light annealed; O60 = soft annealed; O61 = annealed; WO50 = welded annealed; WO61 = welded fully finished annealed.",
    e: "Nickel and nickel alloy Class column abbreviations: ann. = annealed; C.D. = cold worked; forg. = forged; H.F. = hot finished; H.R. = hot rolled; H.W. = hot worked; plt. = plate; R. = rolled; rel. = relieved; sol. = solution; str. = stress; tr. = treated.",
    f: "Table A-1M Product Form abbreviations: forg. = forgings; ftg. = fittings; pl. = plate; shps. = shapes; sht. = sheet; smls. = seamless; struct. = structural; wld. = welded."
  };

  /* --- Deleted notes (for completeness / cross-reference) --- */
  const TABLE_A1_DELETED_NOTES = [16, 17, 18, 23, "42a", 44, 38, 76];

  /* ==================================================================
     P-NUMBERS — Base Metal Groupings for Welding Qualification
     ------------------------------------------------------------------
     Per ASME BPVC Section IX, QW-200.3 and QW/QB-422.
     P-Numbers group similar base metals so that qualification of a
     welding procedure on one material in a P-Number group qualifies the
     procedure for all materials in that group (subject to other essential
     variable restrictions).

     Referenced by Table A-1 Note (5).
     ================================================================== */
  const P_NUMBERS = {
    1:    { metal:"Carbon Manganese Steels", groups:4,
            typical:"A106 Gr.B, A53 Gr.B, A333 Gr.6, A516 Gr.60/70, A105, A234 WPB, API 5L B/X42–X80" },
    2:    { metal:"Not Used", groups:0, typical:"—" },
    3:    { metal:"½Mo or ½Cr-½Mo Steels", groups:3,
            typical:"A335 P1, A234 WP1, A182 F1" },
    4:    { metal:"1¼Cr-½Mo Steels", groups:2,
            typical:"A335 P11, A234 WP11, A182 F11" },
    "5A": { metal:"2¼Cr-1Mo Steels", groups:1,
            typical:"A335 P22, A234 WP22, A182 F22" },
    "5B": { metal:"5Cr-½Mo or 9Cr-1Mo Steels", groups:2,
            typical:"A335 P5, P9, A182 F5, F9" },
    "5C": { metal:"Cr-Mo-V Steels", groups:5,
            typical:"A335 P91, A182 F91" },
    6:    { metal:"Martensitic Stainless Steels", groups:6,
            typical:"Grade 410, 415, 429" },
    7:    { metal:"Ferritic Stainless Steels", groups:1,
            typical:"Grade 409, 430" },
    8:    { metal:"Austenitic Stainless Steels", groups:4,
            typical:"Gr.1: 304, 316, 317, 347; Gr.2: 309, 310; Gr.3: High Mn; Gr.4: High Mo" },
    "9A": { metal:"2–4% Nickel Steels", groups:1, typical:"A203 Gr.A/B (2¼Ni)" },
    "9B": { metal:"2–4% Nickel Steels", groups:1, typical:"A203 Gr.D/E (3½Ni)" },
    "9C": { metal:"2–4% Nickel Steels", groups:1, typical:"—" },
    "10A":{ metal:"Various Low Alloy Steels", groups:1, typical:"Cr-V, Mn-V steels" },
    "10B":{ metal:"Various Low Alloy Steels", groups:1, typical:"—" },
    "10C":{ metal:"Various Low Alloy Steels", groups:1, typical:"—" },
    "10F":{ metal:"Various Low Alloy Steels", groups:1, typical:"—" },
    "10H":{ metal:"Duplex and Super Duplex Stainless Steel", groups:1,
            typical:"S31803 (2205), S32750 (2507)" },
    "10I":{ metal:"High Chromium Stainless Steel", groups:1, typical:"—" },
    "10J":{ metal:"High Chromium, Molybdenum Stainless Steel", groups:1, typical:"—" },
    "10K":{ metal:"High Chromium, Molybdenum, Nickel Stainless Steel", groups:1, typical:"—" },
    "11A":{ metal:"Various High Strength Low Alloy Steels", groups:6,
            typical:"A694 F52–F70, A860 WPHY grades" },
    "11B":{ metal:"Various High Strength Low Alloy Steels", groups:10, typical:"—" },
    "15E":{ metal:"9Cr-1Mo (modified) Steels", groups:1,
            typical:"A335 P91/P92, A182 F91/F92" },
    21:   { metal:"Aluminium — High Al Content", groups:1, typical:"1000 and 3000 series" },
    22:   { metal:"Aluminium — 5000 Series", groups:1, typical:"5052, 5454" },
    23:   { metal:"Aluminium — 6000 Series", groups:1, typical:"6061, 6063" },
    25:   { metal:"Aluminium — 5000 Series (High Mg)", groups:1, typical:"5083, 5086, 5456" },
    31:   { metal:"High Copper Content", groups:1, typical:"Cu pipe/tube (B42, B75)" },
    32:   { metal:"Brass", groups:1, typical:"Cu-Zn alloys" },
    33:   { metal:"Copper Silicon", groups:1, typical:"Cu-Si alloys (B96, B98)" },
    34:   { metal:"Copper Nickel", groups:1, typical:"Cu-Ni 90/10, 70/30 (B466, B467)" },
    35:   { metal:"Copper Aluminium", groups:1, typical:"Al-Bronze (B148, B150)" },
    41:   { metal:"High Nickel Content", groups:1, typical:"Nickel 200/201 (B161, B162)" },
    42:   { metal:"Nickel-Copper", groups:1, typical:"Monel 400/K-500 (B165, B164)" },
    43:   { metal:"Nickel-Chromium-Iron", groups:1,
            typical:"Inconel 600/625, Hastelloy C22/C276/X (B167, B444, B574)" },
    44:   { metal:"Nickel-Molybdenum", groups:1, typical:"Hastelloy B2 (B333, B335)" },
    45:   { metal:"Nickel-Chromium-Silicon", groups:1, typical:"—" },
    46:   { metal:"Nickel-Chromium-Silicone", groups:1, typical:"—" },
    47:   { metal:"Nickel-Chromium-Tungsten", groups:1, typical:"—" },
    51:   { metal:"Titanium Alloys — Unalloyed", groups:1, typical:"Gr.1, Gr.2 (B861, B862)" },
    52:   { metal:"Titanium Alloys — Alpha/Near-Alpha", groups:1, typical:"Gr.5, Gr.12" },
    53:   { metal:"Titanium Alloys — Alpha-Beta", groups:1, typical:"—" },
    61:   { metal:"Zirconium Alloys — Unalloyed", groups:1, typical:"R60702 (B523, B550)" },
    62:   { metal:"Zirconium Alloys — Alloyed", groups:1, typical:"R60705" },
    81:   { metal:"Cobalt and Cobalt-Based Alloys", groups:1, typical:"—" }
  };

  /* ==================================================================
     A-NUMBERS — Weld Metal Classification (Ferrous Only)
     ------------------------------------------------------------------
     Per ASME BPVC Section IX, Table QW-442.
     The A-Number classifies ferrous weld metal deposits by chemical
     composition for procedure qualification. It is an essential variable
     for several welding processes.

     Values shown are maximum percentages unless a range is given.
     ================================================================== */
  const A_NUMBERS = {
    1:  { type:"Mild Steel",
          C:0.20, Cr:0.20, Mo:0.30, Ni:0.50, Mn:1.60, Si:1.00 },
    2:  { type:"Carbon-Molybdenum",
          C:0.15, Cr:0.50, Mo:"0.40–0.65", Ni:0.50, Mn:1.60, Si:1.00 },
    3:  { type:"Chrome (0.4–2%)-Molybdenum",
          C:0.15, Cr:"0.40–2.00", Mo:"0.40–0.65", Ni:0.50, Mn:1.60, Si:1.00 },
    4:  { type:"Chrome (2–4%)-Molybdenum",
          C:0.15, Cr:"2.00–4.00", Mo:"0.40–1.50", Ni:0.50, Mn:1.60, Si:2.00 },
    5:  { type:"Chrome (4–10.5%)-Molybdenum",
          C:0.15, Cr:"4.00–10.50", Mo:"0.40–1.50", Ni:0.80, Mn:1.20, Si:2.00 },
    6:  { type:"Chrome-Martensitic",
          C:0.15, Cr:"11.00–15.00", Mo:0.70, Ni:0.80, Mn:2.00, Si:1.00 },
    7:  { type:"Chrome-Ferritic",
          C:0.15, Cr:"11.00–30.00", Mo:1.00, Ni:0.80, Mn:1.00, Si:3.00 },
    8:  { type:"Chromium-Nickel (Austenitic)",
          C:0.15, Cr:"14.50–30.00", Mo:4.00, Ni:"7.50–15.00", Mn:2.50, Si:1.00 },
    9:  { type:"Chromium-Nickel (High Ni Austenitic)",
          C:0.30, Cr:"19.00–30.00", Mo:6.00, Ni:"15.00–37.00", Mn:2.50, Si:1.00 },
    10: { type:"Nickel to 4%",
          C:0.15, Cr:0.50, Mo:0.55, Ni:"0.80–4.00", Mn:1.70, Si:1.00 },
    11: { type:"Manganese-Molybdenum",
          C:0.17, Cr:0.50, Mo:"0.25–0.75", Ni:0.85, Mn:"1.25–2.25", Si:1.00 },
    12: { type:"Nickel-Chrome-Molybdenum",
          C:0.15, Cr:1.50, Mo:"0.25–0.80", Ni:"1.25–2.80", Mn:"0.75–2.25", Si:1.00 },
    _notes: [
      "Single values shown are maximum percentages.",
      "Only listed elements are used to determine A-Numbers."
    ]
  };

  /* ==================================================================
     FIGURE 323.2.2A — Impact Test Exemption Curves & Notes
     ------------------------------------------------------------------
     For carbon steels with a letter designation (A, B, C, D) in the
     Min. Temp. column of Table A-1. The actual minimum design metal
     temperature (MDMT) without impact testing depends on the nominal
     wall thickness — read from the applicable curve in Figure 323.2.2A.

     CURVE ASSIGNMENTS (typical, from Code and Figure notes):
       A — Most conservative (warmest MDMT for given thickness).
           e.g. A515, A516 (non-normalized), A671/A672 from A515 plate
       B — Moderate. e.g. A53 Gr.B, A106 Gr.B, A135 Gr.B,
           API 5L X-grades (if normalized or Q&T — see Note 3)
       C — Less conservative. e.g. A516 all grades (if normalized —
           see Note 4 below re Curve D option), A537 Cl.1
       D — Least conservative (coldest MDMT for given thickness).
           e.g. A516 all grades IF normalized (per Note 4),
           A671/A672 from normalized A516 plate (per Note 4),
           A333 Gr.1 & Gr.6, A334 Gr.1 & Gr.6

     FIGURE 323.2.2A NOTES (from the Code figure):
       (1) For blind flanges and blanks with a letter designation,
           T = ¼ of total thickness (including facing thickness).
       (2) Any carbon steel may be used to −29°C (−20°F) for
           Category D Fluid Service.
       (3) API 5L X-grades and A381 may use Curve B if normalized
           or quenched and tempered.
       (4) The following may use Curve D if normalized:
           (a) A516 plate, all grades
           (b) A671 pipe made from A516 plate, all grades
           (c) A672 pipe made from A516 plate, all grades
       (5) Welding procedure for manufacture of pipe/components shall
           include impact testing of welds and HAZ for any MDMT below
           −29°C (−20°F), except as provided in Table 323.2.2 A-3(b).
       (6) Impact testing per para. 323.3 is required for any MDMT
           below −48°C (−55°F), except as permitted by Table 323.2.2
           Note (3).

     DIGITISED CURVE DATA (approximate, from Figure 323.2.2A):
       Thickness in mm, temperature in °C.
       For intermediate values, interpolate linearly.
     ================================================================== */
  const CURVES_323 = {
    description: "ASME B31.3 Figure 323.2.2A — Impact Test Exemption Curves. " +
                 "MDMT (°C) vs nominal thickness (mm). Interpolate linearly for intermediate thicknesses.",
    thickness_mm: [6, 8, 10, 13, 16, 19, 25, 32, 38, 50, 64, 75, 100, 125, 150],
    /* Temperatures in °C for each thickness point above */
    A: [-18, -12, -7, -1, 4, 9, 16, 22, 27, 33, 38, 41, 47, 51, 54],
    B: [-30, -26, -22, -18, -14, -10, -4, 1, 6, 12, 17, 20, 26, 30, 33],
    C: [-40, -37, -34, -30, -27, -23, -18, -13, -9, -3, 2, 5, 10, 14, 17],
    D: [-52, -49, -46, -43, -40, -37, -33, -29, -25, -20, -16, -13, -8, -4, -1],
    notes: {
      1: "For blind flanges/blanks with letter designation, T = ¼ of total thickness including facing.",
      2: "Any carbon steel may be used to −29°C (−20°F) for Category D Fluid Service.",
      3: "API 5L X-grades and A381 may use Curve B if normalized or quenched and tempered.",
      4: "A516 plate (all grades), A671 and A672 pipe from A516 plate may use Curve D if normalized.",
      5: "Welding procedure shall include weld/HAZ impact testing for any MDMT below −29°C (−20°F), except per Table 323.2.2 A-3(b).",
      6: "Impact testing per para. 323.3 required for any MDMT below −48°C (−55°F), except per Table 323.2.2 Note (3)."
    }
  };

  /* ---- helper: look up MDMT from curve designation and thickness ---- */
  function curveMDMT(curve, thickness_mm) {
    const t = CURVES_323.thickness_mm;
    const temps = CURVES_323[curve];
    if (!temps) return null;
    if (thickness_mm <= t[0]) return { mdmt_C: temps[0], clamp: "below_min_thickness" };
    if (thickness_mm >= t[t.length - 1]) return { mdmt_C: temps[temps.length - 1], clamp: "above_max_thickness" };
    for (let i = 0; i < t.length - 1; i++) {
      if (thickness_mm >= t[i] && thickness_mm <= t[i + 1]) {
        const f = (thickness_mm - t[i]) / (t[i + 1] - t[i]);
        return { mdmt_C: Math.round(temps[i] + f * (temps[i + 1] - temps[i])), clamp: null };
      }
    }
    return null;
  }

  /* ==================================================================
     ASME B31.3 PARA. 323 — GENERAL MATERIAL REQUIREMENTS
     ------------------------------------------------------------------
     Per ASME B31.3 – 2020 Edition, Chapter III.
     Paraphrased engineering summaries for API guidance — NOT verbatim
     Code text. Always refer to the governing Code edition for
     contractual compliance.

     Structured for use as tooltip / guidance content in the API response
     when a user queries material suitability, temperature limits, or
     impact testing requirements.
     ================================================================== */
  const PARA_323 = {

    /* --- 323.1 Materials and Specifications --- */
    "323.1": {
      "323.1.1": {
        title: "Listed Materials",
        text: "Any material used in pressure-containing piping components shall conform to a listed specification, except as provided in para. 323.1.2."
      },
      "323.1.2": {
        title: "Unlisted Materials",
        text: "Unlisted materials may be used provided they conform to a published specification covering chemistry, physical and mechanical properties, method and process of manufacture, heat treatment, and quality control, and otherwise meet Code requirements. Allowable stresses shall be determined per the Code's allowable stress basis or a more conservative basis. See also ASME BPVC Section II Part D Appendix 5."
      },
      "323.1.3": {
        title: "Unknown Materials",
        text: "Materials of unknown specification shall not be used for pressure-containing piping components."
      },
      "323.1.4": {
        title: "Reclaimed Materials",
        text: "Reclaimed pipe and components may be used if properly identified as conforming to a listed or published specification and meeting Code requirements. Sufficient cleaning and inspection shall determine minimum wall thickness and freedom from unacceptable imperfections."
      }
    },

    /* --- 323.2 Temperature Limitations --- */
    "323.2": {
      preamble: "The designer shall verify that materials meeting other Code requirements are suitable for service throughout the operating temperature range.",

      "323.2.1": {
        title: "Upper Temperature Limits, Listed Materials",
        text: "A listed material may be used above the maximum temperature for which a stress value or rating is shown, only if: (a) there is no prohibition in Appendix A or elsewhere in the Code; and (b) the designer verifies serviceability per para. 323.2.4."
      },

      "323.2.2": {
        title: "Lower Temperature Limits, Listed Materials",
        preamble: "Listed materials shall be impact tested as described in Table 323.2.2 except as exempted by (d) through (j). See Appendix F, para. F323.2.2.",
        clauses: {
          a: {
            text: "The allowable stress or component rating at any temperature colder than the minimum shown in Table A-1 or Figure 323.2.2A shall not exceed the stress value or rating at the minimum temperature."
          },
          b: {
            title: "Stress Ratio (for Figure 323.2.2B temperature reduction)",
            text: "The stress ratio is used in Figure 323.2.2B to determine the allowable reduction in impact test exemption temperature. It is defined as the maximum of: (1) circumferential pressure stress / basic allowable stress; (2) for rated components, pressure / pressure rating; (3) combined stress (pressure + dead + live + displacement strain) / basic allowable stress — calculated using nominal dimensions with all stress indices = 1.0, section properties based on nominal dimensions less allowances."
          },
          c: {
            title: "Conditions for Temperature Reduction",
            text: "Minimum impact test exemption temperature reduction (via Figure 323.2.2B) may only be used when ALL of: (1) piping is not in Elevated Temperature Fluid Service; (2) local stresses from shock, thermal bowing, and dissimilar metal differential expansion are less than 10% of basic allowable stress; (3) piping is safeguarded from maintenance loads."
          },
          d: {
            title: "Base Metal Exemption",
            text: "Impact testing of base metal is not required if the design minimum temperature is warmer than or equal to the Min. Temp. column value in Table A-1, except for austenitic stainless steel per Table 323.2.2 Box A-4(a). Welds may still require impact testing per (f) or Table 323.2.2 Box B-6."
          },
          e: {
            title: "Carbon Steel Letter Designation (Curves A/B/C/D)",
            text: "For carbon steels with a letter designation in the Min. Temp. column, the minimum temperature is defined by the applicable curve and notes in Figure 323.2.2A. If the design minimum temperature–thickness combination is on or above the curve, the impact testing exemption in (d) applies. Use PPA.curveMDMT() to look up the MDMT for a given curve and thickness."
          },
          f: {
            title: "Weld Impact Testing",
            text: "For steel materials, impact testing of welds (including manufacturing welds such as seam-welded pipe and welded tees) is required if either base material requires impact testing OR if the design minimum temperature is colder than −18°C (0°F). Exceptions: manufacturing welds in austenitic stainless steel with C ≤ 0.10% in solution heat treated condition, or per Table 323.2.2 Boxes A-3(b) and A-4(b). Production weld impact testing per Table 323.2.2 Note (2)."
          },
          g: {
            title: "Low Stress Ratio Exemption",
            text: "For steels (including welds), impact testing is not required if stress ratio ≤ 0.3, design minimum temperature ≥ −104°C (−155°F), and conditions of (c) apply."
          },
          h: {
            title: "Temperature Reduction — Without Impact Testing",
            text: "For carbon, low alloy, and intermediate alloy steel materials (including welds) NOT qualified by impact testing: the minimum temperature from Table A-1 or Figure 323.2.2A may be reduced to no colder than −48°C (−55°F) using Figure 323.2.2B, when (c) applies. For welds requiring impact testing per Table 323.2.2 Box A-3(b), the temperature reduction is applied from −29°C (−20°F)."
          },
          i: {
            title: "Temperature Reduction — With Impact Testing",
            text: "For carbon, low alloy, and intermediate alloy steel materials (including welds) that HAVE been qualified by impact testing: the permitted design minimum temperature may be reduced to no colder than −104°C (−155°F) using Figure 323.2.2B, when (c) applies."
          },
          j: {
            title: "Weld Metal Exemptions (Austenitic)",
            text: "Impact testing is not required for: (1) austenitic stainless steel base materials with C ≤ 0.10%, welded without filler metal, at MDMT ≥ −104°C (−155°F); (2a) austenitic weld metal with C ≤ 0.10%, filler metals per AWS A5.4/A5.9/A5.11/A5.14/A5.221, at MDMT ≥ −104°C (−155°F); (2b) austenitic weld metal with C > 0.10%, same AWS fillers, at MDMT ≥ −48°C (−55°F)."
          }
        }
      },

      "323.2.3": {
        title: "Temperature Limits, Unlisted Materials",
        text: "An unlisted material acceptable under para. 323.1.2 shall be qualified for service at all temperatures within a stated range, from design minimum to design maximum temperature, per para. 323.2.4."
      },

      "323.2.4": {
        title: "Verification of Serviceability",
        text: "When an unlisted material is to be used, or when a listed material is used above the highest temperature for which stress values appear in Appendix A, the designer is responsible for demonstrating the validity of allowable stresses and other design limits."
      }
    },

    /* --- Table 323.2.2 Notes --- */
    "Table_323.2.2_notes": {
      1: "Carbon steels subject to Box B-2 limitations: plates per A36, A283, A570; pipe per A134 made from these plates; structural shapes per A992; pipe per A53 Type F and API 5L Gr. A25 butt weld.",
      2: "Impact tests meeting Table 323.3.1 requirements, performed as part of weld procedure qualification, satisfy all para. 323.2.2 requirements and need not be repeated for production welds.",
      3: "See paras. 323.2.2(g) through (i) for stress-ratio-based exemptions and temperature reductions.",
      4: "Impact tests are not required when maximum obtainable Charpy specimen width along the notch is less than 2.5 mm (0.098 in.). Under these conditions, if stress ratio > 0.3, MDMT shall not be colder than the lower of −48°C (−55°F) or the Table A-1 minimum. See also para. 323.2.2(g).",
      5: "Impact tests are not required when maximum obtainable Charpy specimen width along the notch is less than 2.5 mm (0.098 in.).",
      6: "For austenitic stainless steels, impact testing is not required if MDMT ≥ −104°C (−155°F) and stress ratio ≤ 0.3. See also para. 323.2.2(g).",
      7: "Alternative tests may include tensile elongation, sharp-notch tensile strength (compared with unnotched), or other tests conducted at or colder than design minimum temperature. See also para. 323.3.4."
    }
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
  Object.assign(g.PPA, {
    MATERIALS, RHO, COST, WELD, WELD_LEVEL_RANK,
    ASTM_SPECS, TABLE_A1_NOTES, TABLE_A1_GENERAL_NOTES, TABLE_A1_DELETED_NOTES,
    P_NUMBERS, A_NUMBERS,
    CURVES_323, curveMDMT, PARA_323,
    interp, convert, UNITS
  });
})(window);
