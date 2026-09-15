import client from './client'

// 身份证识别（需登录）。multipart 上传图片，后端调百度 OCR 返回摆正裁剪图 + 结构化字段。
// side: 'front'(默认,人像面) | 'back'(国徽面)。
// 跨境调用较慢，单独放宽超时到 30s（覆盖 client 默认 15s）。
// 返回后端扁平结构：{ code, msg, data } —— data 含 image_status/fields/card_image/photo/risk。
export async function recognizeIdCard(file, side = 'front') {
  const form = new FormData()
  form.append('image', file)
  form.append('side', side)
  const res = await client.post('/tools/idcard/recognize', form, {
    timeout: 30000,
  })
  return res.data
}
