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

// Knowledge module definitions
// Each module has: file path, trigger keywords, and description
const KNOWLEDGE_MODULES = [
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
      'friction', 'slide plate', 'ptfe', 'teflon', 'coefficient',
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
  // (modelling rules apply to all equipment types)
  const equipmentModules = ['pump-lines', 'vessels', 'tanks', 'furnace', 'air-cooler'];
  const hasEquipment = moduleIds.some(id => equipmentModules.includes(id));
  if (hasEquipment && !moduleIds.includes('modelling-rules')) {
    moduleIds.push('modelling-rules');
  }

  // Always include friction if equipment is involved
  if (hasEquipment && !moduleIds.includes('friction')) {
    moduleIds.push('friction');
  }

  const prompt = assemblePrompt(knowledgeFiles, moduleIds);
  
  console.log(`[Stress Piping Agent] Modules loaded: base + [${moduleIds.join(', ')}]`);
  
  return prompt;
}

export { buildSystemPrompt, detectModules, assemblePrompt, KNOWLEDGE_MODULES };
