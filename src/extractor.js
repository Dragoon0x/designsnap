/**
 * extractor.js — Deep design system extraction
 *
 * Extracts computed styles, interactive states, animations,
 * gradients, accessibility data, layout patterns, and breakpoints
 * from a live URL using a headless browser.
 *
 * For educational and experimental purposes only.
 */

import puppeteer from "puppeteer";

const VIEWPORTS = {
  mobile: { width: 375, height: 812, label: "mobile" },
  tablet: { width: 768, height: 1024, label: "tablet" },
  desktop: { width: 1440, height: 900, label: "desktop" },
};

export async function extractFromURL(url, options = {}) {
  const {
    wait = 3000,
    extractDark = false,
    multiViewport = false,
    extractStates = true,
    onProgress,
  } = options;

  const log = onProgress || (() => {});

  log("Launching headless browser...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();

    // ── Primary extraction at desktop ────────────────────────
    await page.setViewport(VIEWPORTS.desktop);
    log(`Loading ${url}...`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    log("Waiting for dynamic content...");
    await new Promise((r) => setTimeout(r, wait));

    log("Extracting page metadata...");
    const meta = await extractMeta(page);

    log("Scanning all DOM element styles...");
    const rawStyles = await extractAllStyles(page);

    log("Extracting CSS custom properties...");
    const cssVars = await extractCSSVars(page);

    log("Detecting external fonts...");
    const externalFonts = await extractFonts(page);

    log("Extracting gradients...");
    const gradients = await extractGradients(page);

    log("Analyzing layout patterns...");
    const layoutPatterns = await extractLayoutPatterns(page);

    log("Extracting breakpoints from stylesheets...");
    const breakpoints = await extractBreakpoints(page);

    log("Detecting animation & transition system...");
    const motionSystem = await extractMotionSystem(page);

    log("Running accessibility audit...");
    const accessibility = await extractAccessibility(page);

    log("Extracting image treatments...");
    const imageTreatments = await extractImageTreatments(page);

    log("Detecting icon system...");
    const iconSystem = await extractIconSystem(page);

    // ── Interactive states (hover, focus, active) ────────────
    let interactiveStates = null;
    if (extractStates) {
      log("Simulating interactive states...");
      interactiveStates = await extractInteractiveStates(page);
    }

    // ── Dark mode ────────────────────────────────────────────
    let darkModeData = null;
    if (extractDark) {
      log("Extracting dark mode tokens...");
      darkModeData = await extractDarkMode(page);
    }

    // ── Multi-viewport extraction ────────────────────────────
    let responsiveData = null;
    if (multiViewport) {
      responsiveData = {};
      for (const [key, vp] of Object.entries(VIEWPORTS)) {
        if (key === "desktop") continue;
        log(`Extracting at ${vp.label} (${vp.width}x${vp.height})...`);
        await page.setViewport(vp);
        await new Promise((r) => setTimeout(r, 1500));
        responsiveData[key] = await extractResponsiveSnapshot(page);
      }
    }

    log("Capturing screenshot...");
    await page.setViewport(VIEWPORTS.desktop);
    const screenshot = await page.screenshot({ encoding: "base64", fullPage: false });

    return {
      url, meta, rawStyles, cssVars, externalFonts, gradients,
      layoutPatterns, breakpoints, motionSystem, accessibility,
      imageTreatments, iconSystem, interactiveStates,
      darkModeData, responsiveData, screenshot,
    };
  } finally {
    await browser.close();
  }
}

// ═══════════════════════════════════════════════════════════════
// Individual extraction functions
// ═══════════════════════════════════════════════════════════════

async function extractMeta(page) {
  return page.evaluate(() => ({
    title: document.title || "",
    description: document.querySelector('meta[name="description"]')?.content || "",
    themeColor: document.querySelector('meta[name="theme-color"]')?.content || "",
    favicon: document.querySelector('link[rel="icon"]')?.href || document.querySelector('link[rel="shortcut icon"]')?.href || "",
    ogImage: document.querySelector('meta[property="og:image"]')?.content || "",
    charset: document.characterSet || "",
    language: document.documentElement.lang || "",
    generator: document.querySelector('meta[name="generator"]')?.content || "",
  }));
}

async function extractAllStyles(page) {
  return page.evaluate(() => {
    const els = document.querySelectorAll("*");
    const maps = {
      color: {}, bgColor: {}, borderColor: {},
      font: {}, fontSize: {}, fontWeight: {}, lineHeight: {}, letterSpacing: {},
      spacing: {}, radius: {}, shadow: {}, transition: {}, zIndex: {},
      opacity: {}, cursor: {}, overflow: {}, display: {}, position: {},
      borderWidth: {}, borderStyle: {},
      maxWidth: {}, minHeight: {},
    };

    const componentData = {
      buttons: [], inputs: [], cards: [], links: [],
      headings: [], nav: [], images: [], lists: [],
      modals: [], badges: [], tags: [],
    };

    function add(map, val, w = 1) {
      if (!val || val === "none" || val === "normal" || val === "0px" || val === "auto") return;
      map[val] = (map[val] || 0) + w;
    }

    function rgbToHex(rgb) {
      if (!rgb || rgb === "transparent" || rgb.startsWith("#")) return rgb;
      const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) return rgb;
      if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
      return "#" + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, "0")).join("");
    }

    for (const el of els) {
      const cs = window.getComputedStyle(el);
      const tag = el.tagName.toLowerCase();

      // Colors
      const color = rgbToHex(cs.color);
      const bgColor = rgbToHex(cs.backgroundColor);
      const borderColor = rgbToHex(cs.borderColor);
      if (color) add(maps.color, color);
      if (bgColor) add(maps.bgColor, bgColor);
      if (borderColor && borderColor !== color) add(maps.borderColor, borderColor);

      // Typography
      add(maps.font, cs.fontFamily);
      add(maps.fontSize, cs.fontSize);
      add(maps.fontWeight, cs.fontWeight);
      add(maps.lineHeight, cs.lineHeight);
      if (cs.letterSpacing !== "normal") add(maps.letterSpacing, cs.letterSpacing);

      // Spacing
      for (const p of ["marginTop","marginRight","marginBottom","marginLeft","paddingTop","paddingRight","paddingBottom","paddingLeft","gap","rowGap","columnGap"]) {
        const v = cs[p]; if (v && v !== "0px" && v !== "normal" && v !== "auto") add(maps.spacing, v);
      }

      // Box model
      if (cs.borderRadius !== "0px") add(maps.radius, cs.borderRadius);
      if (cs.boxShadow !== "none") add(maps.shadow, cs.boxShadow);
      if (cs.transition && cs.transition !== "all 0s ease 0s" && cs.transition !== "none 0s ease 0s") add(maps.transition, cs.transition);
      if (cs.zIndex !== "auto") add(maps.zIndex, cs.zIndex);
      if (cs.opacity !== "1") add(maps.opacity, cs.opacity);

      // Layout signals
      add(maps.display, cs.display);
      add(maps.position, cs.position);
      add(maps.cursor, cs.cursor);
      if (cs.borderWidth !== "0px") add(maps.borderWidth, cs.borderWidth);
      if (cs.borderStyle !== "none") add(maps.borderStyle, cs.borderStyle);
      if (cs.maxWidth !== "none") add(maps.maxWidth, cs.maxWidth);
      if (cs.minHeight !== "0px" && cs.minHeight !== "auto") add(maps.minHeight, cs.minHeight);

      // ── Component detection ────────────────────
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      const base = {
        fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily,
        color, bgColor, borderRadius: cs.borderRadius, padding: cs.padding,
        border: cs.border, boxShadow: cs.boxShadow, lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing, textTransform: cs.textTransform,
        transition: cs.transition, opacity: cs.opacity,
        width: Math.round(rect.width), height: Math.round(rect.height),
      };

      // Buttons
      if (tag === "button" || (tag === "a" && el.getAttribute("role") === "button") || el.classList.toString().match(/btn|button/i)) {
        componentData.buttons.push({ text: el.textContent.trim().slice(0, 50), classes: el.className?.toString()?.slice(0, 120) || "", ...base });
      }
      // Inputs
      if (tag === "input" || tag === "textarea" || tag === "select") {
        componentData.inputs.push({ type: el.type || tag, placeholder: el.placeholder || "", ...base });
      }
      // Links
      if (tag === "a" && el.getAttribute("role") !== "button") {
        componentData.links.push({ text: el.textContent.trim().slice(0, 50), textDecoration: cs.textDecoration, ...base });
      }
      // Headings
      if (/^h[1-6]$/.test(tag)) {
        componentData.headings.push({ level: parseInt(tag[1]), text: el.textContent.trim().slice(0, 80), ...base });
      }
      // Cards
      if (cs.boxShadow !== "none" && cs.borderRadius !== "0px" && parseInt(cs.padding) > 8 && rect.width > 100 && rect.height > 80) {
        componentData.cards.push({ tag, classes: el.className?.toString()?.slice(0, 100) || "", ...base });
      }
      // Nav
      if (tag === "nav" || el.getAttribute("role") === "navigation") {
        componentData.nav.push({ ...base, childCount: el.children.length, position: cs.position });
      }
      // Lists
      if (tag === "ul" || tag === "ol") {
        componentData.lists.push({ tag, childCount: el.children.length, listStyle: cs.listStyleType, ...base });
      }
      // Badges/tags (small colored elements)
      if (rect.width < 200 && rect.height < 40 && rect.height > 16 && bgColor && bgColor !== "#ffffff" && bgColor !== "#000000" && cs.borderRadius !== "0px") {
        const text = el.textContent.trim();
        if (text.length > 0 && text.length < 30) {
          componentData.badges.push({ text, ...base });
        }
      }
    }

    return { maps, componentData };
  });
}

