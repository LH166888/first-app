<script setup>
import { ref } from 'vue'
import { getUploadUrl, uploadToR2 } from '../api/upload'

const props = defineProps({
  modelValue: { type: String, default: null }, // image_key
})
const emit = defineEmits(['update:modelValue'])

const uploading = ref(false)
const previewUrl = ref(null)
const error = ref(null)

// 拼接 R2 图片 URL
function getImageUrl(key) {
  if (!key) return null
  const domain = import.meta.env.VITE_R2_PUBLIC_DOMAIN || ''
  return domain ? `${domain}/${key}` : null
}

// 初始化预览（编辑时回显）
if (props.modelValue) {
  previewUrl.value = getImageUrl(props.modelValue)
}

async function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (!file) return

  // 校验文件类型和大小
  if (!file.type.startsWith('image/')) {
    error.value = '请选择图片文件'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = '图片大小不能超过 5MB'
    return
  }

  error.value = null
  uploading.value = true

  try {
    // 1. 获取预签名 URL
    const { upload_url, headers, key, public_url } = await getUploadUrl(file.name, file.type)

    // 2. 直传到 R2
    await uploadToR2(file, upload_url, headers)

    // 3. 更新 image_key 和预览
    emit('update:modelValue', key)
    previewUrl.value = public_url

  } catch (e) {
    console.error('上传失败:', e)
    error.value = e.message || '上传失败，请重试'
  } finally {
    uploading.value = false
  }
}

function clearImage() {
  emit('update:modelValue', null)
  previewUrl.value = null
  error.value = null
}
</script>

<template>
  <div class="image-uploader">
    <div v-if="previewUrl" class="preview">
      <img :src="previewUrl" alt="预览" />
      <button type="button" class="clear" title="删除图片" @click="clearImage">
        ✕
      </button>
    </div>

    <label v-else class="upload-area" :class="{ uploading }">
      <input
        type="file"
        accept="image/*"
        :disabled="uploading"
        @change="handleFileSelect"
      />
      <div class="upload-content">
        <span class="icon">📷</span>
        <span class="text">{{ uploading ? '上传中…' : '点击上传图片' }}</span>
        <span class="hint">支持 JPG / PNG，最大 5MB</span>
      </div>
    </label>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<style scoped>
.image-uploader {
  width: 100%;
}

.preview {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
}
.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.clear {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.clear:hover {
  background: rgba(229,72,77,0.9);
}

.upload-area {
  display: block;
  aspect-ratio: 4 / 3;
  border: 2px dashed var(--border);
  border-radius: 12px;
  background: var(--panel);
  cursor: pointer;
  transition: all 0.2s;
}
.upload-area:hover {
  border-color: var(--accent);
  background: rgba(255,165,0,0.05);
}
.upload-area.uploading {
  cursor: not-allowed;
  opacity: 0.6;
}
.upload-area input {
  display: none;
}
.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
}
.icon {
  font-size: 48px;
  opacity: 0.5;
}
.text {
  font-size: 15px;
  color: var(--text);
  font-weight: 500;
}
.hint {
  font-size: 13px;
  color: var(--text-dim);
}

.error {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(229,72,77,0.1);
  color: #e5484d;
  font-size: 13px;
}
</style>
