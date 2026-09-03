/* =============================================================================
 *  ppa-bolting.js  —  PipingPro Academy shared bolting data library   v1.0
 *  ---------------------------------------------------------------------------
 *  SINGLE SOURCE OF TRUTH for bolt allowable stresses, thread geometry,
 *  and companion nut data used by flange verification, TBE, and bolt
 *  load calculators.
 *
 *  BASE UNITS: US Customary (canonical).
 *      Stress (Sb) ............ ksi
 *      Dimensions ............. inches
 *      Areas .................. in²
 *      Temperature ............ °F
 *
 *  SOURCES:
 *      ASME B31.3-2020 Table A-2  — Design Stress Values for Bolting Materials
 *      ASME B1.1                  — Thread dimensions (UNC / 8UN series)
 *
 *  PHASE 1 SCOPE — Core O&G grades (covers 95%+ of piping material classes):
 *      Alloy steel:    A193 B7, B7M, B16, B5; A320 L7, L7M, L43; A354 BC, BD
 *      Stainless steel: A193 B8, B8M, B8T — Class 1 & Class 2 (key size ranges)
 *      Specialty SS:   A193 B6; A437 B4C
 *      Companion nuts: A194 2H, 4, 7, 7M, 8, 8M, 8MA, 8TA
 *
 *  Copyright © 2026 Zephrum Konsultan Limited. All rights reserved.
 * ========================================================================== */

// ============================================================
// TEMPERATURE STEPS (°F) for stress arrays
// Each bolt entry's `Sb` array is indexed to these temperatures.
// Null = not permitted at that temperature.
// ============================================================

const PPA_BOLT_TEMPS = [100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300];


// ============================================================
// SECTION 1:  BOLT DESIGN STRESS — Alloy Steel
// ASME B31.3-2020, Table A-2
// Sb in ksi at metal temperature °F
// ============================================================

