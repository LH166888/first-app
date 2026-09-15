<script setup>
import { ref, computed } from 'vue'
import { recognizeIdCard } from '../api/idcard'

// ---- 前端预校验规则（与后端 image/mimes/max:4096 对齐）----
const ACCEPT = ['image/jpeg', 'image/png']
const MAX_BYTES = 4 * 1024 * 1024 // 4MB

const side = ref('front') // front=人像面 back=国徽面
const file = ref(null) // 当前选中的原图 File
const previewUrl = ref('') // 原图本地预览（ObjectURL）
const loading = ref(false)
const error = ref('')
const result = ref(null) // 后端 data：{ image_status, fields, card_image, photo, risk }
const dragOver = ref(false)
const fileInput = ref(null)

// 正面/背面各自要展示的字段（按后端 normalize 的键）
const FIELD_LABELS = {
  name: '姓名',
  sex: '性别',
  nation: '民族',
  birth: '出生',
  address: '住址',
  idno: '公民身份号码',
  authority: '签发机关',
  issue_date: '签发日期',
  valid_date: '失效日期',
}
const FRONT_KEYS = ['name', 'sex', 'nation', 'birth', 'address', 'idno']
const BACK_KEYS = ['authority', 'issue_date', 'valid_date']

// 只渲染有值的字段行
const fieldRows = computed(() => {
  if (!result.value) return []
  const fields = result.value.fields || {}
  const keys = side.value === 'back' ? BACK_KEYS : FRONT_KEYS
  return keys
    .filter((k) => fields[k])
    .map((k) => ({ key: k, label: FIELD_LABELS[k], value: fields[k] }))
})

// 风险类型 → 中文提示（normal/null 不提示）
const RISK_LABELS = {
  copy: '疑似复印件',
  temporary: '疑似临时身份证',
  screen: '疑似翻拍/屏幕拍摄',
  unknown: '风险未知',
}
const riskTip = computed(() => {
  const t = result.value?.risk?.risk_type
  if (!t || t === 'normal') return ''
  return RISK_LABELS[t] || `风险类型：${t}`
})

function resetResult() {
  result.value = null
  error.value = ''
}

// 校验并接收一个文件（点击选择或拖拽共用）
function acceptFile(f) {
  if (!f) return
  if (!ACCEPT.includes(f.type)) {
    error.value = '仅支持 JPG / PNG 格式的图片'
    return
  }
  if (f.size > MAX_BYTES) {
    error.value = '图片不能超过 4MB，请压缩后重试'
    return
  }
  resetResult()
  file.value = f
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(f)
}

function onPick(e) {
  acceptFile(e.target.files?.[0])
  e.target.value = '' // 允许再次选择同一文件
}

function onDrop(e) {
  dragOver.value = false
  acceptFile(e.dataTransfer.files?.[0])
}

async function submit() {
  if (!file.value || loading.value) return
  loading.value = true
  error.value = ''
  result.value = null
  try {
    const res = await recognizeIdCard(file.value, side.value)
    result.value = res.data
  } catch (e) {
    error.value = pickError(e)
  } finally {
    loading.value = false
  }
}

// 后端错误统一取友好文案：优先 msg（4001/5001），再表单校验，再兜底
function pickError(e) {
  const d = e.response?.data
  if (d?.msg) return d.msg
  if (d?.errors) return Object.values(d.errors).flat()[0]
  if (d?.message) return d.message
  if (e.code === 'ECONNABORTED') return '识别超时，请检查网络后重试'
  return '识别失败，请稍后重试'
}

// 下载摆正裁剪后的图片（data URI → a[download]）
function downloadCard() {
  const uri = result.value?.card_image
  if (!uri) return
  const a = document.createElement('a')
  a.href = uri
  a.download = `idcard-${side.value}-corrected.jpg`
  document.body.appendChild(a)
  a.click()
  a.remove()
}
</script>

