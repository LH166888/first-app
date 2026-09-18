<script setup>
import { ref, onMounted } from 'vue'
import { getMyDishes } from '../api/dish'
import DishCard from '../components/DishCard.vue'

const dishes = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await getMyDishes()
    dishes.value = res.dishes || []
  } catch (e) {
    console.error('加载菜品失败:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container my-menus">
    <div class="header">
      <h1 class="page-title">我的菜单</h1>
      <router-link :to="{ name: 'menu-create' }" class="btn primary">
        + 添加菜品
      </router-link>
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
