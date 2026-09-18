// Mock 数据层：前端先用假数据跑起来，后端接口就绪后替换为真实 API。
//
// 概念模型（重要）：
//   - 菜品 Dish：单独的一道菜（有配料、步骤、作者）。
//   - 菜单：一个用户的全部菜品集合（发现页点进某个用户后看到的列表）。
//   - 点单 Order：一次「购物车提交」——给某个用户点了多个菜品 + 备注，通知对方。
//
// 当前登录用户 = 张三 (id=1)。用户 2/3 = 其他用户，用于测试发现 / 点单。

let nextId = 100

const CURRENT_USER_ID = 1

const users = {
  1: { id: 1, name: '张三' },
  2: { id: 2, name: '李四' },
  3: { id: 3, name: '王五' },
}

// 菜品表：每道菜属于一个用户
const mockDishes = [
  {
    id: 1,
    user_id: 1,
    name: '糖醋里脊',
    image_key: null,
    created_at: '2026-09-15T10:30:00Z',
    ingredients: [
      { name: '猪里脊', amount: '300g' },
      { name: '番茄酱', amount: '3勺' },
      { name: '白糖', amount: '2勺' },
      { name: '醋', amount: '1勺' },
    ],
    steps: [
      { step_number: 1, description: '里脊切块，用料酒和盐腌制15分钟。' },
      { step_number: 2, description: '裹淀粉后下油锅炸至金黄捞出。' },
      { step_number: 3, description: '调糖醋汁（番茄酱+糖+醋+水），烧开后倒入炸好的肉块翻炒均匀。' },
    ],
  },
  {
    id: 2,
    user_id: 2,
    name: '宫保鸡丁',
    image_key: null,
    created_at: '2026-09-16T14:20:00Z',
    ingredients: [
      { name: '鸡胸肉', amount: '250g' },
      { name: '花生米', amount: '50g' },
      { name: '干辣椒', amount: '10个' },
    ],
    steps: [
      { step_number: 1, description: '鸡肉切丁腌制。' },
      { step_number: 2, description: '热油爆香干辣椒，下鸡丁炒熟，加花生米翻炒。' },
    ],
  },
  {
    id: 3,
    user_id: 1,
    name: '番茄炒蛋',
    image_key: null,
    created_at: '2026-09-17T09:00:00Z',
    ingredients: [
      { name: '鸡蛋', amount: '3个' },
      { name: '番茄', amount: '2个' },
    ],
    steps: [
      { step_number: 1, description: '鸡蛋打散炒熟盛出。' },
      { step_number: 2, description: '番茄切块炒出汁，倒入鸡蛋翻炒均匀。' },
    ],
  },
  {
    id: 4,
    user_id: 2,
    name: '麻婆豆腐',
    image_key: null,
    created_at: '2026-09-17T11:00:00Z',
    ingredients: [
      { name: '嫩豆腐', amount: '1盒' },
      { name: '牛肉末', amount: '80g' },
      { name: '豆瓣酱', amount: '2勺' },
    ],
    steps: [
      { step_number: 1, description: '豆腐切块焯水。' },
      { step_number: 2, description: '炒香豆瓣酱和肉末，加水烧开下豆腐，勾芡。' },
    ],
  },
  {
    id: 5,
    user_id: 3,
    name: '可乐鸡翅',
    image_key: null,
    created_at: '2026-09-18T08:00:00Z',
    ingredients: [
      { name: '鸡翅中', amount: '10个' },
      { name: '可乐', amount: '1罐' },
    ],
    steps: [
      { step_number: 1, description: '鸡翅两面煎金黄。' },
      { step_number: 2, description: '倒入可乐没过鸡翅，中小火收汁。' },
    ],
  },
]

// 点单表：一次点单 = 给某人点了多个菜品 + 备注
// { id, from_user_id, to_user_id, note, created_at, items:[{dish_id, dish_name}] }
const mockOrders = [
  {
    id: 1,
    from_user_id: 2,
    to_user_id: 1,
    note: '糖醋汁多放点糖，谢谢！',
    created_at: '2026-09-16T15:00:00Z',
    items: [
      { dish_id: 1, dish_name: '糖醋里脊' },
      { dish_id: 3, dish_name: '番茄炒蛋' },
    ],
  },
  {
    id: 2,
    from_user_id: 3,
    to_user_id: 1,
    note: '',
    created_at: '2026-09-17T10:00:00Z',
    items: [{ dish_id: 1, dish_name: '糖醋里脊' }],
  },
  {
    id: 3,
    from_user_id: 1,
    to_user_id: 2,
    note: '少放辣',
    created_at: '2026-09-17T16:00:00Z',
    items: [
      { dish_id: 2, dish_name: '宫保鸡丁' },
      { dish_id: 4, dish_name: '麻婆豆腐' },
    ],
  },
]

// ---- 工具 ----
function delay(value, ms = 300) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

// ---- 菜品：我的 ----

// 我的菜品列表（当前用户创建的）
export function getMyDishes() {
  const mine = mockDishes.filter((d) => d.user_id === CURRENT_USER_ID)
  return delay({ dishes: mine })
}

