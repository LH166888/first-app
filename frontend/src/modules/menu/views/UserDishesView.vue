<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getUserDishes } from '../api/dish'
import { useCart } from '../cart'
import DishCard from '../components/DishCard.vue'
import CartBar from '../components/CartBar.vue'

const route = useRoute()
const { add, remove, has } = useCart()

const user = ref(null)
const dishes = ref([])
const isSelf = ref(false)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await getUserDishes(route.params.userId)
    user.value = res.user
    dishes.value = res.dishes || []
    isSelf.value = res.is_self
  } catch (e) {
    console.error('加载用户菜品失败:', e)
  } finally {
    loading.value = false
  }
})

function handleAdd(dish) {
  const ok = add(dish, user.value)
  if (!ok) {
    alert(`购物车里还有点给别人的菜，先提交或清空后再点${user.value.name}的菜。`)
  }
}

function handleRemove(dish) {
  remove(dish.id)
}
</script>

<template>
  <div class="container user-dishes">
    <div v-if="loading" class="loading">加载中…</div>

    <template v-else-if="user">
      <div class="header">
        <div class="avatar">{{ user.name.charAt(0) }}</div>
        <div>
          <h1 class="page-title">{{ user.name }}的菜单</h1>
          <p class="subtitle">
            {{ isSelf ? '这是你自己的菜单' : `选几道菜加入购物车，一起点给${user.name}` }}
          </p>
        </div>
      </div>

      <div v-if="!dishes.length" class="empty">
        <div class="empty-icon">🍽️</div>
        <p>{{ isSelf ? '你还没有发布菜品' : 'TA 还没有发布菜品' }}</p>
      </div>

      <div v-else class="grid">
        <DishCard
          v-for="dish in dishes"
          :key="dish.id"
          :dish="dish"
          :cart-mode="!isSelf"
          :in-cart="has(dish.id)"
          @add="handleAdd"
          @remove="handleRemove"
        />
      </div>
    </template>

    <CartBar />
  </div>
</template>

<style scoped>
.user-dishes {
  padding: 28px 20px 100px;
}
.header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}
.avatar {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
}
.page-title {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 4px;
}
.subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--text-dim);
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
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}
</style>
