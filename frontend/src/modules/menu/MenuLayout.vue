<script setup>
// 菜单模块子布局：子头 tab 导航 + router-view
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 每个 tab 高亮所覆盖的路由名（含各自的详情/子页）。
// 不用 router-link-active 的路径前缀匹配——否则指向 /menu 的「我的菜单」
// 会在所有 /menu/* 子页上都被点亮。
const tabs = [
  { name: 'menu-discover', label: '发现', match: ['menu-discover', 'menu-user'] },
  { name: 'menu-list', label: '我的菜单', match: ['menu-list', 'menu-detail'] },
  { name: 'menu-create', label: '创建', match: ['menu-create'] },
  { name: 'menu-orders', label: '点单明细', match: ['menu-orders', 'menu-order-detail'] },
]

const activeName = computed(() => route.name)
function isActive(tab) {
  return tab.match.includes(activeName.value)
}
</script>

<template>
  <div class="menu-module">
    <div class="subbar">
      <div class="container bar-inner">
        <nav class="actions">
          <router-link
            v-for="tab in tabs"
            :key="tab.name"
            :to="{ name: tab.name }"
            class="nav-link"
            :class="{ 'is-active': isActive(tab) }"
          >
            {{ tab.label }}
          </router-link>
        </nav>
      </div>
    </div>

    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <footer class="menu-footer container">
      <p>菜单 · 演示版 &nbsp;|&nbsp; 图片和数据仅用于界面演示。</p>
    </footer>
  </div>
</template>

<style scoped>
.menu-footer {
  padding: 24px 20px 40px;
  color: var(--text-mute);
  font-size: 12px;
  text-align: center;
}
.subbar {
  position: sticky;
  top: 64px;
  z-index: 40;
  backdrop-filter: blur(12px);
  background: rgba(10, 14, 23, 0.72);
  border-bottom: 1px solid var(--border);
}
.bar-inner {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 52px;
}
.actions {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 24px;
  white-space: nowrap;
}
.nav-link {
  color: var(--text-dim);
  font-size: 14px;
  font-weight: 600;
  transition: color 0.15s;
}
.nav-link:hover,
.nav-link.is-active {
  color: var(--accent);
}

@media (max-width: 720px) {
  .subbar {
    top: 0;
  }
  .bar-inner {
    height: auto;
    padding-top: 10px;
    padding-bottom: 10px;
    gap: 16px;
    flex-wrap: wrap;
  }
}
</style>
