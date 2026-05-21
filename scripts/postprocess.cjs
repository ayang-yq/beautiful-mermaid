#!/usr/bin/env node
/**
 * Post-process Mermaid SVG: inject CSS + uniform node sizes + dark mode fill override.
 *
 * Dark mode: replace inline fill PER CATEGORY with dark variants.
 *   client  → #3b1530 (dark rose)    stroke stays #c62828
 *   gateway → #3b2a10 (dark amber)   stroke stays #e65100
 *   service → #102a3b (dark blue)    stroke stays #1565c0
 *   data    → #2a1035 (dark purple)  stroke stays #7b1fa2
 *   monitor → #0f2a10 (dark green)   stroke stays #2e7d32
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

// 2. Dark mode: replace inline fills per category
if (isDark) {
  const darkFills = {
    client:  '#3b1530',
    gateway: '#3b2a10',
    service: '#102a3b',
    data:    '#2a1035',
    monitor: '#0f2a10',
  };
  const defaultDark = '#1e293b';

  // Strategy: find each node <g class="node default CATEGORY" ...>
  // then find its label-container rect/path inside and replace fill
  for (const [cat, fill] of Object.entries(darkFills)) {
    // Match <g class="node default CATEGORY" ...> ... <rect/path class="...label-container..." style="fill:... !important..." ...>
    const nodeRegex = new RegExp(
      `<g class="node default ${cat}"[^>]*>[\\s\\S]*?` +
      `class="[^"]*label-container[^"]*"\\s+style="([^"]*)"`,
      'g'
    );
    svg = svg.replace(nodeRegex, (match, styleContent) => {
      const newStyle = styleContent.replace(
        /fill:#[0-9a-fA-F]+\s*!important/,
        `fill:${fill} !important`
      );
      return match.replace(styleContent, newStyle);
    });
  }
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
