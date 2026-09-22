<script setup>
import { ref, onMounted } from 'vue'
import { getReceivedOrders, getPlacedOrders } from '../api/order'

const tab = ref('received') // received | placed
const received = ref([])
const placed = ref([])
const loading = ref(false)

async function loadReceived() {
  loading.value = true
  try {
    const res = await getReceivedOrders()
    received.value = res.orders || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadPlaced() {
  loading.value = true
  try {
    const res = await getPlacedOrders()
    placed.value = res.orders || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function switchTab(t) {
  tab.value = t
  if (t === 'received') loadReceived()
  else loadPlaced()
}

// 年月日时分秒
function formatDateTime(str) {
  const d = new Date(str)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

onMounted(loadReceived)
</script>

<template>
  <div class="container orders">
    <h1 class="page-title">点单明细</h1>

    <div class="tabs">
      <button
        class="tab"
        :class="{ active: tab === 'received' }"
        @click="switchTab('received')"
      >我收到的</button>
      <button
        class="tab"
        :class="{ active: tab === 'placed' }"
        @click="switchTab('placed')"
      >我下的</button>
    </div>

    <div v-if="loading" class="loading">加载中…</div>

    <!-- 我收到的：XXX点的 备注 时间 -->
    <template v-else-if="tab === 'received'">
      <p v-if="received.length" class="scene-tip">
        这些是朋友们想尝试的菜品，线下约个时间一起做吧！
      </p>
      <div v-if="!received.length" class="empty">
        <div class="empty-icon">🔖</div>
        <p>还没有人点你的菜</p>
      </div>
      <div v-else class="list">
        <router-link
          v-for="order in received"
          :key="order.id"
          :to="{ name: 'menu-order-detail', params: { id: order.id } }"
          class="order-item"
        >
          <div class="order-main">
            <span class="who"><b>{{ order.from_user.name }}</b> 点的 · {{ order.item_count }} 道菜</span>
            <span v-if="order.note" class="note">备注：{{ order.note }}</span>
            <span v-else class="note muted">无备注</span>
          </div>
          <span class="date">{{ formatDateTime(order.created_at) }}</span>
        </router-link>
      </div>
    </template>

    <!-- 我下的：点给 XXX -->
    <template v-else>
      <div v-if="!placed.length" class="empty">
        <div class="empty-icon">🍽️</div>
        <p>你还没点过别人的菜</p>
      </div>
      <div v-else class="list">
        <router-link
          v-for="order in placed"
          :key="order.id"
          :to="{ name: 'menu-order-detail', params: { id: order.id } }"
          class="order-item"
        >
          <div class="order-main">
            <span class="who">点给 <b>{{ order.to_user.name }}</b> · {{ order.item_count }} 道菜</span>
            <span v-if="order.note" class="note">备注：{{ order.note }}</span>
            <span v-else class="note muted">无备注</span>
          </div>
          <span class="date">{{ formatDateTime(order.created_at) }}</span>
        </router-link>
      </div>
    </template>
  </div>
</template>

<style scoped>
.orders {
  padding: 28px 20px 60px;
  max-width: 720px;
}
.page-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 24px;
}
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border);
}
.tab {
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.15s;
}
.tab:hover {
  color: var(--text);
}
.tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

/* 场景引导：说明「收到的点单」= 朋友的想吃信号，引导线下约饭 */
.scene-tip {
  margin: 0 0 16px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--text-dim);
  font-size: 14px;
  line-height: 1.5;
}

.loading,
.empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-dim);
}
.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.3;
}
.empty p {
  margin: 0;
  font-size: 15px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--panel);
  text-decoration: none;
  color: inherit;
  transition: all 0.15s;
}
.order-item:hover {
  border-color: var(--accent);
  transform: translateX(2px);
}
.order-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.who {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}
.who b {
  color: var(--accent);
}
.note {
  font-size: 13px;
  color: var(--text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.note.muted {
  color: var(--text-mute);
  font-style: italic;
}
.date {
  font-size: 13px;
  color: var(--text-dim);
  flex-shrink: 0;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .order-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
