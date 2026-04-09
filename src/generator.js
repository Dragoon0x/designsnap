/**
 * generator.js — Deep DESIGN.md generator
 *
 * Produces a comprehensive design system document with 14 sections
 * covering every aspect of a site's visual language.
 *
 * For educational and experimental purposes only.
 */

export function generateMarkdown(data) {
  const l = [];
  const ln = (t = "") => l.push(t);
  const hr = () => ln("---");

  const dominantBg = data.colors.find(c => c.role === "background") || data.colors.find(c => c.role === "surface");
  const dominantText = data.colors.find(c => c.role === "text-primary" || c.role === "text");
  const accent = data.colors.find(c => c.role === "accent");
  const isDark = dominantBg?.hsl?.l < 30;

  // ── Header ─────────────────────────────────────────────────
  ln("# DESIGN.md");
  ln();
  ln(`> Source: \`${data.url}\``);
  ln(`> Extracted: ${new Date().toISOString().split("T")[0]}`);
  ln(`> Consistency Score: **${data.consistencyScore.overall}/100**`);
  ln(`> This file was generated for educational and experimental purposes only.`);
  ln();
  if (data.meta.description) ln(`**${data.meta.description}**`);
  ln();
  hr(); ln();

  // ── 1. Visual Theme ────────────────────────────────────────
  ln("## 1. Visual Theme & Atmosphere");
  ln();
  ln(`- **Mode:** ${isDark ? "Dark" : "Light"}${data.darkModeData ? " (dark mode also available)" : ""}`);
  ln(`- **Primary font:** ${data.fonts[0]?.families[0] || "System default"}`);
  if (data.fonts[1]) ln(`- **Secondary font:** ${data.fonts[1].families[0]}`);
  if (accent) ln(`- **Accent:** \`${accent.hex}\``);
  if (dominantBg) ln(`- **Background:** \`${dominantBg.hex}\``);
  if (dominantText) ln(`- **Text:** \`${dominantText.hex}\``);
  ln(`- **Color harmony:** ${data.colorHarmony.type} (${data.colorHarmony.description})`);
  if (data.scaleRatio) ln(`- **Type scale:** ${data.scaleRatio.name} (${data.scaleRatio.detected}:1)`);
  if (data.gridSystem) ln(`- **Spacing grid:** ${data.gridSystem.base}px base (${data.gridSystem.adherence}% adherence)`);
  if (data.detectedFrameworks?.length > 0) {
    ln(`- **Detected frameworks:** ${data.detectedFrameworks.map(f => `${f.name} (${f.confidence}%)`).join(", ")}`);
  }
  if (data.completeness) {
    ln(`- **System completeness:** ${data.completeness.score}% (${data.completeness.met}/${data.completeness.totalCriteria} criteria)`);
  }
  ln();
  hr(); ln();

  // ── 2. Consistency Score ───────────────────────────────────
  ln("## 2. Design Consistency Score");
  ln();
  ln(`Overall: **${data.consistencyScore.overall}/100**`);
  ln();
  ln("| Dimension | Score | Notes |");
  ln("|-----------|-------|-------|");
  ln(`| Color | ${data.consistencyScore.color}/100 | ${data.colors.length} distinct colors |`);
  ln(`| Typography | ${data.consistencyScore.typography}/100 | ${data.fonts.length} font families |`);
  ln(`| Spacing | ${data.consistencyScore.spacing}/100 | ${data.gridSystem ? data.gridSystem.base + "px grid, " + data.gridSystem.adherence + "% adherence" : "No consistent grid detected"} |`);
  ln(`| Border Radius | ${data.consistencyScore.radius}/100 | ${data.radii.length} distinct values |`);
  ln(`| Shadows | ${data.consistencyScore.shadow}/100 | ${data.shadows.length} shadow levels |`);
  ln(`| Accessibility | ${data.consistencyScore.accessibility}/100 | ${data.accessibility?.contrastIssues?.length || 0} contrast issues |`);
  ln();

  if (data.completeness) {
    ln("### System Completeness");
    ln();
    ln(`**${data.completeness.score}%** complete (${data.completeness.met}/${data.completeness.totalCriteria} criteria met)`);
    ln();
    if (data.completeness.missing.length > 0) {
      ln("**Missing:**");
      ln();
      for (const m of data.completeness.missing) ln(`- ${m.label}`);
      ln();
    }
    if (data.completeness.present.length > 0) {
      ln("**Present:**");
      ln();
      for (const p of data.completeness.present) ln(`- ${p.label}`);
      ln();
    }
  }
  hr(); ln();

  // ── 3. Color Palette ───────────────────────────────────────
  ln("## 3. Color Palette & Roles");
  ln();
  ln(`**Harmony:** ${data.colorHarmony.type} (${data.colorHarmony.description})`);
  ln();
  ln("| Hex | Role | Count | HSL |");
  ln("|-----|------|-------|-----|");
  for (const c of data.colors) {
    const hslStr = c.hsl ? `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)` : "";
    ln(`| \`${c.hex}\` | ${c.role} | ${c.count} | ${hslStr} |`);
  }
  ln();

  if (data.colorPairings.length > 0) {
    ln("### Accessible Color Pairings");
    ln();
    ln("| Foreground | Background | Ratio | AA | AAA | AA Large |");
    ln("|------------|------------|-------|----|----|----------|");
    for (const p of data.colorPairings.slice(0, 10)) {
      ln(`| \`${p.fg}\` (${p.fgRole}) | \`${p.bg}\` (${p.bgRole}) | ${p.ratio}:1 | ${p.aa ? "Pass" : "Fail"} | ${p.aaa ? "Pass" : "Fail"} | ${p.aaLarge ? "Pass" : "Fail"} |`);
    }
    ln();
  }

  // CSS vars
  const colorVars = Object.entries(data.cssVars).filter(([k]) => /color|bg|background|primary|secondary|accent/i.test(k));
  if (colorVars.length > 0) {
    ln("### CSS Custom Properties");
    ln();
    ln("```css");
    for (const [k, v] of colorVars.slice(0, 40)) ln(`${k}: ${v};`);
    ln("```");
    ln();
  }

  if (data.darkModeData) {
    ln("### Dark Mode Overrides");
    ln();
    if (data.darkModeData.selectors?.length > 0) {
      ln(`Triggered by: ${data.darkModeData.selectors.slice(0, 3).join(", ")}`);
      ln();
    }
    ln("```css");
    for (const [k, v] of Object.entries(data.darkModeData.vars || {}).slice(0, 25)) ln(`${k}: ${v};`);
    ln("```");
    ln();
  }

  if (data.gradientList.length > 0) {
    ln("### Gradients");
    ln();
    for (const g of data.gradientList) {
      const truncated = g.value.length > 100 ? g.value.slice(0, 100) + "..." : g.value;
      ln(`- \`${truncated}\` (${g.count} uses)`);
    }
    ln();
  }
  hr(); ln();

  // ── 4. Typography ──────────────────────────────────────────
  ln("## 4. Typography System");
  ln();
  ln("### Font Stacks");
  ln();
  for (const f of data.fonts) {
    ln(`- **${f.role}:** \`${f.families.join(", ")}\` (${f.count} uses)`);
  }
  ln();

  if (data.externalFonts?.urls?.length > 0) {
    ln("### External Font Sources");
    ln();
    for (const url of data.externalFonts.urls) ln(`- ${url}`);
    ln();
  }

  if (data.externalFonts?.faces?.length > 0) {
    ln("### @font-face Declarations");
    ln();
    ln("| Family | Weight | Style |");
    ln("|--------|--------|-------|");
    for (const f of data.externalFonts.faces.slice(0, 12)) {
      ln(`| ${f.family} | ${f.weight} | ${f.style} |`);
    }
    ln();
  }

  if (data.scaleRatio) {
    ln(`### Type Scale Ratio: ${data.scaleRatio.name} (${data.scaleRatio.detected}:1)`);
    ln();
  }

  ln("### Type Scale");
  ln();
  ln("| Size | Usage |");
  ln("|------|-------|");
  for (const s of data.typeSizes.slice(0, 14)) ln(`| ${s.size} | ${s.count} |`);
  ln();

  if (Object.keys(data.headingMap).length > 0) {
    ln("### Heading Hierarchy");
    ln();
    ln("| Level | Size | Weight | Line Height | Letter Spacing | Transform |");
    ln("|-------|------|--------|-------------|----------------|-----------|");
    for (const [level, h] of Object.entries(data.headingMap).sort()) {
      ln(`| ${level} | ${h.size} | ${h.weight} | ${h.lineHeight} | ${h.letterSpacing || "normal"} | ${h.textTransform || "none"} |`);
    }
    ln();
  }

  ln("### Font Weights");
  ln();
  for (const w of data.fontWeights) ln(`- \`${w.weight}\` (${weightName(w.weight)}) ${w.count} uses`);
  ln();
  hr(); ln();

  // ── 5. Components ──────────────────────────────────────────
  ln("## 5. Component Styling");
  ln();
  for (const comp of data.components) {
    ln(`### ${cap(comp.type)}s (${comp.count} found)`);
    ln();
    for (let i = 0; i < comp.variants.length; i++) {
      const v = comp.variants[i];
      ln(`**Variant ${i + 1}**${v.sample ? ` ("${v.sample}")` : ""}`);
      ln();
      ln("```");
      for (const [key, val] of Object.entries(v)) {
        if (val && val !== "none 0s ease 0s" && val !== "none" && !["sample", "text", "placeholder", "type", "classes", "listStyle"].includes(key)) {
          ln(`${kebab(key)}: ${val}`);
        }
      }
      ln("```");
      ln();
    }
  }
  hr(); ln();

  // ── 6. Spacing ─────────────────────────────────────────────
  ln("## 6. Layout & Spacing");
  ln();
  if (data.gridSystem) {
    ln(`### Grid System: ${data.gridSystem.base}px base`);
    ln();
    ln(`Adherence: **${data.gridSystem.adherence}%** of spacing values align to the ${data.gridSystem.base}px grid.`);
    ln();
    ln(`Suggested scale: ${data.gridSystem.suggestedScale.join(", ")}`);
    ln();
  }

  ln("### Spacing Scale");
  ln();
  ln("| Value | ~Grid | Usage |");
  ln("|-------|-------|-------|");
  for (const s of data.spacingScale) ln(`| ${s.value} | ~${Math.round(s.px / 4) * 4}px | ${s.count} |`);
  ln();

  if (data.containerWidths.length > 0) {
    ln("### Container Widths");
    ln();
    for (const c of data.containerWidths) ln(`- \`max-width: ${c.value}\` (${c.count} uses)`);
    ln();
  }

  if (data.layoutPatterns) {
    ln("### Layout Patterns");
    ln();
    ln(`- Flex containers: ${data.layoutPatterns.flexContainers}`);
    ln(`- Grid containers: ${data.layoutPatterns.gridContainers}`);
    ln(`- Sticky elements: ${data.layoutPatterns.stickyElements}`);
    ln(`- Fixed elements: ${data.layoutPatterns.fixedElements}`);
    ln();
  }
  hr(); ln();

  // ── 7. Depth ───────────────────────────────────────────────
  ln("## 7. Depth & Elevation");
  ln();
  if (data.shadows.length > 0) {
    ln("### Shadow System");
    ln();
    ln("| Level | Value | Usage |");
    ln("|-------|-------|-------|");
    for (const s of data.shadows) {
      const tr = s.value.length > 80 ? s.value.slice(0, 80) + "..." : s.value;
      ln(`| ${s.level} | \`${tr}\` | ${s.count} |`);
    }
    ln();
  }

  ln("### Border Radius");
  ln();
  ln("| Value | Usage |");
  ln("|-------|-------|");
  for (const r of data.radii) ln(`| ${r.value} | ${r.count} |`);
  ln();

  if (data.zIndices.length > 0) {
    ln("### Z-Index Scale");
    ln();
    for (const z of data.zIndices) ln(`- \`z-index: ${z.value}\` (${z.count} uses)`);
    ln();
  }

  if (data.opacityValues.length > 0) {
    ln("### Opacity Values");
    ln();
    for (const o of data.opacityValues) ln(`- \`opacity: ${o.value}\` (${o.count} uses)`);
    ln();
  }
  hr(); ln();

  // ── 8. Motion ──────────────────────────────────────────────
  ln("## 8. Motion & Animation");
  ln();
  if (data.motionSystem) {
    const m = data.motionSystem;
    if (Object.keys(m.durations).length > 0) {
      ln("### Transition Durations");
      ln();
      for (const [dur, count] of Object.entries(m.durations).sort((a, b) => b[1] - a[1])) {
        ln(`- \`${dur}\` (${count} uses)`);
      }
      ln();
    }

    if (Object.keys(m.easings).length > 0) {
      ln("### Easing Functions");
      ln();
      for (const [ease, count] of Object.entries(m.easings).sort((a, b) => b[1] - a[1])) {
        ln(`- \`${ease}\` (${count} uses)`);
      }
      ln();
    }

    if (Object.keys(m.transitions).length > 0) {
      ln("### Animated Properties");
      ln();
      for (const [prop, count] of Object.entries(m.transitions).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
        ln(`- \`${prop}\` (${count} uses)`);
      }
      ln();
    }

    if (m.keyframes.length > 0) {
      ln("### Keyframe Animations");
      ln();
      for (const kf of m.keyframes) ln(`- \`@keyframes ${kf.name}\` (${kf.steps} steps)`);
      ln();
    }

    if (m.animatedElements > 0) ln(`${m.animatedElements} elements with active CSS animations.`);
    ln();
  }
  hr(); ln();

  // ── 9. Interactive States ──────────────────────────────────
  if (data.interactiveStates?.hover?.length > 0) {
    ln("## 9. Interactive States");
    ln();
    ln("### Hover Effects");
    ln();
    for (const h of data.interactiveStates.hover) {
      ln(`**${h.tag}** (cursor: ${h.cursor})`);
      ln();
      ln("```");
      for (const [prop, change] of Object.entries(h.changes)) {
        if (change) ln(`${prop}: ${change.from} → ${change.to}`);
      }
      ln("```");
      ln();
    }
    hr(); ln();
  }

  // ── 10. Responsive ─────────────────────────────────────────
  ln("## 10. Responsive Behavior");
  ln();
  if (data.breakpointList.length > 0) {
    ln("### Breakpoints (from stylesheets)");
    ln();
    ln("| Breakpoint | CSS Rules |");
    ln("|------------|-----------|");
    for (const bp of data.breakpointList) ln(`| ${bp.px}px | ${bp.ruleCount} rules |`);
    ln();
  }

  if (data.responsiveData) {
    for (const [vp, snap] of Object.entries(data.responsiveData)) {
      ln(`### ${cap(vp)} Viewport`);
      ln();
      ln(`- Hidden elements: ${snap.hiddenElements}`);
      if (snap.hasHamburger) ln("- Hamburger menu detected");
      ln();
    }
  }
  hr(); ln();

  // ── 11. Accessibility ──────────────────────────────────────
  if (data.accessibility) {
    ln("## 11. Accessibility Audit");
    ln();
    const a = data.accessibility;

    if (a.contrastIssues.length > 0) {
      ln("### Contrast Issues");
      ln();
      ln("| Text | Fg | Bg | Ratio | Required |");
      ln("|------|----|----|-------|----------|");
      for (const issue of a.contrastIssues.slice(0, 15)) {
        ln(`| "${issue.text.slice(0, 25)}" | \`${issue.fg}\` | \`${issue.bg}\` | ${issue.ratio}:1 | 4.5:1 |`);
      }
      ln();
    } else {
      ln("No contrast issues detected. All sampled text passes WCAG AA.");
      ln();
    }

    ln("### Structure");
    ln();
    ln(`- Skip link: ${a.skipLink ? "Present" : "Missing"}`);
    ln(`- Focus styles: ${a.focusVisible ? "Defined" : "Not detected"}`);
    ln(`- Images missing alt: ${a.missingAlt}`);
    ln(`- ARIA labels: ${a.ariaLabels}`);
    ln(`- Form labels: ${a.formLabels.labeled} labeled, ${a.formLabels.unlabeled} unlabeled`);
    ln();

    if (Object.keys(a.landmarks).length > 0) {
      ln("### Landmarks");
      ln();
      for (const [tag, count] of Object.entries(a.landmarks)) ln(`- \`<${tag}>\` (${count})`);
      ln();
    }

    if (a.headingOrder.length > 0) {
      ln(`### Heading Order: ${a.headingOrder.join(" → ")}`);
      const isSequential = a.headingOrder.every((h, i) => i === 0 || h <= a.headingOrder[i - 1] + 1);
      ln();
      ln(isSequential ? "Heading hierarchy is sequential." : "Warning: heading levels skip or jump.");
      ln();
    }
    hr(); ln();
  }

  // ── 12. Icons & Images ─────────────────────────────────────
  ln("## 12. Icons & Image Treatments");
  ln();
  if (data.iconSystem) {
    const ic = data.iconSystem;
    ln("### Icon System");
    ln();
    ln(`- Inline SVGs: ${ic.svgInline}`);
    ln(`- SVG sprites: ${ic.svgSprite}`);
    ln(`- Icon font: ${ic.iconFont ? "Yes" : "No"}`);
    if (Object.keys(ic.svgSizes).length > 0) {
      ln(`- Common sizes: ${Object.entries(ic.svgSizes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s, c]) => `${s} (${c})`).join(", ")}`);
    }
    ln();
  }

  if (data.imageTreatments) {
    const img = data.imageTreatments;
    ln("### Image Treatments");
    ln();
    ln(`- Total images: ${img.count}`);
    ln(`- Average size: ${img.avgWidth}x${img.avgHeight}`);
    ln(`- Lazy loaded: ${img.lazyLoaded}`);
    if (Object.keys(img.objectFit).length > 0) {
      ln(`- Object-fit: ${Object.entries(img.objectFit).map(([k, v]) => `${k} (${v})`).join(", ")}`);
    }
    if (Object.keys(img.borderRadius).length > 0) {
      ln(`- Border radius: ${Object.entries(img.borderRadius).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(", ")}`);
    }
    ln();
  }
  hr(); ln();

  // ── 13. Borders ────────────────────────────────────────────
  if (data.borderWidths.length > 0) {
    ln("## 13. Border System");
    ln();
    ln("### Border Widths");
    ln();
    for (const b of data.borderWidths) ln(`- \`${b.value}\` (${b.count} uses)`);
    ln();

    const borderColors = data.colors.filter(c => c.role === "border");
    if (borderColors.length > 0) {
      ln("### Border Colors");
      ln();
      for (const c of borderColors) ln(`- \`${c.hex}\` (${c.count} uses)`);
      ln();
    }
    hr(); ln();
  }

  // ── 14. Agent Prompt Guide ─────────────────────────────────
  ln("## 14. Agent Prompt Guide");
  ln();
  ln("### Quick Reference");
  ln();
  ln("```");
  for (const c of data.colors.filter(c => ["background", "text-primary", "accent", "surface", "border"].includes(c.role)).slice(0, 8)) {
    ln(`${c.role}: ${c.hex}`);
  }
  ln(`font-primary: ${data.fonts[0]?.families[0] || "system-ui"}`);
  if (data.fonts[1]) ln(`font-secondary: ${data.fonts[1].families[0]}`);
  if (data.gridSystem) ln(`spacing-grid: ${data.gridSystem.base}px`);
  if (data.radii[0]) ln(`radius-default: ${data.radii[0].value}`);
  ln("```");
  ln();

  ln("### Full Prompt");
  ln();
  ln("```");
  ln("Build a page using these design tokens:");
  ln();
  ln("Colors:");
  for (const c of data.colors.slice(0, 8)) ln(`  ${c.role}: ${c.hex}`);
  ln();
  ln("Typography:");
  ln(`  Primary: ${data.fonts[0]?.families[0] || "system-ui"}`);
  if (data.fonts[1]) ln(`  Secondary: ${data.fonts[1].families[0]}`);
  for (const [level, h] of Object.entries(data.headingMap).sort()) {
    ln(`  ${level}: ${h.size} / ${h.weight}`);
  }
  ln();
  ln("Spacing:");
  if (data.gridSystem) ln(`  Base grid: ${data.gridSystem.base}px`);
  ln(`  Scale: ${data.spacingScale.slice(0, 8).map(s => s.value).join(", ")}`);
  ln();
  ln("Depth:");
  if (data.radii[0]) ln(`  Border radius: ${data.radii[0].value}`);
  if (data.shadows[0]) ln(`  Shadow: ${data.shadows[0].value.slice(0, 80)}`);
  ln("```");
  ln();

  return l.join("\n");
}

