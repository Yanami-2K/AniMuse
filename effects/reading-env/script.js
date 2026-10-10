// Reading Environment — 天气画在一张不接收指针的 canvas 上；声音是 Web Audio 现场合成的滤波噪声，没有任何音频文件
// 想法：Paco Coursey https://x.com/pacocoursey/status/1460760109009752066
(function () {
  var css = getComputedStyle(document.documentElement);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var RAIN = num('--rain'), SNOW = num('--snow'), FADE = num('--fade');
  var $ = function (id) { return document.getElementById(id); };
  var sky = $('sky'), g = sky.getContext('2d'), menu = $('menu'), sub = $('sub'), miEnv = $('miEnv'), miAudio = $('miAudio'), fab = $('fab'), cursor = $('cursor');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
  if (LANG === 'en') { document.documentElement.lang = 'en'; document.querySelectorAll('[data-en]').forEach(function (el) { el.innerHTML = el.dataset.en; }); document.querySelectorAll('[data-en-label]').forEach(function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }

  // —— 粒子 ——
  var W = 0, H = 0, dpr = 1, drops = [], flakes = [], mix = { rain: 0, snow: 0 }, target = { rain: 0, snow: 0 }, env = 'off', raf = 0, last = 0;
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    sky.width = W * dpr; sky.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var k = W / 1000;
    drops = []; for (var i = 0; i < RAIN * Math.max(.5, k); i++) drops.push(newDrop(true));
    flakes = []; for (var j = 0; j < SNOW * Math.max(.5, k); j++) flakes.push(newFlake(true));
    if (reduce) still();
  }
  function newDrop(any) { var z = Math.random(); return { x: Math.random() * (W + 80) - 40, y: any ? Math.random() * H : -40 - Math.random() * 120, z: z, len: 10 + z * 18, v: 520 + z * 620, a: .08 + z * .2 }; } // z 越大越近：越长、越快、越实
  function newFlake(any) { var z = Math.random(); return { x: Math.random() * W, y: any ? Math.random() * H : -10, z: z, r: .8 + z * 1.9, v: 14 + z * 30, ph: Math.random() * 6.28, sw: 8 + z * 18, a: .18 + z * .38 }; }
  function frame(t) {
    var dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
    ['rain', 'snow'].forEach(function (k) { var d = target[k] - mix[k], s = dt * 1000 / FADE; mix[k] = Math.abs(d) <= s ? target[k] : mix[k] + Math.sign(d) * s; });
    g.clearRect(0, 0, W, H);
    if (mix.rain > 0) {
      g.lineCap = 'round';
      drops.forEach(function (p) {
        p.y += p.v * dt; p.x -= p.v * dt * .08;
        if (p.y - p.len > H) Object.assign(p, newDrop(false));
        g.strokeStyle = 'rgba(90,90,90,' + (p.a * mix.rain).toFixed(3) + ')'; g.lineWidth = .6 + p.z * .6;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + p.len * .08, p.y - p.len); g.stroke();
      });
    }
    if (mix.snow > 0) {
      flakes.forEach(function (p) {
        p.y += p.v * dt; p.ph += dt * (.6 + p.z * .6); var x = p.x + Math.sin(p.ph) * p.sw;
        if (p.y - p.r > H) Object.assign(p, newFlake(false));
        g.fillStyle = 'rgba(120,120,120,' + (p.a * mix.snow).toFixed(3) + ')'; g.beginPath(); g.arc(x, p.y, p.r, 0, 6.283); g.fill();
      });
    }
    raf = (mix.rain || mix.snow || target.rain || target.snow) && !document.hidden ? requestAnimationFrame(frame) : 0;
  }
  function kick() { if (!raf && !reduce && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  document.addEventListener('visibilitychange', function () { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else kick(); }); // 切到后台就停
  function still() { // 减少动态：不动，只画一层很淡的静态纹理
    g.clearRect(0, 0, W, H); if (env === 'off') return;
    if (env === 'rain') { g.strokeStyle = 'rgba(90,90,90,.08)'; g.lineWidth = .8; drops.forEach(function (p) { g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + 1.5, p.y - p.len); g.stroke(); }); }
    else flakes.forEach(function (p) { g.fillStyle = 'rgba(120,120,120,.12)'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill(); });
  }

  // —— 声音：噪声 → 滤波 → 增益；雨 = 高通 + 低通的白噪声，风 = 布朗噪声 + 缓慢扫动的低通 ——
  var ac = null, bus = {}, audioOn = false;
  function noise(brown) {
    var len = ac.sampleRate * 3, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0), last = 0;
    for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; if (brown) { last = (last + .02 * w) / 1.02; d[i] = last * 3.2; } else d[i] = w; }
    var s = ac.createBufferSource(); s.buffer = b; s.loop = true; return s;
  }
  function initAudio() {
    if (ac) return; var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ac = new AC();
    var master = ac.createGain(); master.gain.value = .5; master.connect(ac.destination);
    // 雨
    var r = noise(false), hp = ac.createBiquadFilter(), lp = ac.createBiquadFilter(), rg = ac.createGain();
    hp.type = 'highpass'; hp.frequency.value = 500; lp.type = 'lowpass'; lp.frequency.value = 5200; rg.gain.value = 0;
    r.connect(hp); hp.connect(lp); lp.connect(rg); rg.connect(master); r.start();
    // 风
    var w = noise(true), wl = ac.createBiquadFilter(), wg = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    wl.type = 'lowpass'; wl.frequency.value = 420; wl.Q.value = 6; wg.gain.value = 0;
    lfo.frequency.value = .08; lg.gain.value = 260; lfo.connect(lg); lg.connect(wl.frequency); lfo.start();
    w.connect(wl); wl.connect(wg); wg.connect(master); w.start();
    bus = { rain: rg, snow: wg };
  }
  function mixAudio() {
    if (!ac) return; var t = ac.currentTime, tau = FADE / 1000 / 3; // setTargetAtTime：约 FADE 毫秒淡完
    bus.rain.gain.setTargetAtTime(audioOn && env === 'rain' ? .32 : 0, t, tau);
    bus.snow.gain.setTargetAtTime(audioOn && env === 'snow' ? .55 : 0, t, tau);
  }
  function setEnv(v) {
    env = v; target.rain = v === 'rain' ? 1 : 0; target.snow = v === 'snow' ? 1 : 0;
    [].forEach.call(sub.querySelectorAll('[data-env]'), function (b) { b.setAttribute('aria-checked', String(b.dataset.env === v)); });
    miAudio.setAttribute('aria-disabled', String(v === 'off'));
    if (reduce) still(); else kick();
    mixAudio();
  }
  function toggleAudio() {
    if (env === 'off') return; audioOn = !audioOn; miAudio.setAttribute('aria-checked', String(audioOn));
    if (audioOn) { initAudio(); if (ac && ac.state === 'suspended') ac.resume(); } // 只有用户真的点了才创建 AudioContext（自动播放策略）
    mixAudio();
  }

  // —— 菜单 ——
  function pop(el) { el.hidden = false; if (!reduce) el.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 80, easing: 'ease-out' }); }
  function openMenu(x, y) {
    closeSub(); menu.hidden = false; var w = menu.offsetWidth, h = menu.offsetHeight;
    x = Math.min(x, innerWidth - w - 8); y = Math.min(y, innerHeight - h - 8);
    menu.style.left = x + 'px'; menu.style.top = y + 'px'; menu.style.transformOrigin = '0 0'; menu.hidden = true; pop(menu);
    focusItem(miEnv, true);
  }
  function openSub(focusFirst) {
    if (!sub.hidden) { if (focusFirst) focusItem(sub.querySelector('.mi'), true); return; }
    var b = miEnv.getBoundingClientRect(); sub.hidden = false; var w = sub.offsetWidth, h = sub.offsetHeight; sub.hidden = true;
    var x = b.right + 4; if (x + w > innerWidth - 8) x = b.left - w - 4;
    sub.style.left = x + 'px'; sub.style.top = Math.min(b.top - 4, innerHeight - h - 8) + 'px'; pop(sub); miEnv.setAttribute('aria-expanded', 'true');
    if (focusFirst) focusItem(sub.querySelector('[aria-checked="true"]') || sub.querySelector('.mi'), true);
  }
  function closeSub() { sub.hidden = true; miEnv.setAttribute('aria-expanded', 'false'); }
  function closeAll() { menu.hidden = true; closeSub(); }
  function focusItem(el, kb) { if (!el || !document.hasFocus()) return;   // 自动演示时别把父页面焦点抢进 iframe
    try { el.focus({ preventScroll: true }); } catch (_) {} }
  addEventListener('contextmenu', function (e) { e.preventDefault(); userAct(); openMenu(e.clientX, e.clientY); });
  fab.addEventListener('click', function (e) { var b = fab.getBoundingClientRect(); userAct(); openMenu(b.left, b.top - 90); e.stopPropagation(); });
  miEnv.addEventListener('pointerenter', function () { openSub(false); });
  miEnv.addEventListener('click', function () { openSub(true); });
  miAudio.addEventListener('pointerenter', closeSub);
  miAudio.addEventListener('click', function () { toggleAudio(); });
  sub.addEventListener('click', function (e) { var b = e.target.closest('[data-env]'); if (b) { setEnv(b.dataset.env); closeAll(); } });
  addEventListener('pointerdown', function (e) { if (!menu.hidden && !menu.contains(e.target) && !sub.contains(e.target) && e.button !== 2) closeAll(); });
  addEventListener('keydown', function (e) {
    if (menu.hidden) return; userAct();
    var inSub = sub.contains(document.activeElement), list = [].slice.call((inSub ? sub : menu).querySelectorAll('.mi')), i = list.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); if (inSub) { closeSub(); focusItem(miEnv); } else closeAll(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); focusItem(list[(i + 1) % list.length]); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusItem(list[(i - 1 + list.length) % list.length]); }
    else if (e.key === 'ArrowRight' && document.activeElement === miEnv) { e.preventDefault(); openSub(true); }
    else if (e.key === 'ArrowLeft' && inSub) { e.preventDefault(); closeSub(); focusItem(miEnv); }
  });

  // —— 自动演示：假指针右键 → Environment → Rain；过一会儿再右键 → Snow；再关掉 ——
  var run = 0, demoOn = false, userAt = -1e9, fk = { x: 0, y: 0 };
  function userAct() { userAt = performance.now(); if (demoOn) { run++; demoOn = false; cursor.classList.remove('on'); } }
  addEventListener('pointermove', function (e) { if (e.isTrusted) userAct(); });
  var wait = function (t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); };
  function to(x, y, d, id) { return new Promise(function (res) { var x0 = fk.x, y0 = fk.y, t0 = performance.now();
    (function f(t) { if (id !== run) return; var p = Math.min(1, (t - t0) / d), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; fk.x = x0 + (x - x0) * e; fk.y = y0 + (y - y0) * e; cursor.style.translate = fk.x + 'px ' + fk.y + 'px'; if (p < 1) requestAnimationFrame(f); else res(); })(t0); }); }
  var at = function (el, ox) { var b = el.getBoundingClientRect(); return [b.left + b.width * (ox || .3), b.top + b.height * .55]; };
  async function pick(v, id) {
    var x = innerWidth * (.45 + Math.random() * .2), y = innerHeight * (.42 + Math.random() * .15);
    await to(x, y, 700, id); await wait(150, id);
    var ring = document.createElement('i'); ring.className = 'ring'; ring.style.left = x + 'px'; ring.style.top = y + 'px'; document.body.appendChild(ring);
    ring.animate([{ transform: 'scale(.4)', opacity: 1 }, { transform: 'scale(1.3)', opacity: 0 }], { duration: 380, easing: 'ease-out' }).onfinish = function () { ring.remove(); };
    openMenu(x + 2, y + 2); await wait(380, id);
    var p = at(miEnv); await to(p[0], p[1], 280, id); miEnv.classList.add('hl'); openSub(false); await wait(260, id);
    var b = sub.querySelector('[data-env="' + v + '"]'); p = at(b);
    await to(p[0] - 30, p[1] - 2, 200, id); await to(p[0], p[1], 220, id); b.classList.add('hl'); await wait(200, id);
    b.classList.remove('hl'); miEnv.classList.remove('hl'); setEnv(v); closeAll();
  }
  async function demo() {
    var id = ++run; demoOn = true; if (reduce) return;
    fk.x = innerWidth * .8; fk.y = innerHeight * .95; cursor.style.translate = fk.x + 'px ' + fk.y + 'px'; cursor.classList.add('on');
    await wait(600, id); await pick('rain', id); await to(innerWidth * .85, innerHeight * .8, 600, id); await wait(2600, id);
    await pick('snow', id); await to(innerWidth * .85, innerHeight * .8, 600, id); await wait(3200, id);
    await pick('off', id); cursor.classList.remove('on'); await wait(1400, id);
    demoOn = false;
  }
  setInterval(function () { if (!demoOn && !reduce && menu.hidden && performance.now() - userAt > 8000) demo(); }, 1000);
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') { run++; demoOn = false; closeAll(); setEnv('off'); userAt = -1e9; demo(); } });
  addEventListener('resize', resize);
  resize(); setEnv(reduce ? 'rain' : 'off'); if (!reduce) setTimeout(demo, 400);
})();
