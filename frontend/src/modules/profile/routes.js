// 个人信息模块路由：独立页面 /profile，需登录访问。
// 点击顶栏用户名进入，可查看账号、修改昵称与密码。
export default [
  {
    path: '/profile',
    name: 'profile',
    component: () => import('./ProfileView.vue'),
    meta: { requiresAuth: true },
  },
]