async function extractCSSVars(page) {
  return page.evaluate(() => {
    const vars = {};
    const rootStyle = getComputedStyle(document.documentElement);
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText === ":root" || rule.selectorText === "html" || rule.selectorText === ":root, [data-theme]") {
            for (const prop of rule.style) {
              if (prop.startsWith("--")) vars[prop] = rootStyle.getPropertyValue(prop).trim();
            }
          }
        }
      } catch (e) {}
    }
    return vars;
  });
}

async function extractFonts(page) {
  return page.evaluate(() => {
    const fonts = { urls: [], faces: [] };
    // Link tags
    for (const link of document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"][as="font"], link[rel="preload"][as="style"]')) {
      const href = link.href || "";
      if (href.includes("fonts.googleapis.com") || href.includes("fonts.gstatic.com") || href.includes("use.typekit.net") || href.match(/\.woff2?|\.ttf|\.otf/)) {
        fonts.urls.push(href);
      }
    }
    // @font-face rules
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSFontFaceRule) {
            fonts.faces.push({
              family: rule.style.getPropertyValue("font-family").replace(/["']/g, "").trim(),
              weight: rule.style.getPropertyValue("font-weight") || "400",
              style: rule.style.getPropertyValue("font-style") || "normal",
              src: rule.style.getPropertyValue("src")?.slice(0, 200) || "",
            });
          }
        }
      } catch (e) {}
    }
    return fonts;
  });
}

