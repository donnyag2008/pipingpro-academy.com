// ============================================================================
// functions/api/session.js
// Cloudflare Pages Function — auto-serves at  /api/session
//
// The ONE place member identity is established. Flow:
//   1. Client sends the member's Memberstack JWT (from $memberstackDom).
//   2. We verify the JWT with Memberstack's Admin API (secret key, server-side).
//      A client cannot forge a valid JWT, so this proves who they are.
//   3. We fetch the member and confirm an ACTIVE plan.
//   4. We mint a short-lived random session token into D1 that the proxy
//      (/api/complianceiq) trusts. Verifying once here avoids hitting
//      Memberstack's 25 req/s Admin API limit on every run.
//
// Verified against Memberstack Admin REST API docs (developers.memberstack.com),
// June 2025: POST /members/verify-token  and  GET /members/{id}.
//
// Bindings:
//   - Secret:  MEMBERSTACK_SECRET_KEY   (sk_live_... in production)
//   - D1:      DB
// Optional:
//   - Var:     REQUIRED_PLAN_ID         (gate to a specific plan; omit to accept any active plan)
// ============================================================================

const MS_BASE = "https://admin.memberstack.com";
const TOKEN_TTL_HOURS = 12;

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { msToken } = await request.json();
    if (!msToken) return json({ error: { message: "Missing member token." } }, 400);

    const headers = { "X-API-KEY": env.MEMBERSTACK_SECRET_KEY, "Content-Type": "application/json" };

    // --- 1. Verify the JWT (proves identity; client cannot forge this) ---
    const vRes = await fetch(`${MS_BASE}/members/verify-token`, {
      method: "POST",
      headers,
      body: JSON.stringify({ token: msToken }),
    });
    if (!vRes.ok) return json({ error: { message: "Could not verify membership." } }, 401);
    const vData = (await vRes.json()).data;
    const memberId = vData && vData.id;
    if (!memberId) return json({ error: { message: "Invalid member token." } }, 401);

    // belt-and-braces: reject an already-expired JWT
    if (vData.exp && vData.exp < Math.floor(Date.now() / 1000)) {
      return json({ error: { message: "Session expired. Sign in again." } }, 401);
    }

    // --- 2. Fetch the member and confirm an ACTIVE plan ---
    const mRes = await fetch(`${MS_BASE}/members/${encodeURIComponent(memberId)}`, {
      headers: { "X-API-KEY": env.MEMBERSTACK_SECRET_KEY },
    });
    if (!mRes.ok) return json({ error: { message: "Could not load membership." } }, 401);
    const member = (await mRes.json()).data || {};
    const plans = member.planConnections || [];
    const requiredPlan = env.REQUIRED_PLAN_ID; // optional
    const active = plans.some(p =>
      p.status === "ACTIVE" && (!requiredPlan || p.planId === requiredPlan)
    );
    if (!active) {
      return json({ error: { message: "No active membership found. Renew to use ComplianceIQ." } }, 403);
    }

    // --- 3. Mint a session token into D1 for the proxy to trust ---
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    const tokenExpires = new Date(Date.now() + TOKEN_TTL_HOURS * 3600 * 1000).toISOString();
    const email = (member.auth && member.auth.email) || member.email || "";

    await env.DB.prepare(
      `INSERT INTO members (member_id, email, status, token, token_expires, updated_at)
       VALUES (?, ?, 'active', ?, ?, datetime('now'))
       ON CONFLICT(member_id) DO UPDATE SET
         status='active', email=excluded.email, token=excluded.token,
         token_expires=excluded.token_expires, updated_at=datetime('now')`
    ).bind(memberId, email, token, tokenExpires).run();

    return json({ token, expires: tokenExpires });
  } catch (e) {
    return json({ error: { message: "Session error." } }, 500);
  }
}

export async function onRequest(context) {
  if (context.request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  return onRequestPost(context);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
