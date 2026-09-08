<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({
  type: { type: String, required: true },
  data: { type: Object, required: true },
  options: { type: Object, default: () => ({}) },
})

const canvas = ref(null)
let chart = null

// 深色主题默认样式
Chart.defaults.color = '#8a97ad'
Chart.defaults.font.family = "'Segoe UI', 'Microsoft YaHei', sans-serif"
Chart.defaults.borderColor = 'rgba(35, 44, 64, 0.8)'

function render() {
  if (chart) chart.destroy()
  chart = new Chart(canvas.value, {
    type: props.type,
    data: props.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...props.options,
    },
  })
}

onMounted(render)
watch(() => [props.data, props.options], render, { deep: true })
onBeforeUnmount(() => chart && chart.destroy())
</script>

<template>
  <div class="chart-wrap">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<style scoped>
.chart-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
