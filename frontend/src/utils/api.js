// src/utils/api.js
import axios from 'axios'

// 💡 Gemeinsame Axios-Instanz für alle API-Aufrufe
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  //withCredentials: true, // für Cookies (z. B. CSRF, falls nötig)
})

// 🔐 Token bei jeder Anfrage automatisch mitsenden
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  console.log("Sende Request:", config)  // ← Zum Debuggen
  return config
})

// 🟢 Login-Funktion (Token wird gespeichert)
export const login = async (username, password) => {
  try {
    const response = await api.post('/token/', { username, password })
    const { token } = response.data
    localStorage.setItem('authToken', token)
    return true
  } catch (err) {
    console.error('Login fehlgeschlagen', err)
    return false
  }
}

// 🔴 Logout-Funktion (Token entfernen)
export const logout = async () => {
  try {
    await api.post('/logout/') // optional, falls dein Backend etwas tut
  } catch (e) {
    // Ignorieren, wenn Logout-Endpoint nichts zurückgibt
  }
  localStorage.removeItem('authToken')
}

// ✨ Standard-Export für alle API-Aufrufe
export default api
