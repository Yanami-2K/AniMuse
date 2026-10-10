/* i18n：画廊会传 ?lang=en|zh；单独打开时跟浏览器语言。英文模式把带 data-en 的元素换成英文 */
var LANG = new URLSearchParams(location.search).get('lang') || (/^zh/i.test(navigator.language || '') ? 'zh' : 'en');
if (LANG === 'en') { document.documentElement.lang = 'en'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.dataset.en; }); [].forEach.call(document.querySelectorAll('[data-en-label]'), function (el) { el.setAttribute('aria-label', el.dataset.enLabel); }); }
// Sleepy Toggle — 全部用 WAAPI：位移走弹簧（把阻尼振动采样成 CSS linear() 缓动），身体的挤压拉伸手写关键帧
(function () {
  var css = getComputedStyle(document.documentElement);
  var num = function (v) { return parseFloat(css.getPropertyValue(v)); };
  var WAKE = num('--wake'), DOZE = num('--doze'), BOUNCE = num('--bounce');
  var $ = function (id) { return document.getElementById(id); };
  var tg = $('toggle'), knob = $('knob'), body = $('body'), day = $('day'), pop = $('pop'), zzz = $('zzz'), lab = $('lab');
  var closed = $('closed'), open = $('open'), happy = $('happy'), mouth = $('mouth');
  var blush = document.querySelectorAll('.blush'), clouds = document.querySelectorAll('.cloud');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var on = false, run = 0, idle = [], userAt = -1e9, demoT = 0;

  // 阻尼弹簧 0→1 采样成 linear()：bounce 越大越弹
  function spring(b) {
    var z = 1 - b * .82, w = 2 * Math.PI * 1.25, wd = w * Math.sqrt(1 - z * z), pts = [];
    for (var i = 0; i <= 60; i++) { var t = i / 60 * 1.6, x = 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t)); pts.push(+x.toFixed(4)); }
    pts[pts.length - 1] = 1; return 'linear(' + pts.join(',') + ')';
  }
  var SPRING = spring(BOUNCE);
  var DX = function () { return tg.clientWidth - knob.offsetWidth - 2 * knob.offsetLeft; };
  var cur = function (el, p) { return getComputedStyle(el)[p]; };
  function A(el, k, o) { return el.animate(k, Object.assign({ fill: 'forwards' }, o)); }
  function face(state) { // closed | open | happy
    [closed, open, happy].forEach(function (g) { var v = g.id === state; A(g, [{ opacity: cur(g, 'opacity'), transform: cur(g, 'transform') }, { opacity: v ? 1 : 0, transform: v ? 'scale(1)' : 'scale(1,.2)' }], { duration: 120, easing: 'ease-out' }); });
  }
  function mouthTo(rx, ry, d) { A(mouth, [{ rx: cur(mouth, 'rx'), ry: cur(mouth, 'ry') }, { rx: rx + 'px', ry: ry + 'px' }], { duration: d || 160, easing: SPRING }); }
  function stopIdle() { idle.forEach(function (a) { a.cancel(); }); idle = []; }
  var wait = function (t, id) { return new Promise(function (r) { setTimeout(function () { if (id === run) r(); }, t); }); };
  function swapLabel(t) { lab.textContent = t; A(lab, [{ transform: 'translateY(.5rem) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: SPRING }); }

  async function wake(id) {
    var dx = DX(); tg.classList.add('awake'); zzz.classList.add('off'); tg.setAttribute('aria-checked', 'true');
    // 1. 被叫醒：眼睛“啪”地睁大，头上冒“!”，身体往后一缩蓄力
    face('open'); mouthTo(4.2, 4.6, 140);
    A(open, [{ transform: 'scale(.3)' }, { transform: 'scale(1.25)', offset: .6 }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
    A(pop, [{ transform: 'scale(0) rotate(-30deg)' }, { transform: 'scale(1.25) rotate(8deg)', offset: .6 }, { transform: 'scale(1) rotate(0)' }], { duration: 280, easing: 'ease-out' });
    var ant = WAKE * .3;
    A(body, [{ transform: cur(body, 'transform') }, { transform: 'translateX(-.35rem) scale(1.14,.86)' }], { duration: ant, easing: 'cubic-bezier(.3,0,.4,1)' });
    await wait(ant, id);
    // 2. 弹过去：横向拉长、跳一个小弧线；天从它身后亮起来
    A(knob, [{ transform: cur(knob, 'transform') }, { transform: 'translateX(' + dx + 'px)' }], { duration: WAKE * 1.6, easing: SPRING });
    A(body, [{ transform: 'translateX(-.35rem) scale(1.14,.86)' }, { transform: 'translate(0,-.9rem) scale(1.24,.84)', offset: .22 }, { transform: 'translate(0,-.5rem) scale(.96,1.06)', offset: .45 },
      { transform: 'translate(0,0) scale(1.16,.86)', offset: .6 }, { transform: 'scale(.95,1.05)', offset: .78 }, { transform: 'none' }], { duration: WAKE * 1.5, easing: 'linear' });
    A(day, [{ clipPath: 'circle(2.75rem at ' + (knob.offsetLeft + 2.75 * rem()) + 'px 50%)' }, { clipPath: 'circle(13.5rem at ' + (knob.offsetLeft + dx) + 'px 50%)' }], { duration: WAKE * 1.7, easing: 'cubic-bezier(.3,.1,.2,1)' });
    A(pop, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1) translateY(-.4rem)', opacity: 0 }], { duration: 300, delay: WAKE * .5, easing: 'ease-in' });
    clouds.forEach(function (c, i) { A(c, [{ transform: 'translateX(-3rem) scale(.4)', opacity: 0 }, { transform: c.classList.contains('c2') ? 'scale(.8)' : 'none', opacity: 1 }], { duration: 700, delay: WAKE * .55 + i * 90, easing: SPRING }); });
    await wait(WAKE * .9, id);
    // 3. 落地：变成太阳色，眯眼笑 + 脸红，再恢复正常睁眼
    A(body, [{ background: cur(body, 'background-color') }, { background: getVar('--sun') }], { duration: 260, easing: 'ease-out' });
    face('happy'); mouthTo(5, 4, 200);
    blush.forEach(function (b) { A(b, [{ opacity: .35 }, { opacity: .95 }], { duration: 240 }); });
    swapLabel(LANG === 'en' ? 'Morning!' : '早安！');
    await wait(620, id);
    face('open'); mouthTo(3.6, 3, 200);
    blush.forEach(function (b) { A(b, [{ opacity: .95 }, { opacity: .6 }], { duration: 400 }); });
    await wait(500, id); idleOn();
  }

  async function doze(id) {
    var dx = DX(); tg.classList.remove('awake'); tg.setAttribute('aria-checked', 'false');
    // 1. 打个大哈欠：嘴张圆、眼睛眯起来、身体往上伸
    face('closed'); A(closed, [{ transform: 'scale(1,1)' }, { transform: 'scale(1.1,1.3)' }], { duration: 300, fill: 'none' });
    mouthTo(5.6, 8.2, 300);
    A(body, [{ transform: cur(body, 'transform') }, { transform: 'scale(.92,1.1)', offset: .5 }, { transform: 'scale(.92,1.1)', offset: .7 }, { transform: 'scale(1.03,.97)' }], { duration: 640, easing: 'ease-in-out' });
    await wait(520, id);
    mouthTo(3, 2.6, 300);
    // 2. 慢吞吞挪回去，路上晃两下；天跟着暗下来
    A(knob, [{ transform: cur(knob, 'transform') }, { transform: 'translateX(0)' }], { duration: DOZE, easing: 'cubic-bezier(.5,0,.2,1)' });
    A(body, [{ transform: 'scale(1.03,.97)' }, { transform: 'rotate(-7deg)', offset: .3 }, { transform: 'rotate(5deg)', offset: .6 }, { transform: 'rotate(-2deg)', offset: .82 }, { transform: 'none' }], { duration: DOZE * 1.1, easing: 'ease-in-out' });
    A(day, [{ clipPath: 'circle(13.5rem at ' + (knob.offsetLeft + dx) + 'px 50%)' }, { clipPath: 'circle(1.6rem at ' + (knob.offsetLeft + 2.75 * rem()) + 'px 50%)' }], { duration: DOZE, easing: 'cubic-bezier(.5,0,.2,1)' });
    A(body, [{ background: cur(body, 'background-color') }, { background: getVar('--moon') }], { duration: DOZE, easing: 'ease-in-out', composite: 'replace' });
    blush.forEach(function (b) { A(b, [{ opacity: cur(b, 'opacity') }, { opacity: .35 }], { duration: DOZE }); });
    clouds.forEach(function (c) { A(c, [{ opacity: 1 }, { opacity: 0, transform: 'translateX(-1.5rem) scale(.7)' }], { duration: DOZE * .6, easing: 'ease-in' }); });
    swapLabel(LANG === 'en' ? 'Night night' : '晚安');
    await wait(DOZE * 1.1, id);
    zzz.classList.remove('off'); idleOff();
  }
  function getVar(v) { return css.getPropertyValue(v).trim(); }
  function rem() { return parseFloat(getComputedStyle(document.documentElement).fontSize); }
  // 待机：睡着时慢慢呼吸；醒着时偶尔眨眼、轻轻晃
  function idleOff() { stopIdle(); idle.push(body.animate([{ transform: 'none' }, { transform: 'scale(1.035,.965)' }, { transform: 'none' }], { duration: 2600, iterations: Infinity, easing: 'ease-in-out' })); }
  function idleOn() {
    stopIdle();
    idle.push(open.animate([{ transform: 'scale(1)' }, { transform: 'scale(1)', offset: .9 }, { transform: 'scale(1,.1)', offset: .94 }, { transform: 'scale(1)', offset: .98 }], { duration: 2400, iterations: Infinity }));
    idle.push(body.animate([{ transform: 'none' }, { transform: 'translateY(-.18rem) rotate(2deg)' }, { transform: 'none' }, { transform: 'translateY(-.18rem) rotate(-2deg)' }, { transform: 'none' }], { duration: 2400, iterations: Infinity, easing: 'ease-in-out', composite: 'add' }));
  }

  function set(v, fromUser) {
    if (fromUser) userAt = performance.now();
    if (v === on) return; on = v; var id = ++run; stopIdle();
    if (reduce) { snap(); return; }
    (on ? wake : doze)(id);
  }
  // 减少动态：直接切到终态，不做任何过程
  function snap() {
    var dx = DX();
    knob.style.transform = on ? 'translateX(' + dx + 'px)' : ''; body.style.background = on ? getVar('--sun') : '';
    day.style.clipPath = on ? 'circle(13.5rem at 50% 50%)' : ''; closed.style.opacity = on ? 0 : 1; open.style.opacity = on ? 1 : 0;
    clouds.forEach(function (c) { c.style.opacity = on ? 1 : 0; }); lab.textContent = on ? (LANG === 'en' ? 'Morning!' : '早安！') : (LANG === 'en' ? 'Night night' : '晚安');
    tg.classList.toggle('awake', on); zzz.classList.toggle('off', on); tg.setAttribute('aria-checked', String(on));
  }
  tg.addEventListener('click', function () { set(!on, true); });

  // 没人碰时自己演示：醒 → 停一会 → 睡 → 停一会……（卡片预览里也是这个）
  function demo() {
    if (reduce) return;
    if (performance.now() - userAt > 6000) set(!on, false);
    demoT = setTimeout(demo, on ? 2700 : 3000);
  }
  function reset() {
    clearTimeout(demoT); run++; stopIdle(); on = false; userAt = -1e9;
    document.getAnimations().forEach(function (a) { if (a.effect && a.effect.target && !a.effect.target.closest('.zzz') && !a.effect.target.classList.contains('star')) a.cancel(); });
    tg.classList.remove('awake'); zzz.classList.remove('off'); lab.textContent = LANG === 'en' ? 'Night night' : '晚安'; tg.setAttribute('aria-checked', 'false');
    clouds.forEach(function (c) { c.style.opacity = reduce ? '' : 0; });
    if (reduce) { on = true; snap(); return; }
    idleOff(); demoT = setTimeout(demo, 900);
  }
  addEventListener('message', function (e) { if (e.data === 'animuse:replay') reset(); });
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(reset, 200); });
  reset();
})();
