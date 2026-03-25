const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const svgContent = fs.readFileSync(path.join(__dirname, '../favicon.svg'), 'utf8');
const sizes = [16, 32, 48, 180];

(async () => {
  const browser = await puppeteer.launch();
  for (const size of sizes) {
    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:transparent">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
        ${svgContent.replace(/<svg[^>]*>/, '').replace('</svg>', '')}
      </svg>
    </body></html>`;
    const page = await browser.newPage();
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const out = path.join(__dirname, `../favicon-${size}.png`);
    await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
    console.log(`✓ favicon-${size}.png`);
    await page.close();
  }
  await browser.close();
})();
