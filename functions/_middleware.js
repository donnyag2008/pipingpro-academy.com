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
  { path: '/flange-valve-weight-calculator.html', minTier: 'STUDENT' }, // vw
  { path: '/pipe-support-span-calculator.html',   minTier: 'STUDENT' }, // ps
  { path: '/expansion-loop-calculator.html',      minTier: 'STUDENT' }, // el
  { path: '/l-bend-stress.html',                  minTier: 'STUDENT' }, // lb
  { path: '/course-piping-fundamentals.html',        minTier: 'STUDENT' },
  { path: '/course-static-stress.html',              minTier: 'STUDENT' },
  { path: '/Fundamental-of-Pipeline-Engineering.html', minTier: 'STUDENT' },
  { path: '/course-nonmetallic-piping.html',         minTier: 'STUDENT' },
  { path: '/flexibility-screening-calculator.html',    minTier: 'PROFESSIONAL' }, // fx
  { path: '/stress-critical-line-selector.html',       minTier: 'PROFESSIONAL' }, // scl
  { path: '/pipeline-crossing-calculator.html',        minTier: 'PROFESSIONAL' }, // pc
  { path: '/upheaval-buckling-calculator.html',        minTier: 'PROFESSIONAL' }, // ub
  { path: '/ductile-fracture-calculator.html',         minTier: 'PROFESSIONAL' }, // df
  { path: '/subsea-pipeline-calculator.html',          minTier: 'PROFESSIONAL' }, // sp
  { path: '/flange-leakage-check.html',                minTier: 'PROFESSIONAL' }, // fl
  { path: '/hydro-pneumo-test-pack.html',              minTier: 'PROFESSIONAL' }, // hp
  { path: '/nozzle-loads-checker.html',                minTier: 'PROFESSIONAL' }, // nl
  { path: '/pid-mto-calculator.html',                  minTier: 'PROFESSIONAL' }, // pm
  { path: '/special-pipe-support-calculator.html',     minTier: 'PROFESSIONAL' }, // ss
  { path: '/trunnion-calculator.html',                 minTier: 'PROFESSIONAL' }, // tr
  { path: '/vibration-fatigue-calculator.html',        minTier: 'PROFESSIONAL' }, // vf
  { path: '/pipe-coating-insulation-calculator.html',  minTier: 'PROFESSIONAL' }, // ci
  { path: '/dia-inch-calculator.html',                 minTier: 'PROFESSIONAL' }, // di
  { path: '/piping-work-estimator.html',               minTier: 'PROFESSIONAL' }, // pe
  { path: '/sectional-volume-calculator.html',         minTier: 'PROFESSIONAL' }, // sv
  { path: '/cp-design-calculator.html',                minTier: 'PROFESSIONAL' }, // cp
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
