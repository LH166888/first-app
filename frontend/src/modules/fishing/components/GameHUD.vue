<template>
  <div class="hud">
    <div class="hud-group">
      <div class="hud-item">
        <span class="k">金币</span>
        <span class="v coins">{{ coins }}</span>
      </div>
      <div class="hud-item">
        <span class="k">净分</span>
        <span class="v" :class="{ neg: score < 0 }">{{ score }}</span>
      </div>
    </div>

    <div class="hud-mult">
      <button
        v-for="m in multipliers"
        :key="m"
        class="mult-btn"
        :class="{ active: m === multiplier }"
        @click="$emit('set-multiplier', m)"
      >
        {{ m }}×
      </button>
    </div>

    <div class="hud-group right">
      <button class="ctrl" @click="$emit('toggle-pause')">{{ paused ? '继续' : '暂停' }}</button>
      <button class="ctrl exit" @click="$emit('exit')">退出</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  coins: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  multiplier: { type: Number, default: 1 },
  multipliers: { type: Array, default: () => [1, 2, 5, 10] },
  paused: { type: Boolean, default: false },
})
defineEmits(['set-multiplier', 'toggle-pause', 'exit'])
</script>

<style scoped>
.hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.55);
  border-bottom: 2px solid #ffcf40;
  font-family: 'Courier New', monospace;
  flex-wrap: wrap;
}
.hud-group {
  display: flex;
  gap: 18px;
  align-items: center;
}
.hud-group.right {
  gap: 10px;
}
.hud-item {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.k {
  font-size: 0.7rem;
  color: #9fb3c8;
}
.v {
  font-size: 1.3rem;
  font-weight: 700;
  color: #ffd166;
}
.v.coins {
  color: #ffe066;
}
.v.neg {
  color: #ff6b6b;
}
.hud-mult {
  display: flex;
  gap: 6px;
}
.mult-btn {
  min-width: 44px;
  padding: 6px 8px;
  border: 2px solid rgba(255, 207, 64, 0.4);
  background: rgba(0, 0, 0, 0.3);
  color: #cdd7e0;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}
.mult-btn.active {
  border-color: #ffcf40;
  color: #04305c;
  background: linear-gradient(135deg, #ffe066, #ff9500);
  box-shadow: 0 0 10px rgba(255, 207, 64, 0.6);
}
.ctrl {
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}
.ctrl.exit {
  background: #e03131;
}

/* 手机端 / 矮屏（横屏手机高度小）：收紧 HUD，单行不换行，给画布腾高度 */
@media (max-width: 820px), (max-height: 480px) {
  .hud {
    flex-wrap: nowrap;
    gap: 8px;
    padding: 5px 10px;
  }
  .hud-group {
    gap: 10px;
  }
  .k {
    font-size: 0.6rem;
  }
  .v {
    font-size: 1rem;
  }
  .hud-mult {
    gap: 4px;
  }
  .mult-btn {
    min-width: 34px;
    padding: 4px 5px;
    font-size: 0.8rem;
    border-width: 1px;
  }
  .ctrl {
    padding: 5px 9px;
    font-size: 0.8rem;
  }
}
</style>
