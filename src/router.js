import { createRouter, createWebHashHistory } from 'vue-router'
import RankingView from './views/RankingView.vue'

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
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})
