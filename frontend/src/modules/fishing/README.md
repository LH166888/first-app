# 怀旧捕鱼机 · 前端模块开发文档

Vue 3 + Vite + Canvas 2D 实现的街机捕鱼小游戏。游戏循环为纯 JS，与 Vue 响应式解耦，
仅在离散事件（命中/结算/炮倍切换）回调到组件层，保证 60fps。

## 目录结构

```
modules/fishing/
├─ FishingLayout.vue        子布局（路由出口 + 过渡）
├─ routes.js                路由（/games/fishing 大厅/游戏/结算），已注册进 src/router.js
├─ store.js                 局部状态（金币/最高分/榜单/引导已读），非游戏循环用
├─ config/
│  └─ games-fishing-config.json   数值配置（AI-11 交付，唯一调参入口）
├─ engine/                  纯 JS 引擎（无 Vue / 无框架依赖）
│  ├─ game.js               主控：状态机 + rAF 循环 + 结算，组合下面三者
│  ├─ physics.js            纯函数：出鱼/弹道/碰撞/捕获概率/结算
│  ├─ renderer.js           Canvas 2D 绘制（背景/气泡/鱼/子弹/特效/炮台/HUD遮罩）
│  ├─ sound.js              音效接口 play('shoot'|'hit'|'capture'|'coin')，WebAudio 合成桩
│  └─ rtp-validator.js      Node 蒙特卡洛校验脚本（AI-11 交付）
├─ components/
│  ├─ GameCanvas.vue        Canvas 宿主：把鼠标/键盘/触屏输入翻译成引擎方法
│  ├─ GameHUD.vue           顶栏：金币/净分/炮倍切换/暂停/退出
│  ├─ Leaderboard.vue       榜单 TOP10 + 我的名次
│  └─ GuidingOverlay.vue    新手引导浮层（首次访问）
├─ views/
│  ├─ FishingLobby.vue      大厅：预览/我的数据/开始/榜单/引导
│  ├─ FishingGame.vue       游戏页：HUD + Canvas + 金币不足提示 + 结算跳转
│  └─ FishingResult.vue     结算页：净分/捕获统计/名次/新纪录/再来一局/分享
└─ api/leaderboard.js       后端接口（AI-10 契约，复用 shared/api/client 默认实例）
```

## 运行

```bash
cd frontend
npm install
npm run dev      # http://localhost:5180/#/games/fishing
npm run build    # 生产构建
```

后端接口默认经 Vite 代理 `/api` → `http://127.0.0.1:8000`（见 vite.config.js）。

## 核心机制

- **状态机**：`idle → running ⇄ paused → over`，见 `engine/game.js`。
- **捕获判定**：一次命中掷一次骰子，`捕获率 = base_catch_rate_1x × catch_rate_amplification[炮倍]`，封顶 1.0。血量（health）目前仅作视觉/难度提示，不做多段扣血——与 AI-11 的 RTP 口径一致。
- **金币收支**：单发消耗 `= cannon_cost_per_shot × 炮倍`；捕获吐分 `= payout_multiplier × 炮倍`。
- **净分**：`本局吐分 - 本局消耗`（可为负）；上报榜单时按 `max(0, 净分)` 并受反作弊阈值裁剪。
- **特殊鱼**：元宝鱼金币雨（观感）、灯笼鱼连锁引爆小鱼、河豚小范围溅射捡漏。

## 调参指南

所有数值集中在 `config/games-fishing-config.json`，**改配置即可，无需动引擎代码**：

| 目标 | 改哪里 |
| --- | --- |
| 某种鱼更/更少出现 | `fish_species[].spawn_weight`（相对权重，自动归一化） |
| 某种鱼更/更难捕获 | `fish_species[].base_catch_rate_1x` |
| 调整吐分 | `fish_species[].payout_multiplier` |
| 高炮倍激励 | `cannon_mechanics.catch_rate_amplification` |
| 可用炮倍档位 | `cannon_mechanics.multipliers` |
| 初始/每日金币 | `game_modes.standard.initial_coins` / `daily_free_coins` |
| 单局防刷阈值 | `anti_cheat.max_single_session_coins` |

改动权重/捕获率/赔率后，用 `node src/modules/fishing/engine/rtp-validator.js` 复跑蒙特卡洛，确认 RTP 落在 92%–96%。

引擎侧手感参数（非数值平衡，按需微调）：`engine/physics.js` 的 `BULLET_SPEED`、出鱼速度；`engine/game.js` 的 `MAX_FISH`（屏上最大鱼数）、`_spawnInterval`（出鱼间隔）。

## 扩展指南

- **接入美术资源**：只改 `renderer.js` 的 `_drawFish` / `_drawBullet` / `_drawCannon`（换成 drawImage），其余不动；鱼种配色表在文件顶部 `FISH_COLORS`。
- **接入真实音效**：`sound.js` 保持 `play(name)` 接口，用 AudioBuffer 加载素材替换合成逻辑即可，引擎无需改动。
- **新增鱼种**：在 config 的 `fish_species` 追加一项，并在 `renderer.js` 的 `FISH_COLORS` 补一个配色；有特效则在 `game.js` 的 `_capture` 分支加处理。
- **二期特性**（锁定链 / Boss 潮 / 移动端增强）见 config 的 `phase_2_features`。

## 引导文案清单（GuidingOverlay.vue）

| 图标 | 标题 | 文案 |
| --- | --- | --- |
| 🎯 | 瞄准 | 移动鼠标（或手指）让炮口对准鱼，点击 / 空格开炮。 |
| 🔫 | 切换炮倍 | 按 + / - 或点顶部 1× 2× 5× 10× 切换炮倍。 |
| 💰 | 炮倍权衡 | 炮倍越高，每发消耗越多，但命中后吐分也越多、越容易捕获大鱼。 |
| 🐡 | 海底彩蛋 | 元宝鱼吐金币雨、灯笼鱼连锁引爆、河豚小范围溅射——优先招呼它们！ |
| 🏁 | 目标 | 金币打光即结束，净胜金币越高排名越靠前。 |

引导为首次访问弹出（`localStorage` key = `fishing_guide_seen`），可「跳过」。

## 操作说明

| 操作 | 键鼠 |
| --- | --- |
| 瞄准 | 移动鼠标 / 触屏移动 |
| 开炮 | 点击 / 空格 |
| 炮倍 +/− | `+` `-` 键 或 HUD 按钮 |
| 暂停 | `P` 键 或 HUD 暂停 |

## 后端接口（AI-10 契约）

- `POST /games/fishing/scores` body `{ score, coins_won }` → `{ data:{ id, score, rank, created_at } }`
- `GET  /games/fishing/leaderboard` → `{ data:[{ rank, user_id, user_name, score, coins_won, played_at }], meta:{ current_rank, current_user_score, total_players } }`
- `GET  /games/fishing/me` → `{ data:{ highest_score, total_coins_won, total_games, avg_score } }`

均需登录（`auth:sanctum`）。未登录 / 网络异常时前端静默降级：可正常试玩，成绩不入榜，结算页提示「登录后再玩即可上榜」。
