/**
 * functions/_middleware.js
 * PipingPro Academy — server-side tier gate (Cloudflare Pages Function)
 *
 * WHY THIS EXISTS
 *   The old gate trusted a client-side localStorage flag (ppa_member='1'),
 *   so any logged-in account on ANY tier got full access. This moves the
 *   decision server-side: the browser can lie, this can't.
 *
 * HOW IT WORKS
 *   1. Only paths in PROTECTED are intercepted. Everything else — anonymous
 *      SEO traffic, FREE calculators, the free Module-1 course preview,
 *      index/guides/pricing — passes straight through untouched. This is
 *      why we do NOT use Cloudflare Access: it would wall the whole site.
 *   2. For a protected path, read the Memberstack JWT from the _ms-mid
 *      cookie, verify it (proves it's real + unexpired), then fetch the
 *      live member to read planConnections. Grant only if tier >= minTier.
 *   3. A card-required trial reports status TRIALING, counted as entitled
 *      alongside ACTIVE — that's the trial gate working.
 *
 * SETUP
 *   - File path:  functions/_middleware.js   (repo root /functions)
 *   - Pages env secret: MEMBERSTACK_SECRET_KEY
 *       sk_sb_...   for the first test loop (card 4242, no real charge)
 *       sk_live_... for production cutover
 *   - Plan IDs below confirmed against ppa-tier.js (student + professional).
 *
 * REPORT GATING
 *   The PDF report is generated CLIENT-SIDE (jsPDF / browser print) — there
 *   is no server endpoint to gate. It's covered indirectly: a non-member
 *   never receives the calculator PAGE, so there's no page from which to
 *   produce a report. ppa-report-gate.js stays as belt-and-suspenders.
 */

// ── CONFIG ──────────────────────────────────────────────────────────────

const PLAN_TIER = {
  'pln_student-plan-l416c0pbs': 'STUDENT',
  'pln_professional-n2is0jc4':  'PROFESSIONAL', // trial prices live under this plan
};

const TIER_RANK      = { FREE: 0, STUDENT: 1, PROFESSIONAL: 2 };
const ACTIVE_STATUSES = new Set(['ACTIVE', 'TRIALING']); // TRIALING = trial working

// Protected pages. Each rule is an EXACT pathname (no prefix shadowing).
// minTier = the LOWEST tier allowed in. Anything not listed is public.
// Mirror this against CALC_TIER in ppa-tier.js whenever policy changes.
const PROTECTED = [
  // ── STUDENT-and-up calculators (vw / ps / el / lb) ──
  { path: '/flange-valve-weight-calculator.html', minTier: 'STUDENT' }, // vw
  { path: '/pipe-support-span-calculator.html',   minTier: 'STUDENT' }, // ps
  { path: '/expansion-loop-calculator.html',      minTier: 'STUDENT' }, // el
  { path: '/l-bend-stress.html',                  minTier: 'STUDENT' }, // lb

  // ── STUDENT-and-up course content (paid modules) ──
  // Free preview piping-fundamentals-module-1.html is NOT listed → stays public.
  { path: '/course-piping-fundamentals.html',        minTier: 'STUDENT' },
  { path: '/course-static-stress.html',              minTier: 'STUDENT' },
  { path: '/Fundamental-of-Pipeline-Engineering.html', minTier: 'STUDENT' }, // note caps
  { path: '/course-nonmetallic-piping.html',         minTier: 'STUDENT' },

  // ── PROFESSIONAL-only calculators (everything not FREE or STUDENT) ──
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
  { path: '/sectional-volume-calculator.html',         minTier: 'PROFESSIONAL' }, // sv  ⚠ "free" label is stale; gate follows CALC_TIER default
  { path: '/cp-design-calculator.html',                minTier: 'PROFESSIONAL' }, // cp  ⚠ confirm still live; guide page may be STUDENT instead
];

const MS_BASE = 'https://admin.memberstack.com';

// ── HELPERS ─────────────────────────────────────────────────────────────

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

// Verify JWT, then fetch the live member (verify-token does NOT return plans).
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
  const url = new URL(request.url);

  const rule = PROTECTED.find((r) => url.pathname === r.path);
  if (!rule) return next(); // public path → straight through

  const token = readCookie(request, '_ms-mid');
  let tier = 'FREE';
  if (token && env.MEMBERSTACK_SECRET_KEY) {
    try {
      const member = await fetchMember(token, env.MEMBERSTACK_SECRET_KEY);
      if (member) tier = resolveTier(member);
    } catch (_) {
      tier = 'FREE'; // fail CLOSED on a protected path
    }
  }

  if (TIER_RANK[tier] >= TIER_RANK[rule.minTier]) return next();

  // Deny: 403 JSON for fetch/API, 302 to pricing for page navigations.
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
    `${url.origin}/membership-plan.html?gate=${rule.minTier.toLowerCase()}`,
    302
  );
}
