<script setup>
// 工具箱模块子布局：模块身份已由平台顶栏面包屑呈现，这里只做子路由出口。
</script>

<template>
  <div class="tools-module">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>
