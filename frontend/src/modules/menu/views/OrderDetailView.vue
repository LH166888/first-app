<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getOrderDetail } from '../api/order'

const route = useRoute()

const order = ref(null)
const loading = ref(true)
const error = ref(null)

// 年月日时分秒
const createdAt = computed(() => {
  if (!order.value) return ''
  const d = new Date(order.value.created_at)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})

onMounted(async () => {
  try {
    const res = await getOrderDetail(route.params.id)
    order.value = res.order
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container order-detail">
    <router-link :to="{ name: 'menu-orders' }" class="back">‹ 返回点单明细</router-link>

    <div v-if="loading" class="loading">加载中…</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <template v-else-if="order">
      <div class="head">
        <h1 class="title">
          <b>{{ order.from_user.name }}</b> 点给 <b>{{ order.to_user.name }}</b>
        </h1>
        <p class="time">{{ createdAt }}</p>
      </div>

      <div class="note-box">
        <span class="note-label">备注</span>
        <p class="note-text" :class="{ muted: !order.note }">
          {{ order.note || '（无备注）' }}
        </p>
      </div>

      <section class="section">
        <h2 class="section-title">点的菜品（{{ order.items.length }}）</h2>
        <div class="dish-list">
          <router-link
            v-for="item in order.items"
            :key="item.dish_id"
            :to="{ name: 'menu-detail', params: { id: item.dish_id } }"
            class="dish-row"
          >
            <span class="dish-icon">🍽️</span>
            <span class="dish-name">{{ item.dish_name }}</span>
            <span class="arrow">›</span>
          </router-link>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.order-detail {
  padding: 20px 20px 60px;
  max-width: 720px;
}
.back {
  display: inline-block;
  margin-bottom: 20px;
  font-size: 14px;
  color: var(--text-dim);
  text-decoration: none;
}
.back:hover {
  color: var(--accent);
}
.loading,
.error {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-dim);
}
.error {
  color: #e5484d;
}

.head {
  margin-bottom: 20px;
}
.title {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 6px;
  color: var(--text);
}
.title b {
  color: var(--accent);
}
.time {
  margin: 0;
  font-size: 13px;
  color: var(--text-dim);
}

.note-box {
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--panel);
  margin-bottom: 28px;
}
.note-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-mute);
  margin-bottom: 6px;
}
.note-text {
  margin: 0;
  font-size: 15px;
  color: var(--text);
  line-height: 1.5;
}
.note-text.muted {
  color: var(--text-mute);
  font-style: italic;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 16px;
  color: var(--text);
}
.dish-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dish-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--panel);
  text-decoration: none;
  color: inherit;
  transition: all 0.15s;
}
.dish-row:hover {
  border-color: var(--accent);
  transform: translateX(2px);
}
.dish-icon {
  font-size: 20px;
  flex-shrink: 0;
}
.dish-name {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}
.arrow {
  font-size: 22px;
  color: var(--text-mute);
  flex-shrink: 0;
}
</style>
