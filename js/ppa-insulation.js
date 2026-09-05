/* ════════════════════════════════════════════════════════════════
   PipingPro Academy — Insulation Database v1.0  (ppa-insulation.js)
   ────────────────────────────────────────────────────────────────
   Single source of truth for pipe insulation and cladding data.
   Used by: Pipe Coating & Insulation Calculator, Pipe Weight
   Calculator, Design Agent (insulated weight + CAESAR II input),
   Support Span Calculator (insulated load).

   Data Sources:
   - ASTM C547 (Mineral Fibre Pipe Insulation)
   - ASTM C552 (Cellular Glass)
   - ASTM C591 (Unfaced Preformed Perlite)
   - ASTM C610 (Calcium Silicate)
   - ASTM C1427 (Extruded Preformed Flexible Cellular Elastomeric)
   - CINI Manual (Insulation thickness tables)
   - NACE SP0198 (CUI mitigation)
   - Industry practice / major EPC standards

   LOAD ORDER
   Include on any page that needs insulation data:
       <script src="/js/ppa-insulation.js"></script>
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  //  INSULATION TYPES
  // ═══════════════════════════════════════════════════════════════

  var INSULATION_TYPES = {

    // ── HOT SERVICE ──────────────────────────────────────────────

    'calcium-silicate': {
      name: 'Calcium Silicate',
      shortName: 'CaSi',
      astm: 'ASTM C533 / C610',
      service: 'hot',
      tempMin: 40,       // °C — practical minimum
      tempMax: 650,      // °C
      density: 240,      // kg/m³ (nominal installed)
      densityRange: [220, 260],
      conductivity25: 0.055,   // W/m·K at 25°C mean temp
      conductivity200: 0.074,  // W/m·K at 200°C
      conductivity400: 0.098,  // W/m·K at 400°C
      caesarDensity: 240,      // value to use in CAESAR II
      moisture: 'Absorbs moisture — needs vapour barrier in intermittent service',
      cuiRisk: 'Medium — absorbs water, requires proper weatherproofing',
      notes: 'Most common for process piping >250°C. High compressive strength, good for pipe supports.'
    },

    'mineral-wool': {
      name: 'Mineral Wool (Rockwool)',
      shortName: 'MW',
      astm: 'ASTM C547',
      service: 'hot',
      tempMin: 15,
      tempMax: 650,
      density: 128,
      densityRange: [100, 160],
      conductivity25: 0.037,
      conductivity200: 0.065,
      conductivity400: 0.107,
      caesarDensity: 128,
      moisture: 'Water repellent when treated, but loses R-value if saturated',
      cuiRisk: 'Medium — treated versions are hydrophobic',
      notes: 'Most widely used hot insulation. Cost-effective. Available in preformed pipe sections and blankets.'
    },

    'ceramic-fibre': {
      name: 'Ceramic Fibre (Refractory)',
      shortName: 'CF',
      astm: 'ASTM C892',
      service: 'hot',
      tempMin: 200,
      tempMax: 1260,
      density: 96,
      densityRange: [64, 128],
      conductivity25: 0.044,
      conductivity200: 0.075,
      conductivity400: 0.120,
      caesarDensity: 96,
      moisture: 'Low absorption',
      cuiRisk: 'Low',
      notes: 'For very high temperature service (>500°C). Used on furnace piping, exhaust lines. Flexible blanket form.'
    },

    'perlite': {
      name: 'Expanded Perlite',
      shortName: 'PL',
      astm: 'ASTM C610',
      service: 'hot',
      tempMin: 40,
      tempMax: 650,
      density: 144,
      densityRange: [130, 175],
      conductivity25: 0.052,
      conductivity200: 0.069,
      conductivity400: 0.090,
      caesarDensity: 144,
      moisture: 'Absorbs moisture — needs weatherproofing',
      cuiRisk: 'Medium-High — absorbs water readily',
      notes: 'Good for high-temperature piping. Often used on LNG/cryogenic when combined with cellular glass.'
    },

    'microporous': {
      name: 'Microporous Insulation',
      shortName: 'MP',
      astm: 'Various',
      service: 'hot',
      tempMin: 100,
      tempMax: 1000,
      density: 250,
      densityRange: [200, 300],
      conductivity25: 0.020,
      conductivity200: 0.025,
      conductivity400: 0.032,
      caesarDensity: 250,
      moisture: 'Low absorption',
      cuiRisk: 'Low',
      notes: 'Lowest thermal conductivity. Very thin profiles possible. Expensive — used where space is critical.'
    },

    // ── COLD / CRYOGENIC SERVICE ─────────────────────────────────

    'polyurethane-foam': {
      name: 'Polyurethane Foam (PUF)',
      shortName: 'PUF',
      astm: 'ASTM C591',
      service: 'cold',
      tempMin: -200,
      tempMax: 120,
      density: 60,
      densityRange: [40, 80],
      conductivity25: 0.023,
      conductivityMinus40: 0.019,
      caesarDensity: 60,
      moisture: 'Closed cell — low moisture pickup',
      cuiRisk: 'Low — if jacketing is intact',
      notes: 'Most common cold insulation. Excellent thermal performance. Requires vapour barrier on cold side.'
    },

    'cellular-glass': {
      name: 'Cellular Glass (Foamglas)',
      shortName: 'CG',
      astm: 'ASTM C552',
      service: 'cold',
      tempMin: -268,
      tempMax: 430,
      density: 120,
      densityRange: [100, 145],
      conductivity25: 0.042,
      conductivityMinus40: 0.035,
      conductivity200: 0.060,
      caesarDensity: 120,
      moisture: 'Zero moisture absorption — fully closed cell',
      cuiRisk: 'Very Low — impervious to water',
      notes: 'Premium cold insulation. Zero moisture absorption. Works for both hot and cold service. Best CUI resistance.'
    },

    'elastomeric-foam': {
      name: 'Elastomeric Foam (Armaflex)',
      shortName: 'EF',
      astm: 'ASTM C534 / C1427',
      service: 'cold',
      tempMin: -50,
      tempMax: 105,
      density: 55,
      densityRange: [40, 70],
      conductivity25: 0.036,
      conductivityMinus40: 0.032,
      caesarDensity: 55,
      moisture: 'Closed cell — built-in vapour barrier',
      cuiRisk: 'Low',
      notes: 'Flexible, easy to install. Self-sealing. Common for chilled water, refrigeration, HVAC. Limited temperature range.'
    },

    'phenolic-foam': {
      name: 'Phenolic Foam',
      shortName: 'PF',
      astm: 'ASTM C1126',
      service: 'cold',
      tempMin: -180,
      tempMax: 120,
      density: 40,
      densityRange: [35, 55],
      conductivity25: 0.021,
      conductivityMinus40: 0.018,
      caesarDensity: 40,
      moisture: 'Closed cell — low absorption',
      cuiRisk: 'Low',
      notes: 'Very low conductivity. Fire resistant. Used in LNG and offshore. More brittle than PUF.'
    },

    // ── DUAL SERVICE ─────────────────────────────────────────────

    'aerogel': {
      name: 'Aerogel Blanket',
      shortName: 'AG',
      astm: 'ASTM C1728',
      service: 'dual',
      tempMin: -200,
      tempMax: 650,
      density: 150,
      densityRange: [120, 180],
      conductivity25: 0.015,
      conductivity200: 0.023,
      conductivityMinus40: 0.013,
      caesarDensity: 150,
      moisture: 'Hydrophobic — repels water',
      cuiRisk: 'Very Low — inherently hydrophobic',
      notes: 'Lowest conductivity commercially available. Thin profiles. Expensive but excellent for CUI-prone areas and space-constrained locations.'
    }
  };


  // ═══════════════════════════════════════════════════════════════
  //  CLADDING / JACKETING DATA
  // ═══════════════════════════════════════════════════════════════

  var CLADDING_TYPES = {

    'aluminium': {
      name: 'Aluminium Jacketing',
      material: 'AA3003-H14 / AA3105-H14',
      thickness: 0.7,    // mm (typical for pipe)
      density: 2700,     // kg/m³
      tempMax: 230,      // °C (above this, use SS)
      notes: 'Standard for outdoor piping. Lightweight. Not suitable for coastal/chloride environments without coating.'
    },

    'aluminium-moisture-barrier': {
      name: 'Aluminium with Polysurlyn Moisture Barrier',
      material: 'AA3003/Polysurlyn laminate',
      thickness: 0.8,
      density: 2700,
      tempMax: 150,
      notes: 'Built-in vapour barrier for cold service. Polysurlyn degrades above 150°C.'
    },

    'stainless-steel': {
      name: 'Stainless Steel Jacketing',
      material: 'Type 304 / 316 SS',
      thickness: 0.5,    // mm
      density: 7990,     // kg/m³
      tempMax: 650,
      notes: 'For high-temperature, corrosive, or coastal environments. Required above ~230°C or in chloride-rich areas.'
    },

    'galvanised-steel': {
      name: 'Galvanised Steel Jacketing',
      material: 'Carbon Steel, hot-dip galvanised',
      thickness: 0.6,
      density: 7850,
      tempMax: 200,
      notes: 'Economical for indoor use. Zinc coating degrades at elevated temperature. Risk of liquid metal embrittlement on SS pipe.'
    },

    'pvc': {
      name: 'PVC Jacketing',
      material: 'Rigid PVC',
      thickness: 0.8,
      density: 1400,
      tempMax: 65,
      notes: 'Indoor cold service only. UV-sensitive, not for outdoor use.'
    }
  };


  // ═══════════════════════════════════════════════════════════════
  //  INSULATION THICKNESS TABLES (mm)
  //  Based on CINI Manual / typical EPC project specs
  //  Index: temperature range → NPS → thickness (mm)
  // ═══════════════════════════════════════════════════════════════

  // Standard NPS breakpoints for thickness lookup
  var NPS_BREAKS = [0.5, 1, 1.5, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 42, 48];

  // ── HOT INSULATION — Personnel Protection + Heat Conservation ──
  // Thickness in mm — for personnel protection (surface temp ≤ 60°C)
  // Ambient temperature assumed 35°C, wind 0 m/s (worst case)

  var HOT_THICKNESS = {
    // Operating temp range (°C) → thickness by NPS category
    // NPS categories: ≤2", 3-4", 6-8", 10-12", 14-16", 18-24", ≥30"
    '60-100':   [25, 25, 25, 25, 25, 25, 25],
    '101-150':  [40, 40, 40, 40, 40, 40, 40],
    '151-200':  [40, 40, 50, 50, 50, 50, 50],
    '201-250':  [50, 50, 50, 50, 60, 60, 60],
    '251-300':  [50, 60, 60, 65, 65, 75, 75],
    '301-350':  [60, 65, 75, 75, 75, 80, 80],
    '351-400':  [65, 75, 75, 80, 80, 90, 90],
    '401-450':  [75, 80, 80, 90, 90, 100, 100],
    '451-500':  [80, 90, 90, 100, 100, 100, 115],
    '501-550':  [90, 100, 100, 100, 115, 115, 125],
    '551-600':  [100, 100, 115, 115, 125, 125, 140],
    '601-650':  [100, 115, 125, 125, 140, 140, 150]
  };

  // ── COLD INSULATION — Anti-condensation + Heat Gain Prevention ──
  // Thickness in mm — to prevent condensation (ambient 35°C, 80% RH)
  // NPS categories: ≤2", 3-4", 6-8", 10-12", 14-16", 18-24", ≥30"

  var COLD_THICKNESS = {
    '0-to-15':      [25, 25, 25, 25, 25, 25, 25],
    '-1-to--20':    [40, 40, 40, 50, 50, 50, 50],
    '-21-to--50':   [50, 50, 60, 60, 65, 65, 75],
    '-51-to--80':   [65, 65, 75, 75, 80, 80, 90],
    '-81-to--120':  [75, 80, 90, 90, 100, 100, 100],
    '-121-to--170': [90, 100, 100, 115, 115, 125, 125],
    '-171-to--200': [100, 115, 125, 125, 140, 140, 150]
  };


  // ═══════════════════════════════════════════════════════════════
  //  LOOKUP FUNCTIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get NPS category index (0-6) for thickness table lookup
   */
  function npsCategory(nps) {
    if (nps <= 2) return 0;
    if (nps <= 4) return 1;
    if (nps <= 8) return 2;
    if (nps <= 12) return 3;
    if (nps <= 16) return 4;
    if (nps <= 24) return 5;
    return 6;
  }

  /**
   * Get recommended insulation thickness (mm)
   * @param {number} tempC — operating temperature in °C
   * @param {number} nps — nominal pipe size (inches)
   * @returns {number|null} thickness in mm, or null if out of range
   */
  function getThickness(tempC, nps) {
    var cat = npsCategory(nps);
    var table, key;

    if (tempC > 60) {
      // Hot insulation
      table = HOT_THICKNESS;
      var ranges = Object.keys(table);
      for (var i = 0; i < ranges.length; i++) {
        var parts = ranges[i].split('-');
        var lo = parseInt(parts[0]);
        var hi = parseInt(parts[1]);
        if (tempC >= lo && tempC <= hi) {
          return table[ranges[i]][cat];
        }
      }
      // Above max table temp
      if (tempC > 650) return null;
      // Find closest
      return table['601-650'][cat];
    } else if (tempC <= 15) {
      // Cold insulation
      table = COLD_THICKNESS;
      if (tempC >= 0) return table['0-to-15'][cat];
      if (tempC >= -20) return table['-1-to--20'][cat];
      if (tempC >= -50) return table['-21-to--50'][cat];
      if (tempC >= -80) return table['-51-to--80'][cat];
      if (tempC >= -120) return table['-81-to--120'][cat];
      if (tempC >= -170) return table['-121-to--170'][cat];
      if (tempC >= -200) return table['-171-to--200'][cat];
      return null;
    }
    // 15-60°C — normally no insulation required (unless specified)
    return 0;
  }

  /**
   * Recommend insulation type based on temperature
   * @param {number} tempC — operating temperature
   * @returns {object} recommended type from INSULATION_TYPES
   */
  function recommendType(tempC) {
    if (tempC > 500) return INSULATION_TYPES['ceramic-fibre'];
    if (tempC > 250) return INSULATION_TYPES['calcium-silicate'];
    if (tempC > 60)  return INSULATION_TYPES['mineral-wool'];
    if (tempC >= 0)  return INSULATION_TYPES['elastomeric-foam'];
    if (tempC >= -50) return INSULATION_TYPES['polyurethane-foam'];
    if (tempC >= -200) return INSULATION_TYPES['cellular-glass'];
    return INSULATION_TYPES['cellular-glass']; // cryogenic
  }

  /**
   * Recommend cladding type based on temperature and environment
   * @param {number} tempC — operating temperature
   * @param {string} env — 'outdoor'|'indoor'|'coastal'|'offshore'
   * @returns {object} recommended cladding from CLADDING_TYPES
   */
  function recommendCladding(tempC, env) {
    env = env || 'outdoor';
    if (env === 'coastal' || env === 'offshore') return CLADDING_TYPES['stainless-steel'];
    if (tempC > 230) return CLADDING_TYPES['stainless-steel'];
    if (tempC < 0) return CLADDING_TYPES['aluminium-moisture-barrier'];
    if (env === 'indoor' && tempC < 65) return CLADDING_TYPES['pvc'];
    return CLADDING_TYPES['aluminium'];
  }

  /**
   * Calculate insulation weight per metre
   * @param {number} pipeOD — pipe outside diameter (mm)
   * @param {number} insThickness — insulation thickness (mm)
   * @param {number} insDensity — insulation density (kg/m³)
   * @param {object} cladding — cladding type object (optional)
   * @returns {object} { insWeight, cladWeight, totalWeight } in kg/m
   */
  function calcInsulationWeight(pipeOD, insThickness, insDensity, cladding) {
    var insOD = pipeOD + 2 * insThickness;
    var pi = Math.PI;

    // Insulation weight
    var insArea = pi / 4 * (insOD * insOD - pipeOD * pipeOD); // mm²
    var insWeight = insArea * insDensity / 1000000; // kg/m

    // Cladding weight
    var cladWeight = 0;
    if (cladding) {
      var cladOD = insOD + 2 * cladding.thickness;
      var cladArea = pi / 4 * (cladOD * cladOD - insOD * insOD); // mm²
      cladWeight = cladArea * cladding.density / 1000000; // kg/m
    }

    return {
      insWeight: Math.round(insWeight * 100) / 100,
      cladWeight: Math.round(cladWeight * 100) / 100,
      totalWeight: Math.round((insWeight + cladWeight) * 100) / 100,
      insOD: Math.round(insOD * 10) / 10,
      cladOD: cladding ? Math.round((insOD + 2 * cladding.thickness) * 10) / 10 : insOD
    };
  }

  /**
   * Full insulation recommendation for a given pipe
   * @param {number} nps — nominal pipe size
   * @param {number} pipeOD — pipe outside diameter (mm)
   * @param {number} tempC — operating temperature (°C)
   * @param {string} environment — 'outdoor'|'indoor'|'coastal'|'offshore'
   * @returns {object} complete recommendation
   */
  function getRecommendation(nps, pipeOD, tempC, environment) {
    var insType = recommendType(tempC);
    var thickness = getThickness(tempC, nps);
    var cladding = recommendCladding(tempC, environment);
    var weights = null;

    if (thickness && thickness > 0) {
      weights = calcInsulationWeight(pipeOD, thickness, insType.density, cladding);
    }

    return {
      required: (tempC > 60 || tempC <= 15),
      insulation: insType,
      thickness: thickness,
      cladding: cladding,
      weights: weights,
      tempC: tempC,
      nps: nps,
      pipeOD: pipeOD,
      service: tempC > 60 ? 'hot' : (tempC <= 15 ? 'cold' : 'ambient')
    };
  }


  // ═══════════════════════════════════════════════════════════════
  //  EXPOSE
  // ═══════════════════════════════════════════════════════════════

  window.PPA_INSULATION = {
    TYPES: INSULATION_TYPES,
    CLADDING: CLADDING_TYPES,
    HOT_THICKNESS: HOT_THICKNESS,
    COLD_THICKNESS: COLD_THICKNESS,
    NPS_BREAKS: NPS_BREAKS,
    getThickness: getThickness,
    recommendType: recommendType,
    recommendCladding: recommendCladding,
    calcInsulationWeight: calcInsulationWeight,
    getRecommendation: getRecommendation,
    npsCategory: npsCategory
  };

})();
