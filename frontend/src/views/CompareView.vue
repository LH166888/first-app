<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import CarThumb from '../components/CarThumb.vue'
import { ENERGY_LABEL } from '../data/constants'
import { store } from '../store'

const router = useRouter()

const list = computed(() =>
  store.compareIds.map((id) => store.getCachedCar(id)).filter(Boolean)
)

// 收集所有配置项（并集，保持首个车型顺序优先）
const keys = computed(() => {
  const set = []
  for (const c of list.value) {
    for (const k of Object.keys(c.config)) if (!set.includes(k)) set.push(k)
  }
  return set
})

function priceText(c) {
  const [a, b] = c.price
  return a === b ? `${a} 万` : `${a}-${b} 万`
}
// 某一行的值是否全部相同（相同则不高亮）
function allSame(k) {
  const vals = list.value.map((c) => c.config[k] ?? '—')
  return vals.every((v) => v === vals[0])
}
</script>

<template>
  <div class="container page">
    <div class="topline">
      <h1>车型对比</h1>
      <button class="btn ghost" @click="router.push('/')">← 返回榜单</button>
    </div>

    <div v-if="list.length < 2" class="card empty">
      请至少选择 2 款车型进行对比。<br />
      在榜单中点击车型右侧的 <b>⇄</b> 按钮加入对比。
    </div>

    <div v-else class="table-wrap">
      <table class="cmp">
        <thead>
          <tr>
            <th class="corner">对比项</th>
            <th v-for="c in list" :key="c.id">
              <div class="col-head">
                <CarThumb :car="c" :size="56" />
                <router-link :to="{ name: 'car', params: { id: c.id } }" class="cname">
                  {{ c.name }}
                </router-link>
                <span class="badge" :class="c.energy">{{ ENERGY_LABEL[c.energy] }}</span>
                <button class="rm" @click="store.toggleCompare(c.id)">移除</button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr class="hl-row">
            <td class="k">官方指导价</td>
            <td v-for="c in list" :key="c.id" class="accent">{{ priceText(c) }}</td>
          </tr>
          <tr class="hl-row">
            <td class="k">年销量</td>
            <td v-for="c in list" :key="c.id">{{ c.sales.toLocaleString() }} 辆</td>
          </tr>
          <tr class="hl-row">
            <td class="k">级别</td>
            <td v-for="c in list" :key="c.id">{{ c.level }}</td>
          </tr>
          <tr v-for="k in keys" :key="k" :class="{ diff: !allSame(k) }">
            <td class="k">{{ k }}</td>
            <td v-for="c in list" :key="c.id">{{ c.config[k] ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
      <p class="tip">💡 黄色高亮行表示各车型存在差异。</p>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 24px 20px 60px;
}
.topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.topline h1 {
  margin: 0;
  font-size: 26px;
}
.empty {
  padding: 48px;
  text-align: center;
  color: var(--text-dim);
  line-height: 1.9;
}
.empty b {
  color: var(--accent-2);
}
.table-wrap {
  overflow-x: auto;
}
.cmp {
  width: 100%;
  border-collapse: collapse;
  min-width: 560px;
}
.cmp th,
.cmp td {
  border: 1px solid var(--border);
  padding: 12px 14px;
  text-align: left;
  font-size: 14px;
}
.corner {
  background: var(--panel-2);
  width: 150px;
}
.col-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.cname {
  font-size: 15px;
  font-weight: 700;
}
.cname:hover {
  color: var(--accent);
}
.rm {
  border: none;
  background: transparent;
  color: var(--text-mute);
  font-size: 12px;
  padding: 0;
}
.rm:hover {
  color: var(--danger);
}
.k {
  color: var(--text-dim);
  background: var(--panel-2);
  font-weight: 600;
}
.accent {
  color: var(--accent);
  font-weight: 700;
}
.hl-row td:not(.k) {
  font-weight: 600;
}
tr.diff td:not(.k) {
  background: rgba(255, 209, 102, 0.08);
}
.tip {
  color: var(--text-mute);
  font-size: 13px;
  margin-top: 14px;
}
</style>
