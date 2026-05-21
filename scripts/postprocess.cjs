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

// 1. Inject CSS before </style>
svg = svg.replace('</style>', '\n' + css + '\n</style>');

// 2. Dark mode: replace inline fills with darkened versions
if (isDark) {
  // Collect unique fill values from label-container inline styles
  const fillRegex = /class="[^"]*label-container[^"]*"\s+style="([^"]*)"/g;
  const lightFills = new Set();
  let m;
  while ((m = fillRegex.exec(svg)) !== null) {
    const fm = m[1].match(/fill:(#[0-9a-fA-F]+)\s*!important/);
    if (fm) lightFills.add(fm[1].toLowerCase());
  }
  fillRegex.lastIndex = 0;

  // Build fill mapping: light → dark
  const fillMap = {};
  for (const light of lightFills) {
    fillMap[light] = darkenHex(light, 0.3); // keep 30% of original lightness
  }

  // Apply replacements
  svg = svg.replace(
    /class="[^"]*label-container[^"]*"\s+style="([^"]*)"/g,
    (match, styleContent) => {
      const fm = styleContent.match(/fill:(#[0-9a-fA-F]+)\s*!important/);
      if (fm) {
        const darkFill = fillMap[fm[1].toLowerCase()];
        if (darkFill) {
          const newStyle = styleContent.replace(
            /fill:#[0-9a-fA-F]+\s*!important/,
            `fill:${darkFill} !important`
          );
          return match.replace(styleContent, newStyle);
        }
      }
      return match;
    }
  );
}

// 3. Uniform node sizes per category
const pattern = /<g class="node default (\w+)"[^>]*?id="my-svg-flowchart-\w+-\d+"[^>]*?transform="translate\([^)]+\)"[^>]*?>.*?<rect\s([^>]*?)(\/?>)/gs;

const catEntries = {};
let match;

pattern.lastIndex = 0;
while ((match = pattern.exec(svg)) !== null) {
  const cat = match[1];
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
    }
  }
}

fs.writeFileSync(path.resolve(outPath), svg);
console.log('Done:', outPath);

// --- Helper: darken a hex color by keeping a fraction of lightness ---
function darkenHex(hex, keepRatio) {
  // Parse hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Convert to HSL
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

  // Reduce lightness to a dark range (8-18%)
  const darkL = 0.08 + (l * keepRatio) * 0.10;

  // Convert back to RGB
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
