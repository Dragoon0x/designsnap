/**
 * analyzer.js — Deep design system analysis
 *
 * Clusters, scores, and infers design intent from raw extracted data.
 * Includes consistency scoring, grid system detection, color harmony
 * analysis, and semantic token naming.
 *
 * For educational and experimental purposes only.
 */

import { detectFrameworks, scoreCompleteness } from "./detectors.js";

// ═══════════════════════════════════════════════════════════════
// Color utilities
// ═══════════════════════════════════════════════════════════════

function hexToRgb(hex) {
  if (!hex?.startsWith("#")) return null;
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  if (hex.length !== 6) return null;
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function colorDistance(hex1, hex2) {
  const a = hexToRgb(hex1), b = hexToRgb(hex2);
  if (!a || !b) return Infinity;
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
  const l1 = luminance(hex1), l2 = luminance(hex2);
  if (l1 === null || l2 === null) return null;
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

// ═══════════════════════════════════════════════════════════════
// Color analysis
// ═══════════════════════════════════════════════════════════════

function clusterColors(colorMap, threshold = 20) {
  const entries = Object.entries(colorMap)
    .filter(([hex]) => hex?.startsWith("#") && hex.length === 7)
    .sort((a, b) => b[1] - a[1]);

  const clusters = [];
  const used = new Set();

  for (const [hex, count] of entries) {
    if (used.has(hex)) continue;
    const cluster = { representative: hex, count, members: [hex] };
    for (const [other] of entries) {
      if (other === hex || used.has(other)) continue;
      if (colorDistance(hex, other) < threshold) {
        cluster.members.push(other);
        cluster.count += colorMap[other];
        used.add(other);
      }
    }
    used.add(hex);
    clusters.push(cluster);
  }

  return clusters.sort((a, b) => b.count - a.count);
}

function inferColorRole(hex, bgCount, textCount, borderCount) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "unknown";
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  if (hsl.l > 97) return "background";
  if (hsl.l > 93) return "surface";
  if (hsl.l < 5) return "text-primary";
  if (hsl.l < 20) return "text-secondary";
  if (hsl.s > 60 && hsl.l > 35 && hsl.l < 65) return "accent";
  if (hsl.s > 50 && hsl.l > 60) return "accent-light";
  if (hsl.s > 50 && hsl.l < 35) return "accent-dark";
  if (bgCount > textCount * 2 && hsl.l > 80) return "surface";
  if (textCount > bgCount * 2) return "text";
  if (borderCount > textCount) return "border";
  if (hsl.s < 10) return "neutral";
  return "neutral";
}

function analyzeColorHarmony(colors) {
  const chromatic = colors.filter(c => c.hsl && c.hsl.s > 15);
  if (chromatic.length < 2) return { type: "monochromatic", description: "Single hue or achromatic palette" };

  const hues = chromatic.map(c => c.hsl.h);
  const uniqueHues = [...new Set(hues.map(h => Math.round(h / 30) * 30))];

  if (uniqueHues.length === 1) return { type: "monochromatic", description: "Variations of a single hue" };

  // Check for complementary (opposite on wheel)
  for (let i = 0; i < uniqueHues.length; i++) {
    for (let j = i + 1; j < uniqueHues.length; j++) {
      const diff = Math.abs(uniqueHues[i] - uniqueHues[j]);
      if (diff > 150 && diff < 210) return { type: "complementary", description: "Opposing hues creating high contrast" };
    }
  }

  // Check for analogous (adjacent hues)
  const sorted = [...uniqueHues].sort((a, b) => a - b);
  const maxGap = Math.max(...sorted.map((h, i) => i > 0 ? h - sorted[i - 1] : 0));
  if (maxGap < 90 && uniqueHues.length <= 4) return { type: "analogous", description: "Adjacent hues creating visual harmony" };

  // Check for triadic
  if (uniqueHues.length === 3) {
    const gaps = sorted.map((h, i) => i > 0 ? h - sorted[i - 1] : 360 - sorted[sorted.length - 1] + sorted[0]);
    if (gaps.every(g => g > 80 && g < 160)) return { type: "triadic", description: "Three evenly spaced hues" };
  }

  return { type: "mixed", description: `${uniqueHues.length} distinct hue groups` };
}

function generateColorPairings(colors) {
  const pairs = [];
  const backgrounds = colors.filter(c => ["background", "surface"].includes(c.role));
  const foregrounds = colors.filter(c => c.role.includes("text") || c.role === "accent");

  for (const bg of backgrounds) {
    for (const fg of foregrounds) {
      const ratio = contrastRatio(fg.hex, bg.hex);
      if (ratio !== null) {
        pairs.push({
          fg: fg.hex, bg: bg.hex,
          fgRole: fg.role, bgRole: bg.role,
          ratio,
          aa: ratio >= 4.5,
          aaa: ratio >= 7,
          aaLarge: ratio >= 3,
        });
      }
    }
  }

  return pairs.sort((a, b) => b.ratio - a.ratio);
}

// ═══════════════════════════════════════════════════════════════
// Typography analysis
// ═══════════════════════════════════════════════════════════════

function cleanFontFamily(raw) {
  return raw.split(",")
    .map(f => f.trim().replace(/^["']|["']$/g, ""))
    .map(f => f.replace(/<[^>]*>/g, "").replace(/[<>"'`=]/g, "").trim())
    .filter(f => f && f !== "inherit" && f !== "initial" && f.length < 100);
}

function buildTypeScale(fontSizeMap, headings) {
  const sizes = Object.entries(fontSizeMap)
    .map(([size, count]) => ({ size, px: parseFloat(size), count }))
    .filter(s => !isNaN(s.px))
    .sort((a, b) => b.px - a.px);

  const headingMap = {};
  for (const h of headings) {
    const level = `h${h.level}`;
    if (!headingMap[level]) {
      headingMap[level] = {
        size: h.fontSize, weight: h.fontWeight, lineHeight: h.lineHeight,
        letterSpacing: h.letterSpacing, textTransform: h.textTransform,
        fontFamily: h.fontFamily, color: h.color,
      };
    }
  }

  // Detect type scale ratio
  const distinctSizes = [...new Set(sizes.map(s => Math.round(s.px)))].sort((a, b) => a - b).filter(s => s >= 10 && s <= 72);
  let scaleRatio = null;
  if (distinctSizes.length >= 4) {
    const ratios = [];
    for (let i = 1; i < distinctSizes.length; i++) {
      ratios.push(Math.round((distinctSizes[i] / distinctSizes[i - 1]) * 100) / 100);
    }
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const variance = ratios.reduce((a, r) => a + Math.pow(r - avgRatio, 2), 0) / ratios.length;
    if (variance < 0.03) {
      const known = [
        { name: "Minor Second", ratio: 1.067 },
        { name: "Major Second", ratio: 1.125 },
        { name: "Minor Third", ratio: 1.2 },
        { name: "Major Third", ratio: 1.25 },
        { name: "Perfect Fourth", ratio: 1.333 },
        { name: "Augmented Fourth", ratio: 1.414 },
        { name: "Perfect Fifth", ratio: 1.5 },
        { name: "Golden Ratio", ratio: 1.618 },
      ];
      const match = known.find(k => Math.abs(k.ratio - avgRatio) < 0.06);
      scaleRatio = match ? { ...match, detected: avgRatio } : { name: "Custom", ratio: avgRatio, detected: avgRatio };
    }
  }

  return { sizes: sizes.slice(0, 15), headingMap, scaleRatio, distinctSizes };
}

// ═══════════════════════════════════════════════════════════════
// Spacing analysis
// ═══════════════════════════════════════════════════════════════

function buildSpacingScale(spacingMap) {
  const values = Object.entries(spacingMap)
    .map(([val, count]) => ({ value: val, px: parseFloat(val), count }))
    .filter(s => !isNaN(s.px) && s.px > 0 && s.px <= 200)
    .sort((a, b) => a.px - b.px);

  const scale = [];
  for (const v of values) {
    const existing = scale.find(s => Math.abs(s.px - v.px) < 2);
    if (existing) existing.count += v.count;
    else scale.push({ ...v });
  }

  return scale.sort((a, b) => a.px - b.px).slice(0, 24);
}

function detectGridSystem(spacingScale) {
  if (spacingScale.length < 4) return null;

  const pxValues = spacingScale.map(s => s.px);
  const candidates = [4, 5, 6, 8, 10];
  let bestBase = null;
  let bestScore = 0;

  for (const base of candidates) {
    let onGrid = 0;
    let total = 0;
    for (const px of pxValues) {
      total++;
      if (px % base === 0 || Math.abs(px % base) <= 1) onGrid++;
    }
    const score = onGrid / total;
    if (score > bestScore) {
      bestScore = score;
      bestBase = base;
    }
  }

  if (bestScore > 0.5) {
    return {
      base: bestBase,
      adherence: Math.round(bestScore * 100),
      suggestedScale: Array.from({ length: 12 }, (_, i) => bestBase * (i + 1)),
    };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// Component analysis
// ═══════════════════════════════════════════════════════════════

function analyzeComponents(componentData) {
  const components = [];

  const dedup = (arr, keys) => {
    const seen = new Set();
    return arr.filter(item => {
      const sig = keys.map(k => item[k] || "").join("|");
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  };

  if (componentData.buttons.length > 0) {
    const styles = dedup(componentData.buttons, ["bgColor", "color", "borderRadius", "fontSize"]);
    components.push({
      type: "button", count: componentData.buttons.length,
      variants: styles.slice(0, 6).map(s => ({
        bgColor: s.bgColor, color: s.color, borderRadius: s.borderRadius,
        padding: s.padding, fontSize: s.fontSize, fontWeight: s.fontWeight,
        border: s.border, boxShadow: s.boxShadow, textTransform: s.textTransform,
        transition: s.transition, sample: s.text || "",
      })),
    });
  }

  if (componentData.inputs.length > 0) {
    const styles = dedup(componentData.inputs, ["bgColor", "border", "borderRadius"]);
    components.push({
      type: "input", count: componentData.inputs.length,
      variants: styles.slice(0, 4).map(s => ({
        bgColor: s.bgColor, color: s.color, border: s.border,
        borderRadius: s.borderRadius, padding: s.padding, fontSize: s.fontSize,
      })),
    });
  }

  if (componentData.cards.length > 0) {
    const styles = dedup(componentData.cards, ["bgColor", "borderRadius", "boxShadow"]);
    components.push({
      type: "card", count: componentData.cards.length,
      variants: styles.slice(0, 4).map(s => ({
        bgColor: s.bgColor, borderRadius: s.borderRadius, boxShadow: s.boxShadow,
        padding: s.padding, border: s.border,
      })),
    });
  }

  if (componentData.nav.length > 0) {
    components.push({
      type: "navigation", count: componentData.nav.length,
      variants: componentData.nav.slice(0, 2).map(s => ({
        bgColor: s.bgColor, color: s.color, padding: s.padding,
        boxShadow: s.boxShadow, height: s.height, position: s.position,
      })),
    });
  }

  if (componentData.links.length > 0) {
    const styles = dedup(componentData.links, ["color", "textDecoration"]);
    components.push({
      type: "link", count: componentData.links.length,
      variants: styles.slice(0, 4).map(s => ({
        color: s.color, textDecoration: s.textDecoration,
        fontWeight: s.fontWeight, fontSize: s.fontSize,
      })),
    });
  }

  if (componentData.badges.length > 0) {
    const styles = dedup(componentData.badges, ["bgColor", "color", "borderRadius"]);
    components.push({
      type: "badge", count: componentData.badges.length,
      variants: styles.slice(0, 4).map(s => ({
        bgColor: s.bgColor, color: s.color, borderRadius: s.borderRadius,
        padding: s.padding, fontSize: s.fontSize, sample: s.text || "",
      })),
    });
  }

  if (componentData.lists.length > 0) {
    components.push({
      type: "list", count: componentData.lists.length,
      variants: componentData.lists.slice(0, 3).map(s => ({
        listStyle: s.listStyle, padding: s.padding, fontSize: s.fontSize,
      })),
    });
  }

  return components;
}

// ═══════════════════════════════════════════════════════════════
// Shadow analysis
// ═══════════════════════════════════════════════════════════════

function analyzeShadows(shadowMap) {
  return Object.entries(shadowMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([shadow, count]) => {
      let level = "sm";
      const yMatch = shadow.match(/(\d+)px\s+(\d+)px\s+(\d+)px/);
      if (yMatch) {
        const blur = parseInt(yMatch[3]);
        if (blur > 40) level = "2xl";
        else if (blur > 30) level = "xl";
        else if (blur > 20) level = "lg";
        else if (blur > 10) level = "md";
      }
      return { value: shadow, count, level };
    });
}

// ═══════════════════════════════════════════════════════════════
// Consistency scoring
// ═══════════════════════════════════════════════════════════════

function calculateConsistencyScore(data) {
  const scores = {};
  let total = 0;
  let count = 0;

  // Color consistency: fewer distinct colors = more consistent
  const colorCount = data.colors.length;
  scores.color = colorCount <= 8 ? 95 : colorCount <= 12 ? 80 : colorCount <= 16 ? 65 : 45;
  total += scores.color; count++;

  // Typography consistency: fewer font families = better
  const fontCount = data.fonts.length;
  scores.typography = fontCount <= 2 ? 95 : fontCount <= 3 ? 80 : fontCount <= 4 ? 60 : 40;
  total += scores.typography; count++;

  // Spacing consistency: adherence to grid
  if (data.gridSystem) {
    scores.spacing = data.gridSystem.adherence;
  } else {
    scores.spacing = 50;
  }
  total += scores.spacing; count++;

  // Radius consistency: fewer distinct values = better
  const radiusCount = data.radii.length;
  scores.radius = radiusCount <= 3 ? 95 : radiusCount <= 5 ? 80 : radiusCount <= 7 ? 60 : 40;
  total += scores.radius; count++;

  // Shadow consistency
  const shadowCount = data.shadows.length;
  scores.shadow = shadowCount <= 3 ? 95 : shadowCount <= 5 ? 80 : shadowCount <= 8 ? 60 : 40;
  total += scores.shadow; count++;

  // Accessibility
  const contrastIssues = data.accessibility?.contrastIssues?.length || 0;
  scores.accessibility = contrastIssues === 0 ? 100 : contrastIssues <= 3 ? 75 : contrastIssues <= 8 ? 50 : 25;
  total += scores.accessibility; count++;

  scores.overall = Math.round(total / count);

  return scores;
}

// ═══════════════════════════════════════════════════════════════
// Main analysis
// ═══════════════════════════════════════════════════════════════

export function analyze(extracted) {
  const { rawStyles, cssVars, externalFonts, meta, darkModeData,
    gradients, layoutPatterns, breakpoints, motionSystem,
    accessibility, imageTreatments, iconSystem,
    interactiveStates, responsiveData } = extracted;

  const maps = rawStyles.maps;

  // ── Colors ─────────────────────────────────────────────────
  const allColorMap = {};
  for (const [hex, count] of Object.entries(maps.color)) allColorMap[hex] = (allColorMap[hex] || 0) + count;
  for (const [hex, count] of Object.entries(maps.bgColor)) allColorMap[hex] = (allColorMap[hex] || 0) + count;
  for (const [hex, count] of Object.entries(maps.borderColor)) allColorMap[hex] = (allColorMap[hex] || 0) + count;

  const mergedClusters = clusterColors(allColorMap);
  const colors = mergedClusters.slice(0, 24).map(c => {
    const hex = c.representative;
    const rgb = hexToRgb(hex);
    const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
    const bgCount = maps.bgColor[hex] || 0;
    const textCount = maps.color[hex] || 0;
    const borderCount = maps.borderColor[hex] || 0;
    return { hex, hsl, count: c.count, role: inferColorRole(hex, bgCount, textCount, borderCount), members: c.members };
  });

  const colorHarmony = analyzeColorHarmony(colors);
  const colorPairings = generateColorPairings(colors);

  // ── Typography ─────────────────────────────────────────────
  const fontEntries = Object.entries(maps.font).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const fonts = fontEntries.map(([raw, count], i) => ({
    stack: raw.replace(/<[^>]*>/g, "").replace(/[<>"'`=]/g, ""),
    families: cleanFontFamily(raw), count,
    role: i === 0 ? "primary" : i === 1 ? "secondary" : "tertiary",
  }));

  const { sizes: typeSizes, headingMap, scaleRatio, distinctSizes } = buildTypeScale(maps.fontSize, rawStyles.componentData.headings);

  // ── Spacing ────────────────────────────────────────────────
  const spacingScale = buildSpacingScale(maps.spacing);
  const gridSystem = detectGridSystem(spacingScale);

  // ── Depth ──────────────────────────────────────────────────
  const radii = Object.entries(maps.radius).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([v, c]) => ({ value: v, px: parseFloat(v), count: c }));
  const shadows = analyzeShadows(maps.shadow);

  // ── Components ─────────────────────────────────────────────
  const components = analyzeComponents(rawStyles.componentData);

  // ── CSS variables ──────────────────────────────────────────
  const relevantVars = Object.entries(cssVars || {})
    .filter(([key]) => /color|bg|background|font|size|radius|shadow|spacing|gap|border|text|primary|secondary|accent/i.test(key))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

  // ── Z-index ────────────────────────────────────────────────
  const zIndices = Object.entries(maps.zIndex)
    .filter(([z]) => !isNaN(parseInt(z)))
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([v, c]) => ({ value: parseInt(v), count: c }));

  // ── Font weights ───────────────────────────────────────────
  const fontWeights = Object.entries(maps.fontWeight)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([w, c]) => ({ weight: w, count: c }));

  // ── Gradients ──────────────────────────────────────────────
  const gradientList = Object.entries(gradients || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([value, count]) => ({ value, count }));

  // ── Breakpoints ────────────────────────────────────────────
  const breakpointList = Object.entries(breakpoints || {})
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([px, ruleCount]) => ({ px: parseInt(px), ruleCount }));

  // ── Layout ─────────────────────────────────────────────────
  const containerWidths = Object.entries(layoutPatterns?.contentWidths || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([v, c]) => ({ value: v, count: c }));

  // ── Opacity ────────────────────────────────────────────────
  const opacityValues = Object.entries(maps.opacity || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([v, c]) => ({ value: v, count: c }));

  // ── Border system ──────────────────────────────────────────
  const borderWidths = Object.entries(maps.borderWidth || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([v, c]) => ({ value: v, count: c }));

  // ── Assemble ───────────────────────────────────────────────
  const data = {
    url: extracted.url, meta, colors, colorHarmony, colorPairings,
    fonts, typeSizes, headingMap, scaleRatio, distinctSizes,
    spacingScale, gridSystem, radii, shadows, components,
    cssVars: relevantVars, externalFonts, darkModeData,
    gradientList, breakpointList, containerWidths,
    layoutPatterns, motionSystem, accessibility,
    imageTreatments, iconSystem, interactiveStates,
    responsiveData, zIndices, fontWeights,
    opacityValues, borderWidths,
  };

  data.consistencyScore = calculateConsistencyScore(data);

  // Framework detection
  const componentClasses = [
    ...rawStyles.componentData.buttons.map(b => b.classes),
    ...rawStyles.componentData.cards.map(c => c.classes),
    ...rawStyles.componentData.nav.map(n => n.classes || ""),
  ].filter(Boolean);

  data.detectedFrameworks = detectFrameworks(cssVars, componentClasses, meta);
  data.completeness = scoreCompleteness(data);

  return data;
}
