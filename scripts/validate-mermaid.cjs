#!/usr/bin/env node
/**
 * Validate Mermaid syntax and output render info.
 * Cross-platform (Node.js) replacement for validate-mermaid.sh.
 *
 * Usage: node validate-mermaid.cjs <file.mmd>
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const mmdFile = process.argv[2];

if (!mmdFile) {
  console.error('Usage: node validate-mermaid.cjs <file.mmd>');
  process.exit(1);
}

const resolved = path.resolve(mmdFile);
if (!fs.existsSync(resolved)) {
  console.error(`ERROR: File not found: ${resolved}`);
  process.exit(1);
}

// Check mmdc availability
try {
  execSync('mmdc --version', { stdio: 'pipe' });
} catch {
  console.error('ERROR: mmdc not found. Install: npm install -g @mermaid-js/mermaid-cli');
  process.exit(1);
}

console.log(`=== Validating: ${path.basename(resolved)} ===`);

// Create temp file
const tmpFile = path.join(os.tmpdir(), `mermaid-validate-${Date.now()}.svg`);

try {
  execSync(`mmdc -i "${resolved}" -o "${tmpFile}" -t default`, {
    stdio: 'inherit',
    timeout: 30000,
  });

  const svgContent = fs.readFileSync(tmpFile, 'utf8');
  const nodeCount = (svgContent.match(/class="node"/g) || []).length;
  const edgeCount = (svgContent.match(/class="edgeLabel"/g) || []).length;
  const svgSize = Buffer.byteLength(svgContent);

  console.log(`✓ Syntax valid`);
  console.log(`  Nodes: ${nodeCount || 'N/A'}`);
  console.log(`  Edges: ${edgeCount || 'N/A'}`);
  console.log(`  SVG size: ${(svgSize / 1024).toFixed(1)} KB`);

  fs.unlinkSync(tmpFile);
  process.exit(0);
} catch {
  console.error('✗ Syntax error detected');
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  process.exit(1);
}