async function extractGradients(page) {
  return page.evaluate(() => {
    const gradients = {};
    for (const el of document.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundImage;
      if (bg && bg !== "none" && (bg.includes("gradient") || bg.includes("linear") || bg.includes("radial"))) {
        gradients[bg] = (gradients[bg] || 0) + 1;
      }
    }
    return gradients;
  });
}

async function extractLayoutPatterns(page) {
  return page.evaluate(() => {
    const patterns = {
      flexContainers: 0, gridContainers: 0,
      gridTemplates: {}, flexDirections: {},
      contentWidths: {}, stickyElements: 0,
      fixedElements: 0, absoluteElements: 0,
      overflowHidden: 0, aspectRatios: {},
    };

    for (const el of document.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      if (cs.display === "flex" || cs.display === "inline-flex") {
        patterns.flexContainers++;
        const dir = cs.flexDirection;
        patterns.flexDirections[dir] = (patterns.flexDirections[dir] || 0) + 1;
      }
      if (cs.display === "grid" || cs.display === "inline-grid") {
        patterns.gridContainers++;
        const tmpl = cs.gridTemplateColumns;
        if (tmpl && tmpl !== "none") {
          const simplified = tmpl.replace(/\d+(\.\d+)?px/g, m => Math.round(parseFloat(m)) + "px");
          patterns.gridTemplates[simplified] = (patterns.gridTemplates[simplified] || 0) + 1;
        }
      }
      if (cs.position === "sticky") patterns.stickyElements++;
      if (cs.position === "fixed") patterns.fixedElements++;
      if (cs.position === "absolute") patterns.absoluteElements++;
      if (cs.overflow === "hidden") patterns.overflowHidden++;

      // Content widths (likely containers)
      if (cs.maxWidth !== "none" && cs.maxWidth !== "0px") {
        patterns.contentWidths[cs.maxWidth] = (patterns.contentWidths[cs.maxWidth] || 0) + 1;
      }

      // Aspect ratios
      if (rect.width > 50 && rect.height > 50) {
        const ratio = Math.round((rect.width / rect.height) * 10) / 10;
        if ([1, 1.3, 1.5, 1.8, 2, 0.6, 0.7, 0.8].some(r => Math.abs(ratio - r) < 0.15)) {
          const key = `${ratio}:1`;
          patterns.aspectRatios[key] = (patterns.aspectRatios[key] || 0) + 1;
        }
      }
    }

    return patterns;
  });
}

