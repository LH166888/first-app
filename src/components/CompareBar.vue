<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '../store'

const router = useRouter()
const selected = computed(() =>
  store.compareIds.map((id) => store.getCachedCar(id)).filter(Boolean)
)
function goCompare() {
  if (selected.value.length >= 2) router.push({ name: 'compare' })
}
</script>

<template>
  <transition name="slide">
    <div v-if="selected.length" class="compare-bar">
      <div class="container inner">
        <div class="chips">
          <span class="label">对比栏</span>
          <span v-for="c in selected" :key="c.id" class="chip">
            {{ c.name }}
            <button @click="store.toggleCompare(c.id)">×</button>
          </span>
        </div>
        <div class="ops">
          <button class="btn ghost" @click="store.clearCompare()">清空</button>
          <button class="btn primary" :disabled="selected.length < 2" @click="goCompare">
            开始对比（{{ selected.length }}/4）
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.compare-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  background: rgba(15, 20, 32, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border);
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.4);
}
.inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
}
.chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.label {
  color: var(--text-dim);
  font-size: 13px;
  font-weight: 600;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 6px 4px 12px;
  font-size: 13px;
}
.chip button {
  border: none;
  background: transparent;
  color: var(--text-mute);
  font-size: 16px;
  line-height: 1;
}
.chip button:hover {
  color: var(--danger);
}
.ops {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateY(100%);
}
@media (max-width: 720px) {
  .inner {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
