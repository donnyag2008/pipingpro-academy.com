/* =============================================================================
 *  ppa-gasket.js  —  PipingPro Academy shared gasket data library   v1.0
 *  ---------------------------------------------------------------------------
 *  SINGLE SOURCE OF TRUTH for gasket m & y factors, gasket dimensions,
 *  and all PPA calculators that reference gasket sealing data.
 *
 *  BASE UNITS: US Customary (canonical).
 *      Stress (y) ............. psi
 *      Dimensions ............. inches
 *      SI display is derived deterministically (see PPA.convert).
 *
 *  SOURCES:
 *      ASME BPV Code Sec VIII Div 1, Mandatory Appendix 2, Table 2-5.1
 *      ASME B16.21-1992  — Nonmetallic Flat Gaskets for Pipe Flanges
 *      ASME B16.20-2007  — Metallic Gaskets for Pipe Flanges
 *
 *  ARCHITECTURE:
 *      PPA_GASKET_MY ......... m & y factors by gasket category / material
 *      PPA_B16_21_CL150 ..... B16.21 Table 4 — flat gaskets, B16.5 Cl 150
 *      PPA_B16_21_CL300 ..... B16.21 Table 5 — flat gaskets, B16.5 Cl 300-900
 *      PPA_B16_20_SW_B165 ... B16.20 Table I-4 — spiral-wound, B16.5
 *      PPA_B16_20_RJ_MAP .... B16.20 Table 4 — R-number to NPS/class map
 *      PPA_B16_20_R_DIM ..... B16.20 Table I-1 — Type R ring gasket dims
 *
 *  Copyright © 2026 Zephrum Konsultan Limited. All rights reserved.
 * ========================================================================== */

// ============================================================
// SECTION 1:  GASKET m & y FACTORS
// ASME BPV Code Sec VIII Div 1, Appendix 2, Table 2-5.1
// m = gasket factor (dimensionless)
// y = minimum design seating stress (psi)
// ============================================================

