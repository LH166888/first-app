<script setup>
// 工具箱首页：工具卡片列表。身份证识别归入此处，后续新工具在此追加。
</script>

<template>
  <div class="container tools-list">
    <h1 class="page-title">工具箱</h1>
    <p class="page-sub">实用小工具集合，登录后即可使用。</p>

    <div class="grid">
      <router-link to="/tools/idcard" class="tool-card card">
        <span class="tool-icon">🪪</span>
        <div class="tool-body">
          <div class="tool-name">身份证识别</div>
          <div class="tool-desc">上传身份证照片，自动摆正裁剪并提取结构化信息。</div>
        </div>
      </router-link>

      <!-- 占位：更多工具敬请期待 -->
      <div class="tool-card card placeholder">
        <span class="tool-icon">✨</span>
        <div class="tool-body">
          <div class="tool-name">更多工具</div>
          <div class="tool-desc">敬请期待…</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tools-list {
  padding: 28px 20px 60px;
}
.page-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 6px;
}
.page-sub {
  color: var(--text-dim);
  font-size: 14px;
  margin: 0 0 24px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.tool-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  transition: all 0.15s ease;
}
.tool-card:not(.placeholder):hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}
.tool-icon {
  font-size: 34px;
  flex-shrink: 0;
}
.tool-name {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 4px;
}
.tool-desc {
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.5;
}
.placeholder {
  opacity: 0.5;
  cursor: default;
}
</style>
