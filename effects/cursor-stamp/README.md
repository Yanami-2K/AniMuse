# 印章小猫 · Kitty Stamp

![preview](preview.png)

一只圆滚滚的印章小猫当你的光标，慢半拍地跟着指针飘，跑起来会往一边歪，闲着时会晃一晃、眨眨眼。点一下：先蹲下蓄力、往上一蹦，再“啪”地砸下来，整只被压扁，眼睛挤成 > <，两边冒烟、头顶蹦星星，留下一个边缘不太匀的肉垫印。盖到按钮上就算批准。

- 分类：微交互
- 技术：CSS / JS / WAAPI / SVG，无依赖，直接双击 `index.html` 就能看
- 用法：指针移进画面它就跟过来，点一下盖章；盖到「批准」按钮上就算批准。键盘 Tab 到按钮按回车，它会自己跑过去盖。不动 4.5 秒后回到自动演示。

## 怎么做的

位置用 rAF 里的弹簧（加速度 = 刚度 × 距离 − 阻尼 × 速度），水平速度直接换算成倾斜角度，闲着时再叠一点正弦晃动。四层嵌套各管一件事：.stamp 管位置、.tilt 管倾斜、.hop 管蹦和压扁（WAAPI，transform-origin 在橡胶垫底边）、.bob 管呼吸。落地那一帧给根元素加 .press 类切换表情（> < 和 o 嘴），同时生成印、烟团和星星，动画放完就删。印是 SVG：低频 feTurbulence + feDisplacementMap 把轮廓推歪一点，高频噪声抠掉几粒小点，再用 multiply 混合。纯色加同一粗细的描边，没有渐变、没有发光。

## 可调参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `--stiff` | `170` | 跟随弹簧的刚度，越大跟得越紧 |
| `--damp` | `15` | 跟随弹簧的阻尼，越小越晃 |
| `--hop` | `1.5rem` | 砸下去之前往上蹦多高 |
| `--squash` | `.66` | 落地时整只被压到原高度的多少 |
| `--ink` | `#ff5c7a` | 印泥颜色 |

CSS 变量在 `style.css` 顶部的 `:root` 里。

## 搬到自己项目里

换印的图案和字改 script.js 里的 markSVG 和 WORDS；换配色改 :root 里的 --handle / --body / --pad。想让它只在某个区域里当光标，把 pointermove 监听挂到那个容器上。

所有动画都尊重 `prefers-reduced-motion: reduce`：开了「减少动态效果」时，印章直接待在指针位置，不蹦不压，点一下印会淡入。

---

**EN** — A chubby kitty stamp is your cursor. It floats after the pointer half a beat late, leans into its run, wobbles and blinks when idle. Click and it crouches, hops, then slams down: the whole body squashes, its eyes squeeze into > <, puffs pop out the sides, stars bounce overhead, and it leaves a paw-print mark with a slightly uneven ink edge. Stamp the button to approve.

Position comes from a spring integrated in rAF (acceleration = stiffness × distance − damping × velocity); horizontal velocity maps straight to a lean angle, with a little sine wobble when idle. Four nested layers each own one job: .stamp position, .tilt lean, .hop the hop and squash (WAAPI, transform-origin at the bottom of the rubber pad), .bob the breathing. On the impact frame a .press class swaps the face (> < eyes, o mouth) while the mark, puffs and stars are spawned and removed when they finish. The mark is SVG: low-frequency feTurbulence + feDisplacementMap nudges the outline, high-frequency noise knocks out a few specks, multiplied onto the paper. Flat colors with one consistent outline; no gradients, no glow.

| Param | Default | Notes |
| --- | --- | --- |
| `--stiff` | `170` | follow spring stiffness (higher = tighter) |
| `--damp` | `15` | follow spring damping (lower = wobblier) |
| `--hop` | `1.5rem` | how high it hops before the slam |
| `--squash` | `.66` | body height on impact (fraction of normal) |
| `--ink` | `#ff5c7a` | ink color |

Change the mark art and words in markSVG and WORDS in script.js; recolor via --handle / --body / --pad in :root. To use it as a cursor only inside one area, attach the pointermove listener to that container. With `prefers-reduced-motion: reduce` the stamp sits at the pointer with no hop or squash, and marks simply fade in.
