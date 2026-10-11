<p align="center"><img src="site/favicon.svg" width="56" alt="AniMuse"></p>

<h1 align="center">AniMuse · 动效灵感</h1>

<p align="center">看到喜欢的动效却说不清？挑一个，复制 Prompt，丢给你的 AI。</p>

<p align="center"><a href="https://cocofhu.github.io/AniMuse/">在线预览</a> · <a href="#english">English</a></p>

---

AniMuse 是一个开源的网页动效库。每个效果都是一份能直接双击打开的源码，旁边配一段写好的 Prompt。复制下来贴给 Cursor、Claude Code、Codex 这类 AI，它就能照着源码在你的项目里还原出来，时长、曲线、错峰都一模一样。

为什么不直接写一段文字描述？因为动效差一点就不是那个味道了。「缓缓弹出」这四个字，AI 能给你写出一百种。所以这里的 Prompt 会把关键参数写清楚，再附上固定到某个提交的源码链接，让 AI 去读真东西，而不是猜。

## 怎么用

1. 在网站上点开一个效果，看看动起来的样子和参数。
2. 选 Prompt 的版本：
   - **引用源码**：Prompt 很短，里面是 `raw.githubusercontent.com` 的源码链接，固定在网站部署时的那个 commit 上，以后仓库改了也不会失效。适合能联网的 AI。
   - **内嵌源码**：把完整源码直接贴进 Prompt。长一点，但 AI 不联网也能用。
3. 点「复制 Prompt」，贴给你的 AI。它会用你项目现有的技术栈（React / Vue / 原生都行）重写，并且照抄时长和曲线。

不想用 AI 的话，直接把 `effects/<名字>/` 拷走也行，每个效果都是纯 HTML / CSS / JS，没有任何依赖。

## 现有效果