// ═══════════════════════════════════════════════════════════════
// Preview HTML
// ═══════════════════════════════════════════════════════════════

export function generatePreview(data) {
  // Reuse the same preview from before but add consistency score
  const scoreBar = (label, val) => `
    <div style="margin:6px 0;display:flex;align-items:center;gap:12px">
      <span style="width:100px;font-size:12px;color:#888">${label}</span>
      <div style="flex:1;height:8px;background:#222;border-radius:4px;overflow:hidden">
        <div style="width:${val}%;height:100%;background:${val > 75 ? '#3bf0a0' : val > 50 ? '#ffb86c' : '#ff6b6b'};border-radius:4px"></div>
      </div>
      <span style="font-size:12px;font-family:monospace;color:#ccc;width:40px;text-align:right">${val}</span>
    </div>`;

  const colors = data.colors.map(c => `
    <div style="display:flex;align-items:center;gap:12px;margin:6px 0">
      <div style="width:48px;height:48px;border-radius:8px;background:${escAttr(c.hex)};border:1px solid #333;flex-shrink:0"></div>
      <div>
        <code style="font-size:13px;color:#e8e8e8">${esc(c.hex)}</code>
        <div style="font-size:11px;color:#666;margin-top:2px">${esc(c.role)} · ${c.count} uses · hsl(${c.hsl?.h || 0}, ${c.hsl?.s || 0}%, ${c.hsl?.l || 0}%)</div>
      </div>
    </div>`).join("");

  const fontSamples = data.fonts.map(f => `
    <div style="font-family:${escAttr(f.stack)};margin:16px 0;padding:16px;background:#161616;border-radius:8px;border:1px solid #222">
      <div style="font-size:28px;margin-bottom:4px">The quick brown fox jumps over the lazy dog</div>
      <div style="font-size:12px;color:#666;font-family:monospace;margin-top:8px">${esc(f.role)} · ${esc(f.families.join(", "))} · ${f.count} uses</div>
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DESIGN.md Preview</title>
  ${(data.externalFonts?.urls || []).filter(u => u.includes("googleapis")).map(u => `<link rel="stylesheet" href="${esc(u)}">`).join("\n  ")}
  <style>
    * { margin: 0; box-sizing: border-box; }
    body { font-family: ${escAttr(data.fonts[0]?.stack || "system-ui")}; padding: 48px; max-width: 960px; margin: 0 auto; color: #e8e8e8; background: #0a0a0a; }
    h1 { font-size: 28px; margin-bottom: 4px; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #555; margin: 48px 0 16px; border-bottom: 1px solid #222; padding-bottom: 8px; }
    code { background: #161616; padding: 2px 6px; border-radius: 4px; font-size: 13px; border: 1px solid #222; }
    .section { margin-bottom: 32px; }
    .disclaimer { font-size: 11px; color: #444; margin-top: 64px; padding-top: 16px; border-top: 1px solid #222; }
  </style>
</head>
<body>
  <h1>DESIGN.md Preview</h1>
  <p style="color:#666;margin-bottom:8px">${esc(data.url)}</p>
  <p style="color:#888;font-size:13px">Consistency: <strong style="color:${data.consistencyScore.overall > 75 ? '#3bf0a0' : '#ffb86c'}">${data.consistencyScore.overall}/100</strong></p>

  <h2>Consistency Score</h2>
  <div class="section">
    ${scoreBar("Color", data.consistencyScore.color)}
    ${scoreBar("Typography", data.consistencyScore.typography)}
    ${scoreBar("Spacing", data.consistencyScore.spacing)}
    ${scoreBar("Radius", data.consistencyScore.radius)}
    ${scoreBar("Shadows", data.consistencyScore.shadow)}
    ${scoreBar("A11y", data.consistencyScore.accessibility)}
  </div>

  <h2>Colors (${esc(data.colorHarmony.type)})</h2>
  <div class="section">${colors}</div>

  <h2>Typography</h2>
  <div class="section">${fontSamples}</div>

  <h2>Spacing Scale${data.gridSystem ? ` (${data.gridSystem.base}px grid)` : ""}</h2>
  <div class="section" style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
    ${data.spacingScale.slice(0, 14).map(s =>
      `<div style="text-align:center"><div style="width:${Math.min(s.px, 80)}px;height:${Math.min(s.px, 80)}px;background:rgba(59,240,160,0.12);border:1px solid rgba(59,240,160,0.25);border-radius:4px"></div><div style="font-size:10px;color:#555;font-family:monospace;margin-top:4px">${esc(s.value)}</div></div>`
    ).join("")}
  </div>

  <h2>Border Radius</h2>
  <div class="section" style="display:flex;gap:16px;flex-wrap:wrap">
    ${data.radii.map(r =>
      `<div style="width:64px;height:64px;background:#161616;border:1px solid #333;border-radius:${escAttr(r.value)};display:flex;align-items:center;justify-content:center;font-size:10px;font-family:monospace;color:#888">${esc(r.value)}</div>`
    ).join("")}
  </div>

  <h2>Shadows</h2>
  <div class="section" style="display:flex;gap:16px;flex-wrap:wrap">
    ${data.shadows.map(s =>
      `<div style="width:120px;height:80px;background:#161616;border-radius:8px;box-shadow:${escAttr(s.value)};display:flex;align-items:center;justify-content:center;font-size:11px;color:#666;font-family:monospace">${esc(s.level)}</div>`
    ).join("")}
  </div>

  <div class="disclaimer">
    Generated by designsnap for educational and experimental purposes only.
    Extracted design tokens represent publicly visible computed CSS values. No ownership of any visual identity is claimed.
  </div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function kebab(s) { return s.replace(/([A-Z])/g, "-$1").toLowerCase(); }
function weightName(w) {
  return { 100: "Thin", 200: "ExtraLight", 300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold", 900: "Black" }[w] || w;
}

function esc(s) {
  if (typeof s !== "string") return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

function escAttr(s) {
  if (typeof s !== "string") return "";
  return s.replace(/[^a-zA-Z0-9 ,._:;%()\-#/]/g, "");
}
