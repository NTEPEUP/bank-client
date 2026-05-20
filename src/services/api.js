import axios from 'axios'

// Configura la URL base de tu backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

// Interceptor para agregar el token a todas las peticiones
apiClient.interceptors.request.use(
  (config) => {
    // Buscar token primero en sessionStorage, luego en localStorage
    const token = sessionStorage.getItem('token') || localStorage.getItem('token')
    //7//console.log('🔑 Token encontrado:', token ? 'SÍ' : 'NO')

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
      //console.log('✅ Header Authorization agregado')
    } else {
      console.warn('⚠️ No se encontró token en ningún storage')
    }
    return config
  },
  (error) => {
    console.error('❌ Error en interceptor request:', error)
    return Promise.reject(error)
  },
)

// Interceptor para manejar errores de respuesta
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Error de red (backend no disponible)
    if (!error.response) {
      console.error(
        '❌ Backend no disponible. Verifica que esté corriendo en http://localhost:8080',
      )
      return Promise.reject({
        message: 'No se puede conectar al servidor. Verifica que el backend esté corriendo.',
        networkError: true,
      })
    }

    const status = error.response?.status
    const currentPath = window.location.pathname

    // 401: Token expirado o inválido - REDIRIGIR A LOGIN
    if (status === 401) {
      // Solo redirigir si no estamos ya en login
      if (currentPath !== '/login' && currentPath !== '/') {
        console.warn('🔒 Token inválido o expirado')
        // Limpiar ambos storages
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('lastActivityTime')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('lastActivityTime')

        // Mostrar mensaje antes de redirigir
        alert('⚠️ Tu sesión ha expirado. Por favor inicia sesión nuevamente.')
        window.location.href = '/login'
      }
    }

    // 403: Sin permisos - NO REDIRIGIR, dejar que el componente maneje el error
    if (status === 403) {
      console.warn('⚠️ Acceso denegado: no tienes permisos para este recurso')
      // No mostrar alert ni redirigir, simplemente rechazar la promesa
      // El componente individual puede manejar este error como desee
    }

    return Promise.reject(error)
  },
)

// ============= AUTH =============
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },
}
