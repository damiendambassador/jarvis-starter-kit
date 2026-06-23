import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'index.html');

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

await page.setViewport({ width: 3500, height: 1300, deviceScaleFactor: 1 });
await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });

// Attendre que les polices Google Fonts soient chargées
await page.evaluateHandle('document.fonts.ready');
await new Promise(r => setTimeout(r, 1500));

// Sélectionner les 3 conteneurs de templates (divs avec width:1080px)
const templates = await page.$$('div[style*="width:1080px;height:1080px"]');

const labels = ['conseil-du-jour', 'question-du-jour', 'concept-du-jour'];

for (let i = 0; i < templates.length; i++) {
  const outputPath = path.join(__dirname, `template-${i + 1}-${labels[i]}.png`);
  await templates[i].screenshot({ path: outputPath });
  console.log(`✓ template-${i + 1}-${labels[i]}.png`);
}

await browser.close();
console.log('Terminé.');