// 菜品详情（附带作者信息、是否本人）
export function getDishDetail(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const dish = mockDishes.find((d) => d.id === Number(id))
      if (!dish) {
        reject(new Error('菜品不存在'))
        return
      }
      resolve({
        dish: {
          ...dish,
          user: users[dish.user_id],
          is_owner: dish.user_id === CURRENT_USER_ID,
        },
      })
    }, 300)
  })
}

// 创建菜品
export function createDish({ name, image_key, ingredients, steps }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const dish = {
        id: nextId++,
        user_id: CURRENT_USER_ID,
        name,
        image_key: image_key || null,
        created_at: new Date().toISOString(),
        ingredients: ingredients.map((ing) => ({ name: ing.name, amount: ing.amount })),
        steps: steps.map((step, i) => ({ step_number: i + 1, description: step.description })),
      }
      mockDishes.push(dish)
      resolve({ dish })
    }, 500)
  })
}

// 更新菜品
export function updateDish(id, { name, image_key, ingredients, steps }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const dish = mockDishes.find((d) => d.id === Number(id))
      if (!dish || dish.user_id !== CURRENT_USER_ID) {
        reject(new Error('无权限或菜品不存在'))
        return
      }
      dish.name = name
      dish.image_key = image_key || null
      dish.ingredients = ingredients.map((ing) => ({ name: ing.name, amount: ing.amount }))
      dish.steps = steps.map((step, i) => ({ step_number: i + 1, description: step.description }))
      resolve({ dish })
    }, 500)
  })
}

// 删除菜品
export function deleteDish(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const idx = mockDishes.findIndex((d) => d.id === Number(id))
      if (idx < 0 || mockDishes[idx].user_id !== CURRENT_USER_ID) {
        reject(new Error('无权限或菜品不存在'))
        return
      }
      mockDishes.splice(idx, 1)
      resolve({ message: 'ok' })
    }, 300)
  })
}

// ---- 发现：按用户浏览 ----

// 发现页：列出除自己外、有菜品的用户及其菜品数量
export function getChefs() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const map = {}
      mockDishes.forEach((d) => {
        if (d.user_id === CURRENT_USER_ID) return
        if (!map[d.user_id]) {
          map[d.user_id] = { user: users[d.user_id], dish_count: 0, latest_at: d.created_at }
        }
        map[d.user_id].dish_count++
        if (new Date(d.created_at) > new Date(map[d.user_id].latest_at)) {
          map[d.user_id].latest_at = d.created_at
        }
      })
      const chefs = Object.values(map).sort(
        (a, b) => new Date(b.latest_at) - new Date(a.latest_at)
      )
      resolve({ chefs })
    }, 300)
  })
}

// 某个用户的全部菜品（发现页点进某人后）
export function getUserDishes(userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = users[Number(userId)]
      if (!user) {
        reject(new Error('用户不存在'))
        return
      }
      const dishes = mockDishes
        .filter((d) => d.user_id === Number(userId))
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      resolve({ user, dishes, is_self: Number(userId) === CURRENT_USER_ID })
    }, 300)
  })
}

// ---- 点单：购物车提交 ----

// 提交点单：给 toUserId 点了 dishIds 这些菜品 + 备注
export function placeOrder({ to_user_id, dish_ids, note }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const target = Number(to_user_id)
      if (target === CURRENT_USER_ID) {
        reject(new Error('不能给自己点单'))
        return
      }
      if (!dish_ids || !dish_ids.length) {
        reject(new Error('购物车是空的'))
        return
      }
      const items = []
      for (const did of dish_ids) {
        const dish = mockDishes.find((d) => d.id === Number(did))
        if (!dish) {
          reject(new Error(`菜品 ${did} 不存在`))
          return
        }
        if (dish.user_id !== target) {
          reject(new Error('购物车里的菜品必须来自同一个人'))
          return
        }
        items.push({ dish_id: dish.id, dish_name: dish.name })
      }
      const order = {
        id: nextId++,
        from_user_id: CURRENT_USER_ID,
        to_user_id: target,
        note: note || '',
        created_at: new Date().toISOString(),
        items,
      }
      mockOrders.push(order)
      resolve({ order })
    }, 400)
  })
}

// 点单详情：看这次点单包含哪些菜品
export function getOrderDetail(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const order = mockOrders.find((o) => o.id === Number(id))
      if (!order) {
        reject(new Error('点单记录不存在'))
        return
      }
      resolve({
        order: {
          ...order,
          from_user: users[order.from_user_id],
          to_user: users[order.to_user_id],
        },
      })
    }, 300)
  })
}

// 我收到的点单（别人点我的菜）
export function getReceivedOrders() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const received = mockOrders
        .filter((o) => o.to_user_id === CURRENT_USER_ID)
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((o) => ({
          id: o.id,
          from_user: users[o.from_user_id],
          note: o.note,
          created_at: o.created_at,
          item_count: o.items.length,
        }))
      resolve({ orders: received })
    }, 300)
  })
}

// 我下的点单（我点别人的菜）
export function getPlacedOrders() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const placed = mockOrders
        .filter((o) => o.from_user_id === CURRENT_USER_ID)
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((o) => ({
          id: o.id,
          to_user: users[o.to_user_id],
          note: o.note,
          created_at: o.created_at,
          item_count: o.items.length,
        }))
      resolve({ orders: placed })
    }, 300)
  })
}