async function extractBreakpoints(page) {
  return page.evaluate(() => {
    const breakpoints = {};
    for (const sheet of document.styleSheets) {
      try {
        const scan = (rules) => {
          for (const rule of rules) {
            if (rule instanceof CSSMediaRule) {
              const text = rule.conditionText || rule.media?.mediaText || "";
              const matches = text.match(/(\d+)px/g);
              if (matches) {
                for (const m of matches) {
                  const px = parseInt(m);
                  if (px >= 320 && px <= 2560) {
                    breakpoints[px] = (breakpoints[px] || 0) + rule.cssRules.length;
                  }
                }
              }
              scan(rule.cssRules);
            }
          }
        };
        scan(sheet.cssRules);
      } catch (e) {}
    }
    return breakpoints;
  });
}

async function extractMotionSystem(page) {
  return page.evaluate(() => {
    const motion = {
      transitions: {},
      durations: {},
      easings: {},
      keyframes: [],
      animatedElements: 0,
    };

    for (const el of document.querySelectorAll("*")) {
      const cs = getComputedStyle(el);

      // Transitions
      const tr = cs.transition;
      if (tr && tr !== "all 0s ease 0s" && tr !== "none 0s ease 0s") {
        // Parse individual properties
        const parts = tr.split(",").map(p => p.trim());
        for (const part of parts) {
          const tokens = part.split(/\s+/);
          if (tokens.length >= 2) {
            const prop = tokens[0];
            const dur = tokens[1];
            const ease = tokens[2] || "ease";
            motion.transitions[prop] = (motion.transitions[prop] || 0) + 1;
            motion.durations[dur] = (motion.durations[dur] || 0) + 1;
            motion.easings[ease] = (motion.easings[ease] || 0) + 1;
          }
        }
      }

      // Animations
      if (cs.animationName && cs.animationName !== "none") {
        motion.animatedElements++;
      }
    }

    // Keyframes
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSKeyframesRule) {
            motion.keyframes.push({
              name: rule.name,
              steps: rule.cssRules.length,
            });
          }
        }
      } catch (e) {}
    }

    return motion;
  });
}

