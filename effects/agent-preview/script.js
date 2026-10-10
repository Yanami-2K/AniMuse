/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Agent Preview Card — 高度用 JS 弹簧单独动（ResizeObserver 量出每一步的真实高度），内容用 WAAPI 交叉淡化 + 方向滑动
// 交互想法：Mariana Castilho（Profound）https://x.com/mrncst/status/2107936011560837129
(function () {
  var css = getComputedStyle(document.documentElement);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var K = num('--k'), C = num('--c');
  var $ = function (id) { return document.getElementById(id); };
  var item = $('item'), dot = $('dot'), card = $('card'), vp = $('vp'), nEl = $('n'), back = $('back'), skip = $('skip'), next = $('next'), need = $('need'), cursor = $('cursor');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CHECK = '<svg viewBox="0 0 12 12"><path d="M2.5 6.5 L5 9 L9.5 3.5"/></svg>';
  var EN = LANG === 'en';
  var STEPS = EN ? [
    { t: 'single', q: 'Who is this dashboard mainly for?', o: ['Leadership, for the weekly sync', 'Ops, checking numbers daily', 'Sales, tracking their own deals'] },
    { t: 'multi', q: 'Which data sources should it pull from? (pick any)', o: ['Orders DB (MySQL)', 'Frontend analytics', 'CRM customers', 'Ad platforms'] },
    { t: 'single', q: 'Which metrics matter most first?', o: ['Growth: new & active', 'Conversion: every funnel step', 'Retention: day 1 / day 7'] },
    { t: 'text', q: 'Anything else I should keep in mind?', ph: 'e.g. refresh every Monday 9am, amounts in $k…' }
  ] : [
    { t: 'single', q: '这个看板主要给谁看？', o: ['管理层，每周例会用', '运营同学，每天盯数', '销售团队，看自己的业绩'] },
    { t: 'multi', q: '需要接入哪些数据源？（可多选）', o: ['订单库（MySQL）', '前端埋点', 'CRM 客户数据', '广告投放平台'] },
    { t: 'single', q: '最想先看到哪类指标？', o: ['增长：新增、活跃', '转化：漏斗每一步', '留存：次日 / 7 日'] },
    { t: 'text', q: '还有什么要我注意的吗？', ph: '比如：周一早上 9 点自动刷新，金额用万元…' }
  ];
  $('total').textContent = STEPS.length;
  var idx = 0, answers = [], open = false, cur = null, hS = { x: 0, v: 0, t: 0 }, raf = 0, ro;

  function render(i) {
    var s = STEPS[i], el = document.createElement('div'); el.className = 'step';
    var h = '<h3>' + s.q + '</h3>';
    if (s.t === 'text') h += '<textarea placeholder="' + s.ph + '">' + (answers[i] || '') + '</textarea>';
    else {
      s.o.forEach(function (o, k) {
        var on = s.t === 'single' ? answers[i] === k : (answers[i] || []).indexOf(k) > -1;
        h += '<button type="button" class="opt' + (on ? ' on' : '') + '" data-k="' + k + '">' + (s.t === 'single' ? '<i class="num">' + (k + 1) + '</i>' : '<i class="box">' + CHECK + '</i>') + '<span>' + o + '</span></button>';
      });
      h += '<button type="button" class="opt other"><i class="pen">✎</i><span>' + (EN ? 'Other…' : '其他…') + '</span></button>';
    }
    el.innerHTML = h; return el;
  }
  function choose(k) {
    var s = STEPS[idx]; if (!cur || s.t === 'text' || k >= s.o.length) return;
    if (s.t === 'single') answers[idx] = k;
    else { var a = answers[idx] || (answers[idx] = []), p = a.indexOf(k); p > -1 ? a.splice(p, 1) : a.push(k); }
    [].forEach.call(cur.querySelectorAll('.opt[data-k]'), function (b) { var j = +b.dataset.k; b.classList.toggle('on', s.t === 'single' ? answers[idx] === j : answers[idx].indexOf(j) > -1); });
  }
  vp.addEventListener('click', function (e) { var b = e.target.closest('.opt[data-k]'); if (b) choose(+b.dataset.k); });

  // —— 高度弹簧 ——
  function loop() {
    var dt = 1 / 240, guard = 0;
    for (var i = 0; i < 4; i++) { hS.v += (K * (hS.t - hS.x) - C * hS.v) * dt; hS.x += hS.v * dt; }
    vp.style.height = hS.x.toFixed(2) + 'px';
    if (Math.abs(hS.t - hS.x) > .3 || Math.abs(hS.v) > .3) raf = requestAnimationFrame(loop); else { hS.x = hS.t; vp.style.height = hS.t + 'px'; raf = 0; }
  }
  function fit(snap) { if (!cur) return; hS.t = cur.offsetHeight; if (snap || reduce) { hS.x = hS.t; hS.v = 0; vp.style.height = hS.t + 'px'; return; } if (!raf) raf = requestAnimationFrame(loop); }
  if (window.ResizeObserver) ro = new ResizeObserver(function () { fit(false); });

  function go(i, dir, snap) {
    var old = cur; idx = i; cur = render(i); vp.appendChild(cur);
    nEl.textContent = i + 1; back.classList.toggle('off', i === 0); next.classList.toggle('last', i === STEPS.length - 1);
    if (ro) { if (old) ro.unobserve(old); ro.observe(cur); }
    fit(snap);
    var d = dir * num('--slide') * parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (old) {
      old.style.pointerEvents = 'none';
      var out = old.animate(reduce ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-d) + 'px)' }], { duration: reduce ? 120 : 180, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
      out.onfinish = function () { old.remove(); };
    }
    if (!snap) cur.animate(reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateX(' + d + 'px)' }, { opacity: 1, transform: 'none' }], { duration: reduce ? 160 : 280, delay: reduce ? 0 : 60, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    var ta = cur.querySelector('textarea'); if (ta) setTimeout(function () { if (cur && cur.contains(ta) && document.hasFocus()) { try { ta.focus({ preventScroll: true }); } catch (_) {} } }, 120);
  }
  function nextStep() { if (!open) return; if (idx < STEPS.length - 1) go(idx + 1, 1); else submit(); }
  function prevStep() { if (open && idx > 0) go(idx - 1, -1); }
  next.addEventListener('click', nextStep); skip.addEventListener('click', nextStep); back.addEventListener('click', prevStep);

  // —— 打开 / 关闭 ——
  var spring = (function () { var z = .62, w = 2 * Math.PI * 1.7, wd = w * Math.sqrt(1 - z * z), p = []; for (var i = 0; i <= 40; i++) { var t = i / 40 * 1.1; p.push(+(1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t))).toFixed(4)); } p[40] = 1; return 'linear(' + p.join(',') + ')'; })();
  function place() { // 窄屏（手机竖屏）放不下右侧，就挂在导航项下面、左右各留 8px
    var b = item.getBoundingClientRect(), w = card.offsetWidth || 0;
    if (innerWidth < 560 || b.right + 8 + w > innerWidth - 4) { card.style.left = '8px'; card.style.right = '8px'; card.style.width = 'auto'; card.style.top = (b.bottom + 8) + 'px'; }
    else { card.style.right = ''; card.style.width = ''; card.style.left = (b.right + 8) + 'px'; card.style.top = Math.max(8, b.top - 10) + 'px'; } }
  function show() {
    if (open || submitted) return; open = true; place(); card.hidden = false; item.setAttribute('aria-expanded', 'true');
    if (!cur) go(0, 1, true); else fit(true);
    card.getAnimations().forEach(function (a) { a.cancel(); });
    card.animate(reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateX(-.4rem) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: reduce ? 120 : 420, easing: reduce ? 'ease-out' : spring });
  }
  function hide() {
    if (!open) return; open = false; item.setAttribute('aria-expanded', 'false');
    var a = card.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: reduce ? 'none' : 'translateX(-.25rem) scale(.98)' }], { duration: 130, easing: 'ease-in', fill: 'forwards' });
    a.onfinish = function () { if (!open) { card.hidden = true; a.cancel(); } };
    try { document.activeElement.blur(); } catch (_) {}
  }
  var hoverT;
  item.addEventListener('pointerenter', function () { clearTimeout(hoverT); hoverT = setTimeout(show, 120); });
  item.addEventListener('pointerleave', function () { clearTimeout(hoverT); });
  item.addEventListener('click', function () { open ? hide() : show(); });
  document.addEventListener('pointerdown', function (e) { if (open && e.isTrusted && !card.contains(e.target) && !item.contains(e.target)) hide(); });

  // 提交：按钮收成一个对勾 → 卡片缩回导航项 → 蓝点变绿再淡出
  var submitted = false;
  function submit() {
    if (submitted) return; submitted = true; next.classList.add('done'); need.classList.add('ok'); need.lastChild.textContent = EN ? 'Submitted' : '已提交';
    var ok = next.querySelector('.ok'), w = next.offsetWidth;
    next.animate([{ width: w + 'px' }, { width: next.offsetHeight + 'px' }], { duration: reduce ? 1 : 260, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' });
    ok.animate([{ strokeDashoffset: '16px' }, { strokeDashoffset: '0px' }], { duration: 260, delay: reduce ? 0 : 160, easing: 'ease-out', fill: 'forwards' });
    setTimeout(function () {
      var b = item.getBoundingClientRect(), c = card.getBoundingClientRect();
      var a = card.animate(reduce ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translate(' + (b.left + b.width * .5 - c.left) * .9 + 'px,' + (b.top - c.top) * .6 + 'px) scale(.12)' }],
        { duration: reduce ? 150 : 380, easing: 'cubic-bezier(.6,0,.4,1)', fill: 'forwards' });
      a.onfinish = function () { open = false; card.hidden = true; item.setAttribute('aria-expanded', 'false'); dot.classList.add('ok'); setTimeout(function () { dot.classList.add('gone'); }, 900); };
    }, reduce ? 300 : 620);
  }

  // —— 键盘 ——
  addEventListener('keydown', function (e) {
    if (e.isTrusted) userAct();
    if (!open) { if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === item) { e.preventDefault(); show(); } return; }
    var typing = e.target.tagName === 'TEXTAREA';
    if (e.key === 'Escape') { e.preventDefault(); hide(); item.focus(); }
    else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); nextStep(); }
    else if (!typing && /^[1-9]$/.test(e.key)) choose(+e.key - 1);
    else if (!typing && (e.key === 'Backspace' || e.key === 'ArrowLeft')) { e.preventDefault(); prevStep(); }
  });

  // —— 自动演示 ——
  var run = 0, demoOn = false, userAt = -1e9, fk = { x: 0, y: 0 };
  function userAct() { userAt = performance.now(); if (demoOn) { run++; demoOn = false; cursor.classList.remove('on'); } }
  addEventListener('pointermove', function (e) { if (e.isTrusted) userAct(); });
  addEventListener('pointerdown', function (e) { if (e.isTrusted) userAct(); }, true);
  var wait = function (t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); };
  function to(el, d, id, ox, oy) {
    var b = el.getBoundingClientRect(), x = b.left + b.width * (ox == null ? .5 : ox), y = b.top + b.height * (oy == null ? .55 : oy);
    return new Promise(function (res) {
      var x0 = fk.x, y0 = fk.y, t0 = performance.now();
      (function f(t) { if (id !== run) return; var p = Math.min(1, (t - t0) / d), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        fk.x = x0 + (x - x0) * e; fk.y = y0 + (y - y0) * e; cursor.style.translate = fk.x + 'px ' + fk.y + 'px'; if (p < 1) requestAnimationFrame(f); else res(); })(t0);
    });
  }
  async function tap(el, id) { cursor.style.scale = '.85'; el.classList.add('hl'); await wait(110, id); cursor.style.scale = ''; el.classList.remove('hl'); el.click(); }
  var opt = function (k) { return cur && cur.querySelectorAll('.opt[data-k]')[k]; };
  async function demo() {
    var id = ++run; demoOn = true; if (reduce) return;
    reset(true); fk.x = innerWidth * .7; fk.y = innerHeight * .9; cursor.style.translate = fk.x + 'px ' + fk.y + 'px'; cursor.classList.add('on');
    await wait(900, id);
    await to(item, 700, id, .45); show(); await wait(650, id);
    await to(opt(1), 520, id, .35); await tap(opt(1), id); await wait(300, id);
    await to(next, 420, id); await tap(next, id); await wait(520, id);
    await to(opt(0), 500, id, .3); await tap(opt(0), id); await wait(180, id);
    await to(opt(2), 300, id, .3); await tap(opt(2), id); await wait(180, id);
    await to(opt(3), 260, id, .3); await tap(opt(3), id); await wait(260, id);
    await to(next, 420, id); await tap(next, id); await wait(520, id);
    await to(opt(1), 460, id, .35); await tap(opt(1), id); await wait(240, id);
    await to(back, 380, id); await tap(back, id); await wait(600, id);
    await to(next, 420, id); await tap(next, id); await wait(420, id);
    await to(next, 300, id); await tap(next, id); await wait(400, id);
    var ta = cur.querySelector('textarea'), txt = EN ? 'Refresh every Monday at 9am' : '周一早上 9 点自动刷新';
    for (var i = 0; i < txt.length; i++) { ta.value += txt[i]; answers[idx] = ta.value; await wait(80, id); }
    await wait(300, id); await to(next, 420, id); await tap(next, id);
    await wait(700, id); await to({ getBoundingClientRect: function () { return { left: innerWidth * .6, top: innerHeight * .75, width: 0, height: 0 }; } }, 600, id);
    cursor.classList.remove('on'); await wait(2400, id);
    demoOn = false; demo();
  }
  function reset(keepDemo) {
    if (!keepDemo) { run++; demoOn = false; cursor.classList.remove('on'); }
    submitted = false; open = false; answers = []; idx = 0; card.hidden = true; card.getAnimations().forEach(function (a) { a.cancel(); });
    next.getAnimations().concat(next.querySelector('.ok').getAnimations()).forEach(function (a) { a.cancel(); });
    next.className = 'primary'; need.classList.remove('ok'); need.lastChild.textContent = EN ? 'Needs your input' : '等你确认'; dot.className = 'dot'; item.setAttribute('aria-expanded', 'false');
    vp.innerHTML = ''; cur = null;
  }
  setInterval(function () { if (!demoOn && !open && !reduce && performance.now() - userAt > 8000) demo(); }, 1000);
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') { reset(); userAt = -1e9; demo(); } });
  addEventListener('resize', function () { if (open) place(); });
  if (reduce) { show(); } else setTimeout(demo, 300);
})();
