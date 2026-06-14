(function () {
  const WORKER = "https://ppa-visit-counter.donnybachtiar8.workers.dev";

  // --- Admin detection ---
  const params = new URLSearchParams(window.location.search);
  const isAdmin =
    params.get("admin") === "PPA-ADMIN-2026" ||
    localStorage.getItem("ppa_admin") === "1";

  // --- Normalise the page path into a stable key ---
  let page = window.location.pathname.replace(/\/index\.html$/, "/");
  if (page.length > 1) page = page.replace(/\/$/, ""); // strip trailing slash except root
  if (page === "") page = "/";

  // --- Per-PAGE, per-day dedup ---
  const today = new Date().toDateString();
  const dayKey = "ppa_visit_day:" + page;        // separate key per page
  const isNewVisitToday = localStorage.getItem(dayKey) !== today;

  // Admin never counts. Everyone else counts once per page per day.
  const shouldCount = !isAdmin && isNewVisitToday;
  const url = WORKER + "?page=" + encodeURIComponent(page);

  fetch(url, { method: shouldCount ? "POST" : "GET" })
    .then(r => r.json())
    .then(d => {
      if (shouldCount) localStorage.setItem(dayKey, today);
      if (!isAdmin) return;                         // display still admin-only
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
