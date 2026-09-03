/* ════════════════════════════════════════════════════════════════
   PipingPro Academy — Tier Resolver v1.1  (ppa-tier.js)
   ────────────────────────────────────────────────────────────────
   Single source of truth for "which plan does this member hold" and
   "is this member allowed to open calculator X."

   Replaces the old binary ppa_member='1' boolean with a real tier
   resolved from Memberstack planConnections.

   Tiers are cumulative:  free ⊂ student ⊂ professional
   Access rule:           memberTier >= requiredTier(calcId)

   LOAD ORDER
   Include this BEFORE ppa-report-gate.js and before the page's own
   gate logic, on calculators.html AND every individual calc page:
       <script src="/js/ppa-tier.js"></script>

   v1.1 — Admin plan (pln_admin-vzd0rgr) now maps to 'professional',
          so an admin member is granted full access everywhere through
          the normal tier path (no per-page admin hacks needed).
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Memberstack plan IDs → tier name ─────────────────────────────
  // Admin is just a member on the free Admin plan; mapping it to
  // 'professional' grants access to every calculator via hasAccess().
  var PLAN_TIER = {
    'pln_student-plan-l416c0pbs': 'student',
    'pln_professional-n2is0jc4' : 'professional',
    'pln_professional-bca-is6m0fay': 'professional',   // ← BCA manual payment plan
     'pln_student-bca-8mga0fjm': 'student',   // ← BCA manual payment plan
    'pln_admin-vzd0rgr'         : 'professional'   // ← Admin plan → full access
  };

  var RANK = { free: 0, student: 1, professional: 2 };

  // ── Required tier per calculator id ──────────────────────────────
  // Anything NOT listed defaults to 'professional'.
  // Keep this list as the ONE place access policy lives.
  var CALC_TIER = {
    
      // Student tier (and above)
    pw: 'student',
    wt: 'student',
    uc: 'student',
    md: 'student',
    vw: 'student',
    ps: 'student',
    el: 'student',
    lb: 'student',
    mc: 'student',
    sv: 'student',
    bp: 'student'
    // everything else (fx, scl, fl, pe, di, ss, tr, pc, ub, df, sp, hp, nl, pm, vf, ci, cp, im)
    // → professional (the default for anything not listed)
  };

  function requiredTier(id) {
    return CALC_TIER[id] || 'professional';
  }

  // ── Resolve member tier from Memberstack (authoritative) & cache ──
  // Call on login and on every page load. Async — reads the live plan.
  async function resolveTier() {
    if (localStorage.getItem('ppa_admin') === '1') {
      localStorage.setItem('ppa_tier', 'professional');
      return 'professional';
    }
    try {
      var ms = window.$memberstackDom;
      if (ms && ms.getCurrentMember) {
        var res   = await ms.getCurrentMember();
        var conns = (res && res.data && res.data.planConnections) || [];
        var best  = 'free';
        conns.forEach(function (c) {
          var active = c.active === true
                    || c.status === 'ACTIVE'
                    || c.status === 'TRIALING';        // trial users MUST pass
          var t = PLAN_TIER[c.planId];
          if (active && t && RANK[t] > RANK[best]) best = t;
        });
        localStorage.setItem('ppa_tier', best);
        return best;
      }
    } catch (e) { /* MS not ready / not logged in — fall through */ }
    return localStorage.getItem('ppa_tier') || 'free';
  }

  // ── Synchronous read of cached tier (for instant UI gating) ──────
  function memberTier() {
    if (localStorage.getItem('ppa_admin') === '1') return 'professional';
    return localStorage.getItem('ppa_tier') || 'free';
  }

  // ── The access test every gate calls ─────────────────────────────
  function hasAccess(id) {
    return RANK[memberTier()] >= RANK[requiredTier(id)];
  }

  // ── Shared member state (replaces per-page MS_* globals) ───────
  // Every page that needs login awareness now calls PPATIER.msLoadMember()
  // instead of maintaining its own copy.  Plan IDs are resolved via the
  // PLAN_TIER map above — add a new payment method there and every page
  // picks it up automatically.

  window.MS_MEMBER   = null;
  window.MS_PLAN     = null;   // 'professional' | 'student' | null
  window.MS_IS_ADMIN = false;
  window.MS_READY    = false;

  var ADMIN_PLAN_ID = 'pln_admin-vzd0rgr';

  // ── Wait for Memberstack SDK to load ─────────────────────────
  // The external MS script loads async; DOMContentLoaded often fires
  // before it's ready.  This polls until $memberstackDom appears
  // (up to 5 seconds), eliminating the "must refresh" problem.
  async function waitForMemberstack(maxWait) {
    maxWait = maxWait || 5000;
    var start = Date.now();
    while (!window.$memberstackDom && (Date.now() - start) < maxWait) {
      await new Promise(function (r) { setTimeout(r, 100); });
    }
    return window.$memberstackDom || null;
  }

  async function msLoadMember() {
    try {
      var ms = await waitForMemberstack();
      if (ms && ms.getCurrentMember) {
        var res    = await ms.getCurrentMember();
        var member = (res && res.data) ? res.data : (res || null);
        window.MS_MEMBER   = member;
        window.MS_PLAN     = null;
        window.MS_IS_ADMIN = false;
        if (member && Array.isArray(member.planConnections)) {
          var active = member.planConnections.filter(function (p) {
            return p.active || p.status === 'ACTIVE' || p.status === 'TRIALING';
          });
          var best = 'free';
          active.forEach(function (c) {
            var t = PLAN_TIER[c.planId];
            if (t && RANK[t] > RANK[best]) best = t;
          });
          if (best !== 'free') window.MS_PLAN = best;
          window.MS_IS_ADMIN = active.some(function (c) {
            return c.planId === ADMIN_PLAN_ID;
          });
        }
      }
    } catch (e) { console.warn('Memberstack load error', e); }
    finally { window.MS_READY = true; }
    // Only sync the localStorage tier cache when Memberstack actually
    // responded — otherwise preserve the cached tier from a previous
    // successful load so cross-page navigation stays logged in.
    if (window.MS_MEMBER !== null) {
      localStorage.setItem('ppa_tier', window.MS_PLAN || 'free');
    }
    return window.MS_PLAN;
  }

  function isMember() {
    if (localStorage.getItem('ppa_admin') === '1') return true;
    if (window.MS_PLAN === 'professional' || window.MS_PLAN === 'student') return true;
    // Fallback: cached tier from previous page (instant, no async wait)
    var cached = localStorage.getItem('ppa_tier');
    return cached === 'professional' || cached === 'student';
  }

  function memberPlan() {
    return window.MS_PLAN || localStorage.getItem('ppa_tier') || null;
  }

  // Expose
  window.PPATIER = window.PPATIER || {};
  window.PPATIER.PLAN_TIER     = PLAN_TIER;
  window.PPATIER.RANK          = RANK;
  window.PPATIER.CALC_TIER     = CALC_TIER;
  window.PPATIER.requiredTier  = requiredTier;
  window.PPATIER.resolveTier   = resolveTier;
  window.PPATIER.memberTier    = memberTier;
  window.PPATIER.hasAccess     = hasAccess;
  window.PPATIER.msLoadMember  = msLoadMember;
  window.PPATIER.isMember      = isMember;
  window.PPATIER.memberPlan    = memberPlan;

  // Also expose as globals for pages that call them directly
  window.waitForMemberstack = waitForMemberstack;
  window.msLoadMember = msLoadMember;
  window.isMember     = isMember;
  window.memberPlan   = memberPlan;
})();
