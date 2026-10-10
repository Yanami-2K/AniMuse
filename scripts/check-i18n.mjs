// 语言一致性检查：英文模式下页面上不允许出现任何中文（CJK）字符。
// 检查范围：画廊首页、每个效果的详情（标题、说明、参数、两种 Prompt 的正文）、每个效果 Demo 本身（?lang=en）。
// 内嵌源码版 Prompt 里的代码块（```…```）不检查——那是源码原文（注释是中文），不是界面文案。
// 用法：npm run build && npm run check:i18n        （需要 playwright + chromium）
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (!existsSync(join(ROOT, 'index.html'))) { console.error('✗ 先跑 npm run build'); process.exit(1); }
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer((req, res) => {
  let p = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(readFileSync(p));
}).listen(0);
const BASE = `http://localhost:${server.address().port}/`;
const CJK = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/;
const problems = [];
const report = (where, text) => {
  const lines = text.split('\n').filter((l) => CJK.test(l));
  if (lines.length) problems.push(`${where}\n    ` + lines.slice(0, 5).map((l) => l.trim().slice(0, 120)).join('\n    '));
};
const visible = () => {   // 页面上看得到的文字 + 输入框占位符 + 可访问名称
  const out = [document.body.innerText];
  document.querySelectorAll('input[placeholder],textarea[placeholder]').forEach((e) => out.push(e.placeholder));
  document.querySelectorAll('[aria-label]').forEach((e) => { if (e.getClientRects().length) out.push(e.getAttribute('aria-label')); });
  document.querySelectorAll('[title]').forEach((e) => { if (e.getClientRects().length) out.push(e.title); });
  out.push(document.title);
  return out.join('\n');
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
await ctx.addInitScript(() => { try { localStorage.setItem('animuse.lang', 'en'); } catch (e) {} });
const page = await ctx.newPage();
page.on('pageerror', (e) => problems.push('JS error: ' + e.message));

// 1. 画廊首页
await page.goto(BASE); await page.waitForTimeout(1200);
report('gallery', await page.evaluate(visible));
const slugs = await page.evaluate(() => window.ANIMUSE.effects.map((e) => e.slug));

// 2. 每个效果的详情 + 两种 Prompt
for (const slug of slugs) {
  await page.evaluate((s) => { location.hash = '#/fx/' + s; }, slug); await page.waitForTimeout(350);
  report(`detail ${slug}`, await page.evaluate(() => document.getElementById('detail').innerText));
  await page.click('#seg button[data-v="inline"]'); await page.waitForTimeout(80);
  report(`prompt(inline, prose) ${slug}`, await page.evaluate(() => document.getElementById('pText').textContent.replace(/```[\s\S]*?```/g, '')));
  await page.click('#seg button[data-v="ref"]');
}

// 3. 每个 Demo 本身
const fx = await ctx.newPage();
fx.on('pageerror', (e) => problems.push('JS error (demo): ' + e.message));
for (const slug of slugs) {
  await fx.goto(`${BASE}effects/${slug}/index.html?lang=en`); await fx.waitForTimeout(900);
  report(`demo ${slug}`, await fx.evaluate(visible));
}
await browser.close(); server.close();
if (problems.length) { console.error(`✗ 英文模式下发现中文（${problems.length} 处）：\n  ` + problems.join('\n  ')); process.exit(1); }
console.log(`✓ EN 模式无中文：画廊 + ${slugs.length} 个详情 + ${slugs.length} 个 Demo`);
