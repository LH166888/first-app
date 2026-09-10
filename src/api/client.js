import axios from 'axios'

// axios 实例：baseURL 走环境变量（开发 = /api 经 vite proxy 到本地后端；生产 = 真实域名）
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { Accept: 'application/json' },
  timeout: 15000,
})

// token 与前端登录态共用一个 localStorage key，store.js 也读写它
export const TOKEN_KEY = 'chebang_token'

// 请求拦截器：自动带上 Sanctum token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一错误处理。401 说明 token 失效，清掉本地登录态。
client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      // 通知 store 清理用户态（store 里监听此事件，避免此处直接 import store 造成循环依赖）
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export default client
