<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue'
import { store } from '../store'
import { sendInviteCode } from '../api/auth'

const emit = defineEmits(['close'])

const mode = ref('login') // 'login' | 'register'
const form = reactive({ name: '', account: '', password: '', invite_code: '' })
const errors = ref({}) // 后端按字段返回的校验错误 { account: ['...'], ... }
const generalError = ref('')
const submitting = ref(false)

// 账号格式：字母/数字/@/.，长度 3-18，无空格、无中文、无下划线等特殊字符
const ACCOUNT_RE = /^[A-Za-z0-9@.]{3,18}$/
const accountValid = computed(() => ACCOUNT_RE.test(form.account.trim()))

// ---- 邀请码倒计时（注册用）----
const countdown = ref(0)
const sendingCode = ref(false)
let timer = null

function startCountdown(sec = 60) {
  countdown.value = sec
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

async function requestCode() {
  if (sendingCode.value || countdown.value > 0) return
  // 先做本地账号格式校验，避免无效账号也触发发码冷却
  if (!accountValid.value) {
    errors.value = { account: ['账号需 3-18 位，仅限字母、数字、@、.'] }
    return
  }
  sendingCode.value = true
  errors.value = {}
  generalError.value = ''
  try {
    await sendInviteCode({ account: form.account.trim() })
    startCountdown(60)
  } catch (e) {
    const res = e?.response
    if (res?.status === 422 && res.data?.errors) {
      errors.value = res.data.errors
    } else if (res?.data?.message) {
      generalError.value = res.data.message
    } else {
      generalError.value = '发送失败，请稍后重试'
    }
  } finally {
    sendingCode.value = false
  }
}

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
  // 注册前本地校验账号格式
  if (mode.value === 'register' && !accountValid.value) {
    errors.value = { account: ['账号需 3-18 位，仅限字母、数字、@、.'] }
    return
  }
  submitting.value = true
  errors.value = {}
  generalError.value = ''
  try {
    if (mode.value === 'login') {
      await store.login({ account: form.account.trim(), password: form.password })
    } else {
      await store.register({
        name: form.name.trim(),
        account: form.account.trim(),
        password: form.password,
        invite_code: form.invite_code.trim(),
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
          <span class="lbl">账号</span>
          <input
            v-model="form.account"
            type="text"
            placeholder="3-18 位，字母、数字、@、."
            autocomplete="username"
          />
          <span v-if="fieldError('account')" class="err">{{ fieldError('account') }}</span>
        </label>

        <label class="field">
          <span class="lbl">密码</span>
          <input
            v-model="form.password"
            type="password"
            placeholder="至少 6 位"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          />
          <span v-if="fieldError('password')" class="err">{{ fieldError('password') }}</span>
        </label>

        <label v-if="mode === 'register'" class="field">
          <span class="lbl">邀请码</span>
          <div class="code-row">
            <input
              v-model="form.invite_code"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="6 位邀请码"
              autocomplete="off"
            />
            <button
              type="button"
              class="btn code-btn"
              :disabled="sendingCode || countdown > 0 || !accountValid"
              @click="requestCode"
            >
              {{ countdown > 0 ? `${countdown}s` : sendingCode ? '发送中…' : '获取邀请码' }}
            </button>
          </div>
          <span v-if="fieldError('invite_code')" class="err">{{ fieldError('invite_code') }}</span>
          <span class="hint">点击获取后，邀请码将推送到管理员微信，请向管理员索取（60 秒有效）</span>
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
/* 覆盖浏览器自动填充的白底：用 inset 阴影撑深色背景，固定文字色 */
.field input:-webkit-autofill,
.field input:-webkit-autofill:hover,
.field input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--text);
  box-shadow: 0 0 0 1000px var(--panel-2) inset;
  caret-color: var(--text);
  transition: background-color 5000s ease-in-out 0s;
}
.code-row {
  display: flex;
  gap: 8px;
}
.code-row input {
  flex: 1;
  min-width: 0;
}
.code-btn {
  flex: 0 0 auto;
  white-space: nowrap;
  padding: 0 14px;
  font-size: 13px;
}
.code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.hint {
  display: block;
  color: var(--text-mute);
  font-size: 12px;
  margin-top: 5px;
  line-height: 1.4;
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