<template>
  <div class="container page">
    <h1>身份证识别</h1>
    <p class="lead">
      上传身份证照片，自动摆正、裁剪并识别文字。支持轻微倾斜与带背景的照片。
    </p>

    <!-- 正反面切换 -->
    <div class="side-switch">
      <button
        class="side-btn"
        :class="{ on: side === 'front' }"
        @click="side = 'front'"
      >
        人像面（正面）
      </button>
      <button
        class="side-btn"
        :class="{ on: side === 'back' }"
        @click="side = 'back'"
      >
        国徽面（背面）
      </button>
    </div>

    <!-- 上传区：点击 / 拖拽 -->
    <div
      class="dropzone card"
      :class="{ over: dragOver, has: previewUrl }"
      @click="fileInput.click()"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png"
        hidden
        @change="onPick"
      />
      <template v-if="previewUrl">
        <img :src="previewUrl" class="preview" alt="原图预览" />
        <div class="dz-hint">点击或拖拽可重新选择</div>
      </template>
      <template v-else>
        <div class="dz-icon">🪪</div>
        <div class="dz-title">点击选择，或把图片拖到这里</div>
        <div class="dz-sub">支持 JPG / PNG，≤ 4MB</div>
      </template>
    </div>

    <div class="actions-row">
      <button
        class="btn primary"
        :disabled="!file || loading"
        @click="submit"
      >
        {{ loading ? '识别中…' : '开始识别' }}
      </button>
      <span class="privacy">🔒 图片仅用于本次识别，不会被服务器保存</span>
    </div>

    <div v-if="error" class="alert error">{{ error }}</div>

    <!-- 结果区 -->
    <section v-if="result" class="result">
      <!-- 左：摆正裁剪图 + 下载 -->
      <div class="card result-img">
        <h3>摆正裁剪结果</h3>
        <img
          v-if="result.card_image"
          :src="result.card_image"
          class="card-img"
          alt="摆正裁剪后的身份证"
        />
        <div v-else class="no-img">未返回裁剪图</div>
        <button
          v-if="result.card_image"
          class="btn"
          @click="downloadCard"
        >
          ⬇ 下载摆正后的图片
        </button>
      </div>

      <!-- 右：字段表格 + 风险提示 -->
      <div class="card result-fields">
        <h3>识别信息</h3>
        <div v-if="riskTip" class="alert warn">⚠ {{ riskTip }}</div>
        <table v-if="fieldRows.length" class="fields">
          <tbody>
            <tr v-for="row in fieldRows" :key="row.key">
              <th>{{ row.label }}</th>
              <td>
                {{ row.value }}
                <span
                  v-if="row.key === 'idno' && !result.fields.idno_valid"
                  class="invalid"
                >校验位异常</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="no-img">未识别到文字信息</div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  padding: 24px 20px 60px;
}
h1 {
  font-size: 26px;
  margin: 0 0 8px;
}
.lead {
  color: var(--text-dim);
  margin: 0 0 20px;
  font-size: 14px;
}

/* 正反面切换 */
.side-switch {
  display: inline-flex;
  gap: 6px;
  margin-bottom: 16px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 4px;
}
.side-btn {
  border: none;
  background: transparent;
  color: var(--text-dim);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.15s;
}
.side-btn.on {
  background: var(--panel-2);
  color: var(--accent);
  box-shadow: var(--glow);
}

/* 上传区 */
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  border-style: dashed;
  transition: all 0.15s;
}
.dropzone.over {
  border-color: var(--accent);
  box-shadow: var(--glow);
}
.dropzone.has {
  padding: 16px;
}
.dz-icon {
  font-size: 40px;
}
.dz-title {
  font-size: 15px;
  font-weight: 600;
}
.dz-sub,
.dz-hint {
  font-size: 12px;
  color: var(--text-mute);
}
.preview {
  max-width: 100%;
  max-height: 260px;
  border-radius: 10px;
  border: 1px solid var(--border);
}

.actions-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 18px 0;
  flex-wrap: wrap;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
.privacy {
  font-size: 12px;
  color: var(--text-mute);
}

/* 提示条 */
.alert {
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 14px;
  margin: 12px 0;
}
.alert.error {
  color: var(--danger);
  background: rgba(255, 93, 115, 0.12);
  border: 1px solid rgba(255, 93, 115, 0.3);
}
.alert.warn {
  color: var(--fuel);
  background: rgba(255, 180, 84, 0.12);
  border: 1px solid rgba(255, 180, 84, 0.3);
}

/* 结果区 */
.result {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 8px;
}
.result-img,
.result-fields {
  padding: 20px;
}
.result h3 {
  margin: 0 0 14px;
  font-size: 16px;
}
.card-img {
  max-width: 100%;
  border-radius: 10px;
  border: 1px solid var(--border);
  margin-bottom: 14px;
  display: block;
}
.no-img {
  color: var(--text-mute);
  font-size: 14px;
  padding: 20px 0;
}
.fields {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.fields th {
  text-align: left;
  color: var(--text-dim);
  font-weight: 600;
  width: 96px;
  padding: 8px 12px 8px 0;
  vertical-align: top;
  white-space: nowrap;
}
.fields td {
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  word-break: break-all;
}
.invalid {
  display: inline-block;
  margin-left: 8px;
  font-size: 12px;
  color: var(--danger);
  border: 1px solid rgba(255, 93, 115, 0.4);
  border-radius: 6px;
  padding: 1px 6px;
}

@media (max-width: 720px) {
  .result {
    grid-template-columns: 1fr;
  }
}
</style>
