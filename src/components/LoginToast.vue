<script setup>
import { ref } from 'vue'

const visible = ref(false)
let timer = null

function show() {
  visible.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (visible.value = false), 2600)
}
defineExpose({ show })
</script>

<template>
  <transition name="toast">
    <div v-if="visible" class="toast">请先登录后再收藏车型 🔑</div>
  </transition>
</template>

<style scoped>
.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  background: var(--panel-2);
  border: 1px solid var(--accent);
  box-shadow: var(--glow);
  color: var(--text);
  padding: 12px 22px;
  border-radius: 12px;
  font-size: 14px;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -12px);
}
</style>
