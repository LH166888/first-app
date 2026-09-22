<script setup>
const props = defineProps({
  modelValue: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue'])

function updateItem(index, value) {
  const list = props.modelValue.map((it, i) =>
    i === index ? { ...it, description: value } : it
  )
  emit('update:modelValue', list)
}

function addItem() {
  emit('update:modelValue', [...props.modelValue, { description: '' }])
}

function removeItem(index) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}
</script>

<template>
  <div class="step-input">
    <div v-for="(item, index) in modelValue" :key="index" class="row">
      <span class="step-num">{{ index + 1 }}</span>
      <textarea
        class="field"
        :value="item.description"
        placeholder="这一步怎么做？"
        rows="2"
        @input="updateItem(index, $event.target.value)"
      ></textarea>
      <button type="button" class="remove" title="删除" @click="removeItem(index)">
        ✕
      </button>
    </div>
    <button type="button" class="add" @click="addItem">+ 添加步骤</button>
  </div>
</template>

<style scoped>
.step-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.step-num {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}
.field {
  flex: 1;
  min-width: 0;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
}
.field:focus {
  outline: none;
  border-color: var(--accent);
}
.remove {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin-top: 4px;
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
