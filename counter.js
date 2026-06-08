(function () {
  const WORKER = "https://ppa-visit-counter.donnybachtiar8.workers.dev";

  // Only show the counter for admin (via ?admin=PPA-ADMIN-2026 or stored admin key)
  const params = new URLSearchParams(window.location.search);
  const isAdmin =
    params.get("admin") === "PPA-ADMIN-2026" ||
    localStorage.getItem("ppa_admin") === "PPA-ADMIN-2026";

  const el = document.getElementById("visit-count");
  const wrap = document.getElementById("visit-counter-wrap");

  const today = new Date().toDateString();
  const isNewVisitToday = localStorage.getItem("ppa_visit_day") !== today;

  // Always count the visit (so the real number keeps growing)...
  fetch(WORKER, { method: isNewVisitToday ? "POST" : "GET" })
    .then(r => r.json())
    .then(d => {
      if (isNewVisitToday) localStorage.setItem("ppa_visit_day", today);
      // ...but only DISPLAY it to admin
      if (isAdmin) {
        if (el) el.textContent = d.count.toLocaleString();
        if (wrap) wrap.style.display = "";
      }
    })
    .catch(() => {
      if (isAdmin && el) el.textContent = "—";
    });

  // Hide the counter line entirely for non-admins
  if (!isAdmin && wrap) wrap.style.display = "none";
})();
