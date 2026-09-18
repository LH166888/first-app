<script setup>
// 门户首页（Launchpad）：AI 无限平台入口。
// 三层结构：① 海洋主题背景（当前用 CSS 渐变兜底，预留 <video> 结构）
//           ② 暗化遮罩  ③ 内容层（标题 + 毛玻璃画册轮播 + 菜单推荐占位）
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 模块画册卡片
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

// 菜单推荐占位（菜单模块上线前用静态示例，后续接真实接口）
const recommends = [
  { emoji: '🍜', name: '招牌牛肉面', tag: '暖胃' },
  { emoji: '🥘', name: '番茄炖牛腩', tag: '家常' },
  { emoji: '🥗', name: '鸡胸沙拉碗', tag: '轻食' },
  { emoji: '🍲', name: '菌菇鸡汤', tag: '滋补' },
]

const active = ref(0)
let timer = null

const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function go(i) {
  active.value = (i + cards.length) % cards.length
}
function next() {
  go(active.value + 1)
}
function prev() {
  go(active.value - 1)
}

function start() {
  if (reduceMotion || timer) return
  timer = setInterval(next, 4500)
}
function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function enter(card) {
  if (card.coming) return // 菜单模块未上线，暂不跳转
  router.push(card.to)
}

onMounted(start)
onUnmounted(stop)
</script>

<template>
  <div class="home" @mouseenter="stop" @mouseleave="start">
    <!-- ① 背景层：海洋主题视频。三重降级——
         正常：<video> 循环播放；prefers-reduced-motion：只显示首帧静图；
         视频自带 poster（弱网/加载失败保留首帧），底层再垫一层渐变作最终兜底。 -->
    <div class="bg-base"></div>
    <video
      v-if="!reduceMotion"
      class="bg-video"
      autoplay
      muted
      loop
      playsinline
      preload="metadata"
      poster="/water-fire.jpg"
    >
      <source src="/water-fire.mp4" type="video/mp4" />
    </video>
    <div v-else class="bg-poster"></div>

    <!-- ② 暗化遮罩层 -->
    <div class="overlay"></div>

    <!-- ③ 内容层 -->
    <div class="content container">
      <header class="hero">
        <h1 class="brand">AI 无限</h1>
        <p class="slogan">一个入口，连接你的每一种可能</p>
      </header>

      <!-- 毛玻璃画册轮播（模块切换器） -->
      <div class="carousel">
        <button class="arrow prev" aria-label="上一个" @click="prev">‹</button>

        <div class="stage">
          <button
            v-for="(c, i) in cards"
            :key="c.key"
            class="glass-card"
            :class="{
              active: i === active,
              left: i === (active - 1 + cards.length) % cards.length,
              right: i === (active + 1) % cards.length,
              coming: c.coming,
            }"
            @click="i === active ? enter(c) : go(i)"
          >
            <span class="c-icon">{{ c.icon }}</span>
            <span class="c-name">{{ c.name }}</span>
            <span class="c-desc">{{ c.desc }}</span>
            <span v-if="c.coming" class="c-badge">即将上线</span>
            <span v-else class="c-enter">进入 →</span>
          </button>
        </div>

        <button class="arrow next" aria-label="下一个" @click="next">›</button>
      </div>

      <!-- 指示点 -->
      <div class="dots">
        <button
          v-for="(c, i) in cards"
          :key="c.key"
          class="dot"
          :class="{ on: i === active }"
          :aria-label="c.name"
          @click="go(i)"
        ></button>
      </div>

      <!-- 菜单推荐位（占位静态数据） -->
      <section class="recommend">
        <div class="rec-head">
          <span class="rec-title">🍽️ 菜单推荐</span>
          <span class="rec-note">示例内容 · 菜单模块上线后接入真实数据</span>
        </div>
        <div class="rec-grid">
          <div v-for="r in recommends" :key="r.name" class="rec-card">
            <span class="rec-emoji">{{ r.emoji }}</span>
            <div class="rec-name">{{ r.name }}</div>
            <span class="rec-tag">{{ r.tag }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home {
  position: relative;
  min-height: calc(100vh - 64px);
  overflow: hidden;
}

/* ① 背景 */
.bg-base,
.bg-video,
.bg-poster {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}
/* 最底层渐变：视频与静图都加载失败时的最终兜底 */
.bg-base {
  background:
    radial-gradient(1200px 600px at 20% -10%, rgba(0, 229, 255, 0.35), transparent 60%),
    radial-gradient(900px 500px at 90% 20%, rgba(0, 144, 255, 0.3), transparent 55%),
    linear-gradient(180deg, #04122b 0%, #062b4d 45%, #0a3a5c 100%);
}
/* prefers-reduced-motion：只显示首帧静图，不强拉视频 */
.bg-poster {
  background: #04122b center / cover no-repeat url('/ocean-poster.jpg');
}
/* 轻度色彩增强：逆光日出偏雾、对比低，提一点对比/饱和让画面更通透清澈 */
.bg-video,
.bg-poster {
  filter: saturate(1.15) contrast(1.12);
}

/* ② 遮罩 */
.overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    180deg,
    rgba(4, 10, 20, 0) 0%,
    rgba(4, 10, 20, 0) 52%,
    rgba(4, 10, 20, 0.38) 100%
  );
}

