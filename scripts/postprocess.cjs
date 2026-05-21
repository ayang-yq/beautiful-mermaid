#!/usr/bin/env node
/**
 * Post-process Mermaid SVG: inject CSS + uniform node sizes + dark mode fill override.
 *
 * Dark mode: auto-derive dark fills from classDef colors.
 *   Reads inline fill values from SVG, darkens them by reducing lightness.
 *   Works with ANY classDef names — no hardcoded category list.
 *
 * Light mode: keep classDef inline fills unchanged.
 *
 * FAIL-SAFE: warns but never crashes on unexpected SVG structure.
 *
 * Usage: node postprocess.cjs <input.svg> <css_file> [output.svg]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const svgPath = process.argv[2];
const cssPath = process.argv[3];
const outPath = process.argv[4] || svgPath;

if (!svgPath || !cssPath) {
  console.error('Usage: node postprocess.cjs <input.svg> <css_file> [output.svg]');
  process.exit(1);
}

let svg = fs.readFileSync(path.resolve(svgPath), 'utf8');
const css = fs.readFileSync(path.resolve(cssPath), 'utf8');
const isDark = path.basename(cssPath).toLowerCase().includes('dark');
const warnings = [];

// ---- Step 1: Inject CSS before </style> ----
if (!svg.includes('</style>')) {
  warnings.push('WARN: No </style> tag found — CSS injection skipped');
} else {
  svg = svg.replace('</style>', '\n' + css + '\n</style>');
}

// ---- Step 2: Dark mode — replace inline fills with darkened versions ----
let fillMap = {};
if (isDark) {
  // Strategy: find ANY inline fill on elements, not just label-container
  // Fallback chain: label-container → node rect → any rect/path with fill
  let fillMatchCount = 0;

  // Collect unique fill values from inline styles
  const fillRegex = /style="([^"]*fill:(#[0-9a-fA-F]+)\s*!important[^"]*)"/g;
  const lightFills = new Set();
  let m;
  while ((m = fillRegex.exec(svg)) !== null) {
    lightFills.add(m[2].toLowerCase());
  }
  fillRegex.lastIndex = 0;

  if (lightFills.size === 0) {
    // Fallback: try without !important
    const fbRegex = /style="([^"]*fill:(#[0-9a-fA-F]+)[^"]*)"/g;
    while ((m = fbRegex.exec(svg)) !== null) {
      // Skip fills that are "none", "transparent", or Mermaid internal colors
      const hex = m[2].toLowerCase();
      if (hex !== '#000000' && hex !== '#ffffff' && hex !== '#none') {
        lightFills.add(hex);
      }
    }
    fbRegex.lastIndex = 0;
    if (lightFills.size === 0) {
      warnings.push('WARN: No inline fill values found — dark fill replacement skipped');
    }
  }

  // Build fill mapping: light → dark
  for (const light of lightFills) {
    fillMap[light] = darkenHex(light, 0.3);
  }

  // Apply replacements: try !important version first, then plain
  if (Object.keys(fillMap).length > 0) {
    // With !important
    svg = svg.replace(
      /style="([^"]*fill:)(#[0-9a-fA-F]+)(\s*!important[^"]*)"/g,
      (match, prefix, hex, suffix) => {
        const darkFill = fillMap[hex.toLowerCase()];
        if (darkFill) {
          fillMatchCount++;
          return `style="${prefix}${darkFill}${suffix}"`;
        }
        return match;
      }
    );

    // Without !important (for elements that don't use it)
    svg = svg.replace(
      /style="([^"]*fill:)(#[0-9a-fA-F]+)([^"!]*")"/g,
      (match, prefix, hex, suffix) => {
        // Skip if already replaced (contains our dark fills)
        if (fillMap[hex.toLowerCase()] === undefined) return match;
        // Skip black/white/transparent
        const l = hex.toLowerCase();
        if (l === '#000000' || l === '#ffffff' || l === '#none') return match;
        const darkFill = fillMap[l];
        if (darkFill) {
          fillMatchCount++;
          return `style="${prefix}${darkFill}${suffix}`;
        }
        return match;
      }
    );

    if (fillMatchCount === 0) {
      warnings.push('WARN: Dark fills computed but 0 replacements applied — SVG structure may have changed');
    }
  }
}

// ---- Step 3: Uniform node sizes per category ----
// Try primary pattern, fallback to looser match
let sizeFixed = 0;
const patterns = [
  // Primary: node default CATEGORY with flowchart ID
  /<g class="node default (\w+)"[^>]*?id="[^"]*flowchart[^"]*"[^>]*?transform="translate\([^)]+\)"[^>]*?>.*?<rect\s([^>]*?)(\/?>)/gs,
  // Fallback 1: node default CATEGORY without flowchart ID
  /<g class="node default (\w+)"[^>]*?transform="translate\([^)]+\)"[^>]*?>.*?<rect\s([^>]*?)(\/?>)/gs,
  // Fallback 2: any node with class containing a category
  /<g class="node[^"]*"?[^>]*?transform="translate\([^)]+\)"[^>]*?>.*?<rect\s([^>]*?)(\/?>)/gs,
];

const catEntries = {};
let matched = false;

for (const pattern of patterns) {
  pattern.lastIndex = 0;
  let match;
  while ((match = pattern.exec(svg)) !== null) {
    matched = true;
    const cat = match[1] || 'default';
    const attrs = match[2];

    const wMatch = attrs.match(/width="([^"]*)"/);
    const hMatch = attrs.match(/height="([^"]*)"/);
    if (wMatch && hMatch) {
      if (!catEntries[cat]) catEntries[cat] = [];
      catEntries[cat].push({
        full: match[0],
        prefix: match[0].substring(0, match[0].length - match[2].length - match[3].length),
        attrs,
        suffix: match[3],
        w: parseFloat(wMatch[1]),
        h: parseFloat(hMatch[1]),
      });
    }
  }
  if (matched) break;
}

if (!matched) {
  warnings.push('WARN: No node <rect> elements matched — size unification skipped');
}

for (const [cat, entries] of Object.entries(catEntries)) {
  const maxW = Math.max(...entries.map(e => e.w));
  const maxH = Math.max(...entries.map(e => e.h));

  for (const e of entries) {
    if (e.w < maxW || e.h < maxH) {
      let newAttrs = e.attrs;
      newAttrs = newAttrs.replace(/x="[^"]*"/, `x="${-maxW / 2}"`);
      newAttrs = newAttrs.replace(/y="[^"]*"/, `y="${-maxH / 2}"`);
      newAttrs = newAttrs.replace(/width="[^"]*"/, `width="${maxW}"`);
      newAttrs = newAttrs.replace(/height="[^"]*"/, `height="${maxH}"`);

      const old = e.full;
      const replacement = e.prefix + newAttrs + e.suffix;
      svg = svg.replace(old, replacement);
      sizeFixed++;
    }
  }
}

// ---- Write output ----
fs.writeFileSync(path.resolve(outPath), svg);

// ---- Report ----
if (warnings.length > 0) {
  console.error('postprocess.cjs warnings:');
  warnings.forEach(w => console.error('  ' + w));
}
console.log('Done:', outPath, isDark ? `(dark: ${Object.keys(fillMap || {}).length} colors mapped)` : '(light)', sizeFixed > 0 ? `(${sizeFixed} rects resized)` : '');

// --- Helper: darken a hex color by keeping a fraction of lightness ---
function darkenHex(hex, keepRatio) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      case bn: h = ((rn - gn) / d + 4) / 6; break;
    }
  }

  const darkL = 0.08 + (l * keepRatio) * 0.10;
  const [dr, dg, db] = hslToRgb(h, s, darkL);
  return '#' + [dr, dg, db].map(v => v.toString(16).padStart(2, '0')).join('');
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1/3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}
