<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CarThumb from '../components/CarThumb.vue'
import ChartCanvas from '../components/ChartCanvas.vue'
import LoginToast from '../components/LoginToast.vue'
import { YEAR, ENERGY_LABEL } from '../data/constants'
import { getCar, listCars } from '../api/cars'
import { store } from '../store'

const route = useRoute()
const router = useRouter()
const toastRef = ref(null)

const car = ref(null)
const loading = ref(true)
// 全量列表仅用于计算销量排名：优先复用榜单页已缓存的全量列表，缓存为空（直进/刷新详情页）时才补拉一次
const allCars = ref([])

async function loadRank() {
  if (store.carList.length) {
    allCars.value = store.carList
    return
  }
  try {
    const list = await listCars()
    allCars.value = list
    store.cacheCars(list)
    store.cacheCarList(list)
  } catch {
    // 拉取失败则不显示名次
  }
}

async function loadCar(id) {
  loading.value = true
  car.value = null
  try {
    car.value = await getCar(id)
    if (car.value) store.cacheCars([car.value])
  } catch {
    car.value = null // 404 或出错 → 显示未找到空态
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  (id) => {
    if (id) loadCar(id)
  },
  { immediate: true }
)

// 复用缓存或按需补拉全量列表用于名次计算
loadRank()

const rank = computed(() => {
  if (!allCars.value.length) return 0
  const sorted = [...allCars.value].sort((a, b) => b.sales - a.sales)
  return sorted.findIndex((c) => c.id === route.params.id) + 1
})
const priceText = computed(() => {
  if (!car.value) return ''
  const [a, b] = car.value.price
  return a === b ? `${a} 万` : `${a}-${b} 万`
})

const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const trendData = computed(() => ({
  labels: months,
  datasets: [
    {
      label: '月销量',
      data: car.value ? car.value.trend : [],
      borderColor: '#00e5ff',
      backgroundColor: 'rgba(0,229,255,0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointBackgroundColor: '#00e5ff',
    },
  ],
}))
const trendOptions = {
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y.toLocaleString()} 辆` } },
  },
  scales: {
    y: { grid: { color: 'rgba(35,44,64,0.6)' }, ticks: { callback: (v) => v / 10000 + '万' } },
    x: { grid: { display: false } },
  },
}

async function onFav() {
  const r = await store.toggleFavorite(car.value.id)
  if (r.needLogin) toastRef.value.show()
}
</script>

<template>
  <div v-if="loading" class="container page">
    <div class="card empty">车型详情加载中…</div>
  </div>

  <div v-else-if="car" class="container page">
    <button class="btn ghost back" @click="router.back()">← 返回</button>

    <section class="card head">
      <CarThumb :car="car" :size="120" />
      <div class="head-info">
        <div class="title-row">
          <h1>{{ car.name }}</h1>
          <span class="badge" :class="car.energy">{{ ENERGY_LABEL[car.energy] }}</span>
          <span class="tag">{{ car.level }}</span>
        </div>
        <div class="brand">{{ car.brand }}</div>
        <div class="stats">
          <div class="stat">
            <div class="v accent">{{ priceText }}</div>
            <div class="k">官方指导价</div>
          </div>
          <div class="stat">
            <div class="v">{{ rank ? 'No.' + rank : '—' }}</div>
            <div class="k">{{ YEAR }} 销量排名</div>
          </div>
          <div class="stat">
            <div class="v">{{ car.sales.toLocaleString() }}</div>
            <div class="k">年销量 / 辆</div>
          </div>
        </div>
        <div class="ops">
          <button class="btn" :class="{ on: store.isFavorite(car.id) }" @click="onFav">
            {{ store.isFavorite(car.id) ? '★ 已收藏' : '☆ 收藏' }}
          </button>
          <button
            class="btn"
            :class="{ on: store.inCompare(car.id) }"
            @click="store.toggleCompare(car.id)"
          >
            ⇄ {{ store.inCompare(car.id) ? '已加入对比' : '加入对比' }}
          </button>
        </div>
      </div>
    </section>

    <div class="grid">
      <section class="card block">
        <h3>📊 {{ YEAR }} 年月度销量走势</h3>
        <div class="chart-box">
          <ChartCanvas type="line" :data="trendData" :options="trendOptions" />
        </div>
      </section>

      <section class="card block">
        <h3>⚙️ 详细配置</h3>
        <table class="config">
          <tbody>
            <tr v-for="(v, k) in car.config" :key="k">
              <td class="k">{{ k }}</td>
              <td class="v">{{ v }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <LoginToast ref="toastRef" />
  </div>

  <div v-else class="container page">
    <div class="card empty">未找到该车型。<router-link to="/">返回榜单</router-link></div>
  </div>
</template>

<style scoped>
.page {
  padding: 24px 20px 60px;
}
.back {
  margin-bottom: 16px;
}
.head {
  display: flex;
  gap: 24px;
  padding: 24px;
  margin-bottom: 20px;
}
.head-info {
  flex: 1;
  min-width: 0;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.title-row h1 {
  margin: 0;
  font-size: 26px;
}
.tag {
  font-size: 12px;
  color: var(--text-dim);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px 8px;
}
.brand {
  color: var(--text-dim);
  margin: 6px 0 18px;
}
.stats {
  display: flex;
  gap: 32px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.stat .v {
  font-size: 22px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.stat .v.accent {
  color: var(--accent);
}
.stat .k {
  font-size: 12px;
  color: var(--text-mute);
}
.ops {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.btn.on {
  border-color: var(--accent);
  color: var(--accent);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.block {
  padding: 20px;
}
.block h3 {
  margin: 0 0 16px;
  font-size: 16px;
}
.chart-box {
  height: 300px;
}
.config {
  width: 100%;
  border-collapse: collapse;
}
.config td {
  padding: 11px 8px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}
.config .k {
  color: var(--text-dim);
  width: 42%;
}
.config .v {
  font-weight: 600;
}
.empty {
  padding: 40px;
  text-align: center;
}
.empty a {
  color: var(--accent);
}
@media (max-width: 860px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .head {
    flex-direction: column;
  }
}
</style>
