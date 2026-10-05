/* Data storage.
   LOCAL mode  : localStorage in this browser (no setup, single device).
   SHARED mode : Google Apps Script Web App backed by a Google Sheet.
   Records: { participant, timestamp, q1..q8 } with q values 1..7. */
(function () {
  const URL_ = (window.UEQ_CONFIG && window.UEQ_CONFIG.APPS_SCRIPT_URL || "").trim();
  const KEY = "ueqs_responses_v1";
  const mode = URL_ ? "shared" : "local";

  function readLocal() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
  }
  function writeLocal(rows) { localStorage.setItem(KEY, JSON.stringify(rows)); }

  function clean(rows) {
    return (rows || []).map(r => {
      const o = { participant: Number(r.participant), timestamp: r.timestamp || "" };
      for (let i = 1; i <= 8; i++) o["q" + i] = Number(r["q" + i]);
      return o;
    }).filter(r => r.participant > 0)
      .sort((a, b) => a.participant - b.participant);
  }

  async function post(payload) {
    // text/plain body keeps this a "simple" CORS request (no preflight), which Apps Script requires
    const res = await fetch(URL_, { method: "POST", body: JSON.stringify(payload) });
    if (!res.ok) throw new Error("Server responded " + res.status);
    const data = await res.json();
    if (data.status === "error") throw new Error(data.message || "Server error");
    return data;
  }

  const Store = {
    mode,
    async list() {
      if (mode === "local") return clean(readLocal());
      const res = await fetch(URL_ + "?action=list&t=" + Date.now());
      if (!res.ok) throw new Error("Server responded " + res.status);
      const data = await res.json();
      if (data.status !== "ok") throw new Error(data.message || "Could not load data");
      return clean(data.rows);
    },
    // returns { status: "ok" } or { status: "exists" } when overwrite is false and the number is taken
    async submit(record, overwrite) {
      record = Object.assign({}, record, { timestamp: new Date().toISOString() });
      if (mode === "shared") return post({ action: "submit", record, overwrite: !!overwrite });
      const rows = readLocal();
      const i = rows.findIndex(r => Number(r.participant) === Number(record.participant));
      if (i >= 0 && !overwrite) return { status: "exists" };
      if (i >= 0) rows[i] = record; else rows.push(record);
      writeLocal(rows);
      return { status: "ok" };
    },
    async deleteAll() {
      if (mode === "shared") return post({ action: "deleteAll" });
      writeLocal([]);
      return { status: "ok" };
    },
    async addMany(records) {
      for (const r of records) await Store.submit(r, true);
    }
  };
  window.Store = Store;
})();

/* Shared page helpers: header nav highlight + mode badge */
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  document.querySelectorAll(".nav a").forEach(a => {
    if (a.dataset.page === page) a.setAttribute("aria-current", "page");
  });
  const t = document.querySelector("[data-course]");
  if (t && window.UEQ_CONFIG) t.textContent = window.UEQ_CONFIG.COURSE_TITLE;
  const badge = document.querySelector("[data-mode]");
  if (badge) {
    const shared = window.Store.mode === "shared";
    badge.textContent = shared ? "Shared mode · Google Sheet" : "Local mode · this browser only";
    badge.className = "mode-badge " + (shared ? "is-shared" : "is-local");
    badge.title = shared
      ? "Responses from every device are stored in one Google Sheet."
      : "Responses are stored only in this browser. Set APPS_SCRIPT_URL in js/config.js to collect from many devices.";
  }
});
