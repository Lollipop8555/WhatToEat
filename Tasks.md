# 实施计划：正常人类模式接入 howToCook 菜谱

## 目标
1. **三个数据源（human / monster / oasis）都去掉早/中/晚分组，混排成单一列表**（`[...]`），不再区分餐次。
2. 「正常人类」(`human`) 模式的菜单从 `howToCook` 菜谱库取数（每个元素为 `{name, recipe}`）。
3. 在正常人类模式下，随机到一道菜品后，可点击「查看菜谱」整页跳转到菜谱页，渲染对应的 Markdown 菜谱（含图片，路径零改写）。

## 现状分析
- `foodData/human.json`：结构为 `{ breakfast: string[], lunch: string[], dinner: string[] }`，元素为菜名字符串。
- `js/app.js`：
  - `selectMealPoolBasedOnMode()` 按 `currentMode` 请求 `./foodData/${currentMode}.json`。
  - `triggerRandomFoodDisplay()` 把 `foodItem` 当作纯文本直接 `.text(foodItem)` 显示。
- `howToCook/dishes/<分类>/<菜名>.md`，部分菜谱是文件夹形式 `<分类>/<菜名>/<变体>.md`（如 `meat_dish/红烧肉/简易红烧肉.md`）。
- 菜谱图片用相对路径 `./xxx.jpg` 引用（相对该 `.md` 所在目录）；另有少量跨菜谱链接如 `./../../condiment/简易版炒糖色.md`。
- 项目当前没有 Markdown 渲染器，也没有菜谱展示 UI。

## 步骤

### 1. 三个数据源全部扁平化（去掉早/中/晚分组，混排为单一数组）
- **human.json（重新生成）**：
  - 新建 `scripts/genHumanData.js`，扫描 `howToCook/dishes` 下除 `template` 外的**所有分类**（`breakfast`、`staple`、`meat_dish`、`vegetable_dish`、`aquatic`、`soup`、`semi-finished`、`dessert`、`drink`、`condiment` 等），**全部混排**，不再区分餐次。
  - 菜名提取规则：读取每个 `.md` 的一级标题（`# ...`），去掉末尾「的做法」；若读取失败则回退到文件名（去 `.md`）。
  - 同时记录该菜谱的相对路径 `recipe`（如 `howToCook/dishes/meat_dish/宫保鸡丁.md` 或 `howToCook/dishes/meat_dish/红烧肉/简易红烧肉.md`）。
  - 输出 `foodData/human.json` 为**单一数组**（每个元素 `{ "name": "...", "recipe": "..." }`）：
    ```json
    [
      { "name": "茶叶蛋", "recipe": "howToCook/dishes/breakfast/茶叶蛋.md" },
      { "name": "宫保鸡丁", "recipe": "howToCook/dishes/meat_dish/宫保鸡丁.md" },
      { "name": "简易红烧肉", "recipe": "howToCook/dishes/meat_dish/红烧肉/简易红烧肉.md" }
    ]
    ```
- **monster.json / oasis.json（扁平化）**：把原有的 `breakfast/lunch/dinner` 三个数组合并成一个字符串数组（元素顺序可打乱混排），结构由 `{breakfast:[],lunch:[],dinner:[]}` 改为 `[...]`。可用同样的小脚本或一次性处理完成。
- 保留 `scripts/genHumanData.js` 以便后续重建。

### 2. 引入 Markdown 渲染器
- 下载 `marked.min.js` 到 `js/`（本地 vendored，避免依赖网络），并在 `index.html` 中引入。

### 3. 改造 `js/app.js`
- **去掉餐次逻辑**：数据源已扁平化为单一数组，不再有 `breakfast/lunch/dinner`。
  - `selectMealPoolBasedOnMode()` 中：`currentFoodPool = foodPools[currentMode]`（直接取整个数组，去掉 `currentOrder` 索引）。
  - 移除/停用 `currentOrder` 相关的取数、初始化（按小时选早中晚）以及标题点击切换餐次的逻辑。
