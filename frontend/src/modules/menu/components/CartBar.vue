<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '../../../shared/cart'
import { placeOrder } from '../api/order'

const router = useRouter()
const { cart, isEmpty, count, remove, clear } = useCart()

const expanded = ref(false)
const note = ref('')
const submitting = ref(false)

function toggle() {
  if (isEmpty.value) return
  expanded.value = !expanded.value
}

async function submit() {
  if (isEmpty.value) return
  submitting.value = true
  try {
    const payload = {
      to_user_id: cart.targetUserId,
      dish_ids: cart.items.map((it) => it.id),
      note: note.value.trim(),
    }
    await placeOrder(payload)
    alert(`成功向 ${cart.targetUserName} 点单！`)
    clear()
    note.value = ''
    expanded.value = false
    router.push({ name: 'menu-orders' })
  } catch (e) {
    alert(e.message || '点单失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <!-- 底部固定栏 -->
  <div v-if="!isEmpty" class="cart-bar" :class="{ expanded }">
    <!-- 折叠态：显示数量 + 点击展开 -->
    <div class="bar-compact" @click="toggle">
      <span class="cart-icon">🛒</span>
      <span class="cart-text">购物车 ({{ count }})</span>
      <span class="expand-arrow">{{ expanded ? '∨' : '∧' }}</span>
    </div>

    <!-- 展开态：菜品列表 + 备注 + 提交 -->
    <div v-if="expanded" class="cart-detail">
      <div class="detail-header">
        <h3 class="detail-title">点给 {{ cart.targetUserName }}</h3>
        <button class="clear-btn" @click="clear">清空</button>
      </div>

      <div class="item-list">
        <div v-for="item in cart.items" :key="item.id" class="cart-item">
          <span class="item-name">{{ item.name }}</span>
          <button class="remove-btn" @click="remove(item.id)">✕</button>
        </div>
      </div>

      <div class="note-group">
        <label class="note-label">备注</label>
        <input
          v-model="note"
          type="text"
          class="note-input"
          placeholder="有什么想说的吗"
          maxlength="100"
        />
      </div>

      <button class="submit-btn" :disabled="submitting" @click="submit">
        {{ submitting ? '提交中…' : '提交点单' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.cart-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--panel);
  border-top: 1px solid var(--border);
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  z-index: 50;
  max-height: 70vh;
  overflow-y: auto;
}
.bar-compact {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;
}
.bar-compact:hover {
  background: rgba(255,165,0,0.05);
}
.cart-icon {
  font-size: 20px;
}
.cart-text {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}
.expand-arrow {
  font-size: 18px;
  color: var(--text-dim);
}

.cart-detail {
  padding: 0 20px 20px;
  border-top: 1px solid var(--border);
}
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 12px;
}
.detail-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}
.clear-btn {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text-dim);
  font-size: 13px;
  cursor: pointer;
}
.clear-btn:hover {
  border-color: #e5484d;
  color: #e5484d;
}

.item-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
}
.cart-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 8px;
  background: var(--bg);
}
.item-name {
  flex: 1;
  font-size: 15px;
  color: var(--text);
}
.remove-btn {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  font-size: 16px;
}
.remove-btn:hover {
  background: rgba(0,0,0,0.05);
  color: #e5484d;
}

.note-group {
  margin-bottom: 12px;
}
.note-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text);
}
.note-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 14px;
}
.note-input:focus {
  outline: none;
  border-color: var(--accent);
}

.submit-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.submit-btn:hover:not(:disabled) {
  filter: brightness(1.08);
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
