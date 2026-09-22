<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { store } from '../../shared/store'
import { updateName, updatePassword } from '../../shared/api/auth'

const router = useRouter()

// ---- 修改昵称 ----
const nameForm = reactive({ name: store.user?.name || '' })
const nameErrors = ref({})
const nameMsg = ref('')
const savingName = ref(false)

const nameChanged = computed(
  () => nameForm.name.trim() && nameForm.name.trim() !== store.user?.name
)

function nameFieldError() {
  const e = nameErrors.value.name
  return Array.isArray(e) ? e[0] : e || ''
}

async function saveName() {
  if (savingName.value || !nameChanged.value) return
  savingName.value = true
  nameErrors.value = {}
  nameMsg.value = ''
  try {
    const { user } = await updateName({ name: nameForm.name.trim() })
    store.setUser(user)
    nameMsg.value = '昵称已更新'
  } catch (e) {
    const res = e?.response
    if (res?.status === 422 && res.data?.errors) nameErrors.value = res.data.errors
    else nameMsg.value = res?.data?.message || '更新失败，请稍后重试'
  } finally {
    savingName.value = false
  }
}

// ---- 修改密码（校验旧密码，成功后强制重新登录）----
const pwdForm = reactive({ current_password: '', password: '', confirm: '' })
const pwdErrors = ref({})
const pwdGeneralError = ref('')
const savingPwd = ref(false)

function pwdFieldError(name) {
  const e = pwdErrors.value[name]
  return Array.isArray(e) ? e[0] : e || ''
}

async function savePassword() {
  if (savingPwd.value) return
  pwdErrors.value = {}
  pwdGeneralError.value = ''

  if (pwdForm.password.length < 6) {
    pwdErrors.value = { password: ['新密码至少 6 位'] }
    return
  }
  if (pwdForm.password !== pwdForm.confirm) {
    pwdErrors.value = { confirm: ['两次输入的新密码不一致'] }
    return
  }

  savingPwd.value = true
  try {
    await updatePassword({
      current_password: pwdForm.current_password,
      password: pwdForm.password,
    })
    // 后端已吊销全部 token：清理本地登录态，回首页并唤起登录弹窗
    store._clearAuth()
    router.push({ name: 'home' })
    window.dispatchEvent(new CustomEvent('auth:need-login'))
  } catch (e) {
    const res = e?.response
    if (res?.status === 422 && res.data?.errors) pwdErrors.value = res.data.errors
    else pwdGeneralError.value = res?.data?.message || '修改失败，请稍后重试'
  } finally {
    savingPwd.value = false
  }
}
</script>

<template>
  <div class="container profile-page">
    <h1 class="title">个人信息</h1>

    <!-- 基本信息 -->
    <section class="card block">
      <h2 class="block-title">基本信息</h2>
      <div class="info-row">
        <span class="info-lbl">账号</span>
        <span class="info-val">{{ store.user?.account }}</span>
      </div>
      <div class="info-row">
        <span class="info-lbl">昵称</span>
        <span class="info-val">{{ store.user?.name }}</span>
      </div>
    </section>

    <!-- 修改昵称 -->
    <section class="card block">
      <h2 class="block-title">修改昵称</h2>
      <label class="field">
        <span class="lbl">新昵称</span>
        <input v-model="nameForm.name" type="text" placeholder="输入新昵称" maxlength="255" />
        <span v-if="nameFieldError()" class="err">{{ nameFieldError() }}</span>
      </label>
      <div class="row-end">
        <span v-if="nameMsg" class="ok">{{ nameMsg }}</span>
        <button class="btn primary" :disabled="savingName || !nameChanged" @click="saveName">
          {{ savingName ? '保存中…' : '保存昵称' }}
        </button>
      </div>
    </section>

    <!-- 修改密码 -->
    <section class="card block">
      <h2 class="block-title">修改密码</h2>
      <label class="field">
        <span class="lbl">当前密码</span>
        <input
          v-model="pwdForm.current_password"
          type="password"
          placeholder="输入当前密码"
          autocomplete="current-password"
        />
        <span v-if="pwdFieldError('current_password')" class="err">
          {{ pwdFieldError('current_password') }}
        </span>
      </label>
      <label class="field">
        <span class="lbl">新密码</span>
        <input
          v-model="pwdForm.password"
          type="password"
          placeholder="至少 6 位"
          autocomplete="new-password"
        />
        <span v-if="pwdFieldError('password')" class="err">{{ pwdFieldError('password') }}</span>
      </label>
      <label class="field">
        <span class="lbl">确认新密码</span>
        <input
          v-model="pwdForm.confirm"
          type="password"
          placeholder="再次输入新密码"
          autocomplete="new-password"
        />
        <span v-if="pwdFieldError('confirm')" class="err">{{ pwdFieldError('confirm') }}</span>
      </label>
      <p class="hint">修改成功后需要用新密码重新登录。</p>
      <p v-if="pwdGeneralError" class="general-err">{{ pwdGeneralError }}</p>
      <div class="row-end">
        <button class="btn primary" :disabled="savingPwd" @click="savePassword">
          {{ savingPwd ? '提交中…' : '修改密码' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 560px;
  padding-top: 28px;
  padding-bottom: 60px;
}
.title {
  font-size: 24px;
  font-weight: 800;
  margin: 0 0 20px;
}
.block {
  padding: 20px 22px;
  margin-bottom: 18px;
}
.block-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px;
}
.info-row {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.info-row:last-child {
  border-bottom: none;
}
.info-lbl {
  flex: 0 0 64px;
  color: var(--text-dim);
  font-size: 14px;
}
.info-val {
  color: var(--text);
  font-size: 14px;
  word-break: break-all;
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
.hint {
  color: var(--text-mute);
  font-size: 12px;
  margin: 0 0 12px;
}
.general-err {
  color: var(--danger);
  font-size: 13px;
  margin: 0 0 12px;
}
.row-end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
.ok {
  color: var(--accent);
  font-size: 13px;
}
.btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
