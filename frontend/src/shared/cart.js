import { reactive, computed } from 'vue'

// 购物车（全局单例）：一次点单 = 给同一个用户点多个菜品。
// 约束：购物车只能绑定一个目标用户；想加别人的菜品时需先清空/提交。
//
// 数据结构：
//   cart.targetUserId   当前购物车点给谁（null = 空车）
//   cart.targetUserName 目标用户名（展示用）
//   cart.items          [{ id, name, image_key }]

const cart = reactive({
  targetUserId: null,
  targetUserName: '',
  items: [],
})

const isEmpty = computed(() => cart.items.length === 0)
const count = computed(() => cart.items.length)

function has(dishId) {
  return cart.items.some((it) => it.id === dishId)
}

// 加入购物车。targetUser = { id, name }。
// 若购物车已绑定到别的用户，返回 false（调用方提示先清空）。
function add(dish, targetUser) {
  if (cart.targetUserId !== null && cart.targetUserId !== targetUser.id) {
    return false
  }
  cart.targetUserId = targetUser.id
  cart.targetUserName = targetUser.name
  if (!has(dish.id)) {
    cart.items.push({ id: dish.id, name: dish.name, image_key: dish.image_key })
  }
  return true
}

function remove(dishId) {
  const idx = cart.items.findIndex((it) => it.id === dishId)
  if (idx >= 0) cart.items.splice(idx, 1)
  if (cart.items.length === 0) {
    cart.targetUserId = null
    cart.targetUserName = ''
  }
}

function clear() {
  cart.items.splice(0, cart.items.length)
  cart.targetUserId = null
  cart.targetUserName = ''
}

export function useCart() {
  return { cart, isEmpty, count, add, remove, clear, has }
}