const PPA_GASKET_MY = [

  // --- Self-energizing types ---
  { cat: 'Self-energizing', mat: 'O-rings, metallic, elastomer, or other gasket types considered as self-sealing',
    m: 0, y: 0 },

  // --- Elastomers without fabric ---
  { cat: 'Elastomers (no fabric)', mat: 'Below 75A Shore Durometer',
    m: 0.50, y: 0 },
  { cat: 'Elastomers (no fabric)', mat: '75A or higher Shore Durometer',
    m: 1.00, y: 200 },

  // --- Elastomers with cotton fabric ---
  { cat: 'Elastomers with cotton fabric', mat: '3-ply',
    m: 1.25, y: 400 },
  { cat: 'Elastomers with cotton fabric', mat: '2-ply',
    m: 1.50, y: 800 },
  { cat: 'Elastomers with cotton fabric', mat: '1-ply',
    m: 1.75, y: 1100 },

  // --- Elastomers with asbestos fabric ---
  { cat: 'Elastomers with asbestos fabric', mat: '3-ply',
    m: 2.25, y: 2200 },
  { cat: 'Elastomers with asbestos fabric', mat: '2-ply',
    m: 2.50, y: 2900 },
  { cat: 'Elastomers with asbestos fabric', mat: '1-ply',
    m: 2.75, y: 3700 },

  // --- Vegetable fiber ---
  { cat: 'Vegetable fiber', mat: 'Vegetable fiber',
    m: 1.75, y: 1100 },

  // --- Spiral-wound metal, asbestos filled ---
  { cat: 'Spiral-wound, asbestos filled', mat: 'Carbon steel',
    m: 2.50, y: 10000 },
  { cat: 'Spiral-wound, asbestos filled', mat: 'Stainless steel, Monel, or nickel-base alloy',
    m: 3.00, y: 10000 },

  // --- Spiral-wound metal, flexible graphite filled ---
  { cat: 'Spiral-wound, flexible graphite filled', mat: 'Carbon steel',
    m: 2.50, y: 10000 },
  { cat: 'Spiral-wound, flexible graphite filled', mat: 'Stainless steel, Monel, or nickel-base alloy',
    m: 3.00, y: 10000 },

  // --- Spiral-wound metal, PTFE filled ---
  { cat: 'Spiral-wound, PTFE filled', mat: 'Carbon steel',
    m: 2.50, y: 10000 },
  { cat: 'Spiral-wound, PTFE filled', mat: 'Stainless steel, Monel, or nickel-base alloy',
    m: 3.00, y: 10000 },

  // --- Corrugated metal, asbestos inserted ---
  { cat: 'Corrugated metal, asbestos inserted', mat: 'Soft aluminum',
    m: 2.50, y: 2900 },
  { cat: 'Corrugated metal, asbestos inserted', mat: 'Soft copper or brass',
    m: 2.75, y: 3700 },
  { cat: 'Corrugated metal, asbestos inserted', mat: 'Iron or soft steel',
    m: 3.00, y: 4500 },
  { cat: 'Corrugated metal, asbestos inserted', mat: 'Monel or 4-6% chrome',
    m: 3.25, y: 5500 },
  { cat: 'Corrugated metal, asbestos inserted', mat: 'Stainless steels and nickel-base alloys',
    m: 3.50, y: 6500 },

  // --- Corrugated metal, jacketed asbestos filled ---
  { cat: 'Corrugated metal, jacketed asbestos filled', mat: 'Soft aluminum',
    m: 2.50, y: 2900 },
  { cat: 'Corrugated metal, jacketed asbestos filled', mat: 'Soft copper or brass',
    m: 2.75, y: 3700 },
  { cat: 'Corrugated metal, jacketed asbestos filled', mat: 'Iron or soft steel',
    m: 3.00, y: 4500 },
  { cat: 'Corrugated metal, jacketed asbestos filled', mat: 'Monel or 4-6% chrome',
    m: 3.25, y: 5500 },
  { cat: 'Corrugated metal, jacketed asbestos filled', mat: 'Stainless steels and nickel-base alloys',
    m: 3.50, y: 6500 },

  // --- Flat metal, jacketed asbestos filled ---
  { cat: 'Flat metal, jacketed asbestos filled', mat: 'Soft aluminum',
    m: 3.25, y: 5500 },
  { cat: 'Flat metal, jacketed asbestos filled', mat: 'Soft copper or brass',
    m: 3.50, y: 6500 },
  { cat: 'Flat metal, jacketed asbestos filled', mat: 'Iron or soft steel',
    m: 3.75, y: 7600 },
  { cat: 'Flat metal, jacketed asbestos filled', mat: 'Monel or 4-6% chrome',
    m: 3.50, y: 6500 },
  { cat: 'Flat metal, jacketed asbestos filled', mat: 'Stainless steels and nickel-base alloys',
    m: 3.75, y: 7600 },

  // --- Grooved metal ---
  { cat: 'Grooved metal', mat: 'Soft aluminum',
    m: 3.25, y: 5500 },
  { cat: 'Grooved metal', mat: 'Soft copper or brass',
    m: 3.50, y: 6500 },
  { cat: 'Grooved metal', mat: 'Iron or soft metal',
    m: 3.75, y: 7600 },
  { cat: 'Grooved metal', mat: 'Monel or 4-6% chrome',
    m: 3.75, y: 9000 },
  { cat: 'Grooved metal', mat: 'Stainless steels and nickel-base alloys',
    m: 4.25, y: 10100 },

  // --- Solid flat metal ---
  { cat: 'Solid flat metal', mat: 'Soft aluminum',
    m: 4.00, y: 8800 },
  { cat: 'Solid flat metal', mat: 'Soft copper or brass',
    m: 4.75, y: 13000 },
  { cat: 'Solid flat metal', mat: 'Iron or soft steel',
    m: 5.50, y: 18000 },
  { cat: 'Solid flat metal', mat: 'Monel or 4-6% chrome',
    m: 6.00, y: 21800 },
  { cat: 'Solid flat metal', mat: 'Stainless steels and nickel-base alloys',
    m: 6.50, y: 26000 },

  // --- Ring joint ---
  { cat: 'Ring joint', mat: 'Iron or soft steel',
    m: 5.50, y: 18000 },
  { cat: 'Ring joint', mat: 'Monel or 4-6% chrome',
    m: 6.00, y: 21800 },
  { cat: 'Ring joint', mat: 'Stainless steels and nickel-base alloys',
    m: 6.50, y: 26000 }
];


