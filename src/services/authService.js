const AUTH_LOGIN_URL = 'http://localhost:8080/api/auth/login'

export async function login({ username, password }) {
  const response = await fetch(AUTH_LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = payload?.message || 'No fue posible iniciar sesión'
    throw new Error(message)
  }

  return payload
}
