# 菜单系统图片上传落地方案（A 方案：Cloudflare R2 + 前端直传）

> 状态：待实施 ｜ 生成日期：2026-09-18 ｜ 适用项目：che-bang（Laravel 12 + Vue 3）

## 一、背景与目标

给菜单系统增加「上传图片 + 后期查看」能力。图片本体存对象存储，数据库只存 key，前端直传，后端只签发临时凭证。

现有技术栈（已确认）：

- **后端**：Laravel 12 / PHP 8.2 / Sanctum 鉴权，部署在 Render（Docker）+ Aiven MySQL 新加坡区。
- **前端**：Vue 3 + Vite + axios，部署在 Vercel，域名 `aihhyy.cn`（未备案）。
- 后端 `.env` 已预留 `AWS_*` 一组 S3 配置项，但尚未安装 S3 驱动。

## 二、为什么选 Cloudflare R2

1. **S3 兼容**：Laravel 现有的 `AWS_*` 配置和 S3 驱动可原样复用，只需改 endpoint，代码几乎零改造。
2. **出网流量（egress）完全免费**：R2 最大卖点，图片查看再多也不额外产生流量费。这是相对阿里云 OSS / 腾讯云 COS 的核心优势（后者查看图片按流量收费）。
3. **不需要备案**：项目域名 `aihhyy.cn` 未备案。用国内 OSS/COS 绑自定义域名做 CDN 要求备案，直接卡住；R2 挂 Cloudflare 域名或 `r2.dev` 域名都无需备案。
4. **与现有境外基础设施一致**：Render（新加坡）+ Vercel 本就在墙外体系，链路统一。

> 未来若迁移到「国内服务器 + 备案域名」的长期方案，再切换到阿里云 OSS / 腾讯云 COS。届时因走 S3 兼容抽象，改动很小。

## 三、费用与免费额度

R2 免费额度是三个独立的桶，每月刷新：

| 项目 | 免费额度/月 | 谁消耗它 |
|---|---|---|
| 存储量 | 10 GB | 图片累积占用（唯一会累积的） |
| Class A 操作（写：上传/PUT） | 100 万次 | 上传图片时 |
| Class B 操作（读：GET） | 1000 万次 | 查看图片时 |
| 出网流量（egress） | 完全免费、无上限 | 查看时的下行带宽 |

**菜单系统用量估算**（假设 200 道菜、每张 200KB）：

- 存储：200 × 200KB ≈ 40MB，占免费额度的 0.4%。2000 张图也才 400MB。
- 查看（Class B）：1000 万次/月 ≈ 每天 33 万次 GET，需每天 1 万次页面打开（每次加载 30 张图）才用满。菜单站到不了这个量级，且浏览器缓存会进一步减少 GET。
- 上传（Class A）：后台传图一个月撑死几百次，100 万额度用不完。

**结论：菜单系统用 R2 免费额度，本项目生命周期内基本花不完。**

**超额处理**：

1. 默认不绑卡只用免费额度，超额是拒绝请求 / 提示升级，不会偷偷产生账单。
2. 真付费也便宜：存储 $0.015/GB/月、读操作 $0.36/百万次。翻 100 倍一个月也就几毛钱。
3. 前面挂 Cloudflare CDN 缓存后，重复访问不碰 R2，读次数再降一个数量级。

## 四、整体架构与数据流

前端直传流程（图片本体不经过后端，节省 Render 带宽）：

```
1. 前端（Vue）      → 请求后端「签发上传 URL」接口（带 Sanctum 登录态）
2. 后端（Laravel）  → 生成 R2 预签名 PUT URL + 目标 key，返回给前端
3. 前端            → axios 直接 PUT 图片二进制到该预签名 URL（直连 R2）
4. 前端            → 把返回的 key 提交给业务接口，存进数据库
5. 查看时          → 用 key 拼公开域名（公开读）或后端签发临时读 URL（私有读）
```

**数据库存 key，不存完整 URL**：如 `menu/2026/09/uuid.jpg`。日后换域名 / 换 CDN / 换存储都不用改数据。

## 五、后端改造清单（Laravel）

1. **装 S3 驱动**：
   ```bash
   composer require league/flysystem-aws-s3-v3
   ```

2. **`config/filesystems.php` 新增 r2 disk**（复用现有 `AWS_*` 变量）：
   ```php
   'r2' => [
       'driver' => 's3',
       'key' => env('AWS_ACCESS_KEY_ID'),
       'secret' => env('AWS_SECRET_ACCESS_KEY'),
       'region' => 'auto',
       'bucket' => env('AWS_BUCKET'),
       'endpoint' => env('AWS_ENDPOINT'), // R2: https://<accountid>.r2.cloudflarestorage.com
       'use_path_style_endpoint' => true,
       'throw' => false,
   ],
   ```

