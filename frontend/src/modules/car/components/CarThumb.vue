<script setup>
import { computed } from 'vue'

const props = defineProps({
  car: { type: Object, required: true },
  size: { type: Number, default: 72 },
})

// 依据车型 id 生成稳定的渐变色
const gradient = computed(() => {
  let h = 0
  for (const ch of props.car.id) h = (h * 31 + ch.charCodeAt(0)) % 360
  const h2 = (h + 40) % 360
  return `linear-gradient(135deg, hsl(${h} 70% 22%), hsl(${h2} 60% 14%))`
})
const initial = computed(() => props.car.brand.slice(0, 1))
</script>

<template>
  <div
    class="thumb"
    :style="{ width: size + 'px', height: size + 'px', background: gradient }"
  >
    <span class="mark">{{ initial }}</span>
    <span class="car-emoji">{{ car.level === 'MPV' ? '🚐' : car.level === 'SUV' ? '🚙' : '🚗' }}</span>
  </div>
</template>

<style scoped>
.thumb {
  position: relative;
  border-radius: 12px;
  border: 1px solid var(--border);
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mark {
  position: absolute;
  top: 4px;
  left: 8px;
  font-size: 13px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.55);
}
.car-emoji {
  font-size: 30px;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5));
}
</style>
