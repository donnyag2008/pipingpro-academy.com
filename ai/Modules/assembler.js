/**
 * Stress Piping Agent — Prompt Assembler
 * 
 * Reads the user's question (and conversation history) and selects
 * the relevant knowledge modules to include in the system prompt.
 * 
 * Base prompt is ALWAYS included. Knowledge modules are added when
 * keywords in the conversation match their trigger patterns.
 * 
 * Deploy: import into your Cloudflare Pages Function at /api/assistant
 */

// Knowledge module definitions — 22 modules
// Each module has: file path, trigger keywords, and description
const KNOWLEDGE_MODULES = [
  // === BATCH 1: Core stress analysis modules ===
  {
    id: 'pump-lines',
    file: 'pump-lines.txt',
    triggers: [
      'pump', 'suction', 'discharge', 'api 610', 'api610',
      'rotating equipment', 'standby', '2+1', 'impeller',
      'centrifugal pump', 'reciprocating pump', 'ansi pump',
      'turbine', 'compressor nozzle'
    ],
    description: 'Pump suction/discharge line workflow and load cases'
  },
  {
    id: 'vessels',
    file: 'vessels.txt',
    triggers: [
      'vessel', 'column', 'tower', 'drum', 'exchanger', 'heat exchanger',
      'reactor', 'vertical vessel', 'horizontal vessel', 'separator',
      'wrc 297', 'wrc 537', 'wrc297', 'wrc537', 'nozzle flexibility',
      'shell temperature', 'regeneration', 'steam-out', 'steam out'
    ],
    description: 'Pressure vessel knowledge and load cases'
  },
  {
    id: 'tanks',
    file: 'tanks.txt',
    triggers: [
      'tank', 'storage tank', 'api 650', 'api 620', 'api650', 'api620',
      'settlement', 'bulging', 'tank farm', 'tank nozzle', 'floating roof'
    ],
    description: 'Storage tank knowledge and load cases'
  },
  {
    id: 'furnace',
    file: 'furnace.txt',
    triggers: [
      'furnace', 'heater', 'fired heater', 'decoking', 'decoke',
      'coil', 'radiant', 'convection section'
    ],
    description: 'Furnace/heater knowledge and load cases'
  },
  {
    id: 'air-cooler',
    file: 'air-cooler.txt',
    triggers: [
      'air cooler', 'aircooler', 'air-cooler', 'fin fan', 'finfan',
      'api 661', 'api661', 'header box', 'tube bundle'
    ],
    description: 'Air cooler knowledge and load cases'
  },
  {
    id: 'friction',
    file: 'friction.txt',
    triggers: [
      'friction', 'slide plate', 'ptfe', 'teflon', 'coefficient of friction',
      'sliding', 'steel to steel', 'mu ', 'μ'
    ],
    description: 'Friction rules, coefficients, and PTFE slide plates'
  },
  {
    id: 'modelling-rules',
    file: 'modelling-rules.txt',
    triggers: [
      'modelling rule', 'modeling rule', '+y', 'uplift', 'lift off', 'liftoff',
      'gap', 'dummy support', 'dummy leg', 'trunnion temperature',
      'bourdon', 'reinforcing pad', 'relief valve', 'dlf', 'dynamic load factor',
      'sif', 'stress intensification', 'branch angle', '45 deg', '60 deg',
      'wind load', 'wind effect', 'component weight', 'valve weight'
    ],
    description: 'Practical modelling rules for CAESAR II / stress software'
  },

  // === BATCH 2: Bechtel/KBR/IKPT-KBR spec modules ===
  {
    id: 'general-philosophy',
    file: 'general-philosophy.txt',
    triggers: [
      'philosophy', 'working method', 'visual check', 'approximate method',
      'when to analyse', 'when to analyze', 'computer analysis needed',
      'calculation check', 'complete check', 'general check',
      'cold spring', 'bellows', 'expansion joint', 'freeze arrangement',
      'worst case', 'realistic design'
    ],
    description: 'General stress engineering philosophy and working methods'
  },
  {
    id: 'thermal-loads',
    file: 'thermal-loads.txt',
    triggers: [
      'thermal load', 'elastic modulus', 'hot modulus', 'cold modulus',
      'design temperature', 'operating temperature', 'solar temperature',
      'ambient temperature', 'steam tracing', 'pipe bowing',
      'internally lined', 'refractory lined', 'concrete lined',
      'fire case', 'fire condition', 'differential temperature',
      'flare line bowing', 'lng start-up', 'lng startup'
    ],
    description: 'Thermal loads, temperature types, and elastic modulus rules'
  },
  {
    id: 'dynamic-loads',
    file: 'dynamic-loads.txt',
    triggers: [
      'psv', 'pressure safety valve', 'relief valve reaction', 'rupture disc',
      'slug flow', 'water hammer', 'slug force', 'slug load',
      'seismic', 'earthquake', 'seismic coefficient',
      'control valve noise', 'high pressure drop', 'vibration',
      'differential settlement', 'gross settlement',
      'large displacement', '50mm displacement'
    ],
    description: 'Dynamic and special loads — PSV, slug, seismic, wind, settlement'
  },
  {
    id: 'nozzle-allowables',
    file: 'nozzle-allowables.txt',
    triggers: [
      'nozzle allowable', 'nozzle load allowable', 'equipment allowable',
      'api 610 table', 'nema sm-23', 'nema sm23',
      'api 612', 'api 560', 'api 661 table',
      'pump allowable', 'compressor allowable', 'turbine allowable',
      'heater allowable', 'exchanger allowable', 'vessel allowable',
      'nozzle flexibility', 'bijlaard', 'bs5500 appendix g',
      'stacked exchanger', 'bellows exchanger'
    ],
    description: 'Standard allowable equipment nozzle loads for all equipment types'
  },
  {
    id: 'compressors',
    file: 'compressors.txt',
    triggers: [
      'compressor', 'centrifugal compressor', 'reciprocating compressor',
      'api 617', 'api617', 'api 618', 'api618',
      'pulsation', 'pulse bottle', 'vibration support',
      'nema', 'constant spring compressor', 'cold spring prohibited',
      'standby temperature', 'standby pump', 'warm-up bypass',
      '2+1 standby', '3+1 standby', 'standby cold', 'standby hot'
    ],
    description: 'Compressor knowledge — centrifugal, reciprocating, standby rules'
  },
  {
    id: 'critical-lines',
    file: 'critical-lines.txt',
    triggers: [
      'critical line', 'line category', 'piping category',
      'category 1', 'category 2', 'category 3', 'category 4', 'category 5',
      'grade a', 'grade b', 'grade c', 'flexibility grade',
      'which lines need analysis', 'need computer analysis',
      'visual inspection', 'approximate method',
      'load sensitive', 'stress sensitive'
    ],
    description: 'Critical line selection and analysis categories (KBR/IKPT-KBR)'
  },
  {
    id: 'weight-loading',
    file: 'weight-loading.txt',
    triggers: [
      'weight loading', 'fluid weight', 'water weight',
      'vapor weight', 'gas weight', 'steam weight',
      'flare header weight', 'insulation weight',
      'nominal wall', 'retirement thickness', 'minimum wall',
      'hydrotest weight', 'temporary support hydrotest',
      'pipe weight calculation'
    ],
    description: 'Weight loading rules — fluid weight, wall thickness, hydrotest'
  },
  {
    id: 'nozzle-movements',
    file: 'nozzle-movements.txt',
    triggers: [
      'nozzle movement', 'nozzle displacement', 'thermal displacement',
      'equipment movement', 'thermal growth',
      'elongation chart', 'skirt expansion', 'skirt temperature',
      'hanging down line', 'bottom line', 'skirt opening',
      'afc movement', 'air cooler movement', 'header box movement',
      'tube bundle resistance', 'exchanger movement',
      'horizontal vessel movement', 'column movement',
      'pump movement', 'turbine movement',
      'circumferential movement', 'longitudinal movement'
    ],
    description: 'Nozzle movement calculation methods for all equipment types'
  },

  // === BATCH 3: Layout and support modules (Bechtel/Brown & Root) ===
  {
    id: 'pump-suction-layout',
    file: 'pump-suction-layout.txt',
    triggers: [
      'pump suction', 'suction piping layout', 'suction arrangement',
      'eccentric reducer', 'flat side up', 'fsu',
      'temporary strainer', 'suction strainer',
      '3 pipe diameter', 'three pipe diameter',
      'pump foundation', 'integral foundation',
      'centrifugal pump suction', 'side suction'
    ],
    description: 'Centrifugal pump suction piping arrangement (Brown & Root PI-620)'
  },
  {
    id: 'layout-general',
    file: 'layout-general.txt',
    triggers: [
      'pipe layout', 'piping layout', 'pipe routing', 'route pipe',
      'sc-i', 'sc-ii', 'sc-iii', 'seismic category',
      'pipe classification', 'grouping pipeline', 'pipeline bank',
      'flexibility rule', 'flexibility formula', 'doy formula',
      'expansion loop', 'kellogg', 'loop design', 'loop height',
      'lateral support', 'seismic support location',
      'weight support location', 'riser support',
      'gang support', 'pipe rack routing'
    ],
    description: 'General piping layout guidance — classifications, flexibility, seismic/weight rules'
  },
  {
    id: 'layout-clearances',
    file: 'layout-clearances.txt',
    triggers: [
      'clearance', 'minimum clearance', 'pipe clearance',
      'pipe spacing', 'distance between pipes',
      'seismic clearance', 'thermal clearance',
      'interference', 'pipe interference'
    ],
    description: 'Minimum pipe clearances — thermal and seismic displacement tables'
  },
  {
    id: 'layout-spans',
    file: 'layout-spans.txt',
    triggers: [
      'span table', 'support span', 'weight span', 'seismic span',
      'pipe span', 'span length', 'maximum span',
      'support load', 'lateral seismic load', 'weight support load',
      'span carbon steel', 'span stainless steel',
      'empty span', 'water filled span'
    ],
    description: 'Span and support load tables — SC-I/II/III, CS and SS'
  },
  {
    id: 'layout-offsets',
    file: 'layout-offsets.txt',
    triggers: [
      'offset length', 'thermal offset', 'pipe offset',
      'minimum offset', 'offset table',
      'first support distance', 'first guide distance',
      'bend pipe offset', 'elbow offset',
      'offset vs seismic span', 'offset scaling'
    ],
    description: 'Thermal offset length tables and scaling rules'
  },
  {
    id: 'stress-checklists',
    file: 'stress-checklists.txt',
    triggers: [
      'checklist', 'stress checklist', 'calculation checklist',
      'qa checklist', 'quality assurance',
      'sc-i checklist', 'sc-ii checklist', 'sc-iii checklist',
      'evaluation checklist', 'stress evaluation',
      'release for construction', 'sign off', 'sign-off',
      'design input check', 'computer modelling check'
    ],
    description: 'Piping stress calculation QA checklists (SC-I/II and SC-III)'
  }
];

