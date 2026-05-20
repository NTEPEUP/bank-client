<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const userName = computed(() => {
    const firstName = auth.currentUser.value?.nombres || ''
    const lastName = auth.currentUser.value?.apellidos || ''
    return `${firstName} ${lastName}`.trim() || 'Usuario'
})

function handleLogout() {
    auth.logout()
    router.push({ name: 'login' })
}
</script>

<template>
    <v-app>
        <v-app-bar class="" dark>
            <v-toolbar-title>Panel de Banca Digital</v-toolbar-title>
            <v-spacer></v-spacer>
            <div class="user-info">
                <v-btn text @click="handleLogout">
                    <v-icon left color="error">
                        mdi-logout
                    </v-icon>
                </v-btn>
            </div>
        </v-app-bar>

        <v-main>
            <div class="dashboard-content">
                <h1>Bienvenido al panel de prueba</h1>
                <p>Aquí podrás revisar tu perfil 360, cuentas y productos.</p>
            </div>
        </v-main>
    </v-app>
</template>