// ============================================================
// SECTION 2:  B16.21 FLAT GASKET DIMENSIONS — B16.5 CLASS 150
// ASME B16.21-1992, Table 4
// Gasket ID = pipe OD per B36.10M
// Flat Ring OD = bolt circle - bolt dia (self-centering)
// Full Face OD = flange OD
// All dimensions in inches.
// ============================================================

const PPA_B16_21_CL150 = {
  // NPS: { id, ringOD, ffOD, nHoles, holeDia, boltCircle }
  '0.5':  { id: 0.84,  ringOD: 1.88,  ffOD: 3.50,  nHoles: 4,  holeDia: 0.62, bc: 2.38  },
  '0.75': { id: 1.06,  ringOD: 2.25,  ffOD: 3.88,  nHoles: 4,  holeDia: 0.62, bc: 2.75  },
  '1':    { id: 1.31,  ringOD: 2.62,  ffOD: 4.25,  nHoles: 4,  holeDia: 0.62, bc: 3.12  },
  '1.25': { id: 1.66,  ringOD: 3.00,  ffOD: 4.63,  nHoles: 4,  holeDia: 0.62, bc: 3.50  },
  '1.5':  { id: 1.91,  ringOD: 3.38,  ffOD: 5.00,  nHoles: 4,  holeDia: 0.62, bc: 3.88  },
  '2':    { id: 2.38,  ringOD: 4.12,  ffOD: 6.00,  nHoles: 4,  holeDia: 0.75, bc: 4.75  },
  '2.5':  { id: 2.88,  ringOD: 4.88,  ffOD: 7.00,  nHoles: 4,  holeDia: 0.75, bc: 5.50  },
  '3':    { id: 3.50,  ringOD: 5.38,  ffOD: 7.50,  nHoles: 4,  holeDia: 0.75, bc: 6.00  },
  '3.5':  { id: 4.00,  ringOD: 6.38,  ffOD: 8.50,  nHoles: 8,  holeDia: 0.75, bc: 7.00  },
  '4':    { id: 4.50,  ringOD: 6.88,  ffOD: 9.00,  nHoles: 8,  holeDia: 0.75, bc: 7.50  },
  '5':    { id: 5.56,  ringOD: 7.75,  ffOD: 10.00, nHoles: 8,  holeDia: 0.88, bc: 8.50  },
  '6':    { id: 6.62,  ringOD: 8.75,  ffOD: 11.00, nHoles: 8,  holeDia: 0.88, bc: 9.50  },
  '8':    { id: 8.62,  ringOD: 11.00, ffOD: 13.50, nHoles: 8,  holeDia: 0.88, bc: 11.75 },
  '10':   { id: 10.75, ringOD: 13.38, ffOD: 16.00, nHoles: 12, holeDia: 1.00, bc: 14.25 },
  '12':   { id: 12.75, ringOD: 16.13, ffOD: 19.00, nHoles: 12, holeDia: 1.00, bc: 17.00 },
  '14':   { id: 14.00, ringOD: 17.75, ffOD: 21.00, nHoles: 12, holeDia: 1.12, bc: 18.75 },
  '16':   { id: 16.00, ringOD: 20.25, ffOD: 23.50, nHoles: 16, holeDia: 1.12, bc: 21.25 },
  '18':   { id: 18.00, ringOD: 21.62, ffOD: 25.00, nHoles: 16, holeDia: 1.25, bc: 22.75 },
  '20':   { id: 20.00, ringOD: 23.88, ffOD: 27.50, nHoles: 20, holeDia: 1.25, bc: 25.00 },
  '24':   { id: 24.00, ringOD: 28.25, ffOD: 32.00, nHoles: 20, holeDia: 1.38, bc: 29.50 }
};


