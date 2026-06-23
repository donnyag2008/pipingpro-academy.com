/* ════════════════════════════════════════════════════════════════
   PipingPro Academy — Tier Resolver v1.0  (ppa-tier.js)
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
       <script src="/ppa-tier.js"></script>

   ⚠ VERIFY BEFORE PRODUCTION
   The planConnections field names below (planId / status) must match
   what your Memberstack version actually returns. Run
   `await window.$memberstackDom.getCurrentMember()` as a real
   Professional member and confirm before trusting this gate.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Memberstack plan IDs → tier name ─────────────────────────────
  var PLAN_TIER = {
    'pln_student-plan-l416c0pbs': 'student',
    'pln_professional-n2is0jc4' : 'professional'
  };

  var RANK = { free: 0, student: 1, professional: 2 };

  // ── Required tier per calculator id ──────────────────────────────
  // Anything NOT listed defaults to 'professional'.
  // Keep this list as the ONE place access policy lives.
  var CALC_TIER = {
    // Free — open to everyone, no login.
    // MUST match the FREE set in calculators.html. Keep both in sync.
    pw: 'free',
    wt: 'free',
    lb: 'free',
    uc: 'free',
    // Student tier (and above) — CONFIRM this list is what you intend.
    vw: 'student',
    ps: 'student',
    el: 'student'
    // everything else (fx, fl, pe, di, sv, ss, tr, pc, ub, df, sp, hp, nl, pm, vf, ci)
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
          // ⚠ field names to verify against your Memberstack response:
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

  // Expose
  window.PPATIER = window.PPATIER || {};
  window.PPATIER.PLAN_TIER    = PLAN_TIER;
  window.PPATIER.RANK         = RANK;
  window.PPATIER.CALC_TIER    = CALC_TIER;
  window.PPATIER.requiredTier = requiredTier;
  window.PPATIER.resolveTier  = resolveTier;
  window.PPATIER.memberTier   = memberTier;
  window.PPATIER.hasAccess    = hasAccess;
})();
