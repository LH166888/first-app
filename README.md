# AI 无限 · 个人应用平台（车榜 / 菜单 / 工具箱）

一个「一个入口，连接多种可能」的个人应用平台。当前内置三个应用模块：**车榜**（汽车销量排行与配置对比）、**菜单**（把拿手菜分享给朋友、朋友点单表达兴趣、线下约饭）、**工具箱**（身份证识别等实用小工具）。深色科技风，手机 / 电脑自适应。

> ⚠️ 当前为**演示版（Demo）**：车榜内置若干真实热门车型，销量为基于公开渠道的**近似值**，仅用于界面演示；菜单/工具箱数据同样以演示为主。

---

## 应用模块

### 🚗 车榜 `/cars`

- 🏆 **年度销量榜**：按销量降序，含排名奖牌配色、销量占比条
- 🔀 **多维筛选**：新能源/燃油 + 车型级别（SUV/轿车/MPV）+ 价格区间 + 品牌，可自由组合
- 🔍 **搜索**：按车名或品牌快速查找
- 📄 **车型详情**：完整配置表 + 关键指标 + 月度销量走势图
- ⚖️ **多车对比**：底部对比浮条，最多 4 款并排逐项对比，差异行高亮
- ⭐ **收藏夹**：登录后收藏心仪车型

### 🍽️ 菜单 `/menu`

把你会做的菜分享给朋友、家人。朋友「点单」表达的是「我想吃这道」的**兴趣信号**，而不是电商下单——不涉及支付，也无需平台内联系方式。

- 核心流程：**创建 → 分享 → 朋友点单表达兴趣 → 线下约饭**
- 创建菜品（食材、步骤、图片上传），管理「我的菜单」
- 发现他人菜单、加入购物车向对方点单
- 「点单明细」查看「我收到的 / 我下的」，据此线下约时间

### 🧰 工具箱 `/tools`

- 身份证识别（百度 OCR）等实用小工具

---

## 技术栈

- **前端**：Vue 3 + Vue Router + Vite，按业务模块组织（`src/modules/*`）
- **图表**：Chart.js
- **代码规范**：ESLint 9（flat config）+ Prettier
- **后端**：Laravel 12 + PHP 8.2（Sanctum Token 鉴权）—— 承载登录/注册、收藏、点单、身份证识别等接口；数据库用 SQLite
- **数据**：车型销量与配置内置于前端（见文末说明）

---

## 环境要求

**前端**

- Node.js ≥ 18（本项目在 Node 24 下开发）
- npm ≥ 9

**后端**（如需登录 / 收藏 / 点单 / 身份证识别等接口）

- PHP ≥ 8.2（需启用 `curl`、`openssl`、`pdo_sqlite`、`mbstring`、`fileinfo` 扩展）
- Composer 2

---

## 快速开始

前端可独立运行（车榜的榜单 / 对比 / 图表无需后端）；要用登录、收藏、菜单点单、身份证识别，需同时起后端。

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
npm run build        # 生产构建，产物输出到 dist/
npm run preview      # 本地预览生产构建结果
npm run lint         # ESLint 检查
npm run lint:fix     # ESLint 自动修复
npm run format       # Prettier 格式化全部文件
npm run format:check # Prettier 仅检查（不写入）

# 后端（在 backend/ 下）
php artisan test  # 跑后端测试
```

---

## 目录结构

仓库分为 `frontend/`（Vue 前端）与 `backend/`（Laravel 后端）两部分。前端按「平台外壳 + 业务模块」组织：

```
frontend/
├── index.html                # 入口 HTML
├── vite.config.js            # Vite 配置（端口、别名、/api 代理等）
├── eslint.config.js          # ESLint 扁平配置
├── .prettierrc.json          # Prettier 配置
├── package.json
└── src/
    ├── main.js               # 应用入口
    ├── App.vue               # 平台外壳（顶栏、品牌、共享用户区、登录弹窗）
    ├── router.js             # 汇总各模块路由（含未登录守卫）
    ├── assets/               # 全局深色科技风样式与 CSS 变量
    ├── shared/               # 跨模块公共层
    │   ├── store.js          # 全局用户态（user / token + 认证动作）
    │   ├── api/              # axios 实例、鉴权、内存缓存
    │   └── components/       # 公共组件（登录弹窗、登录提示）
    └── modules/              # 业务模块，各自内聚（视图 / 组件 / 路由 / 局部 store / API）
        ├── home/             # 门户首页（三应用栅格导航）
        ├── car/              # 车榜（榜单 / 详情 / 对比 / 收藏 + 局部 store）
        ├── menu/             # 菜单（我的菜单 / 发现 / 点单 + 购物车）
        ├── tools/            # 工具箱（身份证识别等）
        └── profile/          # 个人信息
```

> 公共层原则：`shared/` 只保留跨模块真正共享的东西（全局用户态、axios、公共组件）；各模块的局部状态（如车榜收藏/对比、菜单购物车）下沉到对应模块内部，模块间通过事件（如登录/登出）解耦。

---

## 数据说明与后续计划

- 车榜车型销量与配置现阶段内置于前端 `src/modules/car/data/`，字段含：能源类型、级别、价格区间、年销量、月度走势、详细配置等。
- **车榜正式版方案（已与需求方确认）**：仅使用官方公开数据（如乘联会销量、工信部/厂商公开配置），合规、免费、标注来源。

---

## 备注

- 登录采用账号制 + 邀请码注册；token 存于浏览器本地。
- 菜单的「点单」是兴趣表达，不涉及站内支付与联系方式，具体约饭时间由双方线下协商。