// ============================================================
// SECTION 3:  B16.21 FLAT RING GASKET DIMENSIONS — B16.5 CL 300/400/600/900
// ASME B16.21-1992, Table 5
// Gasket ID = pipe OD per B36.10M
// OD varies by pressure class
// All dimensions in inches.
// ============================================================

const PPA_B16_21_CL300 = {
  // NPS: { id, cl300, cl400, cl600, cl900 }
  '0.5':  { id: 0.84,  cl300: 2.12,  cl400: 2.12,  cl600: 2.12,  cl900: 2.50  },
  '0.75': { id: 1.06,  cl300: 2.62,  cl400: 2.62,  cl600: 2.62,  cl900: 2.75  },
  '1':    { id: 1.31,  cl300: 2.88,  cl400: 2.88,  cl600: 2.88,  cl900: 3.12  },
  '1.25': { id: 1.66,  cl300: 3.25,  cl400: 3.25,  cl600: 3.25,  cl900: 3.50  },
  '1.5':  { id: 1.91,  cl300: 3.75,  cl400: 3.75,  cl600: 3.75,  cl900: 3.88  },
  '2':    { id: 2.38,  cl300: 4.38,  cl400: 4.38,  cl600: 4.38,  cl900: 5.62  },
  '2.5':  { id: 2.88,  cl300: 5.12,  cl400: 5.12,  cl600: 5.12,  cl900: 6.50  },
  '3':    { id: 3.50,  cl300: 5.88,  cl400: 5.88,  cl600: 5.88,  cl900: 6.62  },
  '3.5':  { id: 4.00,  cl300: 6.50,  cl400: 6.38,  cl600: 6.38,  cl900: null  },
  '4':    { id: 4.50,  cl300: 7.12,  cl400: 7.00,  cl600: 7.62,  cl900: 8.12  },
  '5':    { id: 5.56,  cl300: 8.50,  cl400: 8.38,  cl600: 9.50,  cl900: 9.75  },
  '6':    { id: 6.62,  cl300: 9.88,  cl400: 9.75,  cl600: 10.50, cl900: 11.38 },
  '8':    { id: 8.62,  cl300: 12.12, cl400: 12.00, cl600: 12.62, cl900: 14.12 },
  '10':   { id: 10.75, cl300: 14.25, cl400: 14.12, cl600: 15.75, cl900: 17.12 },
  '12':   { id: 12.75, cl300: 16.62, cl400: 16.50, cl600: 18.00, cl900: 19.62 },
  '14':   { id: 14.00, cl300: 19.12, cl400: 19.00, cl600: 19.38, cl900: 20.50 },
  '16':   { id: 16.00, cl300: 21.25, cl400: 21.12, cl600: 22.25, cl900: 22.62 },
  '18':   { id: 18.00, cl300: 23.50, cl400: 23.38, cl600: 24.12, cl900: 25.12 },
  '20':   { id: 20.00, cl300: 25.75, cl400: 25.50, cl600: 26.88, cl900: 27.50 },
  '24':   { id: 24.00, cl300: 30.50, cl400: 30.25, cl600: 31.12, cl900: 33.00 }
};


// ============================================================
// SECTION 4:  B16.20 SPIRAL-WOUND GASKET DIMENSIONS — B16.5 FLANGES
// ASME B16.20-2007, Table I-4 (US Customary)
// Gasket OD and Inside Diameter by NPS and pressure class
// All dimensions in inches.
// ============================================================

