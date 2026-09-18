<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { store } from './shared/store'
import AuthModal from './shared/components/AuthModal.vue'
// Vercel Web Analytics：客户端埋点，配合 vue-router 自动按路由上报访问
import { Analytics } from '@vercel/analytics/vue'

const route = useRoute()
// 当前所在模块（各模块父路由的 meta.module 提供）；门户首页无模块，返回 null
const activeModule = computed(() => route.meta.module || null)

const showLogin = ref(false)

function openLogin() {
  showLogin.value = true
}

onMounted(() => {
  // 路由守卫拦下未登录访问需登录页时会派发此事件，这里顺势唤起登录弹窗
  window.addEventListener('auth:need-login', openLogin)
})
onUnmounted(() => {
  window.removeEventListener('auth:need-login', openLogin)
})
</script>

<template>
  <!-- 中性平台外壳：平台 logo + 共享用户区。各模块元素下沉到模块子头。 -->
  <header class="topbar">
    <div class="container bar-inner">
      <div class="brand-group">
        <router-link to="/" class="logo">
          <span class="logo-mark">🌊</span>
          <span class="logo-text">AI 无限<i>AI Infinity</i></span>
        </router-link>

        <!-- 当前模块面包屑：视觉上低平台品牌一级，消除「双标题」 -->
        <template v-if="activeModule">
          <span class="crumb-sep">›</span>
          <router-link :to="activeModule.to" class="crumb">
            <span class="crumb-mark">{{ activeModule.mark }}</span>
            <span class="crumb-text">{{ activeModule.label }}</span>
          </router-link>
        </template>
      </div>

      <div class="spacer"></div>

      <nav class="actions">
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
.brand-group {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
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
/* 面包屑：分隔符 + 模块名，字重与颜色都低于主品牌，形成层级 */
.crumb-sep {
  color: var(--text-mute);
  font-size: 18px;
  font-weight: 400;
}
.crumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dim);
  white-space: nowrap;
  transition: color 0.15s;
}
.crumb:hover {
  color: var(--text);
}
.crumb-mark {
  font-size: 18px;
}
.spacer {
  flex: 1;
}
.actions {
  display: flex;
  align-items: center;
  gap: 14px;
  white-space: nowrap;
}
.user {
  font-size: 14px;
  color: var(--text-dim);
}
main {
  min-height: calc(100vh - 64px);
}

@media (max-width: 720px) {
  .bar-inner {
    height: 56px;
  }
  .brand-group {
    gap: 8px;
  }
  .logo {
    font-size: 17px;
  }
  .logo-text i {
    display: none;
  }
  .crumb {
    font-size: 14px;
  }
  .crumb-sep {
    font-size: 16px;
  }
}
</style>
