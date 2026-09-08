/**
 * PPA Load Case Templates
 * Source: 35 years of piping stress analysis practice
 *
 * Contents:
 *   loadSymbols        - All CAESAR II / AutoPIPE load symbols and meanings
 *   stressCategories   - Code stress categories (OPE, SUS, EXP, OCC)
 *   templates          - 4 system-type templates:
 *                        waterHydrocarbon (8 cases)
 *                        withSprings (12 cases)
 *                        gasSteamVapour (9 cases)
 *                        pumpRotatingEquipment (13 cases)
 *
 * Usage: Agent or calculator queries by system type,
 *        returns the correct load case table with
 *        combinations, categories, and notes.
 *
 * Note: These are STANDARD templates. Always consult
 *       project-specific specifications for additions
 *       or modifications.
 */

export const ppaLoadCases = {

  loadSymbols: [
    { symbol: "W",    meaning: "Dead Weight", description: "Pipe + fluid + insulation + flanges + valves + all components" },
    { symbol: "WNC",  meaning: "Weight No Content", description: "Pipe + insulation + components, WITHOUT fluid. Used for gas/steam/vapour lines where pipe is empty in operation" },
    { symbol: "WW",   meaning: "Water Weight", description: "Pipe filled with water. Used for hydrotest cases" },
    { symbol: "T1",   meaning: "Temperature Set 1", description: "Primary operating temperature" },
    { symbol: "T2",   meaning: "Temperature Set 2", description: "Secondary operating temperature or alternate scenario" },
    { symbol: "T3",   meaning: "Temperature Set 3", description: "Third operating scenario (e.g. both pumps running)" },
    { symbol: "P1",   meaning: "Pressure Set 1", description: "Primary operating/design pressure" },
    { symbol: "P2",   meaning: "Pressure Set 2", description: "Secondary pressure (often hydrotest pressure)" },
    { symbol: "P3",   meaning: "Pressure Set 3", description: "Third pressure scenario" },
    { symbol: "D1",   meaning: "Displacement Set 1", description: "Initial displacement at equipment nozzles/anchors" },
    { symbol: "D2",   meaning: "Displacement Set 2", description: "Alternate displacement scenario" },
    { symbol: "D3",   meaning: "Displacement Set 3", description: "Third displacement scenario" },
    { symbol: "F1",   meaning: "External Force Set 1", description: "External forces (slug, relief valve thrust, etc.)" },
    { symbol: "F2",   meaning: "External Force Set 2", description: "Alternate external force scenario" },
    { symbol: "F3",   meaning: "External Force Set 3", description: "Third external force scenario" },
    { symbol: "U1",   meaning: "Uniform Load 1", description: "Seismic acceleration in X direction" },
    { symbol: "U2",   meaning: "Uniform Load 2", description: "Seismic acceleration in Y direction" },
    { symbol: "U3",   meaning: "Uniform Load 3", description: "Seismic acceleration in Z direction" },
    { symbol: "WIN1", meaning: "Wind Load 1", description: "Wind load in primary direction (e.g. X)" },
    { symbol: "WIN2", meaning: "Wind Load 2", description: "Wind load in secondary direction (e.g. Z)" }
  ],

  stressCategories: [
    { code: "OPE", name: "Operating",  description: "Full operating condition — weight + thermal + pressure + displacement. Used to check displacements, support loads, nozzle loads." },
    { code: "SUS", name: "Sustained",  description: "Weight + pressure only (no thermal). Primary stress check per code. Must not exceed Sh." },
    { code: "EXP", name: "Expansion",  description: "Thermal expansion range = Operating minus Sustained condition. Secondary stress check. Must not exceed SA." },
    { code: "OCC", name: "Occasional", description: "Short-duration events — seismic, wind, slug, relief valve. Sustained + occasional must not exceed code allowable (typically 1.33 × Sh for B31.3)." }
  ],

  templates: {

    waterHydrocarbon: {
      id: "water-hydrocarbon",
      name: "Water / Hydrocarbon Lines",
      description: "Standard load cases for liquid service — water, crude oil, condensate, chemicals, etc.",
      applicableFluids: ["water", "crude oil", "condensate", "hydrocarbon liquid", "chemical", "brine", "glycol"],
      totalCases: 8,
      notes: [
        "W includes fluid weight since pipe is full during operation",
        "Seismic cases U1/U2/U3 only required if project specification mandates seismic analysis",
        "Resultant seismic is SRSS (Square Root Sum of Squares) of X+Y+Z components"
      ],
      cases: [
        { id: 1, combination: "W+D1+T1+P1+F1", category: "OPE", description: "Operating", purpose: "Full operating condition. Check displacements, support loads, nozzle loads." },
        { id: 2, combination: "W+P1+F1",        category: "SUS", description: "Sustained (Dead Weight + Pressure)", purpose: "Primary sustained stress check per code." },
        { id: 3, combination: "U1",              category: "OCC", description: "Seismic Load X", purpose: "Seismic acceleration in X direction." },
        { id: 4, combination: "U2",              category: "OCC", description: "Seismic Load Y", purpose: "Seismic acceleration in Y (vertical) direction." },
        { id: 5, combination: "U3",              category: "OCC", description: "Seismic Load Z", purpose: "Seismic acceleration in Z direction." },
        { id: 6, combination: "L1-L2",           category: "EXP", description: "Expansion Range", purpose: "Thermal expansion stress check. Operating minus Sustained." },
        { id: 7, combination: "L3+L4+L5",        category: "OCC", description: "Resultant Seismic", purpose: "SRSS combination of all three seismic directions." },
        { id: 8, combination: "L2+L7",           category: "OCC", description: "Sustained + Seismic", purpose: "Occasional stress check — sustained combined with resultant seismic." }
      ]
    },

    withSprings: {
      id: "with-springs",
      name: "Lines with Spring Hangers",
      description: "Extended load cases for systems with variable or constant spring supports. Includes wind cases categorised as SUS.",
      applicableConditions: ["spring hangers present", "variable springs", "constant springs"],
      totalCases: 12,
      notes: [
        "Wind loads (WIN1/WIN2) are categorised as SUS instead of OCC to avoid enabling snubber supports that may be reserved for seismic",
        "This is a deliberate engineering choice — not an error",
        "If no snubbers in the system, wind can be categorised as OCC instead",
        "Cases 10-11 check sustained + wind combination as occasional"
      ],
      cases: [
        { id: 1,  combination: "W+D1+T1+P1+F1", category: "OPE", description: "Operating", purpose: "Full operating condition." },
        { id: 2,  combination: "W+P1+F1",        category: "SUS", description: "Sustained (Dead Weight + Pressure)", purpose: "Primary sustained stress check." },
        { id: 3,  combination: "WIN1",            category: "SUS", description: "Wind along X", purpose: "Wind load in X. Categorised as SUS to avoid enabling snubbers." },
        { id: 4,  combination: "WIN2",            category: "SUS", description: "Wind along Z", purpose: "Wind load in Z. Categorised as SUS to avoid enabling snubbers." },
        { id: 5,  combination: "U1",              category: "OCC", description: "Seismic Load X", purpose: "Seismic acceleration in X direction." },
        { id: 6,  combination: "U2",              category: "OCC", description: "Seismic Load Y", purpose: "Seismic acceleration in Y direction." },
        { id: 7,  combination: "U3",              category: "OCC", description: "Seismic Load Z", purpose: "Seismic acceleration in Z direction." },
        { id: 8,  combination: "L1-L2",           category: "EXP", description: "Expansion Range", purpose: "Thermal expansion stress check." },
        { id: 9,  combination: "L5+L6+L7",        category: "OCC", description: "Resultant Seismic", purpose: "SRSS of seismic directions." },
        { id: 10, combination: "L2+L3",           category: "OCC", description: "Sustained + Wind X", purpose: "Occasional check — sustained plus wind in X." },
        { id: 11, combination: "L2+L4",           category: "OCC", description: "Sustained + Wind Z", purpose: "Occasional check — sustained plus wind in Z." },
        { id: 12, combination: "L2+L9",           category: "OCC", description: "Sustained + Seismic", purpose: "Occasional check — sustained plus resultant seismic." }
      ]
    },

    gasSteamVapour: {
      id: "gas-steam-vapour",
      name: "Gas / Steam / Vapour Lines",
      description: "Load cases for gas, steam, or vapour service where pipe is empty (no liquid) during normal operation.",
      applicableFluids: ["gas", "steam", "vapour", "air", "nitrogen", "natural gas", "fuel gas", "instrument air"],
      totalCases: 9,
      notes: [
        "CRITICAL: Use WNC (Weight No Content) for operating cases — NOT W. The pipe has no liquid during operation.",
        "Using W instead of WNC is the most common junior mistake for gas/steam lines — it adds water weight that doesn't exist in operation, giving wrong support loads.",
        "Hydrotest case (Case 3) uses W because pipe IS full of water during test.",
        "P2 is typically the hydrotest pressure."
      ],
      cases: [
        { id: 1, combination: "WNC+D1+T1+P1",   category: "OPE", description: "Operating (No Content)", purpose: "Operating condition. Uses WNC — pipe has no liquid in operation." },
        { id: 2, combination: "WNC+P1",           category: "SUS", description: "Sustained (No Content + Pressure)", purpose: "Sustained stress check. Uses WNC." },
        { id: 3, combination: "W+P2",             category: "SUS", description: "Hydrotest (Water Filled)", purpose: "Hydrotest condition. Uses W because pipe is full of water during test." },
        { id: 4, combination: "U1",               category: "OCC", description: "Seismic Load X", purpose: "Seismic acceleration in X direction." },
        { id: 5, combination: "U2",               category: "OCC", description: "Seismic Load Y", purpose: "Seismic acceleration in Y direction." },
        { id: 6, combination: "U3",               category: "OCC", description: "Seismic Load Z", purpose: "Seismic acceleration in Z direction." },
        { id: 7, combination: "L1-L2",            category: "EXP", description: "Expansion Range", purpose: "Thermal expansion stress check." },
        { id: 8, combination: "L4+L5+L6",         category: "OCC", description: "Resultant Seismic", purpose: "SRSS of seismic directions." },
        { id: 9, combination: "L2+L8",            category: "OCC", description: "Sustained + Seismic", purpose: "Occasional stress check." }
      ]
    },

    pumpRotatingEquipment: {
      id: "pump-rotating-equipment",
      name: "Pump Piping — Rotating Equipment",
      description: "Load cases for piping connected to pumps with multiple operating scenarios (e.g. 2 running + 1 standby, or 2 pumps with alternating duty).",
      applicableEquipment: ["centrifugal pump", "reciprocating pump", "compressor", "rotating equipment"],
      totalCases: 13,
      notes: [
        "T1 = Pump A operating, Pump B standby at ambient temperature",
        "T2 = Pump B operating, Pump A standby at ambient temperature",
        "T3 = Both Pump A and Pump B operating simultaneously",
        "Case 5 (WNC) is essential for spring hanger calibration above pump nozzle — do not omit this case",
        "Three separate expansion cases (10, 11, 12) are needed because each pump scenario produces different thermal growth",
        "For 3 pumps (2 running + 1 standby), extend with additional temperature sets for each scenario",
        "D1 represents initial displacement at pump nozzle(s) — calculate in Step 2"
      ],
      cases: [
        { id: 1,  combination: "W+P1+F1+T1+D1",  category: "OPE", description: "Operating — Pump A running, Pump B standby", purpose: "Pump A at operating temp, Pump B at ambient (21°C)." },
        { id: 2,  combination: "W+P1+F1+T2+D1",  category: "OPE", description: "Operating — Pump B running, Pump A standby", purpose: "Pump B at operating temp, Pump A at ambient (21°C)." },
        { id: 3,  combination: "W+P1+F1+T3+D1",  category: "OPE", description: "Operating — Both pumps running", purpose: "Both Pump A and Pump B at operating temperature." },
        { id: 4,  combination: "W+P1+F1",         category: "SUS", description: "Sustained (Dead Weight + Pressure)", purpose: "Primary sustained stress check." },
        { id: 5,  combination: "WNC+F1",           category: "SUS", description: "Weight No Content", purpose: "CRITICAL: Used to calculate spring hanger calibration above pump nozzle. Do not omit." },
        { id: 6,  combination: "U1",               category: "OCC", description: "Seismic Load X", purpose: "Seismic acceleration in X direction." },
        { id: 7,  combination: "U2",               category: "OCC", description: "Seismic Load Y", purpose: "Seismic acceleration in Y direction." },
        { id: 8,  combination: "U3",               category: "OCC", description: "Seismic Load Z", purpose: "Seismic acceleration in Z direction." },
        { id: 9,  combination: "L6+L7+L8",         category: "OCC", description: "Resultant Seismic", purpose: "SRSS of seismic directions." },
        { id: 10, combination: "L1-L4",            category: "EXP", description: "Expansion — Pump A operating, B standby", purpose: "Thermal expansion for Pump A running scenario." },
        { id: 11, combination: "L2-L4",            category: "EXP", description: "Expansion — Pump B operating, A standby", purpose: "Thermal expansion for Pump B running scenario." },
        { id: 12, combination: "L3-L4",            category: "EXP", description: "Expansion — Both pumps operating", purpose: "Thermal expansion for both pumps running." },
        { id: 13, combination: "L4+L9",            category: "OCC", description: "Sustained + Seismic", purpose: "Occasional stress check — sustained plus resultant seismic." }
      ]
    }
  }
};
