// functions/_lib/auth.js
//
// Shared helper for verifying a Memberstack member on incoming requests.
// This mirrors the pattern your existing tier-gating middleware already uses —
// swap the body of verifyMember() for your real Memberstack Admin API call
// and tier-resolution logic (ppa-tier.js) if the logic differs from this stub.

const PROJECT_LIMITS = {
  free: { maxProjects: 0, maxCalcsPerProject: 0 },
  student: { maxProjects: 1, maxCalcsPerProject: 10 },
  professional: { maxProjects: Infinity, maxCalcsPerProject: Infinity },
  admin: { maxProjects: Infinity, maxCalcsPerProject: Infinity },
};

/**
 * Verifies the Memberstack token sent from the client and resolves
 * the member's id + plan tier.
 *
 * Expects the client to send: Authorization: Bearer <memberstack-token>
 *
 * @param {Request} request
 * @param {object} env - Cloudflare env bindings (must include MEMBERSTACK_SECRET_KEY)
 * @returns {Promise<{memberId: string, tier: string} | null>}
 */
export async function verifyMember(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  // TODO: replace with your actual Memberstack Admin API verification call,
  // matching whatever your existing Pages Function tier-gating middleware does.
  // Example shape (adjust endpoint/response parsing to match Memberstack's API):
  //
  // const res = await fetch(`https://admin.memberstack.com/members/${token}`, {
  //   headers: { "X-API-KEY": env.MEMBERSTACK_SECRET_KEY }
  // });
  // if (!res.ok) return null;
  // const data = await res.json();
  // const memberId = data.data.id;
  // const planId = data.data.planConnections?.[0]?.planId;
  // const tier = resolveTierFromPlanId(planId); // reuse ppa-tier.js logic

  throw new Error(
    "verifyMember() is a stub — wire this up to your existing Memberstack verification logic (same pattern as your tier-gating Pages Function middleware)."
  );
}

export function limitsForTier(tier) {
  return PROJECT_LIMITS[tier] || PROJECT_LIMITS.free;
}
