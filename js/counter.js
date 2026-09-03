(function () {
  const WORKER = "https://ppa-visit-counter.donnybachtiar8.workers.dev";

  // --- Admin detection ---
  const params = new URLSearchParams(window.location.search);
  const isAdmin =
    params.get("admin") === "PPA-ADMIN-2026" ||
    localStorage.getItem("ppa_admin") === "1";

  // --- Normalise the page path into a stable key ---
  let page = window.location.pathname.replace(/\/index\.html$/, "/");
  if (page.length > 1) page = page.replace(/\/$/, "");
  if (page === "") page = "/";

  // --- Per-PAGE, per-day dedup ---
  const today = new Date().toDateString();
  const dayKey = "ppa_visit_day:" + page;
  const isNewVisitToday = localStorage.getItem(dayKey) !== today;
  const shouldCount = !isAdmin && isNewVisitToday;
  const url = WORKER + "?page=" + encodeURIComponent(page);

  // --- Resolve login state via Memberstack's load event (no polling) ---
  function loggedIn() {
    if (isAdmin) return Promise.resolve(true);    // admin always sees it

    return new Promise((resolve) => {
      let settled = false;
      const done = (v) => { if (!settled) { settled = true; resolve(v); } };

      const ask = (ms) => {
        if (!ms || typeof ms.getCurrentMember !== "function") return done(false);
        ms.getCurrentMember()
          .then(({ data }) => done(!!data))
          .catch(() => done(false));
      };

      // Already loaded?
      if (window.$memberstackDom) return ask(window.$memberstackDom);

      // Otherwise wait for the Memberstack script to finish loading
      const s = document.querySelector(
        'script[data-memberstack-app], script[src*="memberstack"]'
      );
      if (s) {
        s.addEventListener("load", () => ask(window.$memberstackDom));
        s.addEventListener("error", () => done(false));
      }

      // Safety net: if Memberstack never resolves, don't hang forever
      setTimeout(() => ask(window.$memberstackDom), 3000);
    });
  }

  Promise.all([
    fetch(url, { method: shouldCount ? "POST" : "GET" }).then(r => r.json()),
    loggedIn()
  ])
    .then(([d, show]) => {
      if (shouldCount) localStorage.setItem(dayKey, today);
      if (!show) return;                           // admin + any logged-in member
      const footer = document.querySelector("footer");
      if (!footer) return;
      const p = document.createElement("p");
      p.style.cssText =
        "text-align:center; font-family:'DM Sans', sans-serif; color:#6b5d4f; font-size:0.9rem; margin-top:0.4rem;";
      p.textContent =
        "👁️ " + d.count.toLocaleString() + " on this page" +
        (d.total != null ? " · " + d.total.toLocaleString() + " site-wide" : "");
      footer.appendChild(p);
    })
    .catch(() => {});
})();
