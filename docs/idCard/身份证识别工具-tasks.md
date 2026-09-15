# 身份证识别工具 · 任务清单

> 依据 [身份证识别工具-技术方案.md](./身份证识别工具-技术方案.md) 拆解。
> 方案与代码现状的差异已在动手前澄清，落定如下（覆写方案中对应描述）：
>
> | # | 方案原文 | 落定结论 |
> |---|---------|---------|
> | 1 | 后端返回 `{code,msg,data}` 全域信封 | **保留 `code` 语义、结构扁平化**，对齐现有 `FavoriteController` 风格 |
> | 2 | 工具页未登录可进、页内提示登录 | **未登录完全看不到工具页**：路由守卫拦 `/tools/idcard`；顶栏「工具 ▾」对未登录用户不渲染 |
> | 3 | 视图名 `IdCardToolView.vue` / 路由名 `idcard-tool` | **改名 `IdCardView.vue`** / 路由名 `idcard`，对齐现有命名 |
> | 4 | 前端测试 | 本期**不引入** vitest（不动 package.json），前端手工验收 |
> | 5 | 逻辑写入 Controller | **引入 Service 层**，识别/解析/号码校验全部落到 `BaiduOcrService`，Controller 只做校验+编排+错误映射 |
>
> 公共文件改动（`router.js` / `App.vue` / `routes/api.php` / `config/services.php`）已获确认。

---

## 阶段 A · 后端

- [x] **A1. 配置与环境变量** —— 改动（公共）：`backend/config/services.php`、`backend/.env`、`backend/.env.example`、`backend/.env.production.example`
  - 追加 `baidu_ocr` 配置块（与 postmark/ses 同级）；三份 env 加 `BAIDU_OCR_API_KEY` / `BAIDU_OCR_SECRET_KEY`（`.env.example`、`.env.production.example` 留空/占位，真实值只进本地 `.env`）
  - 判据：`php artisan config:show services` 能列出 `baidu_ocr` 三项

- [x] **A2. `BaiduOcrService`（核心）** —— 新增（首建 `app/Services/` 目录）：`backend/app/Services/BaiduOcrService.php`
  - `accessToken()`：token 缓存 29 天
  - `recognizeIdCard(binary, side)`：调百度 idcard 接口，`detect_card/photo/direction/risk/quality` 全开；token 失效（110/111）清缓存单次重试；`error_code` 抛 `RuntimeException`
  - `normalize(resp)`：提字段 + 拼 `card_image`/`photo` 的 data URI + 风险块
  - `validateIdNo(id)`：GB 11643 校验位
  - 判据：单测通过（`Http::fake` 打桩，覆盖 token 缓存命中、110 重试、error_code 抛出、normalize 字段映射、校验位正/反例）

- [x] **A3. `IdCardController`** —— 新增：`backend/app/Http/Controllers/Api/IdCardController.php`（依赖 A2）
  - `recognize()`：`$request->validate` 校验 image(jpg/jpeg/png,≤4096KB) + side(front|back)；调 Service；`image_status` 异常图 → 4001/422；Service 异常 → 5001/502；成功返回扁平结构
  - 构造函数注入 `BaiduOcrService`（与方案一致）
  - 日志脱敏：只 `report($e)`，不打印身份证明文
  - 判据：Feature 测试通过（见 A5）

- [x] **A4. 路由** —— 改动（公共）：`backend/routes/api.php`（依赖 A3）
  - `auth:sanctum` 组内加 `POST /tools/idcard/recognize`（实际 URL `/api/tools/idcard/recognize`），顶部补 `use`
  - 判据：`php artisan route:list --path=tools` 能看到该路由且带 sanctum 中间件

- [x] **A5. 后端测试**（34 passed / 84 assertions，含 `@dataProvider`→`#[DataProvider]` 迁移） —— 新增：`backend/tests/Feature/IdCardRecognizeTest.php`
  - 覆盖方案第十一节：正常识别 / 异常图中文提示 / 背面字段 / 未登录 401 / 超限非图片 422 / 百度超时 → 502 且无明文 / error_code 17,18 → 5001 / 号码校验
  - 判据：`cd backend && composer test` 全绿

