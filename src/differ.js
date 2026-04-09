/**
 * differ.js — Compare two design system extractions
 *
 * Produces a structured diff showing what changed between two URLs
 * or two versions of the same site. Useful for competitive analysis,
 * redesign tracking, and design drift detection.
 *
 * For educational and experimental purposes only.
 */

export function diff(dataA, dataB) {
  const result = {
    urlA: dataA.url,
    urlB: dataB.url,
    summary: {},
    colors: diffColors(dataA.colors, dataB.colors),
    fonts: diffFonts(dataA.fonts, dataB.fonts),
    spacing: diffSpacing(dataA.spacingScale, dataB.spacingScale),
    radii: diffSimpleList(dataA.radii, dataB.radii, "value"),
    shadows: diffSimpleList(dataA.shadows, dataB.shadows, "value"),
    components: diffComponents(dataA.components, dataB.components),
    scores: diffScores(dataA.consistencyScore, dataB.consistencyScore),
    breakpoints: diffBreakpoints(dataA.breakpointList, dataB.breakpointList),
    gridSystem: diffGrid(dataA.gridSystem, dataB.gridSystem),
    accessibility: diffAccessibility(dataA.accessibility, dataB.accessibility),
  };

  // Summary counts
  result.summary = {
    colorsAdded: result.colors.added.length,
    colorsRemoved: result.colors.removed.length,
    colorsShared: result.colors.shared.length,
    fontsAdded: result.fonts.added.length,
    fontsRemoved: result.fonts.removed.length,
    scoreChange: result.scores.overall.delta,
    totalChanges:
      result.colors.added.length + result.colors.removed.length +
      result.fonts.added.length + result.fonts.removed.length +
      result.spacing.added.length + result.spacing.removed.length +
      result.radii.added.length + result.radii.removed.length,
  };

  return result;
}

export function diffToMarkdown(d) {
  const l = [];
  const ln = (t = "") => l.push(t);

  ln("# DESIGN.md Diff");
  ln();
  ln(`> **A:** \`${d.urlA}\``);
  ln(`> **B:** \`${d.urlB}\``);
  ln(`> Generated: ${new Date().toISOString().split("T")[0]}`);
  ln(`> For educational and experimental purposes only.`);
  ln();
  ln("---");
  ln();

  // Summary
  ln("## Summary");
  ln();
  ln(`| Metric | Value |`);
  ln(`|--------|-------|`);
  ln(`| Colors added | ${d.summary.colorsAdded} |`);
  ln(`| Colors removed | ${d.summary.colorsRemoved} |`);
  ln(`| Colors shared | ${d.summary.colorsShared} |`);
  ln(`| Fonts added | ${d.summary.fontsAdded} |`);
  ln(`| Fonts removed | ${d.summary.fontsRemoved} |`);
  ln(`| Score change | ${d.summary.scoreChange > 0 ? "+" : ""}${d.summary.scoreChange} |`);
  ln(`| Total changes | ${d.summary.totalChanges} |`);
  ln();
  ln("---");
  ln();

  // Scores
  ln("## Consistency Score");
  ln();
  ln("| Dimension | A | B | Delta |");
  ln("|-----------|---|---|-------|");
  for (const [key, val] of Object.entries(d.scores)) {
    const sign = val.delta > 0 ? "+" : "";
    ln(`| ${key} | ${val.a} | ${val.b} | ${sign}${val.delta} |`);
  }
  ln();
  ln("---");
  ln();

  // Colors
  ln("## Colors");
  ln();
  if (d.colors.added.length > 0) {
    ln("### Added");
    for (const c of d.colors.added) ln(`- \`${c.hex}\` (${c.role})`);
    ln();
  }
  if (d.colors.removed.length > 0) {
    ln("### Removed");
    for (const c of d.colors.removed) ln(`- \`${c.hex}\` (${c.role})`);
    ln();
  }
  if (d.colors.shared.length > 0) {
    ln("### Shared");
    for (const c of d.colors.shared) ln(`- \`${c.hex}\` (${c.role})`);
    ln();
  }
  ln("---");
  ln();

  // Fonts
  ln("## Fonts");
  ln();
  if (d.fonts.added.length > 0) {
    ln("### Added");
    for (const f of d.fonts.added) ln(`- ${f}`);
    ln();
  }
  if (d.fonts.removed.length > 0) {
    ln("### Removed");
    for (const f of d.fonts.removed) ln(`- ${f}`);
    ln();
  }
  if (d.fonts.shared.length > 0) {
    ln("### Shared");
    for (const f of d.fonts.shared) ln(`- ${f}`);
    ln();
  }
  ln("---");
  ln();

  // Spacing
  if (d.spacing.added.length > 0 || d.spacing.removed.length > 0) {
    ln("## Spacing");
    ln();
    if (d.spacing.added.length > 0) {
      ln(`### Added: ${d.spacing.added.join(", ")}`);
      ln();
    }
    if (d.spacing.removed.length > 0) {
      ln(`### Removed: ${d.spacing.removed.join(", ")}`);
      ln();
    }
    ln("---");
    ln();
  }

  // Grid
  if (d.gridSystem.changed) {
    ln("## Grid System");
    ln();
    ln(`- **A:** ${d.gridSystem.a || "none detected"}`);
    ln(`- **B:** ${d.gridSystem.b || "none detected"}`);
    ln();
    ln("---");
    ln();
  }

  // Components
  if (d.components.added.length > 0 || d.components.removed.length > 0) {
    ln("## Components");
    ln();
    if (d.components.added.length > 0) ln(`Added: ${d.components.added.join(", ")}`);
    if (d.components.removed.length > 0) ln(`Removed: ${d.components.removed.join(", ")}`);
    ln();
  }

  return l.join("\n");
}

