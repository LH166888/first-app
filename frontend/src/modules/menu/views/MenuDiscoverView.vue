<script setup>
import { ref, onMounted } from 'vue'
import { getChefs } from '../api/dish'

const chefs = ref([])
const loading = ref(true)
const refreshing = ref(false)

// force=true 跳过缓存强拉最新（手动刷新按钮用）
async function load(force = false) {
  if (force) refreshing.value = true
  try {
    const res = await getChefs({ force })
    chefs.value = res.chefs || []
  } catch (e) {
    console.error('加载发现页失败:', e)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

onMounted(() => load())
</script>

<template>
  <div class="container discover">
    <div class="header">
      <div class="header-text">
        <h1 class="page-title">发现</h1>
        <p class="subtitle">看看大家做了什么菜，选几道点给对方</p>
      </div>
      <button
        class="btn ghost refresh-btn"
        :disabled="refreshing"
        title="刷新，看看有没有新的菜单"
        @click="load(true)"
      >
        <span class="refresh-icon" :class="{ spinning: refreshing }">↻</span>
        {{ refreshing ? '刷新中…' : '刷新' }}
      </button>
    </div>

    <div v-if="loading" class="loading">加载中…</div>

    <div v-else-if="!chefs.length" class="empty">
      <div class="empty-icon">🍳</div>
      <p>还没有别人的菜单，等大家来分享吧</p>
    </div>

    <div v-else class="grid">
      <router-link
        v-for="chef in chefs"
        :key="chef.user.id"
        :to="{ name: 'menu-user', params: { userId: chef.user.id } }"
        class="chef-card"
      >
        <div class="avatar">{{ chef.user.name.charAt(0) }}</div>
        <div class="chef-info">
          <h3 class="chef-name">{{ chef.user.name }}的菜单</h3>
          <p class="chef-meta">共 {{ chef.dish_count }} 道菜</p>
        </div>
        <span class="arrow">›</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.discover {
  padding: 28px 20px 60px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}
.header-text {
  min-width: 0;
}
.refresh-btn {
  flex-shrink: 0;
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
  margin: 0 0 6px;
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.chef-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--panel);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}
.chef-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}
.avatar {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}
.chef-info {
  flex: 1;
  min-width: 0;
}
.chef-name {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 4px;
  color: var(--text);
}
.chef-meta {
  margin: 0;
  font-size: 13px;
  color: var(--text-dim);
}
.arrow {
  font-size: 24px;
  color: var(--text-mute);
  flex-shrink: 0;
}

@media (max-width: 720px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
