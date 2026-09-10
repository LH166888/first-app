<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import CarThumb from './CarThumb.vue'
import { store } from '../store'
import { ENERGY_LABEL } from '../data/constants'

const props = defineProps({
  car: { type: Object, required: true },
  rank: { type: Number, required: true },
  maxSales: { type: Number, required: true },
})
const emit = defineEmits(['need-login'])
const router = useRouter()

const barWidth = computed(() => Math.max(6, (props.car.sales / props.maxSales) * 100) + '%')
const priceText = computed(() => {
  const [a, b] = props.car.price
  return a === b ? `${a} 万` : `${a}-${b} 万`
})
const medal = computed(() => ({ 1: 'gold', 2: 'silver', 3: 'bronze' })[props.rank] || '')

function goDetail() {
  router.push({ name: 'car', params: { id: props.car.id } })
}
async function onFav(e) {
  e.stopPropagation()
  const r = await store.toggleFavorite(props.car.id)
  if (r.needLogin) emit('need-login')
}
function onCompare(e) {
  e.stopPropagation()
  store.toggleCompare(props.car.id)
}
</script>

<template>
  <div class="row card" @click="goDetail">
    <div class="rank" :class="medal">{{ rank }}</div>
    <CarThumb :car="car" :size="64" />

    <div class="info">
      <div class="line1">
        <span class="name">{{ car.name }}</span>
        <span class="badge" :class="car.energy">{{ ENERGY_LABEL[car.energy] }}</span>
        <span class="tag">{{ car.level }}</span>
      </div>
      <div class="line2">
        <span class="brand">{{ car.brand }}</span>
        <span class="price">{{ priceText }}</span>
      </div>
      <div class="salesbar">
        <div class="fill" :class="car.energy" :style="{ width: barWidth }"></div>
      </div>
    </div>

    <div class="sales">
      <div class="num">{{ car.sales.toLocaleString() }}</div>
      <div class="unit">年销量 / 辆</div>
    </div>

    <div class="ops" @click.stop>
      <button
        class="icon-btn"
        :class="{ on: store.isFavorite(car.id) }"
        title="收藏"
        @click="onFav"
      >
        {{ store.isFavorite(car.id) ? '★' : '☆' }}
      </button>
      <button
        class="icon-btn compare"
        :class="{ on: store.inCompare(car.id) }"
        title="加入对比"
        @click="onCompare"
      >
        ⇄
      </button>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.row:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}
.rank {
  width: 34px;
  text-align: center;
  font-size: 20px;
  font-weight: 800;
  color: var(--text-mute);
  flex-shrink: 0;
}
.rank.gold {
  color: var(--gold);
  text-shadow: 0 0 12px rgba(255, 209, 102, 0.6);
}
.rank.silver {
  color: var(--silver);
}
.rank.bronze {
  color: var(--bronze);
}
.info {
  flex: 1;
  min-width: 0;
}
.line1 {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.name {
  font-size: 16px;
  font-weight: 700;
}
.tag {
  font-size: 12px;
  color: var(--text-dim);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1px 7px;
}
.line2 {
  display: flex;
  gap: 12px;
  margin: 4px 0 8px;
  font-size: 13px;
}
.brand {
  color: var(--text-dim);
}
.price {
  color: var(--accent);
  font-weight: 600;
}
.salesbar {
  height: 6px;
  background: var(--panel-2);
  border-radius: 6px;
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 6px;
}
.fill.ev {
  background: linear-gradient(90deg, var(--ev), #0090ff);
}
.fill.phev {
  background: linear-gradient(90deg, var(--phev), #29b672);
}
.fill.fuel {
  background: linear-gradient(90deg, var(--fuel), #ff7d45);
}
.sales {
  text-align: right;
  flex-shrink: 0;
  width: 120px;
}
.sales .num {
  font-size: 20px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.sales .unit {
  font-size: 11px;
  color: var(--text-mute);
}
.ops {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}
.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--text-dim);
  font-size: 18px;
  line-height: 1;
  transition: all 0.15s;
}
.icon-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.icon-btn.on {
  color: var(--gold);
  border-color: var(--gold);
}
.icon-btn.compare.on {
  color: var(--accent-2);
  border-color: var(--accent-2);
}

@media (max-width: 720px) {
  .row {
    flex-wrap: wrap;
    gap: 10px 12px;
    padding: 12px 14px;
  }
  .info {
    flex-basis: calc(100% - 64px - 34px - 20px);
  }
  .sales {
    width: auto;
    text-align: left;
    order: 5;
  }
  .sales .num {
    font-size: 16px;
  }
  .ops {
    flex-direction: row;
    margin-left: auto;
    order: 5;
  }
}
</style>
