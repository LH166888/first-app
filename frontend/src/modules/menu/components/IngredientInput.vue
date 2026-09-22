<script setup>
import { emojiForIngredient } from '../data/ingredientEmojis'

const props = defineProps({
  modelValue: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue'])

function updateItem(index, field, value) {
  const list = props.modelValue.map((it, i) =>
    i === index ? { ...it, [field]: value } : it
  )
  emit('update:modelValue', list)
}

function addItem() {
  emit('update:modelValue', [...props.modelValue, { name: '', amount: '' }])
}

function removeItem(index) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}
</script>

<template>
  <div class="ingredient-input">
    <div v-for="(item, index) in modelValue" :key="index" class="row">
      <span class="emoji">{{ emojiForIngredient(item.name) || '🥄' }}</span>
      <input
        class="field name"
        type="text"
        :value="item.name"
        placeholder="配料名，如 鸡蛋"
        @input="updateItem(index, 'name', $event.target.value)"
      />
      <input
        class="field amount"
        type="text"
        :value="item.amount"
        placeholder="用量，如 3个"
        @input="updateItem(index, 'amount', $event.target.value)"
      />
      <button type="button" class="remove" title="删除" @click="removeItem(index)">
        ✕
      </button>
    </div>
    <button type="button" class="add" @click="addItem">+ 添加配料</button>
  </div>
</template>

<style scoped>
.ingredient-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.emoji {
  font-size: 22px;
  width: 30px;
  text-align: center;
  flex-shrink: 0;
}
.field {
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
  color: var(--text);
  font-size: 14px;
}
.field:focus {
  outline: none;
  border-color: var(--accent);
}
.field.name {
  flex: 2;
  min-width: 0;
}
.field.amount {
  flex: 1;
  min-width: 0;
}
.remove {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}
.remove:hover {
  border-color: #e5484d;
  color: #e5484d;
}
.add {
  align-self: flex-start;
  padding: 8px 16px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}
.add:hover {
  border-color: var(--accent);
  background: rgba(255,165,0,0.08);
}
</style>
