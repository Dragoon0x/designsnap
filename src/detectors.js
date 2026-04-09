/**
 * detectors.js — Framework detection and design completeness scoring
 *
 * Detects CSS frameworks, design system libraries, and scores
 * how complete the extracted design system is vs an ideal system.
 *
 * For educational and experimental purposes only.
 */

// ═══════════════════════════════════════════════════════════════
// Framework detection
// ═══════════════════════════════════════════════════════════════

const FRAMEWORK_SIGNATURES = {
  tailwind: {
    name: "Tailwind CSS",
    cssVarPatterns: [/--tw-/],
    classPatterns: [/\b(flex|grid|p-\d|m-\d|text-\w|bg-\w|rounded|shadow|border)\b/],
    metaHints: ["tailwindcss"],
  },
  bootstrap: {
    name: "Bootstrap",
    cssVarPatterns: [/--bs-/],
    classPatterns: [/\b(container|row|col-|btn-|card-|navbar|modal|form-control)\b/],
    metaHints: ["bootstrap"],
  },
  materialUI: {
    name: "Material UI / MUI",
    cssVarPatterns: [/--mui-/, /--md-/],
    classPatterns: [/\bMui[A-Z]/, /\bmdc-/],
    metaHints: [],
  },
  chakra: {
    name: "Chakra UI",
    cssVarPatterns: [/--chakra-/],
    classPatterns: [/\bcss-[a-z0-9]+\b/],
    metaHints: [],
  },
  antDesign: {
    name: "Ant Design",
    cssVarPatterns: [/--ant-/],
    classPatterns: [/\bant-[a-z]/],
    metaHints: [],
  },
  radix: {
    name: "Radix UI",
    cssVarPatterns: [],
    classPatterns: [/\bradix-/, /data-radix/],
    metaHints: [],
  },
  shadcn: {
    name: "shadcn/ui",
    cssVarPatterns: [/--radius/, /--primary/, /--muted/, /--card/, /--popover/],
    classPatterns: [],
    metaHints: [],
  },
  foundation: {
    name: "Foundation",
    cssVarPatterns: [],
    classPatterns: [/\bcallout\b/, /\bsmall-\d+\b/, /\blarge-\d+\b/],
    metaHints: ["foundation"],
  },
  bulma: {
    name: "Bulma",
    cssVarPatterns: [/--bulma-/],
    classPatterns: [/\bis-\w/, /\bcolumns\b/, /\bcolumn\b/, /\bnotification\b/],
    metaHints: ["bulma"],
  },
};

export function detectFrameworks(cssVars, componentClasses, meta) {
  const detected = [];
  const varKeys = Object.keys(cssVars || {});

  for (const [id, sig] of Object.entries(FRAMEWORK_SIGNATURES)) {
    let score = 0;
    let signals = [];

    // CSS variable patterns
    for (const pattern of sig.cssVarPatterns) {
      const matches = varKeys.filter(k => pattern.test(k));
      if (matches.length > 0) {
        score += Math.min(matches.length * 10, 40);
        signals.push(`${matches.length} CSS vars matching ${pattern}`);
      }
    }

    // Class patterns (from component data)
    if (componentClasses) {
      for (const pattern of sig.classPatterns) {
        const matches = componentClasses.filter(c => pattern.test(c));
        if (matches.length > 0) {
          score += Math.min(matches.length * 5, 30);
          signals.push(`${matches.length} class matches`);
        }
      }
    }

    // Meta hints
    const generator = meta?.generator?.toLowerCase() || "";
    for (const hint of sig.metaHints) {
      if (generator.includes(hint)) {
        score += 30;
        signals.push(`meta generator: ${hint}`);
      }
    }

    if (score >= 20) {
      detected.push({
        id,
        name: sig.name,
        confidence: Math.min(score, 100),
        signals,
      });
    }
  }

  return detected.sort((a, b) => b.confidence - a.confidence);
}

// ═══════════════════════════════════════════════════════════════
// Design system completeness scoring
// ═══════════════════════════════════════════════════════════════

const COMPLETENESS_CRITERIA = [
  { key: "colors", label: "Color palette defined", weight: 10, check: d => d.colors.length >= 3 },
  { key: "colorRoles", label: "Color roles assigned (bg, text, accent)", weight: 8, check: d => {
    const roles = new Set(d.colors.map(c => c.role));
    return roles.has("background") && (roles.has("text-primary") || roles.has("text")) && roles.has("accent");
  }},
  { key: "primaryFont", label: "Primary font defined", weight: 8, check: d => d.fonts.length >= 1 },
  { key: "secondaryFont", label: "Secondary font defined", weight: 4, check: d => d.fonts.length >= 2 },
  { key: "typeScale", label: "Type scale with 4+ sizes", weight: 8, check: d => d.typeSizes.length >= 4 },
  { key: "headings", label: "Heading hierarchy (h1-h3)", weight: 8, check: d => {
    const levels = Object.keys(d.headingMap);
    return levels.includes("h1") && levels.includes("h2") && levels.includes("h3");
  }},
  { key: "spacingScale", label: "Spacing scale with 6+ values", weight: 8, check: d => d.spacingScale.length >= 6 },
  { key: "gridSystem", label: "Consistent spacing grid", weight: 6, check: d => d.gridSystem && d.gridSystem.adherence >= 60 },
  { key: "borderRadius", label: "Border radius system", weight: 5, check: d => d.radii.length >= 2 },
  { key: "shadowSystem", label: "Shadow elevation system", weight: 5, check: d => d.shadows.length >= 2 },
  { key: "buttons", label: "Button component with variants", weight: 6, check: d => {
    const btn = d.components.find(c => c.type === "button");
    return btn && btn.variants.length >= 2;
  }},
  { key: "inputs", label: "Input component", weight: 4, check: d => d.components.some(c => c.type === "input") },
  { key: "cards", label: "Card component", weight: 3, check: d => d.components.some(c => c.type === "card") },
  { key: "navigation", label: "Navigation component", weight: 4, check: d => d.components.some(c => c.type === "navigation") },
  { key: "transitions", label: "Motion/transition system", weight: 4, check: d => d.motionSystem && Object.keys(d.motionSystem.durations).length >= 2 },
  { key: "darkMode", label: "Dark mode support", weight: 5, check: d => !!d.darkModeData },
  { key: "responsive", label: "Responsive breakpoints", weight: 5, check: d => d.breakpointList.length >= 2 },
  { key: "focusStyles", label: "Focus styles defined", weight: 4, check: d => d.accessibility?.focusVisible },
  { key: "cssVars", label: "CSS custom properties used", weight: 5, check: d => Object.keys(d.cssVars).length >= 5 },
  { key: "iconSystem", label: "Icon system present", weight: 3, check: d => d.iconSystem && (d.iconSystem.svgInline > 3 || d.iconSystem.iconFont) },
];

export function scoreCompleteness(data) {
  let totalWeight = 0;
  let earnedWeight = 0;
  const details = [];

  for (const criterion of COMPLETENESS_CRITERIA) {
    totalWeight += criterion.weight;
    let met = false;
    try {
      met = criterion.check(data);
    } catch (e) {
      met = false;
    }
    if (met) earnedWeight += criterion.weight;
    details.push({
      key: criterion.key,
      label: criterion.label,
      weight: criterion.weight,
      met,
    });
  }

  return {
    score: Math.round((earnedWeight / totalWeight) * 100),
    earned: earnedWeight,
    total: totalWeight,
    met: details.filter(d => d.met).length,
    totalCriteria: details.length,
    details,
    missing: details.filter(d => !d.met),
    present: details.filter(d => d.met),
  };
}
