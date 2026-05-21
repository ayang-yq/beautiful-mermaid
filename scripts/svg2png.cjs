const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const [,, svgPath, pngPath, scaleStr] = process.argv;
const scale = parseFloat(scaleStr) || 2;

(async () => {
  const svgAbs = path.resolve(svgPath);
  const pngAbs = path.resolve(pngPath);
  const svg = fs.readFileSync(svgAbs, 'utf8');
  
  // Extract viewBox dimensions
  const vbMatch = svg.match(/viewBox="([\d.]+ [\d.]+ [\d.]+ [\d.]+)"/);
  const parts = vbMatch ? vbMatch[1].split(' ').map(Number) : [0, 0, 800, 600];
  const [, , w, h] = parts;
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: Math.ceil(w) + 40, height: Math.ceil(h) + 40, deviceScaleFactor: scale });
  
  // Embed SVG inline in HTML (not as <img>, so foreignObject renders correctly)
  const html = `<!DOCTYPE html>
<html><head><style>
  body { margin: 0; padding: 20px; }
</style></head><body>
${svg}
</body></html>`;
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  // Small delay to ensure fonts load
  await new Promise(r => setTimeout(r, 500));
  
  const body = await page.$('svg');
  await body.screenshot({ path: pngAbs, type: 'png' });
  
  await browser.close();
  console.log('Done:', pngAbs);
})();
