// utils/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',  // ⚠️ Proxy wird über Vite geregelt
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  console.log('🔐 Auth-Header:', config.headers.Authorization || 'Kein Token')
  return config
})

export const login = async (username, password) => {
  try {
    const response = await api.post('/token/', { username, password })
    const { token } = response.data
    localStorage.setItem('authToken', token)
    return true
  } catch (err) {
    console.error('❌ Login fehlgeschlagen:', err.response?.data || err.message)
    return false
  }
}

export const logout = async () => {
  try {
    await api.post('/logout/')
  } catch (e) {
    // ignorieren
  }
  localStorage.removeItem('authToken')
}

export default api
