<script setup>
import { computed, ref, onMounted } from 'vue'
import CarRow from '../components/CarRow.vue'
import CompareBar from '../components/CompareBar.vue'
import LoginToast from '../components/LoginToast.vue'
import { store } from '../store'

const toastRef = ref(null)

// 进入收藏页时从后端刷新一次（同时会把收藏车型写入缓存）
onMounted(() => {
  if (store.user) store.loadFavorites()
})

const list = computed(() =>
  store.favorites
    .map((id) => store.getCachedCar(id))
    .filter(Boolean)
    .sort((a, b) => b.sales - a.sales)
)
const maxSales = computed(() =>
  list.value.length ? Math.max(...list.value.map((c) => c.sales)) : 1
)
</script>

<template>
  <div class="container page">
    <h1>我的收藏</h1>

    <div v-if="!store.user" class="card empty">
      登录后即可收藏心仪车型。点击右上角「登录」开始吧～
    </div>
    <div v-else-if="!list.length" class="card empty">
      还没有收藏车型。去<router-link to="/">榜单</router-link>点击 ☆ 收藏喜欢的车吧～
    </div>
    <section v-else class="list">
      <CarRow
        v-for="(c, i) in list"
        :key="c.id"
        :car="c"
        :rank="i + 1"
        :max-sales="maxSales"
        @need-login="toastRef.show()"
      />
    </section>

    <CompareBar />
    <LoginToast ref="toastRef" />
  </div>
</template>

<style scoped>
.page {
  padding: 24px 20px 60px;
}
h1 {
  font-size: 26px;
  margin: 0 0 20px;
}
.empty {
  padding: 48px;
  text-align: center;
  color: var(--text-dim);
}
.empty a {
  color: var(--accent);
}
.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
