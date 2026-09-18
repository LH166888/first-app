import client from './client'

// 我的收藏（需登录）。后端返回 { data: [车型完整信息], ids: [car_id] }
export async function listFavorites() {
  const res = await client.get('/favorites')
  return res.data
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