async function extractAccessibility(page) {
  return page.evaluate(() => {
    const a11y = {
      contrastIssues: [],
      missingAlt: 0,
      ariaRoles: {},
      ariaLabels: 0,
      focusVisible: false,
      skipLink: false,
      landmarks: {},
      headingOrder: [],
      tabIndex: { positive: 0, zero: 0, negative: 0 },
      formLabels: { labeled: 0, unlabeled: 0 },
    };

    function luminance(hex) {
      if (!hex || !hex.startsWith("#")) return null;
      const rgb = [1, 3, 5].map(i => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    }

    function contrastRatio(hex1, hex2) {
      const l1 = luminance(hex1), l2 = luminance(hex2);
      if (l1 === null || l2 === null) return null;
      const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    function rgbToHex(rgb) {
      if (!rgb || rgb === "transparent") return null;
      const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return null;
      return "#" + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, "0")).join("");
    }

    // Contrast check on text elements
    const textEls = document.querySelectorAll("p, span, a, h1, h2, h3, h4, h5, h6, li, td, th, label, button");
    let checked = 0;
    for (const el of textEls) {
      if (checked > 200) break;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      const cs = getComputedStyle(el);
      const fg = rgbToHex(cs.color);
      const bg = rgbToHex(cs.backgroundColor);
      if (fg && bg) {
        const ratio = contrastRatio(fg, bg);
        if (ratio !== null && ratio < 4.5) {
          const size = parseFloat(cs.fontSize);
          const isBold = parseInt(cs.fontWeight) >= 700;
          const isLargeText = size >= 24 || (size >= 18.66 && isBold);
          const threshold = isLargeText ? 3 : 4.5;
          if (ratio < threshold) {
            a11y.contrastIssues.push({
              text: el.textContent.trim().slice(0, 40),
              fg, bg, ratio: Math.round(ratio * 100) / 100,
              tag: el.tagName.toLowerCase(),
              size: cs.fontSize,
            });
          }
        }
        checked++;
      }
    }

    // Images
    for (const img of document.querySelectorAll("img")) {
      if (!img.alt && !img.getAttribute("aria-label") && !img.getAttribute("role")?.includes("presentation")) {
        a11y.missingAlt++;
      }
    }

    // ARIA
    for (const el of document.querySelectorAll("[role]")) {
      const role = el.getAttribute("role");
      a11y.ariaRoles[role] = (a11y.ariaRoles[role] || 0) + 1;
    }
    a11y.ariaLabels = document.querySelectorAll("[aria-label], [aria-labelledby]").length;

    // Skip link
    a11y.skipLink = !!document.querySelector('a[href="#main"], a[href="#content"], a.skip-link, a.skip-to-content');

    // Landmarks
    for (const tag of ["header", "main", "footer", "aside", "section", "article"]) {
      const count = document.querySelectorAll(tag).length;
      if (count > 0) a11y.landmarks[tag] = count;
    }

    // Heading order
    for (const h of document.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
      const rect = h.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        a11y.headingOrder.push(parseInt(h.tagName[1]));
      }
    }

    // Tab index
    for (const el of document.querySelectorAll("[tabindex]")) {
      const ti = parseInt(el.getAttribute("tabindex"));
      if (ti > 0) a11y.tabIndex.positive++;
      else if (ti === 0) a11y.tabIndex.zero++;
      else a11y.tabIndex.negative++;
    }

    // Form labels
    for (const input of document.querySelectorAll("input, select, textarea")) {
      if (input.type === "hidden" || input.type === "submit" || input.type === "button") continue;
      const hasLabel = input.id && document.querySelector(`label[for="${input.id}"]`);
      const hasAria = input.getAttribute("aria-label") || input.getAttribute("aria-labelledby");
      const hasPlaceholder = input.placeholder;
      if (hasLabel || hasAria) a11y.formLabels.labeled++;
      else a11y.formLabels.unlabeled++;
    }

    // Focus visible check
    const sheets = document.styleSheets;
    for (const sheet of sheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText?.includes(":focus-visible") || rule.selectorText?.includes(":focus")) {
            a11y.focusVisible = true;
            break;
          }
        }
      } catch (e) {}
      if (a11y.focusVisible) break;
    }

    return a11y;
  });
}

async function extractImageTreatments(page) {
  return page.evaluate(() => {
    const treatments = {
      borderRadius: {},
      objectFit: {},
      aspectRatio: {},
      filters: {},
      count: 0,
      avgWidth: 0,
      avgHeight: 0,
      lazyLoaded: 0,
    };

    let totalW = 0, totalH = 0;
    for (const img of document.querySelectorAll("img, picture, [style*='background-image'], video")) {
      const rect = img.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      treatments.count++;
      totalW += rect.width;
      totalH += rect.height;

      const cs = getComputedStyle(img);
      if (cs.borderRadius !== "0px") treatments.borderRadius[cs.borderRadius] = (treatments.borderRadius[cs.borderRadius] || 0) + 1;
      if (cs.objectFit !== "fill") treatments.objectFit[cs.objectFit] = (treatments.objectFit[cs.objectFit] || 0) + 1;
      if (cs.filter !== "none") treatments.filters[cs.filter] = (treatments.filters[cs.filter] || 0) + 1;

      if (img.loading === "lazy" || img.getAttribute("data-lazy") || img.classList.toString().includes("lazy")) {
        treatments.lazyLoaded++;
      }
    }

    if (treatments.count > 0) {
      treatments.avgWidth = Math.round(totalW / treatments.count);
      treatments.avgHeight = Math.round(totalH / treatments.count);
    }

    return treatments;
  });
}

async function extractIconSystem(page) {
  return page.evaluate(() => {
    const icons = {
      svgInline: 0,
      svgSprite: 0,
      iconFont: false,
      iconFontClasses: [],
      svgSizes: {},
    };

    // Inline SVGs
    for (const svg of document.querySelectorAll("svg")) {
      const rect = svg.getBoundingClientRect();
      if (rect.width > 0 && rect.width < 64 && rect.height > 0 && rect.height < 64) {
        icons.svgInline++;
        const size = `${Math.round(rect.width)}x${Math.round(rect.height)}`;
        icons.svgSizes[size] = (icons.svgSizes[size] || 0) + 1;
      }
    }

    // SVG sprites (use elements)
    icons.svgSprite = document.querySelectorAll("svg use").length;

    // Icon fonts
    for (const el of document.querySelectorAll("i, span")) {
      const cs = getComputedStyle(el);
      const classes = el.className?.toString() || "";
      if (classes.match(/icon|fa-|material-icons|bi-|feather|lucide/i) || cs.fontFamily.match(/icon|fontawesome|material|feather/i)) {
        icons.iconFont = true;
        const match = classes.match(/(fa-\S+|material-icons|bi-\S+|icon-\S+)/);
        if (match && icons.iconFontClasses.length < 10) icons.iconFontClasses.push(match[1]);
      }
    }

    return icons;
  });
}

