# WhatToEat 今天吃什么

> 解决「今天吃什么」的世纪难题——点一下，让命运替你决定。

## 功能特性

- **三种模式**：人类 / 非人类 / Oasis，随时随机抽签。
  - **人类**：接入 [HowToCook](https://github.com/Anduin2018/HowToCook) 菜谱库，随机到一道菜后可查看完整做法。
  - **非人类**：整活趣味菜单。
  - **Oasis**：外卖 / 快餐 / 便利店选项。
- **按时间问候**：首行问候语会根据当前时间显示「早上好 / 中午好 / 晚上好」。
- **菜谱详情页**：随机到家常菜后，可整页跳转到 `recipe.html`，以 Markdown 渲染详细做法（食材、步骤、图片）。
- **全部菜谱列表**：内置搜索，随时翻找所有可点的菜。

## 本地运行

本项目是纯静态站点，直接用任意静态服务器打开即可（需经 HTTP 访问，`file://` 会因 `fetch` 被拦截）：

```bash
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

## 目录结构

```
WhatToEat/
├── index.html              # 主页（抽签）
├── recipe.html             # 菜谱详情页（Markdown 渲染）
├── embed.html              # 可嵌入的 iframe 小组件
├── css/                    # 样式
├── js/                     # 脚本（app.js / embed.js 等）
├── images/                 # 图片资源
├── foodData/               # 各模式菜单索引（human / monster / oasis）
├── howToCook/              # 菜谱库（.md + 图片，运行时按需 fetch）
└── scripts/                # 辅助脚本（重建索引等）
```

- `foodData/human.json`：人类模式菜单，由 `howToCook` 生成，元素为 `{ "name": "菜名", "recipe": "菜谱相对路径" }`。
- `foodData/monster.json` / `foodData/oasis.json`：趣味菜单，扁平字符串数组。
- `howToCook/`：菜谱库，**运行时按需 `fetch`，源文件不做任何修改**。
- `recipe.html`：菜谱展示页，用 `marked` 渲染 Markdown，并自动按菜谱所在目录解析图片与链接。
- `scripts/genHumanData.js`：扫描 `howToCook/` 重新生成 `foodData/human.json` 的脚本。

## 更新菜谱索引

`human.json` 是菜谱的索引快照。如果在 `howToCook/` 中新增 / 删除菜谱，需重新生成索引，否则新菜不会进入随机池：

```bash
node scripts/genHumanData.js   # 重新生成 foodData/human.json
```

## 来源与致谢

- https://cuijiahua.com/eat/ —— 灵感来源
- https://github.com/MskTmi/WhatToEat —— 代码框架，MIT License
- https://github.com/Anduin2017/HowToCook —— 菜谱数据，The Unlicense（公有领域）

## 许可证

基于 [MIT License](./LICENSE) 发布。代码框架版权归 MskTmi（MIT）所有；菜谱数据来自 Anduin2017/HowToCook（The Unlicense，已进入公有领域）；本仓库的整合与修改版权归 Lollipop8555 所有。
