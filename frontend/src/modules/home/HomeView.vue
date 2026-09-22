<script setup>
// 门户首页（Launchpad）：AI 无限平台入口。
// 轻量三卡片栅格导航——品牌 + slogan + 三个应用卡片，点击直接进入。
// 不再使用背景视频 / 画册轮播 / 菜单推荐占位，改为纯渐变背景 + 静态栅格。
const cards = [
  {
    key: 'car',
    icon: '🚗',
    name: '车榜',
    desc: '汽车销量排行 · 参数对比 · 收藏',
    to: '/cars',
  },
  {
    key: 'menu',
    icon: '🍽️',
    name: '菜单',
    desc: '创建菜单 · 制作流程 · 点单',
    to: '/menu',
  },
  {
    key: 'tools',
    icon: '🧰',
    name: '工具箱',
    desc: '身份证识别等实用小工具',
    to: '/tools',
  },
]
</script>

<template>
  <div class="home">
    <div class="content container">
      <header class="hero">
        <h1 class="brand">AI 无限</h1>
        <p class="slogan">一个入口，连接你的每一种可能</p>
      </header>

      <!-- 三应用卡片栅格：统一尺寸，点击直接跳转，hover 轻微抬升 -->
      <nav class="grid">
        <router-link v-for="c in cards" :key="c.key" :to="c.to" class="app-card">
          <span class="c-icon">{{ c.icon }}</span>
          <span class="c-name">{{ c.name }}</span>
          <span class="c-desc">{{ c.desc }}</span>
          <span class="c-enter">进入 →</span>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.home {
  position: relative;
  min-height: calc(100vh - 64px);
  /* 纯渐变背景（替代原海洋主题视频），与整站深色科技风一致 */
  background:
    radial-gradient(1200px 600px at 18% -10%, rgba(0, 229, 255, 0.18), transparent 60%),
    radial-gradient(900px 500px at 88% 12%, rgba(0, 144, 255, 0.16), transparent 55%),
    linear-gradient(180deg, #04122b 0%, #062b4d 48%, #0a3a5c 100%);
  overflow: hidden;
}

.content {
  position: relative;
  padding: 72px 20px 88px;
  text-align: center;
}

.hero {
  margin-bottom: 52px;
}
.brand {
  font-size: clamp(40px, 8vw, 72px);
  font-weight: 900;
  letter-spacing: 4px;
  margin: 0;
  background: linear-gradient(90deg, #fff, #9fe9ff 60%, #00e5ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.45));
}
.slogan {
  margin: 12px 0 0;
  font-size: clamp(14px, 2.4vw, 18px);
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 1px;
}

/* 三卡片栅格：桌面三列等宽，窄屏自动换行 */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  max-width: 860px;
  margin: 0 auto;
}
.app-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 36px 22px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(10, 20, 36, 0.5);
  backdrop-filter: blur(8px);
  color: #fff;
  text-decoration: none;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}
.app-card:hover {
  transform: translateY(-6px);
  border-color: var(--accent);
  background: rgba(10, 20, 36, 0.66);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.4);
}
.c-icon {
  font-size: 48px;
  filter: drop-shadow(0 0 12px rgba(0, 229, 255, 0.4));
}
.c-name {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 2px;
}
.c-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.5;
}
.c-enter {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #9fe9ff;
}

@media (max-width: 720px) {
  .content {
    padding: 44px 16px 60px;
  }
  .hero {
    margin-bottom: 32px;
  }
  /* 窄屏改为单列纵向排列 */
  .grid {
    grid-template-columns: 1fr;
    gap: 14px;
    max-width: 420px;
  }
  .app-card {
    flex-direction: row;
    justify-content: flex-start;
    gap: 16px;
    padding: 20px 22px;
    text-align: left;
  }
  .c-icon {
    font-size: 38px;
  }
  /* 单列横向卡片下，进入提示与描述并入左侧文本流即可，隐藏冗余箭头 */
  .c-enter {
    display: none;
  }
}
</style>