3. **`.env` / `.env.example` 补充**（R2 控制台创建 API Token 后获取）：
   ```
   FILESYSTEM_DISK=r2
   AWS_ACCESS_KEY_ID=<R2 Access Key ID>
   AWS_SECRET_ACCESS_KEY=<R2 Secret Access Key>
   AWS_BUCKET=<桶名>
   AWS_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
   AWS_DEFAULT_REGION=auto
   R2_PUBLIC_BASE_URL=<公开访问域名，如 https://img.aihhyy.cn 或 https://xxx.r2.dev>
   ```

4. **签发预签名上传 URL 的接口**（用 Sanctum 保护，仅登录用户可拿）：
   ```php
   // routes/api.php 内，套 auth:sanctum 中间件
   $key = 'menu/'.date('Y/m').'/'.Str::uuid().'.'.$ext;
   $url = Storage::disk('r2')->temporaryUploadUrl($key, now()->addMinutes(10));
   return ['upload_url' => $url['url'], 'headers' => $url['headers'], 'key' => $key];
   ```

5. **菜单表 migration**：图片字段存 key，如 `image_key varchar(255) nullable`。

6. **返回给前端时把 key 拼成完整 URL**（在 API Resource 里拼 `R2_PUBLIC_BASE_URL . '/' . key`），前端只管渲染。

## 六、前端改造清单（Vue）

1. 上传组件：选图后先做前端校验（类型 jpg/png/webp、大小上限如 5MB），可选做客户端压缩。
2. 调后端「签发上传 URL」接口，拿到 `upload_url` / `headers` / `key`。
3. 用 axios 直接 PUT 到 `upload_url`（注意带上后端返回的 `headers`，如 `Content-Type`）：
   ```js
   await axios.put(uploadUrl, file, { headers })
   ```
   > 注意：直传 R2 时不要带 Sanctum 的 Authorization 头，预签名 URL 自带鉴权。
4. 上传成功后，把 `key` 提交给菜单业务接口保存。
5. 查看：后端返回的完整 URL 直接用 `<img :src="...">` 渲染。

**CORS**：需在 R2 桶设置里允许来自 `https://aihhyy.cn`（及本地开发源）的 PUT 请求，否则前端直传会被浏览器拦截。

## 七、公开读 vs 私有读

| 方式 | 做法 | 适用 |
|---|---|---|
| **公开读（推荐给菜单）** | 桶绑定一个公开域名，图片 URL 直接可访问 | 菜单图无隐私，最简单、可走 CDN 缓存、GET 不消耗签名开销 |
| 私有读 | 桶保持私有，每次查看由后端签发临时读 URL | 图片涉及隐私、需按用户鉴权时 |

**菜单场景选公开读**：图片本身不敏感，公开读实现最简单、缓存效果最好。上传仍走私有的预签名 PUT（只有登录用户能拿到上传凭证），读则公开——写受控、读开放，是菜单类应用的标准组合。

## 八、实施步骤（Checklist）

**准备（控制台，一次性）**

- [ ] 注册 / 登录 Cloudflare，开通 R2
- [ ] 创建桶（如 `chebang-menu`）
- [ ] 创建 R2 API Token，记录 Access Key ID / Secret
- [ ] 配置公开访问域名（`r2.dev` 或自定义子域如 `img.aihhyy.cn`）
- [ ] 配置桶 CORS，允许 `https://aihhyy.cn` 及本地开发源的 PUT

**后端**

- [ ] `composer require league/flysystem-aws-s3-v3`
- [ ] `config/filesystems.php` 加 `r2` disk
- [ ] `.env` / `.env.example` 补充 R2 变量
- [ ] 新增签发预签名上传 URL 的接口（Sanctum 保护）
- [ ] 菜单表 migration 增加 `image_key` 字段
- [ ] API 返回时把 key 拼成完整 URL

**前端**

- [ ] 上传组件（校验 + 可选压缩）
- [ ] 调签发接口 → axios PUT 直传 R2
- [ ] 提交 key 保存 → 列表/详情用完整 URL 渲染

**验证**

- [ ] 本地跑通：选图 → 直传成功 → R2 控制台看到文件 → 页面正常显示
- [ ] 部署到 Render 后回归一遍

## 九、待确认事项

实施前需你拍板：

1. **读取方式**：确认走「公开读」（本方案默认，菜单推荐）还是需要私有签名读。
2. **公开域名**：用 R2 自带的 `r2.dev` 域名（零配置、稍慢），还是绑自定义子域 `img.aihhyy.cn`（走 Cloudflare CDN、更快，需在 DNS 加解析）。
3. **图片规格**：单图大小上限、允许格式、是否需要客户端/服务端压缩或生成缩略图。
4. **菜单数据模型**：一道菜单张图还是多张图（决定 `image_key` 是单字段还是关联表）。

> 以上确认后即可进入编码。本方案仅涉及新增文件与公共配置（`config/filesystems.php`、`.env`、`routes/api.php`），改动前会再次逐项确认。
