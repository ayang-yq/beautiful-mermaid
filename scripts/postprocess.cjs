#!/usr/bin/env node
/**
 * Post-process Mermaid SVG: inject CSS + uniform node sizes per category.
 * NO cluster alignment. NO node/edge moving.
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

// 1. Inject CSS before </style>
svg = svg.replace('</style>', '\n' + css + '\n</style>');

// 2. Uniform node sizes per category
// Match: <g class="node default <category>" ... transform="translate(...)"> ... <rect .../>
const pattern = /<g class="node default (\w+)"[^>]*?id="my-svg-flowchart-\w+-\d+"[^>]*?transform="translate\([^)]+\)"[^>]*?>.*?<rect\s([^>]*?)(\/?>)/gs;

const catEntries = {};
let match;

// Reset lastIndex for global regex
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
