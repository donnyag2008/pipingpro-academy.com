(function () {
  const WORKER = "https://ppa-visit-counter.donnybachtiar8.workers.dev";

  const params = new URLSearchParams(window.location.search);
  const isAdmin =
    params.get("admin") === "PPA-ADMIN-2026" ||
    localStorage.getItem("ppa_admin") === "PPA-ADMIN-2026";

  const today = new Date().toDateString();
  const isNewVisitToday = localStorage.getItem("ppa_visit_day") !== today;

  // Count the visit for everyone (real number keeps growing)
  fetch(WORKER, { method: isNewVisitToday ? "POST" : "GET" })
    .then(r => r.json())
    .then(d => {
      if (isNewVisitToday) localStorage.setItem("ppa_visit_day", today);

      // Only admins get a counter element at all
      if (!isAdmin) return;

      const footer = document.querySelector("footer");
      if (!footer) return;

      const p = document.createElement("p");
      p.style.cssText =
        "text-align:center; font-family:'DM Sans', sans-serif; color:#6b5d4f; font-size:0.9rem; margin-top:0.4rem;";
      p.textContent = "👁️ " + d.count.toLocaleString() + " visitors";
      footer.appendChild(p);
    })
    .catch(() => {}); // silent fail — nothing shows
})();
