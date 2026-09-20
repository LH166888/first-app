// 极简内存缓存：用于给「读多写少」的接口加短 TTL 缓存，
// 减少来回切页面时的重复请求（配合手动刷新按钮 force 拉取最新）。
//
// 特性：
// - 纯内存（刷新整页即清空，不做持久化，避免看到过期太久的数据）
// - 每条缓存带 expireAt，读取时惰性判过期
// - 支持按 key 精确清除（写操作后清相关缓���）
//
// 用法见 modules/menu/api/dish.js 的 withCache 封装。

const store = new Map() // key -> { data, expireAt }

// 读缓存：命中且未过期返回 data，否则返回 undefined（区别于合法的 null 数据）。
export function getCache(key) {
  const hit = store.get(key)
  if (!hit) return undefined
  if (Date.now() > hit.expireAt) {
    store.delete(key)
    return undefined
  }
  return hit.data
}

// 写缓存：ttl 单位毫秒。
export function setCache(key, data, ttl) {
  store.set(key, { data, expireAt: Date.now() + ttl })
}

// 清除单条缓存。
export function clearCache(key) {
  store.delete(key)
}

// 清空全部缓存（如退出登录时调用，避免换账号后看到上一个账号的缓存）。
export function clearAllCache() {
  store.clear()
}
