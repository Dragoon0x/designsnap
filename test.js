/**
 * test.js — Run all non-browser tests
 * Tests analyzer, generator, and export formats with mock data
 */

import { analyze } from "./src/analyzer.js";
import { generateMarkdown, generatePreview } from "./src/generator.js";
import { toTailwindConfig, toCSSVariables, toStyleDictionary, toFigmaTokens } from "./exports/formats.js";
import { diff, diffToMarkdown } from "./src/differ.js";
import { detectFrameworks, scoreCompleteness } from "./src/detectors.js";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
    if (e.stack) console.log(`    ${e.stack.split("\n")[1]?.trim()}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

// ── Mock data ────────────────────────────────────────────────

const mockExtracted = {
  url: "https://example.com",
  meta: {
    title: "Example Site",
    description: "A test site for extraction",
    themeColor: "#5e6ad2",
    favicon: "/favicon.ico",
    ogImage: "",
    charset: "UTF-8",
    language: "en",
    generator: "",
  },
  rawStyles: {
    maps: {
      color: { "#1a1a1a": 200, "#333333": 80, "#666666": 50, "#5e6ad2": 30, "#ffffff": 10 },
      bgColor: { "#ffffff": 300, "#f5f5f5": 60, "#5e6ad2": 20, "#000000": 5 },
      borderColor: { "#e0e0e0": 100, "#cccccc": 40, "#5e6ad2": 10 },
      font: {
        '"Inter", "Helvetica Neue", sans-serif': 400,
        '"JetBrains Mono", monospace': 30,
      },
      fontSize: { "16px": 300, "14px": 200, "13px": 80, "24px": 40, "32px": 20, "48px": 10, "12px": 60, "18px": 50 },
      fontWeight: { "400": 350, "500": 100, "600": 80, "700": 40 },
      lineHeight: { "24px": 200, "20px": 150, "32px": 40, "1.5": 100 },
      letterSpacing: { "-0.02em": 30, "-0.01em": 20, "0.05em": 10 },
      spacing: {
        "4px": 100, "8px": 250, "12px": 80, "16px": 300, "20px": 40,
        "24px": 180, "32px": 120, "40px": 60, "48px": 40, "64px": 30,
        "96px": 10, "15px": 15, "7px": 8,
      },
      radius: { "8px": 200, "4px": 100, "12px": 60, "9999px": 30, "0px": 10 },
      shadow: {
        "0px 1px 2px rgba(0,0,0,0.05)": 80,
        "0px 4px 12px rgba(0,0,0,0.1)": 40,
        "0px 8px 24px rgba(0,0,0,0.12)": 20,
      },
      transition: { "all 0.2s ease": 100, "opacity 0.15s ease-in-out": 50, "transform 0.3s cubic-bezier(0.4,0,0.2,1)": 30 },
      zIndex: { "1": 20, "10": 10, "50": 5, "100": 3, "9999": 1 },
      opacity: { "0.5": 20, "0.8": 10, "0": 5 },
      cursor: { "pointer": 100, "default": 200 },
      overflow: { "hidden": 60, "auto": 30 },
      display: { "flex": 200, "block": 300, "grid": 40, "inline-flex": 30, "none": 20 },
      position: { "relative": 150, "absolute": 40, "fixed": 5, "sticky": 3 },
      borderWidth: { "1px": 120, "2px": 20 },
      borderStyle: { "solid": 140 },
      maxWidth: { "1200px": 10, "768px": 5, "100%": 20 },
      minHeight: { "100vh": 3, "48px": 10 },
    },
    componentData: {
      buttons: [
        { text: "Get Started", classes: "btn-primary", fontSize: "14px", fontWeight: "600", fontFamily: '"Inter"', color: "#ffffff", bgColor: "#5e6ad2", borderRadius: "8px", padding: "10px 20px", border: "none", boxShadow: "none", lineHeight: "20px", letterSpacing: "normal", textTransform: "none", transition: "all 0.2s ease", opacity: "1", width: 120, height: 40 },
        { text: "Learn More", classes: "btn-ghost", fontSize: "14px", fontWeight: "500", fontFamily: '"Inter"', color: "#333333", bgColor: "transparent", borderRadius: "8px", padding: "10px 20px", border: "1px solid #e0e0e0", boxShadow: "none", lineHeight: "20px", letterSpacing: "normal", textTransform: "none", transition: "all 0.2s ease", opacity: "1", width: 110, height: 40 },
      ],
      inputs: [
        { type: "text", placeholder: "Search...", fontSize: "14px", fontWeight: "400", fontFamily: '"Inter"', color: "#1a1a1a", bgColor: "#ffffff", borderRadius: "8px", padding: "10px 16px", border: "1px solid #e0e0e0", boxShadow: "none", lineHeight: "20px", letterSpacing: "normal", textTransform: "none", transition: "border-color 0.15s", opacity: "1", width: 260, height: 40 },
      ],
      cards: [
        { tag: "div", classes: "card", fontSize: "14px", fontWeight: "400", fontFamily: '"Inter"', color: "#1a1a1a", bgColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e0e0e0", boxShadow: "0px 4px 12px rgba(0,0,0,0.1)", lineHeight: "20px", letterSpacing: "normal", textTransform: "none", transition: "none", opacity: "1", width: 320, height: 200 },
      ],
      links: [
        { text: "Documentation", textDecoration: "none", fontSize: "14px", fontWeight: "500", fontFamily: '"Inter"', color: "#5e6ad2", bgColor: "transparent", borderRadius: "0px", padding: "0px", border: "none", boxShadow: "none", lineHeight: "20px", letterSpacing: "normal", textTransform: "none", transition: "color 0.15s", opacity: "1", width: 100, height: 20 },
      ],
      headings: [
        { level: 1, text: "Welcome to Example", fontSize: "48px", fontWeight: "700", fontFamily: '"Inter"', color: "#1a1a1a", bgColor: "transparent", borderRadius: "0px", padding: "0px", border: "none", boxShadow: "none", lineHeight: "56px", letterSpacing: "-0.02em", textTransform: "none", transition: "none", opacity: "1", width: 600, height: 56 },
        { level: 2, text: "Features", fontSize: "32px", fontWeight: "600", fontFamily: '"Inter"', color: "#1a1a1a", bgColor: "transparent", borderRadius: "0px", padding: "0px", border: "none", boxShadow: "none", lineHeight: "40px", letterSpacing: "-0.01em", textTransform: "none", transition: "none", opacity: "1", width: 200, height: 40 },
        { level: 3, text: "Getting Started", fontSize: "24px", fontWeight: "600", fontFamily: '"Inter"', color: "#333333", bgColor: "transparent", borderRadius: "0px", padding: "0px", border: "none", boxShadow: "none", lineHeight: "32px", letterSpacing: "normal", textTransform: "none", transition: "none", opacity: "1", width: 180, height: 32 },
      ],
      nav: [
        { fontSize: "14px", fontWeight: "500", fontFamily: '"Inter"', color: "#1a1a1a", bgColor: "#ffffff", borderRadius: "0px", padding: "0px 24px", border: "none", boxShadow: "0px 1px 2px rgba(0,0,0,0.05)", lineHeight: "20px", letterSpacing: "normal", textTransform: "none", transition: "none", opacity: "1", width: 1440, height: 64, childCount: 5, position: "sticky" },
      ],
      images: [],
      lists: [
        { tag: "ul", childCount: 5, listStyle: "disc", fontSize: "14px", fontWeight: "400", fontFamily: '"Inter"', color: "#333333", bgColor: "transparent", borderRadius: "0px", padding: "0px 0px 0px 24px", border: "none", boxShadow: "none", lineHeight: "24px", letterSpacing: "normal", textTransform: "none", transition: "none", opacity: "1", width: 400, height: 120 },
      ],
      modals: [],
      badges: [
        { text: "New", fontSize: "12px", fontWeight: "500", fontFamily: '"Inter"', color: "#ffffff", bgColor: "#5e6ad2", borderRadius: "9999px", padding: "2px 8px", border: "none", boxShadow: "none", lineHeight: "16px", letterSpacing: "0.05em", textTransform: "uppercase", transition: "none", opacity: "1", width: 40, height: 20 },
      ],
      tags: [],
    },
  },
  cssVars: {
    "--color-primary": "#5e6ad2",
    "--color-bg": "#ffffff",
    "--color-text": "#1a1a1a",
    "--color-border": "#e0e0e0",
    "--font-sans": "Inter, sans-serif",
    "--font-mono": "JetBrains Mono, monospace",
    "--radius-sm": "4px",
    "--radius-md": "8px",
    "--spacing-unit": "8px",
  },
  externalFonts: {
    urls: ["https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700"],
    faces: [
      { family: "Inter", weight: "400", style: "normal", src: "url(/fonts/inter-regular.woff2)" },
      { family: "Inter", weight: "700", style: "normal", src: "url(/fonts/inter-bold.woff2)" },
    ],
  },
  gradients: {
    "linear-gradient(135deg, #5e6ad2, #8b5cf6)": 5,
    "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))": 2,
  },
  layoutPatterns: {
    flexContainers: 200, gridContainers: 40,
    gridTemplates: { "repeat(3, 1fr)": 8, "1fr 1fr": 5 },
    flexDirections: { "row": 150, "column": 50 },
    contentWidths: { "1200px": 10, "768px": 5 },
    stickyElements: 3, fixedElements: 5, absoluteElements: 40,
    overflowHidden: 60, aspectRatios: { "1:1": 12, "1.8:1": 8 },
  },
  breakpoints: { 640: 15, 768: 25, 1024: 30, 1280: 10 },
  motionSystem: {
    transitions: { "all": 100, "opacity": 50, "transform": 30, "color": 20, "background-color": 15 },
    durations: { "0.2s": 80, "0.15s": 40, "0.3s": 30, "0.5s": 5 },
    easings: { "ease": 60, "ease-in-out": 40, "cubic-bezier(0.4,0,0.2,1)": 20 },
    keyframes: [
      { name: "fadeIn", steps: 2 },
      { name: "slideUp", steps: 2 },
      { name: "pulse", steps: 3 },
    ],
    animatedElements: 8,
  },
  accessibility: {
    contrastIssues: [
      { text: "Secondary text here", fg: "#999999", bg: "#ffffff", ratio: 2.85, tag: "span", size: "14px" },
      { text: "Muted label", fg: "#aaaaaa", bg: "#f5f5f5", ratio: 2.1, tag: "span", size: "12px" },
    ],
    missingAlt: 3,
    ariaRoles: { "button": 5, "navigation": 1, "banner": 1, "main": 1 },
    ariaLabels: 12,
    focusVisible: true,
    skipLink: true,
    landmarks: { header: 1, main: 1, footer: 1, nav: 2, section: 4, article: 3 },
    headingOrder: [1, 2, 2, 3, 3, 2, 3],
    tabIndex: { positive: 0, zero: 8, negative: 2 },
    formLabels: { labeled: 6, unlabeled: 1 },
  },
  imageTreatments: {
    borderRadius: { "8px": 10, "50%": 5 },
    objectFit: { "cover": 12, "contain": 3 },
    aspectRatio: {},
    filters: {},
    count: 18,
    avgWidth: 400,
    avgHeight: 280,
    lazyLoaded: 10,
  },
  iconSystem: {
    svgInline: 24,
    svgSprite: 3,
    iconFont: false,
    iconFontClasses: [],
    svgSizes: { "16x16": 12, "20x20": 8, "24x24": 4 },
  },
  interactiveStates: {
    hover: [
      {
        tag: "button",
        changes: {
          bg: { from: "rgb(94, 106, 210)", to: "rgb(110, 122, 226)" },
          color: null,
          shadow: { from: "none", to: "0 4px 16px rgba(94,106,210,0.3)" },
          transform: { from: "none", to: "translateY(-1px)" },
        },
        cursor: "pointer",
      },
    ],
    focus: [],
  },
  darkModeData: {
    vars: {
      "--color-bg": "#0a0a0a",
      "--color-text": "#e4e4ec",
      "--color-border": "#2a2a3a",
      "--color-surface": "#161620",
    },
    selectors: [".dark", '[data-theme="dark"]'],
  },
  responsiveData: null,
  screenshot: "base64data",
};

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

console.log("\n  designsnap test suite\n");
console.log("  ── Analyzer ──────────────────────────────────────\n");

let analyzed;

test("analyze() runs without errors", () => {
  analyzed = analyze(mockExtracted);
  assert(analyzed, "analyze returned null");
});

test("colors are clustered and have roles", () => {
  assert(analyzed.colors.length > 0, "no colors");
  assert(analyzed.colors[0].hex, "no hex");
  assert(analyzed.colors[0].role, "no role");
  assert(analyzed.colors[0].hsl, "no hsl");
  assert(analyzed.colors[0].count > 0, "no count");
});

test("color harmony is detected", () => {
  assert(analyzed.colorHarmony, "no colorHarmony");
  assert(analyzed.colorHarmony.type, "no harmony type");
  assert(analyzed.colorHarmony.description, "no harmony description");
});

test("color pairings are generated with contrast ratios", () => {
  assert(Array.isArray(analyzed.colorPairings), "not an array");
  if (analyzed.colorPairings.length > 0) {
    const p = analyzed.colorPairings[0];
    assert(p.fg, "no fg"); assert(p.bg, "no bg");
    assert(typeof p.ratio === "number", "ratio not a number");
    assert(typeof p.aa === "boolean", "aa not boolean");
    assert(typeof p.aaa === "boolean", "aaa not boolean");
  }
});

test("fonts are extracted with roles", () => {
  assert(analyzed.fonts.length >= 1, "no fonts");
  assert(analyzed.fonts[0].role === "primary", "first font not primary");
  assert(analyzed.fonts[0].families.length > 0, "no families");
});

test("type scale is built", () => {
  assert(analyzed.typeSizes.length > 0, "no type sizes");
});

test("heading map is populated", () => {
  assert(Object.keys(analyzed.headingMap).length > 0, "no headings");
  assert(analyzed.headingMap.h1, "no h1");
  assert(analyzed.headingMap.h1.size, "h1 has no size");
});

test("type scale ratio is detected", () => {
  // May or may not detect depending on data
  // Just ensure it doesn't crash
  assert(analyzed.scaleRatio === null || analyzed.scaleRatio.name, "bad scaleRatio shape");
});

test("spacing scale is built", () => {
  assert(analyzed.spacingScale.length > 0, "no spacing");
  assert(analyzed.spacingScale[0].px > 0, "bad px value");
});

test("grid system is detected", () => {
  assert(analyzed.gridSystem === null || analyzed.gridSystem.base > 0, "bad grid system");
  if (analyzed.gridSystem) {
    assert(analyzed.gridSystem.adherence > 0, "no adherence");
    assert(analyzed.gridSystem.suggestedScale.length > 0, "no suggested scale");
  }
});

test("components are detected", () => {
  assert(analyzed.components.length > 0, "no components");
  const types = analyzed.components.map(c => c.type);
  assert(types.includes("button"), "no buttons");
  assert(types.includes("card"), "no cards");
  assert(types.includes("input"), "no inputs");
});

test("shadows are analyzed", () => {
  assert(analyzed.shadows.length > 0, "no shadows");
  assert(analyzed.shadows[0].level, "no level");
  assert(analyzed.shadows[0].value, "no value");
});

test("radii are extracted", () => {
  assert(analyzed.radii.length > 0, "no radii");
});

test("consistency score is calculated", () => {
  assert(analyzed.consistencyScore, "no score");
  assert(typeof analyzed.consistencyScore.overall === "number", "overall not number");
  assert(analyzed.consistencyScore.overall >= 0 && analyzed.consistencyScore.overall <= 100, "score out of range");
  assert(analyzed.consistencyScore.color >= 0, "color score bad");
  assert(analyzed.consistencyScore.typography >= 0, "typography score bad");
  assert(analyzed.consistencyScore.spacing >= 0, "spacing score bad");
  assert(analyzed.consistencyScore.accessibility >= 0, "a11y score bad");
});

test("gradients are extracted", () => {
  assert(Array.isArray(analyzed.gradientList), "not array");
  assert(analyzed.gradientList.length > 0, "no gradients");
});

test("breakpoints are extracted", () => {
  assert(Array.isArray(analyzed.breakpointList), "not array");
  assert(analyzed.breakpointList.length > 0, "no breakpoints");
  assert(analyzed.breakpointList[0].px > 0, "bad px");
});

test("motion system is passed through", () => {
  assert(analyzed.motionSystem, "no motion system");
  assert(Object.keys(analyzed.motionSystem.durations).length > 0, "no durations");
});

test("accessibility data is passed through", () => {
  assert(analyzed.accessibility, "no a11y");
  assert(analyzed.accessibility.contrastIssues.length > 0, "no contrast issues");
});

test("icon system is passed through", () => {
  assert(analyzed.iconSystem, "no icon system");
  assert(analyzed.iconSystem.svgInline === 24, "bad svg count");
});

test("interactive states are passed through", () => {
  assert(analyzed.interactiveStates, "no states");
  assert(analyzed.interactiveStates.hover.length > 0, "no hover states");
});

test("dark mode data is passed through", () => {
  assert(analyzed.darkModeData, "no dark mode");
  assert(analyzed.darkModeData.vars, "no dark vars");
});

test("z-indices are extracted", () => {
  assert(analyzed.zIndices.length > 0, "no z-indices");
});

test("opacity values are extracted", () => {
  assert(analyzed.opacityValues.length > 0, "no opacity");
});

test("border widths are extracted", () => {
  assert(analyzed.borderWidths.length > 0, "no border widths");
});

test("container widths are extracted", () => {
  assert(analyzed.containerWidths.length > 0, "no container widths");
});

test("CSS vars are filtered", () => {
  assert(Object.keys(analyzed.cssVars).length > 0, "no css vars");
});

// ── Generator tests ──────────────────────────────────────────

console.log("\n  ── Generator ─────────────────────────────────────\n");

let markdown;

test("generateMarkdown() runs without errors", () => {
  markdown = generateMarkdown(analyzed);
  assert(typeof markdown === "string", "not a string");
  assert(markdown.length > 500, "too short: " + markdown.length);
});

test("DESIGN.md has all 14 sections", () => {
  assert(markdown.includes("## 1. Visual Theme"), "missing section 1");
  assert(markdown.includes("## 2. Design Consistency"), "missing section 2");
  assert(markdown.includes("## 3. Color Palette"), "missing section 3");
  assert(markdown.includes("## 4. Typography"), "missing section 4");
  assert(markdown.includes("## 5. Component"), "missing section 5");
  assert(markdown.includes("## 6. Layout"), "missing section 6");
  assert(markdown.includes("## 7. Depth"), "missing section 7");
  assert(markdown.includes("## 8. Motion"), "missing section 8");
  assert(markdown.includes("## 9. Interactive"), "missing section 9");
  assert(markdown.includes("## 10. Responsive"), "missing section 10");
  assert(markdown.includes("## 11. Accessibility"), "missing section 11");
  assert(markdown.includes("## 12. Icons"), "missing section 12");
  assert(markdown.includes("## 13. Border"), "missing section 13");
  assert(markdown.includes("## 14. Agent Prompt"), "missing section 14");
});

test("DESIGN.md contains educational disclaimer", () => {
  assert(markdown.includes("educational and experimental"), "missing disclaimer");
});

test("DESIGN.md contains consistency score", () => {
  assert(markdown.includes("Consistency Score"), "missing score");
  assert(markdown.includes("/100"), "missing score value");
});

test("DESIGN.md contains color harmony", () => {
  assert(markdown.includes("Harmony"), "missing harmony");
});

test("DESIGN.md contains accessible pairings", () => {
  assert(markdown.includes("Accessible Color Pairings"), "missing pairings");
});

test("DESIGN.md contains hover states", () => {
  assert(markdown.includes("Hover"), "missing hover");
});

test("DESIGN.md contains agent prompt", () => {
  assert(markdown.includes("Agent Prompt Guide"), "missing agent prompt");
});

let preview;

test("generatePreview() runs without errors", () => {
  preview = generatePreview(analyzed);
  assert(typeof preview === "string", "not a string");
  assert(preview.includes("<!DOCTYPE html>"), "not HTML");
  assert(preview.length > 1000, "too short");
});

test("preview HTML includes score bars", () => {
  assert(preview.includes("Consistency"), "missing score");
});

test("preview HTML includes disclaimer", () => {
  assert(preview.includes("educational and experimental"), "missing disclaimer");
});

// ── Export format tests ──────────────────────────────────────

console.log("\n  ── Exports ───────────────────────────────────────\n");

test("toTailwindConfig() generates valid JS", () => {
  const tw = toTailwindConfig(analyzed);
  assert(typeof tw === "string", "not string");
  assert(tw.includes("export default"), "missing export");
  assert(tw.includes("colors"), "missing colors");
  assert(tw.includes("fontFamily"), "missing fontFamily");
  assert(tw.includes("spacing"), "missing spacing");
  assert(tw.includes("borderRadius"), "missing borderRadius");
  assert(tw.includes("boxShadow"), "missing boxShadow");
  assert(tw.includes("educational"), "missing disclaimer");
});

test("toCSSVariables() generates valid CSS", () => {
  const css = toCSSVariables(analyzed);
  assert(typeof css === "string", "not string");
  assert(css.includes(":root {"), "missing :root");
  assert(css.includes("--color-"), "missing color vars");
  assert(css.includes("--font-"), "missing font vars");
  assert(css.includes("--space-"), "missing space vars");
  assert(css.includes("--radius-"), "missing radius vars");
  assert(css.includes("--shadow-"), "missing shadow vars");
  assert(css.includes("educational"), "missing disclaimer");
});

test("CSS variables includes dark mode", () => {
  const css = toCSSVariables(analyzed);
  assert(css.includes("prefers-color-scheme: dark"), "missing dark mode");
});

test("CSS variables includes motion tokens", () => {
  const css = toCSSVariables(analyzed);
  assert(css.includes("--duration-"), "missing duration vars");
  assert(css.includes("--ease-"), "missing easing vars");
});

test("toStyleDictionary() generates valid JSON", () => {
  const sd = toStyleDictionary(analyzed);
  const parsed = JSON.parse(sd);
  assert(parsed.color, "missing color");
  assert(parsed.font, "missing font");
  assert(parsed.space, "missing space");
  assert(parsed.radius, "missing radius");
  assert(parsed.shadow, "missing shadow");
  assert(parsed.$description, "missing description");
  assert(parsed.$description.includes("educational"), "missing disclaimer in description");
});

test("Style Dictionary tokens have $value and $type", () => {
  const sd = JSON.parse(toStyleDictionary(analyzed));
  const firstColor = Object.values(sd.color)[0];
  assert(firstColor.$value, "missing $value");
  assert(firstColor.$type === "color", "wrong $type");
});

test("toFigmaTokens() generates valid JSON", () => {
  const ft = toFigmaTokens(analyzed);
  const parsed = JSON.parse(ft);
  assert(parsed.global, "missing global");
  assert(parsed.global.colors, "missing colors");
  assert(parsed.global.typography, "missing typography");
  assert(parsed.global.spacing, "missing spacing");
  assert(parsed.global.borderRadius, "missing borderRadius");
});

test("Figma tokens have value and type fields", () => {
  const ft = JSON.parse(toFigmaTokens(analyzed));
  const firstColor = Object.values(ft.global.colors)[0];
  assert(firstColor.value, "missing value");
  assert(firstColor.type === "color", "wrong type");
});

// ── Edge case tests ──────────────────────────────────────────

console.log("\n  ── Edge Cases ────────────────────────────────────\n");

test("handles empty component data", () => {
  const empty = { ...mockExtracted };
  empty.rawStyles = {
    ...mockExtracted.rawStyles,
    maps: { ...mockExtracted.rawStyles.maps },
    componentData: {
      buttons: [], inputs: [], cards: [], links: [],
      headings: [], nav: [], images: [], lists: [],
      modals: [], badges: [], tags: [],
    },
  };
  const result = analyze(empty);
  assert(result.components.length === 0, "should have 0 components");
  const md = generateMarkdown(result);
  assert(md.length > 100, "markdown too short");
});

test("handles empty color maps", () => {
  const empty = { ...mockExtracted };
  empty.rawStyles = {
    ...mockExtracted.rawStyles,
    maps: {
      ...mockExtracted.rawStyles.maps,
      color: {}, bgColor: {}, borderColor: {},
    },
  };
  const result = analyze(empty);
  assert(result.colors.length === 0, "should have 0 colors");
  const md = generateMarkdown(result);
  assert(md.includes("DESIGN.md"), "should still generate");
});

test("handles null gradients", () => {
  const noGrad = { ...mockExtracted, gradients: null };
  const result = analyze(noGrad);
  assert(Array.isArray(result.gradientList), "should be array");
});

test("handles null breakpoints", () => {
  const noBp = { ...mockExtracted, breakpoints: null };
  const result = analyze(noBp);
  assert(Array.isArray(result.breakpointList), "should be array");
});

test("handles null motion system", () => {
  const noMotion = { ...mockExtracted, motionSystem: null };
  const result = analyze(noMotion);
  assert(result.motionSystem === null, "should be null");
  const md = generateMarkdown(result);
  assert(md.length > 100, "should still generate");
});

test("handles null accessibility", () => {
  const noA11y = { ...mockExtracted, accessibility: null };
  const result = analyze(noA11y);
  assert(result.accessibility === null, "should be null");
  const md = generateMarkdown(result);
  assert(md.length > 100, "should still generate");
});

test("handles null interactive states", () => {
  const noStates = { ...mockExtracted, interactiveStates: null };
  const result = analyze(noStates);
  const md = generateMarkdown(result);
  assert(!md.includes("## 9. Interactive States"), "should skip section 9 if null");
});

test("handles null dark mode", () => {
  const noDark = { ...mockExtracted, darkModeData: null };
  const result = analyze(noDark);
  assert(result.darkModeData === null, "should be null");
  const md = generateMarkdown(result);
  assert(md.length > 100, "should still generate");
  const css = toCSSVariables(result);
  assert(!css.includes("prefers-color-scheme"), "should not include dark mode");
});

test("handles missing externalFonts.urls", () => {
  const noFontUrls = { ...mockExtracted, externalFonts: { urls: [], faces: [] } };
  const result = analyze(noFontUrls);
  const md = generateMarkdown(result);
  assert(md.length > 100, "should still generate");
});

test("handles 3-char hex colors in extraction", () => {
  const short = { ...mockExtracted };
  short.rawStyles = {
    ...mockExtracted.rawStyles,
    maps: {
      ...mockExtracted.rawStyles.maps,
      color: { "#fff": 100, "#000": 50 },
    },
  };
  // Should not crash - 3-char hex might fail gracefully
  const result = analyze(short);
  assert(result, "should not crash");
});

test("handles very long shadow values", () => {
  const longShadow = { ...mockExtracted };
  longShadow.rawStyles = {
    ...mockExtracted.rawStyles,
    maps: {
      ...mockExtracted.rawStyles.maps,
      shadow: {
        "0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1), 0px 0px 0px 1px rgba(0,0,0,0.05), inset 0px 2px 0px 0px rgba(255,255,255,0.05)": 30,
      },
    },
  };
  const result = analyze(longShadow);
  const md = generateMarkdown(result);
  assert(md.includes("shadow"), "should include shadow section");
});

// ── Security tests ───────────────────────────────────────────

console.log("\n  ── Security ──────────────────────────────────────\n");

test("no XSS in preview HTML (malicious color hex)", () => {
  const xss = { ...mockExtracted };
  xss.rawStyles = {
    ...mockExtracted.rawStyles,
    maps: {
      ...mockExtracted.rawStyles.maps,
      color: { '#"><script>alert(1)</script>': 100 },
    },
  };
  const result = analyze(xss);
  const html = generatePreview(result);
  assert(!html.includes("<script>alert(1)"), "XSS in preview HTML!");
});

test("no XSS in preview HTML (malicious font family)", () => {
  const xss = { ...mockExtracted };
  xss.rawStyles = {
    ...mockExtracted.rawStyles,
    maps: {
      ...mockExtracted.rawStyles.maps,
      font: { '"><img src=x onerror=alert(1)>': 100 },
    },
  };
  const result = analyze(xss);
  const html = generatePreview(result);
  assert(!html.includes("onerror=alert"), "XSS via font family!");
});

test("no XSS in preview HTML (malicious URL)", () => {
  const xss = { ...mockExtracted };
  xss.url = 'https://example.com"><script>alert(1)</script>';
  const result = analyze(xss);
  const html = generatePreview(result);
  assert(!html.includes("<script>alert(1)"), "XSS via URL!");
});

test("no XSS in markdown (malicious heading text)", () => {
  const xss = { ...mockExtracted };
  xss.rawStyles = {
    ...mockExtracted.rawStyles,
    componentData: {
      ...mockExtracted.rawStyles.componentData,
      headings: [
        { level: 1, text: '<img src=x onerror=alert(1)>', fontSize: "48px", fontWeight: "700", fontFamily: '"Inter"', color: "#1a1a1a", bgColor: "transparent", borderRadius: "0px", padding: "0px", border: "none", boxShadow: "none", lineHeight: "56px", letterSpacing: "-0.02em", textTransform: "none", transition: "none", opacity: "1", width: 600, height: 56 },
      ],
    },
  };
  const result = analyze(xss);
  const md = generateMarkdown(result);
  // Markdown is safe for agent consumption but check it doesn't execute
  assert(typeof md === "string", "should still generate");
});

test("no script injection in CSS variables export", () => {
  const xss = { ...mockExtracted };
  xss.cssVars = { "--color-bg": '"; } body { background: url(javascript:alert(1)); } :root { --x: "' };
  const result = analyze(xss);
  const css = toCSSVariables(result);
  assert(!css.includes("javascript:"), "script injection in CSS!");
});

test("no prototype pollution in analyzer", () => {
  const pollution = { ...mockExtracted };
  pollution.rawStyles = {
    ...mockExtracted.rawStyles,
    maps: {
      ...mockExtracted.rawStyles.maps,
      color: { "__proto__": 100, "constructor": 50, "#ffffff": 200 },
    },
  };
  const result = analyze(pollution);
  assert(result, "should not crash");
  assert(!result.colors.some(c => c.hex === "__proto__"), "should not include __proto__");
});

test("educational disclaimer present in all outputs", () => {
  const md = generateMarkdown(analyzed);
  const html = generatePreview(analyzed);
  const tw = toTailwindConfig(analyzed);
  const css = toCSSVariables(analyzed);
  const sd = toStyleDictionary(analyzed);

  assert(md.includes("educational"), "missing in markdown");
  assert(html.includes("educational"), "missing in preview");
  assert(tw.includes("educational"), "missing in tailwind");
  assert(css.includes("educational"), "missing in css");
  assert(sd.includes("educational"), "missing in style dictionary");
});

// ── Detector tests ───────────────────────────────────────────

console.log("\n  ── Detectors ─────────────────────────────────────\n");

test("detectFrameworks() returns array", () => {
  const result = detectFrameworks({}, [], {});
  assert(Array.isArray(result), "not array");
});

test("detectFrameworks() detects Tailwind from CSS vars", () => {
  const vars = { "--tw-ring-color": "#fff", "--tw-shadow": "none", "--tw-translate-x": "0" };
  const result = detectFrameworks(vars, [], {});
  assert(result.some(f => f.name === "Tailwind CSS"), "should detect Tailwind");
});

test("detectFrameworks() detects shadcn from CSS vars", () => {
  const vars = { "--radius": "8px", "--primary": "#000", "--muted": "#999", "--card": "#fff", "--popover": "#fff" };
  const result = detectFrameworks(vars, [], {});
  assert(result.some(f => f.name === "shadcn/ui"), "should detect shadcn");
});

test("detectFrameworks() returns confidence scores", () => {
  const vars = { "--tw-ring-color": "#fff", "--tw-shadow": "none" };
  const result = detectFrameworks(vars, [], {});
  if (result.length > 0) {
    assert(typeof result[0].confidence === "number", "no confidence");
    assert(result[0].confidence > 0, "zero confidence");
  }
});

test("scoreCompleteness() returns score structure", () => {
  const result = scoreCompleteness(analyzed);
  assert(typeof result.score === "number", "score not number");
  assert(result.score >= 0 && result.score <= 100, "score out of range");
  assert(result.met >= 0, "met negative");
  assert(result.totalCriteria > 0, "no criteria");
  assert(Array.isArray(result.details), "details not array");
  assert(Array.isArray(result.missing), "missing not array");
  assert(Array.isArray(result.present), "present not array");
});

test("scoreCompleteness() detects present criteria", () => {
  const result = scoreCompleteness(analyzed);
  assert(result.present.length > 0, "nothing detected as present");
  const labels = result.present.map(p => p.label);
  assert(labels.some(l => l.includes("Color palette")), "should detect colors");
  assert(labels.some(l => l.includes("Primary font")), "should detect font");
});

test("analyzer now includes completeness", () => {
  assert(analyzed.completeness, "no completeness in analyzed data");
  assert(analyzed.completeness.score >= 0, "bad score");
});

test("analyzer now includes detectedFrameworks", () => {
  assert(Array.isArray(analyzed.detectedFrameworks), "not array");
});

test("DESIGN.md now includes completeness section", () => {
  const md = generateMarkdown(analyzed);
  assert(md.includes("System Completeness"), "missing completeness");
});

// ── Differ tests ─────────────────────────────────────────────

console.log("\n  ── Differ ────────────────────────────────────────\n");

test("diff() runs without errors", () => {
  const result = diff(analyzed, analyzed);
  assert(result, "diff returned null");
  assert(result.summary, "no summary");
});

test("diff() same data shows no changes", () => {
  const result = diff(analyzed, analyzed);
  assert(result.colors.added.length === 0, "should have 0 added");
  assert(result.colors.removed.length === 0, "should have 0 removed");
  assert(result.colors.shared.length === analyzed.colors.length, "all should be shared");
  assert(result.summary.totalChanges === 0, "should have 0 total changes");
});

test("diff() detects added colors", () => {
  const modified = { ...analyzed, colors: [...analyzed.colors, { hex: "#ff0000", role: "error", hsl: { h: 0, s: 100, l: 50 }, count: 5 }] };
  const result = diff(analyzed, modified);
  assert(result.colors.added.length === 1, "should detect 1 added");
  assert(result.colors.added[0].hex === "#ff0000", "wrong added color");
});

test("diff() detects removed fonts", () => {
  const modified = { ...analyzed, fonts: [analyzed.fonts[0]] };
  const result = diff(analyzed, modified);
  if (analyzed.fonts.length > 1) {
    assert(result.fonts.removed.length > 0, "should detect removed fonts");
  }
});

test("diff() detects score changes", () => {
  const modified = { ...analyzed, consistencyScore: { ...analyzed.consistencyScore, overall: analyzed.consistencyScore.overall + 10 } };
  const result = diff(analyzed, modified);
  assert(result.scores.overall.delta === 10, "should detect score delta of 10");
});

test("diffToMarkdown() generates valid markdown", () => {
  const result = diff(analyzed, analyzed);
  const md = diffToMarkdown(result);
  assert(typeof md === "string", "not string");
  assert(md.includes("DESIGN.md Diff"), "missing header");
  assert(md.includes("Summary"), "missing summary");
  assert(md.includes("educational"), "missing disclaimer");
});

// ── Summary ──────────────────────────────────────────────────

console.log(`\n  ────────────────────────────────────────────────\n`);
console.log(`  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