const PPA_BOLT_ALLOY = [

  // --- A193 B7M (Cr-0.2Mo, ≤4") ---
  { id:'B7M',  spec:'A193', grade:'B7M', uns:'G41400', comp:'Cr-0.2Mo',
    sizeRange:'≤4 in.', minTemp:-55, tensile:100, yield:80,
    Sb:[20.0,20.0,20.0,20.0,20.0, 20.0,20.0,20.0,20.0,18.5,16.3,12.5,8.5,4.5,2.4, null,null,null,null,null] },

  // --- A193 B7 (Cr-Mo, >2½ ≤4") ---
  { id:'B7_LG', spec:'A193', grade:'B7', uns:'G41400', comp:'Cr-Mo',
    sizeRange:'>2½, ≤4 in.', minTemp:-40, tensile:115, yield:95,
    Sb:[23.0,23.0,23.0,23.0,23.0, 23.0,23.0,23.0,23.0,20.0,16.3,12.5,8.5,4.5,2.4, null,null,null,null,null] },

  // --- A193 B7 (Cr-Mo, ≤2½") — MOST COMMON ---
  { id:'B7',   spec:'A193', grade:'B7', uns:'G41400', comp:'Cr-Mo',
    sizeRange:'≤2½ in.', minTemp:-55, tensile:125, yield:105,
    Sb:[25.0,25.0,25.0,25.0,25.0, 25.0,25.0,25.0,25.0,25.0,21.0,17.0,12.5,8.5,4.5,2.4, null,null,null,null] },

  // --- A193 B16 (Cr-Mo-V, >2½ ≤4") ---
  { id:'B16_LG', spec:'A193', grade:'B16', uns:'K14072', comp:'Cr-Mo-V',
    sizeRange:'>2½, ≤4 in.', minTemp:-20, tensile:110, yield:95,
    Sb:[22.0,22.0,22.0,22.0,22.0, 22.0,22.0,22.0,22.0,22.0,21.0,18.5,15.3,11.0,6.3,2.8,1.2, null,null,null] },

  // --- A193 B16 (Cr-Mo-V, ≤2½") ---
  { id:'B16',  spec:'A193', grade:'B16', uns:'K14072', comp:'Cr-Mo-V',
    sizeRange:'≤2½ in.', minTemp:-20, tensile:125, yield:105,
    Sb:[25.0,25.0,25.0,25.0,25.0, 25.0,25.0,25.0,25.0,25.0,23.5,20.5,16.0,11.0,6.3,2.8,1.2, null,null,null] },

  // --- A193 B5 (5Cr, ≤4") ---
  { id:'B5',   spec:'A193', grade:'B5', uns:'S50100', comp:'5Cr',
    sizeRange:'≤4 in.', minTemp:-20, tensile:100, yield:80,
    Sb:[20.0,20.0,20.0,20.0,20.0, 20.0,20.0,20.0,20.0,20.0,14.3,10.9,8.0,5.8,4.2,2.9,1.8,1.0,0.6, null] },

  // --- A320 L7 (Cr-Mo, ≤2½") — Low temp ---
  { id:'L7',   spec:'A320', grade:'L7', uns:'G41400', comp:'Cr-Mo',
    sizeRange:'≤2½ in.', minTemp:-150, tensile:125, yield:105,
    Sb:[25.0,25.0,25.0,25.0,25.0, 25.0,25.0,25.0, null,null,null,null,null,null,null,null,null,null,null,null] },

  // --- A320 L7M (Cr-0.2Mo, ≤2½") — Low temp ---
  { id:'L7M',  spec:'A320', grade:'L7M', uns:'G41400', comp:'Cr-0.2Mo',
    sizeRange:'≤2½ in.', minTemp:-100, tensile:100, yield:80,
    Sb:[20.0,20.0,20.0,20.0,20.0, 20.0,20.0,20.0,20.0,18.5,16.3,12.5,8.5,4.5,2.4, null,null,null,null,null] },

  // --- A320 L43 (Ni-Cr-Mo, ≤4") — Low temp ---
  { id:'L43',  spec:'A320', grade:'L43', uns:'G43400', comp:'Ni-Cr-Mo',
    sizeRange:'≤4 in.', minTemp:-150, tensile:125, yield:105,
    Sb:[25.0,25.0,25.0,25.0,25.0, 25.0,25.0,25.0,25.0, null,null,null,null,null,null,null,null,null,null,null] },

  // --- A354 BC (Alloy steel, ≤2½") ---
  { id:'BC',   spec:'A354', grade:'BC', uns:'K04100', comp:'Alloy steel',
    sizeRange:'≤2½ in.', minTemp:0, tensile:125, yield:109,
    Sb:[25.0,25.0,25.0,25.0,25.0, 25.0,25.0, null,null,null,null,null,null,null,null,null,null,null,null,null] },

  // --- A354 BC (Alloy steel, >2½ ≤4") ---
  { id:'BC_LG', spec:'A354', grade:'BC', uns:'K04100', comp:'Alloy steel',
    sizeRange:'>2½, ≤4 in.', minTemp:0, tensile:115, yield:99,
    Sb:[23.0,23.0,23.0,23.0,23.0, 23.0,23.0, null,null,null,null,null,null,null,null,null,null,null,null,null] },

  // --- A354 BD (Alloy steel, ≤4") ---
  { id:'BD',   spec:'A354', grade:'BD', uns:'K04100', comp:'Alloy steel',
    sizeRange:'≤4 in.', minTemp:-20, tensile:150, yield:130,
    Sb:[30.0,30.0,30.0,30.0,30.0, 30.0,30.0, null,null,null,null,null,null,null,null,null,null,null,null,null] }
];


// ============================================================
// SECTION 2:  BOLT DESIGN STRESS — Stainless Steel
// Key grades and size ranges for O&G piping
// ============================================================

