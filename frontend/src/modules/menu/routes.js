import MenuLayout from './MenuLayout.vue'

// 菜单模块路由：全部挂在 /menu 子布局下（含点单明细，保证顶部横向导航栏一致）。
// 整个菜单模块需登录访问（meta.requiresAuth 在 MenuLayout 上设一次，子路由继承）。
//
// 注意：静态路径（discover / user / orders）必须排在动态 :id 之前，
// 否则会被 :id（菜品详情）捕获。
export default [
  {
    path: '/menu',
    component: MenuLayout,
    meta: { requiresAuth: true, module: { label: '菜单', mark: '🍽️', to: '/menu' } },
    children: [
      {
        path: '',
        name: 'menu-list',
        component: () => import('./views/MyMenusView.vue'),
      },
      {
        path: 'create',
        name: 'menu-create',
        component: () => import('./views/MenuCreateView.vue'),
      },
      {
        path: 'discover',
        name: 'menu-discover',
        component: () => import('./views/MenuDiscoverView.vue'),
      },
      {
        // 某个用户的菜单（发现页点进某人后，可加菜品进购物车点单）
        path: 'user/:userId',
        name: 'menu-user',
        component: () => import('./views/UserDishesView.vue'),
      },
      {
        // 点单明细（我收到的 / 我下的）
        path: 'orders',
        name: 'menu-orders',
        component: () => import('./views/OrdersView.vue'),
      },
      {
        // 单次点单详情（含点菜人添加的菜品）
        path: 'orders/:id',
        name: 'menu-order-detail',
        component: () => import('./views/OrderDetailView.vue'),
      },
      {
        // 菜品详情（动态段，放最后兜底）
        path: ':id',
        name: 'menu-detail',
        component: () => import('./views/MenuDetailView.vue'),
      },
    ],
  },
]
