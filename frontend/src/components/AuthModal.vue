<script setup>
import { ref, reactive } from 'vue'
import { store } from '../store'

const emit = defineEmits(['close'])

const mode = ref('login') // 'login' | 'register'
const form = reactive({ name: '', email: '', password: '' })
const errors = ref({}) // 后端按字段返回的校验错误 { email: ['...'], ... }
const generalError = ref('')
const submitting = ref(false)

function switchMode(m) {
  if (mode.value === m) return
  mode.value = m
  errors.value = {}
  generalError.value = ''
}

function fieldError(name) {
  const e = errors.value[name]
  return Array.isArray(e) ? e[0] : e || ''
}

async function submit() {
  if (submitting.value) return
  submitting.value = true
  errors.value = {}
  generalError.value = ''
  try {
    if (mode.value === 'login') {
      await store.login({ email: form.email.trim(), password: form.password })
    } else {
      await store.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
    }
    emit('close')
  } catch (e) {
    const res = e?.response
    if (res?.status === 422 && res.data?.errors) {
      errors.value = res.data.errors
    } else if (res?.data?.message) {
      generalError.value = res.data.message
    } else {
      generalError.value = '网络错误，请稍后重试'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal card">
      <div class="tabs">
        <button :class="{ on: mode === 'login' }" @click="switchMode('login')">登录</button>
        <button :class="{ on: mode === 'register' }" @click="switchMode('register')">注册</button>
      </div>

      <form @submit.prevent="submit">
        <label v-if="mode === 'register'" class="field">
          <span class="lbl">昵称</span>
          <input v-model="form.name" type="text" placeholder="你的昵称" autocomplete="nickname" />
          <span v-if="fieldError('name')" class="err">{{ fieldError('name') }}</span>
        </label>

        <label class="field">
          <span class="lbl">邮箱</span>
          <input
            v-model="form.email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
          />
          <span v-if="fieldError('email')" class="err">{{ fieldError('email') }}</span>
        </label>

        <label class="field">
          <span class="lbl">密码</span>
          <input
            v-model="form.password"
            type="password"
            placeholder="至少 8 位"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          />
          <span v-if="fieldError('password')" class="err">{{ fieldError('password') }}</span>
        </label>

        <p v-if="generalError" class="general-err">{{ generalError }}</p>

        <div class="modal-actions">
          <button type="button" class="btn ghost" @click="emit('close')">取消</button>
          <button type="submit" class="btn primary" :disabled="submitting">
            {{ submitting ? '提交中…' : mode === 'login' ? '登录' : '注册并登录' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal {
  width: 100%;
  max-width: 380px;
  padding: 24px;
}
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
.tabs button {
  flex: 1;
  background: var(--panel-2);
  border: 1px solid var(--border);
  color: var(--text-dim);
  padding: 9px 0;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  transition: all 0.15s;
}
.tabs button.on {
  background: linear-gradient(120deg, var(--accent), var(--accent-2));
  color: #05121a;
  border-color: transparent;
}
.field {
  display: block;
  margin-bottom: 14px;
}
.lbl {
  display: block;
  font-size: 13px;
  color: var(--text-dim);
  margin-bottom: 6px;
}
.field input {
  width: 100%;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  color: var(--text);
  outline: none;
}
.field input:focus {
  border-color: var(--accent);
}
.err {
  display: block;
  color: var(--danger);
  font-size: 12px;
  margin-top: 5px;
}
.general-err {
  color: var(--danger);
  font-size: 13px;
  margin: 0 0 14px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