const PPA_BOLT_SS = [

  // --- A193 B8M Cl.2 (316SS, ≤¾") ---
  { id:'B8M_CL2_SM', spec:'A193', grade:'B8M Cl.2', uns:'S31600', comp:'16Cr-12Ni-2Mo',
    sizeRange:'≤¾ in.', cls:2, minTemp:-325, tensile:110, yield:95,
    Sb:[22.0,22.0,22.0,22.0,22.0, 22.0,22.0,22.0,22.0,22.0,22.0,22.0,22.0,22.0,22.0, null,null,null,null,null] },

  // --- A193 B8M Cl.2 (316SS, >¾ ≤1") ---
  { id:'B8M_CL2_MD', spec:'A193', grade:'B8M Cl.2', uns:'S31600', comp:'16Cr-12Ni-2Mo',
    sizeRange:'>¾, ≤1 in.', cls:2, minTemp:-325, tensile:100, yield:80,
    Sb:[20.0,20.0,20.0,20.0,20.0, 20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0, null,null,null,null,null] },

  // --- A193 B8M Cl.2 (316SS, >1 ≤1¼") ---
  { id:'B8M_CL2_LG', spec:'A193', grade:'B8M Cl.2', uns:'S31600', comp:'16Cr-12Ni-2Mo',
    sizeRange:'>1, ≤1¼ in.', cls:2, minTemp:-325, tensile:105, yield:65,
    Sb:[18.8,17.3,16.3,16.3,16.3, 16.3,16.3,16.3,16.3,16.3,16.3,16.3,16.3,16.3,16.3, null,null,null,null,null] },

  // --- A193 B8M Cl.2 (316SS, >1¼ ≤1½") ---
  { id:'B8M_CL2_XL', spec:'A193', grade:'B8M Cl.2', uns:'S31600', comp:'16Cr-12Ni-2Mo',
    sizeRange:'>1¼, ≤1½ in.', cls:2, minTemp:-325, tensile:90, yield:50,
    Sb:[18.8,17.3,15.6,14.3,13.3, 12.6,12.5,12.5,12.5,12.5,12.5,12.5,12.5,12.5,12.5, null,null,null,null,null] },

  // --- A193 B8M Cl.1 (316SS, solution treated) ---
  { id:'B8M_CL1', spec:'A193', grade:'B8M Cl.1', uns:'S31600', comp:'16Cr-12Ni-2Mo',
    sizeRange:'all', cls:1, minTemp:-325, tensile:75, yield:30,
    Sb:[18.8,17.3,15.6,14.3,13.3, 12.6,12.3,12.1,11.9,11.8,11.6,11.5,11.4,11.3,11.2,11.1,9.8,7.4,5.6,4.2] },

  // --- A193 B8 Cl.2 (304SS, ≤¾") ---
  { id:'B8_CL2_SM', spec:'A193', grade:'B8 Cl.2', uns:'S30400', comp:'18Cr-8Ni',
    sizeRange:'≤¾ in.', cls:2, minTemp:-325, tensile:125, yield:100,
    Sb:[25.0,25.0,25.0,25.0,25.0, 25.0,25.0,25.0,25.0,25.0,25.0,25.0,24.7,23.9,22.9, null,null,null,null,null] },

  // --- A193 B8 Cl.2 (304SS, >¾ ≤1") ---
  { id:'B8_CL2_MD', spec:'A193', grade:'B8 Cl.2', uns:'S30400', comp:'18Cr-8Ni',
    sizeRange:'>¾, ≤1 in.', cls:2, minTemp:-325, tensile:115, yield:80,
    Sb:[20.0,20.0,20.0,20.0,20.0, 20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0,20.0, null,null,null,null,null] },

  // --- A193 B8 Cl.2 (304SS, >1 ≤1¼") ---
  { id:'B8_CL2_LG', spec:'A193', grade:'B8 Cl.2', uns:'S30400', comp:'18Cr-8Ni',
    sizeRange:'>1, ≤1¼ in.', cls:2, minTemp:-325, tensile:105, yield:65,
    Sb:[18.8,16.7,16.3,16.3,16.3, 16.3,16.3,16.3,16.3,16.3,16.3,16.3,16.3,16.3,16.3, null,null,null,null,null] },

  // --- A193 B8 Cl.2 (304SS, >1¼ ≤1½") ---
  { id:'B8_CL2_XL', spec:'A193', grade:'B8 Cl.2', uns:'S30400', comp:'18Cr-8Ni',
    sizeRange:'>1¼, ≤1½ in.', cls:2, minTemp:-325, tensile:100, yield:50,
    Sb:[18.8,16.7,15.0,13.8,12.9, 12.5,12.5,12.5,12.5,12.5,12.5,12.5,12.5,12.5,12.5, null,null,null,null,null] },

  // --- A193 B8 Cl.1 (304SS, solution treated) ---
  { id:'B8_CL1', spec:'A193', grade:'B8 Cl.1', uns:'S30400', comp:'18Cr-8Ni',
    sizeRange:'all', cls:1, minTemp:-425, tensile:75, yield:30,
    Sb:[18.8,16.7,15.0,13.8,12.9, 12.3,12.0,11.7,11.5,11.2,11.0,10.8,10.6,10.4,10.1,9.8,7.7,6.1,4.7,3.7] },

  // --- A193 B8T Cl.2 (321SS, ≤¾") ---
  { id:'B8T_CL2_SM', spec:'A193', grade:'B8T Cl.2', uns:'S32100', comp:'18Cr-10Ni-Ti',
    sizeRange:'≤¾ in.', cls:2, minTemp:-325, tensile:125, yield:100,
    Sb:[25.0,25.0,25.0,25.0,25.0, 25.0,25.0,25.0,25.0,25.0,25.0,25.0,25.0,25.0,25.0, null,null,null,null,null] },

  // --- A193 B8T Cl.1 (321SS, solution treated) ---
  { id:'B8T_CL1', spec:'A193', grade:'B8T Cl.1', uns:'S32100', comp:'18Cr-10Ni-Ti',
    sizeRange:'all', cls:1, minTemp:-325, tensile:75, yield:30,
    Sb:[18.8,17.8,16.5,15.3,14.3, 13.5,13.2,13.0,12.7,12.6,12.4,12.3,12.1,12.0,9.6,6.9,5.0,3.6,2.6,1.7] },

  // --- A193 B6 (13Cr / 410SS, ≤4") ---
  { id:'B6', spec:'A193', grade:'B6', uns:'S41000', comp:'13Cr',
    sizeRange:'≤4 in.', cls:null, minTemp:-20, tensile:110, yield:85,
    Sb:[21.3,21.3,21.3,21.3,21.3, 21.3,21.3,21.3,21.3,21.3,21.3,20.2,18.7, null,null,null,null,null,null,null] },

  // --- A437 B4C (12Cr, high temp) ---
  { id:'B4C', spec:'A437', grade:'B4C', uns:'S42200', comp:'12Cr',
    sizeRange:'all', cls:null, minTemp:-20, tensile:115, yield:85,
    Sb:[21.3,21.3,21.3,21.3,21.3, 21.3,21.3,21.3,21.3, null,null,null,null,null,null,null,null,null,null,null] }
];


