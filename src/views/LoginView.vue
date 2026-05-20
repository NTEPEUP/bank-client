<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const credentials = reactive({
    username: '',
    password: '',
})

const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

async function handleLogin() {
    error.value = ''
    loading.value = true

    try {
        await auth.login(credentials)
        router.push({ name: 'panel' })
    } catch (err) {
        error.value = err?.message || 'No fue posible iniciar sesión'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="login-shell">
        <section class="login-visual">
            <div class="brand-badge">SHINSEI BANK</div>
            <h1>Accede a tu banca digital</h1>
            <p>
                Ingresa con tus credenciales y entra al panel de prueba para revisar tu perfil 360,
                cuentas y productos.
            </p>
        </section>

        <section class="login-card">
            <div class="login-header">
                <span class="eyebrow">Inicio de sesión</span>
                <h2>Bienvenido</h2>
                <p>Usa tus credenciales para continuar.</p>
            </div>

            <form class="login-form" @submit.prevent="handleLogin">
                <label class="field">
                    <span>Usuario</span>
                    <input v-model="credentials.username" type="text" placeholder="Ingresa tu usuario"
                        autocomplete="username" :disabled="loading" required />
                </label>

                <label class="field">
                    <span>Contraseña</span>
                    <div class="password-row">
                        <input v-model="credentials.password" :type="showPassword ? 'text' : 'password'"
                            placeholder="Ingresa tu contraseña" autocomplete="current-password" :disabled="loading"
                            required />
                        <V-button @click="showPassword = !showPassword">
                            <v-icon>
                                {{ showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}
                            </v-icon>
                        </V-button>
                    </div>
                </label>

                <div v-if="error" class="error-box">{{ error }}</div>

                <button type="submit" class="submit-btn" :disabled="loading">
                    <span v-if="loading" class="spinner"></span>
                    <span v-else>INICIAR SESIÓN</span>
                </button>
            </form>
        </section>
    </div>
</template>

<style scoped>
.login-shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1.1fr minmax(320px, 460px);
    background:
        radial-gradient(circle at top left, rgba(27, 209, 103, 0.18), transparent 28%),
        radial-gradient(circle at bottom right, rgba(6, 57, 108, 0.18), transparent 24%),
        linear-gradient(135deg, #eef4f8 0%, #dfeaf2 100%);
}

.login-visual {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 4rem 5vw;
    color: #08304f;
}

.brand-badge {
    display: inline-flex;
    align-self: flex-start;
    padding: 0.5rem 0.9rem;
    border-radius: 999px;
    background: rgba(6, 57, 108, 0.12);
    color: #06396c;
    font-weight: 800;
    letter-spacing: 0.12em;
    margin-bottom: 1rem;
}

.login-visual h1 {
    font-size: clamp(2.4rem, 4vw, 4.3rem);
    line-height: 1.02;
    margin: 0 0 1rem;
    max-width: 12ch;
}

.login-visual p {
    max-width: 34rem;
    font-size: 1.05rem;
    line-height: 1.6;
    margin: 0;
    color: rgba(8, 48, 79, 0.82);
}

.login-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 2rem;
}

.login-card>* {
    width: 100%;
    max-width: 460px;
    margin-left: auto;
}

.login-header {
    margin-bottom: 1.5rem;
}

.eyebrow {
    display: inline-block;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    color: #1b7f4b;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
}

.login-header h2 {
    margin: 0;
    font-size: 2rem;
    color: #08304f;
}

.login-header p {
    margin: 0.4rem 0 0;
    color: rgba(8, 48, 79, 0.72);
}

.login-form {
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(8, 48, 79, 0.08);
    box-shadow: 0 20px 50px rgba(8, 48, 79, 0.12);
    border-radius: 24px;
    padding: 2rem;
    display: grid;
    gap: 1rem;
}

.field {
    display: grid;
    gap: 0.5rem;
    color: #08304f;
    font-weight: 600;
}

.field input {
    width: 100%;
    border: 1px solid rgba(8, 48, 79, 0.14);
    border-radius: 14px;
    padding: 0.95rem 1rem;
    font-size: 1rem;
    background: white;
    color: #08304f;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.field input:focus {
    outline: none;
    border-color: #1b7f4b;
    box-shadow: 0 0 0 4px rgba(27, 127, 75, 0.12);
    transform: translateY(-1px);
}

.password-row {
    display: flex;
    gap: 0.75rem;
}

.password-row input {
    padding-right: 0.5rem;
}

.toggle-btn,
.submit-btn {
    border: none;
    border-radius: 14px;
    font-weight: 700;
    cursor: pointer;
}

.toggle-btn {
    padding: 0 1rem;
    background: rgba(6, 57, 108, 0.08);
    color: #06396c;
    flex-shrink: 0;
}

.error-box {
    padding: 0.9rem 1rem;
    border-radius: 14px;
    background: rgba(191, 38, 0, 0.08);
    color: #9f2d12;
    border: 1px solid rgba(191, 38, 0, 0.18);
}

.submit-btn {
    margin-top: 0.25rem;
    padding: 1rem 1.2rem;
    background: linear-gradient(135deg, #06396c 0%, #1b7f4b 100%);
    color: white;
    letter-spacing: 0.04em;
    min-height: 52px;
}

.submit-btn:disabled,
.toggle-btn:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@media (max-width: 960px) {
    .login-shell {
        grid-template-columns: 1fr;
    }

    .login-visual {
        padding: 3rem 1.5rem 1rem;
    }

    .login-card {
        padding: 1rem 1.5rem 2rem;
    }

    .login-card>* {
        margin: 0;
    }
}
</style>