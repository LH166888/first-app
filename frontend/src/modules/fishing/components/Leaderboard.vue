<template>
  <div class="lb">
    <div class="lb-head">
      <h3>本周排行榜 · TOP{{ topN }}</h3>
      <span v-if="totalPlayers" class="total">{{ totalPlayers }} 人上榜</span>
    </div>

    <div v-if="loading" class="lb-empty">加载中…</div>
    <div v-else-if="!list.length" class="lb-empty">暂无榜单数据，快来抢占第一名！</div>

    <ol v-else class="lb-list">
      <li v-for="row in list" :key="row.rank" class="lb-row" :class="rankClass(row.rank)">
        <span class="rk">{{ medal(row.rank) }}</span>
        <span class="nm">{{ row.userName || '匿名玩家' }}</span>
        <span class="sc">{{ row.score }}</span>
      </li>
    </ol>

    <div v-if="currentRank" class="lb-self">
      我的名次：<b>#{{ currentRank }}</b>
      <span v-if="currentScore != null">· 净分 {{ currentScore }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  list: { type: Array, default: () => [] },
  currentRank: { type: [Number, null], default: null },
  currentScore: { type: [Number, null], default: null },
  totalPlayers: { type: Number, default: 0 },
  topN: { type: Number, default: 10 },
  loading: { type: Boolean, default: false },
})

function medal(rank) {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank
}
function rankClass(rank) {
  return rank <= 3 ? `top top-${rank}` : ''
}
</script>

<style scoped>
.lb {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #ffcf40;
  border-radius: 12px;
  padding: 14px 16px;
}
.lb-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}
.lb-head h3 {
  margin: 0;
  color: #ffcf40;
  font-size: 1.05rem;
}
.total {
  font-size: 0.8rem;
  color: #9fb3c8;
}
.lb-empty {
  color: #9fb3c8;
  text-align: center;
  padding: 24px 0;
}
.lb-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.lb-row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
}
.lb-row .rk {
  text-align: center;
  font-weight: 700;
  color: #cdd7e0;
}
.lb-row .nm {
  color: #e8eef4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lb-row .sc {
  font-weight: 700;
  color: #ffd166;
  font-family: 'Courier New', monospace;
}
.lb-row.top .rk {
  font-size: 1.1rem;
}
.lb-row.top-1 {
  background: rgba(255, 207, 64, 0.16);
}
.lb-self {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed rgba(255, 207, 64, 0.3);
  color: #cdd7e0;
  font-size: 0.9rem;
}
.lb-self b {
  color: #ffcf40;
}
</style>