- **标题改为两行（解决混排交互）**：保留时段词但改为"问候语"语义，不再作为餐次筛选。
  - `index.html` 标题结构改为两行：
    - 第一行：`<span class="greeting">中午好</span>`（时段问候，由 `currentHour` 推断：早上好 / 中午好 / 晚上好）。
    - 第二行：`吃点<span class="what">神马</span><span class="punctuation">？</span>`（随机食物替换 `.what`，占位为「神马」）。
  - `updateMealForCurrentOrder(order)` 改名为保持简单：把问候词数组 `["早上好","中午好","晚上好"]` 写入 `.greeting`，`.what` 重置为「神马」；不再有餐次含义。
  - 标题点击仍保留（循环切换问候语，纯交互趣味），提示文案由「点击可以切换饭点~」改为「点击可以切换问候~」。
- 兼容两种食物项结构：字符串（`monster`/`oasis` 原样）与对象（`{name, recipe}`，human 新结构）。
  - `const name = typeof foodItem === 'string' ? foodItem : foodItem.name;`
- 随机滚动显示、标题显示均使用 `name`。
- 当 `currentMode === 'human'` 且当前 `foodItem.recipe` 存在时，展示「查看菜谱」按钮；点击后整页跳转到菜谱页（见步骤 4），否则隐藏该按钮。

### 4. 新增独立菜谱页 `recipe.html`（整页跳转，非弹窗）
- 背景：菜谱用 `fetch()` 取回 Markdown 文本后注入页面，浏览器会把 HTML 里的相对路径（`./000.jpg`）按"当前页面文档"解析（即网站根目录），而不是按 `.md` 文件所在目录解析，导致图片 404。如何用 `<base>` 规避：在 iframe 的 `<head>` 放 `<base href="<recipe所在目录>/">`，浏览器便会自动把所有 `./xxx` 图片、`.md` 链接都相对该目录解析——**完全不用手动改写任何路径**（菜谱与图片本就在同一目录，天然正确）。整页跳转也符合"跳过去看"的直觉。
- `index.html`：在随机结果显示区附近新增「查看菜谱」按钮 `#recipeBtn`（默认隐藏），**不**做弹窗/遮罩（跳转式）。
- `recipe.html`（新增页面）：
  - 顶部显示菜名（从 query `name` 读取），并提供「← 返回」链接（回 `index.html`）。
  - 读取 query 的 `path`（recipe 站点相对路径，如 `howToCook/dishes/meat_dish/红烧肉/简易红烧肉.md`）。
  - `fetch(path)` 取 Markdown 文本 → `marked.parse()` 渲染为 HTML。
  - 计算 recipe 所在目录 `dir`（如 `howToCook/dishes/meat_dish/红烧肉/`，即去掉文件名）。
  - 组装 iframe 文档：`<!doctype html><html><head><base href="dir"><style>菜谱样式</style></head><body>渲染后的HTML</body></html>`，用 `iframe.srcdoc` 写入。
  - 优点：图片/跨菜谱链接零改写；菜谱样式隔离在 iframe 内，不影响主页面；整页跳转便于手机端阅读与浏览器返回。
- `css/style.min.css`：新增 `recipe.html` 的轻量样式（顶部标题栏、返回按钮、iframe 撑满剩余高度、图片自适应宽度在 iframe 注入样式中控制）。

### 5. 验证
- 本地启动静态服务（`python3 -m http.server`）打开页面。
- 切换到「正常人类」，随机到菜品后点「查看菜谱」，确认整页跳转到 `recipe.html`、Markdown 渲染正常、图片可见、点「返回」可回到主页。
- 确认 `monster` / `oasis` 模式行为不受影响。

## 待确认点（请确认后再动手）
1. **human 菜单范围**：human 是否包含 howToCook 的**全部**分类（含 `dessert` 甜点、`drink` 饮品、`condiment` 调料），还是只保留正餐类（去掉甜点/饮品/调料）？目前计划是全部混排。
2. **生成脚本**：是否保留 `scripts/genHumanData.js`（便于以后重建）？
3. **渲染器来源**：用本地 vendored 的 `marked.min.js`，还是直接用 CDN `<script>`？
4. **菜名展示**：用「一级标题去掉『的做法』」（如「简易红烧肉」）还是直接用文件名/文件夹名？

> 说明：三个数据源（`human`/`monster`/`oasis`）均改为扁平混排；`monster`/`oasis` 仅结构扁平化（字符串数组），不引入菜谱跳转，`human` 额外接入 howToCook 与菜谱页。标题已确定改为两行（第一行问候语、第二行"吃点神马？"）。
