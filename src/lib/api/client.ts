import axios from 'axios'
import Cookies from 'js-cookie'
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../constants'

/**
 * 創建一個 Axios 實例用於 API 請求
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 請求攔截器
 * 在每個請求前自動添加認證 Token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get(AUTH_TOKEN_KEY)
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 響應攔截器
 * 處理常見錯誤情況，如 Token 過期
 */
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // 處理 401 未授權錯誤 (可能是 Token 過期)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // 嘗試刷新 Token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`)
        const { token } = response.data
        
        // 保存新的 Token
        Cookies.set(AUTH_TOKEN_KEY, token)
        
        // 使用新的 Token 重試原始請求
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // 刷新 Token 失敗，清除認證資訊
        Cookies.remove(AUTH_TOKEN_KEY)
        
        // 如果在瀏覽器環境且不是請求刷新 Token 的請求
        if (typeof window !== 'undefined' && !originalRequest.url.includes('refresh-token')) {
          // 重定向到登入頁面
          window.location.href = '/auth/login'
        }
        
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
