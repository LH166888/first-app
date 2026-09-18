// 菜品 API：对接后端 /dishes/* 接口。
// 降级参考：import * as mock from './mockData'
import client from '../../../shared/api/client'

// 我的菜品列表 -> { dishes }
export async function getMyDishes() {
  const res = await client.get('/dishes')
  return res.data
}

// 菜品详情 -> { dish: {..., user, is_owner} }
export async function getDishDetail(id) {
  const res = await client.get(`/dishes/${id}`)
  return res.data
}

// 创建菜品 -> { dish }
export async function createDish(data) {
  const res = await client.post('/dishes', data)
  return res.data
}

// 更新菜品 -> { dish }
export async function updateDish(id, data) {
  const res = await client.put(`/dishes/${id}`, data)
  return res.data
}

// 删除菜品 -> { message }
export async function deleteDish(id) {
  const res = await client.delete(`/dishes/${id}`)
  return res.data
}

// 发现页：有菜品的其他用户列表 -> { chefs }
export async function getChefs() {
  const res = await client.get('/chefs')
  return res.data
}

// 某个用户的全部菜品 -> { user, dishes, is_self }
export async function getUserDishes(userId) {
  const res = await client.get(`/users/${userId}/dishes`)
  return res.data
}
