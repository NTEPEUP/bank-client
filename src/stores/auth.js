import { computed, ref } from 'vue'
import { login as loginRequest } from '../services/authService'

const STORAGE_KEY = 'bank-client-auth'
const TOKEN_KEY = 'token'
const USER_KEY = 'user'

const session = ref(readSession())

function readSession() {
  if (typeof window === 'undefined') {
    return null
  }

  const rawSession = window.sessionStorage.getItem(STORAGE_KEY)

  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(rawSession)
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function persistSession(nextSession) {
  session.value = nextSession

  if (typeof window === 'undefined') {
    return
  }

  if (nextSession) {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
    window.sessionStorage.setItem(TOKEN_KEY, nextSession.token)
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(nextSession))
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(USER_KEY)
    return
  }

  window.sessionStorage.removeItem(TOKEN_KEY)
  window.sessionStorage.removeItem(USER_KEY)
  window.sessionStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

function isClienteRole(roleName) {
  return String(roleName || '').trim().toUpperCase() === 'CLIENTE'
}

export function useAuthStore() {
  const isAuthenticated = computed(() => Boolean(session.value?.token))
  const currentUser = computed(() => session.value)

  async function login(credentials) {
    const payload = await loginRequest(credentials)
    const roleName = payload.roleName || payload.role || payload.rol || ''

    if (!isClienteRole(roleName)) {
      persistSession(null)
      throw new Error('Solo los clientes pueden ingresar al portal.')
    }

    const nextSession = {
      token: payload.token,
      roleName,
      nombres: payload.nombres,
      apellidos: payload.apellidos,
      idCliente: payload.idCliente ?? payload.clienteId ?? payload.id ?? null,
      username: credentials.username,
    }

    persistSession(nextSession)

    return nextSession
  }

  function logout() {
    persistSession(null)
  }

  return {
    currentUser,
    isAuthenticated,
    login,
    logout,
  }
}
