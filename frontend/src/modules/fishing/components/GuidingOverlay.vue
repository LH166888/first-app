<template>
  <div class="guide-mask" @click.self="skip">
    <div class="guide-card">
      <h2>新手引导</h2>
      <ol class="guide-steps">
        <li v-for="(step, i) in steps" :key="i">
          <span class="icon">{{ step.icon }}</span>
          <div>
            <div class="title">{{ step.title }}</div>
            <div class="desc">{{ step.desc }}</div>
          </div>
        </li>
      </ol>
      <div class="guide-actions">
        <button class="btn ghost" @click="skip">跳过</button>
        <button class="btn primary" @click="confirm">开始捕鱼</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['close'])

// 引导文案（同步维护于交付文档「引导文案清单」）
const steps = [
  { icon: '🎯', title: '瞄准', desc: '移动鼠标（或手指）让炮口对准鱼，点击 / 空格开炮。' },
  { icon: '🔫', title: '切换炮倍', desc: '按 + / - 或点顶部 1× 2× 5× 10× 切换炮倍。' },
  { icon: '💰', title: '炮倍权衡', desc: '炮倍越高，每发消耗越多，但命中后吐分也越多、越容易捕获大鱼。' },
  { icon: '🐡', title: '海底彩蛋', desc: '元宝鱼吐金币雨、灯笼鱼连锁引爆、河豚小范围溅射——优先招呼它们！' },
  { icon: '🏁', title: '目标', desc: '金币打光即结束，净胜金币越高排名越靠前。' },
]

function confirm() {
  emit('close', { skipped: false })
}
function skip() {
  emit('close', { skipped: true })
}
</script>

<style scoped>
.guide-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
}
.guide-card {
  width: min(460px, 100%);
  background: linear-gradient(135deg, #0a1a3a, #04305c);
  border: 3px solid #ffcf40;
  border-radius: 16px;
  padding: 24px;
  color: #e8eef4;
  box-shadow: 0 0 30px rgba(255, 207, 64, 0.3);
}
.guide-card h2 {
  margin: 0 0 16px;
  color: #ffcf40;
  text-align: center;
}
.guide-steps {
  list-style: none;
  margin: 0 0 20px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.guide-steps li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}
.title {
  font-weight: 700;
  color: #ffe066;
}
.desc {
  font-size: 0.9rem;
  color: #cdd7e0;
  line-height: 1.5;
}
.guide-actions {
  display: flex;
  gap: 12px;
}
.btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  font-size: 1rem;
}
.btn.primary {
  background: linear-gradient(135deg, #ffe066, #ff9500);
  color: #04305c;
}
.btn.ghost {
  background: transparent;
  border: 2px solid rgba(255, 207, 64, 0.5);
  color: #ffcf40;
}
</style>
