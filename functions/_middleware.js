/**
 * functions/_middleware.js
 * PipingPro Academy — server-side tier gate (Cloudflare Pages Function)
 *
 * ⚠ STATUS: SERVER GATING IS CURRENTLY DISABLED (GATING_ENABLED = false).
 *
 * WHY DISABLED
 *   Memberstack DOM v2 stores the session token in localStorage, NOT in a
 *   cookie. This middleware can only read cookies (the browser never sends
 *   localStorage to the server). With no `_ms-mid` cookie present, every
 *   request — admin AND paying Student/Professional customers — resolved to
 *   FREE and got 302'd to /membership-plan, i.e. the gate turned away 100%
 *   of paying users. Verified: the Application → Cookies table for the
 *   domain is empty.
 *
 *   So gating now runs CLIENT-SIDE via the canonical Block A on each page
 *   (ppa-tier.js + getCurrentMember + resolveTier + hasAccess). That gate
 *   reads the real localStorage session and works. Anonymous SEO traffic
 *   and FREE pages are unaffected.
 *
 * TO RE-ENABLE SERVER-SIDE GATING (the proper long-term hardening)
 *   1. Make Memberstack issue a SERVER-READABLE cookie carrying the token
 *      (a Memberstack config/setup step, or a small client snippet that
 *      mirrors the localStorage token into a cookie). Confirm the cookie
 *      name against current Memberstack docs — it may not be `_ms-mid`.
 *   2. Set `_ms-mid` (or the real cookie name) in COOKIE_NAME below.
 *   3. Ensure Pages env secret MEMBERSTACK_SECRET_KEY is set and is the
 *      LIVE key (sk_live_…) on the production domain.
 *   4. Flip GATING_ENABLED = true and deploy.
 *   5. Test with a REAL paying member (not just admin) before trusting it.
 *
 *   The PLAN_TIER map below has been corrected to include the admin plan
 *   (it was missing — another reason the admin specifically was denied),
 *   so re-enabling is just the cookie work + the flag.
 */

// ── MASTER SWITCH ─────────────────────────────────────────────────────────
const GATING_ENABLED = false;   // ← false = pass everything through (client gate active)
const COOKIE_NAME     = '_ms-mid';

// ── CONFIG ──────────────────────────────────────────────────────────────
const PLAN_TIER = {
  'pln_student-plan-l416c0pbs': 'STUDENT',
  'pln_professional-n2is0jc4':  'PROFESSIONAL',
  'pln_admin-vzd0rgr':          'PROFESSIONAL', // ← admin → full access (mirrors ppa-tier.js v1.1)
};

const TIER_RANK       = { FREE: 0, STUDENT: 1, PROFESSIONAL: 2 };
const ACTIVE_STATUSES = new Set(['ACTIVE', 'TRIALING']);

