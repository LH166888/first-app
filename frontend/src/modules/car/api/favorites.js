import client from '../../../shared/api/client'
import { fetchAllPages } from '../../../shared/api/pagination'

// 我的收藏（需登录）。后端已改为统一分页信封 { data, meta }，这里翻页取全量；
// 收藏 id 全集由完整 data 派生，保证榜单收藏态完整。返回 { data, ids }（沿用原结构）。
export async function listFavorites() {
  const { items } = await fetchAllPages('/favorites')
  return { data: items, ids: items.map((c) => c.id) }
}

// 添加收藏（需登录）。body { car_id }，幂等，返回 201
export async function addFavorite(carId) {
  const res = await client.post('/favorites', { car_id: carId })
  return res.data
}

// 取消收藏（需登录）
export async function removeFavorite(carId) {
  const res = await client.delete(`/favorites/${carId}`)
  return res.data
}