/**
 * Detect which knowledge modules are relevant based on conversation content.
 * Scans the last N messages (user + assistant) for trigger keywords.
 * 
 * @param {Array} messages - conversation history [{role, content}, ...]
 * @param {number} lookback - how many recent messages to scan (default: 6)
 * @returns {Array} - list of module IDs to include
 */
function detectModules(messages, lookback = 6) {
  // Build a single search string from recent messages
  const recent = messages.slice(-lookback);
  const searchText = recent
    .map(m => m.content)
    .join(' ')
    .toLowerCase();

  const matched = [];

  for (const module of KNOWLEDGE_MODULES) {
    const isTriggered = module.triggers.some(trigger => 
      searchText.includes(trigger.toLowerCase())
    );
    if (isTriggered) {
      matched.push(module.id);
    }
  }

  return matched;
}

/**
 * Assemble the full system prompt from base + matched modules.
 * 
 * In Cloudflare Pages Functions, the .txt files would be imported as static assets
 * or stored in KV. For local dev, read from filesystem.
 * 
 * @param {Object} knowledgeFiles - { 'base': '...', 'pump-lines': '...', ... }
 * @param {Array} moduleIds - list of module IDs to include
 * @returns {string} - assembled system prompt
 */
function assemblePrompt(knowledgeFiles, moduleIds) {
  // Base is always included
  let prompt = knowledgeFiles['base'];

  // Add matched modules
  for (const id of moduleIds) {
    if (knowledgeFiles[id]) {
      prompt += '\n\n' + knowledgeFiles[id];
    }
  }

  return prompt;
}

