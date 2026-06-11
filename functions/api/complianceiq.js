// ============================================================================
// functions/api/complianceiq.js
// Cloudflare Pages Function — auto-serves at  /api/complianceiq
//
// Holds the Anthropic key as a secret and gates the call behind D1 membership.
// The client's localStorage flag is NOT trusted — it presents a session token,
// which this function verifies against D1 BEFORE any Claude call is made.
//
// Bindings you must set (Pages > Settings > Functions):
//   - Secret:  ANTHROPIC_API_KEY   (wrangler secret / dashboard)
//   - D1:      DB                  (bound to your members database)
//
// Tables used: members, usage  (see complianceiq-schema.sql)
// ============================================================================

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4096;
const MONTHLY_LIMIT = 2; // ComplianceIQ runs included per member per month

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { system, mediaType, fileBase64, isPdf, token } = body;

    // --- 1. Authenticate: session token must resolve to an ACTIVE member ---
    if (!token) return json({ error: { message: "Not signed in." } }, 401);

    const member = await env.DB
      .prepare("SELECT member_id, status, expires_at, token_expires FROM members WHERE token = ? LIMIT 1")
      .bind(token)
      .first();

    if (!member) return json({ error: { message: "Session not recognised. Sign in again." } }, 401);

    // token freshness (issued tokens expire so a leaked one can't be used forever)
    if (member.token_expires && new Date(member.token_expires) < new Date()) {
      return json({ error: { message: "Session expired. Sign in again." } }, 401);
    }

    // subscription must be active and unexpired
    const active = member.status === "active" &&
      (!member.expires_at || new Date(member.expires_at) > new Date());
    if (!active) {
      return json({ error: { message: "Membership inactive. Renew to use ComplianceIQ." } }, 403);
    }

    // --- 2. Monthly run cap per member (protects your API spend) ---
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usageKey = `${member.member_id}:${month}`;
    const used = await env.DB
      .prepare("SELECT count FROM usage WHERE key = ? LIMIT 1")
      .bind(usageKey)
      .first();
    const count = used ? used.count : 0;
    if (count >= MONTHLY_LIMIT) {
      return json({
        error: {
          message: `You've used all ${MONTHLY_LIMIT} ComplianceIQ runs included this month. Buy more runs or upgrade to continue.`,
          code: "LIMIT_REACHED",
          used: count,
          limit: MONTHLY_LIMIT,
        },
      }, 429);
    }

    // --- 3. Validate payload BEFORE spending a call ---
    if (!fileBase64 || !mediaType || !system) {
      return json({ error: { message: "Missing file or prompt." } }, 400);
    }
    // basic size guard (base64 ~ 4.5 MB cap; tune as needed)
    if (fileBase64.length > 6_000_000) {
      return json({ error: { message: "File too large. Upload a single sheet, ideally under ~4 MB." } }, 413);
    }

    // --- 4. Proxy to Anthropic with the server-held key ---
    const block = isPdf
      ? { type: "document", source: { type: "base64", media_type: mediaType, data: fileBase64 } }
      : { type: "image",    source: { type: "base64", media_type: mediaType, data: fileBase64 } };

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{
          role: "user",
          content: [
            block,
            { type: "text", text: "Read this Saudi Aramco plot plan. Extract items, classify each to a B-055 row, capture only dimensioned distances as pairs, and raise context findings. Return only the JSON." },
          ],
        }],
      }),
    });

    const out = await upstream.text();

    // --- 5. Record usage ONLY on a successful upstream call, then report remaining ---
    if (upstream.ok) {
      await env.DB
        .prepare("INSERT INTO usage (key, count) VALUES (?, 1) ON CONFLICT(key) DO UPDATE SET count = count + 1")
        .bind(usageKey)
        .run();
      // attach usage so the page can show "runs left"
      try {
        const parsed = JSON.parse(out);
        parsed._usage = { used: count + 1, limit: MONTHLY_LIMIT, remaining: MONTHLY_LIMIT - (count + 1) };
        return json(parsed, 200);
      } catch (_) {
        // if upstream wasn't JSON, fall through to raw passthrough
      }
    }

    return new Response(out, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    // never leak the key or stack to the client
    return json({ error: { message: "Server error processing the request." } }, 500);
  }
}

// reject anything that isn't POST
export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  return onRequestPost(context);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
