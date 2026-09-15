# 车榜 ChéBǎng · 汽车销量排行榜与配置查询

一个客观呈现新能源与燃油车**年度销量排行榜**、并可查看**车型详细配置**、进行**多车对比**的网页应用。深色科技风，手机 / 电脑自适应。

> ⚠️ 当前为**演示版（Demo）**：内置 16 款真实热门车型，销量为基于公开渠道的**近似值**，仅用于界面演示。正式版将替换为官方公开数据并标注来源与统计口径。

---

## 功能一览

- 🏆 **年度销量榜**：按销量降序，含排名奖牌配色、销量占比条
- 🔀 **多维筛选**：新能源/燃油 + 车型级别（SUV/轿车/MPV）+ 价格区间 + 品牌，可自由组合
- 🔍 **搜索**：按车名或品牌快速查找
- 📄 **车型详情**：完整配置表 + 关键指标 + 月度销量走势图
- ⚖️ **多车对比**：底部对比浮条，最多 4 款并排逐项对比，差异行高亮
- 📈 **趋势图表**：新能源 vs 燃油占比环形图、销量 TOP 8 柱状图、单车月度折线图
- ⭐ **收藏夹**：可选登录后收藏心仪车型（演示登录，仅保存在本机浏览器）

---

## 技术栈

- **前端**：Vue 3 + Vue Router + Vite
- **图表**：Chart.js
- **后端**：Laravel 12 + PHP 8.2（Sanctum Token 鉴权）—— 承载登录/注册、收藏、身份证识别工具；数据库用 SQLite
- **数据**：车型销量与配置仍内置于前端 `src/data/cars.js`（见文末说明）

---

## 环境要求

**前端**

- Node.js ≥ 18（本项目在 Node 24 下开发）
- npm ≥ 9

**后端**（如需登录 / 收藏 / 身份证识别等接口）

- PHP ≥ 8.2（需启用 `curl`、`openssl`、`pdo_sqlite`、`mbstring`、`fileinfo` 扩展）
- Composer 2

---

## 快速开始

前端可独立运行（只看榜单 / 对比 / 图表）；要用登录、收藏、身份证识别，需同时起后端。

### 前端

```bash
cd frontend

# 1. 安装依赖（首次运行前执行一次）
npm install

# 2. 启动开发服务器（默认自动打开浏览器）
npm run dev
```

启动后访问：**http://localhost:5180/**

> 端口固定为 `5180`（在 `vite.config.js` 中通过 `strictPort` 锁定）。若该端口被占用，会直接报错而非自动切换端口——可在 `vite.config.js` 里修改 `server.port`。
>
> 开发期 `/api` 请求由 Vite 代理到 `http://127.0.0.1:8000`（后端），所以后端固定跑在 `8000` 端口。

### 后端

```bash
cd backend

# 1. 安装依赖（首次运行前执行一次）
composer install

# 2. 准备环境变量与应用密钥（首次）
cp .env.example .env
php artisan key:generate

# 3. 建库建表（SQLite，首次）
php artisan migrate

# 4. 启动后端（固定 8000 端口，与前端代理对齐）
php -S 127.0.0.1:8000 -t public public/index.php
```

> ⚠️ **为什么不用 `php artisan serve`**：部分本机安全软件会拦截 artisan 派生的子进程监听端口（表现为 `Failed to listen on 127.0.0.1:8000`）。改用 PHP 内置服务器 `php -S` 直接启动即可，效果一致。

身份证识别工具还需两项额外准备：

1. **百度 OCR 密钥**：在 `backend/.env` 填 `BAIDU_OCR_API_KEY` / `BAIDU_OCR_SECRET_KEY`（百度智能云「文字识别」应用里获取，免费额度 1000 次/月需手动领取）。密钥只进本地 `.env`，不进 git；线上走 Render 环境变量。
2. **CA 根证书**（跨境调百度 HTTPS 需要）：若识别报 `cURL error 60: SSL certificate problem`，说明 PHP 未配置 CA 根证书。下载 [cacert.pem](https://curl.se/ca/cacert.pem)，在 `php.ini` 中配置后重启后端：
   ```ini
   curl.cainfo = "<cacert.pem 的绝对路径>"
   openssl.cafile = "<cacert.pem 的绝对路径>"
   ```

### 其他命令

```bash
# 前端（在 frontend/ 下）
npm run build     # 生产构建，产物输出到 dist/
npm run preview   # 本地预览生产构建结果

# 后端（在 backend/ 下）
php artisan test  # 跑后端测试
```

---

## 目录结构

仓库分为 `frontend/`（Vue 前端）与 `backend/`（Laravel 后端）两部分。以下为前端结构：

```
frontend/
├── index.html                # 入口 HTML
├── vite.config.js            # Vite 配置（端口、别名、/api 代理等）
├── package.json
└── src/
    ├── main.js               # 应用入口
    ├── App.vue               # 根组件（顶栏、搜索、登录、工具下拉、底部对比浮条）
    ├── router.js             # 路由配置（含未登录守卫）
    ├── store.js              # 全局状态（收藏、登录、对比选择 + 本地存储）
    ├── api/                  # 后端接口封装（axios 实例、收藏、身份证识别）
    ├── assets/
    │   └── styles.css        # 全局深色科技风样式与 CSS 变量
    ├── data/
    │   └── cars.js           # 车型演示数据（后续替换为官方数据）
    ├── components/
    │   ├── CarThumb.vue       # 车型缩略图（渐变占位）
    │   ├── CarRow.vue         # 榜单单行
    │   ├── ChartCanvas.vue    # Chart.js 通用图表画布
    │   ├── CompareBar.vue     # 底部对比浮条
    │   └── LoginToast.vue     # 登录提示
    └── views/
        ├── RankingView.vue    # 榜单首页（筛选 + 列表 + 概览图表）
        ├── CarDetailView.vue  # 车型详情页
        ├── CompareView.vue    # 多车对比页
        ├── FavoritesView.vue  # 收藏夹页
        └── IdCardView.vue     # 身份证识别工具页
```

---

## 数据说明与后续计划

- 现阶段数据位于 `src/data/cars.js`，字段含：能源类型、级别、价格区间、年销量、月度走势、详细配置等。
- **正式版方案（已与需求方确认）**：仅使用官方公开数据（如乘联会销量、工信部/厂商公开配置），合规、免费、标注来源。
- "车主真实缺点反馈"功能暂缓，后续再定实现方式。

---

## 备注

- 登录与收藏均为本地演示，数据仅存于当前浏览器，清除浏览器数据即失效，暂无真实账号体系。