const PPA_B16_20_SW_B165 = {
  // NPS: {
  //   od150: gasket OD for Cl 150/300/400/600,
  //   od2500: gasket OD for Cl 900/1500/2500,
  //   id: { cl150, cl300, cl400, cl600, cl900, cl1500, cl2500 }
  //   crOD: { cl150, cl300, cl400, cl600, cl900, cl1500, cl2500 }  (centering ring OD)
  // }
  '0.5':  { od: 1.25, od25: 1.25,
    id:  { cl150: 0.75, cl300: 0.75, cl400: null, cl600: 0.75, cl900: null, cl1500: 0.75, cl2500: 0.75 },
    crOD:{ cl150: 1.88, cl300: 2.13, cl400: null, cl600: 2.13, cl900: null, cl1500: 2.50, cl2500: 2.75 }},
  '0.75': { od: 1.56, od25: 1.56,
    id:  { cl150: 1.00, cl300: 1.00, cl400: null, cl600: 1.00, cl900: null, cl1500: 1.00, cl2500: 1.00 },
    crOD:{ cl150: 2.25, cl300: 2.63, cl400: null, cl600: 2.63, cl900: null, cl1500: 2.75, cl2500: 3.00 }},
  '1':    { od: 1.88, od25: 1.88,
    id:  { cl150: 1.25, cl300: 1.25, cl400: null, cl600: 1.25, cl900: null, cl1500: 1.25, cl2500: 1.25 },
    crOD:{ cl150: 2.63, cl300: 2.88, cl400: null, cl600: 2.88, cl900: null, cl1500: 3.13, cl2500: 3.38 }},
  '1.25': { od: 2.38, od25: 2.38,
    id:  { cl150: 1.88, cl300: 1.88, cl400: null, cl600: 1.88, cl900: null, cl1500: 1.56, cl2500: 1.56 },
    crOD:{ cl150: 3.00, cl300: 3.25, cl400: null, cl600: 3.25, cl900: null, cl1500: 3.50, cl2500: 4.13 }},
  '1.5':  { od: 2.75, od25: 2.75,
    id:  { cl150: 2.13, cl300: 2.13, cl400: null, cl600: 2.13, cl900: null, cl1500: 1.88, cl2500: 1.88 },
    crOD:{ cl150: 3.38, cl300: 3.75, cl400: null, cl600: 3.75, cl900: null, cl1500: 3.88, cl2500: 4.63 }},
  '2':    { od: 3.38, od25: 3.38,
    id:  { cl150: 2.75, cl300: 2.75, cl400: null, cl600: 2.75, cl900: null, cl1500: 2.31, cl2500: 2.31 },
    crOD:{ cl150: 4.13, cl300: 4.38, cl400: null, cl600: 4.38, cl900: null, cl1500: 5.63, cl2500: 5.75 }},
  '2.5':  { od: 3.88, od25: 3.88,
    id:  { cl150: 3.25, cl300: 3.25, cl400: null, cl600: 3.25, cl900: null, cl1500: 2.75, cl2500: 2.75 },
    crOD:{ cl150: 4.88, cl300: 5.13, cl400: null, cl600: 5.13, cl900: null, cl1500: 6.50, cl2500: 6.63 }},
  '3':    { od: 4.75, od25: 4.75,
    id:  { cl150: 4.00, cl300: 4.00, cl400: null, cl600: 4.00, cl900: 3.75, cl1500: 3.63, cl2500: 3.63 },
    crOD:{ cl150: 5.38, cl300: 5.88, cl400: null, cl600: 5.88, cl900: 6.63, cl1500: 6.88, cl2500: 7.75 }},
  '4':    { od: 5.88, od25: 5.88,
    id:  { cl150: 5.00, cl300: 5.00, cl400: 4.75, cl600: 4.75, cl900: 4.75, cl1500: 4.63, cl2500: 4.63 },
    crOD:{ cl150: 6.88, cl300: 7.13, cl400: 7.00, cl600: 7.63, cl900: 8.13, cl1500: 8.25, cl2500: 9.25 }},
  '5':    { od: 7.00, od25: 7.00,
    id:  { cl150: 6.13, cl300: 6.13, cl400: 5.81, cl600: 5.81, cl900: 5.81, cl1500: 5.63, cl2500: 5.63 },
    crOD:{ cl150: 7.75, cl300: 8.50, cl400: 8.38, cl600: 9.50, cl900: 9.75, cl1500:10.00, cl2500:11.00 }},
  '6':    { od: 8.25, od25: 8.25,
    id:  { cl150: 7.19, cl300: 7.19, cl400: 6.88, cl600: 6.88, cl900: 6.88, cl1500: 6.75, cl2500: 6.75 },
    crOD:{ cl150: 8.75, cl300: 9.88, cl400: 9.75, cl600:10.50, cl900:11.38, cl1500:11.13, cl2500:12.50 }},
  '8':    { od: 10.38, od25: 10.13,
    id:  { cl150: 9.19, cl300: 9.19, cl400: 8.88, cl600: 8.88, cl900: 8.75, cl1500: 8.50, cl2500: 8.50 },
    crOD:{ cl150:11.00, cl300:12.13, cl400:12.00, cl600:12.63, cl900:14.13, cl1500:13.88, cl2500:15.25 }},
  '10':   { od: 12.50, od25: 12.25,
    id:  { cl150:11.31, cl300:11.31, cl400:10.81, cl600:10.81, cl900:10.88, cl1500:10.50, cl2500:10.63 },
    crOD:{ cl150:13.38, cl300:14.25, cl400:14.13, cl600:15.75, cl900:17.13, cl1500:17.13, cl2500:18.75 }},
  '12':   { od: 14.75, od25: 14.50,
    id:  { cl150:13.38, cl300:13.38, cl400:12.88, cl600:12.88, cl900:12.75, cl1500:12.75, cl2500:12.50 },
    crOD:{ cl150:16.13, cl300:16.63, cl400:16.50, cl600:18.00, cl900:19.63, cl1500:20.50, cl2500:21.63 }},
  '14':   { od: 16.00, od25: 15.75,
    id:  { cl150:14.63, cl300:14.63, cl400:14.25, cl600:14.25, cl900:14.00, cl1500:14.25, cl2500: null },
    crOD:{ cl150:17.75, cl300:19.13, cl400:19.00, cl600:19.38, cl900:20.50, cl1500:22.75, cl2500: null }},
  '16':   { od: 18.25, od25: 18.00,
    id:  { cl150:16.63, cl300:16.63, cl400:16.25, cl600:16.25, cl900:16.25, cl1500:16.00, cl2500: null },
    crOD:{ cl150:20.25, cl300:21.25, cl400:21.13, cl600:22.25, cl900:22.63, cl1500:25.25, cl2500: null }},
  '18':   { od: 20.75, od25: 20.50,
    id:  { cl150:18.69, cl300:18.69, cl400:18.50, cl600:18.50, cl900:18.25, cl1500:18.25, cl2500: null },
    crOD:{ cl150:21.63, cl300:23.50, cl400:23.38, cl600:24.13, cl900:25.13, cl1500:27.75, cl2500: null }},
  '20':   { od: 22.75, od25: 22.50,
    id:  { cl150:20.69, cl300:20.69, cl400:20.50, cl600:20.50, cl900:20.50, cl1500:20.25, cl2500: null },
    crOD:{ cl150:23.88, cl300:25.75, cl400:25.50, cl600:26.88, cl900:27.50, cl1500:29.75, cl2500: null }},
  '24':   { od: 27.00, od25: 26.75,
    id:  { cl150:24.75, cl300:24.75, cl400:24.75, cl600:24.75, cl900:24.75, cl1500:24.25, cl2500: null },
    crOD:{ cl150:28.25, cl300:30.50, cl400:30.25, cl600:31.13, cl900:33.00, cl1500:35.50, cl2500: null }}
};


