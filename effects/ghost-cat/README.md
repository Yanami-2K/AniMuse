# 幽灵猫和萤火虫 · Ghost Cat & Firefly

![preview](preview.png)

一段角色小表演：幽灵猫的眼珠追着萤火虫转，萤火虫落在它头上，它斗鸡眼往上看、憋气、打了个喷嚏（那一瞬间身体变透明），萤火虫被喷飞，它不好意思地眯眼笑。指针就是萤火虫，停在它头上也会触发。

- 分类：角色
- 技术：SVG / JS，无依赖，直接双击 `index.html` 就能看

## 怎么做的

一个 rAF 状态机：wander → approach → land → inhale → achoo → shy。每个阶段只改目标值（身体缩放、位移、角度、眼皮、张嘴、透明度），全部挂在弹簧上，所以切换自带过冲和余震。眼珠偏移 = 指向萤火虫的单位向量 × 4.2，落在头上时自然变成斗鸡眼。

## 可调参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--float` | `3.2s` | 上下飘的周期 |
| `--amp` | `6` | 飘动幅度（SVG 单位） |
| `--track` | `9` | 眼珠追踪灵敏度 |
| `--body` | `#ece6ff` | 身体颜色 |
| `--firefly` | `#ffd84a` | 萤火虫颜色 |

CSS 变量在 `style.css` 顶部的 `:root` 里，`data-*` 在 `index.html` 上。

## 搬到自己项目里

适合 404、空状态、加载页。想换成自己的角色，保留“目标值 + 弹簧”这套结构，把 SVG 换掉、改各阶段的目标值就行。

所有动画都尊重 `prefers-reduced-motion: reduce`：系统开了「减少动态效果」时直接显示最终状态。

---

**EN** — A tiny piece of character acting: the ghost cat’s eyes follow a firefly, it lands on its head, the cat goes cross-eyed, inhales, sneezes (turning see-through for an instant), the firefly gets blown away and the cat squints, embarrassed. Your pointer is the firefly; hover on its head to trigger it.

One rAF state machine: wander → approach → land → inhale → achoo → shy. Each beat only sets targets (body scale, offset, tilt, eyelids, mouth, opacity), all on springs, so every change overshoots and settles. Pupil offset = unit vector to the firefly × 4.2, which turns into cross-eyes once it lands on the head.

| Param | Default | Notes |
| --- | --- | --- |
| `--float` | `3.2s` | float period |
| `--amp` | `6` | float amplitude (SVG units) |
| `--track` | `9` | pupil tracking stiffness |
| `--body` | `#ece6ff` | body color |
| `--firefly` | `#ffd84a` | firefly color |

Great for 404s, empty states and loading screens. To use your own character keep the targets-on-springs structure, swap the SVG and retune each beat.
