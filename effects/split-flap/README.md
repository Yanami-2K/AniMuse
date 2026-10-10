# 机械翻牌 · Split-flap Board

![preview](preview.png)

机场出发牌那种翻牌：每格按字母表一片片翻到目标字符，快到时减速，最后一片“啪”地落下还弹两下。翻片经过时下半格有投影，上半片越翻越暗。

- 分类：文字
- 技术：CSS / JS / WAAPI，无依赖，直接双击 `index.html` 就能看

## 怎么做的

每格四层：上下两个静态半格 + 两片翻片。上翻片 rotateX(0→−90°) 同时 brightness 1→.5，下翻片 rotateX(90°→0)；最后一片用 0 → −16° → 0 → −4° → 0 的关键帧做回弹。中间每片 64ms，格与格错峰 40ms。

## 可调参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--flip` | `64ms` | 中间每一片翻多快 |
| `--settle` | `360ms` | 最后一片落下 + 回弹 |
| `--stagger` | `40ms` | 格与格之间的错峰 |
| `--hold` | `2600ms` | 每条消息停留多久 |

CSS 变量在 `style.css` 顶部的 `:root` 里，`data-*` 在 `index.html` 上。

## 搬到自己项目里

改 script.js 里的 MSGS 和格数 N；字符表 CHARS 决定翻的顺序，想翻得少就把常用字符放前面。

所有动画都尊重 `prefers-reduced-motion: reduce`：系统开了「减少动态效果」时直接显示最终状态。

---

**EN** — An airport-style split-flap board: each cell flips through the alphabet to its target, slows near the end, and the final flap slaps down with two small rebounds. A shadow sweeps the lower half and the falling flap darkens as it turns.

Four layers per cell: two static halves and two flaps. The top flap goes rotateX(0→−90°) while brightness drops 1→.5; the bottom flap rotateX(90°→0). The final flap rebounds via 0 → −16° → 0 → −4° → 0. 64ms per intermediate flap, 40ms stagger between cells.

| Param | Default | Notes |
| --- | --- | --- |
| `--flip` | `64ms` | speed of each intermediate flap |
| `--settle` | `360ms` | final flap + rebound |
| `--stagger` | `40ms` | delay between cells |
| `--hold` | `2600ms` | hold time per message |

Edit MSGS and the cell count N in script.js; the CHARS order defines the flip sequence, so put common characters first for shorter flips.
