<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDishDetail, createDish, updateDish } from '../api/dish'
import ImageUploader from '../components/ImageUploader.vue'
import IngredientInput from '../components/IngredientInput.vue'
import StepInput from '../components/StepInput.vue'

const route = useRoute()
const router = useRouter()

// ?id 存在 = 编辑模式，复用本页面
const editId = computed(() => route.query.id || null)
const isEdit = computed(() => !!editId.value)

const name = ref('')
const imageKey = ref(null)
const ingredients = ref([{ name: '', amount: '' }])
const steps = ref([{ description: '' }])

const loading = ref(false)
const saving = ref(false)
const error = ref(null)

onMounted(async () => {
  if (!editId.value) return
  loading.value = true
  try {
    const { dish } = await getDishDetail(editId.value)
    if (!dish.is_owner) {
      error.value = '无权编辑此菜品'
      return
    }
    name.value = dish.name
    imageKey.value = dish.image_key
    ingredients.value = dish.ingredients.length
      ? dish.ingredients.map((i) => ({ name: i.name, amount: i.amount }))
      : [{ name: '', amount: '' }]
    steps.value = dish.steps.length
      ? dish.steps.map((s) => ({ description: s.description }))
      : [{ description: '' }]
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  error.value = null

  // 校验
  if (!name.value.trim()) {
    error.value = '请填写菜名'
    return
  }
  const validIngredients = ingredients.value.filter((i) => i.name.trim())
  const validSteps = steps.value.filter((s) => s.description.trim())
  if (!validIngredients.length) {
    error.value = '至少填写一个配料'
    return
  }
  if (!validSteps.length) {
    error.value = '至少填写一个步骤'
    return
  }

  saving.value = true
  try {
    const payload = {
      name: name.value.trim(),
      image_key: imageKey.value,
      ingredients: validIngredients,
      steps: validSteps,
    }
    let result
    if (isEdit.value) {
      result = await updateDish(editId.value, payload)
    } else {
      result = await createDish(payload)
    }
    router.push({ name: 'menu-detail', params: { id: result.dish.id } })
  } catch (e) {
    error.value = e.message || '保存失败'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="container menu-create">
    <div class="header">
      <h1 class="page-title">{{ isEdit ? '编辑菜品' : '添加菜品' }}</h1>
    </div>

    <div v-if="loading" class="loading">加载中…</div>

    <form v-else class="form" @submit.prevent="handleSave">
      <div class="field-group">
        <label class="label">菜名</label>
        <input v-model="name" type="text" class="text-input" placeholder="给这道菜起个名字" />
      </div>

      <div class="field-group">
        <label class="label">菜品图片<span class="optional">（可选）</span></label>
        <ImageUploader v-model="imageKey" />
      </div>

      <div class="field-group">
        <label class="label">配料</label>
        <IngredientInput v-model="ingredients" />
      </div>

      <div class="field-group">
        <label class="label">做法步骤</label>
        <StepInput v-model="steps" />
      </div>

      <div v-if="error" class="error">{{ error }}</div>

      <div class="actions">
        <router-link :to="{ name: 'menu-list' }" class="btn ghost">取消</router-link>
        <button type="submit" class="btn primary" :disabled="saving">
          {{ saving ? '保存中…' : (isEdit ? '保存修改' : '添加菜品') }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.menu-create {
  padding: 28px 20px 60px;
  max-width: 720px;
}
.header {
  margin-bottom: 24px;
}
.page-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0;
}
.loading {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-dim);
}
.form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}
.optional {
  font-weight: 400;
  color: var(--text-dim);
  font-size: 13px;
}
.text-input {
  padding: 11px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
  color: var(--text);
  font-size: 15px;
}
.text-input:focus {
  outline: none;
  border-color: var(--accent);
}
.error {
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(229,72,77,0.1);
  color: #e5484d;
  font-size: 14px;
}
.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}
.btn {
  padding: 11px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  border: 1px solid transparent;
  transition: all 0.15s;
}
.btn.primary {
  background: var(--accent);
  color: #fff;
}
.btn.primary:hover:not(:disabled) {
  filter: brightness(1.08);
}
.btn.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn.ghost {
  background: transparent;
  border-color: var(--border);
  color: var(--text-dim);
}
.btn.ghost:hover {
  border-color: var(--text-dim);
  color: var(--text);
}

@media (max-width: 720px) {
  .actions {
    flex-direction: column-reverse;
  }
  .btn {
    text-align: center;
  }
}
</style>
