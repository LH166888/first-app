// 图片上传 API：获取 R2 预签名 URL + 浏览器直传到 R2。
// 流程：前端 POST /menu/upload-url（带 Sanctum token）拿签名 URL
//   → 浏览器 PUT 文件直传 R2（不带 Sanctum 头，只带签名要求的 Content-Type）。
import client from '../../../shared/api/client'

// 获取预签名上传 URL -> { upload_url, headers, key, public_url }
export async function getUploadUrl(filename, contentType) {
  const res = await client.post('/menu/upload-url', {
    filename,
    content_type: contentType,
  })
  return res.data
}

// 直传文件到 R2（使用预签名 URL）。
// 用原生 fetch 而非 client：避免 axios 拦截器带上 Authorization 头，
// 那会破坏 R2 的签名校验。
export async function uploadToR2(file, uploadUrl, headers) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers,
    body: file,
  })
  if (!res.ok) {
    throw new Error(`上传失败: ${res.status}`)
  }
  return { success: true }
}
