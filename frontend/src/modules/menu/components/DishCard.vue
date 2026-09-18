<script setup>
import { computed } from 'vue'

const props = defineProps({
  dish: { type: Object, required: true },
  // 显示作者
  showAuthor: { type: Boolean, default: false },
  // 购物车模式：显示加入/移出按钮
  cartMode: { type: Boolean, default: false },
  // 该菜品是否已在购物车（cartMode 时用）
  inCart: { type: Boolean, default: false },
})

const emit = defineEmits(['add', 'remove'])

// 拼接 R2 图片 URL
const imageUrl = computed(() => {
  if (!props.dish.image_key) return null
  const domain = import.meta.env.VITE_R2_PUBLIC_DOMAIN || ''
  return domain ? `${domain}/${props.dish.image_key}` : null
})

const createdAt = computed(() => {
  const date = new Date(props.dish.created_at)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
})

function onAdd() {
  emit('add', props.dish)
}
function onRemove() {
  emit('remove', props.dish)
}
</script>

<template>
  <div class="dish-card">
    <router-link :to="{ name: 'menu-detail', params: { id: dish.id } }" class="card-link">
      <div class="card-image">
        <img v-if="imageUrl" :src="imageUrl" :alt="dish.name" />
        <div v-else class="placeholder">
          <span class="placeholder-icon">🍽️</span>
        </div>
      </div>
      <div class="card-content">
        <h3 class="card-title">{{ dish.name }}</h3>
        <div v-if="showAuthor && dish.user" class="card-author">
          👤 {{ dish.user.name }}
        </div>
        <div class="card-meta">
          <span class="meta-item">{{ createdAt }}</span>
        </div>
      </div>
    </router-link>

    <!-- 购物车按钮：便捷添加 / 取消 -->
    <div v-if="cartMode" class="cart-actions">
      <button
        v-if="!inCart"
        class="cart-btn add"
        @click.stop="onAdd"
      >＋ 加入</button>
      <button
        v-else
        class="cart-btn remove"
        @click.stop="onRemove"
      >✓ 已加入</button>
    </div>
  </div>
</template>

<style scoped>
.dish-card {
  position: relative;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
}
.dish-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  border-color: var(--accent);
}
.card-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.card-image {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
}
.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder-icon {
  font-size: 48px;
  opacity: 0.3;
}

.card-content {
  padding: 16px;
}
.card-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--text);
}
.card-author {
  font-size: 13px;
  color: var(--text-dim);
  margin: 0 0 8px;
}
.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.meta-item {
  font-size: 13px;
  color: var(--text-dim);
}

.cart-actions {
  padding: 0 16px 16px;
}
.cart-btn {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
}
.cart-btn.add {
  background: var(--accent);
  color: #fff;
}
.cart-btn.add:hover {
  filter: brightness(1.08);
}
.cart-btn.remove {
  background: transparent;
  border-color: var(--accent);
  color: var(--accent);
}
.cart-btn.remove:hover {
  background: rgba(255,165,0,0.08);
}

@media (prefers-reduced-motion: reduce) {
  .dish-card {
    transition: none;
  }
  .dish-card:hover {
    transform: none;
  }
}
</style>
