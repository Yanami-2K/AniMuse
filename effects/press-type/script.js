/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); [].forEach.call(document.querySelectorAll('[data-en-ph]'), function (el) { el.placeholder = el.dataset.enPh; }); }
// Press Type（黑白线稿）— 压头加速砸下（ease-in），字从 scaleY(--squash) 开始按阻尼弹簧弹回 1；弹簧曲线采样成关键帧，横向按体积守恒反向缩放
(function () {
  var css = getComputedStyle(document.documentElement);
  var ms = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var STAGGER = ms('--stagger'), SLAM = ms('--slam'), SQ = ms('--squash'), HZ = ms('--wobble'), ZETA = ms('--bounce');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var row = $('row'), machine = $('machine'), said = $('said'), form = $('form'), input = $('word');
  var WORDS = LANG === 'en' ? ['HELLO', 'HOWDY', 'MEOW'] : ['你好呀', '开工啦', '喵一下'];
  var units = [], gen = 0, wi = 0, auto = true, autoT = 0;
  var isCJK = function (ch) { return /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/.test(ch); };

  // —— 弹簧：从 from 出发、初速度 0，按阻尼振动回到 1。采样成 WAAPI 关键帧 ——
  function spring(from, n) {
    var w = 2 * Math.PI * HZ, wd = w * Math.sqrt(1 - ZETA * ZETA), dur = 1000, out = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n * dur / 1000, a = Math.exp(-ZETA * w * t) * (Math.cos(wd * t) + ZETA * w / wd * Math.sin(wd * t));
      out.push(1 + (from - 1) * a);
    }
    out[n] = 1; return out;
  }
  function squashFrames(from) { // 纵向弹簧，横向体积守恒：sx = 1/√sy
    return spring(from, 30).map(function (sy) { return { transform: 'scale(' + (1 / Math.sqrt(sy)).toFixed(4) + ',' + sy.toFixed(4) + ')' }; });
  }

  // —— 搭一排压机 ——
  function build(word) {
    gen++; units = []; row.textContent = '';
    var chars = Array.from(word.trim()).filter(function (c) { return c.trim(); }).slice(0, 8);
    if (!chars.length) chars = Array.from(WORDS[0]);
    var cjk = chars.some(isCJK), list = chars.map(function (c) { return LANG === 'en' || !isCJK(c) ? c.toUpperCase() : c; });
    var wsum = 0;
    list.forEach(function (ch, i) {
      var zh = isCJK(ch), w = zh ? 1 : .8;
      wsum += w;
      var u = document.createElement('button'); u.type = 'button'; u.className = 'unit' + (zh ? ' zh' : '');
      u.style.setProperty('--w', w + 'em'); u.style.setProperty('--i', i);
      u.setAttribute('aria-label', LANG === 'en' ? 'Press “' + ch + '” again' : '再压一次「' + ch + '」');
      u.innerHTML = '<span class="press"><i></i></span><span class="dough"></span><span class="glyph"><span>' + ch + '</span></span>';
      u.addEventListener('click', function () { takeover(); stamp(units[i], 0, true); });
      row.appendChild(u);
      units.push({ el: u, press: u.querySelector('.press'), glyph: u.querySelector('.glyph'), dough: u.querySelector('.dough'), ch: ch });
    });
    // 字号：一排要放得下（30rem 宽的舞台里留 3rem 边）
    var fs = Math.min(4.1, 25 / (wsum + .16 * (list.length - 1) + .84));
    machine.style.setProperty('--fs', fs.toFixed(3) + 'rem');
    var text = list.join(''); said.textContent = text; row.setAttribute('aria-label', text);
  }

  // —— 砸一下 ——
  function stamp(u, delay, again) {
    var el = u.el, g = gen, rem = parseFloat(getComputedStyle(machine).fontSize);
    var travel = .62 + 1.12 * (1 - SQ); // 压头从静止位置下到“压扁后的字顶”
    if (reduce) { setTimeout(function () { if (g !== gen) return; el.classList.add('on'); }, delay); return; }
    var hit = delay + SLAM;
    u.press.animate([
      { transform: 'translateY(0)', easing: 'cubic-bezier(.55,0,.95,.45)' },
      { transform: 'translateY(' + travel + 'em)', offset: SLAM / 760 },
      { transform: 'translateY(' + travel + 'em)', offset: (SLAM + 60) / 760, easing: 'cubic-bezier(.2,.9,.3,1.25)' },
      { transform: 'translateY(-.08em)', offset: (SLAM + 420) / 760 },
      { transform: 'translateY(0)' }
    ], { duration: 760, delay: delay, fill: 'backwards' });
    setTimeout(function () {
      if (g !== gen) return;
      var first = !el.classList.contains('on');
      el.classList.add('on');
      u.glyph.animate(squashFrames(first ? SQ : Math.min(.8, SQ + .22)), { duration: 1000, easing: 'linear' });
      puffs(el); thump(1);
    }, hit);
  }
  function puffs(el) {
    [-1, 1].forEach(function (s) {
      for (var k = 0; k < 2; k++) {
        var p = document.createElement('i'); p.className = 'puff'; p.style.left = (50 + s * 34) + '%'; el.appendChild(p);
        var dx = s * (.22 + k * .16), dy = -(.06 + k * .14);
        p.animate([{ opacity: 1, transform: 'translate(0,0) scale(.4)' }, { opacity: 1, transform: 'translate(' + dx + 'em,' + dy + 'em) scale(' + (1.1 - k * .3) + ')', offset: .5 }, { opacity: 0, transform: 'translate(' + dx * 1.4 + 'em,' + dy * 1.6 + 'em) scale(.2)' }], { duration: 460, delay: k * 30, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = (function (p) { return function () { p.remove(); }; })(p);
      }
    });
  }
  function thump(f) { row.parentNode.querySelector('.belt').animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + (.03 * f) + 'em)' }, { transform: 'translateY(0)' }], { duration: 140, easing: 'ease-out' }); }

  // —— 一整排：依次砸下，最后的猫爪印章稍微晚一拍 ——
  function stampAll() {
    var t = 0;
    units.forEach(function (u, i) {
      stamp(u, t, false);
      t += STAGGER * (i % 2 ? 1.08 : .92); // 一点点不均匀，听起来更像机器
    });
    return t + SLAM + 900;
  }
  // —— 收起：压头一起轻轻按下，把字压回面团 ——
  function flatten() {
    if (reduce) { units.forEach(function (u) { u.el.classList.remove('on'); }); return 0; }
    units.forEach(function (u, i) {
      var d = i * 40;
      u.press.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(' + (.62 + 1.12 * .72) + 'em)', offset: .45 }, { transform: 'translateY(0)' }], { duration: 640, delay: d, easing: 'cubic-bezier(.45,0,.3,1)' });
      u.glyph.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.18,.28)', offset: .45 }, { transform: 'scale(1.1,.26)' }], { duration: 520, delay: d, easing: 'cubic-bezier(.45,0,.3,1)', fill: 'forwards' }).onfinish = function () { u.el.classList.remove('on'); u.glyph.getAnimations().forEach(function (a) { a.cancel(); }); };
    });
    return units.length * 40 + 640;
  }

  // —— 自动循环：每个词停一会儿，换下一个 ——
  function cycle(first) {
    var g = gen;
    var t = stampAll();
    if (!auto || reduce) return;
    autoT = setTimeout(function () {
      if (g !== gen || !auto) return;
      var t2 = flatten();
      autoT = setTimeout(function () {
        if (!auto) return;
        wi = (wi + 1) % WORDS.length; build(WORDS[wi]); popDough(); autoT = setTimeout(function () { cycle(); }, 520);
      }, t2 + 120);
    }, t + 2600);
  }
  function popDough() {
    if (reduce) return;
    units.forEach(function (u, i) { u.dough.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.2,.85)', offset: .6 }, { transform: 'scale(1)' }], { duration: 380, delay: i * 45, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }); });
  }
  function takeover() { auto = false; clearTimeout(autoT); clearTimeout(takeover.t); takeover.t = setTimeout(function () { auto = true; var t2 = flatten(); autoT = setTimeout(function () { wi = (wi + 1) % WORDS.length; build(WORDS[wi]); popDough(); autoT = setTimeout(cycle, 520); }, t2 + 120); }, 12000); }
  form.addEventListener('submit', function (e) {
    e.preventDefault(); takeover();
    var v = input.value.trim(); if (!v) v = WORDS[wi];
    var t2 = flatten(); clearTimeout(autoT);
    autoT = setTimeout(function () { build(v); popDough(); setTimeout(function () { stampAll(); }, reduce ? 0 : 480); }, t2 + 100);
  });
  input.addEventListener('focus', takeover);
  input.addEventListener('input', takeover);
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') { clearTimeout(autoT); auto = true; wi = 0; build(WORDS[0]); popDough(); autoT = setTimeout(cycle, 600); } });
  build(WORDS[0]); popDough(); autoT = setTimeout(cycle, 700);
})();
