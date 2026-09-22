<script setup>
import { ref, onMounted } from 'vue'
import { getMyDishes } from '../api/dish'
import DishCard from '../components/DishCard.vue'

const dishes = ref([])
const loading = ref(true)
const refreshing = ref(false)

// force=true 跳过缓存强拉最新（手动刷新按钮用）
async function load(force = false) {
  if (force) refreshing.value = true
  try {
    const res = await getMyDishes({ force })
    dishes.value = res.dishes || []
  } catch (e) {
    console.error('加载菜品失败:', e)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

onMounted(() => load())
</script>

<template>
  <div class="container my-menus">
    <div class="header">
      <h1 class="page-title">我的菜单</h1>
      <div class="actions">
        <button
          class="btn ghost refresh-btn"
          :disabled="refreshing"
          title="刷新，获取最新菜单"
          @click="load(true)"
        >
          <span class="refresh-icon" :class="{ spinning: refreshing }">↻</span>
          {{ refreshing ? '刷新中…' : '刷新' }}
        </button>
        <router-link :to="{ name: 'menu-create' }" class="btn primary">
          + 添加菜品
        </router-link>
      </div>
    </div>

    <!-- 玩法说明：解释「菜单」的核心流程，帮助用户理解点单不是电商下单 -->
    <details class="guide">
      <summary>💡 这是什么？点单怎么玩</summary>
      <div class="guide-body">
        <p>
          「菜单」是把你会做的菜分享给朋友、家人的地方。朋友「点单」表达的是
          <b>「我想吃这道」</b> 的兴趣，而不是电商下单——不涉及支付，也无需平台内联系方式。
        </p>
        <ol class="flow">
          <li><b>创建</b>：添加你拿手的菜品</li>
          <li><b>分享</b>：把你的菜单发给朋友</li>
          <li><b>点单</b>：朋友挑出想吃的，表达兴趣</li>
          <li><b>线下约饭</b>：你在「我收到的」看到心愿单，双方线下约个时间一起品尝</li>
        </ol>
      </div>
    </details>

    <div v-if="loading" class="loading">加载中…</div>

    <div v-else-if="!dishes.length" class="empty">
      <div class="empty-icon">🍽️</div>
      <p>还没有菜品，去添加一道吧</p>
      <router-link :to="{ name: 'menu-create' }" class="btn primary">
        添加第一道菜
      </router-link>
    </div>

    <div v-else class="grid">
      <DishCard
        v-for="dish in dishes"
        :key="dish.id"
        :dish="dish"
      />
    </div>
  </div>
</template>

<style scoped>
.my-menus {
  padding: 28px 20px 60px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.refresh-icon {
  display: inline-block;
  font-size: 16px;
  line-height: 1;
}
.refresh-icon.spinning {
  animation: refresh-spin 0.8s linear infinite;
}
@keyframes refresh-spin {
  to { transform: rotate(360deg); }
}
.page-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0;
}
/* 玩法说明（可折叠，默认收起）：新用户可展开了解核心流程 */
.guide {
  margin-bottom: 24px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--panel);
  overflow: hidden;
}
.guide > summary {
  padding: 14px 18px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  list-style: none;
  user-select: none;
}
.guide > summary::-webkit-details-marker {
  display: none;
}
.guide > summary::after {
  content: '▾';
  float: right;
  color: var(--text-dim);
  transition: transform 0.2s;
}
.guide[open] > summary::after {
  transform: rotate(180deg);
}
.guide-body {
  padding: 0 18px 18px;
  color: var(--text-dim);
  font-size: 14px;
  line-height: 1.7;
}
.guide-body p {
  margin: 0 0 12px;
}
.guide-body b {
  color: var(--text);
}
.flow {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  margin: 0 0 20px;
  font-size: 15px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

@media (max-width: 720px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}
</style>
