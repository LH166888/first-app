import CarLayout from './CarLayout.vue'

// 车榜模块路由：/cars 挂子布局，子路由为榜单/对比/收藏/详情。
// 子路由顺序讲究：静态路径(compare/favorites)必须排在动态 :id 之前，否则会被 :id 吞掉。
export default [
  {
    path: '/cars',
    component: CarLayout,
    meta: { module: { label: '车榜', mark: '🚗', to: '/cars' } },
    children: [
      {
        path: '',
        name: 'car-ranking',
        component: () => import('./views/RankingView.vue'),
      },
      {
        path: 'compare',
        name: 'car-compare',
        component: () => import('./views/CompareView.vue'),
      },
      {
        path: 'favorites',
        name: 'car-favorites',
        component: () => import('./views/FavoritesView.vue'),
      },
      {
        path: ':id',
        name: 'car-detail',
        component: () => import('./views/CarDetailView.vue'),
      },
    ],
  },

  // 兼容旧链接：车榜从根路径下沉到 /cars 后，旧的分享链接/Analytics 记录仍需可用
  { path: '/car/:id', redirect: (to) => `/cars/${to.params.id}` },
  { path: '/compare', redirect: '/cars/compare' },
  { path: '/favorites', redirect: '/cars/favorites' },
]
