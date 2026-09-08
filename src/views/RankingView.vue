<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import CarRow from '../components/CarRow.vue'
import ChartCanvas from '../components/ChartCanvas.vue'
import CompareBar from '../components/CompareBar.vue'
import LoginToast from '../components/LoginToast.vue'
import {
  cars,
  YEAR,
  LEVELS,
  ENERGY_TYPES,
  PRICE_RANGES,
  BRANDS,
} from '../data/cars'

const route = useRoute()

const keyword = ref(route.query.q || '')
watch(
  () => route.query.q,
  (q) => (keyword.value = q || '')
)

const energy = ref('all') // all | ev | phev | fuel | new(新能源)
const level = ref('all')
const priceKey = ref('all')
const brand = ref('all')

const toastRef = ref(null)

const filtered = computed(() => {
  return cars
    .filter((c) => {
      if (energy.value === 'new' && c.energy === 'fuel') return false
      if (['ev', 'phev', 'fuel'].includes(energy.value) && c.energy !== energy.value)
        return false
      if (level.value !== 'all' && c.level !== level.value) return false
      if (brand.value !== 'all' && c.brand !== brand.value) return false
      if (priceKey.value !== 'all') {
        const r = PRICE_RANGES.find((p) => p.key === priceKey.value)
        // 价格区间有交集即算命中
        if (!(c.price[0] < r.max && c.price[1] >= r.min)) return false
      }
      if (keyword.value) {
        const kw = keyword.value.toLowerCase()
        if (
          !c.name.toLowerCase().includes(kw) &&
          !c.brand.toLowerCase().includes(kw)
        )
          return false
      }
      return true
    })
    .sort((a, b) => b.sales - a.sales)
})

const maxSales = computed(() => Math.max(...cars.map((c) => c.sales)))

function resetFilters() {
  energy.value = 'all'
  level.value = 'all'
  priceKey.value = 'all'
  brand.value = 'all'
  keyword.value = ''
}

// ---- 市场概览图表 ----
const overviewData = computed(() => {
  let nev = 0
  let fuel = 0
  for (const c of cars) {
    if (c.energy === 'fuel') fuel += c.sales
    else nev += c.sales
  }
  return {
    labels: ['新能源', '燃油'],
    datasets: [
      {
        data: [nev, fuel],
        backgroundColor: ['#00e5ff', '#ffb454'],
        borderColor: '#0f1420',
        borderWidth: 3,
      },
    ],
  }
})
const overviewOptions = {
  cutout: '65%',
  plugins: {
    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.label}：${ctx.parsed.toLocaleString()} 辆`,
      },
    },
  },
}

const topData = computed(() => {
  const top = [...cars].sort((a, b) => b.sales - a.sales).slice(0, 8)
  const colorMap = { ev: '#00e5ff', phev: '#6ee7a8', fuel: '#ffb454' }
  return {
    labels: top.map((c) => c.name.replace(/^.*? /, '')),
    datasets: [
      {
        label: '年销量',
        data: top.map((c) => c.sales),
        backgroundColor: top.map((c) => colorMap[c.energy]),
        borderRadius: 6,
      },
    ],
  }
})
const topOptions = {
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: (ctx) => `${ctx.parsed.x.toLocaleString()} 辆` },
    },
  },
  scales: {
    x: { grid: { color: 'rgba(35,44,64,0.6)' }, ticks: { callback: (v) => v / 10000 + '万' } },
    y: { grid: { display: false } },
  },
}
</script>

<template>
  <div class="container page">
    <!-- 标题区 -->
    <section class="hero">
      <h1>{{ YEAR }} 年度汽车销量排行榜</h1>
      <p>客观呈现新能源与燃油车的年度销量，点击任意车型查看详细配置。</p>
    </section>

    <!-- 市场概览 -->
    <section class="charts">
      <div class="card chart-card">
        <h3>新能源 vs 燃油 · 销量占比</h3>
        <div class="chart-box doughnut">
          <ChartCanvas type="doughnut" :data="overviewData" :options="overviewOptions" />
        </div>
      </div>
      <div class="card chart-card wide">
        <h3>销量 TOP 8 车型</h3>
        <div class="chart-box">
          <ChartCanvas type="bar" :data="topData" :options="topOptions" />
        </div>
      </div>
    </section>

    <!-- 筛选栏 -->
    <section class="card filters">
      <div class="filter-group tabs">
        <button :class="{ on: energy === 'all' }" @click="energy = 'all'">全部</button>
        <button :class="{ on: energy === 'new' }" @click="energy = 'new'">新能源</button>
        <button
          v-for="e in ENERGY_TYPES"
          :key="e.key"
          :class="{ on: energy === e.key }"
          @click="energy = e.key"
        >
          {{ e.label }}
        </button>
      </div>

      <div class="filter-group selects">
        <select v-model="level">
          <option value="all">全部级别</option>
          <option v-for="l in LEVELS" :key="l" :value="l">{{ l }}</option>
        </select>
        <select v-model="priceKey">
          <option value="all">全部价格</option>
          <option v-for="p in PRICE_RANGES" :key="p.key" :value="p.key">{{ p.label }}</option>
        </select>
        <select v-model="brand">
          <option value="all">全部品牌</option>
          <option v-for="b in BRANDS" :key="b" :value="b">{{ b }}</option>
        </select>
        <button class="btn ghost reset" @click="resetFilters">重置</button>
      </div>
    </section>

    <!-- 结果统计 -->
    <div class="result-info">
      共 <b>{{ filtered.length }}</b> 款车型
      <span v-if="keyword">· 关键词「{{ keyword }}」</span>
    </div>

    <!-- 榜单列表 -->
    <section class="list">
      <CarRow
        v-for="(c, i) in filtered"
        :key="c.id"
        :car="c"
        :rank="i + 1"
        :max-sales="maxSales"
        @need-login="toastRef.show()"
      />
      <div v-if="!filtered.length" class="empty card">
        没有符合条件的车型，试试放宽筛选条件～
      </div>
    </section>

    <CompareBar />
    <LoginToast ref="toastRef" />
  </div>
</template>

<style scoped>
.page {
  padding: 28px 20px 40px;
}
.hero h1 {
  margin: 0 0 6px;
  font-size: 30px;
  background: linear-gradient(120deg, #fff, var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero p {
  margin: 0 0 24px;
  color: var(--text-dim);
}

.charts {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
  margin-bottom: 20px;
}
.chart-card {
  padding: 18px 20px;
}
.chart-card h3 {
  margin: 0 0 12px;
  font-size: 15px;
  color: var(--text-dim);
}
.chart-box {
  height: 240px;
}

.filters {
  padding: 16px 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.filter-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.tabs button {
  background: var(--panel-2);
  border: 1px solid var(--border);
  color: var(--text-dim);
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 14px;
  transition: all 0.15s;
}
.tabs button:hover {
  color: var(--text);
}
.tabs button.on {
  background: linear-gradient(120deg, var(--accent), var(--accent-2));
  color: #05121a;
  border-color: transparent;
  font-weight: 700;
}
.selects select {
  background: var(--panel-2);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
}
.selects select:focus {
  border-color: var(--accent);
}
.reset {
  padding: 8px 14px;
}
.result-info {
  color: var(--text-dim);
  font-size: 14px;
  margin-bottom: 12px;
}
.result-info b {
  color: var(--accent);
}
.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.empty {
  padding: 40px;
  text-align: center;
  color: var(--text-mute);
}

@media (max-width: 860px) {
  .charts {
    grid-template-columns: 1fr;
  }
}
</style>