| # | 名字 | English | 分类 | 技术 | 署名 |
| --- | --- | --- | --- | --- | --- |
| 01 | [果冻卡片堆](effects/jelly-stack/) | Jelly Card Stack | 卡片 | CSS / JS |  |
| 02 | [液态磁吸按钮](effects/liquid-button/) | Liquid Magnetic Button | 按钮 | SVG filter / CSS / JS |  |
| 03 | [机械翻牌](effects/split-flap/) | Split-flap Board | 文字 | CSS / JS / WAAPI |  |
| 04 | [挂绳工牌](effects/lanyard-badge/) | Lanyard Badge | 物理 | Canvas / CSS / JS |  |
| 05 | [幽灵猫和萤火虫](effects/ghost-cat/) | Ghost Cat & Firefly | 角色 | SVG / JS |  |
| 06 | [折信寄出](effects/letter-fold/) | Fold & Send Letter | 转场 | CSS 3D / JS / WAAPI |  |
| 07 | [会变形的下载按钮](effects/morph-download/) | Morphing Download Button | 微交互 | SVG / JS |  |
| 08 | [橡皮膜下拉刷新](effects/elastic-refresh/) | Elastic Pull-to-Refresh | 加载 | SVG / JS |  |
| 09 | [印章小猫](effects/cursor-stamp/) | Kitty Stamp | 微交互 | CSS / JS / WAAPI / SVG |  |
| 10 | [老电视关机](effects/crt-off/) | CRT Power Off | 转场 | CSS / JS / WAAPI / Canvas |  |
| 11 | [怪盗猫的预告函](effects/phantom-cat/) | Phantom Thief Cat | 角色 | SVG / CSS / JS / WAAPI |  |
| 12 | [爱睡觉的开关](effects/sleepy-toggle/) | Sleepy Toggle | 微交互 | CSS / JS / WAAPI | 灵感 [yui540](https://x.com/yui540) |
| 13 | [啵啵转场](effects/pop-transition/) | Pop Shape Transition | 转场 | CSS / JS / WAAPI | 灵感 [yui540](https://x.com/yui540) |
| 14 | [跳格子加载](effects/hop-loader/) | Hop Loader | 加载 | CSS / JS / WAAPI | 灵感 [yui540](https://x.com/yui540) |
| 15 | [揭贴纸](effects/sticker-peel/) | Sticker Peel | 物理 | CSS / JS / SVG | 灵感 [yui540](https://x.com/yui540) |
| 16 | [像素猫输入框](effects/pixel-cat-input/) | Pixel Cat Input | 角色 | Canvas / CSS / JS | 想法 [Rauno Freiberg](https://x.com/raunofreiberg/status/2060034871263703452) |
| 17 | [导航里回答 Agent](effects/agent-preview/) | Agent Preview Card | 卡片 | CSS / JS / WAAPI | 想法 [Mariana Castilho (Profound)](https://x.com/mrncst/status/2107936011560837129) |
| 18 | [阅读环境](effects/reading-env/) | Reading Environment | 微交互 | Canvas / Web Audio / JS | 想法 [Paco Coursey](https://x.com/pacocoursey/status/1460760109009752066) |
| 19 | [会变形的套餐切换](effects/tier-toggle/) | Dynamic Tier Toggle | 微交互 | CSS / :has() | 原作 [Jhey Tompkins](https://codepen.io/jh3y/pen/vEEZxOM) |
| 20 | [抓娃娃机](effects/claw-catch/) | Claw Catch | 按钮 | SVG / JS / WAAPI | 灵感 [yui540](https://yui540.com/motions/37) |
| 21 | [拉链揭开](effects/zip-reveal/) | Zip Reveal | 物理 | SVG / JS | 灵感 [yui540](https://yui540.com/motions/60) |
| 22 | [压字机](effects/press-type/) | Press Type | 文字 | CSS / JS / WAAPI | 灵感 [yui540](https://yui540.com/motions/51) |
| 23 | [弹窗进出场六式](effects/dialog-entrances/) | Dialog Entrances | 转场 | CSS / JS / WAAPI | 灵感 [yui540](https://yui540.com/motions/30) |

## 目录结构

```
effects/<slug>/
  index.html    双击就能打开的 Demo
  style.css     所有可调参数都在 :root 的 CSS 变量里
  script.js     可选
  meta.json     名字、分类、参数、说明（网站和 Prompt 都从这里生成）
  README.md     这个效果是什么、怎么调、怎么搬到自己项目里
  preview.png   海报图（中文），preview.en.png 英文版（npm run previews 生成）
  LICENSE       （移植别人的作品时）原作的许可证和版权声明
site/           网站源码（index.html / style.css / app.js）
scripts/
  build.mjs     零依赖构建：读 meta.json + 源码 → dist/
  previews.mjs  用 Playwright 截海报
  check-i18n.mjs  语言一致性检查：英文模式下页面上不能出现中文
```

本地预览：

```bash
node scripts/build.mjs      # 生成 dist/
npx serve dist              # 或者 python3 -m http.server -d dist
```

## 投稿一个新效果

1. 在 `effects/` 下建一个目录，名字用小写加连字符，比如 `effects/magnetic-button/`。
2. 放 `index.html`、`style.css`（需要的话加 `script.js`）。要求：
   - 不依赖任何外部库，双击 `index.html` 就能跑；
   - 参数做成 `:root` 里的 CSS 变量，并写好注释；
   - 尽量只动 `transform` 和 `opacity`；
   - 支持 `prefers-reduced-motion: reduce`；
   - 如果在网站卡片里需要循环播放，监听 `message` 事件，收到 `'animuse:replay'` 时从头播一遍（网站悬停卡片时会发这条消息）；
   - Demo 里有文字的话做中英两份：网站会传 `?lang=zh|en`，英文模式下不能出现中文（`npm run check:i18n` 会检查）。
3. 写 `meta.json`，字段照着现有效果抄就行：`slug`、`order`、`category`（见 `site/categories.json`）、`name`、`summary`、`technique`、`params`、`adapt`、`files`、`posterAt`。`summary` 和 `technique` 会直接进 Prompt，写得具体一点。
4. 跑 `npm run previews -- <slug>` 生成海报，再跑 `node scripts/build.mjs` 确认没有报错。
5. 提 PR。

请只提交你自己做的、或者许可证允许的作品。移植别人的作品时，在 `meta.json` 里写 `credit`（`kind`: `original` / `idea` / `inspired`，`author`，`url`，`license`），网站详情页会显示署名；`original` 类还要把原作的 LICENSE 放进效果目录。

## 致谢

- **[Jhey Tompkins](https://codepen.io/jh3y)**（[@jh3yy](https://x.com/jh3yy)）：[Dynamic Tier Toggle](https://codepen.io/jh3y/pen/vEEZxOM) 移植自他的 CodePen（公开 Pen 默认 MIT 许可）。移植版改成了原生、单目录，调了配色、尺寸和选中态层级，加了自动演示和中英文；原版权声明保留在效果目录的 `LICENSE` 里。
- **[yui540](https://x.com/yui540)**：爱睡觉的开关、啵啵转场、跳格子加载、揭贴纸这四个效果的灵感来自 yui540 可爱、弹跳、角色感很强的 CSS 动效风格；抓娃娃机、拉链揭开、压字机、弹窗进出场六式分别受 [yui540.com/motions](https://yui540.com/motions) 里的 [37](https://yui540.com/motions/37)、[60](https://yui540.com/motions/60)、[51](https://yui540.com/motions/51)、[30](https://yui540.com/motions/30) 启发。代码和美术都是原创（角色统一换成 AniMuse 的幽灵猫；跳格子加载、拉链揭开、压字机、弹窗进出场六式改成了黑白线稿），没有使用任何 yui540 的素材或代码。
- **[Rauno Freiberg](https://x.com/raunofreiberg/status/2060034871263703452)**：像素猫输入框的交互想法来自他的 “lil pix”。像素猫与代码为原创。
- **[Paco Coursey](https://x.com/pacocoursey/status/1460760109009752066)**：阅读环境的想法来自他的 “Reading environment”。代码、声音合成与文案为原创。
- **[Mariana Castilho (Profound)](https://x.com/mrncst/status/2107936011560837129)**：导航里回答 Agent 的交互想法来自她的设计。代码与文案为原创。

## 部署

推到 `main` 之后，`.github/workflows/pages.yml` 会自动构建并发布到 GitHub Pages。第一次需要仓库管理员在 **Settings → Pages → Build and deployment → Source** 里选 **GitHub Actions**。

## License

[MIT](LICENSE)

---

<a id="english"></a>

## English

**AniMuse** is an open-source gallery of web motion effects. Each effect is a tiny, dependency-free HTML/CSS/JS demo paired with a ready-to-paste prompt for AI coding agents (Cursor, Claude Code, Codex…).

Words are a lossy way to describe motion: "gently pops in" can mean a hundred things. So every prompt spells out the exact durations, easing curves and staggers, and links the real source pinned to a specific commit, so the agent reads the implementation instead of guessing.

- **Link source** prompt: short, with `raw.githubusercontent.com` links pinned to the deployed commit. For agents with web access.
- **Inline source** prompt: the full source pasted in. For agents without web access.

Either way the agent is asked to rebuild the effect in your project's existing stack, keep the timing identical, animate transform/opacity only, and respect `prefers-reduced-motion`.

**Contributing:** add `effects/<slug>/` with `index.html`, `style.css`, optional `script.js`, a `meta.json` (copy an existing one) and a `README.md`; run `npm run previews -- <slug>` and `node scripts/build.mjs`; open a PR. No external libraries, params as CSS variables, reduced-motion support, and listen for the `'animuse:replay'` message if your demo needs to restart on hover.

**Credits:** Dynamic Tier Toggle is a port of [Jhey Tompkins](https://codepen.io/jh3y)’ [CodePen](https://codepen.io/jh3y/pen/vEEZxOM) (public Pens are MIT; the notice is kept in the folder’s `LICENSE`). Sleepy Toggle, Pop Shape Transition, Hop Loader and Sticker Peel are inspired by [yui540](https://x.com/yui540)’s playful CSS animation style; Claw Catch, Zip Reveal, Press Type and Dialog Entrances are inspired by [yui540.com/motions](https://yui540.com/motions) ([37](https://yui540.com/motions/37), [60](https://yui540.com/motions/60), [51](https://yui540.com/motions/51), [30](https://yui540.com/motions/30)) — original code and art (AniMuse’s own ghost cat where there is a character; Hop Loader, Zip Reveal, Press Type and Dialog Entrances are black-and-white line art), no assets or code copied. Interaction ideas: Pixel Cat Input — [Rauno Freiberg](https://x.com/raunofreiberg/status/2060034871263703452) (“lil pix”); Reading Environment — [Paco Coursey](https://x.com/pacocoursey/status/1460760109009752066); Agent Preview Card — [Mariana Castilho (Profound)](https://x.com/mrncst/status/2107936011560837129).

**i18n:** demos receive `?lang=zh|en`; `npm run check:i18n` fails if any Chinese shows up in English mode.

**Deploy:** pushes to `main` build and publish via GitHub Actions. Enable it once in **Settings → Pages → Source: GitHub Actions**.

License: MIT.
