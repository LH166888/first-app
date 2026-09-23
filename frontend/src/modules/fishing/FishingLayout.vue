<script setup>
// 捕鱼模块子布局：仅承载路由出口与页面切换过渡，保持平台外壳中性。
// 各页面（大厅/游戏/结算）自带深海主题背景与自适应布局，故此处不加子头栏。
</script>

<template>
  <div class="fishing-module">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style scoped>
.fishing-module {
  width: 100%;
  min-height: calc(100vh - 64px);
}
</style>
