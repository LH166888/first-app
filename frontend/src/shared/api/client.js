import axios from 'axios'

// axios 实例：baseURL 走环境变量（开发 = /api 经 vite proxy 到本地后端；生产 = 真实域名）
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { Accept: 'application/json' },
  timeout: 15000,
})

// token 与前端登录态共用一个 localStorage key，store.js 也读写它。
// 品牌从「车榜」升级为「AI 无限」平台，key 随之改名；旧 key 在启动时自动迁移。
const OLD_TOKEN_KEY = 'chebang_token'
const NEW_TOKEN_KEY = 'ai_infinity_token'
export const TOKEN_KEY = NEW_TOKEN_KEY

// 应用启动时执行一次：把旧 key 的 token 平滑迁移到新 key，用户无感知、不掉线。
// 放在此处（import 之后、拦截器注册之前）能保证 store 初始化和请求拦截器都读到新 key。
function migrateToken() {
  const newToken = localStorage.getItem(NEW_TOKEN_KEY)
  if (!newToken) {
    const oldToken = localStorage.getItem(OLD_TOKEN_KEY)
    if (oldToken) {
      localStorage.setItem(NEW_TOKEN_KEY, oldToken)
      localStorage.removeItem(OLD_TOKEN_KEY)
    }
  }
}
migrateToken()

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
