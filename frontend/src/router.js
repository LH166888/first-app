import { createRouter, createWebHashHistory } from 'vue-router'
import { store } from './shared/store'
import homeRoutes from './modules/home/routes'
import carRoutes from './modules/car/routes'
import toolsRoutes from './modules/tools/routes'
import menuRoutes from './modules/menu/routes'

// 平台外壳只负责汇总各业务模块的路由，模块内部路径与命名由各自 routes.js 决定。
const routes = [...homeRoutes, ...carRoutes, ...toolsRoutes, ...menuRoutes]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// 需登录路由的守卫：未登录弹回门户首页，并唤起登录弹窗（App.vue 监听此事件）
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !store.user) {
    window.dispatchEvent(new CustomEvent('auth:need-login'))
    return { name: 'home' }
  }
})

export default router
