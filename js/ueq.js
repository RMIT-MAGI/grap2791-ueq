/* UEQ-S definitions, scoring and statistics.
   Item order and polarity follow the official English UEQ-S (ueq-online.org):
   negative term on the left (1), positive term on the right (7).
   Raw answers 1..7 are transformed to -3..+3 (value - 4).
   Pragmatic quality = mean of items 1-4, Hedonic quality = mean of items 5-8,
   Overall = mean of all 8 items. */
(function () {
  const ITEMS = [
    { id: "q1", left: "obstructive",     right: "supportive",   scale: "PQ" },
    { id: "q2", left: "complicated",     right: "easy",         scale: "PQ" },
    { id: "q3", left: "inefficient",     right: "efficient",    scale: "PQ" },
    { id: "q4", left: "confusing",       right: "clear",        scale: "PQ" },
    { id: "q5", left: "boring",          right: "exciting",     scale: "HQ" },
    { id: "q6", left: "not interesting", right: "interesting",  scale: "HQ" },
    { id: "q7", left: "conventional",    right: "inventive",    scale: "HQ" },
    { id: "q8", left: "usual",           right: "leading edge", scale: "HQ" }
  ];

  const SCALES = {
    PQ: {
      key: "PQ", name: "Pragmatic quality", short: "Pragmatic",
      items: ["q1", "q2", "q3", "q4"],
      about: "Task-related, goal-directed quality: was the game supportive, easy, efficient and clear to use?",
      // Benchmark lower bounds: Excellent, Good, Above average, Below average (Hinderks et al., UEQ-S benchmark)
      bench: [1.73, 1.55, 1.15, 0.73]
    },
    HQ: {
      key: "HQ", name: "Hedonic quality", short: "Hedonic",
      items: ["q5", "q6", "q7", "q8"],
      about: "Non-task, pleasure-related quality: was the game exciting, interesting, inventive and leading edge?",
      bench: [1.55, 1.25, 0.88, 0.57]
    },
    OV: {
      key: "OV", name: "Overall", short: "Overall",
      items: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"],
      about: "The mean of all eight items: a single summary of the user experience.",
      bench: [1.58, 1.40, 1.02, 0.68]
    }
  };

  const BENCH_CATS = [
    { name: "Excellent",     desc: "in the range of the 10% best results in the benchmark" },
    { name: "Good",          desc: "10% of benchmark results are better, 75% are worse" },
    { name: "Above average", desc: "25% of benchmark results are better, 50% are worse" },
    { name: "Below average", desc: "50% of benchmark results are better, 25% are worse" },
    { name: "Bad",           desc: "in the range of the 25% worst results in the benchmark" }
  ];

  /* ---------- scoring ---------- */
  function t(v) { return Number(v) - 4; }
  function scoresFor(row) {
    const out = {};
    for (const k of Object.keys(SCALES)) {
      const vals = SCALES[k].items.map(id => t(row[id]));
      out[k] = vals.reduce((a, b) => a + b, 0) / vals.length;
    }
    return out;
  }
  function isComplete(row) {
    return ITEMS.every(it => { const v = Number(row[it.id]); return v >= 1 && v <= 7; });
  }
  // UEQ consistency heuristic: within a scale, items measure the same thing,
  // so a spread (max - min) of more than 3 points suggests careless answering.
  function inconsistency(row) {
    const flags = [];
    for (const k of ["PQ", "HQ"]) {
      const v = SCALES[k].items.map(id => t(row[id]));
      if (Math.max(...v) - Math.min(...v) > 3) flags.push(k);
    }
    return flags;
  }
  function benchCategory(scaleKey, value) {
    const b = SCALES[scaleKey].bench;
    if (value > b[0]) return 0;
    if (value >= b[1]) return 1;
    if (value >= b[2]) return 2;
    if (value >= b[3]) return 3;
    return 4;
  }
  function band(value) {
    if (value > 0.8) return "positive";
    if (value < -0.8) return "negative";
    return "neutral";
  }

  /* ---------- statistics ---------- */
  const T975 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228,
    2.201, 2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086,
    2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042];
  function tcrit(df) { return df < 1 ? NaN : df <= 30 ? T975[df - 1] : 1.96 + 2.4 / df; }
  function mean(a) { return a.reduce((x, y) => x + y, 0) / a.length; }
  function variance(a) { if (a.length < 2) return NaN; const m = mean(a); return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1); }
  function sd(a) { return Math.sqrt(variance(a)); }
  // Linear interpolation between order statistics (same as Excel QUARTILE.INC)
  function quantile(sorted, p) {
    const pos = (sorted.length - 1) * p, lo = Math.floor(pos), hi = Math.ceil(pos);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  }
  function describe(values) {
    const s = [...values].sort((a, b) => a - b), n = s.length;
    if (!n) return { n: 0 };
    const q1 = quantile(s, 0.25), med = quantile(s, 0.5), q3 = quantile(s, 0.75), iqr = q3 - q1;
    const loF = q1 - 1.5 * iqr, hiF = q3 + 1.5 * iqr;
    const inside = s.filter(v => v >= loF && v <= hiF);
    const m = mean(s), sdev = sd(s);
    const half = n > 1 ? tcrit(n - 1) * sdev / Math.sqrt(n) : NaN;
    return {
      n, mean: m, sd: sdev, median: med, q1, q3, iqr, min: s[0], max: s[n - 1],
      whiskerLo: inside[0], whiskerHi: inside[inside.length - 1],
      outliers: s.filter(v => v < loF || v > hiF),
      ciLo: m - half, ciHi: m + half, ciHalf: half
    };
  }
  function cronbachAlpha(rows, itemIds) {
    if (rows.length < 3) return NaN;
    const k = itemIds.length;
    const itemVars = itemIds.map(id => variance(rows.map(r => t(r[id]))));
    const totals = rows.map(r => itemIds.reduce((s, id) => s + t(r[id]), 0));
    const vt = variance(totals);
    if (!vt) return NaN;
    return (k / (k - 1)) * (1 - itemVars.reduce((a, b) => a + b, 0) / vt);
  }

  function fmt(x, d = 2) {
    if (x === undefined || x === null || Number.isNaN(x)) return "–";
    const s = x.toFixed(d);
    return s === "-0.00" ? "0.00" : s.replace("-", "−");
  }

  window.UEQ = { ITEMS, SCALES, BENCH_CATS, t, scoresFor, isComplete, inconsistency,
    benchCategory, band, mean, sd, describe, cronbachAlpha, quantile, fmt };
})();