// ============================================================
// SECTION 5:  B16.21 FLAT RING GASKET DIMENSIONS — B16.47 SERIES A
// ASME B16.21-1992, Table 7
// All dimensions in inches.
// ============================================================

const PPA_B16_21_B1647A = {
  // NPS: { id, cl150, cl300, cl400, cl600 }
  '26': { id: 26.00, cl150: 30.50, cl300: 32.88, cl400: 32.75, cl600: 34.12 },
  '28': { id: 28.00, cl150: 32.75, cl300: 35.38, cl400: 35.12, cl600: 36.00 },
  '30': { id: 30.00, cl150: 34.75, cl300: 37.50, cl400: 37.25, cl600: 38.25 },
  '32': { id: 32.00, cl150: 37.00, cl300: 39.62, cl400: 39.50, cl600: 40.25 },
  '34': { id: 34.00, cl150: 39.00, cl300: 41.62, cl400: 41.50, cl600: 42.25 },
  '36': { id: 36.00, cl150: 41.25, cl300: 44.00, cl400: 44.00, cl600: 44.50 },
  '38': { id: 38.00, cl150: 43.75, cl300: 41.50, cl400: 42.26, cl600: 43.50 },
  '40': { id: 40.00, cl150: 45.75, cl300: 43.88, cl400: 44.58, cl600: 45.50 },
  '42': { id: 42.00, cl150: 48.00, cl300: 45.88, cl400: 46.38, cl600: 48.00 },
  '44': { id: 44.00, cl150: 50.25, cl300: 48.00, cl400: 48.50, cl600: 50.00 },
  '46': { id: 46.00, cl150: 52.25, cl300: 50.12, cl400: 50.75, cl600: 52.26 },
  '48': { id: 48.00, cl150: 54.50, cl300: 52.12, cl400: 53.00, cl600: 54.75 },
  '50': { id: 50.00, cl150: 56.50, cl300: 54.25, cl400: 55.25, cl600: 57.00 },
  '52': { id: 52.00, cl150: 58.75, cl300: 56.25, cl400: 57.26, cl600: 59.00 },
  '54': { id: 54.00, cl150: 61.00, cl300: 58.75, cl400: 59.75, cl600: 61.25 },
  '56': { id: 56.00, cl150: 63.25, cl300: 60.75, cl400: 61.75, cl600: 63.50 },
  '58': { id: 58.00, cl150: 65.50, cl300: 62.75, cl400: 63.75, cl600: 65.50 },
  '60': { id: 60.00, cl150: 67.50, cl300: 64.75, cl400: 66.25, cl600: 67.75 }
};


