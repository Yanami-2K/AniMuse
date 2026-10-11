# 怪盗猫的预告函 · Phantom Thief Cat

![preview](preview.png)

戴礼帽和眼罩的怪盗猫从墙后冒出来，左看右看，抬帽致意，甩出一张旋转的预告函钉在墙上，然后缩回墙头只露出眼睛偷看。一段循环的小剧情，舞台永远不空。

- 分类：角色
- 技术：SVG / CSS / JS / WAAPI，无依赖，直接双击 `index.html` 就能看

## 怎么做的

一条 async 时间线串起 6 个动作；冒头带 4% 过冲；只移动瞳孔做「看」；卡片从爪子位置 translate + rotate(2 圈 + 6deg) + scale 飞出，落定瞬间出现图钉并压缩一下。

## 可调参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--rise` | `520ms` | 冒出来的时长 |
| `--throw` | `640ms` | 卡片飞行时长 |
| `--spin` | `2` | 卡片飞行中转几圈 |
| `--accent` | `#ff6f91` | 领结 / 预告函颜色 |

CSS 变量在 `style.css` 顶部的 `:root` 里，`data-*` 在 `index.html` 上。

## 搬到自己项目里

预告函的文案改 .card 里的内容，适合做发布预告、彩蛋。

所有动画都尊重 `prefers-reduced-motion: reduce`：系统开了「减少动态效果」时直接显示最终状态。

---

**EN** — A top-hatted, masked thief cat pops up from behind a wall, glances left and right, tips its hat, flicks a spinning calling card that pins to the wall, then sinks back to peek over the ledge. A looping micro-story that never leaves the stage empty.

Six beats on one async timeline: a 4% overshoot on the pop-up; only the pupils move to “look”; the card flies from the paw with translate + rotate(2 turns + 6deg) + scale, and a pin appears with a small squash on landing.

| Param | Default | Notes |
| --- | --- | --- |
| `--rise` | `520ms` | pop-up duration |
| `--throw` | `640ms` | card flight duration |
| `--spin` | `2` | turns in flight |
| `--accent` | `#ff6f91` | bow / card color |

Edit the text in .card; nice for launch teasers or easter eggs.
