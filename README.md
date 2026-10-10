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

| # | 名字 | English | 分类 | 技术 |
| --- | --- | --- | --- | --- |
| 01 | [果冻卡片堆](effects/jelly-stack/) | Jelly Card Stack | 卡片 | CSS / JS |
| 02 | [液态磁吸按钮](effects/liquid-button/) | Liquid Magnetic Button | 按钮 | SVG filter / CSS / JS |
| 03 | [机械翻牌](effects/split-flap/) | Split-flap Board | 文字 | CSS / JS / WAAPI |
| 04 | [挂绳工牌](effects/lanyard-badge/) | Lanyard Badge | 物理 | Canvas / CSS / JS |
| 05 | [幽灵猫和萤火虫](effects/ghost-cat/) | Ghost Cat & Firefly | 角色 | SVG / JS |
| 06 | [折信寄出](effects/letter-fold/) | Fold & Send Letter | 转场 | CSS 3D / JS / WAAPI |
| 07 | [会变形的下载按钮](effects/morph-download/) | Morphing Download Button | 微交互 | SVG / JS |
| 08 | [橡皮膜下拉刷新](effects/elastic-refresh/) | Elastic Pull-to-Refresh | 加载 | SVG / JS |
| 09 | [橡皮章盖“已通过”](effects/cursor-stamp/) | Rubber Stamp Approve | 微交互 | CSS / JS / WAAPI / SVG filter |
| 10 | [老电视关机](effects/crt-off/) | CRT Power Off | 转场 | CSS / JS / WAAPI / Canvas |
| 11 | [怪盗猫的预告函](effects/phantom-cat/) | Phantom Thief Cat | 角色 | SVG / CSS / JS / WAAPI |

## 目录结构

```
effects/<slug>/
  index.html    双击就能打开的 Demo
  style.css     所有可调参数都在 :root 的 CSS 变量里
  script.js     可选
  meta.json     名字、分类、参数、说明（网站和 Prompt 都从这里生成）
  README.md     这个效果是什么、怎么调、怎么搬到自己项目里
  preview.png   海报图（npm run previews 生成）
site/           网站源码（index.html / style.css / app.js）
scripts/
  build.mjs     零依赖构建：读 meta.json + 源码 → dist/
  previews.mjs  用 Playwright 截海报
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
   - 如果在网站卡片里需要循环播放，监听 `message` 事件，收到 `'animuse:replay'` 时从头播一遍（网站悬停卡片时会发这条消息）。
3. 写 `meta.json`，字段照着现有效果抄就行：`slug`、`order`、`category`（见 `site/categories.json`）、`name`、`summary`、`technique`、`params`、`adapt`、`files`、`posterAt`。`summary` 和 `technique` 会直接进 Prompt，写得具体一点。
4. 跑 `npm run previews -- <slug>` 生成海报，再跑 `node scripts/build.mjs` 确认没有报错。
5. 提 PR。

请只提交你自己做的、或者许可证允许的作品。

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

**Deploy:** pushes to `main` build and publish via GitHub Actions. Enable it once in **Settings → Pages → Source: GitHub Actions**.

License: MIT.
