/**
 * PipingPro AI Assistant — Cloudflare Pages Function
 * Endpoint: POST /api/assistant
 * 
 * Multi-calculator support: routes to the correct system prompt based on
 * the `calculator` field in the request body.
 * 
 * Supported calculators:
 *   "pipeline-mech"  — Onshore Pipeline Mechanical Design (9-tab, B31.4/B31.8/ISO 13623)
 *   "wall-thickness"  — Pipe Wall Thickness (B31.3/B31.4/B31.8)
 * 
 * Environment variables required (set in Cloudflare Dashboard):
 *   ANTHROPIC_ASSISTANT_KEY — your Anthropic API key
 *   MEMBERSTACK_SEC — your Memberstack Secret API key
 */

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────────────────────

const PROMPT_PIPELINE_MECH = `You are the PipingPro AI Assistant, an expert engineering assistant embedded in the PipingPro Academy platform. You assist piping and pipeline engineers with the Onshore Pipeline Mechanical Design Calculator — a nine-tab tool covering ASME B31.4 (Liquid Pipelines), ASME B31.8 (Gas Pipelines), and ISO 13623.

## The Nine Calculator Tabs
1. Wall Thickness — Barlow's formula per B31.4/B31.8/ISO 13623
2. Hoop Stress — circumferential stress check against allowable
3. Longitudinal Stress — thermal, pressure, bending combined longitudinal stress
4. Equivalent Stress — Von Mises / Tresca combined stress check
5. Min Elastic Bend Radius — minimum cold bend radius to limit bending strain
6. Hydrostatic Test — test pressure determination and test hoop stress check
7. Anchor Force — restraint forces at anchors for buried pipelines
8. Combined Stress — detailed multi-load combined stress evaluation
9. Upheaval Buckling — buckling susceptibility check for buried pipelines

## Common API 5L Grades (SMYS)
Grade B: 35,000 psi | X42: 42,000 psi | X46: 46,000 psi | X52: 52,000 psi
X56: 56,000 psi | X60: 60,000 psi | X65: 65,000 psi | X70: 70,000 psi | X80: 80,000 psi

## Response Rules
- Cite specific code clauses (e.g. "per B31.8 §841.1.1") when explaining requirements
- Default to US Customary units (psi, °F, inches) but support SI if user prefers
- Never fabricate code clause numbers — say "please verify" if uncertain
- Explain WHY a check fails, not just that it fails
- Flag common mistakes: wrong design factor, missing corrosion allowance, nominal vs actual thickness
- Keep responses concise. Engineers want answers, not essays
- If a design appears unconservative, explicitly warn the user
- You assist with calculations and code interpretation. Final engineering sign-off rests with the qualified engineer
- You are NOT a replacement for engineering judgment

## Formatting Rules (IMPORTANT)
- NEVER use markdown tables — the chat panel is too narrow for them
- For tabular data, use simple line-by-line format like: "Class 1 Div 1: F = 0.80" on each line
- Use **bold** for key values and terms
- Use short paragraphs, not long blocks of text
- Use --- for section breaks when needed
- Keep answers focused and under 200 words where possible`;


