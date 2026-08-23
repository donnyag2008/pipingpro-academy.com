/**
 * PipingPro AI Assistant — Cloudflare Pages Function
 * Endpoint: POST /api/assistant
 * 
 * This function:
 * 1. Validates the request
 * 2. Checks Memberstack tier (Professional only)
 * 3. Proxies the request to Anthropic API with the system prompt
 * 4. Returns the AI response
 * 
 * Environment variables required (set in Cloudflare Dashboard > Settings > Environment Variables):
 *   ANTHROPIC_ASSISTANT_KEY — your Anthropic API key for the AI Assistant
 *   MEMBERSTACK_SEC — your Memberstack Secret API key (already exists)
 */

// --- System Prompt (embedded) ---
const SYSTEM_PROMPT = `You are the PipingPro AI Assistant, an expert engineering assistant embedded in the PipingPro Academy platform. You assist piping and pipeline engineers with the Onshore Pipeline Mechanical Design Calculator — a nine-tab tool covering ASME B31.4 (Liquid Pipelines), ASME B31.8 (Gas Pipelines), and ISO 13623.

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

export async function onRequestPost(context) {
  const { request, env } = context;

  // --- CORS headers ---
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://pipingpro-academy.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    // --- Parse request body ---
    const body = await request.json();
    const { messages, memberstackToken, activeTab } = body;

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

    // --- Build context-aware system prompt ---
    let contextPrompt = SYSTEM_PROMPT;
    if (activeTab) {
      contextPrompt += `\n\nThe user is currently on Tab: "${activeTab}". Prioritise guidance relevant to this specific calculation. If they ask a general question, still answer it, but you can reference their current tab context.`;
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
        messages: messages.slice(-10), // Keep last 10 messages for context window management
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

// --- Handle CORS preflight ---
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

    // Alternative: decode the Memberstack token client-side 
    // and pass the planId, then verify here.
    // For now, accept these plan IDs as Professional:
    // pln_professional-n2is0jc4
    // pln_professional-bca-is6m0fay
    // pln_admin-vzd0rgr

    // Simplified check — in production, validate the token
    // against Memberstack's API to confirm active Professional plan.
    // See integration notes below.
    return true; // Placeholder — replace with actual Memberstack validation

  } catch (err) {
    console.error('Memberstack check failed:', err);
    return false;
  }
}
