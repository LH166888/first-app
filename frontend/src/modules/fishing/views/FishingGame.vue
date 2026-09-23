<template>
  <div class="fishing-game">
    <div class="game-hud">
      <div class="hud-left">
        <div class="hud-item">
          <span class="label">金币:</span>
          <span class="value">{{ sessionCoins }}</span>
        </div>
        <div class="hud-item">
          <span class="label">分数:</span>
          <span class="value">{{ currentScore }}</span>
        </div>
      </div>
      <div class="hud-center">
        <span class="title">怀旧捕鱼机</span>
      </div>
      <div class="hud-right">
        <div class="hud-item">
          <span class="label">炮倍:</span>
          <span class="value">{{ cannonMultiplier }}×</span>
        </div>
        <button class="exit-btn" @click="exitGame">退出</button>
      </div>
    </div>

    <div class="game-canvas-container">
      <canvas
        ref="gameCanvas"
        class="game-canvas"
        :width="canvasWidth"
        :height="canvasHeight"
      ></canvas>
    </div>

    <div class="game-controls">
      <button class="control-btn" @click="changeMultiplier(-1)">炮倍-</button>
      <div class="multiplier-display">
        <span>{{ cannonMultiplier }}×</span>
      </div>
      <button class="control-btn" @click="changeMultiplier(1)">炮倍+</button>
    </div>

    <!-- Result Modal -->
    <div v-if="showResult" class="result-modal">
      <div class="result-card">
        <h2>游戏结束</h2>
        <div class="result-stats">
          <div class="stat">
            <span class="label">最终分数</span>
            <span class="value">{{ currentScore }}</span>
          </div>
          <div class="stat">
            <span class="label">捕获鱼数</span>
            <span class="value">{{ stats.fishCaught }}</span>
          </div>
          <div class="stat">
            <span class="label">排名</span>
            <span class="value">#{{ playerRank || '新' }}</span>
          </div>
        </div>
        <div class="result-buttons">
          <button class="btn btn-primary" @click="playAgain">再来一局</button>
          <button class="btn btn-secondary" @click="backToLobby">回到大厅</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { fishingStore, resetGameSession, updatePlayerCoins, addScore } from '../store'
import { submitScore } from '../api/leaderboard'

const router = useRouter()
const gameCanvas = ref(null)
const canvasWidth = ref(1200)
const canvasHeight = ref(600)

const sessionCoins = ref(fishingStore.gameConfig.sessionCoins)
const currentScore = ref(0)
const cannonMultiplier = ref(1)
const showResult = ref(false)
const stats = ref({ fishCaught: 0, bulletsShot: 0, maxCombo: 0 })
const playerRank = ref(null)

let gameEngine = null
let animationFrameId = null

onMounted(() => {
  // Initialize game engine here
  // This is a placeholder - actual implementation in AI-9 task
  console.log('Game initialized with canvas:', gameCanvas.value)
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})

const changeMultiplier = (delta) => {
  const multipliers = [1, 2, 5, 10]
  const currentIndex = multipliers.indexOf(cannonMultiplier.value)
  const newIndex = Math.max(0, Math.min(multipliers.length - 1, currentIndex + delta))
  cannonMultiplier.value = multipliers[newIndex]
}

const exitGame = async () => {
  if (confirm('确定要退出游戏吗？')) {
    await submitGameResult()
    router.push('/games/fishing')
  }
}

const playAgain = () => {
  resetGameSession()
  showResult.value = false
}

const backToLobby = () => {
  router.push('/games/fishing')
}

const submitGameResult = async () => {
  try {
    const result = await submitScore({
      score: currentScore.value,
      coinsWon: stats.value.fishCaught * 10, // Simplified calculation
      fishCaught: stats.value.fishCaught,
      bulletsShot: stats.value.bulletsShot
    })
    playerRank.value = result.rank
  } catch (e) {
    console.error('Failed to submit score:', e)
  }
}
</script>

<style scoped>
.fishing-game {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #0a1a3a, #04305c);
  display: flex;
  flex-direction: column;
  color: #fff;
  font-family: 'Courier New', monospace;
}

.game-hud {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 2px solid #ffcf40;
}

.hud-left,
.hud-right {
  display: flex;
  gap: 20px;
}

.hud-center {
  flex: 1;
  text-align: center;
  font-size: 1.5em;
  color: #ffcf40;
  font-weight: bold;
}

.hud-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.label {
  color: #aaa;
  font-size: 0.9em;
}

.value {
  color: #ffcf40;
  font-weight: bold;
  font-size: 1.1em;
}

.exit-btn {
  padding: 5px 15px;
  background: #ff4444;
  border: none;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.game-canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.game-canvas {
  border: 3px solid #ffcf40;
  background: #000;
  max-width: 100%;
  max-height: 100%;
}

.game-controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.4);
  border-top: 2px solid #ffcf40;
}

.control-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #ff6b35, #ff4500);
  border: none;
  color: #fff;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:hover {
  transform: scale(1.05);
}

.multiplier-display {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  font-size: 1.3em;
  color: #ffcf40;
  font-weight: bold;
}

/* Result Modal */
.result-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.result-card {
  background: linear-gradient(135deg, #0a1a3a, #04305c);
  border: 3px solid #ffcf40;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  min-width: 300px;
}

.result-card h2 {
  color: #ffcf40;
  margin: 0 0 20px 0;
  font-size: 1.8em;
}

.result-stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  margin: 20px 0;
}

.stat {
  background: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat .label {
  color: #aaa;
}

.stat .value {
  color: #ffcf40;
  font-size: 1.3em;
  font-weight: bold;
}

.result-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #ffcf40, #ff9500);
  color: #000;
}

.btn-secondary {
  background: rgba(255, 207, 64, 0.2);
  color: #ffcf40;
  border: 2px solid #ffcf40;
}

.btn:hover {
  transform: scale(1.05);
}
</style>
