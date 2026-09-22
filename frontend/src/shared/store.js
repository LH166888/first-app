import { reactive, watch } from 'vue'
import * as authApi from './api/auth'
import { TOKEN_KEY } from './api/client'
import { clearAllCache } from './api/cache'

const USER_KEY = 'chebang_user'

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

// 全局用户态：仅保留跨模块共享的登录信息（user / token）与认证动作。
// 各业务模块的局部状态（如车榜收藏/对比）已下沉到各自模块的 store。
export const store = reactive({
  // 已登录用户（来自后端；用已存 token 恢复会话前先用本地缓存显示）
  user: load(USER_KEY, null),
  // Sanctum token
  token: localStorage.getItem(TOKEN_KEY) || null,

  // ---- 认证 ----
  _setAuth(user, token) {
    this.user = user
    this.token = token
    localStorage.setItem(TOKEN_KEY, token)
    // 通知各模块登录完成（如车榜模块据此拉取收藏），避免 shared 反向依赖业务模块
    window.dispatchEvent(new CustomEvent('auth:login'))
  },
  async login({ account, password }) {
    const { user, token } = await authApi.login({ account, password })
    this._setAuth(user, token)
    return user
  },
  async register({ name, account, password, invite_code }) {
    const { user, token } = await authApi.register({ name, account, password, invite_code })
    this._setAuth(user, token)
    return user
  },
  // 后端更新用户后同步本地 user（如改昵称），token 不变
  setUser(user) {
    this.user = user
  },
  async logout() {
    try {
      if (this.token) await authApi.logout()
    } catch {
      // 忽略登出接口错误，本地照样清理
    }
    this._clearAuth()
  },
  _clearAuth() {
    this.user = null
    this.token = null
    localStorage.removeItem(TOKEN_KEY)
    // 清空接口内存缓存，避免换账号后看到上一个账号的菜单/发现页数据
    clearAllCache()
    // 通知各模块清理登录态相关的局部数据（如车榜收藏）
    window.dispatchEvent(new CustomEvent('auth:logout'))
  },
})

// 持久化 user（token 已在 _setAuth/_clearAuth 中单独写 localStorage）
watch(
  () => store.user,
  (v) => {
    if (v) localStorage.setItem(USER_KEY, JSON.stringify(v))
    else localStorage.removeItem(USER_KEY)
  },
  { deep: true }
)

// token 失效（401）时由 client.js 派发事件，这里统一清理登录态
window.addEventListener('auth:unauthorized', () => {
  store._clearAuth()
})