/**
 * Main function — call this from your API endpoint.
 * 
 * Usage in Cloudflare Pages Function:
 * 
 *   import { buildSystemPrompt } from './assembler.js';
 *   
 *   // In your onRequest handler:
 *   const systemPrompt = buildSystemPrompt(messages, knowledgeFiles);
 *   
 *   // Then pass to Anthropic API:
 *   const response = await fetch('https://api.anthropic.com/v1/messages', {
 *     method: 'POST',
 *     headers: { ... },
 *     body: JSON.stringify({
 *       model: 'claude-sonnet-4-6',
 *       max_tokens: 2000,
 *       system: systemPrompt,
 *       messages: messages
 *     })
 *   });
 */
function buildSystemPrompt(messages, knowledgeFiles) {
  const moduleIds = detectModules(messages);
  
  // Always include modelling-rules if any equipment module is matched
  const equipmentModules = ['pump-lines', 'vessels', 'tanks', 'furnace', 'air-cooler', 'compressors'];
  const hasEquipment = moduleIds.some(id => equipmentModules.includes(id));
  if (hasEquipment && !moduleIds.includes('modelling-rules')) {
    moduleIds.push('modelling-rules');
  }

  // Always include friction if equipment is involved
  if (hasEquipment && !moduleIds.includes('friction')) {
    moduleIds.push('friction');
  }

  // Always include nozzle-allowables if equipment is involved
  if (hasEquipment && !moduleIds.includes('nozzle-allowables')) {
    moduleIds.push('nozzle-allowables');
  }

  // Always include nozzle-movements if equipment is involved
  if (hasEquipment && !moduleIds.includes('nozzle-movements')) {
    moduleIds.push('nozzle-movements');
  }

  // If any layout module is matched, also include layout-general for context
  const layoutModules = ['layout-clearances', 'layout-spans', 'layout-offsets', 'pump-suction-layout'];
  const hasLayout = moduleIds.some(id => layoutModules.includes(id));
  if (hasLayout && !moduleIds.includes('layout-general')) {
    moduleIds.push('layout-general');
  }

  const prompt = assemblePrompt(knowledgeFiles, moduleIds);
  
  console.log(`[Stress Piping Agent] Modules loaded: base + [${moduleIds.join(', ')}]`);
  
  return prompt;
}

export { buildSystemPrompt, detectModules, assemblePrompt, KNOWLEDGE_MODULES };