const PROTECTED = [
  { path: '/calculators/basic/flange-valve-weight.html', minTier: 'STUDENT' }, // vw
  { path: '/calculators/basic/pipe-support-span.html',   minTier: 'STUDENT' }, // ps
  { path: '/calculators/basic/expansion-loop.html',      minTier: 'STUDENT' }, // el
  { path: '/calculators/basic/l-bend-stress.html',                  minTier: 'STUDENT' }, // lb
  { path: '/courses/piping-fundamentals/',        minTier: 'STUDENT' },
  { path: '/courses/static-stress/',              minTier: 'STUDENT' },
  { path: '/courses/pipeline-engineering/', minTier: 'STUDENT' },
  { path: '/courses/non-metallic-piping/',         minTier: 'STUDENT' },
  { path: '/calculators/basic/flexibility-screening.html',    minTier: 'PROFESSIONAL' }, // fx
  { path: '/calculators/advanced/stress-critical-line.html',       minTier: 'PROFESSIONAL' }, // scl
  { path: '/calculators/advanced/pipeline-crossing.html',        minTier: 'PROFESSIONAL' }, // pc
  { path: '/calculators/advanced/upheaval-buckling.html',        minTier: 'PROFESSIONAL' }, // ub
  { path: '/calculators/advanced/ductile-fracture.html',         minTier: 'PROFESSIONAL' }, // df
  { path: '/parked/subsea-pipeline-calculator.html',          minTier: 'PROFESSIONAL' }, // sp
  { path: '/calculators/advanced/flange-leakage.html',                minTier: 'PROFESSIONAL' }, // fl
  { path: '/parked/hydro-pneumo-test-pack.html',              minTier: 'PROFESSIONAL' }, // hp
  { path: '/calculators/advanced/nozzle-loads.html',                minTier: 'PROFESSIONAL' }, // nl
  { path: '/calculators/basic/pid-mto.html',                  minTier: 'PROFESSIONAL' }, // pm
  { path: '/calculators/advanced/special-pipe-support.html',     minTier: 'PROFESSIONAL' }, // ss
  { path: '/calculators/advanced/trunnion.html',                 minTier: 'PROFESSIONAL' }, // tr
  { path: '/calculators/advanced/vibration-fatigue.html',        minTier: 'PROFESSIONAL' }, // vf
  { path: '/calculators/basic/pipe-coating-insulation.html',  minTier: 'PROFESSIONAL' }, // ci
  { path: '/calculators/advanced/dia-inch-estimator.html',                 minTier: 'PROFESSIONAL' }, // di
  { path: '/calculators/basic/piping-estimation.html',               minTier: 'PROFESSIONAL' }, // pe
  { path: '/calculators/advanced/sectional-volume.html',         minTier: 'PROFESSIONAL' }, // sv
  { path: '/calculators/advanced/cathodic-protection.html',                minTier: 'PROFESSIONAL' }, // cp
];

const MS_BASE = 'https://admin.memberstack.com';

// ── HELPERS ─────────────────────────────────────────────────────────────
function normalize(pathname) {
  let p = pathname;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  if (p.endsWith('.html')) p = p.slice(0, -5);
  return p || '/';
}

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

async function fetchMember(token, secretKey) {
  const headers = { 'X-API-KEY': secretKey, 'Content-Type': 'application/json' };
  const v = await fetch(`${MS_BASE}/members/verify-token`, {
    method: 'POST', headers, body: JSON.stringify({ token }),
  });
  if (!v.ok) return null;
  const vData = await v.json();
  const memberId = vData?.data?.id;
  if (!memberId) return null;
  const m = await fetch(`${MS_BASE}/members/${memberId}`, { headers });
  if (!m.ok) return null;
  const mData = await m.json();
  return mData?.data ?? null;
}

function resolveTier(member) {
  let best = 'FREE';
  for (const c of member?.planConnections ?? []) {
    if (!ACTIVE_STATUSES.has(c.status)) continue;
    const t = PLAN_TIER[c.planId];
    if (t && TIER_RANK[t] > TIER_RANK[best]) best = t;
  }
  return best;
}

// ── ENTRY POINT ─────────────────────────────────────────────────────────
export async function onRequest(context) {
  const { request, env, next } = context;

  // Gating disabled → everything passes through; client Block A gates instead.
  if (!GATING_ENABLED) return next();

  const url = new URL(request.url);
  const reqPath = normalize(url.pathname);
  const rule = PROTECTED.find((r) => normalize(r.path) === reqPath);
  if (!rule) return next();

  const token = readCookie(request, COOKIE_NAME);
  let tier = 'FREE';
  if (token && env.MEMBERSTACK_SECRET_KEY) {
    try {
      const member = await fetchMember(token, env.MEMBERSTACK_SECRET_KEY);
      if (member) tier = resolveTier(member);
    } catch (_) {
      tier = 'FREE';
    }
  }

  if (TIER_RANK[tier] >= TIER_RANK[rule.minTier]) return next();

  const accept = request.headers.get('Accept') || '';
  const wantsJson =
    url.pathname.startsWith('/api/') ||
    accept.includes('application/json') ||
    request.headers.get('X-Requested-With') === 'fetch';

  if (wantsJson) {
    return new Response(
      JSON.stringify({ error: 'upgrade_required', requiredTier: rule.minTier }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return Response.redirect(
    `${url.origin}/membership-plan?gate=${rule.minTier.toLowerCase()}`,
    302
  );
}
