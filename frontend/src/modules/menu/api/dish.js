// 菜品 API：对接后端 /dishes/* 接口。
// 降级参考：import * as mock from './mockData'
//
// 缓存策略（E2·TTL 30s）：
//   getMyDishes / getChefs / getUserDishes 这三个「读多写少」接口加 30 秒内存缓存，
//   减少来回切页面的重复请求。传 { force: true } 可跳过缓存强拉最新（手动刷新按钮用）。
//   写操作（create/update/delete）执行后主动清相关缓存，保证自己的改动立即可见。
//   详情页 getDishDetail 不缓存（进详情通常就是想看最新）。
import client from '../../../shared/api/client'
import { getCache, setCache, clearCache } from '../../../shared/api/cache'

const TTL = 30 * 1000 // 30 秒

// 缓存 key 常量，避免拼写漂移。
const KEY_MY_DISHES = 'menu:my-dishes'
const KEY_CHEFS = 'menu:chefs'
const keyUserDishes = (userId) => `menu:user-dishes:${userId}`

// 通用缓存封装：命中未过期直接返回；否则请求、写缓存、返回。
// force=true 时跳过读缓存、但仍回写（刷新后 TTL 重新计时）。
async function withCache(key, fetcher, force = false) {
  if (!force) {
    const cached = getCache(key)
    if (cached !== undefined) return cached
  }
  const data = await fetcher()
  setCache(key, data, TTL)
  return data
}

// 我的菜品列表 -> { dishes }
export async function getMyDishes({ force = false } = {}) {
  return withCache(KEY_MY_DISHES, async () => {
    const res = await client.get('/dishes')
    return res.data
  }, force)
}

// 菜品详情 -> { dish: {..., user, is_owner} }（不缓存）
export async function getDishDetail(id) {
  const res = await client.get(`/dishes/${id}`)
  return res.data
}

// 创建菜品 -> { dish }。清「我的菜单」缓存（新菜要立即出现）。
export async function createDish(data) {
  const res = await client.post('/dishes', data)
  clearCache(KEY_MY_DISHES)
  return res.data
}

// 更新菜品 -> { dish }。清「我的菜单」缓存。
export async function updateDish(id, data) {
  const res = await client.put(`/dishes/${id}`, data)
  clearCache(KEY_MY_DISHES)
  return res.data
}

// 删除菜品 -> { message }。清「我的菜单」缓存。
export async function deleteDish(id) {
  const res = await client.delete(`/dishes/${id}`)
  clearCache(KEY_MY_DISHES)
  return res.data
}

// 发现页：有菜品的其他用户列表 -> { chefs }
export async function getChefs({ force = false } = {}) {
  return withCache(KEY_CHEFS, async () => {
    const res = await client.get('/chefs')
    return res.data
  }, force)
}

// 某个用户的全部菜品 -> { user, dishes, is_self }
export async function getUserDishes(userId, { force = false } = {}) {
  return withCache(keyUserDishes(userId), async () => {
    const res = await client.get(`/users/${userId}/dishes`)
    return res.data
  }, force)
}
