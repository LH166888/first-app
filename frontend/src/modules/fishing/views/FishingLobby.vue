<template>
  <div class="lobby">
    <div class="lobby-inner">
      <h1 class="title">怀旧捕鱼机</h1>
      <p class="subtitle">经典街机手感 · 瞄准开炮 · 吐分上榜</p>

      <!-- 预览 -->
      <div class="preview">
        <span class="fish f1">🐠</span>
        <span class="fish f2">🐟</span>
        <span class="fish f3">🐡</span>
        <span class="fish f4">🦈</span>
        <div class="preview-cannon">🔫</div>
      </div>

      <!-- 我的数据 -->
      <div class="stats">
        <div class="stat">
          <div class="label">我的金币</div>
          <div class="value gold">{{ fishingStore.coins }}</div>
        </div>
        <div class="stat">
          <div class="label">最高净分</div>
          <div class="value">{{ fishingStore.bestScore }}</div>
        </div>
        <div class="stat">
          <div class="label">我的排名</div>
          <div class="value">{{ fishingStore.rank ? '#' + fishingStore.rank : '未上榜' }}</div>
        </div>
      </div>

      <button class="start-btn" @click="startGame">
        {{ fishingStore.coins > 0 ? '开始游戏' : '领取金币并开始' }}
      </button>
      <p v-if="!isLoggedIn" class="hint">登录后成绩可保存并参与排行榜</p>

      <Leaderboard
        class="lb"
        :list="fishingStore.leaderboard"
        :current-rank="fishingStore.rank"
        :total-players="fishingStore.totalPlayers"
        :loading="loading"
      />
    </div>

    <GuidingOverlay v-if="showGuide" @close="onGuideClose" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { store as userStore } from '@/shared/store'
import Leaderboard from '../components/Leaderboard.vue'
import GuidingOverlay from '../components/GuidingOverlay.vue'
import { fishingStore, grantDailyCoins, markGuideSeen } from '../store'
import { getLeaderboard, getPlayerStats } from '../api/leaderboard'

const router = useRouter()
const loading = ref(true)
const showGuide = ref(!fishingStore.guideSeen)
const isLoggedIn = computed(() => !!userStore.user)

onMounted(async () => {
  if (isLoggedIn.value) {
    try {
      const [stats, lb] = await Promise.all([getPlayerStats(), getLeaderboard()])
      fishingStore.bestScore = stats.highestScore
      fishingStore.leaderboard = lb.list
      fishingStore.rank = lb.currentRank
      fishingStore.totalPlayers = lb.totalPlayers
    } catch {
      /* 拉取失败（未登录/网络）保持默认空态 */
    }
  }
  loading.value = false
})

function onGuideClose() {
  showGuide.value = false
  markGuideSeen()
}

function startGame() {
  if (fishingStore.coins <= 0) grantDailyCoins()
  router.push('/games/fishing/play')
}
</script>

<style scoped>
.lobby {
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #0a1a3a, #04305c 60%, #012349);
  color: #e8eef4;
  padding: 24px 16px 48px;
}
.lobby-inner {
  max-width: 640px;
  margin: 0 auto;
}
.title {
  text-align: center;
  font-size: 2.4rem;
  margin: 8px 0 4px;
  color: #ffcf40;
  text-shadow: 0 0 16px rgba(255, 207, 64, 0.5);
  letter-spacing: 2px;
}
.subtitle {
  text-align: center;
  color: #9fb3c8;
  margin: 0 0 20px;
}
.preview {
  position: relative;
  height: 180px;
  border: 2px solid #ffcf40;
  border-radius: 14px;
  overflow: hidden;
  background: radial-gradient(circle at 50% -20%, rgba(120, 200, 255, 0.25), transparent 60%),
    linear-gradient(#012349, #000814);
  margin-bottom: 22px;
}
.fish {
  position: absolute;
  font-size: 2rem;
  animation: swim 9s linear infinite;
}
.f1 { top: 20%; animation-duration: 8s; }
.f2 { top: 45%; animation-duration: 11s; animation-delay: -3s; }
.f3 { top: 65%; animation-duration: 7s; animation-delay: -5s; }
.f4 { top: 35%; font-size: 2.6rem; animation-duration: 13s; animation-delay: -2s; }
@keyframes swim {
  from { left: -12%; transform: scaleX(1); }
  to { left: 112%; transform: scaleX(1); }
}
.preview-cannon {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 2rem;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}
.stat {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 207, 64, 0.6);
  border-radius: 12px;
  padding: 14px 8px;
  text-align: center;
}
.stat .label {
  font-size: 0.8rem;
  color: #9fb3c8;
  margin-bottom: 6px;
}
.stat .value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffd166;
  font-family: 'Courier New', monospace;
}
.stat .value.gold {
  color: #ffe066;
}
.start-btn {
  display: block;
  width: 100%;
  padding: 15px;
  font-size: 1.2rem;
  font-weight: 700;
  color: #04305c;
  background: linear-gradient(135deg, #ffe066, #ff9500);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 207, 64, 0.4);
}
.hint {
  text-align: center;
  color: #9fb3c8;
  font-size: 0.85rem;
  margin: 10px 0 0;
}
.lb {
  margin-top: 26px;
}
</style>
