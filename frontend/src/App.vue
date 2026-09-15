<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { store, favoriteCount, compareCount } from './store'
import AuthModal from './components/AuthModal.vue'
// Vercel Web Analytics：客户端埋点，配合 vue-router 自动按路由上报访问
import { Analytics } from '@vercel/analytics/vue'

const router = useRouter()
const keyword = ref('')
const showLogin = ref(false)
const showTools = ref(false)
const toolsRef = ref(null)

function doSearch() {
  router.push({ name: 'ranking', query: { q: keyword.value || undefined } })
}

function openLogin() {
  showLogin.value = true
}

// 点击下拉外部时收起「工具」菜单
function onDocClick(e) {
  if (toolsRef.value && !toolsRef.value.contains(e.target)) {
    showTools.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  // 路由守卫拦下未登录访问工具页时会派发此事件，这里顺势唤起登录弹窗
  window.addEventListener('auth:need-login', openLogin)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('auth:need-login', openLogin)
})
</script>

<template>
  <header class="topbar">
    <div class="container bar-inner">
      <router-link to="/" class="logo">
        <span class="logo-mark">🚗</span>
        <span class="logo-text">车榜<i>ChéBǎng</i></span>
      </router-link>

      <div class="search">
        <input
          v-model="keyword"
          placeholder="搜索车型 / 品牌，如 秦PLUS、特斯拉…"
          @keyup.enter="doSearch"
        />
        <button class="btn primary" @click="doSearch">搜索</button>
      </div>

      <nav class="actions">
        <router-link to="/compare" class="nav-link">
          对比
          <span v-if="compareCount" class="dot">{{ compareCount }}</span>
        </router-link>
        <router-link to="/favorites" class="nav-link">
          收藏
          <span v-if="favoriteCount" class="dot">{{ favoriteCount }}</span>
        </router-link>
        <!-- 工具下拉：仅登录后可见 -->
        <div v-if="store.user" ref="toolsRef" class="dropdown">
          <button class="nav-link tools-btn" @click.stop="showTools = !showTools">
            工具 <i class="caret" :class="{ up: showTools }">▾</i>
          </button>
          <div v-if="showTools" class="menu">
            <router-link
              to="/tools/idcard"
              class="menu-item"
              @click="showTools = false"
            >
              🪪 身份证识别
            </router-link>
          </div>
        </div>
        <template v-if="store.user">
          <span class="user">👤 {{ store.user.name }}</span>
          <button class="btn ghost" @click="store.logout()">退出</button>
        </template>
        <button v-else class="btn" @click="openLogin">登录</button>
      </nav>
    </div>
  </header>

  <main>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>

  <footer class="footer container">
    <p>
      车榜 · 演示版 &nbsp;|&nbsp; 数据为基于公开渠道的近似值，仅用于界面演示，正式版将替换为官方公开数据并标注来源。
    </p>
  </footer>

  <!-- 登录 / 注册弹窗 -->
  <AuthModal v-if="showLogin" @close="showLogin = false" />

  <!-- Vercel 访问统计（无可见 UI，仅加载埋点脚本） -->
  <Analytics />
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(12px);
  background: rgba(10, 14, 23, 0.8);
  border-bottom: 1px solid var(--border);
}
.bar-inner {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 64px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  font-size: 20px;
  white-space: nowrap;
}
.logo-mark {
  font-size: 24px;
  filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.6));
}
.logo-text i {
  display: block;
  font-size: 10px;
  font-style: normal;
  letter-spacing: 2px;
  color: var(--text-mute);
  font-weight: 500;
}
.search {
  flex: 1;
  display: flex;
  gap: 8px;
  max-width: 560px;
}
.search input {
  flex: 1;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 9px 14px;
  color: var(--text);
  font-size: 14px;
  outline: none;
}
.search input:focus {
  border-color: var(--accent);
  box-shadow: var(--glow);
}
.actions {
  display: flex;
  align-items: center;
  gap: 14px;
  white-space: nowrap;
}
.nav-link {
  position: relative;
  color: var(--text-dim);
  font-size: 14px;
  font-weight: 600;
  transition: color 0.15s;
}
.nav-link:hover,
.router-link-active.nav-link {
  color: var(--accent);
}
.dot {
  position: absolute;
  top: -8px;
  right: -14px;
  background: var(--accent-2);
  color: #fff;
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  border-radius: 999px;
  padding: 0 4px;
}
.user {
  font-size: 14px;
  color: var(--text-dim);
}

/* 工具下拉 */
.dropdown {
  position: relative;
}
.tools-btn {
  background: transparent;
  border: none;
  padding: 0;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dim);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.tools-btn:hover {
  color: var(--accent);
}
.caret {
  font-style: normal;
  font-size: 10px;
  transition: transform 0.15s;
}
.caret.up {
  transform: rotate(180deg);
}
.menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 160px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 6px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  z-index: 60;
}
.menu-item {
  display: block;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-dim);
  transition: all 0.15s;
}
.menu-item:hover {
  background: var(--panel-2);
  color: var(--accent);
}
main {
  min-height: calc(100vh - 64px - 80px);
}
.footer {
  padding: 24px 20px 40px;
  color: var(--text-mute);
  font-size: 12px;
  text-align: center;
}

@media (max-width: 720px) {
  .bar-inner {
    flex-wrap: wrap;
    height: auto;
    padding-top: 10px;
    padding-bottom: 10px;
    gap: 10px;
  }
  .search {
    order: 3;
    max-width: none;
    flex-basis: 100%;
  }
  .logo-text i {
    display: none;
  }
}
</style>