---

## 阶段 B · 前端

- [x] **B1. API 封装** —— 新增：`frontend/src/api/idcard.js`
  - `recognizeIdCard(file, side)`：FormData + `timeout: 30000`，返回 `res.data`
  - 判据：构建通过（`npm run build`）

- [x] **B2. 工具页视图**（构建通过；`npm run dev` 手工联调并入 C2） —— 新增：`frontend/src/views/IdCardView.vue`（依赖 B1）
  - 上传区（点击/拖拽 + front/back 切换）+ 前端预校验（类型/≤4MB 直接拦不发请求）+ 识别按钮（loading 态）
  - 结果区：左摆正图预览 + 下载按钮（data URI → `a[download]`）；右字段表格 + `idno_valid=false` 红色标注 + 风险/质量提示
  - 合规文案：「图片仅用于本次识别，不会被服务器保存」
  - 判据：`npm run build` 通过 + `npm run dev` 手工走通

- [x] **B3. 路由 + 未登录拦截** —— 改动（公共）：`frontend/src/router.js`（依赖 B2）
  - 加 `/tools/idcard`（懒加载）；加全局 `beforeEach` 守卫：未登录访问该路由 → 重定向首页
  - 判据：未登录直接敲 `#/tools/idcard` 会被弹回首页

- [x] **B4. 顶栏「工具 ▾」下拉** —— 改动（公共）：`frontend/src/App.vue`（依赖 B3）
  - 已登录才渲染「工具 ▾」；点击展开、点外部/选中后收起；复用 `--panel/--border/--accent`
  - 未登录被守卫弹回首页时，顺带唤起登录弹窗（复用现有 `showLogin`）
  - 判据：登录后可见下拉并能进入工具页；未登录看不到「工具」

---

## 阶段 C · 联调与验收

- [x] **C1. 整体构建**：`cd frontend && npm run build`（✓ 1.92s）+ `backend` `php artisan test`（✓ 34 passed）双双通过
- [x] **C2. 端到端手工验收**（本地 `.env` 已填真实百度 Key，已联调走通）：歪斜带背景图能摆正下载、字段正确、未登录被拦、异常提示友好、日志无敏感明文、记录真实延迟
  - 步骤：`backend` 起 `php -S 127.0.0.1:8000 -t public public/index.php` + `frontend` 起 `npm run dev` → 登录 → 顶栏「工具 ▾」→ 身份证识别 → 上传测试图
  - 结论：本机 `php artisan serve` 被安全软件拦截，改用 `php -S`；补配 `cacert.pem` + `php.ini`（`curl.cainfo`/`openssl.cafile`）解决跨境调百度的 `cURL error 60`，识别已跑通
- [x] **C3. 上线准备说明**：见技术方案 §4.2（第 105 行）与 §（第 483 行）——生产走 **Render 控制台 → 服务 → Environment** 新增两条环境变量，与 DB 密钥同样管理，绝不进 git：
  - `BAIDU_OCR_API_KEY` = 百度控制台应用的 API Key
  - `BAIDU_OCR_SECRET_KEY` = 百度控制台应用的 Secret Key
  - 改完 env 后 Render 会自动重建；无需改代码（`config/services.php` 已读这两个 env）

---

## 依赖顺序

```
A1 → A2 → A3 → A4 → A5
              ↓
B1 → B2 → B3 → B4
              ↓
         C1 → C2 → C3
```

后端（A）与前端 API 封装（B1）无强依赖，B2 起需要 A4 的接口可用才能手工联调。

## 风险备忘

- 跨境延迟（后端新加坡 → 百度大陆）：已按方案加了 20s/30s 超时 + token 缓存，实测不达标再上退避重试或国内中转。
- 百度额度：身份证识别 1000 次/月免费（需控制台手动领取），失败调用也扣额度。
- 本地 `Http` 门面依赖 Guzzle，已确认 `composer.lock` 内有 `guzzlehttp/guzzle 7.15.5`，无需 `composer require`。
