import client from './client'

// 注册：body { name, email, password }，成功返回 { user, token }
export async function register({ name, email, password }) {
  const res = await client.post('/register', { name, email, password })
  return res.data
}

// 登录：body { email, password }，成功返回 { user, token }
export async function login({ email, password }) {
  const res = await client.post('/login', { email, password })
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
