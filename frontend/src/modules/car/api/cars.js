import client from '../../../shared/api/client'
import { fetchAllPages } from '../../../shared/api/pagination'

// 车型列表。params 可含 { energy, level, brand, keyword }，后端默认按销量降序。
// 后端已改为统一分页信封 { data, meta }，这里翻页取全量后返回车型数组
// （榜单需完整数据做客户端筛选、图表与名次计算）。
export async function listCars(params = {}) {
  const { items } = await fetchAllPages('/cars', params)
  return items
}

// 车型详情。后端返回 { data: car }，不存在则 404（axios 会抛错）。
export async function getCar(id) {
  const res = await client.get(`/cars/${id}`)
  return res.data.data
}
