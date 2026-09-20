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