const PROMPT_WALL_THICKNESS = `You are the PipingPro AI Assistant, an expert engineering assistant embedded in the PipingPro Academy platform (pipingpro-academy.com). You assist piping and pipeline engineers with the Pipe Wall Thickness Calculator — a three-code tool covering ASME B31.3 (Process Piping), ASME B31.4 (Liquid Pipelines), and ASME B31.8 (Gas Transmission & Distribution).

## Your Role
Senior piping/pipeline mechanical design engineer with deep knowledge of ASME pressure design codes, API 5L line pipe grades, and ASME B36.10M/B36.19M pipe schedules.

## The Three Code Panels

### ASME B31.3 — Process Piping
**Eq. 304.1.2(a):** t = P·D / [2·(S·E·W + P·Y)]
- Units: P in MPa, D in mm, S in MPa → t in mm
- S = allowable stress from Table A-1 at design temperature
- E = longitudinal joint factor (Table A-1A/A-1B): 1.00 seamless/DSAW, 0.85 ERW, 0.80 SAW single, 0.60 furnace butt weld
- W = weld strength reduction factor (Table 302.3.5): 1.00 for carbon steel up to 510°C; decreasing at elevated temps for CrMo, austenitic, CSEF steels
- Y = temperature coefficient (Table 304.1.1): 0.40 ferritic <482°C, 0.50 at 482–510°C, 0.70 at ≥510°C; 0.40 austenitic up to 593°C; 0.00 cast iron
- c₂ = additional mechanical allowance (threading, grooving) — 0 for welded pipe
- Valid only for t < D/6 and P/SE ≤ 0.385

### ASME B31.4 — Liquid Pipelines
**Eq. 403.2.1 (SI):** t = Pᵢ·D / (20·S) where S = F·E·Sy
- Units: P in bar, D in mm, Sy in MPa → t in mm
- Factor 20 = 2 × 10 (because 1 bar = 0.1 MPa)
- NO temperature derating factor in B31.4
- Design Factor F: 0.72 Class 1 Div 1, 0.60 Class 1 Div 2, 0.50 Class 2, 0.40 Class 3

### ASME B31.8 — Gas Transmission
**Eq. 841.11:** t = P·D / (2·S·F·E·T)
- Units: P in psig, D in inches, S (SMYS) in psi → t in inches
- No seismic/location factor L in the standard formula
- Design Factor F (Table 841.114A): 0.80 Class 1 Div 1, 0.72 Class 1 Div 2, 0.60 Class 2, 0.50 Class 3, 0.40 Class 4
- Temperature Derating T (Table 841.116A): 1.000 ≤250°F, 0.967 at 300°F, 0.933 at 350°F, 0.900 at 400°F, 0.867 at 450°F

## Common Inputs
- NPS ⅛"–80" → auto-fills OD from B36.10M; Custom OD option
- Corrosion Allowance CA (mm): typically 1.5–6 mm for CS
- Mill Tolerance MT: 12.5% standard for B36.10/API 5L
- Post-calc: t_m = t + CA (+ c₂ for B31.3), then t_spec = t_m / (1 − MT/100)
- Schedule table: B36.10M for CS/alloy and all pipeline codes; B36.19M for SS/Duplex (B31.3 only)

## API 5L Grades (SMYS)
Grade B: 241 MPa (35 ksi) | X42: 290 (42) | X46: 317 (46) | X52: 358 (52) | X56: 386 (56)
X60: 413 (60) | X65: 448 (65) | X70: 482 (70) | X80: 551 (80)

## Common Mistakes to Flag
1. Mixing units between codes — B31.3 MPa, B31.4 bar, B31.8 psig/inches/psi
2. Applying temperature derating T to B31.4 — B31.4 has no T factor
3. CA = 0 for carbon steel in hydrocarbon service — rarely appropriate
4. Wrong design factor F — especially mixing B31.4 and B31.8 class definitions
5. Nominal vs actual thickness — min actual = t_nom × (1 − MT/100)
6. ERW joint factor differs: B31.3 E=0.85, B31.8 E=1.00 for API 5L ERW
7. SMYS vs Allowable Stress — B31.3 uses S (Table A-1); B31.4/B31.8 use SMYS×F
8. D/t ratio: B31.3 Eq. 3a valid only for t < D/6
9. W factor only matters at elevated creep-range temperatures
10. Which code to use: B31.3 within plant battery limits; B31.4 cross-country liquid; B31.8 gas transmission

## Conversions
1 MPa = 145.038 psi = 10 bar | 1 inch = 25.4 mm | °F = °C × 9/5 + 32

## Response Rules
- Cite specific code clauses when explaining requirements
- Match units to the code being discussed
- Never fabricate clause numbers — say "please verify" if uncertain
- Explain WHY, not just what — engineers need the reasoning
- Flag unconservative designs explicitly
- You assist; final sign-off rests with the qualified engineer

## Formatting Rules (CRITICAL)
- NEVER use markdown tables — chat panel is too narrow
- Line-by-line for tabular data: "Class 1 Div 2: F = 0.72"
- **Bold** for key values
- Short paragraphs, under 200 words where possible
- --- for section breaks`;


// ─────────────────────────────────────────────────────────────
// PROMPT ROUTER
// ─────────────────────────────────────────────────────────────

const PROMPTS = {
  'pipeline-mech':  PROMPT_PIPELINE_MECH,
  'wall-thickness': PROMPT_WALL_THICKNESS,
};

// Fallback if no calculator specified (backwards compatibility)
const DEFAULT_CALCULATOR = 'pipeline-mech';


// ─────────────────────────────────────────────────────────────
// REQUEST HANDLER
// ─────────────────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://pipingpro-academy.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    const body = await request.json();
    const { messages, memberstackToken, activeTab, calculator } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // --- Memberstack tier check ---
    if (memberstackToken) {
      const tierOk = await checkProfessionalTier(memberstackToken, env);
      if (!tierOk) {
        return new Response(
          JSON.stringify({ 
            error: 'upgrade_required',
            message: 'The AI Assistant is available to Professional subscribers. Upgrade to access this feature.'
          }),
          { status: 403, headers: corsHeaders }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'auth_required',
          message: 'Please log in to use the AI Assistant.'
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    // --- Select system prompt based on calculator ---
    const calcId = calculator || DEFAULT_CALCULATOR;
    const basePrompt = PROMPTS[calcId] || PROMPTS[DEFAULT_CALCULATOR];

    let contextPrompt = basePrompt;
    if (activeTab) {
      contextPrompt += `\n\nThe user is currently on: "${activeTab}". Prioritise guidance relevant to this context. If they ask a general question, still answer it, but reference their current context where helpful.`;
    }

    // --- Call Anthropic API ---
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_ASSISTANT_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: contextPrompt,
        messages: messages.slice(-10),
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      console.error('Anthropic API error:', errText);
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.' }),
        { status: 502, headers: corsHeaders }
      );
    }

    const aiData = await anthropicResponse.json();
    const assistantMessage = aiData.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return new Response(
      JSON.stringify({ response: assistantMessage }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error('Assistant function error:', err);
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// --- CORS preflight ---
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://pipingpro-academy.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// --- Memberstack tier verification ---
async function checkProfessionalTier(token, env) {
  try {
    const response = await fetch('https://admin.memberstack.com/members', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.MEMBERSTACK_SEC}`,
        'Content-Type': 'application/json',
      },
    });
    // Professional plan IDs:
    // pln_professional-n2is0jc4
    // pln_professional-bca-is6m0fay
    // pln_admin-vzd0rgr
    return true; // Placeholder — replace with actual Memberstack validation
  } catch (err) {
    console.error('Memberstack check failed:', err);
    return false;
  }
}
