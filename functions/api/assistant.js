/**
 * PipingPro Academy — AI Assistant API (Cloudflare Pages Function)
 * functions/api/assistant.js
 * 
 * Multi-agent routing:
 *   - "pipeline-mech"   → Pipeline Mechanical Design calculator assistant
 *   - "wall-thickness"   → Pipe Wall Thickness calculator assistant
 *   - "design-agent"     → Piping Design Agent (full design chain)
 *   - (default)          → Homepage / general assistant
 */

// ═══════════════════════════════════════════════════════════════
//  SYSTEM PROMPTS
// ═══════════════════════════════════════════════════════════════

const PROMPT_HOMEPAGE = `You are the PipingPro Academy AI Assistant — the front door to a comprehensive piping and pipeline engineering platform built by a Principal Engineer with 35+ years of international Oil & Gas experience.

Your role:
1. Answer general piping engineering questions accurately and concisely.
2. Guide users to the right calculator or course on the platform.
3. When a user asks for a DESIGN task (e.g. "design a 12-inch pipe for 85 barg at 250°C"), tell them you can run a full design chain and ask if they'd like to proceed. If yes, the system will route to the Piping Design Agent.

Available Engineering Toolkits:
A. Piping Mechanical Design — Wall thickness, pipe weight, material datasheet, unit converter, flange & valve weight, material comparison, pipe coating & insulation
B. Pipeline Mechanical Design — Wall thickness (B31.4/B31.8/ISO 13623), buried pipe, upheaval buckling, ductile fracture, cathodic protection, sectional volume, pipeline crossing
C. Pipe Support Engineering — Support span, special/trunnion support, standard support catalogue
D. Project Engineering — Hydro/pneumo test pack, piping estimation, P&ID MTO
E. Piping Stress Analysis — Expansion loop, L-bend stress, stress critical line selector, flange leakage, nozzle loads, vibration fatigue
F. Pipeline Integrity — Remaining strength of corroded pipe (B31G)

Be professional, concise, and technically accurate. You are speaking to fellow engineers.`;

// NOTE: PROMPT_PIPELINE_MECH and PROMPT_WALL_THICKNESS should be loaded from
// your existing system-prompt files. Replace these placeholders with your actual prompts.
const PROMPT_PIPELINE_MECH = `You are the PipingPro Academy AI Assistant for the Onshore Pipeline Mechanical Design Calculator. Help users with pipeline wall thickness calculations per ASME B31.4, B31.8, and ISO 13623. Use only verified data from PPA databases. Show formulas and working.`;

const PROMPT_WALL_THICKNESS = `You are the PipingPro Academy AI Assistant for the Pipe Wall Thickness Calculator. Help users with wall thickness calculations per ASME B31.3 (Process Piping), B31.4 (Liquid Pipelines), and B31.8 (Gas Transmission). Use only verified data from PPA databases. Show formulas and working.`;

// The Design Agent prompt is loaded from the system-prompt-design-agent.md content
// For deployment, paste the full content here or load from KV/R2
const PROMPT_DESIGN_AGENT = `PASTE_DESIGN_AGENT_PROMPT_HERE`;


// ═══════════════════════════════════════════════════════════════
//  ROUTE RESOLVER
// ═══════════════════════════════════════════════════════════════

function resolvePrompt(calculator, activeTab) {
  switch (calculator) {
    case 'design-agent':
      return {
        systemPrompt: PROMPT_DESIGN_AGENT,
        label: 'Piping Design Agent'
      };

    case 'wall-thickness':
      // Append active tab context
      let wtPrompt = PROMPT_WALL_THICKNESS;
      if (activeTab) {
        wtPrompt += `\n\nThe user is currently viewing the "${activeTab}" panel. Focus your answers on that code unless they ask about another.`;
      }
      return {
        systemPrompt: wtPrompt,
        label: 'Wall Thickness Assistant'
      };

    case 'pipeline-mech':
      let pmPrompt = PROMPT_PIPELINE_MECH;
      if (activeTab) {
        pmPrompt += `\n\nThe user is currently viewing the "${activeTab}" tab. Tailor your response to that context.`;
      }
      return {
        systemPrompt: pmPrompt,
        label: 'Pipeline Mech Assistant'
      };

    default:
      return {
        systemPrompt: PROMPT_HOMEPAGE,
        label: 'PipingPro Assistant'
      };
  }
}


// ═══════════════════════════════════════════════════════════════
//  INTENT DETECTION — Upgrade to Design Agent when appropriate
// ═══════════════════════════════════════════════════════════════

function detectDesignIntent(messages) {
  if (!messages || messages.length === 0) return false;
  
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUserMsg) return false;
  
  const text = lastUserMsg.content.toLowerCase();
  
  // Patterns that indicate a full design request
  const designPatterns = [
    /design\s+a?\s*\d+["\s-]*(?:inch|")\s*pipe/,
    /design\s+(?:a\s+)?pipe\s+for/,
    /full\s+design/,
    /material\s+selection.*wall\s+thickness/,
    /wall\s+thickness.*flange\s+(?:rating|class)/,
    /need\s+(?:a\s+)?complete\s+(?:design|calculation)/,
    /design\s+(?:a\s+)?piping/,
    /pipe\s+design\s+for/,
    /run\s+(?:the\s+)?design\s+(?:chain|agent|workflow)/,
    /proceed\s+with\s+(?:the\s+)?design/,
    /yes.*design/
  ];
  
  return designPatterns.some(pattern => pattern.test(text));
}


// ═══════════════════════════════════════════════════════════════
//  MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    
    const {
      messages = [],
      calculator = '',           // 'design-agent' | 'wall-thickness' | 'pipeline-mech' | ''
      activeTab = '',
      memberstackToken = ''
    } = body;

    // ── Auth check (Memberstack) ──
    // Uncomment and configure when ready to enforce membership
    // if (!memberstackToken) {
    //   return new Response(JSON.stringify({ error: 'Authentication required' }), {
    //     status: 401, headers: { 'Content-Type': 'application/json' }
    //   });
    // }

    // ── Resolve which agent to use ──
    let agentId = calculator;
    
    // If on homepage and user asks a design question, auto-upgrade
    if ((!agentId || agentId === 'homepage') && detectDesignIntent(messages)) {
      agentId = 'design-agent';
    }

    const { systemPrompt, label } = resolvePrompt(agentId, activeTab);

    // ── Build messages for Claude API ──
    const apiMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // ── Call Claude API ──
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: apiMessages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API error:', response.status, errText);
      return new Response(JSON.stringify({ 
        error: 'AI service temporarily unavailable',
        agent: label 
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();

    // Extract text content from Claude's response
    const assistantText = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return new Response(JSON.stringify({
      reply: assistantText,
      agent: label,
      usage: data.usage
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Assistant function error:', err);
    return new Response(JSON.stringify({ 
      error: 'Internal error — please try again' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
