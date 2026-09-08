<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { store, favoriteCount, compareCount } from './store'

const router = useRouter()
const keyword = ref('')
const showLogin = ref(false)
const loginName = ref('')

function doSearch() {
  router.push({ name: 'ranking', query: { q: keyword.value || undefined } })
}

function openLogin() {
  showLogin.value = true
}
function submitLogin() {
  store.login(loginName.value.trim())
  showLogin.value = false
  loginName.value = ''
}
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

  <!-- 登录弹窗（演示：仅本地存储） -->
  <div v-if="showLogin" class="modal-mask" @click.self="showLogin = false">
    <div class="modal card">
      <h3>登录</h3>
      <p class="hint">演示登录，无需密码，仅保存在本机浏览器。登录后可收藏车型。</p>
      <input v-model="loginName" placeholder="给自己起个昵称" @keyup.enter="submitLogin" />
      <div class="modal-actions">
        <button class="btn ghost" @click="showLogin = false">取消</button>
        <button class="btn primary" @click="submitLogin">进入</button>
      </div>
    </div>
  </div>
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
main {
  min-height: calc(100vh - 64px - 80px);
}
.footer {
  padding: 24px 20px 40px;
  color: var(--text-mute);
  font-size: 12px;
  text-align: center;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal {
  width: 100%;
  max-width: 380px;
  padding: 24px;
}
.modal h3 {
  margin: 0 0 8px;
}
.modal .hint {
  color: var(--text-mute);
  font-size: 13px;
  margin: 0 0 16px;
}
.modal input {
  width: 100%;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  color: var(--text);
  outline: none;
  margin-bottom: 16px;
}
.modal input:focus {
  border-color: var(--accent);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
