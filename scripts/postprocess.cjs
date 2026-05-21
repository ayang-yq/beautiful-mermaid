#!/usr/bin/env node
/**
 * Post-process Mermaid SVG: inject CSS + strip inline fills + uniform node sizes.
 * NO cluster alignment. NO node/edge moving.
 *
 * Mermaid 11.15+ puts classDef colors as inline style="fill:... !important;stroke:... !important"
 * which overrides any CSS. We strip those inline fills so CSS themes take full control.
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

// 2. Strip inline fill/stroke from node label-containers (rect and cylinder path)
//    Mermaid 11.15+ puts classDef colors inline with !important, blocking CSS themes.
//    We remove them so CSS .node.<category> selectors take over.
svg = svg.replace(
  /(<rect\s+class="basic label-container"\s+style=")([^"]*?)(")/g,
  (match, prefix, styleStr, suffix) => {
    const cleaned = styleStr
      .replace(/fill:[^;"]*!important;?/g, '')
      .replace(/stroke:[^;"]*!important;?/g, '')
      .replace(/stroke-width:[^;"]*!important;?/g, '')
      .replace(/;{2,}/g, ';')
      .replace(/;\s*"/, '"');
    return prefix + cleaned + suffix;
  }
);

svg = svg.replace(
  /(<path\s+class="basic label-container outer-path"\s+style=")([^"]*?)(")/g,
  (match, prefix, styleStr, suffix) => {
    const cleaned = styleStr
      .replace(/fill:[^;"]*!important;?/g, '')
      .replace(/stroke:[^;"]*!important;?/g, '')
      .replace(/stroke-width:[^;"]*!important;?/g, '')
      .replace(/;{2,}/g, ';')
      .replace(/;\s*"/, '"');
    return prefix + cleaned + suffix;
  }
);

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
