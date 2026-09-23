import FishingLayout from './FishingLayout.vue'
import FishingLobby from './views/FishingLobby.vue'
import FishingGame from './views/FishingGame.vue'

export const fishingRoutes = [
  {
    path: '/games/fishing',
    component: FishingLayout,
    children: [
      {
        path: '',
        component: FishingLobby,
        meta: { title: '怀旧捕鱼机' }
      },
      {
        path: 'play',
        component: FishingGame,
        meta: { title: '捕鱼游戏中' }
      }
    ]
  }
]