// ============================================================
// SECTION 6:  B16.21 FLAT RING GASKET DIMENSIONS — B16.47 SERIES B
// ASME B16.21-1992, Table 8
// All dimensions in inches.
// ============================================================

const PPA_B16_21_B1647B = {
  // NPS: { id, cl75, cl150, cl300, cl400, cl600 }
  '26': { id: 26.00, cl75: 27.88, cl150: 28.56, cl300: 30.38, cl400: 29.38, cl600: 30.12 },
  '28': { id: 28.00, cl75: 29.88, cl150: 30.56, cl300: 32.50, cl400: 31.50, cl600: 32.25 },
  '30': { id: 30.00, cl75: 31.88, cl150: 32.56, cl300: 34.88, cl400: 33.75, cl600: 34.62 },
  '32': { id: 32.00, cl75: 33.88, cl150: 34.69, cl300: 37.00, cl400: 35.88, cl600: 36.75 },
  '34': { id: 34.00, cl75: 35.88, cl150: 36.81, cl300: 39.12, cl400: 37.88, cl600: 39.25 },
  '36': { id: 36.00, cl75: 38.31, cl150: 38.88, cl300: 41.25, cl400: 40.25, cl600: 41.25 },
  '38': { id: 38.00, cl75: 40.31, cl150: 41.12, cl300: 43.25, cl400: null,  cl600: null  },
  '40': { id: 40.00, cl75: 42.31, cl150: 43.12, cl300: 45.25, cl400: null,  cl600: null  },
  '42': { id: 42.00, cl75: 44.31, cl150: 45.12, cl300: 47.25, cl400: null,  cl600: null  },
  '44': { id: 44.00, cl75: 46.50, cl150: 47.12, cl300: 49.25, cl400: null,  cl600: null  },
  '46': { id: 46.00, cl75: 48.50, cl150: 49.44, cl300: 51.88, cl400: null,  cl600: null  },
  '48': { id: 48.00, cl75: 50.50, cl150: 51.44, cl300: 53.88, cl400: null,  cl600: null  },
  '50': { id: 50.00, cl75: 52.50, cl150: 53.44, cl300: 55.88, cl400: null,  cl600: null  },
  '52': { id: 52.00, cl75: 54.62, cl150: 55.44, cl300: 57.88, cl400: null,  cl600: null  },
  '54': { id: 54.00, cl75: 56.62, cl150: 57.62, cl300: 61.25, cl400: null,  cl600: null  },
  '56': { id: 56.00, cl75: 58.88, cl150: 59.62, cl300: 62.75, cl400: null,  cl600: null  },
  '58': { id: 58.00, cl75: 60.88, cl150: 62.19, cl300: 65.19, cl400: null,  cl600: null  },
  '60': { id: 60.00, cl75: 62.88, cl150: 64.19, cl300: 67.12, cl400: null,  cl600: null  }
};


