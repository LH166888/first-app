import client from './client'

// 注册：body { name, account, password, invite_code }，成功返回 { user, token }
export async function register({ name, account, password, invite_code }) {
  const res = await client.post('/register', { name, account, password, invite_code })
  return res.data
}

// 登录：body { account, password }，成功返回 { user, token }
export async function login({ account, password }) {
  const res = await client.post('/login', { account, password })
  return res.data
}

// 获取注册邀请码：后端生成 6 位码推送到管理员微信（60 秒有效、同账号 60 秒限一次）
export async function sendInviteCode({ account }) {
  const res = await client.post('/invite-code', { account })
  return res.data
}

// 登出：删除当前 token（需登录）
export async function logout() {
  const res = await client.post('/logout')
  return res.data
}

// 获取当前登录用户（用于用已存 token 恢复会话）
export async function fetchUser() {
  const res = await client.get('/user')
  return res.data
}

// 修改昵称（需登录），成功返回 { user }
export async function updateName({ name }) {
  const res = await client.patch('/user/name', { name })
  return res.data
}

// 修改密码（需登录）：校验旧密码，成功后后端吊销全部 token，需重新登录
export async function updatePassword({ current_password, password }) {
  const res = await client.patch('/user/password', { current_password, password })
  return res.data
}