// ============================================================
// SECTION 3:  COMPANION NUT SPECIFICATIONS
// ASTM A194 — for reference / material class verification
// ============================================================

const PPA_NUTS = [
  { grade:'2H',  spec:'A194', uns:'K04002', comp:'Carbon steel',       minTemp:-55,  matchBolts:'B7, B7M, B16, BC, BD, L7' },
  { grade:'2HM', spec:'A194', uns:'K04002', comp:'Carbon steel',       minTemp:-55,  matchBolts:'B7M' },
  { grade:'4',   spec:'A194', uns:'K04002', comp:'Carbon steel (HIC)', minTemp:-55,  matchBolts:'B7M' },
  { grade:'7',   spec:'A194', uns:'G41400', comp:'Cr-Mo',              minTemp:-55,  matchBolts:'B7' },
  { grade:'7L',  spec:'A194', uns:'G41400', comp:'Cr-Mo',              minTemp:-150, matchBolts:'L7' },
  { grade:'7M',  spec:'A194', uns:'G41400', comp:'Cr-Mo',              minTemp:-55,  matchBolts:'B7M, L7M' },
  { grade:'7ML', spec:'A194', uns:'G41400', comp:'Cr-Mo',              minTemp:-100, matchBolts:'L7M' },
  { grade:'3',   spec:'A194', uns:'S50100', comp:'5Cr',                minTemp:-20,  matchBolts:'B5' },
  { grade:'6',   spec:'A194', uns:'S41000', comp:'12Cr',               minTemp:-20,  matchBolts:'B6, B4C' },
  { grade:'8',   spec:'A194', uns:'S30400', comp:'18Cr-8Ni (304)',     minTemp:-425, matchBolts:'B8 Cl.1, B8 Cl.2' },
  { grade:'8A',  spec:'A194', uns:'S30400', comp:'18Cr-8Ni (304)',     minTemp:-425, matchBolts:'B8 Cl.1, B8 Cl.2' },
  { grade:'8M',  spec:'A194', uns:'S31600', comp:'16Cr-12Ni-2Mo (316)',minTemp:-325, matchBolts:'B8M Cl.1, B8M Cl.2' },
  { grade:'8MA', spec:'A194', uns:'S31600', comp:'16Cr-12Ni-2Mo (316)',minTemp:-325, matchBolts:'B8M Cl.1, B8M Cl.2' },
  { grade:'8TA', spec:'A194', uns:'S32100', comp:'18Cr-10Ni-Ti (321)', minTemp:-325, matchBolts:'B8T Cl.1, B8T Cl.2' },
  { grade:'8CA', spec:'A194', uns:'S34700', comp:'18Cr-10Ni-Cb (347)', minTemp:-425, matchBolts:'B8C' }
];


