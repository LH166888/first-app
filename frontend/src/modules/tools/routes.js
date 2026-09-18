import ToolsLayout from './ToolsLayout.vue'

// 工具箱模块路由：/tools 挂子布局，列表页 + 各工具子页。
// /tools/idcard 路径与旧版一致，无需 redirect。
export default [
  {
    path: '/tools',
    component: ToolsLayout,
    meta: { module: { label: '工具箱', mark: '🧰', to: '/tools' } },
    children: [
      {
        path: '',
        name: 'tools-list',
        component: () => import('./views/ToolsView.vue'),
      },
      {
        path: 'idcard',
        name: 'tools-idcard',
        component: () => import('./views/IdCardView.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
]
