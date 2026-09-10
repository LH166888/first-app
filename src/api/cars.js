import client from './client'

// 车型列表。params 可含 { energy, level, brand, keyword }，后端默认按销量降序。
// 后端返回 { data: [...], total }，这里直接返回车型数组。
export async function listCars(params = {}) {
  const res = await client.get('/cars', { params })
  return res.data.data
}

// 车型详情。后端返回 { data: car }，不存在则 404（axios 会抛错）。
export async function getCar(id) {
  const res = await client.get(`/cars/${id}`)
  return res.data.data
}