// ============================================================
// SECTION 4:  BOLT THREAD DATA — UNC & 8UN Series
// Per ASME B1.1
// As = tensile stress area (in²)
// Ar = thread root area (in²)
// ============================================================

const PPA_BOLT_THREAD = [
  // { dia: nominal dia (in), tpi: threads/inch, series, As, Ar }
  { dia: 0.500, tpi: 13, series:'UNC',  As: 0.1419, Ar: 0.1257 },
  { dia: 0.625, tpi: 11, series:'UNC',  As: 0.2260, Ar: 0.2017 },
  { dia: 0.750, tpi: 10, series:'UNC',  As: 0.3345, Ar: 0.3019 },
  { dia: 0.875, tpi:  9, series:'UNC',  As: 0.4617, Ar: 0.4193 },
  { dia: 1.000, tpi:  8, series:'UNC',  As: 0.6057, Ar: 0.5510 },
  { dia: 1.125, tpi:  8, series:'8UN',  As: 0.7905, Ar: 0.7276 },
  { dia: 1.250, tpi:  8, series:'8UN',  As: 0.9940, Ar: 0.9229 },
  { dia: 1.375, tpi:  8, series:'8UN',  As: 1.2150, Ar: 1.1370 },
  { dia: 1.500, tpi:  8, series:'8UN',  As: 1.4544, Ar: 1.3697 },
  { dia: 1.625, tpi:  8, series:'8UN',  As: 1.7113, Ar: 1.6210 },
  { dia: 1.750, tpi:  8, series:'8UN',  As: 1.9865, Ar: 1.8907 },
  { dia: 1.875, tpi:  8, series:'8UN',  As: 2.2800, Ar: 2.1789 },
  { dia: 2.000, tpi:  8, series:'8UN',  As: 2.5918, Ar: 2.4856 },
  { dia: 2.250, tpi:  8, series:'8UN',  As: 3.2696, Ar: 3.1540 },
  { dia: 2.500, tpi:  8, series:'8UN',  As: 4.0022, Ar: 3.8771 },
  { dia: 2.750, tpi:  8, series:'8UN',  As: 4.7896, Ar: 4.6553 },
  { dia: 3.000, tpi:  8, series:'8UN',  As: 5.6317, Ar: 5.4883 },
  { dia: 3.250, tpi:  8, series:'8UN',  As: 6.5286, Ar: 6.3762 },
  { dia: 3.500, tpi:  8, series:'8UN',  As: 7.4802, Ar: 7.3189 },
  { dia: 3.750, tpi:  8, series:'8UN',  As: 8.4866, Ar: 8.3165 },
  { dia: 4.000, tpi:  8, series:'8UN',  As: 9.5477, Ar: 9.3689 }
];


// ============================================================
// SECTION 5:  COMMON BOLT-NUT PAIRINGS
// Quick reference for material class specification
// ============================================================

