# WhatToEat 今天吃什么
> 解决「今天吃什么」的世纪难题。

## 功能
- **三种模式**：正常人类 / 非正常人类 / oasis，菜单已混排在一起，**不再区分早 / 中 / 晚**（首行问候语仍会按时间显示「早上好 / 中午好 / 晚上好」）。
- **正常人类模式接入菜谱库**：菜单来自 [HowToCook](https://github.com/Anduin2018/HowToCook) 菜谱库（`howToCook/` 目录）。随机到一道菜后，可点击「查看菜谱」**整页跳转**到 `recipe.html`，以 Markdown 渲染出详细做法（含食材、步骤、图片）。
- **其余两种模式**：保持原本的趣味菜单，仅做扁平化混排，不接入菜谱。

## 目录结构与数据源
- `foodData/human.json`：正常人类菜单，由 `howToCook` 生成，元素为 `{ "name": "菜名", "recipe": "菜谱相对路径" }`。
- `foodData/monster.json` / `foodData/oasis.json`：趣味菜单，扁平字符串数组。
- `howToCook/`：菜谱库（`.md` + 图片），**运行时按需 `fetch`，源文件不做任何修改**。
- `recipe.html`：菜谱展示页（用 `marked` 渲染 Markdown，并通过 `<iframe>` + `<base>` 让图片/链接自动按菜谱所在目录解析，无需改写路径）。
- `scripts/genHumanData.js`：扫描 `howToCook/` 重新生成 `foodData/human.json` 的脚本（可选保留，便于菜谱更新后重建索引）。

## 本地预览
```bash
# 在项目根目录启动任意静态服务器（需经 HTTP 访问，file:// 会因 fetch 被拦截）
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

## Docker 部署示例（仅供参考，不纳入本项目仓库）
将本项目整个目录放到服务器的 `app/` 文件夹，再把下面的 `docker-compose.yml` 放在 `app/` 的同级目录（如 `whattoeat/`），用 `docker compose up -d` 启动即可。更新时只需在 `app/` 里 `git pull` 并重启容器，无需重编译镜像。

目录结构示例：
```
whattoeat/
├── docker-compose.yml
└── app/                # 本项目全部内容
    ├── index.html
    ├── recipe.html
    ├── css/ js/ images/ foodData/ howToCook/
    └── scripts/
```

`docker-compose.yml` 示例：
```yaml
version: '3.8'

services:
  WhatToEat:
    image: nginx:alpine
    container_name: WhatToEat
    restart: always
    ports:
      - "3901:80"
    volumes:
      - ./app:/usr/share/nginx/html
```

更新流程：
```bash
cd app
git pull                 # 拉取最新静态文件与 howToCook 菜谱
cd ..
docker compose up -d     # 在 whattoeat/ 目录执行，重启容器
```

## 部署到 GitHub Pages

本项目是纯静态站点，已做好 GitHub Pages 适配，可直接托管：

1. **`.nojekyll`**：已禁用 Jekyll，确保 `howToCook/` 下的 `.md` 文件以**原始文本**提供（菜谱页用 `fetch().text()` 直接读取），且不会因 Jekyll 处理 `_` 目录而漏文件。
2. **相对路径**：所有资源均用 `./css/`、`./js/`、`./foodData/`、`./howToCook/` 等相对路径，因此既支持 `https://<user>.github.io/<repo>/` 这种**子路径**，也支持自定义域名。
3. **自动部署**：推送 `main` 分支后，`.github/workflows/deploy.yml` 会用 GitHub Actions 自动部署。

部署步骤：
- 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
- 把代码推到 `main` 分支，Action 会自动构建并发布。

> 不使用 Actions 也可：Settings → Pages → Source 选 **Deploy from a branch** → 选 `main` / `/root`，`.nojekyll` 同样会让 GitHub 跳过 Jekyll 构建。

## 更新 HowToCook 菜谱后重建索引
`human.json` 是菜谱的索引快照。如果在 `howToCook/` 中新增 / 删除菜谱，需重新生成索引，否则新菜不会进入随机池：
```bash
node scripts/genHumanData.js   # 重新生成 foodData/human.json
```

## 来源

- https://cuijiahua.com/eat/ —— 灵感来源
- https://github.com/MskTmi/WhatToEat —— 代码框架，MIT License
- https://github.com/Anduin2017/HowToCook —— 菜谱数据，The Unlicense（公有领域）
