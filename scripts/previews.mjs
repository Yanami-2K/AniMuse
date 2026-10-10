// 用 Playwright 给每个效果截两张海报（960×720）：preview.png（中文）和 preview.en.png（英文，Demo 里的文字跟着换）。
// 用法：npm i && npx playwright install chromium && npm run previews [-- slug ...]
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer((req, res) => {
  let p = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
}).listen(0);
const port = server.address().port;

const only = process.argv.slice(2);
const slugs = readdirSync(join(ROOT, 'effects')).filter((s) => existsSync(join(ROOT, 'effects', s, 'meta.json')) && (!only.length || only.includes(s)));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 });
for (const slug of slugs) {
  const meta = JSON.parse(readFileSync(join(ROOT, 'effects', slug, 'meta.json'), 'utf8'));
  for (const [lang, file] of [['zh', 'preview.png'], ['en', 'preview.en.png']]) {
    await page.goto(`http://localhost:${port}/effects/${slug}/index.html?lang=${lang}`);
    await page.waitForTimeout(meta.posterAt ?? 2500);   // 在 meta.json 里用 posterAt(ms) 指定截哪一刻
    await page.screenshot({ path: join(ROOT, 'effects', slug, file) });
  }
  console.log('✓', slug);
}
await browser.close(); server.close();
