#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { snap } from "../src/index.js";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

const program = new Command();

program
  .name("designsnap")
  .description("Deep design system extraction from any live URL")
  .version("0.2.0");

program
  .argument("<url>", "URL to extract design system from")
  .option("-o, --output <path>", "output file path", "./DESIGN.md")
  .option("--preview", "generate visual preview HTML", false)
  .option("--json", "output raw extracted data as JSON", false)
  .option("--dark", "extract dark mode tokens", false)
  .option("--responsive", "extract at mobile + tablet + desktop viewports", false)
  .option("--no-states", "skip interactive state extraction (hover/focus)")
  .option("--wait <ms>", "wait time for dynamic content", "3000")
  .option("--tailwind", "export Tailwind CSS config", false)
  .option("--css", "export CSS custom properties file", false)
  .option("--tokens", "export Style Dictionary JSON", false)
  .option("--figma", "export Figma Tokens JSON", false)
  .option("--all", "export all formats", false)
  .action(async (url, options) => {
    console.log("");
    console.log(chalk.bold("  designsnap") + chalk.dim("  v0.2.0"));
    console.log(chalk.dim(`  ${url}`));
    console.log("");

    const spinner = ora({ text: "Launching browser...", color: "cyan" }).start();

    try {
      const result = await snap(url, {
        wait: parseInt(options.wait),
        extractDark: options.dark,
        multiViewport: options.responsive,
        extractStates: options.states !== false,
        onProgress: (msg) => { spinner.text = msg; },
      });

      spinner.succeed("Extraction complete");
      console.log("");

      const outDir = dirname(resolve(options.output));
      const baseName = resolve(options.output).replace(/\.md$/, "");

      // DESIGN.md
      writeFileSync(resolve(options.output), result.markdown, "utf-8");
      console.log(chalk.green("  ✓") + ` DESIGN.md     → ${resolve(options.output)}`);

      // Preview
      if (options.preview) {
        const p = baseName + "-preview.html";
        writeFileSync(p, result.preview, "utf-8");
        console.log(chalk.green("  ✓") + ` Preview        → ${p}`);
      }

      // JSON
      if (options.json) {
        const p = baseName + ".json";
        writeFileSync(p, JSON.stringify(result.data, null, 2), "utf-8");
        console.log(chalk.green("  ✓") + ` Raw data       → ${p}`);
      }

      // Exports
      if (options.tailwind || options.all) {
        const p = baseName + ".tailwind.js";
        writeFileSync(p, result.exports.tailwind, "utf-8");
        console.log(chalk.green("  ✓") + ` Tailwind       → ${p}`);
      }

      if (options.css || options.all) {
        const p = baseName + ".tokens.css";
        writeFileSync(p, result.exports.css, "utf-8");
        console.log(chalk.green("  ✓") + ` CSS vars       → ${p}`);
      }

      if (options.tokens || options.all) {
        const p = baseName + ".tokens.json";
        writeFileSync(p, result.exports.styleDictionary, "utf-8");
        console.log(chalk.green("  ✓") + ` Style Dict     → ${p}`);
      }

      if (options.figma || options.all) {
        const p = baseName + ".figma-tokens.json";
        writeFileSync(p, result.exports.figmaTokens, "utf-8");
        console.log(chalk.green("  ✓") + ` Figma Tokens   → ${p}`);
      }

      // Summary
      const d = result.data;
      const score = d.consistencyScore;
      console.log("");
      console.log(chalk.dim("  Summary"));
      console.log(
        chalk.dim(`  ${d.colors.length} colors · ${d.fonts.length} fonts · `) +
        chalk.dim(`${d.spacingScale.length} spacing · ${d.components.length} components · `) +
        chalk.dim(`${d.shadows.length} shadows`)
      );
      console.log(
        chalk.dim("  Score: ") +
        chalk[score.overall > 75 ? "green" : score.overall > 50 ? "yellow" : "red"](`${score.overall}/100`) +
        chalk.dim(` (color ${score.color} · type ${score.typography} · space ${score.spacing} · a11y ${score.accessibility})`)
      );

      if (d.gridSystem) {
        console.log(chalk.dim(`  Grid: ${d.gridSystem.base}px base (${d.gridSystem.adherence}% adherence)`));
      }
      if (d.scaleRatio) {
        console.log(chalk.dim(`  Type scale: ${d.scaleRatio.name} (${d.scaleRatio.detected}:1)`));
      }
      if (d.colorHarmony) {
        console.log(chalk.dim(`  Color harmony: ${d.colorHarmony.type}`));
      }
      if (d.accessibility?.contrastIssues?.length > 0) {
        console.log(chalk.yellow(`  ⚠ ${d.accessibility.contrastIssues.length} contrast issues found`));
      }
      if (d.breakpointList.length > 0) {
        console.log(chalk.dim(`  Breakpoints: ${d.breakpointList.map(b => b.px + "px").join(", ")}`));
      }

      console.log("");
    } catch (err) {
      spinner.fail("Extraction failed");
      console.error(chalk.red(`\n  ${err.message}\n`));
      if (err.stack && process.env.DEBUG) console.error(chalk.dim(err.stack));
      process.exit(1);
    }
  });

program.parse();