// ── Internal diff helpers ────────────────────────────────────

function diffColors(a, b) {
  const aHexes = new Set(a.map(c => c.hex));
  const bHexes = new Set(b.map(c => c.hex));
  return {
    added: b.filter(c => !aHexes.has(c.hex)),
    removed: a.filter(c => !bHexes.has(c.hex)),
    shared: a.filter(c => bHexes.has(c.hex)),
  };
}

function diffFonts(a, b) {
  const aFamilies = new Set(a.flatMap(f => f.families));
  const bFamilies = new Set(b.flatMap(f => f.families));
  return {
    added: [...bFamilies].filter(f => !aFamilies.has(f)),
    removed: [...aFamilies].filter(f => !bFamilies.has(f)),
    shared: [...aFamilies].filter(f => bFamilies.has(f)),
  };
}

function diffSpacing(a, b) {
  const aVals = new Set(a.map(s => s.value));
  const bVals = new Set(b.map(s => s.value));
  return {
    added: [...bVals].filter(v => !aVals.has(v)),
    removed: [...aVals].filter(v => !bVals.has(v)),
    shared: [...aVals].filter(v => bVals.has(v)),
  };
}

function diffSimpleList(a, b, key) {
  const aVals = new Set(a.map(x => x[key]));
  const bVals = new Set(b.map(x => x[key]));
  return {
    added: [...bVals].filter(v => !aVals.has(v)),
    removed: [...aVals].filter(v => !bVals.has(v)),
    shared: [...aVals].filter(v => bVals.has(v)),
  };
}

function diffComponents(a, b) {
  const aTypes = new Set(a.map(c => c.type));
  const bTypes = new Set(b.map(c => c.type));
  return {
    added: [...bTypes].filter(t => !aTypes.has(t)),
    removed: [...aTypes].filter(t => !bTypes.has(t)),
    shared: [...aTypes].filter(t => bTypes.has(t)),
  };
}

function diffScores(a, b) {
  const result = {};
  for (const key of Object.keys(a)) {
    result[key] = { a: a[key], b: b[key], delta: b[key] - a[key] };
  }
  return result;
}

function diffBreakpoints(a, b) {
  const aPx = new Set(a.map(bp => bp.px));
  const bPx = new Set(b.map(bp => bp.px));
  return {
    added: [...bPx].filter(p => !aPx.has(p)),
    removed: [...aPx].filter(p => !bPx.has(p)),
    shared: [...aPx].filter(p => bPx.has(p)),
  };
}

function diffGrid(a, b) {
  const aStr = a ? `${a.base}px (${a.adherence}%)` : null;
  const bStr = b ? `${b.base}px (${b.adherence}%)` : null;
  return { a: aStr, b: bStr, changed: aStr !== bStr };
}

function diffAccessibility(a, b) {
  if (!a || !b) return { a: null, b: null };
  return {
    contrastIssuesA: a.contrastIssues?.length || 0,
    contrastIssuesB: b.contrastIssues?.length || 0,
    delta: (b.contrastIssues?.length || 0) - (a.contrastIssues?.length || 0),
  };
}