const PPA_BOLT_NUT_PAIRS = [
  { service:'Standard CS (ambient to 800°F)',   bolt:'A193 B7',      nut:'A194 2H'  },
  { service:'CS NACE/HIC/PWHT',                bolt:'A193 B7M',     nut:'A194 2HM' },
  { service:'High temp CS (to 1100°F)',         bolt:'A193 B16',     nut:'A194 4'   },
  { service:'Low temp CS (to -150°F)',          bolt:'A320 L7',      nut:'A194 7L'  },
  { service:'Low temp CS NACE (to -100°F)',     bolt:'A320 L7M',     nut:'A194 7ML' },
  { service:'5Cr-½Mo (Clad/CRA)',              bolt:'A193 B5',      nut:'A194 3'   },
  { service:'304SS standard',                   bolt:'A193 B8 Cl.1', nut:'A194 8'   },
  { service:'304SS high strength',              bolt:'A193 B8 Cl.2', nut:'A194 8A'  },
  { service:'316SS standard',                   bolt:'A193 B8M Cl.1',nut:'A194 8MA' },
  { service:'316SS high strength',              bolt:'A193 B8M Cl.2',nut:'A194 8M'  },
  { service:'321SS',                            bolt:'A193 B8T Cl.1',nut:'A194 8TA' },
  { service:'13Cr (410SS)',                      bolt:'A193 B6',      nut:'A194 6'   }
];


// ============================================================
// SECTION 6:  HELPER FUNCTIONS
// ============================================================

/**
 * Get bolt allowable stress (Sb) at a given temperature by interpolation.
 * @param {string} boltId - bolt id (e.g. 'B7', 'B8M_CL2_SM')
 * @param {number} tempF - metal temperature in °F
 * @returns {number|null} Sb in ksi, or null if beyond max use temp
 */
function boltSb(boltId, tempF) {
  const all = PPA_BOLT_ALLOY.concat(PPA_BOLT_SS);
  const b = all.find(x => x.id === boltId);
  if (!b) return null;
  const T = PPA_BOLT_TEMPS;
  const S = b.Sb;

  // Below minimum listed temperature
  if (tempF <= T[0]) return S[0];

  // Walk the array
  for (let i = 0; i < T.length - 1; i++) {
    if (S[i] === null) return null;
    if (tempF >= T[i] && tempF <= T[i + 1]) {
      if (S[i + 1] === null) return null;
      // Linear interpolation
      var frac = (tempF - T[i]) / (T[i + 1] - T[i]);
      return Math.round((S[i] + frac * (S[i + 1] - S[i])) * 100) / 100;
    }
  }
  // Beyond last temperature
  var last = S[T.length - 1];
  return last;
}

/**
 * Get thread stress area for a given bolt diameter.
 * @param {number} dia - nominal bolt diameter in inches
 * @returns {object|null} { dia, tpi, series, As, Ar } or null
 */
function boltThread(dia) {
  return PPA_BOLT_THREAD.find(t => Math.abs(t.dia - dia) < 0.001) || null;
}

/**
 * Find all bolt entries matching a grade string (case-insensitive partial match).
 * @param {string} gradeSearch - e.g. 'B7', 'B8M'
 * @returns {Array} matching bolt entries
 */
function boltsByGrade(gradeSearch) {
  const s = gradeSearch.toUpperCase();
  const all = PPA_BOLT_ALLOY.concat(PPA_BOLT_SS);
  return all.filter(b => b.grade.toUpperCase().includes(s));
}

/**
 * Calculate total bolt area for a flange.
 * @param {number} nBolts - number of bolts
 * @param {number} boltDia - nominal bolt diameter (in.)
 * @returns {number|null} total bolt root area Ab (in²), or null if dia not found
 */
function totalBoltArea(nBolts, boltDia) {
  var t = boltThread(boltDia);
  if (!t) return null;
  return nBolts * t.Ar;
}


// ============================================================
// EXPORT — attach to PPA global namespace
// ============================================================

if (typeof window !== 'undefined') {
  window.PPA = window.PPA || {};
  window.PPA.BOLT_TEMPS      = PPA_BOLT_TEMPS;
  window.PPA.BOLT_ALLOY      = PPA_BOLT_ALLOY;
  window.PPA.BOLT_SS         = PPA_BOLT_SS;
  window.PPA.NUTS            = PPA_NUTS;
  window.PPA.BOLT_THREAD     = PPA_BOLT_THREAD;
  window.PPA.BOLT_NUT_PAIRS  = PPA_BOLT_NUT_PAIRS;
  window.PPA.boltSb          = boltSb;
  window.PPA.boltThread      = boltThread;
  window.PPA.boltsByGrade    = boltsByGrade;
  window.PPA.totalBoltArea   = totalBoltArea;
}
