import { reactive } from 'vue'
import config from './config/games-fishing-config.json'

// 捕鱼模块局部状态。与全局用户态解耦；引擎运行时不读写这里（避免响应式追踪进游戏循环），
// 只在「进入/退出游戏、拉取榜单」等离散时机同步。
const GUIDE_KEY = 'fishing_guide_seen'
export const INITIAL_COINS = config.game_modes.standard.initial_coins // 3000

export const fishingStore = reactive({
  // 当前金币余额（客户端每日免费池；后端暂无余额接口，刷新后重置为初始值）
  coins: INITIAL_COINS,
  // 个人最高分与名次（来自 GET /me、/leaderboard）
  bestScore: 0,
  rank: null,
  // 榜单 TOP N 与总人数
  leaderboard: [],
  totalPlayers: 0,
  // 上一局结算数据，供结算页读取
  lastResult: null,
  // 新手引导是否已看过（首次访问弹一次）
  guideSeen: localStorage.getItem(GUIDE_KEY) === '1',
})

export function markGuideSeen() {
  fishingStore.guideSeen = true
  try {
    localStorage.setItem(GUIDE_KEY, '1')
  } catch {
    /* 隐私模式下 localStorage 可能不可写，忽略 */
  }
}

// 领取/重置每日免费金币
export function grantDailyCoins() {
  fishingStore.coins = INITIAL_COINS
}

// 游戏结束/退出后把引擎剩余金币同步回余额
export function syncCoins(v) {
  fishingStore.coins = Math.max(0, Math.floor(v))
}

export function setLastResult(result) {
  fishingStore.lastResult = result
}
