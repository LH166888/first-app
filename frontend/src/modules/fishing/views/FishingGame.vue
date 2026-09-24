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

    <!-- 手机竖屏引导：提示旋转横屏（游戏此时已自动暂停） -->
    <div v-if="showRotate" class="rotate-overlay">
      <div class="rotate-icon">📱</div>
      <p class="rotate-text">请横屏使用</p>
      <p class="rotate-sub">旋转手机以获得最佳游戏体验</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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

// ---- 手机横竖屏 ----
const isMobile = ref(false)
const isPortrait = ref(false)
// 手机端且竖屏时，提示旋转横屏并遮住游戏
const showRotate = computed(() => isMobile.value && isPortrait.value)
let autoPausedByOrientation = false // 因竖屏自动暂停（区别于用户手动暂停）
let mqPortrait = null
let mqCoarse = null

function updateOrientation() {
  isMobile.value = mqCoarse ? mqCoarse.matches : false
  isPortrait.value = mqPortrait ? mqPortrait.matches : false
  if (showRotate.value) {
    // 进入竖屏：若非用户手动暂停，则自动暂停引擎，避免遮挡时白白消耗金币
    if (!paused.value && !autoPausedByOrientation) {
      canvasRef.value?.pause()
      autoPausedByOrientation = true
    }
  } else if (autoPausedByOrientation) {
    // 回到横屏：恢复之前的自动暂停
    canvasRef.value?.resume()
    autoPausedByOrientation = false
  }
}

onMounted(() => {
  // 子组件 GameCanvas 已挂载，引擎就绪，直接开局
  canvasRef.value.start(fishingStore.coins)
  // 开局后再判断朝向，竖屏则立即自动暂停
  mqPortrait = window.matchMedia('(orientation: portrait)')
  mqCoarse = window.matchMedia('(pointer: coarse)')
  mqPortrait.addEventListener('change', updateOrientation)
  updateOrientation()
})

onBeforeUnmount(() => {
  if (mqPortrait) mqPortrait.removeEventListener('change', updateOrientation)
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

/* 手机竖屏旋转引导层 */
.rotate-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  background: #000814;
  color: #ffd166;
}
.rotate-icon {
  font-size: 64px;
  animation: rotate-hint 1.8s ease-in-out infinite;
}
.rotate-text {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
}
.rotate-sub {
  margin: 0;
  font-size: 0.9rem;
  color: #9fb3c8;
}
@keyframes rotate-hint {
  0%, 45% { transform: rotate(0deg); }
  65%, 100% { transform: rotate(-90deg); }
}

/* 手机端（触屏设备）：游戏页占满整屏，避免平台顶栏抢占高度 */
@media (pointer: coarse) {
  .fishing-game {
    position: fixed;
    inset: 0;
    z-index: 100;
    min-height: 0;
    height: 100vh;
    height: 100dvh;
  }
}
</style>