async function extractInteractiveStates(page) {
  const states = { hover: [], focus: [] };

  // Get interactive elements
  const selectors = await page.evaluate(() => {
    const result = [];
    const els = document.querySelectorAll("a, button, input, [role='button'], [tabindex='0']");
    let count = 0;
    for (const el of els) {
      if (count >= 15) break;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      const cs = getComputedStyle(el);
      result.push({
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
        tag: el.tagName.toLowerCase(),
        defaultBg: cs.backgroundColor,
        defaultColor: cs.color,
        defaultBorder: cs.borderColor,
        defaultShadow: cs.boxShadow,
        defaultTransform: cs.transform,
        defaultOutline: cs.outline,
      });
      count++;
    }
    return result;
  });

  // Simulate hover on each
  for (const sel of selectors.slice(0, 8)) {
    try {
      await page.mouse.move(sel.x, sel.y);
      await new Promise(r => setTimeout(r, 300));
      const hoverState = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        if (!el) return null;
        const cs = getComputedStyle(el);
        return {
          bg: cs.backgroundColor,
          color: cs.color,
          border: cs.borderColor,
          shadow: cs.boxShadow,
          transform: cs.transform,
          cursor: cs.cursor,
        };
      }, { x: sel.x, y: sel.y });

      if (hoverState && (hoverState.bg !== sel.defaultBg || hoverState.color !== sel.defaultColor || hoverState.shadow !== sel.defaultShadow)) {
        states.hover.push({
          tag: sel.tag,
          changes: {
            bg: hoverState.bg !== sel.defaultBg ? { from: sel.defaultBg, to: hoverState.bg } : null,
            color: hoverState.color !== sel.defaultColor ? { from: sel.defaultColor, to: hoverState.color } : null,
            shadow: hoverState.shadow !== sel.defaultShadow ? { from: sel.defaultShadow, to: hoverState.shadow } : null,
            transform: hoverState.transform !== sel.defaultTransform ? { from: sel.defaultTransform, to: hoverState.transform } : null,
          },
          cursor: hoverState.cursor,
        });
      }
    } catch (e) {}
  }

  // Move mouse away
  await page.mouse.move(0, 0);
  return states;
}

async function extractDarkMode(page) {
  return page.evaluate(() => {
    const vars = {};
    const selectors = [];
    for (const sheet of document.styleSheets) {
      try {
        const scan = (rules) => {
          for (const rule of rules) {
            if (rule instanceof CSSMediaRule && rule.conditionText?.includes("prefers-color-scheme: dark")) {
              for (const inner of rule.cssRules) {
                if (inner.style) {
                  for (const prop of inner.style) {
                    if (prop.startsWith("--")) vars[prop] = inner.style.getPropertyValue(prop).trim();
                  }
                }
              }
            }
            if (rule.selectorText?.includes(".dark") || rule.selectorText?.includes('[data-theme="dark"]') || rule.selectorText?.includes("[data-mode='dark']")) {
              if (rule.style) {
                selectors.push(rule.selectorText);
                for (const prop of rule.style) {
                  if (prop.startsWith("--")) vars[prop] = rule.style.getPropertyValue(prop).trim();
                }
              }
            }
            if (rule.cssRules) scan(rule.cssRules);
          }
        };
        scan(sheet.cssRules);
      } catch (e) {}
    }
    return Object.keys(vars).length > 0 ? { vars, selectors } : null;
  });
}

async function extractResponsiveSnapshot(page) {
  return page.evaluate(() => {
    const snapshot = { hiddenElements: 0, stackedColumns: 0, fontSizeChanges: {} };
    for (const el of document.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (cs.display === "none" || (rect.width === 0 && rect.height === 0)) snapshot.hiddenElements++;
    }
    // Check if navigation collapsed
    const nav = document.querySelector("nav");
    if (nav) {
      const hamburger = nav.querySelector("[class*='hamburger'], [class*='menu-toggle'], [aria-label*='menu'], button[class*='mobile']");
      snapshot.hasHamburger = !!hamburger;
    }
    return snapshot;
  });
}
