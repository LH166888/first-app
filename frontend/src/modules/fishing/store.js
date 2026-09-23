import { reactive } from 'vue'

export const fishingStore = reactive({
  // Game state
  gameState: 'lobby', // 'lobby' | 'playing' | 'result'

  // Player data
  playerCoins: 3000,
  dailyFreeCoins: 3000,
  currentScore: 0,
  totalCoinsWon: 0,

  // Game session
  gameConfig: {
    difficulty: 'normal',
    cannonMultiplier: 1,
    gameStartTime: null,
    sessionCoins: 3000 // coins for this game session
  },

  // Game stats
  stats: {
    fishCaught: 0,
    bulletsShot: 0,
    maxCombo: 0
  },

  // Leaderboard
  leaderboard: [],
  playerRank: null,
  playerBestScore: 0,

  // UI state
  showGuide: true,
  showResult: false
})

export function resetGameSession() {
  fishingStore.currentScore = 0
  fishingStore.totalCoinsWon = 0
  fishingStore.stats = { fishCaught: 0, bulletsShot: 0, maxCombo: 0 }
  fishingStore.gameConfig.gameStartTime = Date.now()
}

export function updatePlayerCoins(delta) {
  fishingStore.playerCoins = Math.max(0, fishingStore.playerCoins + delta)
  fishingStore.gameConfig.sessionCoins = fishingStore.playerCoins
}

export function addScore(points) {
  fishingStore.currentScore += points
  fishingStore.totalCoinsWon += points
}
