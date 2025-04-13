import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token automatisch setzen
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

// Optionen aus Django laden
export const fetchOptions = async () => {
  const response = await api.get('/options/')
  return response.data
}

// Einzelne Option nach Schlüssel
export const fetchOptionByKey = async (key) => {
  const response = await api.get(`/options/?key=${key}`)
  return response.data
}

export default api
