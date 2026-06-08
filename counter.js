(function () {
  const WORKER = "https://ppa-visit-counter.donnybachtiar8.workers.dev";
  const today = new Date().toDateString();
  const isNewVisitToday = localStorage.getItem("ppa_visit_day") !== today;

  fetch(WORKER, { method: isNewVisitToday ? "POST" : "GET" })
    .then(r => r.json())
    .then(d => {
      const el = document.getElementById("visit-count");
      if (el) el.textContent = d.count.toLocaleString();
      if (isNewVisitToday) localStorage.setItem("ppa_visit_day", today);
    })
    .catch(() => {
      const el = document.getElementById("visit-count");
      if (el) el.textContent = "—";
    });
})();
