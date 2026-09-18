<script setup>
// 车榜模块子布局：把原本写死在全局 App.vue 里的「车 logo + 搜索框 + 对比/收藏 nav」
// 下沉到车榜自己的子头，让平台外壳保持中性。
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { favoriteCount, compareCount } from '../../shared/store'

const router = useRouter()
const keyword = ref('')

function doSearch() {
  // 与 RankingView 的搜索契约一致：通过 query.q 传关键词
  router.push({ name: 'car-ranking', query: { q: keyword.value || undefined } })
}
</script>

<template>
  <div class="car-module">
    <div class="subbar">
      <div class="container bar-inner">
        <div class="search">
          <input
            v-model="keyword"
            placeholder="搜索车型 / 品牌，如 秦PLUS、特斯拉…"
            @keyup.enter="doSearch"
          />
          <button class="btn primary" @click="doSearch">搜索</button>
        </div>

        <nav class="actions">
          <router-link :to="{ name: 'car-compare' }" class="nav-link">
            对比
            <span v-if="compareCount" class="dot">{{ compareCount }}</span>
          </router-link>
          <router-link :to="{ name: 'car-favorites' }" class="nav-link">
            收藏
            <span v-if="favoriteCount" class="dot">{{ favoriteCount }}</span>
          </router-link>
        </nav>
      </div>
    </div>

    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <footer class="car-footer container">
      <p>
        车榜 · 演示版 &nbsp;|&nbsp; 数据为基于公开渠道的近似值，仅用于界面演示，正式版将替换为官方公开数据并标注来源。
      </p>
    </footer>
  </div>
</template>

<style scoped>
.car-footer {
  padding: 24px 20px 40px;
  color: var(--text-mute);
  font-size: 12px;
  text-align: center;
}
.subbar {
  position: sticky;
  top: 64px; /* 贴在平台顶栏(高64px)下方 */
  z-index: 40;
  backdrop-filter: blur(12px);
  background: rgba(10, 14, 23, 0.72);
  border-bottom: 1px solid var(--border);
}
.bar-inner {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 56px;
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

@media (max-width: 720px) {
  .subbar {
    top: 0; /* 移动端平台顶栏高度不固定，子头不再吸附偏移 */
  }
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
}
</style>
