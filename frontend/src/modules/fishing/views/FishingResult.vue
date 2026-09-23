<template>
  <div class="result">
    <div class="result-card">
      <div v-if="r.isNewRecord" class="record-badge">🎉 新纪录！</div>
      <h2>结算</h2>

      <div class="net">
        <div class="net-label">本局净胜金币</div>
        <div class="net-value" :class="{ neg: r.score === 0 && r.coinsWon < r.coinsLeft }">{{ r.score }}</div>
      </div>

      <div class="grid">
        <div class="cell">
          <span class="k">捕获</span><span class="v">{{ r.fishCaught }} 条</span>
        </div>
        <div class="cell">
          <span class="k">发射</span><span class="v">{{ r.bulletsShot }} 发</span>
        </div>
        <div class="cell">
          <span class="k">捕获率</span><span class="v">{{ catchRate }}%</span>
        </div>
        <div class="cell">
          <span class="k">吐分</span><span class="v">{{ r.coinsWon }}</span>
        </div>
        <div class="cell">
          <span class="k">剩余金币</span><span class="v">{{ r.coinsLeft }}</span>
        </div>
        <div class="cell">
          <span class="k">排名</span><span class="v">{{ r.rank ? '#' + r.rank : '—' }}</span>
        </div>
      </div>

      <p v-if="r.submitError" class="warn">成绩未保存，登录后再玩即可上榜。</p>

      <div class="actions">
        <button class="btn primary" @click="playAgain">再来一局</button>
        <button class="btn ghost" @click="toLobby">回到大厅</button>
        <button class="btn ghost" @click="share">分享</button>
      </div>
      <p v-if="shareMsg" class="share-msg">{{ shareMsg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fishingStore, grantDailyCoins } from '../store'

const router = useRouter()
const shareMsg = ref('')

// 无结算数据（直接访问/刷新）→ 回大厅
const r = computed(() => fishingStore.lastResult || {})
onMounted(() => {
  if (!fishingStore.lastResult) router.replace('/games/fishing')
})

const catchRate = computed(() => {
  const b = r.value.bulletsShot || 0
  const f = r.value.fishCaught || 0
  return b > 0 ? Math.round((f / b) * 100) : 0
})

function playAgain() {
  if (fishingStore.coins <= 0) grantDailyCoins()
  router.push('/games/fishing/play')
}
function toLobby() {
  router.push('/games/fishing')
}
async function share() {
  const text = `我在「怀旧捕鱼机」net分 ${r.value.score}，捕获 ${r.value.fishCaught} 条鱼！来挑战我的排名~`
  try {
    if (navigator.share) {
      await navigator.share({ title: '怀旧捕鱼机', text })
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      shareMsg.value = '战绩已复制到剪贴板'
    } else {
      shareMsg.value = text
    }
  } catch {
    /* 用户取消分享，忽略 */
  }
}
</script>

<style scoped>
.result {
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #0a1a3a, #04305c);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}
.result-card {
  position: relative;
  width: min(460px, 100%);
  background: rgba(0, 0, 0, 0.35);
  border: 3px solid #ffcf40;
  border-radius: 16px;
  padding: 28px 24px;
  color: #e8eef4;
  text-align: center;
  box-shadow: 0 0 30px rgba(255, 207, 64, 0.25);
}
.record-badge {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ffe066, #ff9500);
  color: #04305c;
  font-weight: 700;
  padding: 6px 18px;
  border-radius: 999px;
  white-space: nowrap;
}
h2 {
  margin: 6px 0 18px;
  color: #ffcf40;
}
.net {
  margin-bottom: 20px;
}
.net-label {
  color: #9fb3c8;
  font-size: 0.9rem;
}
.net-value {
  font-size: 3rem;
  font-weight: 800;
  color: #ffd166;
  font-family: 'Courier New', monospace;
  line-height: 1.1;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 18px;
}
.cell {
  display: flex;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.05);
  padding: 10px 14px;
  border-radius: 10px;
}
.cell .k {
  color: #9fb3c8;
}
.cell .v {
  font-weight: 700;
  color: #ffe066;
  font-family: 'Courier New', monospace;
}
.warn {
  color: #ffa94d;
  font-size: 0.85rem;
  margin: 0 0 14px;
}
.actions {
  display: flex;
  gap: 10px;
}
.btn {
  flex: 1;
  padding: 12px 8px;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
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
.share-msg {
  margin: 12px 0 0;
  color: #69db7c;
  font-size: 0.85rem;
}
</style>
