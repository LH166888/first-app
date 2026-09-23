<template>
  <div ref="wrap" class="canvas-wrap">
    <canvas ref="canvas" class="game-canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { FishingGame } from '../engine/game'
import config from '../config/games-fishing-config.json'

const emit = defineEmits(['update', 'gameover', 'cannot-afford'])

const wrap = ref(null)
const canvas = ref(null)
const MULTIPLIERS = config.cannon_mechanics.multipliers

let game = null

function sizeCanvas() {
  if (!wrap.value || !canvas.value) return
  const w = Math.max(320, wrap.value.clientWidth)
  const h = Math.max(240, wrap.value.clientHeight)
  if (game) game.resize(w, h)
  else {
    canvas.value.width = w
    canvas.value.height = h
  }
}

// ---- I/O 绑定：把 DOM 输入翻译成引擎方法调用 ----
function toCanvasPoint(e) {
  const rect = canvas.value.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function onPointerMove(e) {
  if (!game) return
  const p = toCanvasPoint(e)
  game.aimAt(p.x, p.y)
}

function onPointerDown(e) {
  if (!game) return
  const p = toCanvasPoint(e)
  game.aimAt(p.x, p.y)
  game.fire()
}

function cycleMultiplier(dir) {
  if (!game) return
  const cur = game.cannon.multiplier
  const i = MULTIPLIERS.indexOf(cur)
  const next = MULTIPLIERS[Math.min(MULTIPLIERS.length - 1, Math.max(0, i + dir))]
  game.setMultiplier(next)
}

function onKeyDown(e) {
  if (!game) return
  if (e.code === 'Space') {
    e.preventDefault()
    game.fire()
  } else if (e.key === '+' || e.key === '=') {
    cycleMultiplier(1)
  } else if (e.key === '-' || e.key === '_') {
    cycleMultiplier(-1)
  } else if (e.key.toLowerCase() === 'p') {
    game.togglePause()
  }
}

onMounted(() => {
  sizeCanvas()
  game = new FishingGame(canvas.value, {
    onUpdate: (s) => emit('update', s),
    onGameOver: (r) => emit('gameover', r),
    onCannotAfford: () => emit('cannot-afford'),
  })

  canvas.value.addEventListener('pointermove', onPointerMove)
  canvas.value.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', sizeCanvas)
})

onBeforeUnmount(() => {
  if (canvas.value) {
    canvas.value.removeEventListener('pointermove', onPointerMove)
    canvas.value.removeEventListener('pointerdown', onPointerDown)
  }
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('resize', sizeCanvas)
  if (game) {
    game.destroy()
    game = null
  }
})

// 暴露给父组件（游戏页）调用
defineExpose({
  start: (coins) => game && game.start(coins),
  setMultiplier: (m) => game && game.setMultiplier(m),
  pause: () => game && game.pause(),
  resume: () => game && game.resume(),
  togglePause: () => game && game.togglePause(),
})
</script>

<style scoped>
.canvas-wrap {
  width: 100%;
  height: 100%;
  position: relative;
}
.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none; /* 触屏时禁用默认滚动/缩放，保证瞄准 */
  cursor: crosshair;
}
</style>
