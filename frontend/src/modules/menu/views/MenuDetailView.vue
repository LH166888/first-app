<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDishDetail, deleteDish } from '../api/dish'
import { emojiForIngredient } from '../data/ingredientEmojis'

const route = useRoute()
const router = useRouter()

const dish = ref(null)
const loading = ref(true)
const deleting = ref(false)
const error = ref(null)

const imageUrl = computed(() => {
  if (!dish.value?.image_key) return null
  const domain = import.meta.env.VITE_R2_PUBLIC_DOMAIN || ''
  return domain ? `${domain}/${dish.value.image_key}` : null
})

onMounted(async () => {
  try {
    const res = await getDishDetail(route.params.id)
    dish.value = res.dish
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
})

async function handleDelete() {
  if (!confirm('确定要删除这道菜品吗？')) return
  deleting.value = true
  try {
    await deleteDish(dish.value.id)
    router.push({ name: 'menu-list' })
  } catch (e) {
    alert(e.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

function handleEdit() {
  router.push({ name: 'menu-create', query: { id: dish.value.id } })
}
</script>

<template>
  <div class="container menu-detail">
    <div v-if="loading" class="loading">加载中…</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="dish" class="content">
      <div class="hero">
        <div v-if="imageUrl" class="hero-image">
          <img :src="imageUrl" :alt="dish.name" />
        </div>
        <div class="hero-info">
          <h1 class="title">{{ dish.name }}</h1>
          <div class="meta">
            <span class="meta-item">👤 {{ dish.user.name }}</span>
          </div>
        </div>
      </div>

      <div v-if="dish.is_owner" class="actions-bar">
        <button class="btn secondary" @click="handleEdit">编辑</button>
        <button class="btn danger" @click="handleDelete" :disabled="deleting">
          {{ deleting ? '删除中…' : '删除' }}
        </button>
      </div>

      <section class="section">
        <h2 class="section-title">配料</h2>
        <div class="ingredient-list">
          <div v-for="(ing, i) in dish.ingredients" :key="i" class="ingredient-item">
            <span class="ing-emoji">{{ emojiForIngredient(ing.name) || '🥄' }}</span>
            <span class="ing-name">{{ ing.name }}</span>
            <span class="ing-amount">{{ ing.amount }}</span>
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">做法步骤</h2>
        <div class="step-list">
          <div v-for="step in dish.steps" :key="step.step_number" class="step-item">
            <span class="step-num">{{ step.step_number }}</span>
            <p class="step-desc">{{ step.description }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.menu-detail {
  padding: 28px 20px 60px;
  max-width: 800px;
}
.loading,
.error {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-dim);
}
.error {
  color: #e5484d;
}

.hero {
  margin-bottom: 20px;
}
.hero-image {
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  margin-bottom: 16px;
}
.hero-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.title {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 12px;
}
.meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.meta-item {
  font-size: 14px;
  color: var(--text-dim);
}

.actions-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}
.btn {
  padding: 11px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
}
.btn.secondary {
  background: transparent;
  border-color: var(--border);
  color: var(--text);
}
.btn.secondary:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.btn.danger {
  background: transparent;
  border-color: var(--border);
  color: #e5484d;
}
.btn.danger:hover:not(:disabled) {
  border-color: #e5484d;
  background: rgba(229,72,77,0.08);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.section {
  margin-bottom: 32px;
}
.section-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 16px;
  color: var(--text);
}

.ingredient-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ingredient-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
}
.ing-emoji {
  font-size: 22px;
  flex-shrink: 0;
}
.ing-name {
  flex: 2;
  font-size: 15px;
  color: var(--text);
}
.ing-amount {
  flex: 1;
  font-size: 14px;
  color: var(--text-dim);
  text-align: right;
}

.step-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.step-num {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}
.step-desc {
  flex: 1;
  margin: 4px 0 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text);
}

@media (max-width: 720px) {
  .actions-bar {
    flex-direction: column;
  }
  .btn {
    text-align: center;
  }
}
</style>
