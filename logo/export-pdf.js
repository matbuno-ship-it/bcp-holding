const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const logos = ['logo-dark', 'logo-light', 'logo-transparent'];

(async () => {
  const browser = await puppeteer.launch();
  for (const name of logos) {
    const svgPath = path.join(__dirname, `${name}.svg`);
    const svgContent = fs.readFileSync(svgPath, 'utf8');

    const bg = name === 'logo-light' ? '#ffffff' : '#0f0720';

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:40px;background:${bg};display:inline-block">
      ${svgContent}
    </body></html>`;

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');

    const el = await page.$('svg');
    const box = await el.boundingBox();

    await page.pdf({
      path: path.join(__dirname, `${name}.pdf`),
      width: `${box.width + 80}px`,
      height: `${box.height + 80}px`,
      printBackground: true,
    });

    console.log(`✓ ${name}.pdf`);
    await page.close();
  }
  await browser.close();
})();
