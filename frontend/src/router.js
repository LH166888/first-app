import { createRouter, createWebHashHistory } from 'vue-router'
import RankingView from './views/RankingView.vue'
import { store } from './store'

const routes = [
  { path: '/', name: 'ranking', component: RankingView },
  {
    path: '/car/:id',
    name: 'car',
    component: () => import('./views/CarDetailView.vue'),
  },
  {
    path: '/compare',
    name: 'compare',
    component: () => import('./views/CompareView.vue'),
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('./views/FavoritesView.vue'),
  },
  {
    path: '/tools/idcard',
    name: 'idcard',
    component: () => import('./views/IdCardView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// 需登录路由的守卫：未登录直接弹回首页，并唤起登录弹窗（App.vue 监听此事件）
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !store.user) {
    window.dispatchEvent(new CustomEvent('auth:need-login'))
    return { name: 'ranking' }
  }
})

export default router