// ============================================================
// SECTION 7:  HELPER — Lookup m & y by gasket category
// ============================================================

/**
 * Find all gasket entries matching a category substring (case-insensitive).
 * @param {string} catSearch - partial category name, e.g. 'spiral' or 'ring joint'
 * @returns {Array} matching entries from PPA_GASKET_MY
 */
function gasketMY_byCategory(catSearch) {
  const s = catSearch.toLowerCase();
  return PPA_GASKET_MY.filter(g => g.cat.toLowerCase().includes(s));
}

/**
 * Get a single m & y pair by exact category and material match.
 * @param {string} cat - category name
 * @param {string} mat - material name
 * @returns {object|null} { m, y } or null
 */
function gasketMY_lookup(cat, mat) {
  const cLow = cat.toLowerCase();
  const mLow = mat.toLowerCase();
  const found = PPA_GASKET_MY.find(
    g => g.cat.toLowerCase() === cLow && g.mat.toLowerCase() === mLow
  );
  return found ? { m: found.m, y: found.y } : null;
}

/**
 * Get B16.21 flat gasket OD for a given NPS and class.
 * @param {string} nps - NPS as string (e.g. '4', '0.5')
 * @param {number} cls - pressure class (150, 300, 400, 600, 900)
 * @returns {object|null} { id, od } or null
 */
function flatGasketOD(nps, cls) {
  if (cls === 150) {
    const r = PPA_B16_21_CL150[nps];
    return r ? { id: r.id, od: r.ringOD } : null;
  }
  const r = PPA_B16_21_CL300[nps];
  if (!r) return null;
  const key = 'cl' + cls;
  const od = r[key];
  return od != null ? { id: r.id, od: od } : null;
}


// ============================================================
// EXPORT — attach to PPA global namespace
// ============================================================

if (typeof window !== 'undefined') {
  window.PPA = window.PPA || {};
  window.PPA.GASKET_MY         = PPA_GASKET_MY;
  window.PPA.B16_21_CL150      = PPA_B16_21_CL150;
  window.PPA.B16_21_CL300      = PPA_B16_21_CL300;
  window.PPA.B16_21_B1647A     = PPA_B16_21_B1647A;
  window.PPA.B16_21_B1647B     = PPA_B16_21_B1647B;
  window.PPA.B16_20_SW_B165    = PPA_B16_20_SW_B165;
  window.PPA.gasketMY_byCategory = gasketMY_byCategory;
  window.PPA.gasketMY_lookup     = gasketMY_lookup;
  window.PPA.flatGasketOD       = flatGasketOD;
}
