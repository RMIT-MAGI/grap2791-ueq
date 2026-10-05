/* Hand-built SVG charts (no external libraries, works offline). */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  let tip;
  function tooltip() {
    if (!tip) { tip = document.createElement("div"); tip.className = "tooltip"; tip.setAttribute("role", "status"); document.body.appendChild(tip); }
    return tip;
  }
  function bindTip(el, text) {
    el.addEventListener("pointerenter", () => { tooltip().textContent = text; tip.style.opacity = 1; });
    el.addEventListener("pointermove", e => {
      const w = tip.offsetWidth;
      tip.style.left = Math.min(window.innerWidth - w - 8, Math.max(8, e.clientX - w / 2)) + "px";
      tip.style.top = (e.clientY - 38) + "px";
    });
    el.addEventListener("pointerleave", () => { tip.style.opacity = 0; });
  }
  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function text(parent, x, y, str, attrs = {}) {
    const n = el("text", Object.assign({ x, y }, attrs), parent);
    n.textContent = str; return n;
  }
  const f = v => UEQ.fmt(v);

  /* Horizontal box plot on the UEQ scale (-3..+3), with mean/CI row and individual dots.
     points: [{ id, value }] ; color: CSS colour */
  function boxPlot(container, points, color, label) {
    container.innerHTML = "";
    const W = 720, H = 178, L = 118, R = 704;
    const x = v => L + (v + 3) / 6 * (R - L);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": `Box plot of ${label} scores` });
    const values = points.map(p => p.value);
    const d = UEQ.describe(values);
    const top = 24, bottom = 146, yBox = 52, yMean = 88, yDots = 120;

    // zones
    el("rect", { x: x(-0.8), y: top, width: x(0.8) - x(-0.8), height: bottom - top, fill: "var(--band)" }, svg);
    text(svg, (x(-3) + x(-0.8)) / 2, 16, "negative", { "text-anchor": "middle" });
    text(svg, 0 + (x(-0.8) + x(0.8)) / 2, 16, "neutral (−0.8 to +0.8)", { "text-anchor": "middle" });
    text(svg, (x(0.8) + x(3)) / 2, 16, "positive", { "text-anchor": "middle" });
    for (let v = -3; v <= 3; v++) {
      el("line", { x1: x(v), x2: x(v), y1: top, y2: bottom, stroke: v === 0 ? "var(--text-3)" : "var(--grid)", "stroke-width": 1, "stroke-dasharray": v === 0 ? "3 3" : "" }, svg);
      text(svg, x(v), bottom + 18, (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v), { "text-anchor": "middle" });
    }
    // row labels
    text(svg, 8, yBox + 4, "Box plot", { class: "t-strong" });
    text(svg, 8, yMean + 4, "Mean ± 95% CI", { class: "t-strong" });
    text(svg, 8, yDots + 4, "Participants", { class: "t-strong" });

    if (d.n) {
      // whiskers
      const g = el("g", {}, svg);
      el("line", { x1: x(d.whiskerLo), x2: x(d.q1), y1: yBox, y2: yBox, stroke: "var(--text-2)", "stroke-width": 2 }, g);
      el("line", { x1: x(d.q3), x2: x(d.whiskerHi), y1: yBox, y2: yBox, stroke: "var(--text-2)", "stroke-width": 2 }, g);
      [d.whiskerLo, d.whiskerHi].forEach(v => el("line", { x1: x(v), x2: x(v), y1: yBox - 9, y2: yBox + 9, stroke: "var(--text-2)", "stroke-width": 2 }, g));
      // box
      const bw = Math.max(2, x(d.q3) - x(d.q1));
      const box = el("rect", { x: x(d.q1) - (bw === 2 ? 1 : 0), y: yBox - 16, width: bw, height: 32, rx: 4, fill: color, "fill-opacity": 0.22, stroke: color, "stroke-width": 2 }, g);
      el("line", { x1: x(d.median), x2: x(d.median), y1: yBox - 16, y2: yBox + 16, stroke: "var(--text)", "stroke-width": 3 }, g);
      // hit area for box tooltip
      const hit = el("rect", { x: x(d.whiskerLo) - 6, y: yBox - 20, width: x(d.whiskerHi) - x(d.whiskerLo) + 12, height: 40, fill: "transparent" }, g);
      bindTip(hit, `Median ${f(d.median)} · box (Q1–Q3) ${f(d.q1)} to ${f(d.q3)} · whiskers ${f(d.whiskerLo)} to ${f(d.whiskerHi)}`);
      // outliers
      d.outliers.forEach(v => {
        const who = points.filter(p => p.value === v).map(p => "P" + p.id).join(", ");
        const c = el("circle", { cx: x(v), cy: yBox, r: 5, fill: "var(--surface)", stroke: color, "stroke-width": 2 }, svg);
        bindTip(c, `Outlier ${f(v)} (${who})`);
      });
      // mean + CI
      if (d.n > 1) {
        el("line", { x1: x(Math.max(-3, d.ciLo)), x2: x(Math.min(3, d.ciHi)), y1: yMean, y2: yMean, stroke: color, "stroke-width": 2 }, svg);
        [Math.max(-3, d.ciLo), Math.min(3, d.ciHi)].forEach(v => el("line", { x1: x(v), x2: x(v), y1: yMean - 6, y2: yMean + 6, stroke: color, "stroke-width": 2 }, svg));
      }
      const m = el("path", { d: `M ${x(d.mean)} ${yMean - 7} L ${x(d.mean) + 7} ${yMean} L ${x(d.mean)} ${yMean + 7} L ${x(d.mean) - 7} ${yMean} Z`, fill: color, stroke: "var(--surface)", "stroke-width": 2 }, svg);
      const mh = el("rect", { x: x(d.mean) - 12, y: yMean - 12, width: 24, height: 24, fill: "transparent" }, svg);
      bindTip(mh, `Mean ${f(d.mean)} · 95% CI ${f(d.ciLo)} to ${f(d.ciHi)}`);
      // dots: stack equal values vertically
      const seen = {};
      const offs = [0, -8, 8, -16, 16, -24, 24, -32, 32];
      [...points].sort((a, b) => a.id - b.id).forEach(p => {
        const k = p.value.toFixed(3); seen[k] = (seen[k] || 0);
        const i = seen[k]++;
        const dy = i < offs.length ? offs[i] : (i % 2 ? -1 : 1) * 4 * i;
        const c = el("circle", { cx: x(p.value), cy: yDots + dy * 0.7, r: 4.5, fill: color, stroke: "var(--surface)", "stroke-width": 1.5 }, svg);
        bindTip(c, `Participant ${p.id}: ${f(p.value)}`);
      });
    }
    container.appendChild(svg);
    return d;
  }

  /* Diverging horizontal bars for item means (-3..+3) */
  function itemBars(container, rows) {
    container.innerHTML = "";
    const rowH = 30, W = 720, L = 250, R = 650, H = rows.length * rowH + 36;
    const x = v => L + (v + 3) / 6 * (R - L);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Mean score per item" });
    el("rect", { x: x(-0.8), y: 4, width: x(0.8) - x(-0.8), height: rows.length * rowH, fill: "var(--band)" }, svg);
    for (let v = -3; v <= 3; v++) {
      el("line", { x1: x(v), x2: x(v), y1: 4, y2: rows.length * rowH + 4, stroke: v === 0 ? "var(--text-3)" : "var(--grid)" }, svg);
      text(svg, x(v), rows.length * rowH + 22, (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v), { "text-anchor": "middle" });
    }
    rows.forEach((r, i) => {
      const y = 4 + i * rowH + rowH / 2;
      text(svg, L - 10, y + 4, `${r.left} – ${r.right}`, { "text-anchor": "end", class: "t-strong" });
      const x0 = x(0), x1 = x(r.mean);
      const bar = el("rect", { x: Math.min(x0, x1), y: y - 8, width: Math.max(2, Math.abs(x1 - x0)), height: 16, rx: 3, fill: r.color }, svg);
      bindTip(bar, `${r.left} – ${r.right}: mean ${f(r.mean)}, SD ${f(r.sd)}`);
      text(svg, r.mean >= 0 ? x1 + 6 : x1 - 6, y + 4, f(r.mean), { "text-anchor": r.mean >= 0 ? "start" : "end" });
    });
    container.appendChild(svg);
  }

  window.Charts = { boxPlot, itemBars };
})();
