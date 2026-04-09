# designsnap

Deep design system extraction from any live URL.

```
npx designsnap https://example.com --all
```

Point it at any website. Get back a structured `DESIGN.md` with colors, typography, spacing, shadows, component patterns, motion system, accessibility audit, interactive states, responsive breakpoints, and a design consistency score. Export to Tailwind, CSS variables, Style Dictionary, or Figma Tokens in one command.

> **This project is for educational and experimental purposes only.** It reads publicly visible computed CSS values from rendered web pages. No ownership of any visual identity is claimed. See [Disclaimer](#disclaimer).

## How it works

1. **Load** — Puppeteer opens the page in a headless browser
2. **Wait** — Dynamic content and fonts render
3. **Scan** — Every visible DOM element's computed styles are extracted
4. **Parse** — CSS custom properties, @font-face, @keyframes, and @media rules from stylesheets
5. **Simulate** — Hover and focus states triggered on interactive elements
6. **Cluster** — Similar colors grouped by Euclidean distance, spacing aligned to grid
7. **Score** — Design consistency rated across 6 dimensions
8. **Output** — Structured DESIGN.md + optional exports in 4 formats

## Install

```bash
npm install -g designsnap
```

Or run directly:

```bash
npx designsnap https://example.com
```

## Usage

```bash
# Basic extraction
designsnap https://example.com

# Everything: preview, all export formats, dark mode, responsive
designsnap https://example.com --all --preview --dark --responsive

# Just Tailwind config
designsnap https://example.com --tailwind

# CSS variables file
designsnap https://example.com --css

# Style Dictionary tokens
designsnap https://example.com --tokens

# Figma Tokens (Tokens Studio compatible)
designsnap https://example.com --figma

# Skip hover/focus state extraction (faster)
designsnap https://example.com --no-states

# Custom output path and wait time
designsnap https://example.com -o ./docs/design.md --wait 5000
```

## What you get

### DESIGN.md (14 sections + completeness + framework detection)

| # | Section | What it captures |
|---|---------|-----------------|
| 1 | Visual Theme & Atmosphere | Mode, fonts, accent, harmony, type scale ratio, spacing grid, detected frameworks, completeness score |
| 2 | Design Consistency Score | 0-100 across color, typography, spacing, radius, shadows, accessibility + system completeness checklist |
| 3 | Color Palette & Roles | Clustered colors with semantic roles, accessible pairings with WCAG AA/AAA, gradients, dark mode |
| 4 | Typography System | Font stacks, @font-face, type scale with ratio detection (Minor Third through Golden Ratio), heading hierarchy |
| 5 | Component Styling | Buttons, inputs, cards, nav, links, badges, lists with full CSS per variant |
| 6 | Layout & Spacing | Spacing scale, grid system detection (4px/8px), container widths, layout patterns (flex/grid counts) |
| 7 | Depth & Elevation | Shadow system, border-radius scale, z-index layers, opacity values |
| 8 | Motion & Animation | Transition durations, easing functions, animated properties, @keyframes |
| 9 | Interactive States | Hover and focus changes captured by cursor simulation |
| 10 | Responsive Behavior | Breakpoints from @media rules, multi-viewport snapshots |
| 11 | Accessibility Audit | WCAG contrast ratios, heading order, landmarks, ARIA, form labels, focus styles, skip link |
| 12 | Icons & Image Treatments | SVG inline/sprite count, icon fonts, image sizes, object-fit, lazy loading |
| 13 | Border System | Border widths and colors |
| 14 | Agent Prompt Guide | Quick reference + full prompt with all key tokens |

### Export formats

| Format | Flag | File | Use with |
|--------|------|------|----------|
| Tailwind CSS | `--tailwind` | `.tailwind.js` | tailwind.config.js |
| CSS Variables | `--css` | `.tokens.css` | Any project |
| Style Dictionary | `--tokens` | `.tokens.json` | style-dictionary |
| Figma Tokens | `--figma` | `.figma-tokens.json` | Tokens Studio for Figma |
| All formats | `--all` | All of the above | Everything |

### Consistency Score

Every extraction includes a design consistency score (0-100) across six dimensions:

- **Color** — fewer distinct colors = more disciplined palette
- **Typography** — fewer font families = more cohesive type system
- **Spacing** — adherence to a base grid (4px, 8px, etc.)
- **Border Radius** — fewer distinct values = more systematic
- **Shadows** — fewer shadow levels = more structured elevation
- **Accessibility** — contrast issues found

### System Completeness

Beyond consistency, designsnap checks 20 criteria that define a complete design system: color roles, font pairs, type scale, heading hierarchy, spacing grid, component variants, motion tokens, dark mode, responsive breakpoints, focus styles, CSS variables, and icon system. You get a percentage score and a checklist of what's present and what's missing.

### Framework Detection

Automatically identifies CSS frameworks and design system libraries by scanning CSS custom property naming patterns, class naming conventions, and meta tags. Detects Tailwind CSS, Bootstrap, Material UI, Chakra UI, Ant Design, Radix UI, shadcn/ui, Foundation, and Bulma with confidence scores.

### Diff Mode

Compare two design system extractions side by side. Useful for competitive analysis, redesign tracking, or detecting design drift between environments.

```js
import { snapDiff } from "designsnap";

const result = await snapDiff("https://site-a.com", "https://site-b.com");

result.diffMarkdown    // structured diff as markdown
result.diffResult      // colors added/removed, score deltas, font changes
result.a               // full extraction of site A
result.b               // full extraction of site B
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-o, --output <path>` | Output file path | `./DESIGN.md` |
| `--preview` | Generate visual preview HTML | `false` |
| `--json` | Output raw data as JSON | `false` |
| `--dark` | Extract dark mode tokens | `false` |
| `--responsive` | Extract at mobile + tablet + desktop viewports | `false` |
| `--no-states` | Skip hover/focus state simulation | `false` |
| `--wait <ms>` | Wait time for dynamic content | `3000` |
| `--tailwind` | Export Tailwind CSS config | `false` |
| `--css` | Export CSS custom properties | `false` |
| `--tokens` | Export Style Dictionary JSON | `false` |
| `--figma` | Export Figma Tokens JSON | `false` |
| `--all` | Export all formats | `false` |

## Programmatic API

```js
import { snap } from "designsnap";

const result = await snap("https://example.com", {
  wait: 3000,
  extractDark: true,
  multiViewport: true,
  extractStates: true,
  onProgress: (msg) => console.log(msg),
});

result.markdown         // DESIGN.md content
result.preview          // preview.html content
result.data             // structured JSON
result.exports.tailwind // Tailwind config string
result.exports.css      // CSS variables string
result.exports.styleDictionary  // Style Dictionary JSON string
result.exports.figmaTokens      // Figma Tokens JSON string
```

Individual export functions are also available:

```js
import { toTailwindConfig, toCSSVariables, toStyleDictionary, toFigmaTokens } from "designsnap";
```

## Limitations

- Extracts what's visible at page load. Complex SPA routes need individual runs
- Pages behind authentication can't be crawled without session cookies
- Interactive state simulation covers the first 8 interactive elements found
- Component detection uses heuristics, not DOM framework analysis
- Responsive extraction adds ~3 seconds per additional viewport

## Disclaimer

This tool is provided strictly for **educational and experimental purposes**. It reads publicly visible computed CSS values from rendered web pages, equivalent to what any browser's developer tools expose.

- No proprietary code, assets, or non-public information is accessed
- Extracted design tokens represent publicly visible styling
- No ownership of any visual identity, brand, or design system is claimed
- Users are responsible for ensuring compliance with applicable terms of service
- This tool does not bypass any access controls, authentication, or rate limiting
- Output should not be used to create confusingly similar products or infringe on trademarks

The author provides this tool as-is with no warranty. Use responsibly.

## License

MIT
