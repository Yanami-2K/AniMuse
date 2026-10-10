# 靠近发光的卡片 · Proximity Glow Cards

![preview](preview.png)

> **原作：[Jhey Tompkins](https://codepen.io/jh3y/pen/QWYPaax)**（MIT）。这是移植版：原生、单文件夹、配色和尺寸做了适配，加了自动演示和中英文。版权声明见同目录 `LICENSE`。

指针靠近卡片，边框上就亮起一段彩色光弧，光弧始终朝向指针，外面还有一圈柔和的光晕。离开就慢慢熄灭。

- 分类：卡片
- 技术：CSS / JS / conic-gradient，无依赖，直接双击 `index.html` 就能看

## 怎么做的

每张卡记录“卡片中心 → 指针”的角度 --start（@property 注册成数字）。三层伪元素各用一个 conic-gradient 当 mask，只露出 --start 附近 --spread 度的一段边框；外层 .glows 再糊一层 blur 当光晕。彩色渐变用 background-attachment: fixed，所以多张卡的颜色是连起来的。

## 可调参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--spread` | `80` | 光弧张角（度） |
| `--blur` | `20` | 光晕模糊（px） |
| `--proximity` | `40` | 指针离卡片多近开始亮（px） |
| `--gradient` | `conic-gradient(…)` | 光弧的彩色渐变 |

CSS 变量在 `style.css` 顶部的 `:root` 里。

## 搬到自己项目里

功能卡片、定价卡、深色仪表盘。浅色背景下把渐变调深一点。

所有动画都尊重 `prefers-reduced-motion: reduce`。

---

**EN** — Bring the pointer near a card and a colorful arc lights up along its border, always facing the pointer, with a soft halo outside. Move away and it fades out.

> **Original by [Jhey Tompkins](https://codepen.io/jh3y/pen/QWYPaax)** (MIT). Ported to vanilla, self-contained form with palette tweaks, a self-demo and i18n. Copyright notice in `LICENSE`.

Each card stores the angle from its centre to the pointer in --start (registered with @property). Three pseudo-elements use a conic-gradient as a mask to reveal only --spread degrees of border around --start; an outer blurred .glows layer adds the halo. The rainbow uses background-attachment: fixed, so colors line up across cards.

| Param | Default | Notes |
| --- | --- | --- |
| `--spread` | `80` | arc spread (deg) |
| `--blur` | `20` | halo blur (px) |
| `--proximity` | `40` | activation distance (px) |
| `--gradient` | `conic-gradient(…)` | arc gradient |

Feature cards, pricing tiers, dark dashboards. Deepen the gradient on light backgrounds.
