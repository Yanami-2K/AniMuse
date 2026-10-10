/* AniMuse site — vanilla JS, no deps. 所有动画只动 transform / opacity。 */
(function () {
  'use strict';
  var D = window.ANIMUSE;                       // 由 build.mjs 生成：{ repo, ref, effects:[...], categories:{} }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'cubic-bezier(.2,.8,.2,1)';
  var SPRING = 'cubic-bezier(.34,1.56,.64,1)';
  var FX = D.effects;

  /* ---------------- i18n ---------------- */
  var T = {
    zh: {
      brandZh: '动效灵感', navGallery: '效果', navContribute: '投稿', eyebrow: '开源 · 原生 HTML / CSS / JS · MIT',
      lede: '看到喜欢的动效却说不清？\n挑一个，复制 Prompt，丢给你的 AI。',
      sub: '每个效果都是能直接打开的源码。Prompt 里写清楚时长、曲线、错峰，再把源码链接附上，AI 照着抄就不会走样。',
      ctaBrowse: '逛逛效果', countUnit: '个效果，持续更新', curveCap: '全站只用这一条曲线', searchPh: '搜一下：打字、按钮、猫…',
      all: '全部', empty: '没找到。换个词试试，或者', emptyLink: '投一个进来',
      contribEyebrow: '投稿', contribTitle: '你也做了一个好看的动效？', contribText: '建一个目录，放 index.html、style.css、script.js 和 meta.json，提个 PR 就行。不需要构建工具，不需要框架。',
      treeHtml: '# 双击就能打开的 Demo', treeCss: '# 参数都放在 :root 变量里', treeJs: '# 可选', treeMeta: '# 名字、分类、参数',
      replay: '重播', openDemo: '单独打开', viewSrc: '看源码', howTitle: '怎么做的', paramsTitle: '关键参数', promptTitle: 'Prompt',
      vRef: '引用源码', vInline: '内嵌源码', copy: '复制 Prompt', copied: '复制好了',
      hintRef: 'AI 能联网就用这个：Prompt 很短，附上固定版本的源码链接，让它自己去读。',
      hintInline: 'AI 上不了网（或者公司内网）就用这个：源码直接贴在 Prompt 里，长一点但最稳。',
      toast: '复制好了，粘贴到 Cursor / Claude Code / Codex 试试', toastQuick: '已复制「{n}」的 Prompt', live: 'LIVE', quick: '复制 Prompt',
      chars: '{n} 字', pinned: '源码固定在 {r}'
    },
    en: {
      brandZh: 'Motion muse', navGallery: 'Effects', navContribute: 'Contribute', eyebrow: 'Open source · vanilla HTML / CSS / JS · MIT',
      lede: 'Saw a motion you love but can’t describe it?\nPick one, copy the prompt, hand it to your AI.',
      sub: 'Every effect is real, runnable source. The prompt spells out durations, curves and staggers, and links the exact source, so the AI copies instead of guessing.',
      ctaBrowse: 'Browse effects', countUnit: 'effects and counting', curveCap: 'One easing curve, everywhere', searchPh: 'Search: typing, button, cat…',
      all: 'All', empty: 'Nothing here. Try another word, or', emptyLink: 'contribute one',
      contribEyebrow: 'Contribute', contribTitle: 'Made a beautiful motion too?', contribText: 'Add a folder with index.html, style.css, script.js and meta.json, then open a PR. No build tools, no framework.',
      treeHtml: '# a demo you can double-click', treeCss: '# params live in :root vars', treeJs: '# optional', treeMeta: '# name, category, params',
      replay: 'Replay', openDemo: 'Open demo', viewSrc: 'Source', howTitle: 'How it works', paramsTitle: 'Key params', promptTitle: 'Prompt',
      vRef: 'Link source', vInline: 'Inline source', copy: 'Copy prompt', copied: 'Copied',
      hintRef: 'For agents with web access: a short prompt plus links to the source, pinned to an exact commit.',
      hintInline: 'For agents without web access: the full source is pasted in. Longer, but bulletproof.',
      toast: 'Copied. Paste it into Cursor / Claude Code / Codex', toastQuick: 'Copied the prompt for “{n}”', live: 'LIVE', quick: 'Copy prompt',
      chars: '{n} chars', pinned: 'source pinned to {r}'
    }
  };
  var lang = localStorage.getItem('animuse.lang') || ((navigator.language || 'zh').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en');
  var t = function (k, v) { var s = (T[lang] || T.zh)[k] || k; if (v) for (var x in v) s = s.replace('{' + x + '}', v[x]); return s; };
  var L = function (o) { return o ? (o[lang] || o.zh) : ''; };
  var catName = function (c) { return c === 'all' ? t('all') : L(D.categories[c]); };

  function applyLang() {
    root.lang = lang === 'zh' ? 'zh-CN' : 'en';
    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    splitWords($('#lede'));
    $$('[data-i18n-html]').forEach(function (el) { el.textContent = t(el.dataset.i18nHtml); });
    $$('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.dataset.i18nPh); });
    document.title = lang === 'zh' ? 'AniMuse · 动效灵感' : 'AniMuse · Motion inspiration you can copy';
    renderChips(); cards.forEach(fillCard);
    if (current) fillDetail(current, true);
  }
  $('#lang').addEventListener('click', function () {
    lang = lang === 'zh' ? 'en' : 'zh'; localStorage.setItem('animuse.lang', lang); applyLang();
    var lede = $('#lede'); if (!reduce) lede.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: EASE });
  });

  /* ---------------- prompts ---------------- */
  var RAW = function (slug, f) { return 'https://raw.githubusercontent.com/' + D.repo + '/' + D.ref + '/effects/' + slug + '/' + f; };
  var BLOB = function (slug) { return 'https://github.com/' + D.repo + '/tree/' + D.ref + '/effects/' + slug; };
  function paramsBlock(e) {
    return e.params.map(function (p) { return '- ' + p.name + ': ' + p['default'] + ' — ' + L(p.desc); }).join('\n');
  }
  function buildPrompt(e, variant) {
    var zh = lang === 'zh', n = L(e.name), lines = [];
    if (zh) {
      lines.push('帮我在当前项目里做一个「' + n + '」（' + e.name.en + '）动效。', '');
      lines.push('效果：' + e.summary.zh);
      lines.push('做法：' + e.technique.zh, '');
      lines.push('关键参数（数值请照抄，别自己估）：', paramsBlock(e), '');
      if (variant === 'ref') {
        lines.push('参考实现在 AniMuse 开源仓库里，已经固定到 ' + D.ref.slice(0, 7) + ' 这个版本。动手前先把这几个文件完整读一遍：');
        e.files.forEach(function (f) { lines.push('- ' + RAW(e.slug, f)); });
        lines.push('');
      } else {
        lines.push('下面是完整的参考实现（来自 AniMuse 开源仓库 ' + D.repo + '，版本 ' + D.ref.slice(0, 7) + '），请先读完再动手：', '');
        e.files.forEach(function (f) { lines.push('```' + ext(f) + ' title="' + f + '"', (e.source[f] || '').trimEnd(), '```', ''); });
      }
      lines.push('要求：');
      lines.push('1. 跟着我项目现有的技术栈写（React / Vue / Svelte / 原生都行），别为了这个引入新的动画库。');
      lines.push('2. 时长、缓动曲线、错峰、弹簧参数照参考实现来，这些数字就是这个效果的手感。');
      lines.push('3. 文案、颜色、尺寸换成我项目里的；参数做成 CSS 变量或 props，方便以后调。');
      lines.push('4. 尽量只动 transform 和 opacity，保证 60fps。');
      lines.push('5. 支持 prefers-reduced-motion: reduce，开启时直接显示最终状态。');
      lines.push('6. 参考实现里为了演示写的自动循环 / 自动播放，正式用的时候去掉，改成真实的触发时机。');
      lines.push('', '做完告诉我放在了哪个文件、怎么调参数。');
    } else {
      lines.push('Build a “' + e.name.en + '” motion effect in my current project.', '');
      lines.push('What it is: ' + e.summary.en);
      lines.push('How it works: ' + e.technique.en, '');
      lines.push('Key params (copy these numbers exactly, do not eyeball them):', paramsBlock(e), '');
      if (variant === 'ref') {
        lines.push('The reference implementation lives in the AniMuse open-source repo, pinned to ' + D.ref.slice(0, 7) + '. Read these files in full before writing any code:');
        e.files.forEach(function (f) { lines.push('- ' + RAW(e.slug, f)); });
        lines.push('');
      } else {
        lines.push('Here is the full reference implementation (AniMuse, ' + D.repo + ' @ ' + D.ref.slice(0, 7) + '). Read it all first:', '');
        e.files.forEach(function (f) { lines.push('```' + ext(f) + ' title="' + f + '"', (e.source[f] || '').trimEnd(), '```', ''); });
      }
      lines.push('Requirements:');
      lines.push('1. Use my project’s existing stack (React / Vue / Svelte / vanilla — follow the codebase). Don’t add an animation library for this.');
      lines.push('2. Keep durations, easing curves, staggers and spring values identical to the reference; those numbers are the feel.');
      lines.push('3. Swap in my own copy, colors and sizes; expose the params as CSS variables or props.');
      lines.push('4. Animate only transform and opacity where possible, so it stays at 60fps.');
      lines.push('5. Respect prefers-reduced-motion: reduce by showing the final state.');
      lines.push('6. Drop the demo-only autoplay/loop from the reference and wire it to a real trigger.');
      lines.push('', 'When done, tell me which file it lives in and how to tweak the params.');
    }
    return lines.join('\n');
  }
  function ext(f) { return f.split('.').pop() === 'js' ? 'js' : f.split('.').pop(); }

  /* ---------------- clipboard + toast ---------------- */
  function copyText(s) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(s);
    var ta = document.createElement('textarea'); ta.value = s; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {} ta.remove(); return Promise.resolve();
  }
  var toastT;
  function toast(msg) {
    var el = $('#toast'); $('#toastText').textContent = msg;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('on'); }, 2400);
  }

  /* ---------------- hero wordmark ---------------- */
  var word = $('#word'), letters = [];
  'AniMuse'.split('').forEach(function (ch, i) {
    var l = document.createElement('span'); l.className = 'l';
    var s = document.createElement('span'); s.textContent = ch === 'i' ? 'ı' : ch; l.appendChild(s);
    if (ch === 'i') { var dot = document.createElement('i'); dot.className = 'idot'; l.appendChild(dot); l.classList.add('li'); }
    l.setAttribute('aria-hidden', 'true'); word.appendChild(l); letters.push(l);
  });
  var idot = $('.idot');

  function intro() {
    document.body.classList.remove('loading');
    if (reduce) { revealCards(true); return; }
    var at = function (sel, d) { var el = typeof sel === 'string' ? $(sel) : sel; el.style.setProperty('--d', d + 'ms'); el.classList.add('intro'); };
    at('.top', 0);
    at('.eyebrow', 120);
    // 字母：从下面翻上来，带一点过冲；错峰 55ms
    letters.forEach(function (l, i) {
      l.firstChild.animate([
        { transform: 'translateY(.7em) rotate(8deg) scaleY(1.15)', opacity: 0 },
        { transform: 'translateY(-.04em) rotate(-1deg) scaleY(.96)', opacity: 1, offset: .62 },
        { transform: 'none', opacity: 1 }
      ], { duration: 900, delay: 160 + i * 55, easing: EASE, fill: 'backwards' });
    });
    // i 的点：最后从高处掉下来，压扁、弹一下
    idot.animate([
      { transform: 'translateY(-2.4em) scale(.6)', opacity: 0 },
      { transform: 'translateY(-2.2em) scale(.6)', opacity: 1, offset: .08 },
      { transform: 'translateY(0) scale(1.35,.6)', offset: .5, easing: 'cubic-bezier(.3,0,.3,1)' },
      { transform: 'translateY(-.55em) scale(.9,1.12)', offset: .72, easing: 'cubic-bezier(.3,0,.7,1)' },
      { transform: 'translateY(0) scale(1.12,.88)', offset: .88 },
      { transform: 'none' }
    ], { duration: 1100, delay: 760, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'backwards' }).finished.then(function () { dotReady = true; });
    // lede：按词错峰出现
    var lede = $('#lede');
    lede.classList.add('intro'); lede.style.setProperty('--d', '0ms');
    $$('.w', lede).forEach(function (w, i) { w.animate([{ opacity: 0, transform: 'translateY(.5em)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 900 + i * 28, easing: EASE, fill: 'backwards' }); });
    at('.sub', 1150); at('.hero-cta', 1250); at('.curve', 1000); at('.bar', 1350);
    countTo($('#heroCount'), FX.length, 1300);
    setTimeout(function () { revealCards(false); }, 1300);
  }
  function splitWords(el) {
    var txt = el.textContent, out = '';
    // 中文按字、英文按词拆开；标点粘在前一个字上，避免「，」被挤到行首
    var parts = txt.match(/\n|[ \t]+|[A-Za-z’'?.,!]+[，。？！、]?|[^\sA-Za-z][，。？！、]?/g) || [];
    parts.forEach(function (p) { out += p === '\n' ? '<br>' : /^\s+$/.test(p) ? p : '<span class="w">' + p.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>'; });
    el.innerHTML = out;
  }
  function countTo(el, n, delay) {
    if (reduce) { el.textContent = n; return; }
    setTimeout(function () {
      var t0 = performance.now(), dur = 900;
      (function f(now) { var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(n * e); if (p < 1) requestAnimationFrame(f); })(t0);
    }, delay);
  }

  /* 光标靠近时，字母像琴键一样被“抬”起来；i 的点会看向光标。弹簧插值，离开后自己停掉 rAF */
  var dotReady = false, hero = $('#hero'), px = -1e4, py = -1e4, heroRaf = 0;
  var st = letters.map(function () { return { y: 0, v: 0 }; }), dotS = { x: 0, y: 0, vx: 0, vy: 0 };
  function heroTick() {
    var moving = false, lr = word.getBoundingClientRect(), fs = parseFloat(getComputedStyle(word).fontSize);
    letters.forEach(function (l, i) {
      var r = l.getBoundingClientRect(), cx = r.left + r.width / 2;
      var dx = (px - cx) / (fs * .9), dy = (py - (lr.top + lr.height / 2)) / (fs * 1.1);
      var near = Math.exp(-(dx * dx) - (dy * dy) * .6);                // 高斯落差
      var target = -near * fs * .07;
      var s = st[i]; s.v = (s.v + (target - s.y) * .14) * .74; s.y += s.v;
      if (Math.abs(s.v) > .01 || Math.abs(target - s.y) > .05) moving = true;
      l.style.transform = 'translate3d(0,' + s.y.toFixed(2) + 'px,0)';
    });
    if (dotReady) {
      var dr = idot.getBoundingClientRect(), ox = dr.left + dr.width / 2 - dotS.x, oy = dr.top + dr.height / 2 - dotS.y;
      var ax = px - ox, ay = py - oy, dist = Math.sqrt(ax * ax + ay * ay) || 1, lim = Math.min(dist * .02, fs * .035);
      var tx = px < -1e3 ? 0 : ax / dist * lim, ty = px < -1e3 ? 0 : ay / dist * lim;
      dotS.vx = (dotS.vx + (tx - dotS.x) * .12) * .78; dotS.vy = (dotS.vy + (ty - dotS.y) * .12) * .78;
      dotS.x += dotS.vx; dotS.y += dotS.vy;
      if (Math.abs(dotS.vx) + Math.abs(dotS.vy) > .02) moving = true;
      idot.style.transform = 'translate3d(' + dotS.x.toFixed(2) + 'px,' + dotS.y.toFixed(2) + 'px,0)';
    }
    heroRaf = moving ? requestAnimationFrame(heroTick) : 0;
  }
  function kick() { if (!heroRaf && !reduce) heroRaf = requestAnimationFrame(heroTick); }
  hero.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; px = e.clientX; py = e.clientY; kick(); });
  hero.addEventListener('pointerleave', function () { px = py = -1e4; kick(); });
  // 点一下 i 的点：它会跳一下
  word.addEventListener('click', function () {
    if (reduce) return;
    idot.animate([{ translate: '0 0' }, { translate: '0 -.6em', offset: .4, easing: 'cubic-bezier(.2,.8,.4,1)' }, { translate: '0 0', offset: .8, easing: 'cubic-bezier(.6,0,1,.6)' }, { translate: '0 0', scale: '1.2 .8', offset: .9 }, { translate: '0 0', scale: '1 1' }], { duration: 700 });
  });

  /* ---------------- chips (stretchy pill, 同 effects/tab-slide) ---------------- */
  var chipsEl = $('#chips'), pill = $('#chipPill'), cat = 'all', q = '', pillAnim;
  function counts() { var c = { all: FX.length }; FX.forEach(function (e) { c[e.category] = (c[e.category] || 0) + 1; }); return c; }
  function renderChips() {
    var c = counts(), keys = ['all'].concat(Object.keys(D.categories).filter(function (k) { return c[k]; }));
    $$('.chip', chipsEl).forEach(function (b) { b.remove(); });
    keys.forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (k === cat ? ' on' : ''); b.dataset.cat = k; b.setAttribute('role', 'tab');
      b.innerHTML = catName(k) + '<sup>' + c[k] + '</sup>';
      b.addEventListener('click', function () { setCat(k); });
      chipsEl.appendChild(b);
    });
    requestAnimationFrame(function () { placePill(false); });
  }
  function chipBox(k) { var b = $('.chip[data-cat="' + k + '"]', chipsEl); return b ? { x: b.offsetLeft, w: b.offsetWidth, el: b } : null; }
  function placePill(animFrom) {
    var b = chipBox(cat); if (!b) return;
    var to = { transform: 'translateX(' + b.x + 'px)', width: b.w + 'px' };
    pill.style.transform = to.transform; pill.style.width = to.width;
    if (animFrom && !reduce) {
      var x = Math.min(animFrom.x, b.x), w = Math.max(animFrom.x + animFrom.w, b.x + b.w) - x;
      if (pillAnim) pillAnim.cancel();
      pillAnim = pill.animate([{ transform: 'translateX(' + animFrom.x + 'px)', width: animFrom.w + 'px' }, { transform: 'translateX(' + x + 'px)', width: w * .9 + 'px', offset: .42 }, to], { duration: 520, easing: 'cubic-bezier(.65,0,.35,1)' });
    }
    // 选中的 chip 滚到可见（手机上横向滚动）
    var cl = chipsEl.scrollLeft, cw = chipsEl.clientWidth;
    if (b.x < cl || b.x + b.w > cl + cw) chipsEl.scrollTo({ left: b.x - cw / 2 + b.w / 2, behavior: reduce ? 'auto' : 'smooth' });
  }
  function setCat(k) {
    if (k === cat) return;
    var from = chipBox(cat); cat = k;
    $$('.chip', chipsEl).forEach(function (b) { b.classList.toggle('on', b.dataset.cat === k); });
    placePill(from); filter(); toGrid();
  }
  function toGrid() {   // 筛选时如果已经滚到网格里面了，就回到网格顶部，免得结果被吸顶栏挡住
    var y = $('#gallery').getBoundingClientRect().top + scrollY - 58;
    if (scrollY > y + 4) scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ---------------- cards ---------------- */
  var grid = $('#grid'), cards = [];
  var ICON_COPY = '<svg class="cp" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg><svg class="ok" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7"/></svg>';
  FX.forEach(function (e, i) {
    // 用 div[role=link] 而不是 <a>：避免浏览器左下角的链接预览条挡住画面；键盘和 ⌘/中键点击另行处理
    var a = document.createElement('div'); a.className = 'card pre'; a.tabIndex = 0; a.setAttribute('role', 'link'); a.dataset.slug = e.slug;
    a.innerHTML = '<i class="tick t1"></i><i class="tick t2"></i><i class="tick t3"></i><i class="tick t4"></i>' +
      '<div class="stage"><img alt="" loading="lazy" decoding="async" src="effects/' + e.slug + '/preview.png"><span class="live"><i></i>LIVE</span></div>' +
      '<div class="meta"><span class="no">' + String(e.order).padStart(2, '0') + '</span><span class="nm"><b></b><small></small></span><span class="cat"></span>' +
      '<button class="qcopy" type="button">' + ICON_COPY + '</button></div>';
    a.querySelector('.qcopy').addEventListener('click', function (ev) {
      ev.preventDefault(); ev.stopPropagation(); var btn = this;
      copyText(buildPrompt(e, 'ref')).then(function () {
        btn.classList.add('done'); setTimeout(function () { btn.classList.remove('done'); }, 1600);
        if (!reduce) btn.animate([{ transform: 'scale(.8)' }, { transform: 'scale(1.12)', offset: .5 }, { transform: 'scale(1)' }], { duration: 420, easing: SPRING });
        toast(t('toastQuick', { n: L(e.name) }));
      });
    });
    a.addEventListener('click', function (ev) { if (ev.metaKey || ev.ctrlKey || ev.shiftKey) { window.open('#/fx/' + e.slug, '_blank'); return; } open(e.slug, a); });
    a.addEventListener('auxclick', function (ev) { if (ev.button === 1) window.open('#/fx/' + e.slug, '_blank'); });
    a.addEventListener('keydown', function (ev) { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target === a) { ev.preventDefault(); open(e.slug, a); } });
    a.addEventListener('pointerenter', function () { replay(a); });
    grid.appendChild(a); cards.push(a); fillCard(a);
  });
  function fillCard(a) {
    var e = bySlug(a.dataset.slug);
    $('.nm b', a).textContent = L(e.name); $('.nm small', a).textContent = lang === 'zh' ? e.name.en : L(D.categories[e.category]);
    $('.cat', a).textContent = catName(e.category); $('.cat', a).style.display = lang === 'zh' ? '' : 'none';
    var q = $('.qcopy', a); q.title = t('quick'); q.setAttribute('aria-label', t('quick') + ' · ' + L(e.name));
  }
  function bySlug(s) { for (var i = 0; i < FX.length; i++) if (FX[i].slug === s) return FX[i]; }
  var lastReplay = new WeakMap();
  function replay(a) {
    var f = $('iframe', a); if (!f || !f.contentWindow) return;
    var now = performance.now(); if (now - (lastReplay.get(a) || 0) < 1500) return; lastReplay.set(a, now);
    f.contentWindow.postMessage('animuse:replay', '*');
  }

  /* 进入视口才挂 iframe（离开 1 秒后卸掉，只留海报），省 CPU */
  var liveIO = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      var a = en.target, st = $('.stage', a);
      if (en.isIntersecting) {
        clearTimeout(a._unload);
        if (!$('iframe', st)) {
          var f = document.createElement('iframe'); f.loading = 'lazy'; f.tabIndex = -1; f.title = a.dataset.slug; f.setAttribute('aria-hidden', 'true');
          f.src = 'effects/' + a.dataset.slug + '/index.html';
          f.onload = function () { setTimeout(function () { f.classList.add('ready'); st.classList.add('on'); }, 120); };
          st.appendChild(f);
        }
      } else {
        a._unload = setTimeout(function () { var f = $('iframe', st); if (f) { f.remove(); st.classList.remove('on'); } }, 1000);
      }
    });
  }, { rootMargin: '120px 0px' });

  /* 卡片滚动入场：同一批进入的按顺序错峰 */
  var revealIO, revealQ = [], revealT;
  function revealCards(instant) {
    cards.forEach(function (a) { liveIO.observe(a); });
    if (instant) { cards.forEach(function (a) { a.classList.remove('pre'); }); return; }
    revealIO = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { revealQ.push(en.target); revealIO.unobserve(en.target); } });
      clearTimeout(revealT); revealT = setTimeout(flushReveal, 16);
    }, { rootMargin: '0px 0px -2% 0px', threshold: .02 });
    cards.forEach(function (a) { revealIO.observe(a); });
  }
  function flushReveal() {
    revealQ.sort(function (a, b) { return cards.indexOf(a) - cards.indexOf(b); });
    revealQ.forEach(function (a, i) {
      a.animate([{ opacity: 0, transform: 'translateY(28px) scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: i * 70, easing: EASE, fill: 'backwards' });
      a.classList.remove('pre');
    });
    revealQ = [];
  }

  /* ---------------- filter + search (FLIP) ---------------- */
  var qEl = $('#q'), qT;
  qEl.addEventListener('input', function () { clearTimeout(qT); qT = setTimeout(function () { q = qEl.value.trim().toLowerCase(); filter(); toGrid(); }, 120); });
  function match(e) {
    if (cat !== 'all' && e.category !== cat) return false;
    if (!q) return true;
    var hay = [e.name.zh, e.name.en, e.summary.zh, e.summary.en, e.tags.join(' '), e.tech.join(' '), L(D.categories[e.category]), D.categories[e.category].en, e.slug].join(' ').toLowerCase();
    return q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
  }
  var filtering = 0;
  function filter() {
    var id = ++filtering;
    var next = cards.map(function (a) { return match(bySlug(a.dataset.slug)); });
    var leaving = cards.filter(function (a, i) { return !a.hidden && !next[i]; });
    var go = function () {
      if (id !== filtering) return;
      var first = new Map(), h0 = grid.offsetHeight;
      cards.forEach(function (a) { if (!a.hidden) first.set(a, a.getBoundingClientRect()); });
      cards.forEach(function (a, i) { a.hidden = !next[i]; a.style.opacity = ''; });
      $('#empty').hidden = next.some(Boolean);
      if (reduce) return;
      // 网格高度也过渡一下，下面的内容就不会“跳”上来被卡片压住
      var h1 = grid.offsetHeight;
      if (Math.abs(h1 - h0) > 2) grid.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 620, easing: EASE });
      var k = 0;
      cards.forEach(function (a) {
        if (a.hidden) return;
        a.classList.remove('pre');
        var r = a.getBoundingClientRect(), f = first.get(a);
        if (f) {
          var dx = f.left - r.left, dy = f.top - r.top;
          if (Math.abs(dx) + Math.abs(dy) > 1) a.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 620, easing: EASE });
        } else {
          a.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 60 + k++ * 40, easing: EASE, fill: 'backwards' });
        }
      });
    };
    if (!leaving.length || reduce) return go();
    leaving.forEach(function (a) { a.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).finished.then(function (an) { }).catch(function () {}); });
    setTimeout(function () { leaving.forEach(function (a) { a.getAnimations().forEach(function (an) { an.cancel(); }); }); go(); }, 180);
  }

  /* ---------------- detail ---------------- */
  var pending = null;
  var detail = $('#detail'), dStage = $('#dStage'), current = null, variant = 'ref', lastCard = null;
  function stageImg(e) { return '<img alt="" src="effects/' + e.slug + '/preview.png">'; }
  function fillDetail(e, keepStage) {
    var idx = FX.indexOf(e);
    $('#dCrumb').textContent = 'effects/' + e.slug + '  ·  ' + String(idx + 1).padStart(2, '0') + ' / ' + String(FX.length).padStart(2, '0');
    $('#dNo').textContent = 'No.' + String(e.order).padStart(2, '0') + ' · ' + catName(e.category);
    $('#dTitle').textContent = L(e.name);
    $('#dEn').textContent = lang === 'zh' ? e.name.en : e.name.zh;
    $('#dSum').textContent = L(e.summary);
    $('#dHow').textContent = L(e.technique);
    $('#dTech').innerHTML = e.tech.concat(['no deps']).map(function (x) { return '<span>' + x + '</span>'; }).join('');
    $('#dParams').innerHTML = e.params.map(function (p) { return '<tr><td><code>' + esc(p.name) + '</code></td><td class="dv">' + esc(p['default']) + '</td><td>' + esc(L(p.desc)) + '</td></tr>'; }).join('');
    $('#dOpen').href = 'effects/' + e.slug + '/index.html';
    $('#dSrc').href = BLOB(e.slug);
    if (!keepStage) { dStage.innerHTML = stageImg(e); }
    renderPrompt(false);
  }
  function loadStageFrame(e) {
    if ($('iframe', dStage)) return;
    var f = document.createElement('iframe'); f.title = L(e.name); f.src = 'effects/' + e.slug + '/index.html';
    f.onload = function () { setTimeout(function () { f.classList.add('ready'); }, 80); };
    dStage.appendChild(f);
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function renderPrompt(animate) {
    if (!current) return;
    var s = buildPrompt(current, variant), el = $('#pText');
    el.innerHTML = esc(s).replace(/(https:\/\/raw\.githubusercontent\.com\/\S+)/g, '<span class="u">$1</span>');
    el.scrollTop = 0;
    $('#pHint').textContent = t(variant === 'ref' ? 'hintRef' : 'hintInline');
    $('#pMeta').textContent = t('chars', { n: s.length.toLocaleString() }) + ' · ' + t('pinned', { r: D.ref.slice(0, 7) });
    if (animate && !reduce) { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); }
    $$('#seg button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.v === variant); });
    placeSeg();
  }
  function placeSeg() {
    var b = $('#seg button[aria-selected="true"]'), p = $('.seg-pill');
    if (!b || !b.offsetWidth) return;
    p.style.width = b.offsetWidth + 'px'; p.style.transform = 'translateX(' + b.offsetLeft + 'px)';
  }
  $$('#seg button').forEach(function (b) { b.addEventListener('click', function () { if (variant === b.dataset.v) return; variant = b.dataset.v; renderPrompt(true); }); });

  function withVT(fn) {
    if (document.startViewTransition && !reduce) { var vt = document.startViewTransition(fn); vt.ready.catch(function () {}); vt.updateCallbackDone.catch(function () {}); return vt.finished.catch(function () {}); }
    fn(); return Promise.resolve();
  }
  function open(slug, fromCard, viaHash) {
    var e = bySlug(slug); if (!e) return;
    var wasOpen = !detail.hidden;
    if (!wasOpen && pending === slug) return;
    current = e; lastCard = fromCard || $('.card[data-slug="' + slug + '"]');
    if (!viaHash && location.hash !== '#/fx/' + slug) history.pushState(null, '', '#/fx/' + slug);
    if (wasOpen) {   // 详情内切换：内容淡入
      fillDetail(e); loadStageFrame(e);
      if (!reduce) dStage.animate([{ opacity: 0, transform: 'scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE });
      staggerInfo(0);
      $('.sheet-body').scrollTop = 0; return;
    }
    if (viaHash) {   // 直接打开链接：没有来源卡片，整块淡入即可
      fillDetail(e); detail.hidden = false; document.body.classList.add('lock'); placeSeg(); loadStageFrame(e);
      if (!reduce) { $('#sheet').animate([{ opacity: 0, transform: 'translateY(18px) scale(.99)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: EASE }); staggerInfo(100); }
      return;
    }
    pending = slug;
    var srcStage = lastCard && $('.stage', lastCard);
    var usedVT = !!document.startViewTransition && !reduce;
    var rect = srcStage && srcStage.getBoundingClientRect();
    // 先把详情页的海报解码好，否则 View Transition 抓到的新画面是空白
    var img = new Image(); img.alt = ''; img.src = 'effects/' + e.slug + '/preview.png';
    var ready = img.decode ? img.decode().catch(function () {}) : Promise.resolve();
    Promise.race([ready, new Promise(function (r) { setTimeout(r, 250); })]).then(function () {
    if (current !== e) return;
    if (srcStage) srcStage.style.viewTransitionName = 'fx-stage';
    withVT(function () {
      if (srcStage) srcStage.style.viewTransitionName = '';
      fillDetail(e); dStage.innerHTML = ''; dStage.appendChild(img);
      detail.hidden = false; document.body.classList.add('lock');
      dStage.style.viewTransitionName = 'fx-stage';
      placeSeg(); staggerInfo(80);
    }).then(function () {
      pending = null;
      dStage.style.viewTransitionName = '';
      loadStageFrame(e);
      $('#sheet').focus({ preventScroll: true });
    });
    if (!usedVT && !reduce && rect) flipIn(rect);
    });
  }
  function staggerInfo(base) {   // 右侧信息逐行落位
    if (reduce) return;
    $$('.d-info > *').concat($$('.d-stage-tools, .d-prompt')).forEach(function (el, i) {
      el.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 640, delay: base + i * 35, easing: EASE, fill: 'backwards' });
    });
  }
  function flipIn(rect) {   // 不支持 View Transitions 时的兜底：舞台从卡片位置飞过来
    requestAnimationFrame(function () {
      var r = dStage.getBoundingClientRect();
      dStage.animate([{ transform: 'translate(' + (rect.left - r.left) + 'px,' + (rect.top - r.top) + 'px) scale(' + rect.width / r.width + ')', transformOrigin: '0 0' }, { transform: 'none', transformOrigin: '0 0' }], { duration: 560, easing: EASE });
      $('.detail-scrim').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
      staggerInfo(120);
    });
  }
  function close(viaHash) {
    if (detail.hidden) return;
    if (!viaHash) history.pushState(null, '', location.pathname + location.search);
    var card = current && $('.card[data-slug="' + current.slug + '"]');
    if (card && !card.hidden) { var r = card.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) card.scrollIntoView({ block: 'center' }); }
    var f = $('iframe', dStage); if (f) f.remove();
    dStage.style.viewTransitionName = 'fx-stage';
    var cs = card && !card.hidden ? $('.stage', card) : null;
    withVT(function () {
      dStage.style.viewTransitionName = '';
      detail.hidden = true; document.body.classList.remove('lock');
      if (cs) cs.style.viewTransitionName = 'fx-stage';
    }).then(function () { if (cs) cs.style.viewTransitionName = ''; if (card) card.focus({ preventScroll: true }); current = null; });
    if (!document.startViewTransition) current = null;
  }
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', function () { close(); }); });
  $('#dPrev').addEventListener('click', function () { step(-1); });
  $('#dNext').addEventListener('click', function () { step(1); });
  function step(d) { if (!current) return; var list = FX.filter(function (e) { return match(e); }); if (list.indexOf(current) < 0) list = FX; var i = (list.indexOf(current) + d + list.length) % list.length; open(list[i].slug); }
  $('#dReplay').addEventListener('click', function () {
    var f = $('iframe', dStage); if (f) f.contentWindow.postMessage('animuse:replay', '*');
    var b = this; b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin');
  });
  $('#copy').addEventListener('click', function () {
    var btn = this, s = buildPrompt(current, variant), lbl = $('.lbl', btn);
    copyText(s).then(function () {
      var from = lbl.offsetWidth; btn.classList.add('done');
      var to = $('.b', lbl).offsetWidth; lbl.style.width = to + 'px';
      if (!reduce) lbl.animate([{ width: from + 'px' }, { width: to + 'px' }], { duration: 420, easing: 'cubic-bezier(.65,0,.35,1)' });
      toast(t('toast'));
      clearTimeout(btn._t); btn._t = setTimeout(function () {
        var f2 = lbl.offsetWidth; btn.classList.remove('done'); var t2 = $('.a', lbl).offsetWidth; lbl.style.width = t2 + 'px';
        if (!reduce) lbl.animate([{ width: f2 + 'px' }, { width: t2 + 'px' }], { duration: 420, easing: 'cubic-bezier(.65,0,.35,1)' });
      }, 2000);
    });
  });
  $('#sheet').tabIndex = -1;

  /* ---------------- routing + keys + scroll state ---------------- */
  function route() {
    var m = location.hash.match(/^#\/fx\/([\w-]+)/);
    if (m) open(m[1], null, true); else close(true);
  }
  addEventListener('popstate', route);
  addEventListener('hashchange', function () { if (/^#\/fx\//.test(location.hash)) route(); });
  addEventListener('keydown', function (e) {
    if (!detail.hidden) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight' && e.target.tagName !== 'PRE') step(1);
      else if (e.key === 'ArrowLeft' && e.target.tagName !== 'PRE') step(-1);
      return;
    }
    if (e.key === '/' && document.activeElement !== qEl) { e.preventDefault(); qEl.focus(); $('#gallery').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
    if (e.key === 'Escape' && document.activeElement === qEl) { qEl.value = ''; q = ''; filter(); qEl.blur(); }
  });
  var top = $('#top'), bar = $('#bar'), ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      top.classList.toggle('scrolled', scrollY > 8);
      bar.classList.toggle('stuck', bar.getBoundingClientRect().top <= 57);
      ticking = false;
    });
  }, { passive: true });
  addEventListener('resize', function () { placePill(false); placeSeg(); });

  /* ---------------- go ---------------- */
  applyLang();
  var go = function () { intro(); route(); };
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 400); })]).then(go); else go();
})();
