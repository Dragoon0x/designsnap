/**
 * index.js — Main orchestrator
 * For educational and experimental purposes only.
 */

import { extractFromURL } from "./extractor.js";
import { analyze } from "./analyzer.js";
import { generateMarkdown, generatePreview } from "./generator.js";
import { toTailwindConfig, toCSSVariables, toStyleDictionary, toFigmaTokens } from "../exports/formats.js";
import { diff, diffToMarkdown } from "./differ.js";
import { detectFrameworks, scoreCompleteness } from "./detectors.js";

export async function snap(url, options = {}) {
  if (!url.startsWith("http")) url = "https://" + url;

  const extracted = await extractFromURL(url, {
    wait: options.wait || 3000,
    extractDark: options.extractDark || false,
    multiViewport: options.multiViewport || false,
    extractStates: options.extractStates !== false,
    onProgress: options.onProgress,
  });

  options.onProgress?.("Analyzing design patterns...");
  const data = analyze(extracted);

  options.onProgress?.("Generating outputs...");
  const markdown = generateMarkdown(data);
  const preview = generatePreview(data);

  const exports = {
    tailwind: toTailwindConfig(data),
    css: toCSSVariables(data),
    styleDictionary: toStyleDictionary(data),
    figmaTokens: toFigmaTokens(data),
  };

  return { markdown, preview, data, exports, screenshot: extracted.screenshot };
}

export async function snapDiff(urlA, urlB, options = {}) {
  const resultA = await snap(urlA, options);
  const resultB = await snap(urlB, { ...options, onProgress: options.onProgressB || options.onProgress });
  const diffResult = diff(resultA.data, resultB.data);
  const diffMd = diffToMarkdown(diffResult);
  return { diffResult, diffMarkdown: diffMd, a: resultA, b: resultB };
}

export { toTailwindConfig, toCSSVariables, toStyleDictionary, toFigmaTokens, diff, diffToMarkdown, detectFrameworks, scoreCompleteness };
