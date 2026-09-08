import { reactive, computed, watch } from 'vue'

const FAV_KEY = 'chebang_favorites'
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
  // 已登录用户（演示：仅本地存储，无真实后端）
  user: load(USER_KEY, null),
  // 收藏的车型 id 列表
  favorites: load(FAV_KEY, []),
  // 对比栏中选中的车型 id 列表
  compareIds: [],

  isFavorite(id) {
    return this.favorites.includes(id)
  },
  toggleFavorite(id) {
    if (!this.user) return { needLogin: true }
    const i = this.favorites.indexOf(id)
    if (i >= 0) this.favorites.splice(i, 1)
    else this.favorites.push(id)
    return { needLogin: false }
  },

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

  login(name) {
    this.user = { name: name || '车友', since: '2026' }
  },
  logout() {
    this.user = null
  },
})

export const favoriteCount = computed(() => store.favorites.length)
export const compareCount = computed(() => store.compareIds.length)

// 持久化
watch(
  () => store.favorites,
  (v) => localStorage.setItem(FAV_KEY, JSON.stringify(v)),
  { deep: true }
)
watch(
  () => store.user,
  (v) => localStorage.setItem(USER_KEY, JSON.stringify(v)),
  { deep: true }
)
