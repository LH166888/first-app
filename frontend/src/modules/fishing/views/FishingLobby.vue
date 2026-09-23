<template>
  <div class="fishing-lobby">
    <div class="lobby-container">
      <h1>怀旧捕鱼机</h1>

      <div class="preview-section">
        <!-- Game preview GIF/static image placeholder -->
        <div class="game-preview">游戏预览</div>
      </div>

      <div class="stats-section">
        <div class="stat-card">
          <div class="stat-label">我的金币</div>
          <div class="stat-value">{{ playerCoins }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">最高分</div>
          <div class="stat-value">{{ playerBestScore }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">排行</div>
          <div class="stat-value">{{ playerRank || '无' }}</div>
        </div>
      </div>

      <button class="start-btn" @click="startGame">开始游戏</button>

      <div class="leaderboard-section">
        <h3>本周排行榜</h3>
        <div class="leaderboard-list">
          <!-- Leaderboard will be populated here -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fishingStore, resetGameSession } from '../store'
import { getLeaderboard, getPlayerStats } from '../api/leaderboard'

const router = useRouter()
const playerCoins = ref(0)
const playerBestScore = ref(0)
const playerRank = ref(null)

onMounted(async () => {
  playerCoins.value = fishingStore.playerCoins
  try {
    const stats = await getPlayerStats()
    playerBestScore.value = stats.best_score || 0
    playerRank.value = stats.rank || null
  } catch (e) {
    console.error('Failed to load player stats:', e)
  }
})

const startGame = () => {
  resetGameSession()
  router.push('/games/fishing/play')
}
</script>

<style scoped>
.fishing-lobby {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a1a3a, #04305c);
  color: #fff;
  padding: 20px;
}

.lobby-container {
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  font-family: 'LED', monospace;
  font-size: 2.5em;
  margin: 20px 0;
  text-shadow: 0 0 10px rgba(255, 207, 64, 0.5);
}

.preview-section {
  margin: 30px 0;
}

.game-preview {
  width: 100%;
  aspect-ratio: 16/9;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #ffcf40;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #ffcf40;
  font-size: 1.2em;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin: 30px 0;
}

.stat-card {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #ffcf40;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 0.9em;
  color: #aaa;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.8em;
  color: #ffcf40;
  font-family: 'LED', monospace;
  font-weight: bold;
}

.start-btn {
  width: 100%;
  padding: 15px;
  margin: 20px 0;
  font-size: 1.2em;
  background: linear-gradient(135deg, #ffcf40, #ff9500);
  color: #000;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.start-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(255, 207, 64, 0.6);
}

.leaderboard-section {
  margin-top: 30px;
}

.leaderboard-section h3 {
  margin: 15px 0;
  color: #ffcf40;
}

.leaderboard-list {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #ffcf40;
  padding: 10px;
  border-radius: 8px;
  min-height: 200px;
}
</style>
