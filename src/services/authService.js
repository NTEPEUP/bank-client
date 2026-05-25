import { apiClient } from './api'

export async function login({ username, password }) {
  try {
    const response = await apiClient.post(
      '/auth/login',
      { username, password },
      { skipSessionExpiredAlert: true },
    )

    return response.data
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'No fue posible iniciar sesión'
    throw new Error(message)
  }
}
