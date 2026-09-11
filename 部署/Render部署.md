# Render 部署操作手册（阶段 2·你操作，我给指引）

> 配套文档：`../后端部署计划.md`。本手册是「在 Aiven 建库 + 在 Render 建服务」的逐步操作清单。
> 创建：2026-09-10

## 前置：确认代码已推送

阶段 1 的新增文件（`backend/Dockerfile`、`backend/docker/*`、`backend/.dockerignore`、
`backend/.env.production.example`、改后的 `DatabaseSeeder.php`）已在 `feat/api-integration` 分支，
**先把该分支推到 GitHub**（不要推 main）：

```bash
git push origin feat/api-integration
```

## 第一步 · Aiven 建 MySQL

1. 打开 https://aiven.io ，注册（无需信用卡）。
2. Create service → **MySQL**。
3. **Cloud 选任意云厂商，Region 必须选 `ap-southeast-1 / Singapore`**（与后端 Render 同区，降延迟）。
4. Plan 选 **Free**（免费永久档）。
5. 建好后进服务详情页 → **Connection information**，记下：
   - `Host`
   - `Port`（**不是 3306**，Aiven 是随机高位端口，别填错）
   - `User`（默认 `avnadmin`）
   - `Password`
   - `Database`（默认 `defaultdb`）
6. 同页找到 **CA Certificate → Download**，得到 `ca.pem`，保存好，第三步要用。

## 第二步 · 本地生成 APP_KEY

在 `backend/` 目录执行，复制输出（形如 `base64:....`）备用：

```bash
php artisan key:generate --show
```

> 这个 key 只填进 Render 环境变量，**不要**提交进代码库，也**不要**与本地 `.env` 相同。

## 第三步 · Render 建 Web Service

1. 打开 https://render.com ，用 GitHub 登录并授权访问仓库 `LH166888/first-app`。
2. New → **Web Service** → 选该仓库 → 选分支 `feat/api-integration`。
3. 关键设置：
   - **Root Directory**：填 `backend`
   - **Environment**：选 **Docker**（会自动识别 `backend/Dockerfile`）
   - **Instance Type**：选 **Free**
   - Region：选 **Singapore**
4. **Secret File**（挂载 Aiven CA 证书）：
   - Advanced → Add Secret File
   - Filename：`/etc/ssl/certs/aiven-ca.pem`
   - Contents：把 `ca.pem` 全文粘进去
5. **Environment Variables**：按下表逐条填（值来自第一步/第二步）。

## 第四步 · 环境变量清单

| Key | Value | 说明 |
|-----|-------|------|
| `APP_NAME` | `chebang` | |
| `APP_ENV` | `production` | |
| `APP_KEY` | `base64:...` | 第二步生成的 |
| `APP_DEBUG` | `false` | 生产必须 false |
| `APP_URL` | `https://<服务名>.onrender.com` | 服务名建好后回填 |
| `DB_CONNECTION` | `mysql` | |
| `DB_HOST` | Aiven Host | |
| `DB_PORT` | Aiven Port | **非 3306** |
| `DB_DATABASE` | `defaultdb` | |
| `DB_USERNAME` | Aiven User | 默认 `avnadmin` |
| `DB_PASSWORD` | Aiven Password | |
| `MYSQL_ATTR_SSL_CA` | `/etc/ssl/certs/aiven-ca.pem` | **变量名必须是这个**（config/database.php 读的是它，不是 DB_SSL_CA）；值=第三步 Secret File 路径 |
| `SESSION_DRIVER` | `cookie` | 无状态 |
| `CACHE_STORE` | `file` | |
| `QUEUE_CONNECTION` | `sync` | |
| `LOG_CHANNEL` | `stderr` | 日志进 Render 面板 |
| `LOG_LEVEL` | `warning` | |

> 不设 `APP_TIMEZONE`：当前 `config/app.php` 硬编码 `UTC` 未读该 env，填了不生效。

6. 点 **Create Web Service**，Render 开始构建（首次约 3-8 分钟）。

## 第五步 · 验证（阶段 3）

部署完成后（服务名假设为 `chebang-backend`）：

```bash
# 1. 健康检查，应返回 200
curl -i https://chebang-backend.onrender.com/up

# 2. 车型列表，应返回 16 条
curl https://chebang-backend.onrender.com/api/cars

# 3. 登录冒烟（先注册一个账号，或用你已有账号）
curl -X POST https://chebang-backend.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"tester","email":"t1@example.com","password":"password123","password_confirmation":"password123"}'
```

同时看 **Render → Logs**，确认：
- `[start] 执行数据库迁移...` 后无报错（表已建）
- `[start] 灌入车型种子数据...` 后无报错（16 条已 upsert）
- `apache2-foreground` 已起，无 500

### 常见问题排查
- **500 且日志报 SSL/连接被拒**：多半是 `MYSQL_ATTR_SSL_CA` 变量名写错、或 Secret File 路径/内容不对。
- **连接超时**：确认 Aiven 与 Render 都在 Singapore；确认 `DB_PORT` 用的是 Aiven 高位端口。
- **首访很慢（30-60s）**：Free 实例冷启动，正常；阶段 4 配保活可缓解。

## 下一步（阶段 4，后端跑通后另开）
1. cron-job.org 每 10 分钟打 `GET /up` 保活。
2. 前端 `.env.production` 填 `VITE_API_BASE_URL=https://<服务名>.onrender.com/api`。
3. 联调通过后再 merge 到 main。
