<template>
  <div class="fishing-game">
    <GameHUD
      :coins="coins"
      :score="score"
      :multiplier="multiplier"
      :multipliers="multipliers"
      :paused="paused"
      @set-multiplier="setMultiplier"
      @toggle-pause="togglePause"
      @exit="onExit"
    />

    <div class="stage">
      <GameCanvas
        ref="canvasRef"
        @update="onUpdate"
        @gameover="onGameOver"
        @cannot-afford="onCannotAfford"
      />
      <transition name="fade">
        <div v-if="toast" class="toast">{{ toast }}</div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import config from '../config/games-fishing-config.json'
import GameHUD from '../components/GameHUD.vue'
import GameCanvas from '../components/GameCanvas.vue'
import { fishingStore, syncCoins, setLastResult } from '../store'
import { submitScore } from '../api/leaderboard'

const router = useRouter()
const multipliers = config.cannon_mechanics.multipliers
const maxSessionCoins = config.anti_cheat.max_single_session_coins

const canvasRef = ref(null)
const coins = ref(fishingStore.coins)
const score = ref(0)
const coinsWon = ref(0)
const multiplier = ref(1)
const paused = ref(false)
const stats = ref({ fishCaught: 0, bulletsShot: 0 })
const toast = ref('')
let ending = false
let toastTimer = null

onMounted(() => {
  // 子组件 GameCanvas 已挂载，引擎就绪，直接开局
  canvasRef.value.start(fishingStore.coins)
})

function onUpdate(s) {
  coins.value = s.coins
  score.value = s.score
  coinsWon.value = s.coinsWon
  multiplier.value = s.multiplier
  stats.value = s.stats
}

function setMultiplier(m) {
  canvasRef.value?.setMultiplier(m)
}

function togglePause() {
  canvasRef.value?.togglePause()
  paused.value = !paused.value
}

function onCannotAfford() {
  showToast('金币不足，请降低炮倍')
}

function showToast(msg) {
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1600)
}

async function onGameOver(result) {
  await endSession(result)
}

async function onExit() {
  if (ending) return
  canvasRef.value?.pause()
  paused.value = true
  if (!confirm('退出将结算本局成绩，确定退出？')) {
    canvasRef.value?.resume()
    paused.value = false
    return
  }
  // 手动退出：用当前 HUD 数据结算
  await endSession({
    score: Math.max(0, score.value),
    coinsWon: coinsWon.value,
    coinsLeft: coins.value,
    fishCaught: stats.value.fishCaught,
    bulletsShot: stats.value.bulletsShot,
  })
}

async function endSession(result) {
  if (ending) return
  ending = true

  syncCoins(result.coinsLeft ?? coins.value)

  const clampedScore = Math.min(maxSessionCoins, Math.max(0, result.score))
  const isNewRecord = clampedScore > fishingStore.bestScore
  let rank = null
  let submitError = false

  // 仅在有正净分时上报；未登录/网络错误静默降级
  if (clampedScore > 0) {
    try {
      const res = await submitScore({ score: clampedScore, coinsWon: result.coinsWon })
      rank = res.rank ?? null
    } catch {
      submitError = true
    }
  }

  if (isNewRecord) fishingStore.bestScore = clampedScore
  if (rank != null) fishingStore.rank = rank

  setLastResult({
    score: clampedScore,
    coinsWon: result.coinsWon,
    coinsLeft: result.coinsLeft ?? coins.value,
    fishCaught: result.fishCaught,
    bulletsShot: result.bulletsShot,
    rank,
    isNewRecord,
    submitError,
  })

  router.push('/games/fishing/result')
}
</script>

<style scoped>
.fishing-game {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  background: #000814;
}
.stage {
  flex: 1;
  position: relative;
  min-height: 0;
}
.toast {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(224, 49, 49, 0.92);
  color: #fff;
  padding: 10px 20px;
  border-radius: 999px;
  font-weight: 700;
  z-index: 10;
  pointer-events: none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
