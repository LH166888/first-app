import FishingLayout from './FishingLayout.vue'
import FishingLobby from './views/FishingLobby.vue'
import FishingGame from './views/FishingGame.vue'
import FishingResult from './views/FishingResult.vue'

// 捕鱼模块路由：/games/fishing 挂子布局，子路由为大厅/游戏/结算。
// 不设 requiresAuth——未登录也可试玩（客户端每日免费金币），仅成绩上报需登录且静默降级。
export default [
  {
    path: '/games/fishing',
    component: FishingLayout,
    meta: { module: { label: '捕鱼机', mark: '🎣', to: '/games/fishing' } },
    children: [
      {
        path: '',
        name: 'fishing-lobby',
        component: FishingLobby,
        meta: { title: '怀旧捕鱼机' },
      },
      {
        path: 'play',
        name: 'fishing-play',
        component: FishingGame,
        meta: { title: '捕鱼中' },
      },
      {
        path: 'result',
        name: 'fishing-result',
        component: FishingResult,
        meta: { title: '结算' },
      },
    ],
  },
]
