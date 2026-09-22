import { reactive, computed } from 'vue'
import { store as userStore } from '../../shared/store'
import * as favApi from './api/favorites'

// 车榜模块局部状态：收藏、对比、车型缓存。
// 与全局用户态解耦——只读 userStore.user 判断登录，登录/登出通过事件联动（见文件底部）。
export const store = reactive({
  // 收藏的车型 id 列表（登录后从后端拉取；未登录为空）
  favorites: [],
  // 对比栏中选中的车型 id 列表（纯前端本地状态，不入库）
  compareIds: [],
  // 按 id 缓存的车型对象，供对比栏/收藏页等按 id 取车（首次拉列表后填充）
  carsById: {},
  // 全量车型列表缓存（仅在拉到完整榜单时填充，用于详情页复用名次计算，避免重复请求）
  carList: [],

  // ---- 车型缓存 ----
  cacheCars(list) {
    for (const c of list) this.carsById[c.id] = c
  },
  // 缓存完整榜单列表（区别于 cacheCars：这表示"已拥有全量数据"）
  cacheCarList(list) {
    this.carList = list
  },
  getCachedCar(id) {
    return this.carsById[id] || null
  },

  // ---- 收藏 ----
  isFavorite(id) {
    return this.favorites.includes(id)
  },
  async toggleFavorite(id) {
    if (!userStore.user) return { needLogin: true }
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
    if (!userStore.user) return
    try {
      const { data, ids } = await favApi.listFavorites()
      this.favorites = ids || (data || []).map((c) => c.id)
      if (data) this.cacheCars(data)
    } catch {
      this.favorites = []
    }
  },
  clearFavorites() {
    this.favorites = []
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
})

export const favoriteCount = computed(() => store.favorites.length)
export const compareCount = computed(() => store.compareIds.length)

// 登录/登出联动：登录后拉取收藏，登出后清空（事件由 shared/store.js 派发）
window.addEventListener('auth:login', () => store.loadFavorites())
window.addEventListener('auth:logout', () => store.clearFavorites())

// 启动时若已登录（本模块首次被加载即触发），恢复收藏列表
if (userStore.user && userStore.token) {
  store.loadFavorites()
}