/* ③ 内容 */
.content {
  position: relative;
  z-index: 2;
  padding: 64px 20px 80px;
  text-align: center;
}
.hero {
  margin-bottom: 44px;
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
  /* 渐变裁字用 drop-shadow 才能压出暗描边（text-shadow 对透明字不生效）
     叠一层小半径深阴影，等于给字加暗轮廓，在明亮天空上也读得清 */
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.55))
    drop-shadow(0 0 2px rgba(0, 0, 0, 0.6));
}
.slogan {
  margin: 12px 0 0;
  font-size: clamp(14px, 2.4vw, 18px);
  color: #fff;
  letter-spacing: 1px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7), 0 0 10px rgba(0, 0, 0, 0.4);
}

/* 画册轮播 */
.carousel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.stage {
  position: relative;
  width: min(360px, 82vw);
  height: 260px;
}
.glass-card {
  position: absolute;
  inset: 0;
  margin: auto;
  width: min(300px, 74vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 28px 22px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(10, 20, 36, 0.42);
  backdrop-filter: blur(11px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  color: #fff;
  cursor: pointer;
  transition: transform 0.45s ease, opacity 0.45s ease, filter 0.45s ease;
  opacity: 0;
  transform: scale(0.8) translateX(0);
  pointer-events: none;
}
.glass-card.active {
  opacity: 1;
  transform: scale(1) translateX(0);
  pointer-events: auto;
  z-index: 3;
}
.glass-card.left {
  opacity: 0.4;
  transform: scale(0.82) translateX(-56%);
  filter: blur(1px);
  pointer-events: auto;
  z-index: 2;
}
.glass-card.right {
  opacity: 0.4;
  transform: scale(0.82) translateX(56%);
  filter: blur(1px);
  pointer-events: auto;
  z-index: 2;
}
.c-icon {
  font-size: 52px;
  filter: drop-shadow(0 0 12px rgba(0, 229, 255, 0.5));
}
.c-name {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 2px;
}
.c-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
}
.c-enter {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #9fe9ff;
}
.c-badge {
  margin-top: 6px;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.85);
}
.glass-card.coming {
  cursor: default;
}
.arrow {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s;
  z-index: 4;
}
.arrow:hover {
  background: rgba(0, 229, 255, 0.25);
  border-color: var(--accent);
}

/* 指示点 */
.dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 22px 0 48px;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  transition: all 0.2s;
}
.dot.on {
  background: var(--accent);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.8);
  transform: scale(1.25);
}

/* 菜单推荐 */
.recommend {
  max-width: 900px;
  margin: 0 auto;
  padding: 22px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(10, 20, 36, 0.4);
  backdrop-filter: blur(9px);
}
.rec-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.rec-title {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
}
.rec-note {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}
.rec-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
}
.rec-card {
  padding: 18px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  text-align: center;
  transition: transform 0.15s ease, background 0.15s ease;
}
.rec-card:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.14);
}
.rec-emoji {
  font-size: 34px;
}
.rec-name {
  margin: 8px 0 6px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}
.rec-tag {
  font-size: 12px;
  color: #9fe9ff;
  border: 1px solid rgba(0, 229, 255, 0.4);
  border-radius: 999px;
  padding: 1px 10px;
}

@media (max-width: 720px) {
  .content {
    padding: 40px 16px 60px;
  }
  .arrow {
    display: none;
  }
  .glass-card.left,
  .glass-card.right {
    opacity: 0;
    pointer-events: none;
  }
}
</style>
