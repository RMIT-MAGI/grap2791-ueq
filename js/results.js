(function () {
  const f = (v, d) => UEQ.fmt(v, d);
  const COLORS = { PQ: "var(--s-pq)", HQ: "var(--s-hq)", OV: "var(--s-ov)" };
  const content = document.getElementById("content");
  const errEl = document.getElementById("err");
  const excl = document.getElementById("excludeSusp");
  let rows = [], lastKey = "";

  function plural(n, a, b) { return n === 1 ? a : b; }
  function list(ids) { return ids.map(i => "P" + i).join(", "); }

  function interpretScale(key, pts, allRows) {
    const S = UEQ.SCALES[key];
    const d = UEQ.describe(pts.map(p => p.value));
    const out = [];

    // 1. distribution
    let p1 = `${d.n} ${plural(d.n, "participant", "participants")} contributed to this score. The median is <b>${f(d.median)}</b>: half of the class scored the game at or above this value and half at or below. `;
    if (d.n >= 4) p1 += `The middle 50% of scores (the box) lies between ${f(d.q1)} and ${f(d.q3)}, an interquartile range of ${f(d.iqr)}. `;
    p1 += `Individual scores range from ${f(d.min)} to ${f(d.max)}.`;
    if (d.outliers.length) {
      const lowIds = pts.filter(p => p.value < d.q1 - 1.5 * d.iqr).map(p => p.id);
      const highIds = pts.filter(p => p.value > d.q3 + 1.5 * d.iqr).map(p => p.id);
      if (lowIds.length) p1 += ` ${list(lowIds)} gave ${plural(lowIds.length, "an unusually low score", "unusually low scores")} compared with the rest of the class (hollow ${plural(lowIds.length, "circle", "circles")}).`;
      if (highIds.length) p1 += ` ${list(highIds)} gave ${plural(highIds.length, "an unusually high score", "unusually high scores")} compared with the rest of the class.`;
    }
    out.push(p1);

    // 2. mean, band, CI, agreement
    const band = UEQ.band(d.mean);
    let p2 = `The mean is <b>${f(d.mean)}</b> (standard deviation ${f(d.sd)}). On the UEQ scale, means above +0.8 indicate a positive evaluation, below −0.8 a negative one, and values in between are neutral. `;
    p2 += band === "positive" ? `This is a <b>positive</b> evaluation of the game's ${S.short.toLowerCase()} quality.`
        : band === "negative" ? `This is a <b>negative</b> evaluation of the game's ${S.short.toLowerCase()} quality.`
        : `This is a <b>neutral</b> evaluation: on average the class leaned neither clearly positive nor clearly negative.`;
    if (key === "OV") p2 = p2.replace(`of the game's overall quality`, "of the game overall");
    if (d.n > 1) {
      p2 += ` The 95% confidence interval runs from ${f(d.ciLo)} to ${f(d.ciHi)}, the range in which the mean of a wider population of similar students plausibly lies.`;
      const bLo = UEQ.band(d.ciLo), bHi = UEQ.band(d.ciHi);
      if (bLo !== bHi) p2 += ` Because this interval spans both ${bLo} and ${bHi} territory, the class data cannot settle the verdict with confidence. More participants would narrow the interval.`;
    }
    out.push(p2);

    let p3 = "";
    if (d.n > 2) {
      p3 = d.sd < 0.6 ? "Students largely agreed with each other (a small spread). "
         : d.sd <= 1.2 ? "There is a moderate amount of variation between students, which is typical for UEQ data. "
         : "Opinions differed widely (a large spread), so the mean summarises quite different experiences. It is worth asking what distinguished the high and low scorers. ";
      const gap = d.mean - d.median;
      if (Math.abs(gap) >= 0.3) p3 += `The mean is ${gap > 0 ? "higher" : "lower"} than the median by ${f(Math.abs(gap))}, which suggests the distribution is skewed: a few ${gap > 0 ? "high" : "low"} scores are pulling the mean ${gap > 0 ? "up" : "down"}. The median is the more robust summary here.`;
      else p3 += "The mean and median are close, so the scores are roughly symmetrical around the centre.";
    }
    if (p3) out.push(p3);

    // 3. reliability
    if (key !== "OV" && allRows.length >= 3) {
      const a = UEQ.cronbachAlpha(allRows, S.items);
      if (!Number.isNaN(a)) {
        out.push(`Reliability: <a href="glossary.html#alpha">Cronbach's alpha</a> for the four ${S.short.toLowerCase()} items is <b>${f(a)}</b>. ` +
          (a >= 0.7 ? "This is above the common 0.7 threshold, so the items appear to measure the same underlying quality consistently."
           : "This is below the common 0.7 threshold. With a small sample alpha is unstable, but it may also mean that students interpreted some items differently in the context of a game. The item chart below can show which item behaves differently."));
      }
    }
    return { d, paragraphs: out };
  }

  function benchHTML(key, d) {
    const S = UEQ.SCALES[key];
    const b = S.bench;
    const ranges = [`> ${b[0].toFixed(2)}`, `${b[1].toFixed(2)} – ${b[0].toFixed(2)}`, `${b[2].toFixed(2)} – ${(b[1] - 0.01).toFixed(2)}`, `${b[3].toFixed(2)} – ${(b[2] - 0.01).toFixed(2)}`, `< ${b[3].toFixed(2)}`];
    const cat = UEQ.benchCategory(key, d.mean);
    let lo = cat, hi = cat;
    if (d.n > 1) { lo = UEQ.benchCategory(key, d.ciLo); hi = UEQ.benchCategory(key, d.ciHi); }
    const rowsH = UEQ.BENCH_CATS.map((c, i) => {
      const here = i === cat;
      const inCI = i <= lo && i >= hi;
      return `<tr style="${here ? "font-weight:700;background:var(--accent-soft)" : inCI ? "background:var(--surface-2)" : ""}">
        <td style="text-align:left">${here ? "▶ " : ""}${c.name}</td><td>${ranges[i]}</td><td style="text-align:left;white-space:normal">${c.desc}</td></tr>`;
    }).join("");
    let txt = `Compared with the UEQ-S benchmark, the mean of ${f(d.mean)} falls in the <b>${UEQ.BENCH_CATS[cat].name}</b> category (${UEQ.BENCH_CATS[cat].desc}).`;
    if (d.n > 1 && lo !== hi) txt += ` However, the confidence interval stretches from "${UEQ.BENCH_CATS[lo].name}" to "${UEQ.BENCH_CATS[hi].name}" (shaded rows), so with ${d.n} participants the category is indicative only.`;
    return `<p>${txt}</p>
      <div class="table-wrap" style="max-height:none"><table class="sheet" style="font-size:.85rem">
        <thead><tr><th style="text-align:left">Benchmark category</th><th>Mean range</th><th style="text-align:left">Meaning</th></tr></thead>
        <tbody>${rowsH}</tbody></table></div>`;
  }

  function render() {
    const susp = rows.filter(r => UEQ.inconsistency(r).length === 2);
    const used = excl.checked ? rows.filter(r => UEQ.inconsistency(r).length < 2) : rows;
    content.innerHTML = "";
    if (!used.length) {
      content.innerHTML = `<div class="card empty"><h2>No responses yet</h2><p>Results will appear here as soon as the first survey is submitted.</p><a class="btn primary" href="survey.html">Go to the survey</a></div>`;
      return;
    }
    const scored = used.map(r => Object.assign({ s: UEQ.scoresFor(r) }, r));

    // KPIs
    const k = document.createElement("div");
    k.className = "kpis"; k.style.marginBottom = "20px";
    const m = key => UEQ.mean(scored.map(r => r.s[key]));
    k.innerHTML = `<div class="kpi"><b>${used.length}</b><span>responses analysed${excl.checked && susp.length ? ` (${susp.length} excluded)` : ""}</span></div>` +
      ["PQ", "HQ", "OV"].map(key => `<div class="kpi" style="border-top:3px solid ${COLORS[key]}"><b>${f(m(key))}</b><span>${UEQ.SCALES[key].name} mean</span></div>`).join("");
    content.appendChild(k);

    if (used.length < 5) {
      const w = document.createElement("div");
      w.className = "msg warn";
      w.textContent = `Only ${used.length} ${plural(used.length, "response", "responses")} so far. Statistics on very small samples are unstable, so wait for more data before drawing conclusions.`;
      content.appendChild(w);
    }

    // per-dimension cards
    ["PQ", "HQ", "OV"].forEach(key => {
      const S = UEQ.SCALES[key];
      const pts = scored.map(r => ({ id: r.participant, value: r.s[key] }));
      const card = document.createElement("section");
      card.className = "card";
      card.innerHTML = `<div class="dim-head"><span class="swatch" style="background:${COLORS[key]}"></span><h2 style="margin:0">${S.name}</h2></div>
        <p class="muted small" style="margin:4px 0 8px">${S.about}</p>
        <div class="chart-wrap"></div>
        <div class="report"></div>`;
      content.appendChild(card);
      Charts.boxPlot(card.querySelector(".chart-wrap"), pts, COLORS[key], S.name);
      const { d, paragraphs } = interpretScale(key, pts, used);
      card.querySelector(".report").innerHTML =
        `<h3>What the data say <a class="small" style="font-weight:400" href="glossary.html">(glossary)</a></h3>
         <div class="stats-grid">
           <div class="stat"><b>${d.n}</b><span><a href="glossary.html#n">n</a></span></div>
           <div class="stat"><b>${f(d.mean)}</b><span><a href="glossary.html#mean">mean</a></span></div>
           <div class="stat"><b>${f(d.median)}</b><span><a href="glossary.html#median">median</a></span></div>
           <div class="stat"><b>${f(d.sd)}</b><span><a href="glossary.html#sd">std. deviation</a></span></div>
           <div class="stat"><b>${f(d.q1)} / ${f(d.q3)}</b><span><a href="glossary.html#quartiles">Q1 / Q3</a></span></div>
           <div class="stat"><b>${f(d.ciLo)} to ${f(d.ciHi)}</b><span><a href="glossary.html#ci">95% CI of mean</a></span></div>
         </div>
         ${paragraphs.map(p => `<p>${p}</p>`).join("")}
         <h3>Benchmark comparison <a class="small" style="font-weight:400" href="glossary.html#benchmark">(what is this?)</a></h3>${benchHTML(key, d)}`;
    });

    // PQ vs HQ comparison
    if (scored.length >= 2) {
      const diffs = scored.map(r => r.s.HQ - r.s.PQ);
      const md = UEQ.mean(diffs);
      const hqHigher = diffs.filter(x => x > 0).length, pqHigher = diffs.filter(x => x < 0).length;
      const c = document.createElement("section");
      c.className = "card";
      c.innerHTML = `<h2>Comparing the two dimensions</h2>
        <p>On average, students rated <b>${md >= 0 ? "hedonic" : "pragmatic"}</b> quality higher, by ${f(Math.abs(md))} points. ${hqHigher} ${plural(hqHigher, "participant", "participants")} gave a higher hedonic than pragmatic score, ${pqHigher} the reverse, and ${scored.length - hqHigher - pqHigher} rated both equally.</p>
        <p>${Math.abs(md) < 0.3 ? "The two qualities are rated similarly, so the game is perceived as balanced between being easy to use and being stimulating."
          : md > 0 ? "The game is experienced as more stimulating and novel than it is easy or efficient to use. For a game this is common and can be intended (challenge is part of play), but it is worth checking whether low pragmatic items point to real usability problems such as unclear controls or goals."
          : "The game is experienced as easier and clearer to use than it is exciting or novel. Design attention could go to engagement, surprise and originality."}</p>
        <p class="small muted">Because each participant answered both dimensions, this is a paired comparison: we look at each person's own difference rather than comparing two separate groups.</p>`;
      content.appendChild(c);
    }

    // items
    const ic = document.createElement("section");
    ic.className = "card";
    ic.innerHTML = `<h2>Item means</h2><p class="muted small">The mean of each of the eight items (−3 to +3). Items of the same dimension should usually point the same way. An item that stands apart may have been understood differently in the context of a game.</p><div class="chart-wrap"></div>`;
    content.appendChild(ic);
    Charts.itemBars(ic.querySelector(".chart-wrap"), UEQ.ITEMS.map(it => {
      const v = used.map(r => UEQ.t(r[it.id]));
      return { left: it.left, right: it.right, mean: UEQ.mean(v), sd: UEQ.sd(v), color: COLORS[it.scale] };
    }));

    // data quality
    const flagged = rows.map(r => ({ id: r.participant, fl: UEQ.inconsistency(r) })).filter(x => x.fl.length);
    const dq = document.createElement("section");
    dq.className = "card";
    dq.innerHTML = `<h2>Data quality check</h2>` + (flagged.length
      ? `<p>${flagged.map(x => `P${x.id} (${x.fl.map(k => UEQ.SCALES[k].short.toLowerCase()).join(" and ")})`).join(", ")} ${plural(flagged.length, "has", "have")} answers that differ by more than 3 points within a dimension. ` +
        (susp.length ? `<b>${list(susp.map(r => r.participant))}</b> ${plural(susp.length, "is", "are")} flagged in both dimensions and therefore treated as suspicious. Tick "Exclude suspicious responses" above to see how removing ${plural(susp.length, "it", "them")} changes the results.` : "No response is flagged in both dimensions, so none is treated as suspicious.") + `</p>`
      : `<p>No inconsistent response patterns were detected: within each dimension, every participant's answers differ by 3 points or less.</p>`);
    content.appendChild(dq);
  }

  async function load(force) {
    try {
      const data = await Store.list();
      errEl.innerHTML = "";
      const key = JSON.stringify(data);
      document.getElementById("updated").textContent = `${data.length} ${plural(data.length, "response", "responses")} · updated ${new Date().toLocaleTimeString()}`;
      if (key !== lastKey || force) { rows = data.filter(UEQ.isComplete); lastKey = key; render(); }
    } catch (e) {
      errEl.innerHTML = `<div class="msg error">Could not load the data: ${e.message}</div>`;
    }
  }
  excl.addEventListener("change", () => render());
  document.getElementById("refreshBtn").addEventListener("click", () => load(true));
  load(true);
  const sec = window.UEQ_CONFIG.AUTO_REFRESH_SECONDS;
  if (sec > 0) setInterval(() => { if (!document.hidden) load(false); }, sec * 1000);
})();
