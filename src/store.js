import { reactive, computed, watch } from 'vue'
import * as authApi from './api/auth'
import * as favApi from './api/favorites'
import { TOKEN_KEY } from './api/client'

const USER_KEY = 'chebang_user'

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export const store = reactive({
  // 已登录用户（来自后端；用已存 token 恢复会话前先用本地缓存显示）
  user: load(USER_KEY, null),
  // Sanctum token
  token: localStorage.getItem(TOKEN_KEY) || null,
  // 收藏的车型 id 列表（登录后从后端拉取；未登录为空）
  favorites: [],
  // 对比栏中选中的车型 id 列表（纯前端本地状态，不入库）
  compareIds: [],
  // 按 id 缓存的车型对象，供对比栏/收藏页等按 id 取车（首次拉列表后填充）
  carsById: {},

  // ---- 车型缓存 ----
  cacheCars(list) {
    for (const c of list) this.carsById[c.id] = c
  },
  getCachedCar(id) {
    return this.carsById[id] || null
  },

  // ---- 收藏 ----
  isFavorite(id) {
    return this.favorites.includes(id)
  },
  async toggleFavorite(id) {
    if (!this.user) return { needLogin: true }
    const i = this.favorites.indexOf(id)
    const wasFav = i >= 0
    // 乐观更新
    if (wasFav) this.favorites.splice(i, 1)
    else this.favorites.push(id)
    try {
      if (wasFav) await favApi.removeFavorite(id)
      else await favApi.addFavorite(id)
    } catch (e) {
      // 失败回滚
      if (wasFav) this.favorites.push(id)
      else {
        const j = this.favorites.indexOf(id)
        if (j >= 0) this.favorites.splice(j, 1)
      }
      return { needLogin: false, error: e }
    }
    return { needLogin: false }
  },
  async loadFavorites() {
    if (!this.user) return
    try {
      const { data, ids } = await favApi.listFavorites()
      this.favorites = ids || (data || []).map((c) => c.id)
      if (data) this.cacheCars(data)
    } catch {
      this.favorites = []
    }
  },

  // ---- 对比（纯前端本地）----
  inCompare(id) {
    return this.compareIds.includes(id)
  },
  toggleCompare(id) {
    const i = this.compareIds.indexOf(id)
    if (i >= 0) this.compareIds.splice(i, 1)
    else {
      if (this.compareIds.length >= 4) return { full: true }
      this.compareIds.push(id)
    }
    return { full: false }
  },
  clearCompare() {
    this.compareIds = []
  },

  // ---- 认证 ----
  _setAuth(user, token) {
    this.user = user
    this.token = token
    localStorage.setItem(TOKEN_KEY, token)
  },
  async login({ email, password }) {
    const { user, token } = await authApi.login({ email, password })
    this._setAuth(user, token)
    await this.loadFavorites()
    return user
  },
  async register({ name, email, password }) {
    const { user, token } = await authApi.register({ name, email, password })
    this._setAuth(user, token)
    await this.loadFavorites()
    return user
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
    this.favorites = []
    localStorage.removeItem(TOKEN_KEY)
  },
})

export const favoriteCount = computed(() => store.favorites.length)
export const compareCount = computed(() => store.compareIds.length)

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

// 启动时若已有 token，拉取收藏以恢复登录态下的收藏列表
if (store.token && store.user) {
  store.loadFavorites()
}
