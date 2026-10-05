(function () {
  const f = (v, d) => UEQ.fmt(v, d);
  const table = document.getElementById("sheet");
  const errEl = document.getElementById("err");
  let rows = [], scored = false, lastKey = "";

  function fmtTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return isNaN(d) ? String(ts) : d.toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  function render() {
    const head = `<thead><tr><th class="rowhead">#</th><th>Participant</th><th>Submitted</th>` +
      UEQ.ITEMS.map((it, i) => `<th title="${it.left} – ${it.right}">Q${i + 1}<span class="sub">${it.left} – ${it.right}</span></th>`).join("") +
      `<th style="color:var(--s-pq)">PQ<span class="sub">pragmatic</span></th><th style="color:var(--s-hq)">HQ<span class="sub">hedonic</span></th><th style="color:var(--s-ov)">Overall</th><th>Check</th></tr></thead>`;
    if (!rows.length) {
      table.innerHTML = head + `<tbody><tr><td colspan="${UEQ.ITEMS.length + 7}" style="padding:32px;color:var(--text-2)">No responses yet.</td></tr></tbody>`;
      return;
    }
    const body = rows.map((r, i) => {
      const s = UEQ.scoresFor(r), fl = UEQ.inconsistency(r);
      const cells = UEQ.ITEMS.map(it => {
        const v = r[it.id];
        const bad = fl.includes(it.scale);
        return `<td${bad ? ' class="flag"' : ""}>${scored ? f(UEQ.t(v), 0) : v}</td>`;
      }).join("");
      const chk = fl.length === 2 ? `<span style="color:var(--danger)">⚑ suspicious</span>` : fl.length ? `<span style="color:var(--danger)">⚑ ${fl.join(" ")}</span>` : "✓";
      return `<tr><td class="rowhead">${i + 1}</td><td><b>${r.participant}</b></td><td>${fmtTime(r.timestamp)}</td>${cells}
        <td class="score">${f(s.PQ)}</td><td class="score">${f(s.HQ)}</td><td class="score">${f(s.OV)}</td><td>${chk}</td></tr>`;
    }).join("");
    const meanCell = arr => f(UEQ.mean(arr));
    const foot = `<tfoot><tr><td class="rowhead"></td><td>Mean</td><td>n = ${rows.length}</td>` +
      UEQ.ITEMS.map(it => `<td>${scored ? meanCell(rows.map(r => UEQ.t(r[it.id]))) : meanCell(rows.map(r => r[it.id]))}</td>`).join("") +
      ["PQ", "HQ", "OV"].map(k => `<td>${meanCell(rows.map(r => UEQ.scoresFor(r)[k]))}</td>`).join("") + `<td></td></tr>
      <tr><td class="rowhead"></td><td>SD</td><td></td>` +
      UEQ.ITEMS.map(it => `<td>${f(UEQ.sd(rows.map(r => r[it.id])))}</td>`).join("") +
      ["PQ", "HQ", "OV"].map(k => `<td>${f(UEQ.sd(rows.map(r => UEQ.scoresFor(r)[k])))}</td>`).join("") + `<td></td></tr></tfoot>`;
    table.innerHTML = head + `<tbody>${body}</tbody>` + foot;
  }

  async function load(force) {
    try {
      const data = await Store.list();
      errEl.innerHTML = "";
      document.getElementById("updated").textContent = `${data.length} ${data.length === 1 ? "response" : "responses"} · updated ${new Date().toLocaleTimeString()}`;
      const key = JSON.stringify(data);
      if (key !== lastKey || force) { rows = data; lastKey = key; render(); }
    } catch (e) {
      errEl.innerHTML = `<div class="msg error">Could not load the data: ${e.message}</div>`;
    }
  }

  // raw / scored toggle
  const bRaw = document.getElementById("vRaw"), bT = document.getElementById("vT");
  function setMode(s) { scored = s; bRaw.setAttribute("aria-pressed", !s); bT.setAttribute("aria-pressed", s); render(); }
  bRaw.onclick = () => setMode(false);
  bT.onclick = () => setMode(true);

  // CSV
  document.getElementById("csvBtn").onclick = () => {
    const hdr = ["participant", "timestamp", ...UEQ.ITEMS.map((it, i) => `Q${i + 1} ${it.left}-${it.right} (1-7)`),
      ...UEQ.ITEMS.map((it, i) => `Q${i + 1} scored (-3..+3)`), "PQ", "HQ", "Overall", "inconsistent_scales"];
    const lines = [hdr, ...rows.map(r => {
      const s = UEQ.scoresFor(r);
      return [r.participant, r.timestamp, ...UEQ.ITEMS.map(it => r[it.id]), ...UEQ.ITEMS.map(it => UEQ.t(r[it.id])),
        s.PQ.toFixed(3), s.HQ.toFixed(3), s.OV.toFixed(3), UEQ.inconsistency(r).join(" ")];
    })].map(a => a.map(v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(","));
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    const d = new Date(), pad = n => String(n).padStart(2, "0");
    a.href = URL.createObjectURL(blob);
    a.download = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-ueqs-responses.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  // delete all
  const modal = document.getElementById("delModal");
  const delBtn = document.getElementById("delConfirm");
  document.getElementById("deleteBtn").onclick = () => {
    document.getElementById("delCount").textContent = rows.length;
    modal.classList.add("open");
    document.getElementById("delCancel").focus();
  };
  function close() { modal.classList.remove("open"); }
  document.getElementById("delCancel").onclick = close;
  modal.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
  delBtn.onclick = async () => {
    delBtn.disabled = true; delBtn.textContent = "Deleting…";
    try { await Store.deleteAll(); close(); await load(true); }
    catch (e) { errEl.innerHTML = `<div class="msg error">Could not delete the data: ${e.message}</div>`; close(); }
    finally { delBtn.disabled = false; delBtn.textContent = "Yes, delete everything"; }
  };

  // demo data: 15 plausible game ratings (participants 101+ so they never clash with real numbers)
  document.getElementById("demoBtn").onclick = async () => {
    const btn = document.getElementById("demoBtn");
    btn.disabled = true; btn.textContent = "Adding…";
    const clamp = v => Math.max(1, Math.min(7, Math.round(v)));
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const recs = [];
    for (let p = 1; p <= 15; p++) {
      const pq = 4.9 + (rnd() - 0.5) * 2.6, hq = 5.6 + (rnd() - 0.5) * 2.2;
      const r = { participant: 100 + p };
      ["q1", "q2", "q3", "q4"].forEach(id => r[id] = clamp(pq + (rnd() - 0.5) * 2.2));
      ["q5", "q6", "q7", "q8"].forEach(id => r[id] = clamp(hq + (rnd() - 0.5) * 2.2));
      recs.push(r);
    }
    recs[14] = { participant: 115, q1: 7, q2: 1, q3: 6, q4: 2, q5: 1, q6: 7, q7: 2, q8: 6 }; // a careless pattern
    try { await Store.addMany(recs); await load(true); }
    catch (e) { errEl.innerHTML = `<div class="msg error">Could not add demo data: ${e.message}</div>`; }
    finally { btn.disabled = false; btn.textContent = "Add demo data (for testing)"; }
  };

  document.getElementById("refreshBtn").onclick = () => load(true);
  load(true);
  const sec = window.UEQ_CONFIG.AUTO_REFRESH_SECONDS;
  if (sec > 0) setInterval(() => { if (!document.hidden && !modal.classList.contains("open")) load(false); }, sec * 1000);
})();
