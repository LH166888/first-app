// 点单 API：对接后端 /orders/* 接口。
// 一次点单 = 给某个用户点了多个菜品 + 备注（购物车提交）。
// 降级参考：import * as mock from './mockData'
import client from '../../../shared/api/client'
import { fetchAllPages } from '../../../shared/api/pagination'

// 提交点单：{ to_user_id, dish_ids: [], note } -> { order }
export async function placeOrder(payload) {
  const res = await client.post('/orders', payload)
  return res.data
}

// 点单详情（包含哪些菜品 + 备注）-> { order: {..., from_user, to_user} }
export async function getOrderDetail(id) {
  const res = await client.get(`/orders/${id}`)
  return res.data
}

// 我收到的点单 -> { orders }（后端改为分页信封 { data, meta }，翻页取全量后沿用原结构）
export async function getReceivedOrders() {
  const { items } = await fetchAllPages('/orders/received')
  return { orders: items }
}

// 我下的点单 -> { orders }（后端改为分页信封 { data, meta }，翻页取全量后沿用原结构）
export async function getPlacedOrders() {
  const { items } = await fetchAllPages('/orders/placed')
  return { orders: items }
}
